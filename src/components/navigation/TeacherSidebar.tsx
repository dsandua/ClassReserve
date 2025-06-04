import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  LayoutDashboard, 
  Users, 
  Clock, 
  Settings,
  Bell,
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationsContext';

const TeacherSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { unreadCount } = useNotifications();
  
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };
  
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };
  
  return (
    <aside 
      className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      } hidden md:flex md:flex-col`}
    >
      <div className="h-16 flex items-center px-4 border-b border-gray-200">
        {!collapsed && (
          <Link to="/teacher/dashboard" className="flex items-center">
            <Calendar className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">ClassReserve</span>
          </Link>
        )}
        {collapsed && (
          <Link to="/teacher/dashboard" className="mx-auto">
            <Calendar className="h-8 w-8 text-primary-600" />
          </Link>
        )}
      </div>
      
      <div className="flex-1 py-6 flex flex-col justify-between">
        <nav className="px-2 space-y-1">
          <Link
            to="/teacher/dashboard"
            className={`flex items-center ${
              collapsed ? 'justify-center' : 'px-2'
            } py-3 text-sm font-medium rounded-md ${
              isActive('/teacher/dashboard')
                ? 'text-primary-700 bg-primary-50'
                : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard className={`${collapsed ? 'h-6 w-6' : 'h-5 w-5 mr-3'}`} />
            {!collapsed && <span>Dashboard</span>}
          </Link>
          
          <Link
            to="/teacher/calendar"
            className={`flex items-center ${
              collapsed ? 'justify-center' : 'px-2'
            } py-3 text-sm font-medium rounded-md ${
              isActive('/teacher/calendar')
                ? 'text-primary-700 bg-primary-50'
                : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
            }`}
          >
            <Calendar className={`${collapsed ? 'h-6 w-6' : 'h-5 w-5 mr-3'}`} />
            {!collapsed && <span>Calendario</span>}
          </Link>
          
          <Link
            to="/teacher/students"
            className={`flex items-center ${
              collapsed ? 'justify-center' : 'px-2'
            } py-3 text-sm font-medium rounded-md ${
              isActive('/teacher/students')
                ? 'text-primary-700 bg-primary-50'
                : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
            }`}
          >
            <Users className={`${collapsed ? 'h-6 w-6' : 'h-5 w-5 mr-3'}`} />
            {!collapsed && <span>Alumnos</span>}
          </Link>
          
          <Link
            to="/teacher/history"
            className={`flex items-center ${
              collapsed ? 'justify-center' : 'px-2'
            } py-3 text-sm font-medium rounded-md ${
              isActive('/teacher/history')
                ? 'text-primary-700 bg-primary-50'
                : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
            }`}
          >
            <Clock className={`${collapsed ? 'h-6 w-6' : 'h-5 w-5 mr-3'}`} />
            {!collapsed && <span>Historial</span>}
          </Link>

          <Link
            to="/teacher/notifications"
            className={`flex items-center ${
              collapsed ? 'justify-center' : 'px-2'
            } py-3 text-sm font-medium rounded-md ${
              isActive('/teacher/notifications')
                ? 'text-primary-700 bg-primary-50'
                : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
            }`}
          >
            <div className="relative">
              <Bell className={`${collapsed ? 'h-6 w-6' : 'h-5 w-5 mr-3'}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-error-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            {!collapsed && <span>Notificaciones</span>}
          </Link>
          
          <Link
            to="/teacher/settings"
            className={`flex items-center ${
              collapsed ? 'justify-center' : 'px-2'
            } py-3 text-sm font-medium rounded-md ${
              isActive('/teacher/settings')
                ? 'text-primary-700 bg-primary-50'
                : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
            }`}
          >
            <Settings className={`${collapsed ? 'h-6 w-6' : 'h-5 w-5 mr-3'}`} />
            {!collapsed && <span>Configuración</span>}
          </Link>
        </nav>
        
        <div className="px-2 mt-4">
          <button
            onClick={toggleCollapsed}
            className="w-full flex items-center justify-center px-2 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5 mr-2" />
                <span>Colapsar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default TeacherSidebar;