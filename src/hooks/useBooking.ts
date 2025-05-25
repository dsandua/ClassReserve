import { useBookingContext } from '../context/BookingContext';

export const useBooking = () => {
  return useBookingContext();
};