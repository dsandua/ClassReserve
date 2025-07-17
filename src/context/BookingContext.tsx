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
  slots: { startTime: string; endTime: string }[];
};

export type BlockedTime = {
  id: string;
  startDate: string;
  endDate: string;
  reason?: string;
};

// Context Type
export type BookingContextType = {
  bookings: Booking[];
  blockedTimes: BlockedTime[];
  getAvailableTimeSlots: (date: Date) => Promise<TimeSlot[]>;
  createBooking: (
    studentId: string,
    studentName: string,
    date: string,
    startTime: string,
    endTime: string
  ) => Promise<Booking>;
  confirmBooking: (bookingId: string) => Promise<boolean>;
  cancelBooking: (bookingId: string) => Promise<boolean>;
  getStudentBookings: (studentId: string) => Promise<Booking[]>;
  getTeacherBookings: () => Promise<Booking[]>;
  getPendingBookings: () => Promise<Booking[]>;
  getBookingsByDate: (date: Date) => Promise<Booking[]>;
  blockTimeSlot: (
    startDate: string,
    endDate: string,
    reason?: string
  ) => Promise<boolean>;
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

// Email helper
type EmailPayload = { to: string; subject: string; body: string };
const sendEmail = (payload: EmailPayload) =>
  supabase.functions.invoke('send-email', { body: payload });

// Provider
export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [availabilitySettings, setAvailabilitySettings] = useState<DayAvailability[]>([]);

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
      setBlockedTimes(
        data.map(item => ({
          id: item.id,
          startDate: item.start_date,
          endDate: item.end_date,
          reason: item.reason,
        }))
      );
    } catch (err) {
      console.error('Error fetching blocked times:', err);
    }
  };

  const isTimeBlocked = (date: Date): boolean =>
    blockedTimes.some(block => {
      const start = new Date(block.startDate);
      const end = new Date(block.endDate);
      return date >= start && date <= end;
    });

  const getAvailableTimeSlots = async (date: Date): Promise<TimeSlot[]> => {
    const dayOfWeek = date.getDay();
    const { data: avail } = await supabase
      .from('availability')
      .select('*')
      .eq('day_of_week', dayOfWeek);
    const dayAvail = avail?.[0];
    if (!dayAvail || !dayAvail.is_available) return [];
    if (isTimeBlocked(date)) return [];
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('date', format(date, 'yyyy-MM-dd'))
      .neq('status', 'cancelled');
    return (
      dayAvail.slots.map(slot => ({
        id: `${format(date, 'yyyy-MM-dd')}-${slot.startTime}`,
        date: format(date, 'yyyy-MM-dd'),
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAvailable: !bookings?.some(
          b => b.start_time === slot.startTime && b.end_time === slot.endTime
        ),
      })) || []
    );
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
      .insert([
        {
          student_id: studentId,
          date,
          start_time: startTime,
          end_time: endTime,
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();
    if (error) throw error;

    const { data: teacher } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('role', 'teacher')
      .single();
    if (teacher) {
      await supabase.from('notifications').insert({
        user_id: teacher.id,
        type: 'booking',
        title: 'Nueva solicitud de clase',
        message: `${studentName} ha solicitado clase para el ${date} de ${startTime} a ${endTime}`,
        link: '/teacher/dashboard',
      });
      const htmlProf = `
        <h1>🎓 Nueva solicitud de clase</h1>
        <p>Hola ${teacher.name},</p>
        <ul>
          <li><strong>Estudiante:</strong> ${studentName}</li>
          <li><strong>Fecha:</strong> ${date}</li>
          <li><strong>Horario:</strong> ${startTime}–${endTime}</li>
          <li><strong>ID:</strong> ${data.id}</li>
        </ul>
        <p><a href="${window.location.origin}/teacher/dashboard">Ver panel</a></p>
      `;
      await sendEmail({ to: teacher.email, subject: '🎓 Nueva solicitud de clase', body: htmlProf });
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
      createdAt: data.created_at,
    };
  };

  const confirmBooking = async (bookingId: string): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          meeting_link: `https://meet.google.com/${Math.random().toString(36).substr(2, 8)}`,
        })
        .eq('id', bookingId)
        .select()
        .single();
      const { data: student } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', data.student_id)
        .single();
      if (student) {
        await supabase.from('notifications').insert({
          user_id: data.student_id,
          type: 'booking',
          title: 'Clase confirmada',
          message: `Tu clase el ${data.date} de ${data.start_time} a ${data.end_time} está confirmada`,
          link: '/student/dashboard',
        });
        const htmlStud = `
          <h1>✅ Clase confirmada</h1>
          <p>Hola ${student.name},</p>
          <p>Tu clase está confirmada. Enlace: <a href="${data.meeting_link}">${data.meeting_link}</a></p>
        `;
        await sendEmail({ to: student.email, subject: '✅ Clase confirmada', body: htmlStud });
      }
      return true;
    } catch (err) {
      console.error('Error confirming:', err);
      return false;
    }
  };

  const cancelBooking = async (bookingId: string): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .select()
        .single();
      const { data: student } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', data.student_id)
        .single();
      const { data: teacher } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('role', 'teacher')
        .single();
      if (teacher && student) {
        await supabase.from('notifications').insert({
          user_id: teacher.id,
          type: 'cancellation',
          title: 'Clase cancelada',
          message: `${student.name} canceló su clase el ${data.date}`,
          link: '/teacher/dashboard',
        });
        const htmlT = `
          <h1>❌ Clase cancelada</h1>
          <p>Hola ${teacher.name}, el estudiante ${student.name} ha cancelado su clase.</p>
        `;
        await sendEmail({ to: teacher.email, subject: '❌ Clase cancelada', body: htmlT });
      }
      if (student) {
        await supabase.from('notifications').insert({
          user_id: student.id,
          type: 'cancellation',
          title: 'Tu clase ha sido cancelada',
          message: `Tu clase el ${data.date} ha sido cancelada`,
          link: '/student/dashboard',
        });
        const htmlS = `
          <h1>❌ Cancelación exitosa</h1>
          <p>Hola ${student.name}, tu clase ha sido cancelada.</p>
        `;
        await sendEmail({ to: student.email, subject: '❌ Clase cancelada', body: htmlS });
      }
      return true;
    } catch (err) {
      console.error('Error cancelling:', err);
      return false;
    }
  };

  const getStudentBookings = async (studentId: string): Promise<Booking[]> => {
    const { data, error } = await supabase
      .rpc('get_my_student_class_history', { input_student_id: studentId });
    if (error) { console.error(error); return []; }
    return data.map((b: any) => ({
      id: b.booking_id,
      studentId: b.student_id,
      studentName: b.student_name,
      date: b.date,
      startTime: b.start_time,
      endTime: b.end_time,
      status: b.status,
      notes: b.notes,
      price: b.price,
      createdAt: b.created_at,
    }));
  };

  const getTeacherBookings = async (): Promise<Booking[]> => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, profiles(name)')
      .order('date', { ascending: false });
    if (error) { console.error(error); return []; }
    return data.map((b: any) => ({
      id: b.id,
      studentId: b.student_id,
      studentName: b.profiles.name,
      date: b.date,
      startTime: b.start_time,
      endTime: b.end_time,
      status: b.status,
      meetingLink: b.meeting_link,
      customMeetingLink: b.custom_meeting_link,
      notes: b.notes,
      price: b.price,
      createdAt: b.created_at,
    }));
  };

  const getPendingBookings = async (): Promise<Booking[]> => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, profiles(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    if (error) { console.error(error); return []; }
    return data.map((b: any) => ({
      id: b.id,
      studentId: b.student_id,
      studentName: b.profiles.name,
      date: b.date,
      startTime: b.start_time,
      endTime: b.end_time,
      status: b.status,
      notes: b.notes,
      price: b.price,
      createdAt: b.created_at,
    }));
  };

  const getBookingsByDate = async (date: Date): Promise<Booking[]> => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, profiles(name)')
      .eq('date', format(date, 'yyyy-MM-dd'))
      .order('start_time');
    if (error) { console.error(error); return []; }
    return data.map((b: any) => ({
      id: b.id,
      studentId: b.student_id,
      studentName: b.profiles.name,
      date: b.date,
      startTime: b.start_time,
      endTime: b.end_time,
      status: b.status,
      meetingLink: b.meeting_link,
      customMeetingLink: b.custom_meeting_link,
      notes: b.notes,
      price: b.price,
      createdAt: b.created_at,
    }));
  };

  const blockTimeSlot = async (
    startDate: string,
    endDate: string,
    reason?: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
<|diff_marker|> ADD A1000
        .from('blocked_times')
        .insert([{ start_date: startDate, end_date: endDate, reason }]);
      if (error) throw error;
      await fetchBlockedTimes();
      return true;
    } catch {
      return false;
    }
  };

  const unblockTimeSlot = async (
    startDate: string,
    endDate: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('blocked_times')
        .delete()
        .gte('start_date', startDate)
        .lte('end_date', endDate);
      if (error) throw error;
      await fetchBlockedTimes();
      return true;
    } catch {
      return false;
    }
  };

  const updateAvailabilitySettings = async (
    settings: DayAvailability[]
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('availability')
        .upsert(
          settings.map(s => ({
            day_of_week: s.dayOfWeek,
            is_available: s.isAvailable,
            slots: s.slots,
          }))
        );
      if (error) throw error;
      setAvailabilitySettings(settings);
      return true;
    } catch {
      return false;
    }
  };

  const updateMeetingLink = async (
    bookingId: string,
    meetingLink: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ custom_meeting_link: meetingLink })
        .eq('id', bookingId);
      if (error) throw error;
      return true;
    } catch {
      return false;
    }
  };

  const markCompletedBookings = async (): Promise<{ completedCount: number; completedBookings: Booking[] }> => {
    try {
      const now = new Date();
      const today = format(now, 'yyyy-MM-dd');
      const currentTime = format(now, 'HH:mm:ss');
      const { data: toComplete, error } = await supabase
        .from('bookings')
        .select('*, profiles(name, email)')
        .eq('status', 'confirmed')
        .or(`date.lt.${today},and(date.eq.${today},end_time.lt.${currentTime})`);
      if (error) throw error;
      if (!toComplete.length) return { completedCount: 0, completedBookings: [] };
      const ids = toComplete.map(b => b.id);
      await supabase.from('bookings').update({ status: 'completed' }).in('id', ids);
      for (const b of toComplete) {
        await supabase.from('notifications').insert({
          user_id: b.student_id,
          type: 'system',
          title: 'Clase completada',
          message: `Tu clase del ${b.date} ha sido marcada como completada`,
          link: '/student/dashboard',
        });
        await sendEmail({
          to: b.profiles.email,
          subject: '✅ Clase completada',
          body: `<p>Hola ${b.profiles.name}, tu clase ha sido completada.</p>`,
        });
      }
      return { completedCount: ids.length, completedBookings: toComplete.map(b => ({
        id: b.id,
        studentId: b.student_id,
        studentName: b.profiles.name,
        date: b.date,
        startTime: b.start_time,
        endTime: b.end_time,
        status: 'completed',
        meetingLink: b.meeting_link,
        customMeetingLink: b.custom_meeting_link,
        notes: b.notes,
        price: b.price,
        createdAt: b.created_at,
      })) };
    } catch {
      return { completedCount: 0, completedBookings: [] };
    }
  };

  const revertCompletedBooking = async (bookingId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .select()
        .single();
      if (error) throw error;
      const { data: student } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', data.student_id)
        .single();
      if (student) {
        await supabase.from('notifications').insert({
          user_id: data.student_id,
          type: 'cancellation',
          title: 'Clase revertida',
          message: `Tu clase del ${data.date} ha sido revertida`,
          link: '/student/dashboard',
        });
        await sendEmail({
          to: student.email,
          subject: '🔄 Clase revertida',
          body: `<p>Hola ${student.name}, tu clase ha sido revertida y cancelada.</p>`,
        });
      }
      return true;
    } catch {
      return false;
    }
  };

  const contextValue: BookingContextType = {
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

export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBooking must be used within BookingProvider');
  return context;
};
