import { useState } from 'react';
import { User, Mail, Key, Save, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsUpdating(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success('Perfil actualizado con éxito');
      setIsUpdating(false);
    }, 1000);
  };
  
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    
    setIsChangingPassword(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success('Contraseña actualizada con éxito');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
    }, 1000);
  };

const handleDeleteAccount = async () => {
  if (deleteConfirmText !== 'ELIMINAR') {
    toast.error('Por favor, escribe ELIMINAR para confirmar');
    return;
  }

  setIsDeletingAccount(true);

  try {
const response = await fetch('/.netlify/functions/delete-user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: user?.id }),
});

    // Si hay contenido, parsea JSON. Si no, sáltatelo.
    let data = null;
    const text = await response.text();
    if (text) data = JSON.parse(text);

    if (!response.ok) {
      throw new Error(data?.message || 'Error al eliminar la cuenta');
    }

    setIsDeletingAccount(false);
    await logout();
    navigate('/');
    toast.success('Cuenta eliminada con éxito');
  } catch (error) {
    console.error('Error deleting account:', error);
    toast.error(error instanceof Error ? error.message : 'Error al eliminar la cuenta');
    setIsDeletingAccount(false);
  }
};
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600 mt-1">
          Administra tu información personal y credenciales
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Profile information */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Información Personal
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Actualiza tus datos personales
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleUpdateProfile}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nombre completo
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      placeholder="Tu nombre"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Correo electrónico
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      placeholder="Tu email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      'Actualizando...'
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Guardar cambios
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
        
        {/* Change password */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Cambiar Contraseña
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Actualiza tu contraseña de acceso
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleChangePassword}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                    Contraseña actual
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      name="current-password"
                      id="current-password"
                      className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                    Nueva contraseña
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      name="new-password"
                      id="new-password"
                      className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                    Confirmar nueva contraseña
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      name="confirm-password"
                      id="confirm-password"
                      className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? 'Actualizando...' : 'Cambiar contraseña'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Delete Account */}
        <div className="md:col-span-2">
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <AlertTriangle className="h-5 w-5 text-error-500 mr-2" />
                Eliminar Cuenta
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Esta acción es permanente y no se puede deshacer
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              {!showDeleteConfirm ? (
                <div>
                  <p className="text-sm text-gray-500 mb-4">
                    Al eliminar tu cuenta, se borrarán permanentemente todos tus datos, incluyendo:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-500 mb-6">
                    <li>Tu perfil y datos personales</li>
                    <li>Todas tus reservas de clases</li>
                    <li>Tu historial completo de clases</li>
                    <li>Todas tus notificaciones</li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-error-600 hover:bg-error-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error-500"
                  >
                    Eliminar mi cuenta
                  </button>
                </div>
              ) : (
                <div>
                  <div className="rounded-md bg-error-50 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-error-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-error-800">
                          Confirmar eliminación de cuenta
                        </h3>
                        <div className="mt-2 text-sm text-error-700">
                          <p>
                            Esta acción eliminará permanentemente tu cuenta y todos tus datos.
                            Para confirmar, escribe "ELIMINAR" en el campo de abajo.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="confirm-delete" className="block text-sm font-medium text-gray-700">
                      Escribe ELIMINAR para confirmar
                    </label>
                    <input
                      type="text"
                      id="confirm-delete"
                      className="mt-1 focus:ring-error-500 focus:border-error-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="ELIMINAR"
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText('');
                      }}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== 'ELIMINAR' || isDeletingAccount}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-error-600 hover:bg-error-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeletingAccount ? 'Eliminando...' : 'Confirmar eliminación'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;