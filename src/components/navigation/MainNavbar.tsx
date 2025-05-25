import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Calendar, LogIn, UserPlus, LogOut, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const MainNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <Calendar className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">ClassReserve</span>
            </Link>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {isAuthenticated ? (
              <>
                {user?.role === 'teacher' ? (
                  <Link 
                    to="/teacher/dashboard" 
                    className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600"
                  >
                    Panel de Profesor
                  </Link>
                ) : (
                  <Link 
                    to="/student/dashboard" 
                    className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600"
                  >
                    Mi Panel
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600"
                >
                  <LogIn className="h-4 w-4 mr-1" />
                  Iniciar Sesión
                </Link>
                <Link 
                  to="/register" 
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Registrarse
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary-600 focus:outline-none"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isOpen && (
        <div className="sm:hidden animate-fade-in">
          <div className="pt-2 pb-3 space-y-1">
            {isAuthenticated ? (
              <>
                <div className="px-4 py-2 border-b border-gray-200">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-500" />
                    <span className="ml-2 text-sm font-medium text-gray-700">{user?.name}</span>
                  </div>
                </div>
                {user?.role === 'teacher' ? (
                  <Link 
                    to="/teacher/dashboard" 
                    className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    Panel de Profesor
                  </Link>
                ) : (
                  <Link 
                    to="/student/dashboard" 
                    className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                    onClick={() => setIsOpen(false)}
                  >
                    Mi Panel
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center px-4 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="flex items-center px-4 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                  onClick={() => setIsOpen(false)}
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  Iniciar Sesión
                </Link>
                <Link 
                  to="/register" 
                  className="flex items-center px-4 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                  onClick={() => setIsOpen(false)}
                >
                  <UserPlus className="h-5 w-5 mr-2" />
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default MainNavbar;