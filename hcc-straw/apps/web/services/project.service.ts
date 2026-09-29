import { api } from './api';
import { ApiResponse, PaginatedResponse } from '@/types';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'archived' | 'draft';
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface CreateProject {
  name: string;
  description?: string;
  status?: Project['status'];
}

export interface UpdateProject {
  name?: string;
  description?: string;
  status?: Project['status'];
}

export class ProjectService {
  /**
   * Get all projects
   */
  static async getProjects(
    params?: { status?: string; search?: string; page?: number; limit?: number }
  ): Promise<ApiResponse<PaginatedResponse<Project>>> {
    try {
      const response = await api.get<PaginatedResponse<Project>>('/api/projects', {
        params,
      });
      return {
        success: true,
        data: response,
      } as ApiResponse<PaginatedResponse<Project>>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.error?.code || 'GET_PROJECTS_FAILED',
          message: error.error?.message || 'Get projects failed',
        },
      } as ApiResponse<PaginatedResponse<Project>>;
    }
  }

  /**
   * Get project by ID
   */
  static async getProjectById(id: string): Promise<ApiResponse<Project>> {
    try {
      const response = await api.get<Project>(`/api/projects/${id}`);
      return {
        success: true,
        data: response,
      } as ApiResponse<Project>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.error?.code || 'PROJECT_NOT_FOUND',
          message: error.error?.message || 'Project not found',
        },
      } as ApiResponse<Project>;
    }
  }

  /**
   * Create new project
   */
  static async createProject(data: CreateProject): Promise<ApiResponse<Project>> {
    try {
      const response = await api.post<Project>('/api/projects', data);
      return {
        success: true,
        data: response,
      } as ApiResponse<Project>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.error?.code || 'CREATE_PROJECT_FAILED',
          message: error.error?.message || 'Create project failed',
        },
      } as ApiResponse<Project>;
    }
  }

  /**
   * Update project
   */
  static async updateProject(
    id: string,
    data: UpdateProject
  ): Promise<ApiResponse<Project>> {
    try {
      const response = await api.put<Project>(`/api/projects/${id}`, data);
      return {
        success: true,
        data: response,
      } as ApiResponse<Project>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.error?.code || 'UPDATE_PROJECT_FAILED',
          message: error.error?.message || 'Update project failed',
        },
      } as ApiResponse<Project>;
    }
  }

  /**
   * Delete project
   */
  static async deleteProject(id: string): Promise<ApiResponse<void>> {
    try {
      await api.delete(`/api/projects/${id}`);
      return { success: true } as ApiResponse<void>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.error?.code || 'DELETE_PROJECT_FAILED',
          message: error.error?.message || 'Delete project failed',
        },
      } as ApiResponse<void>;
    }
  }

  /**
   * Archive project
   */
  static async archiveProject(id: string): Promise<ApiResponse<void>> {
    try {
      await api.patch(`/api/projects/${id}/archive`);
      return { success: true } as ApiResponse<void>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.error?.code || 'ARCHIVE_FAILED',
          message: error.error?.message || 'Archive failed',
        },
      } as ApiResponse<void>;
    }
  }

  /**
   * Activate project
   */
  static async activateProject(id: string): Promise<ApiResponse<void>> {
    try {
      await api.patch(`/api/projects/${id}/activate`);
      return { success: true } as ApiResponse<void>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.error?.code || 'ACTIVATE_FAILED',
          message: error.error?.message || 'Activate failed',
        },
      } as ApiResponse<void>;
    }
  }
}

export const projectApi = ProjectService;
