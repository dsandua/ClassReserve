import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Menu, X, LogOut, User, Calendar, Clock, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../context/NotificationsContext';
import { useRef, useEffect } from 'react';

const TeacherHeader = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const { user, logout } = useAuth();
  const { 
    notifications, 
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
          <Calendar className="h-4 w-4 text-primary-600" />
        </div>;
      case 'reminder':
        return <div className="w-8 h-8 rounded-full bg-warning-100 flex items-center justify-center">
          <Clock className="h-4 w-4 text-warning-600" />
        </div>;
      case 'cancellation':
        return <div className="w-8 h-8 rounded-full bg-error-100 flex items-center justify-center">
          <X className="h-4 w-4 text-error-600" />
        </div>;
      case 'system':
        return <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center">
          <AlertCircle className="h-4 w-4 text-accent-600" />
        </div>;
      default:
        return <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <Bell className="h-4 w-4 text-gray-600" />
        </div>;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 z-10">
      <div className="px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <button 
          className="md:hidden p-2 rounded-md text-gray-700 hover:text-primary-600 focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>

        <div className="md:hidden flex items-center">
          <h1 className="text-lg font-semibold text-gray-900">Panel del Profesor</h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button 
              className="p-1 rounded-full text-gray-500 hover:text-primary-600 focus:outline-none"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <span className="sr-only">Ver notificaciones</span>
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-error-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
                <div className="absolute left-[-30px] mt-4 w-96 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Marcar todas como leídas
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-gray-500">No hay notificaciones</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 hover:bg-gray-50 ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start">
                            {getNotificationIcon(notification.type)}
                            <div className="ml-3 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </p>
                                <div className="flex items-center space-x-3">
                                  <span className="text-xs text-gray-400">
                                    hace {notification.time}
                                  </span>
                                  {!notification.read && (
                                    <div className="w-2 h-2 rounded-full bg-primary-600"></div>
                                  )}
                                  <button
                                    onClick={() => deleteNotification(notification.id)}
                                    className="text-gray-400 hover:text-gray-600"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                              <p className="mt-1 text-sm text-gray-500">
                                {notification.message}
                              </p>
                              {notification.link && (
                                <Link
                                  to={notification.link}
                                  className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center"
                                  onClick={() => {
                                    markAsRead(notification.id);
                                    setShowNotifications(false);
                                  }}
                                >
                                  Ver detalles
                                  <Check className="h-4 w-4 ml-1" />
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-gray-200">
                  <Link
                    to="/teacher/notifications"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium w-full text-center block"
                    onClick={() => setShowNotifications(false)}
                  >
                    Ver todas las notificaciones
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              className="flex items-center space-x-2 focus:outline-none"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-5 w-5 text-gray-500" />
                )}
              </div>
              <span className="hidden sm:inline-block text-sm font-medium text-gray-700">
                {user?.name}
              </span>
            </button>
            
            {isProfileOpen && (
              <div className="absolute left-[-15px] mt-4 w-30 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 animate-fade-in">
                <div className="py-1">
                  <Link
                    to="/teacher/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-right pr-8"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Configuración
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsProfileOpen(false);
                    }}
                    className="w-full text-right block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 pr-8"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {isMenuOpen && (
        <div className="md:hidden border-b border-gray-200 bg-white animate-fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/teacher/dashboard"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/teacher/calendar"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Calendario
            </Link>
            <Link
              to="/teacher/students"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Alumnos
            </Link>
            <Link
              to="/teacher/history"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Historial
            </Link>
            <Link
              to="/teacher/settings"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Configuración
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default TeacherHeader;