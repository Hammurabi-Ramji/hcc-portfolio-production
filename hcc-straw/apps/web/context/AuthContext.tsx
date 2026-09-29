"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, ApiResponse, User, RegisterRequest } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<ApiResponse<User>>;
  register: (data: RegisterRequest) => Promise<ApiResponse<User>>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      
      if (storedToken) {
        setToken(storedToken);
        
        // TODO: Validate token and fetch user data
        // For now, we'll keep it as is
        try {
          // const response = await api.get<ApiResponse<User>>('/api/auth/me');
          // if (response.success && response.data) {
          //   setUser(response.data);
          // }
        } catch (error) {
          // Token invalid, clear it
          localStorage.removeItem('auth_token');
          setToken(null);
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<ApiResponse<User>> => {
    try {
      // TODO: Connect to actual API endpoint
      const response = await api.post<{ accessToken: string; user: User }>(
        '/api/auth/login',
        { email, password }
      );

      if (response.success && response.data) {
        const { accessToken, user } = response.data;
        
        setToken(accessToken);
        setUser(user);
        localStorage.setItem('auth_token', accessToken);

        return { success: true, data: user } as ApiResponse<User>;
      }

      return response as ApiResponse<User>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.error?.code || 'LOGIN_FAILED',
          message: error.error?.message || 'Login failed',
        },
      } as ApiResponse<User>;
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest): Promise<ApiResponse<User>> => {
    try {
      // TODO: Connect to actual API endpoint
      const response = await api.post<{ accessToken: string; user: User }>(
        '/api/auth/register',
        data
      );

      if (response.success && response.data) {
        const { accessToken, user } = response.data;
        
        setToken(accessToken);
        setUser(user);
        localStorage.setItem('auth_token', accessToken);

        return { success: true, data: user } as ApiResponse<User>;
      }

      return response as ApiResponse<User>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.error?.code || 'REGISTRATION_FAILED',
          message: error.error?.message || 'Registration failed',
        },
      } as ApiResponse<User>;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Call logout API
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;

    try {
      const response = await api.get<ApiResponse<User>>('/api/auth/me');
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  }, [token]);

  const updateUser = useCallback((updatedUser: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updatedUser });
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
