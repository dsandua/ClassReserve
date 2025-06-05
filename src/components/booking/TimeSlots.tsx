import { format, parseISO, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { TimeSlot } from '../../context/BookingContext';

type TimeSlotsProps = {
  date: Date;
  timeSlots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
};

const TimeSlots = ({ date, timeSlots = [], selectedSlot, onSelectSlot }: TimeSlotsProps) => {
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

    // Only allow selection if slot is available
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

  // Get the appropriate class names and status text for each slot
  const getSlotInfo = (slot: TimeSlot) => {
    const isPast = isSlotPast(slot);
    const isSelected = isSlotSelected(slot);
    const isAvailable = slot.isAvailable;

    let className = 'block w-full py-3 px-4 text-center rounded-md border transition-colors focus:outline-none ';
    let statusText = null;
    let disabled = false;

    if (isPast) {
      className += 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed';
      statusText = 'Hora pasada';
      disabled = true;
    } else if (!isAvailable) {
      className += 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed';
      statusText = 'No disponible';
      disabled = true;
    } else if (isSelected) {
      className += 'bg-primary-50 border-primary-500 text-primary-700 ring-2 ring-primary-500';
    } else {
      className += 'border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 cursor-pointer focus:ring-2 focus:ring-primary-500';
    }

    return { className, statusText, disabled };
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 capitalize">
          {formattedDate}
        </h2>
      </div>
      
      <div className="p-4">
        {!Array.isArray(timeSlots) || timeSlots.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay horarios disponibles para este día.</p>
            <p className="text-gray-500 text-sm mt-2">Por favor, selecciona otro día del calendario.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {timeSlots.map((slot) => {
              const { className, statusText, disabled } = getSlotInfo(slot);
              
              return (
                <button
                  key={slot.id}
                  onClick={() => handleSelectSlot(slot)}
                  disabled={disabled}
                  className={className}
                >
                  <div className="font-medium">
                    {slot.startTime} - {slot.endTime}
                  </div>
                  {statusText && (
                    <div className="text-xs mt-1 opacity-75">
                      {statusText}
                    </div>
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