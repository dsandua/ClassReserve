import { User } from '../context/AuthContext';
import { Booking, DayAvailability, BlockedTime } from '../context/BookingContext';
import { addDays, subDays, format } from 'date-fns';

// Mock users data
export const mockUsers: User[] = [
  {
    id: 'teacher-1',
    name: 'David Sandua',
    email: 'dsandua@gmail.com',
    role: 'teacher',
    avatar: 'https://i.imgur.com/eu71Dhz.jpeg?auto=compress&cs=tinysrgb&w=150',
  },
  {
    id: 'student-1',
    name: 'María López',
    email: 'maria@example.com',
    role: 'student',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
  },
  {
    id: 'student-2',
    name: 'Juan Pérez',
    email: 'juan@example.com',
    role: 'student',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
  },
];

// Mock availability settings
export const mockAvailabilitySettings: DayAvailability[] = [
  { 
    dayOfWeek: 0, // Sunday
    isAvailable: false,
    slots: []
  },
  { 
    dayOfWeek: 1, // Monday
    isAvailable: true,
    slots: [
      { startTime: '09:00', endTime: '10:00' },
      { startTime: '10:00', endTime: '11:00' },
      { startTime: '11:00', endTime: '12:00' },
      { startTime: '15:00', endTime: '16:00' },
      { startTime: '16:00', endTime: '17:00' },
      { startTime: '17:00', endTime: '18:00' },
    ]
  },
  { 
    dayOfWeek: 2, // Tuesday
    isAvailable: true,
    slots: [
      { startTime: '09:00', endTime: '10:00' },
      { startTime: '10:00', endTime: '11:00' },
      { startTime: '11:00', endTime: '12:00' },
      { startTime: '15:00', endTime: '16:00' },
      { startTime: '16:00', endTime: '17:00' },
      { startTime: '17:00', endTime: '18:00' },
    ]
  },
  { 
    dayOfWeek: 3, // Wednesday
    isAvailable: true,
    slots: [
      { startTime: '09:00', endTime: '10:00' },
      { startTime: '10:00', endTime: '11:00' },
      { startTime: '11:00', endTime: '12:00' },
      { startTime: '15:00', endTime: '16:00' },
      { startTime: '16:00', endTime: '17:00' },
      { startTime: '17:00', endTime: '18:00' },
    ]
  },
  { 
    dayOfWeek: 4, // Thursday
    isAvailable: true,
    slots: [
      { startTime: '09:00', endTime: '10:00' },
      { startTime: '10:00', endTime: '11:00' },
      { startTime: '11:00', endTime: '12:00' },
      { startTime: '15:00', endTime: '16:00' },
      { startTime: '16:00', endTime: '17:00' },
      { startTime: '17:00', endTime: '18:00' },
    ]
  },
  { 
    dayOfWeek: 5, // Friday
    isAvailable: true,
    slots: [
      { startTime: '09:00', endTime: '10:00' },
      { startTime: '10:00', endTime: '11:00' },
      { startTime: '11:00', endTime: '12:00' },
      { startTime: '15:00', endTime: '16:00' },
      { startTime: '16:00', endTime: '17:00' },
    ]
  },
  { 
    dayOfWeek: 6, // Saturday
    isAvailable: false,
    slots: []
  }
];

// Mock blocked times
export const mockBlockedTimes: BlockedTime[] = [
  {
    id: 'block-1',
    startDate: format(addDays(new Date(), 10), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 17), 'yyyy-MM-dd'),
    reason: 'Vacaciones',
  },
  {
    id: 'block-2',
    startDate: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
    reason: 'Día festivo',
  },
];

// Mock bookings data
export const mockBookings: Booking[] = [
  {
    id: 'booking-1',
    studentId: 'student-1',
    studentName: 'María López',
    date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    startTime: '10:00',
    endTime: '11:00',
    status: 'confirmed',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    notes: 'Primera clase de introducción',
    createdAt: subDays(new Date(), 7).toISOString(),
  },
  {
    id: 'booking-2',
    studentId: 'student-2',
    studentName: 'Juan Pérez',
    date: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
    startTime: '15:00',
    endTime: '16:00',
    status: 'pending',
    createdAt: subDays(new Date(), 2).toISOString(),
  },
  {
    id: 'booking-3',
    studentId: 'student-1',
    studentName: 'María López',
    date: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
    startTime: '11:00',
    endTime: '12:00',
    status: 'completed',
    meetingLink: 'https://meet.google.com/klm-nopq-rst',
    notes: 'Repaso general de conceptos',
    createdAt: subDays(new Date(), 15).toISOString(),
  },
  {
    id: 'booking-4',
    studentId: 'student-2',
    studentName: 'Juan Pérez',
    date: format(subDays(new Date(), 10), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    status: 'cancelled',
    createdAt: subDays(new Date(), 20).toISOString(),
  },
];