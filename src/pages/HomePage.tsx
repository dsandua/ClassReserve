import { Link } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, Users } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="bg-white">
      {/* Hero section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:max-w-lg">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Gestiona tus clases particulares
              </h1>
              <p className="mt-4 text-lg text-primary-100">
                Plataforma de reservas para profesores y alumnos que simplifica la gestión de clases particulares.
              </p>
              <div className="mt-8 flex space-x-4">
                <Link
                  to="/booking"
                  className="btn bg-white text-primary-700 hover:bg-primary-50"
                >
                  Reservar Clase
                </Link>
                <Link
                  to="/login"
                  className="btn bg-primary-700 text-white hover:bg-primary-800"
                >
                  Acceder
                </Link>
              </div>
            </div>
            <div className="mt-10 md:mt-0 md:ml-10">
              <img 
                src="https://i.imgur.com/eF1OCJh.png"
                alt="Captura de Make en un portatil" 
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Features section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Cómo funciona</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              ClassReserve te ayuda a gestionar tus clases particulares de forma eficiente
            </p>
          </div>
          
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Selecciona fecha</h3>
              <p className="mt-2 text-gray-600">
                Elige el día que mejor se adapte a tu horario en el calendario
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Elige horario</h3>
              <p className="mt-2 text-gray-600">
                Selecciona una de las franjas horarias disponibles
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Confirmación</h3>
              <p className="mt-2 text-gray-600">
                El profesor confirma tu reserva y recibes los detalles por email
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Asiste a clase</h3>
              <p className="mt-2 text-gray-600">
                Únete a la videollamada usando el enlace proporcionado
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;