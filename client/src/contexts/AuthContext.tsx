import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '@/api/client';

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  me: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      me();
    } else {
      setIsLoading(false);
    }
  }, []);

  async function me() {
    try {
      setError(null);
      const response = await auth.me();
      setUser(response.user);
    } catch (err: any) {
      localStorage.removeItem('auth_token');
      setUser(null);
      if (err.status !== 401) {
        setError(err.error || 'Failed to fetch user');
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      setError(null);
      const response = await auth.login(email, password);
      localStorage.setItem('auth_token', response.token);
      setUser(response.user);
    } catch (err: any) {
      setError(err.error || 'Login failed');
      throw err;
    }
  }

  async function register(name: string, email: string, password: string) {
    try {
      setError(null);
      const response = await auth.register(name, email, password);
      localStorage.setItem('auth_token', response.token);
      setUser(response.user);
    } catch (err: any) {
      setError(err.error || 'Registration failed');
      throw err;
    }
  }

  function logout() {
    localStorage.removeItem('auth_token');
    setUser(null);
    setError(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, register, logout, me }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
