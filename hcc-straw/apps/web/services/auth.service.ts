import { api } from './api';
import { ApiResponse, User, RegisterRequest, LoginRequest } from '@/types';

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export class AuthService {
  /**
   * Login user
   */
  static async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await api.post<AuthResponse>('/api/auth/login', data);
      return {
        success: true,
        data: response,
      } as ApiResponse<AuthResponse>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.error?.code || 'LOGIN_FAILED',
          message: error.error?.message || 'Login failed',
        },
      } as ApiResponse<AuthResponse>;
    }
  }

  /**
   * Register new user
   */
  static async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await api.post<AuthResponse>('/api/auth/register', data);
      return {
        success: true,
        data: response,
      } as ApiResponse<AuthResponse>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.error?.code || 'REGISTRATION_FAILED',
          message: error.error?.message || 'Registration failed',
        },
      } as ApiResponse<AuthResponse>;
    }
  }

  /**
   * Logout user
   */
  static async logout(): Promise<ApiResponse<void>> {
    try {
      await api.post('/api/auth/logout');
      return { success: true } as ApiResponse<void>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.error?.code || 'LOGOUT_FAILED',
          message: error.error?.message || 'Logout failed',
        },
      } as ApiResponse<void>;
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await api.get<User>('/api/auth/me');
      return {
        success: true,
        data: response,
      } as ApiResponse<User>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.error?.code || 'USER_NOT_FOUND',
          message: error.error?.message || 'User not found',
        },
      } as ApiResponse<User>;
    }
  }

  /**
   * Refresh token
   */
  static async refreshToken(): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await api.post<AuthResponse>('/api/auth/refresh-token');
      return {
        success: true,
        data: response,
      } as ApiResponse<AuthResponse>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.error?.code || 'REFRESH_FAILED',
          message: error.error?.message || 'Token refresh failed',
        },
      } as ApiResponse<AuthResponse>;
    }
  }

  /**
   * Verify email
   */
  static async verifyEmail(token: string): Promise<ApiResponse<void>> {
    try {
      await api.get(`/api/auth/verify-email?token=${token}`);
      return { success: true } as ApiResponse<void>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.error?.code || 'VERIFICATION_FAILED',
          message: error.error?.message || 'Email verification failed',
        },
      } as ApiResponse<void>;
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email: string): Promise<ApiResponse<void>> {
    try {
      await api.post('/api/auth/forgot-password', { email });
      return { success: true } as ApiResponse<void>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.error?.code || 'RESET_FAILED',
          message: error.error?.message || 'Password reset request failed',
        },
      } as ApiResponse<void>;
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(
    token: string,
    newPassword: string
  ): Promise<ApiResponse<void>> {
    try {
      await api.post('/api/auth/reset-password', { token, newPassword });
      return { success: true } as ApiResponse<void>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.error?.code || 'PASSWORD_RESET_FAILED',
          message: error.error?.message || 'Password reset failed',
        },
      } as ApiResponse<void>;
    }
  }
}

export const authApi = AuthService;
