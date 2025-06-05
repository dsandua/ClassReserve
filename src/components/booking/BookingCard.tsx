import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, Check, X, Calendar, Video, Link as LinkIcon } from 'lucide-react';
import { Booking } from '../../context/BookingContext';
import { useState } from 'react';
import { useBooking } from '../hooks/useBooking';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

type BookingCardProps = {
  booking: Booking;
  isTeacher?: boolean;
  onConfirm?: (bookingId: string) => void;
  onCancel?: (bookingId: string) => void;
};

const BookingCard = ({ 
  booking, 
  isTeacher = false,
  onConfirm,
  onCancel
}: BookingCardProps) => {
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [meetingLink, setMeetingLink] = useState(booking.customMeetingLink || booking.meetingLink || '');
  const [isCancelling, setIsCancelling] = useState(false);
  const { updateMeetingLink, cancelBooking } = useBooking();
  const { user } = useAuth();
  const bookingDate = parseISO(booking.date);
  
  // Format date and time for display
  const formattedDate = format(bookingDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  
  // Get status badge color and text
  const getStatusInfo = () => {
    switch (booking.status) {
      case 'pending':
        return {
          color: 'bg-warning-100 text-warning-800',
          text: 'Pendiente'
        };
      case 'confirmed':
        return {
          color: 'bg-success-100 text-success-800',
          text: 'Confirmada'
        };
      case 'cancelled':
        return {
          color: 'bg-error-100 text-error-800',
          text: 'Cancelada'
        };
      case 'completed':
        return {
          color: 'bg-accent-100 text-accent-800',
          text: 'Completada'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          text: 'Desconocido'
        };
    }
  };

  const handleUpdateMeetingLink = async () => {
    try {
      const success = await updateMeetingLink(booking.id, meetingLink);
      if (success) {
        setIsEditingLink(false);
        toast.success('Enlace de videollamada actualizado');
      }
    } catch (error) {
      console.error('Error updating meeting link:', error);
      toast.error('Error al actualizar el enlace');
    }
  };

  const handleCancelBooking = async () => {
    if (isCancelling) return;
    
    try {
      setIsCancelling(true);
      const success = await cancelBooking(booking.id);
      
      if (success) {
        toast.success('Clase cancelada con éxito');
        if (onCancel) {
          onCancel(booking.id);
        }
      } else {
        toast.error('No se pudo cancelar la clase');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Error al cancelar la clase');
    } finally {
      setIsCancelling(false);
    }
  };
  
  const statusInfo = getStatusInfo();
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Card header with status badge */}
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
          {statusInfo.text}
        </span>
        <span className="text-sm text-gray-500">
          {new Date(booking.createdAt).toLocaleDateString()}
        </span>
      </div>
      
      {/* Card content */}
      <div className="p-4">
        <div className="space-y-3">
          {isTeacher && (
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {booking.studentName?.charAt(0) ?? ''}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{booking.studentName}</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-gray-500" />
            <span className="ml-2 text-sm text-gray-700 capitalize">{formattedDate}</span>
          </div>
          
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-gray-500" />
            <span className="ml-2 text-sm text-gray-700">{booking.startTime} - {booking.endTime}</span>
          </div>
          
          {booking.status === 'confirmed' && (
            <div>
              {isTeacher && isEditingLink ? (
                <div className="mt-2 flex items-center space-x-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      placeholder="Introduce el enlace de la videollamada"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                  <button
                    onClick={handleUpdateMeetingLink}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setIsEditingLink(false)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-2">
                  <a 
                    href={booking.meetingLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                  >
                    <Video className="h-4 w-4 mr-1" />
                    Unirse a videollamada
                  </a>
                  {isTeacher && (
                    <button
                      onClick={() => setIsEditingLink(true)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Editar enlace"
                    >
                      <LinkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          
          {booking.notes && (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <p className="text-sm text-gray-500">{booking.notes}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Card actions */}
      {(isTeacher ? booking.status === 'pending' : booking.status === 'pending' || booking.status === 'confirmed') && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex space-x-3">
          {isTeacher && booking.status === 'pending' && onConfirm && onCancel && (
            <>
              <button
                onClick={() => onConfirm(booking.id)}
                className="flex items-center justify-center btn btn-success flex-1"
              >
                <Check className="h-4 w-4 mr-1" />
                Confirmar
              </button>
              <button
                onClick={() => onCancel(booking.id)}
                className="flex items-center justify-center btn btn-error flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                Rechazar
              </button>
            </>
          )}
          {!isTeacher && (booking.status === 'pending' || booking.status === 'confirmed') && (
            <button
              onClick={handleCancelBooking}
              disabled={isCancelling}
              className="flex items-center justify-center btn btn-error w-full"
            >
              <X className="h-4 w-4 mr-1" />
              {isCancelling ? 'Cancelando...' : 'Cancelar clase'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingCard;