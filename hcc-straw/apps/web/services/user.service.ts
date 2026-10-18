import { api } from '@/lib/api-client';
import type { ApiResponse, User, Profile, PaginationParams, PaginatedResponse } from '@/types';
import { pagination, serviceRequest, unsupported } from './service-utils';

export interface UserProfileUpdate {
  firstName?: string;
  lastName?: string;
  bio?: string;
  website?: string;
  location?: string;
  avatarUrl?: string;
}

export class UserService {
  static getProfile(): Promise<ApiResponse<Profile>> {
    return serviceRequest(() => api.get<Profile>('/users/profile'));
  }

  static updateProfile(data: UserProfileUpdate): Promise<ApiResponse<Profile>> {
    return serviceRequest(() => api.put<Profile>('/users/profile', data));
  }

  /**
   * Avatar binary storage is unsupported. Returns local UNSUPPORTED/501 with no
   * transport and no profile mutation. Do not advertise avatar upload as available.
   */
  static async uploadAvatar(_file: File): Promise<ApiResponse<{ url: string }>> {
    return unsupported('Avatar upload');
  }

  static getUserById(id: string): Promise<ApiResponse<User>> {
    return serviceRequest(() => api.get<User>(`/users/${encodeURIComponent(id)}`));
  }

  static searchUsers(params: PaginationParams & { search: string }): Promise<ApiResponse<PaginatedResponse<User>>> {
    return serviceRequest(() => api.get<PaginatedResponse<User>>('/users', { params: pagination(params) }));
  }

  static listUsers(params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<User>>> {
    return serviceRequest(() => api.get<PaginatedResponse<User>>('/users', { params: pagination(params) }));
  }
}

export const userApi = UserService;
