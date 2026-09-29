import { api } from './api';
import { ApiResponse, User, Profile } from '@/types';
import { PaginationParams, PaginatedResponse } from '@/types';

export interface UserProfileUpdate {
  firstName?: string;
  lastName?: string;
  bio?: string;
  website?: string;
  location?: string;
  avatarUrl?: string;
}

export class UserService {
  /**
   * Get current user profile
   */
  static async getProfile(): Promise<ApiResponse<Profile>> {
    try {
      const response = await api.get<Profile>('/api/users/profile');
      return {
        success: true,
        data: response,
      } as ApiResponse<Profile>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.error?.code || 'PROFILE_NOT_FOUND',
          message: error.error?.message || 'Profile not found',
        },
      } as ApiResponse<Profile>;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(data: UserProfileUpdate): Promise<ApiResponse<Profile>> {
    try {
      const response = await api.put<Profile>('/api/users/profile', data);
      return {
        success: true,
        data: response,
      } as ApiResponse<Profile>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.error?.code || 'PROFILE_UPDATE_FAILED',
          message: error.error?.message || 'Profile update failed',
        },
      } as ApiResponse<Profile>;
    }
  }

  /**
   * Upload user avatar
   */
  static async uploadAvatar(file: File): Promise<ApiResponse<{ url: string }>> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<{ url: string }>('/api/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        data: response,
      } as ApiResponse<{ url: string }>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.error?.code || 'AVATAR_UPLOAD_FAILED',
          message: error.error?.message || 'Avatar upload failed',
        },
      } as ApiResponse<{ url: string }>;
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<ApiResponse<User>> {
    try {
      const response = await api.get<User>(`/api/users/${id}`);
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
   * Search users
   */
  static async searchUsers(
    params: { search: string; limit?: number; offset?: number }
  ): Promise<ApiResponse<PaginatedResponse<User>>> {
    try {
      const response = await api.get<PaginatedResponse<User>>('/api/users/search', {
        params,
      });
      return {
        success: true,
        data: response,
      } as ApiResponse<PaginatedResponse<User>>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.error?.code || 'SEARCH_FAILED',
          message: error.error?.message || 'Search failed',
        },
      } as ApiResponse<PaginatedResponse<User>>;
    }
  }

  /**
   * List all users (admin only)
   */
  static async listUsers(
    params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<User>>> {
    try {
      const response = await api.get<PaginatedResponse<User>>('/api/users', {
        params,
      });
      return {
        success: true,
        data: response,
      } as ApiResponse<PaginatedResponse<User>>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.error?.code || 'LIST_USERS_FAILED',
          message: error.error?.message || 'List users failed',
        },
      } as ApiResponse<PaginatedResponse<User>>;
    }
  }
}

export const userApi = UserService;
