import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient, Session } from '@supabase/supabase-js'; 

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher';
  avatar?: string;
  phone?: string;
  notes?: string;
  price?: number;
};

type AuthContextType = {
  user: User | null; 
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; redirectTo?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
};

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const createUserProfile = async (userId: string, email: string, name?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            name: name || email.split('@')[0],
            email,
            role: 'student',
            price: 25.00,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error creating profile:', error);
      return { data: null, error };
    }
  };

  const getUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error getting profile:', error);
      return { data: null, error };
    }
  };

  const setUserFromSession = async (session: Session | null) => {
    if (!session?.user) {
      setUser(null);
      return null;
    }

    const { data: profile, error } = await getUserProfile(session.user.id);

    if (error || !profile) {
      const { data: newProfile, error: createError } = await createUserProfile(
        session.user.id,
        session.user.email!,
        session.user.user_metadata?.name
      );

      if (createError || !newProfile) {
        console.error('Failed to create profile:', createError);
        setUser(null);
        return null;
      }

      const userData = {
        id: session.user.id,
        name: newProfile.name,
        email: session.user.email!,
        role: newProfile.role,
        avatar: newProfile.avatar_url,
        phone: newProfile.phone,
        notes: newProfile.notes,
        price: newProfile.price
      };
      setUser(userData);
      return userData;
    } else {
      const userData = {
        id: session.user.id,
        name: profile.name,
        email: session.user.email!,
        role: profile.role,
        avatar: profile.avatar_url,
        phone: profile.phone,
        notes: profile.notes,
        price: profile.price
      };
      setUser(userData);
      return userData;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          await setUserFromSession(session);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initializeAuth();

    const handleAuthChange = async (event: string, session: Session | null) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await setUserFromSession(session);
        setIsLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      handleAuthChange(event, session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        setIsLoading(false);
        if (error.message === 'Invalid login credentials') {
          return { success: false, error: 'El correo electrónico o la contraseña son incorrectos' };
        }
        return { success: false, error: error.message || 'Ha ocurrido un error al iniciar sesión' };
      }

      if (!data.user) {
        setIsLoading(false);
        return { success: false, error: 'No se pudo iniciar sesión' };
      }

      const userData = await setUserFromSession(data.session);
      if (!userData) {
        return { success: false, error: 'Error al obtener el perfil de usuario' };
      }

      // Return success with the appropriate redirect path based on user role
      return { 
        success: true, 
        redirectTo: userData.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'
      };

    } catch (error: any) {
      console.error('Login exception:', error);
      setIsLoading(false);
      return { success: false, error: 'Ha ocurrido un error inesperado' };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: name.trim() }
        }
      });

      if (error) {
        setIsLoading(false);
        if (error.message.includes('already registered')) {
          return { success: false, error: 'Este correo electrónico ya está registrado' };
        }
        return { success: false, error: error.message || 'Error al crear la cuenta' };
      }

      if (!data.user) {
        setIsLoading(false);
        return { success: false, error: 'No se pudo crear el usuario' };
      }

      const { error: profileError } = await createUserProfile(
        data.user.id,
        data.user.email!,
        name.trim()
      );

      if (profileError) {
        setIsLoading(false);
        return { success: false, error: 'Error al crear el perfil de usuario' };
      }

      setIsLoading(false);
      return { success: true };
    } catch (error: any) {
      console.error('Register exception:', error);
      setIsLoading(false);
      return { success: false, error: 'Error al crear la cuenta' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'https://earnest-chebakia-e67777.netlify.app/reset-password'
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: 'Error al enviar el correo de recuperación' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export { useAuthContext as useAuth };