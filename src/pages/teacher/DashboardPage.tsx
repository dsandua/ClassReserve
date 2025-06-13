import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, Check, X, AlertCircle, RotateCcw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useBooking } from '../../hooks/useBooking';
import { useNotifications } from '../../context/NotificationsContext';
import { Booking } from '../../context/BookingContext';
import BookingCard from '../../components/booking/BookingCard';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import { parseISO, isAfter, startOfDay, addDays, format, isSameDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const TeacherDashboardPage = () => {
  const { user } = useAuth();
  const { 
    getTeacherBookings, 
    getPendingBookings, 
    confirmBooking, 
    cancelBooking,
    markCompletedBookings,
    revertCompletedBooking
  } = useBooking();
  const { markAsRead } = useNotifications();
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [recentlyCompletedBookings, setRecentlyCompletedBookings] = useState<Booking[]>([]);
  const [completedTodayCount, setCompletedTodayCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [studentCount, setStudentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [selectedBookingToRevert, setSelectedBookingToRevert] = useState<Booking | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Marcar clases como completadas automáticamente
      const { completedCount, completedBookings } = await markCompletedBookings();
      
      if (completedCount > 0) {
        setRecentlyCompletedBookings(completedBookings);
        toast.success(`${completedCount} clase(s) marcada(s) como completadas automáticamente`);
      }
      
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
      const today = startOfDay(new Date());
      const nextThreeMonths = addDays(today, 90);
      
      const upcoming = allBookings.filter(booking => {
        const bookingDate = parseISO(booking.date);
        const isConfirmed = booking.status === 'confirmed';
        const isInFuture = bookingDate >= today;
        const isWithinRange = bookingDate <= nextThreeMonths;
        
        return isConfirmed && isInFuture && isWithinRange;
      }).sort((a, b) => {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        if (isSameDay(dateA, dateB)) {
          return a.startTime.localeCompare(b.startTime);
        }
        return dateA.getTime() - dateB.getTime();
      }).slice(0, 6);
      
      // Contar clases completadas (incluyendo las recién completadas automáticamente)
      const todayStart = startOfDay(new Date());
      const todayEnd = endOfDay(new Date());
      
      const { data: completedTodayData, error: completedTodayError } = await supabase
        .from('bookings')
        .select('*')
        .eq('status', 'completed')
        .gte('updated_at', todayStart.toISOString())
        .lte('updated_at', todayEnd.toISOString());
      
      if (completedTodayError) {
        console.error('Error fetching completed today:', completedTodayError);
      } else {
        // Combinar las clases completadas con las recién completadas
        const totalCompletedToday = (completedTodayData?.length || 0) + completedCount;
        setCompletedTodayCount(totalCompletedToday);
      }
      
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

  const handleRevertBooking = async () => {
    if (!selectedBookingToRevert || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const success = await revertCompletedBooking(selectedBookingToRevert.id);
      
      if (success) {
        // Remover de la lista de clases completadas recientemente
        setRecentlyCompletedBookings(prev => 
          prev.filter(booking => booking.id !== selectedBookingToRevert.id)
        );
        
        // Actualizar el contador de completadas
        setCompletedTodayCount(prev => Math.max(0, prev - 1));
        
        setShowRevertModal(false);
        setSelectedBookingToRevert(null);
        toast.success('Clase marcada como no realizada');
      }
    } catch (error) {
      console.error('Error reverting booking:', error);
      toast.error('Error al revertir la clase');
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

        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-success-100 rounded-md p-3">
                <Check className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500">Completadas</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{completedTodayCount}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recently completed bookings */}
      {recentlyCompletedBookings.length > 0 && (
        <div className="mb-8">
          <div className="bg-success-50 border border-success-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-success-600" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-success-800">
                  Clases completadas automáticamente
                </h3>
                <div className="mt-2 text-sm text-success-700">
                  <p>
                    Se han marcado {recentlyCompletedBookings.length} clase(s) como completadas automáticamente. 
                    Si alguna clase no se realizó, puedes marcarla como "no realizada".
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentlyCompletedBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                    Completada
                  </span>
                  <button
                    onClick={() => {
                      setSelectedBookingToRevert(booking);
                      setShowRevertModal(true);
                    }}
                    className="text-warning-600 hover:text-warning-700 text-xs font-medium flex items-center"
                    title="Marcar como no realizada"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    No realizada
                  </button>
                </div>
                
                <div className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {booking.studentName?.charAt(0) ?? ''}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{booking.studentName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <span className="ml-2 text-sm text-gray-700">
                        {format(parseISO(booking.date), "EEEE, d 'de' MMMM", { locale: es })}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-gray-500" />
                      <span className="ml-2 text-sm text-gray-700">
                        {booking.startTime?.slice(0, 5)} - {booking.endTime?.slice(0, 5)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
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

      {/* Revert Confirmation Modal */}
      {showRevertModal && selectedBookingToRevert && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-slide-in">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Confirmar acción</h3>
            </div>
            
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-warning-600" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">
                    ¿Marcar clase como no realizada?
                  </h4>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>
                      Vas a marcar la clase de <strong>{selectedBookingToRevert.studentName}</strong> del{' '}
                      <strong>{format(parseISO(selectedBookingToRevert.date), "d 'de' MMMM", { locale: es })}</strong> como no realizada.
                    </p>
                    <p className="mt-2">
                      Esta acción cambiará el estado de la clase a "cancelada" y notificará al estudiante.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowRevertModal(false);
                    setSelectedBookingToRevert(null);
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={handleRevertBooking}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Procesando...' : 'Marcar como no realizada'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboardPage;