import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { addDays, format, parseISO, isSameDay } from 'date-fns';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export type TimeSlot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};

export type Booking = {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  meetingLink?: string;
  customMeetingLink?: string;
  notes?: string;
  price?: number;
  createdAt: string;
};

export type DayAvailability = {
  dayOfWeek: number;
  isAvailable: boolean;
  slots: Array<{
    startTime: string;
    endTime: string;
  }>;
};

export type BlockedTime = {
  id: string;
  startDate: string;
  endDate: string;
  reason?: string;
};

type BookingContextType = {
  bookings: Booking[];
  getAvailableTimeSlots: (date: Date) => Promise<TimeSlot[]>;
  createBooking: (studentId: string, studentName: string, date: string, startTime: string, endTime: string, studentPrice?: number) => Promise<Booking>;
  confirmBooking: (bookingId: string) => Promise<boolean>;
  cancelBooking: (bookingId: string) => Promise<boolean>;
  getStudentBookings: (studentId: string) => Promise<Booking[]>;
  getTeacherBookings: () => Promise<Booking[]>;
  getPendingBookings: () => Promise<Booking[]>;
  getBookingsByDate: (date: Date) => Promise<Booking[]>;
  blockTimeSlot: (startDate: string, endDate: string, reason?: string) => Promise<boolean>;
  unblockTimeSlot: (startDate: string, endDate: string) => Promise<boolean>;
  isTimeBlocked: (date: Date) => boolean;
  availabilitySettings: DayAvailability[];
  updateAvailabilitySettings: (settings: DayAvailability[]) => Promise<boolean>;
  updateMeetingLink: (bookingId: string, meetingLink: string) => Promise<boolean>;
  markCompletedBookings: () => Promise<{ completedCount: number; completedBookings: Booking[] }>;
  revertCompletedBooking: (bookingId: string) => Promise<boolean>;
  fetchBlockedTimes: () => Promise<void>;
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const sendEmail = async (to: string, subject: string, body: string) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, body }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send email');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [availabilitySettings, setAvailabilitySettings] = useState<DayAvailability[]>([]);

  // Fetch blocked times from database
  const fetchBlockedTimes = async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('blocked_times')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching blocked times:', error);
        return;
      }

      const blockedTimesData: BlockedTime[] = data.map(item => ({
        id: item.id,
        startDate: item.start_date,
        endDate: item.end_date,
        reason: item.reason
      }));

      setBlockedTimes(blockedTimesData);
    } catch (error) {
      console.error('Error in fetchBlockedTimes:', error);
    }
  };

  // Load blocked times on component mount
  useEffect(() => {
    fetchBlockedTimes();
  }, []);

const getAvailableTimeSlots = async (date: Date): Promise<TimeSlot[]> => {
    const dayOfWeek = date.getDay();
    
    try {
      // Obtener disponibilidad del día
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('availability')
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true);
      
      if (availabilityError) {
        console.error('Error fetching availability:', availabilityError);
        return [];
      }

      if (!availabilityData || availabilityData.length === 0) {
        return [];
      }

      // Verificar si la fecha está bloqueada
      const isDateBlocked = isTimeBlocked(date);
      if (isDateBlocked) {
        return [];
      }
      
      // Obtener reservas existentes para este día (excluyendo canceladas)
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('date', format(date, 'yyyy-MM-dd'))
        .neq('status', 'cancelled');
      
      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        return [];
      }

      // Generar slots disponibles
      const availableSlots: TimeSlot[] = [];
      
      // Iterar sobre todos los registros de disponibilidad para este día
      availabilityData.forEach(availability => {
        if (availability.slots && Array.isArray(availability.slots)) {
          availability.slots.forEach(slot => {
            // Verificar si este slot ya está reservado
            const isBooked = bookings?.some(booking => {
              // Normalizar los tiempos para comparación
              const bookingStart = booking.start_time.substring(0, 5); // "10:00:00" -> "10:00"
              const bookingEnd = booking.end_time.substring(0, 5);
              const slotStart = slot.startTime;
              const slotEnd = slot.endTime;
              
              return bookingStart === slotStart && bookingEnd === slotEnd;
            });
            
            // Solo agregar si no está reservado
            if (!isBooked) {
              availableSlots.push({
                id: `${format(date, 'yyyy-MM-dd')}-${slot.startTime}`,
                date: format(date, 'yyyy-MM-dd'),
                startTime: slot.startTime,
                endTime: slot.endTime,
                isAvailable: true,
              });
            }
          });
        }
      });

      return availableSlots;
      
    } catch (error) {
      console.error('Error in getAvailableTimeSlots:', error);
      return [];
    }
  };

