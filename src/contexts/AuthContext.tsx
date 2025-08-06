import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
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
    // Check if user is logged in on app start
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Get user details from our users table
        const { data: userData, error } = await supabase
          .from('users')
          .select('id, username, name, role')
          .eq('id', session.user.id)
          .single();

        if (userData && !error) {
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);

      // For demo purposes, we'll use simple authentication
      // In production, you should use proper password hashing
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !userData) {
        return false;
      }

      // Simple password check (in production, use proper hashing)
      const validPasswords: Record<string, string> = {
        admin: 'admin123',
        staff1: 'staff123',
        staff2: 'staff123'
      };

      if (validPasswords[username] !== password) {
        return false;
      }

      // Create a session
      const userSession: User = {
        id: userData.id,
        username: userData.username,
        name: userData.name,
        role: userData.role
      };

      setUser(userSession);
      localStorage.setItem('gegana_user', JSON.stringify(userSession));
      return true;

    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      localStorage.removeItem('gegana_user');
      await supabase.auth.signOut();
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