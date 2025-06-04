import { createContext, useContext, useState, ReactNode } from 'react';
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
  getAvailableTimeSlots: (date: Date) => TimeSlot[];
  createBooking: (studentId: string, studentName: string, date: string, startTime: string, endTime: string) => Promise<Booking>;
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

  const getAvailableTimeSlots = async (date: Date): Promise<TimeSlot[]> => {
    const dayOfWeek = date.getDay();
    
    const { data: availabilityData } = await supabase
      .from('availability')
      .select('*')
      .eq('day_of_week', dayOfWeek);
    
    const dayAvailability = availabilityData?.[0];
    
    if (!dayAvailability || !dayAvailability.is_available) {
      return [];
    }
    
    const isDateBlocked = isTimeBlocked(date);
    if (isDateBlocked) {
      return [];
    }
    
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('date', format(date, 'yyyy-MM-dd'))
      .neq('status', 'cancelled');
    
    return dayAvailability.slots.map(slot => {
      const isBooked = bookings?.some(booking => 
        booking.start_time === slot.startTime && booking.end_time === slot.endTime
      );
      
      return {
        id: `${format(date, 'yyyy-MM-dd')}-${slot.startTime}`,
        date: format(date, 'yyyy-MM-dd'),
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAvailable: !isBooked,
      };
    });
  };

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

    // Obtener el ID del profesor
    const { data: teacherData } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'teacher')
      .single();

    if (teacherData) {
      // Create notification for teacher
      await supabase
        .from('notifications')
        .insert([{
          user_id: teacherData.id,
          type: 'booking',
          title: 'Nueva solicitud de clase',
          message: `${studentName} ha solicitado una clase para el ${date} de ${startTime} a ${endTime}`,
          link: '/teacher/dashboard'
        }]);
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

  const getStudentBookings = async (studentId: string): Promise<Booking[]> => {
    const { data, error } = await supabase
      .rpc('get_my_student_class_history', { input_student_id: studentId });

    if (error) {
      console.error('Error al llamar a la función RPC:', error);
      return [];
    }

    return data.map(booking => ({
      id: booking.booking_id,
      studentId: booking.student_id,
      studentName: booking.student_name,
      date: booking.date,
      startTime: booking.start_time,
      endTime: booking.end_time,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.created_at
    }));
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

      // Create notification for student
      await supabase
        .from('notifications')
        .insert([{
          user_id: booking.student_id,
          type: 'booking',
          title: 'Clase confirmada',
          message: `Tu clase para el ${booking.date} de ${booking.start_time} a ${booking.end_time} ha sido confirmada`,
          link: '/student/dashboard'
        }]);

      await sendEmail(
        booking.profiles.email,
        'Clase confirmada',
        `
          Tu clase ha sido confirmada para el día ${booking.date} 
          de ${booking.start_time} a ${booking.end_time}.
          
          Enlace de la videollamada: ${booking.meeting_link}
          
          ¡Te esperamos!
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
      // Primero obtenemos la información de la reserva antes de cancelarla
      const { data: bookingData, error: fetchError } = await supabase
        .from('bookings')
        .select('*, profiles(name, email)')
        .eq('id', bookingId)
        .single();

      if (fetchError || !bookingData) {
        console.error('Booking not found:', fetchError);
        toast.error('No se encontró la reserva');
        return false;
      }

      // Ahora actualizamos el estado
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      // Create notification for the other party (teacher or student)
      const isTeacher = bookingData.student_id !== user?.id;
      const notificationUserId = isTeacher ? bookingData.student_id : import.meta.env.VITE_TEACHER_ID;
      
      await supabase
        .from('notifications')
        .insert([{
          user_id: notificationUserId,
          type: 'cancellation',
          title: 'Clase cancelada',
          message: `${isTeacher ? 'El profesor ha' : bookingData.profiles.name + ' ha'} cancelado la clase del ${bookingData.date} de ${bookingData.start_time} a ${bookingData.end_time}`,
          link: isTeacher ? '/student/dashboard' : '/teacher/dashboard'
        }]);

      // Solo enviamos email si tenemos los datos necesarios
      if (bookingData.profiles?.email) {
        await sendEmail(
          bookingData.profiles.email,
          'Clase cancelada',
          `
            Lo sentimos, ${isTeacher ? 'tu' : 'la'} clase para el día ${bookingData.date} 
            de ${bookingData.start_time} a ${bookingData.end_time} ha sido cancelada.
            
            ${isTeacher ? 'Por favor, solicita una nueva clase en otro horario disponible.' : 'El alumno ha cancelado la clase.'}
          `
        );
      }

      return true;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      return false;
    }
  };

      // Solo enviamos email si tenemos los datos necesarios
      if (bookingData.profiles?.email) {
        await sendEmail(
          bookingData.profiles.email,
          'Clase cancelada',
          `
            Lo sentimos, ${isTeacher ? 'tu' : 'la'} clase para el día ${bookingData.date} 
            de ${bookingData.start_time} a ${bookingData.end_time} ha sido cancelada.
            
            ${isTeacher ? 'Por favor, solicita una nueva clase en otro horario disponible.' : 'El alumno ha cancelado la clase.'}
          `
        );
      }

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