// En src/context/BookingContext.tsx

const createBooking = async (
  studentId: string,
  studentName: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<Booking> => {
  const { data, error } = await supabase
    .from('bookings')
    .insert([{
      student_id: studentId,
      date,
      start_time: startTime,
      end_time: endTime,
      status: 'pending',
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;

  // 🔥 BUSCAR EL PROFESOR DINÁMICAMENTE
  const { data: teacherData, error: teacherError } = await supabase
    .from('profiles')
    .select('id, email, name')
    .eq('role', 'teacher')
    .single();

  if (teacherError) {
    console.error('Error finding teacher:', teacherError);
  } else {
    // ✅ Crear notificación para el profesor
    await supabase
      .from('notifications')
      .insert([{
        user_id: teacherData.id,
        type: 'booking',
        title: 'Nueva solicitud de clase',
        message: `${studentName} ha solicitado una clase para el ${date} de ${startTime} a ${endTime}`,
        link: '/teacher/dashboard'
      }]);

    // 📧 ENVIAR EMAIL AL PROFESOR
    try {
      await sendEmail(
        teacherData.email,
        'Nueva solicitud de clase',
        `
          ¡Hola ${teacherData.name}!
          
          Tienes una nueva solicitud de clase:
          
          📅 Estudiante: ${studentName}
          📅 Fecha: ${date}
          ⏰ Horario: ${startTime} - ${endTime}
          
          Por favor, revisa tu panel de control para confirmar o rechazar la solicitud.
          
          Enlace al panel: ${window.location.origin}/teacher/dashboard
        `
      );
    } catch (emailError) {
      console.error('Error sending email to teacher:', emailError);
      // No lanzar error aquí para que la reserva se complete aunque falle el email
    }
  }

  return {
    id: data.id,
    studentId: data.student_id,
    studentName,
    date: data.date,
    startTime: data.start_time,
    endTime: data.end_time,
    status: data.status,
    notes: data.notes,
    createdAt: data.created_at
  };
};

const confirmBooking = async (bookingId: string): Promise<boolean> => {
  try { 
    const { data: booking, error } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        meeting_link: `https://meet.google.com/${Math.random().toString(36).substring(2, 10)}`
      })
      .eq('id', bookingId)
      .select('*, profiles(name, email)')
      .single();

    if (error) throw error;

    // ✅ Crear notificación para el estudiante
    await supabase
      .from('notifications')
      .insert([{
        user_id: booking.student_id,
        type: 'booking',
        title: 'Clase confirmada',
        message: `Tu clase para el ${booking.date} de ${booking.start_time} a ${booking.end_time} ha sido confirmada`,
        link: '/student/dashboard'
      }]);

    // 📧 ENVIAR EMAIL AL ESTUDIANTE
    await sendEmail(
      booking.profiles.email,
      '✅ Clase confirmada',
      `
        ¡Hola ${booking.profiles.name}!
        
        Tu clase ha sido confirmada:
        
        📅 Fecha: ${booking.date}
        ⏰ Horario: ${booking.start_time} - ${booking.end_time}
        🎥 Enlace de videollamada: ${booking.meeting_link}
        
        📝 Consejos para la clase:
        • Conéctate 5 minutos antes
        • Asegúrate de tener buena conexión a internet
        • Ten preparados tus materiales de estudio
        
        ¡Te esperamos!
        
        Accede a tu panel: ${window.location.origin}/student/dashboard
      `
    );

    return true;
  } catch (error) {
    console.error('Error confirming booking:', error);
    return false;
  }
};

const cancelBooking = async (bookingId: string): Promise<boolean> => {
  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .select('*, profiles(name, email)')
      .single();

    if (error) throw error;

    // ✅ Crear notificación para el estudiante
    await supabase
      .from('notifications')
      .insert([{
        user_id: booking.student_id,
        type: 'cancellation',
        title: 'Clase cancelada',
        message: `Tu clase para el ${booking.date} de ${booking.start_time} a ${booking.end_time} ha sido cancelada`,
        link: '/student/dashboard'
      }]);

    // 📧 ENVIAR EMAIL AL ESTUDIANTE
    await sendEmail(
      booking.profiles.email,
      '❌ Clase cancelada',
      `
        Hola ${booking.profiles.name},
        
        Lamentamos informarte que tu clase ha sido cancelada:
        
        📅 Fecha: ${booking.date}
        ⏰ Horario: ${booking.start_time} - ${booking.end_time}
        
        ¿Qué puedes hacer ahora?
        • Reservar una nueva clase en otro horario disponible
        • Contactar con el profesor si tienes dudas
        
        Reservar nueva clase: ${window.location.origin}/student/dashboard
        
        Disculpa las molestias.
      `
    );

    return true;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return false;
  }
};

  const getTeacherBookings = async (): Promise<Booking[]> => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, profiles(name)')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching teacher bookings:', error);
      return [];
    }

    return data.map(booking => ({
      id: booking.id,
      studentId: booking.student_id,
      studentName: booking.profiles.name,
      date: booking.date,
      startTime: booking.start_time,
      endTime: booking.end_time,
      status: booking.status,
      notes: booking.notes,
      price: booking.price || 25.00,
      createdAt: booking.created_at
    }));
  };

  const getPendingBookings = async (): Promise<Booking[]> => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, profiles(name)')
      .eq('status', 'pending')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching pending bookings:', error);
      return [];
    }

    return data.map(booking => ({
      id: booking.id,
      studentId: booking.student_id,
      studentName: booking.profiles.name,
      date: booking.date,
      startTime: booking.start_time,
      endTime: booking.end_time,
      status: booking.status,
      notes: booking.notes,
      price: booking.price || 25.00,
      createdAt: booking.created_at
    }));
  };

  const getBookingsByDate = async (date: Date): Promise<Booking[]> => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, profiles(name)')
      .eq('date', format(date, 'yyyy-MM-dd'));

    if (error) {
      console.error('Error fetching bookings by date:', error);
      return [];
    }

    return data.map(booking => ({
      id: booking.id,
      studentId: booking.student_id,
      studentName: booking.profiles.name,
      date: booking.date,
      startTime: booking.start_time,
      endTime: booking.end_time,
      status: booking.status,
      notes: booking.notes,
      price: booking.price || 25.00,
      createdAt: booking.created_at
    }));
  };

  const blockTimeSlot = async (startDate: string, endDate: string, reason?: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('blocked_times')
        .insert([{
          start_date: startDate,
          end_date: endDate,
          reason
        }]);

      if (error) throw error;
      
      // Refresh blocked times after successful insertion
      await fetchBlockedTimes();
      
      return true;
    } catch (error) {
      console.error('Error blocking time slot:', error);
      return false;
    }
  };

  const unblockTimeSlot = async (startDate: string, endDate: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('blocked_times')
        .delete()
        .gte('start_date', startDate)
        .lte('end_date', endDate);

      if (error) throw error;
      
      // Refresh blocked times after successful deletion
      await fetchBlockedTimes();
      
      return true;
    } catch (error) {
      console.error('Error unblocking time slot:', error);
      return false;
    }
  };

  const isTimeBlocked = (date: Date): boolean => {
    return blockedTimes.some(block => {
      const startDate = parseISO(block.startDate);
      const endDate = parseISO(block.endDate);
      return date >= startDate && date <= endDate;
    });
  };

  const updateAvailabilitySettings = async (settings: DayAvailability[]): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('availability')
        .upsert(
          settings.map(setting => ({
            day_of_week: setting.dayOfWeek,
            is_available: setting.isAvailable,
            slots: setting.slots
          }))
        );

      if (error) throw error;
      setAvailabilitySettings(settings);
      return true;
    } catch (error) {
      console.error('Error updating availability settings:', error);
      return false;
    }
  };

  const updateMeetingLink = async (bookingId: string, meetingLink: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ custom_meeting_link: meetingLink })
        .eq('id', bookingId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating meeting link:', error);
      return false;
    }
  };

  const markCompletedBookings = async (): Promise<{ completedCount: number; completedBookings: Booking[] }> => {
    try {
      const now = new Date();
      const currentDate = format(now, 'yyyy-MM-dd');
      const currentTime = format(now, 'HH:mm:ss');

      // Buscar clases confirmadas que ya hayan terminado
      const { data: expiredBookings, error: fetchError } = await supabase
        .from('bookings')
        .select('*, profiles(name, email)')
        .eq('status', 'confirmed')
        .or(`date.lt.${currentDate},and(date.eq.${currentDate},end_time.lt.${currentTime})`);

      if (fetchError) throw fetchError;

      if (!expiredBookings || expiredBookings.length === 0) {
        return { completedCount: 0, completedBookings: [] };
      }

      // Marcar como completadas
      const bookingIds = expiredBookings.map(booking => booking.id);
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .in('id', bookingIds);

      if (updateError) throw updateError;

      // Crear notificaciones para los estudiantes
      const notifications = expiredBookings.map(booking => ({
        user_id: booking.student_id,
        type: 'system',
        title: 'Clase completada',
        message: `Tu clase del ${booking.date} de ${booking.start_time} a ${booking.end_time} ha sido marcada como completada`,
        link: '/student/dashboard'
      }));

      if (notifications.length > 0) {
        await supabase
          .from('notifications')
          .insert(notifications);
      }

      // Obtener el ID del profesor para crear notificación
      const { data: teacherProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'teacher')
        .single();

      if (teacherProfile && expiredBookings.length > 0) {
        await supabase
          .from('notifications')
          .insert([{
            user_id: teacherProfile.id,
            type: 'system',
            title: 'Clases completadas automáticamente',
            message: `Se han marcado ${expiredBookings.length} clase(s) como completadas automáticamente`,
            link: '/teacher/dashboard'
          }]);
      }

      const completedBookings = expiredBookings.map(booking => ({
        id: booking.id,
        studentId: booking.student_id,
        studentName: booking.profiles.name,
        date: booking.date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        status: 'completed' as const,
        notes: booking.notes,
        price: booking.price || 25.00,
        createdAt: booking.created_at
      }));

      return { completedCount: expiredBookings.length, completedBookings };
    } catch (error) {
      console.error('Error marking completed bookings:', error);
      return { completedCount: 0, completedBookings: [] };
    }
  };

  const revertCompletedBooking = async (bookingId: string): Promise<boolean> => {
    try {
      const { data: booking, error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .eq('status', 'completed')
        .select('*, profiles(name, email)')
        .single();

      if (error) throw error;

      // Crear notificación para el estudiante
      await supabase
        .from('notifications')
        .insert([{
          user_id: booking.student_id,
          type: 'cancellation',
          title: 'Clase marcada como no realizada',
          message: `Tu clase del ${booking.date} de ${booking.start_time} a ${booking.end_time} ha sido marcada como no realizada por el profesor`,
          link: '/student/dashboard'
        }]);

      return true;
    } catch (error) {
      console.error('Error reverting completed booking:', error);
      return false;
    }
  };

  return (
    <BookingContext.Provider value={{
      bookings: [],
      getAvailableTimeSlots,
      createBooking,
      confirmBooking,
      cancelBooking,
      getStudentBookings,
      getTeacherBookings,
      getPendingBookings,
      getBookingsByDate,
      blockTimeSlot,
      unblockTimeSlot,
      isTimeBlocked,
      availabilitySettings,
      updateAvailabilitySettings,
      updateMeetingLink,
      markCompletedBookings,
      revertCompletedBooking,
      fetchBlockedTimes,
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBookingContext = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBookingContext must be used within a BookingProvider');
  }
  return context;
};

// Add the export alias for useBooking
export { useBookingContext as useBooking };