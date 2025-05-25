import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'ready' | 'error'>('idle');
  const navigate = useNavigate();

  useEffect(() => {
    const run = () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.replace('#', '?'));
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token })
          .then(({ error }) => {
            if (error) {
              console.error('Error estableciendo sesión:', error.message);
              setStatus('error');
            } else {
              console.log('Sesión iniciada con token de recuperación');
              setStatus('ready');
            }
          });
      } else {
        console.error('No se encontraron tokens en la URL');
        setStatus('error');
      }
    };

    run();
    window.addEventListener('hashchange', run);
    return () => window.removeEventListener('hashchange', run);
  }, []);

  const handleSubmit = async () => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      alert('Error al cambiar contraseña: ' + error.message);
    } else {
      alert('Contraseña cambiada correctamente');
      navigate('/login');
    }
  };

  if (status === 'idle') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Verificando enlace de recuperación...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 text-lg">Enlace inválido o expirado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white p-8 shadow-md rounded-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Cambiar contraseña</h2>
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Actualizar
        </button>
      </div>
    </div>
  );
}
