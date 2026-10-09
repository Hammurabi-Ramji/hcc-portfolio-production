import type { ApiResponse, IsoTimestamp, PaginatedResponse, PaginationParams } from '@/types';
import { unsupported } from './service-utils';

/** Wire metadata only; file storage and transfer are not implemented. */
export interface FileUpload {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  url: string;
  isPublic: boolean;
  createdAt: IsoTimestamp;
}

/** Compatibility API: every operation truthfully reports unavailable storage. */
export class FileService {
  static async uploadFile(
    _file: File,
    _options?: { isPublic?: boolean; metadata?: Record<string, unknown> }
  ): Promise<ApiResponse<FileUpload>> {
    return unsupported('File upload');
  }

  /** No uploads are started, so this operation cannot leave partial writes. */
  static async uploadFiles(_files: File[], _options?: { isPublic?: boolean }): Promise<ApiResponse<FileUpload[]>> {
    return unsupported('Batch file upload');
  }

  static async getFile(_id: string): Promise<ApiResponse<FileUpload>> {
    return unsupported('File lookup');
  }

  static async deleteFile(_id: string): Promise<ApiResponse<void>> {
    return unsupported('File deletion');
  }

  static async getUserFiles(_options?: PaginationParams): Promise<ApiResponse<PaginatedResponse<FileUpload>>> {
    return unsupported('File listing');
  }
}

export const fileApi = FileService;
