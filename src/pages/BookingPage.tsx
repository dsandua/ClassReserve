import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from '../components/booking/Calendar';
import TimeSlots from '../components/booking/TimeSlots';
import BookingForm from '../components/booking/BookingForm';
import { TimeSlot } from '../context/BookingContext';
import { useBookingContext as useBooking } from '../../context/BookingContext';
import { useAuth } from '../hooks/useAuth';

const BookingPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const { getAvailableTimeSlots } = useBooking();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Fetch available time slots when selected date changes
  useEffect(() => {
    const fetchTimeSlots = async () => {
      try {
        setIsLoadingSlots(true);
        setSelectedSlot(null); // Reset selected slot when date changes
        
        const slots = await getAvailableTimeSlots(selectedDate);
        setAvailableSlots(Array.isArray(slots) ? slots : []);
      } catch (error) {
        console.error('Error fetching time slots:', error);
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchTimeSlots();
  }, [selectedDate, getAvailableTimeSlots]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/booking' } });
    }
  }, [isAuthenticated, navigate]);

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  // Handle time slot selection
  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reserva tu clase</h1>
        <p className="mt-2 text-lg text-gray-600">
          Selecciona la fecha y hora que mejor se adapte a tu horario
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Calendar column */}
        <div className="md:col-span-5 lg:col-span-4">
          <Calendar 
            selectedDate={selectedDate}
            onSelectDate={handleDateSelect}
          />
        </div>
        
        {/* Time slots column */}
        <div className="md:col-span-7 lg:col-span-4">
          <TimeSlots 
            date={selectedDate}
            timeSlots={availableSlots}
            selectedSlot={selectedSlot}
            onSelectSlot={handleSlotSelect}
            isLoading={isLoadingSlots}
          />
        </div>
        
        {/* Booking form column - only show when slot is selected */}
        {selectedSlot && (
          <div className="md:col-span-12 lg:col-span-4">
            <BookingForm 
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;