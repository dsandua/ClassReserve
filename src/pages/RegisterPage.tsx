import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Por favor, completa todos los campos');
      return false;
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const { success, error } = await register(name, email, password);
      
      if (success) {
        toast.success('¡Registro exitoso!');
        navigate('/student/dashboard');
      } else {
        // Parse the error message if it's a JSON string
        let errorMessage = error;
        try {
          if (typeof error === 'string' && error.startsWith('{')) {
            const parsedError = JSON.parse(error);
            if (parsedError.code === 'user_already_exists') {
              toast.error(
                <div className="flex flex-col gap-2">
                  <span>Este correo electrónico ya está registrado.</span>
                  <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">
                    Haz clic aquí para iniciar sesión
                  </Link>
                </div>,
                { duration: 5000 }
              );
              return;
            }
            errorMessage = parsedError.message;
          }
        } catch (e) {
          // If JSON parsing fails, use the original error message
          console.error('Error parsing error message:', e);
        }

        // Handle other error cases
        if (errorMessage?.includes('user_already_exists') || 
            errorMessage?.includes('already registered') || 
            errorMessage?.includes('already exists')) {
          toast.error(
            <div className="flex flex-col gap-2">
              <span>Este correo electrónico ya está registrado.</span>
              <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">
                Haz clic aquí para iniciar sesión
              </Link>
            </div>,
            { duration: 5000 }
          );
        } else {
          toast.error(errorMessage || 'Error al crear la cuenta');
        }
      }
    } catch (error) {
      console.error('Register error:', error);
      toast.error('Ha ocurrido un error. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Crea tu cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            O{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              inicia sesión si ya tienes cuenta
            </Link>
          </p>
        </div>
        
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre completo
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                La contraseña debe tener al menos 6 caracteres
              </p>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar contraseña
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                required
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                Acepto los <a href="#" className="text-primary-600 hover:text-primary-500">términos y condiciones</a> y la <a href="#" className="text-primary-600 hover:text-primary-500">política de privacidad</a>
              </label>
            </div>

            <div>
              <button
                type="submit"
                className="w-full btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Registrando...' : 'Registrarse'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;