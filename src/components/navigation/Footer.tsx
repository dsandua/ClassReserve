import { Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start space-x-6">
            <a href="#" className="text-gray-500 hover:text-gray-700">
              Términos y Condiciones
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-700">
              Política de Privacidad
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-700">
              Contacto
            </a>
          </div>
          <div className="mt-8 md:mt-0 flex items-center justify-center">
            <p className="text-gray-500 text-sm flex items-center">
              Hecho con <Heart className="h-4 w-4 text-error-500 mx-1" /> por David Sandua
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;