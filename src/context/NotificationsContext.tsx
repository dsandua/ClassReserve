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
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Format relative time
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

  // Fetch notifications
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

    // Subscribe to real-time notifications
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
          
          // Show toast for new notification
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

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Error al marcar la notificación como leída');
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );

      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Error al marcar las notificaciones como leídas');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      );

      toast.success('Notificación eliminada');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Error al eliminar la notificación');
    }
  };

  const deleteAllNotifications = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user?.id);

      if (error) throw error;

      setNotifications([]);
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