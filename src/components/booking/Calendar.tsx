import { useState, useEffect } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  isBefore,
  startOfDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useBookingContext as useBooking } from '../../context/BookingContext';

type CalendarProps = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
};

const Calendar = ({ selectedDate, onSelectDate }: CalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const { isTimeBlocked } = useBooking();

  // Generate days for the current month view
  useEffect(() => {
    const days = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });
    setCalendarDays(days);
  }, [currentMonth]);

  // Navigation functions
  const previousMonth = () => {
    const prevMonth = subMonths(currentMonth, 1);
    if (!isBefore(endOfMonth(prevMonth), startOfDay(new Date()))) {
      setCurrentMonth(prevMonth);
    }
  };
  
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Day selection
  const handleSelectDay = (day: Date) => {
    // Prevent selecting dates in the past
    if (isBefore(day, startOfDay(new Date())) || isTimeBlocked(day)) {
      return;
    }
    onSelectDate(day);
  };

  // Helper to get class names for a day
  const getDayClassNames = (day: Date) => {
    const isSelected = isSameDay(day, selectedDate);
    const isPast = isBefore(day, startOfDay(new Date()));
    const isBlocked = isTimeBlocked(day);
    const isCurrentMonth = isSameMonth(day, currentMonth);
    const isCurrentDay = isToday(day);
    
    let className = 'relative w-full h-10 flex items-center justify-center text-sm';
    
    // Base styling
    if (!isCurrentMonth) {
      className += ' text-gray-300';
    } else if (isPast || isBlocked) {
      className += ' text-gray-400 cursor-not-allowed bg-gray-50';
    } else {
      className += ' text-gray-700 hover:bg-gray-100 cursor-pointer';
    }
    
    // Selected day
    if (isSelected && !isPast) {
      className += ' bg-primary-600 text-white hover:bg-primary-700';
    }
    
    // Today
    if (isCurrentDay && !isSelected) {
      className += ' font-bold text-primary-600';
    }
    
    return className;
  };

  const weekDays = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

  return (
    <div className="calendar-container rounded-lg bg-white border border-gray-200 shadow-sm">
      {/* Calendar header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={previousMonth}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5 text-gray-500" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>
      
      {/* Calendar grid */}
      <div className="p-3">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-xs font-medium text-gray-500 text-center py-1">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {/* Add empty cells for days before the start of the month */}
          {Array.from({ length: startOfMonth(currentMonth).getDay() === 0 ? 6 : startOfMonth(currentMonth).getDay() - 1 }).map((_, index) => (
            <div key={`empty-start-${index}`} className="h-10" />
          ))}
          
          {/* Render the actual days */}
          {calendarDays.map((day) => (
            <button
              key={day.toString()}
              onClick={() => handleSelectDay(day)}
              className={getDayClassNames(day)}
              disabled={isBefore(day, startOfDay(new Date())) || isTimeBlocked(day)}
            >
              {format(day, 'd')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Calendar;