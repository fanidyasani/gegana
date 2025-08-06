import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types'; // Pastikan tipe User Anda sesuai dengan auth.users + role
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>; // Mengubah username menjadi email
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listener untuk perubahan status autentikasi Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Jika ada sesi Supabase, ambil detail user dari tabel 'users' kustom Anda
          // Atau dari tabel 'profiles' jika Anda menggunakannya
          const { data: userData, error } = await supabase
            .from('users') // Atau 'profiles' jika Anda mengubah nama tabel
            .select('id, username, name, role') // Sesuaikan kolom yang Anda butuhkan
            .eq('id', session.user.id)
            .single();

          if (userData && !error) {
            setUser(userData);
          } else {
            // Fallback jika data kustom tidak ditemukan (misal: hanya user dari auth.users)
            setUser({
              id: session.user.id,
              username: session.user.email || 'unknown', // Supabase auth menggunakan email
              name: session.user.email || 'unknown', // Sesuaikan jika ada nama di auth.users metadata
              role: 'staff' // Default role jika tidak ada di tabel kustom
            });
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Initial check saat komponen dimuat
    const checkInitialUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Panggil listener untuk mengisi data user
        await authListener.callback('SIGNED_IN', session);
      } else {
        setLoading(false);
      }
    };
    checkInitialUser();

    // Cleanup listener saat komponen unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // ✅ FUNGSI LOGIN YANG DIPERBAIKI
  const login = async (email: string, password: string): Promise<boolean> => { // Mengubah username menjadi email
    try {
      setLoading(true);

      // Gunakan signInWithPassword dari Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email, // Supabase menggunakan 'email' sebagai username
        password: password,
      });

      if (error) {
        console.error('Login failed:', error.message);
        return false;
      }

      // Jika login Supabase berhasil, session akan tersedia
      if (data.user) {
        // Ambil data role dari tabel 'users' kustom Anda
        const { data: userData, error: userError } = await supabase
          .from('users') // Atau 'profiles'
          .select('id, username, name, role')
          .eq('id', data.user.id)
          .single();

        if (userData && !userError) {
          setUser(userData);
        } else {
          // Fallback jika data kustom tidak ditemukan
          setUser({
            id: data.user.id,
            username: data.user.email || 'unknown',
            name: data.user.email || 'unknown',
            role: 'staff' // Default role
          });
        }
        return true;
      }
      return false; // Seharusnya tidak tercapai jika tidak ada error
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut(); // Gunakan signOut dari Supabase
      setUser(null);
      // localStorage akan otomatis dibersihkan oleh Supabase atau dihandle oleh onAuthStateChange
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};