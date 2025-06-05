import { format, parseISO, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { TimeSlot } from '../../context/BookingContext';

type TimeSlotsProps = {
  date: Date;
  timeSlots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  isLoading?: boolean;
};

const TimeSlots = ({ 
  date, 
  timeSlots = [], 
  selectedSlot, 
  onSelectSlot,
  isLoading = false 
}: TimeSlotsProps) => {
  // Format the date for display
  const formattedDate = format(date, "EEEE, d 'de' MMMM", { locale: es });
  
  // Handle time slot selection
  const handleSelectSlot = (slot: TimeSlot) => {
    const now = new Date();
    const slotDate = parseISO(slot.date);
    const [hours, minutes] = slot.startTime.split(':').map(Number);
    const slotDateTime = new Date(slotDate);
    slotDateTime.setHours(hours, minutes);

    // Check if slot is in the past
    if (isBefore(slotDateTime, now)) {
      return;
    }

    if (slot.isAvailable) {
      onSelectSlot(slot);
    }
  };
  
  // Check if a slot is selected
  const isSlotSelected = (slot: TimeSlot) => {
    if (!selectedSlot) return false;
    return selectedSlot.id === slot.id;
  };

  // Check if a slot is in the past
  const isSlotPast = (slot: TimeSlot) => {
    const now = new Date();
    const slotDate = parseISO(slot.date);
    const [hours, minutes] = slot.startTime.split(':').map(Number);
    const slotDateTime = new Date(slotDate);
    slotDateTime.setHours(hours, minutes);
    return isBefore(slotDateTime, now);
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 capitalize">
          {formattedDate}
        </h2>
      </div>
      
      <div className="p-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Cargando horarios disponibles...</p>
          </div>
        ) : !Array.isArray(timeSlots) || timeSlots.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay horarios disponibles para este día.</p>
            <p className="text-gray-500 text-sm mt-2">Por favor, selecciona otro día del calendario.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {timeSlots.map((slot) => {
              const isPast = isSlotPast(slot);
              return (
                <button
                  key={slot.id}
                  onClick={() => handleSelectSlot(slot)}
                  disabled={!slot.isAvailable || isPast}
                  className={`
                    time-slot 
                    ${isSlotSelected(slot) ? 'time-slot-selected' : ''} 
                    ${!slot.isAvailable || isPast ? 'time-slot-unavailable' : ''}
                  `}
                >
                  {slot.startTime} - {slot.endTime}
                  {isPast && (
                    <span className="text-xs text-gray-500 block">
                      Hora pasada
                    </span>
                  )}
                  {!slot.isAvailable && !isPast && (
                    <span className="text-xs text-gray-500 block">
                      Ocupado
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeSlots;