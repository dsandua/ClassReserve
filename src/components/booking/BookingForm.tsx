import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TimeSlot, Booking } from '../../context/BookingContext';
import { useAuth } from '../../hooks/useAuth';
import { useBooking } from '../../hooks/useBooking';
import toast from 'react-hot-toast';

type BookingFormProps = {
  selectedDate: Date;
  selectedSlot: TimeSlot;
};

const BookingForm = ({ selectedDate, selectedSlot }: BookingFormProps) => {
  const { user } = useAuth();
  const { createBooking } = useBooking();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Debes iniciar sesión para reservar una clase');
      navigate('/login');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const booking = await createBooking(
        user.id,
        user.name,
        selectedSlot.date,
        selectedSlot.startTime,
        selectedSlot.endTime
      );
      
      // Navigate to confirmation page with booking details
      navigate('/booking/confirmation', { 
        state: { booking }
      });
      
      toast.success('¡Reserva enviada con éxito!');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Ha ocurrido un error. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Confirmar reserva</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="rounded-md bg-gray-50 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Fecha</p>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedSlot.date).toLocaleDateString('es-ES', {
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Hora</p>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedSlot.startTime} - {selectedSlot.endTime}
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notas (opcional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="mt-1 input"
              placeholder="Añade cualquier información adicional aquí..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          
          <div className="rounded-md bg-blue-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1 md:flex md:justify-between">
                <p className="text-sm text-blue-700">
                  Tu reserva estará pendiente hasta que el profesor la confirme.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            type="submit"
            className="w-full btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar solicitud de reserva'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;