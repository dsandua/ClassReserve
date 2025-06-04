import { useState, useEffect } from 'react';
import { format, addMonths, subMonths, isSameDay, parseISO, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, X, Unlock } from 'lucide-react';
import { useBooking } from '../../hooks/useBooking';
import { Booking } from '../../context/BookingContext';
import BookingCard from '../../components/booking/BookingCard';
import toast from 'react-hot-toast';

const CalendarPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookingsForDate, setBookingsForDate] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [isBlockingTime, setIsBlockingTime] = useState(false);
  const [isUnblockingTime, setIsUnblockingTime] = useState(false);
  const [blockStartDate, setBlockStartDate] = useState('');
  const [blockEndDate, setBlockEndDate] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [unblockStartDate, setUnblockStartDate] = useState('');
  const [unblockEndDate, setUnblockEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const { 
    getTeacherBookings, 
    getBookingsByDate, 
    confirmBooking, 
    cancelBooking,
    blockTimeSlot,
    unblockTimeSlot,
    isTimeBlocked,
    availabilitySettings
  } = useBooking();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        const bookings = await getTeacherBookings();
        setAllBookings(bookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        toast.error('Error al cargar las reservas');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [getTeacherBookings]);
  
  useEffect(() => {
    const fetchBookingsForDate = async () => {
      const bookings = await getBookingsByDate(selectedDate);
      setBookingsForDate(bookings);
    };

    fetchBookingsForDate();
  }, [selectedDate, getBookingsByDate]);
  
  const formattedMonth = format(currentMonth, 'MMMM yyyy', { locale: es });
  
  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };
  
  const generateCalendarDays = () => {
    const daysInMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    ).getDate();
    
    const firstDayOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    ).getDay();
    
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    const blankDays = Array(adjustedFirstDay).fill(null);
    
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      
      const bookingsForDay = allBookings.filter(booking => 
        isSameDay(parseISO(booking.date), date)
      );

      const hasPendingBookings = bookingsForDay.some(booking => 
        booking.status === 'pending'
      );

      const hasConfirmedBookings = bookingsForDay.some(booking => 
        booking.status === 'confirmed'
      );

      const hasCompletedBookings = bookingsForDay.some(booking => 
        booking.status === 'completed'
      );

      const hasCancelledBookings = bookingsForDay.some(booking => 
        booking.status === 'cancelled'
      );
      
      const isBlocked = isTimeBlocked(date);
      
      const dayOfWeek = date.getDay();
      
      const dayAvailability = availabilitySettings.find(a => a.dayOfWeek === dayOfWeek);
      const isAvailable = dayAvailability?.isAvailable;
      
      return {
        day,
        date,
        hasPendingBookings,
        hasConfirmedBookings,
        hasCompletedBookings,
        hasCancelledBookings,
        isSelected: isSameDay(date, selectedDate),
        isToday: isSameDay(date, new Date()),
        isBlocked,
        isAvailable
      };
    });
    
    return [...blankDays, ...daysArray];
  };
  
  const handleConfirmBooking = async (bookingId: string) => {
    try {
      const success = await confirmBooking(bookingId);
      
      if (success) {
        const bookings = await getBookingsByDate(selectedDate);
        setBookingsForDate(bookings);
        
        toast.success('Reserva confirmada con éxito');
      }
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast.error('Error al confirmar la reserva');
    }
  };
  
  const handleCancelBooking = async (bookingId: string) => {
    try {
      const success = await cancelBooking(bookingId);
      
      if (success) {
        const bookings = await getBookingsByDate(selectedDate);
        setBookingsForDate(bookings);
        
        toast.success('Reserva cancelada con éxito');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Error al cancelar la reserva');
    }
  };
  
  const handleBlockTime = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!blockStartDate || !blockEndDate) {
      toast.error('Por favor, selecciona las fechas de inicio y fin');
      return;
    }
    
    try {
      const success = await blockTimeSlot(blockStartDate, blockEndDate, blockReason);
      
      if (success) {
        setIsBlockingTime(false);
        setBlockStartDate('');
        setBlockEndDate('');
        setBlockReason('');
        
        toast.success('Período bloqueado con éxito');
      }
    } catch (error) {
      console.error('Error blocking time:', error);
      toast.error('Error al bloquear el período');
    }
  };

  const handleUnblockTime = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!unblockStartDate || !unblockEndDate) {
      toast.error('Por favor, selecciona las fechas de inicio y fin');
      return;
    }
    
    try {
      const startDate = new Date(unblockStartDate);
      const endDate = new Date(unblockEndDate);
      
      const start = startOfDay(startDate);
      const end = endOfDay(endDate);
      
      const success = await unblockTimeSlot(
        start.toISOString(),
        end.toISOString()
      );
      
      if (success) {
        setIsUnblockingTime(false);
        setUnblockStartDate('');
        setUnblockEndDate('');
        
        toast.success('Período desbloqueado con éxito');
      }
    } catch (error) {
      console.error('Error unblocking time:', error);
      toast.error('Error al desbloquear el período');
    }
  };
  
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
        
        <div className="flex space-x-3">
          <button
            className="btn btn-primary flex items-center"
            onClick={() => setIsBlockingTime(true)}
          >
            <Plus className="h-4 w-4 mr-2" /> Bloquear tiempo
          </button>
          <button
            className="btn btn-secondary flex items-center"
            onClick={() => setIsUnblockingTime(true)}
          >
            <Unlock className="h-4 w-4 mr-2" /> Desbloquear tiempo
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 capitalize">{formattedMonth}</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={previousMonth}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <button 
                  onClick={nextMonth}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-7 mb-2">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays().map((dayObj, index) => {
                  if (dayObj === null) {
                    return <div key={`blank-${index}`} className="h-14" />;
                  }
                  
                  let dayClasses = 'h-14 relative flex flex-col items-center justify-center border rounded-md cursor-pointer transition-colors';
                  
                  if (dayObj.isSelected) {
                    dayClasses += ' bg-primary-100 border-primary-500';
                  } else if (dayObj.isBlocked) {
                    dayClasses += ' bg-error-50 border-error-200 text-error-700';
                  } else if (!dayObj.isAvailable) {
                    dayClasses += ' bg-gray-50 text-gray-400';
                  } else {
                    dayClasses += ' border-gray-200 hover:bg-gray-50';
                  }
                  
                  if (dayObj.isToday) {
                    dayClasses = dayClasses.replace('text-gray-400', 'text-primary-600');
                    dayClasses += ' font-bold ring-2 ring-primary-500 ring-offset-2';
                  }
                  
                  return (
                    <div
                      key={dayObj.day}
                      className={dayClasses}
                      onClick={() => handleDateClick(dayObj.date)}
                    >
                      <span className="text-sm">{dayObj.day}</span>
                      
                      <div className="absolute bottom-1 flex space-x-1">
                        {dayObj.hasPendingBookings && (
                          <div className="w-1.5 h-1.5 rounded-full bg-warning-500"></div>
                        )}
                        {dayObj.hasConfirmedBookings && (
                          <div className="w-1.5 h-1.5 rounded-full bg-success-500"></div>
                        )}
                        {dayObj.hasCompletedBookings && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                        )}
                        {dayObj.hasCancelledBookings && (
                          <div className="w-1.5 h-1.5 rounded-full bg-error-500"></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm mt-4 p-4 border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-2">Leyenda</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-warning-500 mr-2"></div>
                <span className="text-sm text-gray-700">Pendientes</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-success-500 mr-2"></div>
                <span className="text-sm text-gray-700">Confirmadas</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-primary-500 mr-2"></div>
                <span className="text-sm text-gray-700">Completadas</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-error-500 mr-2"></div>
                <span className="text-sm text-gray-700">Canceladas</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded bg-error-50 border border-error-200 mr-2"></div>
                <span className="text-sm text-gray-700">Bloqueado</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded bg-gray-50 text-gray-400 border border-gray-200 mr-2"></div>
                <span className="text-sm text-gray-700">No disponible</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded bg-primary-100 border border-primary-500 mr-2"></div>
                <span className="text-sm text-gray-700">Seleccionado</span>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="font-medium text-gray-900 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2 text-gray-500" />
                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
              </h2>
            </div>
            
            <div className="p-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Cargando reservas...</p>
                </div>
              ) : bookingsForDate.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay reservas para este día.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookingsForDate.map((booking) => (
                    <BookingCard 
                      key={booking.id} 
                      booking={booking} 
                      isTeacher={true}
                      onConfirm={booking.status === 'pending' ? handleConfirmBooking : undefined}
                      onCancel={booking.status === 'pending' ? handleCancelBooking : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {isBlockingTime && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-slide-in">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Bloquear período</h3>
              <button
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setIsBlockingTime(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleBlockTime} className="p-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de inicio
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    className="input"
                    value={blockStartDate}
                    onChange={(e) => setBlockStartDate(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de fin
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    className="input"
                    value={blockEndDate}
                    onChange={(e) => setBlockEndDate(e.target.value)}
                    min={blockStartDate}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo (opcional)
                  </label>
                  <input
                    type="text"
                    id="reason"
                    className="input"
                    placeholder="Ej: Vacaciones, día festivo..."
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsBlockingTime(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Bloquear período
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isUnblockingTime && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-slide-in">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Desbloquear período</h3>
              <button
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setIsUnblockingTime(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleUnblockTime} className="p-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="unblockStartDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de inicio
                  </label>
                  <input
                    type="date"
                    id="unblockStartDate"
                    className="input"
                    value={unblockStartDate}
                    onChange={(e) => setUnblockStartDate(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="unblockEndDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de fin
                  </label>
                  <input
                    type="date"
                    id="unblockEndDate"
                    className="input"
                    value={unblockEndDate}
                    onChange={(e) => setUnblockEndDate(e.target.value)}
                    min={unblockStartDate}
                    required
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsUnblockingTime(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Desbloquear período
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;