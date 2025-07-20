// src/context/BookingContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Types
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

export type CreateBookingData = {
  studentId: string;
  studentName: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
};

export type DayAvailability = {
  dayOfWeek: number;
  isAvailable: boolean;
  slots: { startTime: string; endTime: string; }[];
};

export type BlockedTime = {
  id: string;
  startDate: string;
  endDate: string;
  reason?: string;
};

// Context Type
type BookingContextType = {
  bookings: Booking[];
  blockedTimes: BlockedTime[];
  getAvailableTimeSlots: (date: Date) => Promise<TimeSlot[]>;
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
  markCompletedBookings: () => Promise<{ completedCount: number; completedBookings: Booking[] }>;
  revertCompletedBooking: (bookingId: string) => Promise<boolean>;
  fetchBlockedTimes: () => Promise<void>;
};

// Context
const BookingContext = createContext<BookingContextType | undefined>(undefined);

// Email function
const sendEmail = async (to: string, subject: string, body: string) => {
  try {
    const response = await supabase.functions.invoke('send-email', {
      body: { to, subject, body }
    });
    
    if (response.error) {
      console.error('Error sending email:', response.error);
    }
    
    return response;
  } catch (error) {
    console.error('Email function error:', error);
    return { error };
  }
};

// Provider
export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [availabilitySettings, setAvailabilitySettings] = useState<DayAvailability[]>([]);

  // Fetch blocked times on component mount
  useEffect(() => {
    fetchBlockedTimes();
  }, []);

  const fetchBlockedTimes = async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('blocked_times')
        .select('*')
        .order('start_date');

      if (error) throw error;

      const formattedBlockedTimes = data.map(item => ({
        id: item.id,
        startDate: item.start_date,
        endDate: item.end_date,
        reason: item.reason
      }));

      setBlockedTimes(formattedBlockedTimes);
    } catch (error) {
      console.error('Error fetching blocked times:', error);
    }
  };

  const getAvailableTimeSlots = async (date: Date): Promise<TimeSlot[]> => {
    try {
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
      
      return dayAvailability.slots?.map((slot: any) => {
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
      }) || [];
    } catch (error) {
      console.error('Error getting available time slots:', error);
      return [];
    }
  };

  const createBooking = async (
    studentId: string,
    studentName: string,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<Booking> => {
    try {
      // Get student's price
      const { data: studentData } = await supabase
        .from('profiles')
        .select('price')
        .eq('id', studentId)
        .single();

      const price = studentData?.price || 25.00;

      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          student_id: studentId,
          date,
          start_time: startTime,
          end_time: endTime,
          status: 'pending',
          price: price,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Find teacher and send notification/email
      const { data: teacherData, error: teacherError } = await supabase
        .from('profiles')
        .select('id, email, name')
        .eq('role', 'teacher')
        .single();

      if (!teacherError && teacherData) {
        // Create notification for teacher
        await supabase
          .from('notifications')
          .insert([{
            user_id: teacherData.id,
            type: 'booking',
            title: 'Nueva solicitud de clase',
            message: `${studentName} ha solicitado una clase para el ${format(new Date(date), 'dd/MM/yyyy')} de ${startTime} a ${endTime}`,
            link: '/teacher/dashboard'
          }]);

        // Send email to teacher
        const emailBody = `
          <h1>🎓 Nueva solicitud de clase</h1>
          <p>Hola ${teacherData.name},</p>
          <p>Has recibido una nueva solicitud de clase:</p>
          <ul>
            <li><strong>Estudiante:</strong> ${studentName}</li>
            <li><strong>Fecha:</strong> ${format(new Date(date), 'dd/MM/yyyy')}</li>
            <li><strong>Horario:</strong> ${startTime} – ${endTime}</li>
          </ul>
          <p>
            <a href="${window.location.origin}/teacher/dashboard">
              👉 Ir al panel de control
            </a>
          </p>
          <p>¡Gracias por usar ClassReserve! 🚀</p>
        `;

        await sendEmail(
          teacherData.email,
          '🎓 Nueva solicitud de clase',
          emailBody
        );
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
        price: data.price,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  };

  const confirmBooking = async (bookingId: string): Promise<boolean> => {
    try { 
      // Update the booking
      const { data: booking, error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          meeting_link: `https://meet.google.com/${Math.random().toString(36).substring(2, 10)}`
        })
        .eq('id', bookingId)
        .select('*')
        .single();

      if (updateError) throw updateError;

      // Get student profile
      const { data: studentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', booking.student_id)
        .single();

      if (profileError) {
        console.error('Error fetching student profile:', profileError);
        return true;
      }

      // Create notification for student
      await supabase
        .from('notifications')
        .insert([{
          user_id: booking.student_id,
          type: 'booking',
          title: 'Clase confirmada',
          message: `Tu clase para el ${format(new Date(booking.date), 'dd/MM/yyyy')} de ${booking.start_time} a ${booking.end_time} ha sido confirmada`,
          link: '/student/dashboard'
        }]);

      // Send email to student
      const emailBody = `
        <h1>✅ Clase confirmada</h1>
        <p>¡Hola ${studentProfile.name}!</p>
        <p>Tu clase ha sido confirmada:</p>
        <ul>
          <li><strong>Fecha:</strong> ${format(new Date(booking.date), 'dd/MM/yyyy')}</li>
          <li><strong>Horario:</strong> ${booking.start_time} - ${booking.end_time}</li>
          <li><strong>Enlace de videollamada:</strong> <a href="${booking.meeting_link}">${booking.meeting_link}</a></li>
        </ul>
        <p><strong>📝 Consejos para la clase:</strong></p>
        <ul>
          <li>Conéctate 5 minutos antes</li>
          <li>Asegúrate de tener buena conexión a internet</li>
          <li>Ten preparados tus materiales de estudio</li>
        </ul>
        <p>¡Te esperamos!</p>
        <p><a href="${window.location.origin}/student/dashboard">Accede a tu panel</a></p>
      `;

      await sendEmail(
        studentProfile.email,
        '✅ Clase confirmada',
        emailBody
      );

      return true;
    } catch (error) {
      console.error('Error confirming booking:', error);
      return false;
    }
  };

  const cancelBooking = async (bookingId: string, cancelledByTeacher: boolean = false): Promise<boolean> => {
    try {
      // Update the booking
      const { data: booking, error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .select('*')
        .single();

      if (updateError) throw updateError;

      // Get student profile
      const { data: studentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', booking.student_id)
        .single();

      if (profileError) {
        console.error('Error fetching student profile:', profileError);
        return true;
      }
      // --- Bloque para cancelación por parte del PROFESOR ---
      if (cancelledByTeacher) {
        // Envío email al alumno notificándole que el profesor canceló
        await sendEmail(
          studentProfile.email!,
          '❌ Clase cancelada por el profesor',
          `<h1>❌ Clase cancelada</h1>
           <p>Hola ${studentProfile.name},</p>
           <p>Tu clase programada para el <strong>${format(new Date(booking.date), 'dd/MM/yyyy')}</strong>
           de <strong>${booking.start_time}</strong> a <strong>${booking.end_time}</strong>
           ha sido cancelada por el profesor.</p>
           <p>Disculpa las molestias. Puedes ver más detalles en tu panel:</p>
           <p><a href="${window.location.origin}/student/dashboard">👉 Ir a mi panel</a></p>`
        );
        return true;
    }
// --- Fin del bloque para cancelación por PROFESOR ---

      // Get teacher profile and send notification/email
      const { data: teacherData, error: teacherError } = await supabase
        .from('profiles')
        .select('id, email, name')
        .eq('role', 'teacher')
        .single();

      if (!teacherError && teacherData) {
        // Create notification for teacher
        await supabase
          .from('notifications')
          .insert([{
            user_id: teacherData.id,
            type: 'cancellation',
            title: 'Clase cancelada',
            message: `${studentProfile.name} ha cancelado su clase del ${format(new Date(booking.date), 'dd/MM/yyyy')} de ${booking.start_time} a ${booking.end_time}`,
            link: '/teacher/dashboard'
          }]);

        // Send email to teacher
        const teacherEmailBody = `
          <h1>❌ Clase cancelada por el estudiante</h1>
          <p>Hola ${teacherData.name},</p>
          <p>El estudiante <strong>${studentProfile.name}</strong> ha cancelado su clase:</p>
          <ul>
            <li><strong>Fecha:</strong> ${format(new Date(booking.date), 'dd/MM/yyyy')}</li>
            <li><strong>Horario:</strong> ${booking.start_time} – ${booking.end_time}</li>
          </ul>
          <p>El horario queda disponible para nuevas reservas.</p>
          <p><a href="${window.location.origin}/teacher/dashboard">👉 Ver en mi panel</a></p>
        `;

        await sendEmail(
          teacherData.email,
          '❌ Clase cancelada por el estudiante',
          teacherEmailBody
        );
      }

      // Send email to student
      const studentEmailBody = `
        <h1>❌ Tu clase ha sido cancelada</h1>
        <p>Hola ${studentProfile.name},</p>
        <p>Tu clase del <strong>${format(new Date(booking.date), 'dd/MM/yyyy')}</strong> a las <strong>${booking.start_time}</strong> ha sido cancelada.</p>
        <p><a href="${window.location.origin}/student/dashboard">👉 Reservar nueva clase</a></p>
      `;

      await sendEmail(
        studentProfile.email,
        '❌ Clase cancelada',
        studentEmailBody
      );

      return true;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      return false;
    }
  };

  const markCompletedBookings = async (): Promise<{ completedCount: number; completedBookings: Booking[] }> => {
    try {
      const now = new Date();
      const currentDate = format(now, 'yyyy-MM-dd');
      const currentTime = format(now, 'HH:mm:ss');

      // Fetch confirmed bookings that should be completed
      const { data: bookingsToComplete, error: fetchError } = await supabase
        .from('bookings')
        .select('*, profiles(name, email)')
        .eq('status', 'confirmed')
        .or(`date.lt.${currentDate},and(date.eq.${currentDate},end_time.lt.${currentTime})`);

      if (fetchError) throw fetchError;

      if (!bookingsToComplete || bookingsToComplete.length === 0) {
        return { completedCount: 0, completedBookings: [] };
      }

      // Update bookings to completed status
      const bookingIds = bookingsToComplete.map(booking => booking.id);
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .in('id', bookingIds);

      if (updateError) throw updateError;

      // Send notifications and emails to students
      for (const booking of bookingsToComplete) {
        // Create notification for student
        await supabase
          .from('notifications')
          .insert([{
            user_id: booking.student_id,
            type: 'system',
            title: 'Clase completada',
            message: `Tu clase del ${format(new Date(booking.date), 'dd/MM/yyyy')} de ${booking.start_time} a ${booking.end_time} ha sido marcada como completada`,
            link: '/student/dashboard'
          }]);

        // Send email to student
        const emailBody = `
          <h1>✅ Clase completada</h1>
          <p>¡Hola ${booking.profiles.name}!</p>
          <p>Tu clase ha sido completada exitosamente:</p>
          <ul>
            <li><strong>Fecha:</strong> ${format(new Date(booking.date), 'dd/MM/yyyy')}</li>
            <li><strong>Horario:</strong> ${booking.start_time} - ${booking.end_time}</li>
          </ul>
          <p>¡Esperamos que hayas disfrutado la clase!</p>
          <p>¿Te gustaría reservar otra clase?</p>
          <p><a href="${window.location.origin}/student/dashboard">Accede a tu panel</a></p>
        `;

        await sendEmail(
          booking.profiles.email,
          '✅ Clase completada',
          emailBody
        );
      }

      const completedBookings = bookingsToComplete.map(booking => ({
        id: booking.id,
        studentId: booking.student_id,
        studentName: booking.profiles?.name || 'Unknown',
        date: booking.date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        status: 'completed' as const,
        meetingLink: booking.meeting_link,
        customMeetingLink: booking.custom_meeting_link,
        notes: booking.notes,
        price: booking.price,
        createdAt: booking.created_at
      }));

      return {
        completedCount: bookingsToComplete.length,
        completedBookings
      };
    } catch (error) {
      console.error('Error marking completed bookings:', error);
      return { completedCount: 0, completedBookings: [] };
    }
  };

  const revertCompletedBooking = async (bookingId: string): Promise<boolean> => {
    try {
      // Update the booking
      const { data: booking, error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .select('*')
        .single();

      if (updateError) throw updateError;

      // Get student profile
      const { data: studentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', booking.student_id)
        .single();

      if (profileError) {
        console.error('Error fetching student profile:', profileError);
        return true;
      }

      // Create notification for student
      await supabase
        .from('notifications')
        .insert([{
          user_id: booking.student_id,
          type: 'cancellation',
          title: 'Clase revertida',
          message: `Tu clase completada del <strong>${format(new Date(booking.date), 'dd/MM/yyyy')}</strong> de ${booking.start_time} a ${booking.end_time} ha sido revertida y cancelada`,
          link: '/student/dashboard'
        }]);

      // Send email to student
      const emailBody = `
        <h1>🔄 Clase revertida</h1>
        <p>Hola ${studentProfile.name},</p>
        <p>Tu clase completada ha sido revertida y cancelada:</p>
        <ul>
          <li><strong>Fecha:</strong> ${format(new Date(booking.date), 'dd/MM/yyyy')}</li>
          <li><strong>Horario:</strong> ${booking.start_time} - ${booking.end_time}</li>
        </ul>
        <p>Si tienes dudas sobre esta acción, por favor contacta con el profesor.</p>
        <p><a href="${window.location.origin}/student/dashboard">Accede a tu panel</a></p>
      `;

      await sendEmail(
        studentProfile.email,
        '🔄 Clase revertida',
        emailBody
      );

      return true;
    } catch (error) {
      console.error('Error reverting completed booking:', error);
      return false;
    }
  };

  const getStudentBookings = async (studentId: string): Promise<Booking[]> => {
    try {
      const { data, error } = await supabase
        .rpc('get_my_student_class_history', { input_student_id: studentId });

      if (error) {
        console.error('Error calling RPC function:', error);
        return [];
      }

      return data.map((booking: any) => ({
        id: booking.booking_id,
        studentId: booking.student_id,
        studentName: booking.student_name,
        date: booking.date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        status: booking.status,
        notes: booking.notes,
        price: booking.price,
        createdAt: booking.created_at
      }));
    } catch (error) {
      console.error('Error getting student bookings:', error);
      return [];
    }
  };

  const getTeacherBookings = async (): Promise<Booking[]> => {
    try {
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
        studentName: booking.profiles?.name || 'Unknown',
        date: booking.date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        status: booking.status,
        meetingLink: booking.meeting_link,
        customMeetingLink: booking.custom_meeting_link,
        notes: booking.notes,
        price: booking.price,
        createdAt: booking.created_at
      }));
    } catch (error) {
      console.error('Error getting teacher bookings:', error);
      return [];
    }
  };

  const getPendingBookings = async (): Promise<Booking[]> => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, profiles(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching pending bookings:', error);
        return [];
      }

      return data.map(booking => ({
        id: booking.id,
        studentId: booking.student_id,
        studentName: booking.profiles?.name || 'Unknown',
        date: booking.date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        status: booking.status,
        notes: booking.notes,
        price: booking.price,
        createdAt: booking.created_at
      }));
    } catch (error) {
      console.error('Error getting pending bookings:', error);
      return [];
    }
  };

  const getBookingsByDate = async (date: Date): Promise<Booking[]> => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, profiles(name)')
        .eq('date', format(date, 'yyyy-MM-dd'))
        .order('start_time');

      if (error) {
        console.error('Error fetching bookings by date:', error);
        return [];
      }

      return data.map(booking => ({
        id: booking.id,
        studentId: booking.student_id,
        studentName: booking.profiles?.name || 'Unknown',
        date: booking.date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        status: booking.status,
        meetingLink: booking.meeting_link,
        customMeetingLink: booking.custom_meeting_link,
        notes: booking.notes,
        price: booking.price,
        createdAt: booking.created_at
      }));
    } catch (error) {
      console.error('Error getting bookings by date:', error);
      return [];
    }
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
      
      await fetchBlockedTimes();
      return true;
    } catch (error) {
      console.error('Error unblocking time slot:', error);
      return false;
    }
  };

  const isTimeBlocked = (date: Date): boolean => {
    return blockedTimes.some(block => {
      const startDate = new Date(block.startDate);
      const endDate = new Date(block.endDate);
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

  const contextValue = {
    bookings: [],
    blockedTimes,
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
  };

  return (
    <BookingContext.Provider value={contextValue}>
      {children}
    </BookingContext.Provider>
  );
};

// Hook personalizado - ESTA ES LA EXPORTACIÓN PRINCIPAL
export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};