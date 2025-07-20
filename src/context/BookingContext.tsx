import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export type NotificationType = 'booking' | 'reminder' | 'cancellation' | 'system';

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
};

type NotificationsContextType = {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  createNotification: (type: NotificationType, title: string, message: string, link?: string) => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  const unreadCount = notifications.filter(n => !n.read).length;

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'ahora';
  };

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedNotifications = data.map(notification => ({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          time: getRelativeTime(new Date(notification.created_at)),
          read: notification.read,
          link: notification.link
        }));

        setNotifications(formattedNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        toast.error('Error al cargar las notificaciones');
      }
    };

    fetchNotifications();

    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, payload => {
        if (payload.eventType === 'INSERT') {
          const newNotification = {
            id: payload.new.id,
            type: payload.new.type as NotificationType,
            title: payload.new.title,
            message: payload.new.message,
            time: getRelativeTime(new Date(payload.new.created_at)),
            read: payload.new.read,
            link: payload.new.link
          };
          setNotifications(prev => [newNotification, ...prev]);
          
          toast(newNotification.title, {
            description: newNotification.message,
            icon: '🔔'
          });
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const createNotification = async (
    type: NotificationType, 
    title: string, 
    message: string, 
    link?: string
  ) => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: user.id,
            type,
            title,
            message,
            link: link || null,
            read: false,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const newNotification = {
        id: data.id,
        type: data.type as NotificationType,
        title: data.title,
        message: data.message,
        time: getRelativeTime(new Date(data.created_at)),
        read: data.read,
        link: data.link
      };

      setNotifications(prev => [newNotification, ...prev]);
    } catch (error) {
      console.error('Error en createNotification:', error);
      toast.error('Error al crear la notificación');
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return;
    }

    try {
      // Optimistically update the UI
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id); // Add user_id check for RLS

      if (error) {
        // Revert optimistic update if the operation fails
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, read: false }
              : notification
          )
        );
        throw error;
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Error al marcar la notificación como leída');
    }
  };

  const markAllAsRead = async () => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return;
    }

    try {
      // Optimistically update the UI
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id);

      if (error) {
        // Revert optimistic update if the operation fails
        throw error;
      }

      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Error al marcar las notificaciones como leídas');
      // Revert optimistic update
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id);
      if (data) {
        setNotifications(data.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          time: getRelativeTime(new Date(n.created_at)),
          read: n.read,
          link: n.link
        })));
      }
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return;
    }

    try {
      // Optimistically update the UI
      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      );

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id); // Add user_id check for RLS

      if (error) {
        // Revert optimistic update if the operation fails
        throw error;
      }

      toast.success('Notificación eliminada');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Error al eliminar la notificación');
      // Revert optimistic update by refetching
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id);
      if (data) {
        setNotifications(data.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          time: getRelativeTime(new Date(n.created_at)),
          read: n.read,
          link: n.link
        })));
      }
    }
  };

  const deleteAllNotifications = async () => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return;
    }

    try {
      // Optimistically update the UI
      const previousNotifications = [...notifications];
      setNotifications([]);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        // Revert optimistic update if the operation fails
        setNotifications(previousNotifications);
        throw error;
      }

      toast.success('Todas las notificaciones eliminadas');
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      toast.error('Error al eliminar las notificaciones');
    }
  };

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      deleteAllNotifications,
      createNotification,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};