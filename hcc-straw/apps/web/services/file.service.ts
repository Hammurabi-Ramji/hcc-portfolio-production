import { api } from './api';
import { ApiResponse } from '@/types';

export interface FileUpload {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  url: string;
  isPublic: boolean;
  createdAt: Date;
}

export class FileService {
  /**
   * Upload a single file
   */
  static async uploadFile(
    file: File,
    options?: { isPublic?: boolean; metadata?: Record<string, any> }
  ): Promise<ApiResponse<FileUpload>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (options?.isPublic !== undefined) {
        formData.append('isPublic', options.isPublic.toString());
      }

      if (options?.metadata) {
        formData.append('metadata', JSON.stringify(options.metadata));
      }

      const response = await api.post<FileUpload>('/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        data: response,
      } as ApiResponse<FileUpload>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.error?.code || 'UPLOAD_FAILED',
          message: error.error?.message || 'Upload failed',
        },
      } as ApiResponse<FileUpload>;
    }
  }

  /**
   * Upload multiple files
   */
  static async uploadFiles(
    files: File[],
    options?: { isPublic?: boolean }
  ): Promise<ApiResponse<FileUpload[]>> {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadFile(file, options)
      );

      const results = await Promise.all(uploadPromises);
      const successResults = results.filter((r) => r.success && r.data);
      const errorResults = results.filter((r) => !r.success);

      if (errorResults.length > 0) {
        return {
          success: false,
          error: {
            code: 'SOME_UPLOADS_FAILED',
            message: `${errorResults.length} file(s) failed to upload`,
          },
        } as ApiResponse<FileUpload[]>;
      }

      return {
        success: true,
        data: successResults.map((r) => r.data!),
      } as ApiResponse<FileUpload[]>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.error?.code || 'UPLOADS_FAILED',
          message: error.error?.message || 'File uploads failed',
        },
      } as ApiResponse<FileUpload[]>;
    }
  }

  /**
   * Get file by ID
   */
  static async getFile(id: string): Promise<ApiResponse<FileUpload>> {
    try {
      const response = await api.get<FileUpload>(`/api/files/${id}`);
      return {
        success: true,
        data: response,
      } as ApiResponse<FileUpload>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.error?.code || 'FILE_NOT_FOUND',
          message: error.error?.message || 'File not found',
        },
      } as ApiResponse<FileUpload>;
    }
  }

  /**
   * Delete file
   */
  static async deleteFile(id: string): Promise<ApiResponse<void>> {
    try {
      await api.delete(`/api/files/${id}`);
      return { success: true } as ApiResponse<void>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.error?.code || 'DELETE_FAILED',
          message: error.error?.message || 'Delete failed',
        },
      } as ApiResponse<void>;
    }
  }

  /**
   * Get user's files
   */
  static async getUserFiles(options?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<{ files: FileUpload[]; total: number }>> {
    try {
      const response = await api.get<{ files: FileUpload[]; total: number }>(
        '/api/files',
        { params: options }
      );
      return {
        success: true,
        data: response,
      } as ApiResponse<{ files: FileUpload[]; total: number }>;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: error.error?.code || 'GET_FILES_FAILED',
          message: error.error?.message || 'Get files failed',
        },
      } as ApiResponse<{ files: FileUpload[]; total: number }>;
    }
  }
}

export const fileApi = FileService;
