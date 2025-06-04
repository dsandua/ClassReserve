import { useState } from 'react';
import { Calendar, Clock, X, AlertCircle, Check, Filter, Search, Trash, Bell } from 'lucide-react';
import { useNotifications, NotificationType } from '../../context/NotificationsContext';

const NotificationsPage = () => {
  const { 
    notifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
  } = useNotifications();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'read' | 'unread'>('all');

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'booking':
        return <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
          <Calendar className="h-5 w-5 text-primary-600" />
        </div>;
      case 'reminder':
        return <div className="w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center">
          <Clock className="h-5 w-5 text-warning-600" />
        </div>;
      case 'cancellation':
        return <div className="w-10 h-10 rounded-full bg-error-100 flex items-center justify-center">
          <X className="h-5 w-5 text-error-600" />
        </div>;
      case 'system':
        return <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-accent-600" />
        </div>;
      default:
        return null;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    
    const matchesRead = readFilter === 'all' ||
                       (readFilter === 'read' && notification.read) ||
                       (readFilter === 'unread' && !notification.read);
    
    return matchesSearch && matchesType && matchesRead;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
        <p className="text-gray-600 mt-1">
          Gestiona todas tus notificaciones
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-white rounded-lg shadow-sm p-4 mb-6">
        {/* Buscar */}
        <div className="relative flex items-center w-full">
          <span className="absolute left-3">
            <Search className="h-5 w-5 text-gray-400" />
          </span>
          <input
            type="text"
            className="pl-10 pr-2 h-11 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Buscar notificaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tipo */}
        <div className="flex items-center w-full">
          <Filter className="h-5 w-5 text-gray-400 mr-2" />
          <select
            className="h-11 w-full max-w-[160px] rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm px-2"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as NotificationType | 'all')}
          >
            <option value="all">Todos los tipos</option>
            <option value="booking">Reservas</option>
            <option value="reminder">Recordatorios</option>
            <option value="cancellation">Cancelaciones</option>
            <option value="system">Sistema</option>
          </select>
        </div>

        {/* Estado */}
        <div className="flex items-center w-full">
          <Check className="h-5 w-5 text-gray-400 mr-2" />
          <select
            className="h-11 w-full max-w-[140px] rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm px-2"
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value as 'all' | 'read' | 'unread')}
          >
            <option value="all">Todos los estados</option>
            <option value="read">Leídas</option>
            <option value="unread">No leídas</option>
          </select>
        </div>

        {/* Botones */}
        <div className="flex items-center justify-end w-full space-x-2">
          <button
            onClick={markAllAsRead}
            className="h-11 px-4 rounded-md bg-blue-600 text-white text-sm font-medium flex items-center whitespace-nowrap transition hover:bg-blue-700 disabled:opacity-50"
            disabled={!notifications.some(n => !n.read)}
          >
            <Check className="h-4 w-4 mr-2" />
            Marcar todo como leído
          </button>
          <button
            onClick={deleteAllNotifications}
            className="h-11 px-4 rounded-md bg-red-500 text-white text-sm font-medium flex items-center whitespace-nowrap transition hover:bg-red-600 disabled:opacity-50"
            disabled={notifications.length === 0}
          >
            <Trash className="h-4 w-4 mr-2" />
            Eliminar todo
          </button>
        </div>
      </div>

      {/* Notifications list */}
      <div className="bg-white rounded-lg shadow-sm mt-6">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Bell className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay notificaciones</h3>
            <p className="text-gray-500">
              No se encontraron notificaciones que coincidan con los filtros seleccionados.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50 ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start">
                  {getNotificationIcon(notification.type)}
                  <div className="ml-4 flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-medium text-gray-900">
                          {notification.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {notification.message}
                        </p>
                      </div>
                      <div className="ml-4 flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                          hace {notification.time}
                        </span>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-primary-600 hover:text-primary-700"
                            title="Marcar como leída"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-gray-400 hover:text-error-600"
                          title="Eliminar notificación"
                        >
                          <Trash className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    {notification.link && (
                      <a
                        href={notification.link}
                        className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center"
                        onClick={() => markAsRead(notification.id)}
                      >
                        Ver detalles
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;