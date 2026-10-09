import { api } from '@/lib/api-client';
import type { ApiResponse, PaginatedResponse, ProjectDto, PaginationParams } from '@/types';
import { pagination, serviceRequest } from './service-utils';

export type { ProjectDto as Project } from '@/types';

export interface CreateProject {
  name: string;
  description?: string;
  status?: ProjectDto['status'];
}

export interface UpdateProject {
  name?: string;
  description?: string;
  status?: ProjectDto['status'];
}

export class ProjectService {
  static getProjects(params?: PaginationParams & { status?: ProjectDto['status'] }): Promise<ApiResponse<PaginatedResponse<ProjectDto>>> {
    return serviceRequest(() => api.get<PaginatedResponse<ProjectDto>>('/projects', { params: pagination(params) }));
  }

  static getProjectById(id: string): Promise<ApiResponse<ProjectDto>> {
    return serviceRequest(() => api.get<ProjectDto>(`/projects/${encodeURIComponent(id)}`));
  }

  static createProject(data: CreateProject): Promise<ApiResponse<ProjectDto>> {
    return serviceRequest(() => api.post<ProjectDto>('/projects', data));
  }

  static updateProject(id: string, data: UpdateProject): Promise<ApiResponse<ProjectDto>> {
    return serviceRequest(() => api.put<ProjectDto>(`/projects/${encodeURIComponent(id)}`, data));
  }

  static deleteProject(id: string): Promise<ApiResponse<void>> {
    return serviceRequest(() => api.delete<void>(`/projects/${encodeURIComponent(id)}`));
  }

  static archiveProject(id: string): Promise<ApiResponse<void>> {
    return serviceRequest(() => api.patch<void>(`/projects/${encodeURIComponent(id)}/archive`));
  }

  static activateProject(id: string): Promise<ApiResponse<void>> {
    return serviceRequest(() => api.patch<void>(`/projects/${encodeURIComponent(id)}/activate`));
  }
}

export const projectApi = ProjectService;
