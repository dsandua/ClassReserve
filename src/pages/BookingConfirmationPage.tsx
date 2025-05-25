import { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, ArrowLeft } from 'lucide-react';
import { Booking } from '../context/BookingContext';

const BookingConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking as Booking | undefined;
  
  // Redirect if there's no booking data
  useEffect(() => {
    if (!booking) {
      navigate('/booking');
    }
  }, [booking, navigate]);
  
  if (!booking) {
    return null;
  }
  
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-success-600" />
          </div>
        </div>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">¡Reserva enviada con éxito!</h1>
        <p className="mt-2 text-gray-600">
          Tu solicitud ha sido enviada y está pendiente de confirmación por parte del profesor.
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalles de la reserva</h2>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">Fecha</p>
                <p className="text-sm text-gray-900">
                  {new Date(booking.date).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">Hora</p>
                <p className="text-sm text-gray-900">
                  {booking.startTime} - {booking.endTime}
                </p>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Nota importante</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Recibirás un email de confirmación una vez que el profesor acepte tu solicitud. También se creará automáticamente un evento en tu calendario con los detalles de la clase.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
          <Link
            to="/booking"
            className="flex items-center text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a reservas
          </Link>
          
          <Link
            to="/student/dashboard"
            className="btn btn-primary"
          >
            Ir a mi panel
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;