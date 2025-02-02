"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { userApi, authApi } from './api';

// Add paths that should be accessible only to authenticated users
const protectedPaths = ['/dashboard', '/profile'];

// Add paths that should be accessible only to non-authenticated users
const authPaths = ['/login', '/register'];

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { username: string; email: string; password: string; name: string }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  // Handle auth state changes
  useEffect(() => {
    const path = window.location.pathname;
    console.log('[AuthContext] Auth state changed:', { loading, hasUser: !!user, path });
    
    // Only handle redirects after initial loading is complete
    if (!loading && protectedPaths.some(p => path.startsWith(p))) {
      if (!user) {
        console.log('[AuthContext] Protected path but no user, redirecting to login');
        router.push('/login');
      } else {
        console.log('[AuthContext] User authenticated on protected path');
      }
    }
  }, [user, loading, router]);

  const checkAuth = async () => {
    console.log('[AuthContext] Checking auth...');
    try {
      const userData = await userApi.getCurrentUser();
      console.log('[AuthContext] Got user data:', userData);
      setUser(userData);
    } catch (error) {
      console.log('[AuthContext] Auth check failed:', error);
      setUser(null);
      // If we're on a protected path and auth check fails, redirect to login
      const path = window.location.pathname;
      if (protectedPaths.some(p => path.startsWith(p))) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Starting login');
      const response = await authApi.login({ email, password });
      console.log('[AuthContext] Login response:', {
        hasToken: !!response.token,
        hasUser: !!response.user
      });
      
      // Set user immediately from login response
      setUser(response.user);
      console.log('[AuthContext] User state updated from login');
      
      // Double check auth state
      await checkAuth();
      console.log('[AuthContext] Auth check completed after login');
      
      router.push('/dashboard');
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      throw error;
    }
  };

  const register = async (data: { username: string; email: string; password: string; name: string }) => {
    try {
      console.log('[AuthContext] Starting registration');
      const response = await authApi.register(data);
      console.log('[AuthContext] Registration response:', {
        hasToken: !!response.token,
        hasUser: !!response.user
      });
      await checkAuth(); // Add this to ensure we get fresh user data
      console.log('[AuthContext] User state updated after checkAuth');
      router.push('/dashboard');
    } catch (error) {
      console.error('[AuthContext] Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
