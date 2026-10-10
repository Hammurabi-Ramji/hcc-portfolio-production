import { api } from '@/lib/api-client';
import type { ApiResponse, AuthResponse, User, RegisterRequest, LoginRequest } from '@/types';
import { serviceRequest } from './service-utils';

export type { AuthResponse } from '@/types';

/** Cookie credentials are managed by the local service, never browser storage. */
export class AuthService {
  static login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return serviceRequest(() => api.post<AuthResponse>('/auth/login', data));
  }

  static register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return serviceRequest(() => api.post<AuthResponse>('/auth/register', data));
  }

  static logout(): Promise<ApiResponse<void>> {
    return serviceRequest(() => api.post<void>('/auth/logout'));
  }

  static getCurrentUser(): Promise<ApiResponse<User>> {
    return serviceRequest(() => api.get<User>('/auth/me'));
  }

  static refreshToken(): Promise<ApiResponse<AuthResponse>> {
    return serviceRequest(() => api.post<AuthResponse>('/auth/refresh-token'));
  }

  /** Email transport is unsupported; retain the backend's explicit 501 failure. */
  static verifyEmail(token: string): Promise<ApiResponse<void>> {
    return serviceRequest(() => api.get<void>('/auth/verify-email', { params: { token } }));
  }

  static requestPasswordReset(email: string): Promise<ApiResponse<void>> {
    return serviceRequest(() => api.post<void>('/auth/forgot-password', { email }));
  }

  static resetPassword(token: string, newPassword: string): Promise<ApiResponse<void>> {
    return serviceRequest(() => api.post<void>('/auth/reset-password', { token, newPassword }));
  }
}

export const authApi = AuthService;
