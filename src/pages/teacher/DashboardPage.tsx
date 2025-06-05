import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, Check, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useBooking } from '../../context/BookingContext';
import { useNotifications } from '../../context/NotificationsContext';
import { Booking } from '../../context/BookingContext';
import BookingCard from '../../components/booking/BookingCard';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import { parseISO, isAfter, startOfDay, addDays } from 'date-fns';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const TeacherDashboardPage = () => {
  const { user } = useAuth();
  const { getTeacherBookings, getPendingBookings, confirmBooking, cancelBooking } = useBooking();
  const { markAsRead } = useNotifications();
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [studentCount, setStudentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Obtener el conteo de estudiantes
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');
      
      setStudentCount(count || 0);

      // Obtener todas las reservas
      const allBookings = await getTeacherBookings();
      const pending = await getPendingBookings();
      
      // Filtrar las próximas clases confirmadas
      const now = startOfDay(new Date());
      const nextMonth = addDays(now, 30);
      
      const upcoming = allBookings.filter(booking => {
        const bookingDate = parseISO(booking.date);
        return isAfter(bookingDate, now) && 
               booking.status === 'confirmed' &&
               bookingDate <= nextMonth;
      }).sort((a, b) => {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        return dateA.getTime() - dateB.getTime();
      }).slice(0, 3); // Obtener solo las próximas 3 clases
      
      setPendingBookings(pending);
      setUpcomingBookings(upcoming);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConfirmBooking = async (bookingId: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const success = await confirmBooking(bookingId);
      
      if (success) {
        // Actualizar los datos después de confirmar
        await fetchData();

        // Marcar la notificación relacionada como leída
        const { data: notifications } = await supabase
          .from('notifications')
          .select('id')
          .eq('type', 'booking')
          .like('message', `%${bookingId}%`);

        if (notifications && notifications.length > 0) {
          await markAsRead(notifications[0].id);
        }

        toast.success('Reserva confirmada con éxito');
      }
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast.error('Error al confirmar la reserva');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleCancelBooking = async (bookingId: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const success = await cancelBooking(bookingId);
      
      if (success) {
        // Actualizar los datos después de cancelar
        await fetchData();

        // Marcar la notificación relacionada como leída
        const { data: notifications } = await supabase
          .from('notifications')
          .select('id')
          .eq('type', 'booking')
          .like('message', `%${bookingId}%`);

        if (notifications && notifications.length > 0) {
          await markAsRead(notifications[0].id);
        }

        toast.success('Reserva cancelada con éxito');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Error al cancelar la reserva');
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Panel de Profesor</h1>
        <p className="text-gray-600 mt-1">
          Bienvenido de nuevo, {user?.name}
        </p>
      </div>
      
      {/* Stats overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                <Calendar className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500">Próximas Clases</dt>
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
              <div className="flex-shrink-0 bg-warning-100 rounded-md p-3">
                <Clock className="h-6 w-6 text-warning-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500">Solicitudes pendientes</dt>
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
              <div className="flex-shrink-0 bg-accent-100 rounded-md p-3">
                <Users className="h-6 w-6 text-accent-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500">Total de alumnos</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{studentCount}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Pending bookings */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Solicitudes pendientes</h2>
          
          {pendingBookings.length > 0 && (
            <Link 
              to="/teacher/calendar" 
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Ver todas
            </Link>
          )}
        </div>
        
        {pendingBookings.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
            <p className="text-gray-500">No tienes solicitudes pendientes.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingBookings.map((booking) => (
              <BookingCard 
                key={booking.id} 
                booking={booking} 
                isTeacher={true}
                onConfirm={handleConfirmBooking}
                onCancel={handleCancelBooking}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Upcoming bookings */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Próximas clases</h2>
          
          <Link 
            to="/teacher/calendar" 
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Ver calendario
          </Link>
        </div>
        
        {upcomingBookings.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
            <p className="text-gray-500">No tienes clases programadas próximamente.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingBookings.map((booking) => (
              <BookingCard 
                key={booking.id} 
                booking={booking} 
                isTeacher={true}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones rápidas</h2>
        
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/teacher/calendar"
            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-primary-300 transition-colors"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Gestionar calendario</h3>
                <p className="text-sm text-gray-500">Ver y bloquear horarios</p>
              </div>
            </div>
          </Link>
          
          <Link
            to="/teacher/students"
            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-primary-300 transition-colors"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Gestionar alumnos</h3>
                <p className="text-sm text-gray-500">Ver y administrar alumnos</p>
              </div>
            </div>
          </Link>
          
          <Link
            to="/teacher/history"
            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-primary-300 transition-colors"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Historial de clases</h3>
                <p className="text-sm text-gray-500">Ver todas las clases</p>
              </div>
            </div>
          </Link>
          
          <Link
            to="/teacher/settings"
            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-primary-300 transition-colors"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Configuración</h3>
                <p className="text-sm text-gray-500">Ajustes y preferencias</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboardPage;