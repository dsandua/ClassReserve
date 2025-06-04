import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useBooking } from '../../hooks/useBooking';
import { Booking } from '../../context/BookingContext';
import BookingCard from '../../components/booking/BookingCard';

const DashboardPage = () => {
  const { user } = useAuth();
  const { getStudentBookings } = useBooking();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([]);
  
  const fetchBookings = async () => {
    if (user) {
      const userBookings = await getStudentBookings(user.id);
      
      const now = new Date();
      
      // Filter confirmed upcoming bookings
      const upcoming = userBookings.filter(booking => {
        const bookingDate = parseISO(booking.date);
        const bookingEndTime = booking.endTime.split(':');
        const bookingDateTime = new Date(
          bookingDate.getFullYear(),
          bookingDate.getMonth(),
          bookingDate.getDate(),
          parseInt(bookingEndTime[0], 10),
          parseInt(bookingEndTime[1] || '0', 10)
        );
        
        return bookingDateTime > now && booking.status === 'confirmed';
      });

      // Filter pending bookings
      const pending = userBookings.filter(booking => booking.status === 'pending');
      
      // Filter completed bookings
      const completed = userBookings.filter(booking => booking.status === 'completed');
      
      setBookings(userBookings);
      setUpcomingBookings(upcoming);
      setPendingBookings(pending);
      setCompletedBookings(completed);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user, getStudentBookings]);

  // Función para manejar la cancelación
  const handleBookingCancelled = (bookingId: string) => {
    // Actualizar las listas de reservas
    setPendingBookings(prev => prev.filter(booking => booking.id !== bookingId));
    setUpcomingBookings(prev => prev.filter(booking => booking.id !== bookingId));
    setBookings(prev => prev.map(booking => 
      booking.id === bookingId 
        ? { ...booking, status: 'cancelled' } 
        : booking
    ));
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Panel de Alumno</h1>
        <p className="text-gray-600 mt-1">
          Bienvenido de nuevo, {user?.name}
        </p>
      </div>
      
      {/* Stats overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-warning-100 rounded-md p-3">
                <Clock className="h-6 w-6 text-warning-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500">Clases pendientes</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{pendingBookings.length}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                <Calendar className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500">Próximas clases</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{upcomingBookings.length}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-accent-100 rounded-md p-3">
                <Clock className="h-6 w-6 text-accent-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500">Total de horas</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {bookings.filter(b => b.status === 'completed').length}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-success-100 rounded-md p-3">
                <Check className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500">Clases completadas</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{completedBookings.length}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending bookings */}
      {pendingBookings.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Clases pendientes de confirmar</h2>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingBookings.map((booking) => (
              <BookingCard 
                key={booking.id} 
                booking={booking}
                onCancel={handleBookingCancelled}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Upcoming bookings */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Próximas clases</h2>
          <Link 
            to="/booking" 
            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
          >
            Reservar nueva clase <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        {upcomingBookings.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
            <p className="text-gray-500">No tienes próximas clases confirmadas.</p>
            <Link 
              to="/booking" 
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              Reservar clase
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingBookings.map((booking) => (
              <BookingCard 
                key={booking.id} 
                booking={booking}
                onCancel={handleBookingCancelled}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Quick links */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Accesos rápidos</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/booking"
            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-primary-300 transition-colors"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Reservar clase</h3>
                <p className="text-sm text-gray-500">Selecciona fecha y hora</p>
              </div>
            </div>
          </Link>
          
          <Link
            to="/student/history"
            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-primary-300 transition-colors"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Historial de clases</h3>
                <p className="text-sm text-gray-500">Ver todas tus clases</p>
              </div>
            </div>
          </Link>
          
          <Link
            to="/student/profile"
            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-primary-300 transition-colors"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Mi perfil</h3>
                <p className="text-sm text-gray-500">Gestiona tu información</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;