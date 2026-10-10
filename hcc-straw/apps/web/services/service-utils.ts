import type { ApiFailure, ApiResponse, PaginationParams } from '@/types';

function isFailure(value: unknown): value is ApiFailure {
  if (!value || typeof value !== 'object' || !('success' in value) || value.success !== false ||
      !('error' in value) || !value.error || typeof value.error !== 'object') return false;
  return 'code' in value.error && typeof value.error.code === 'string' &&
    'message' in value.error && typeof value.error.message === 'string';
}

/** Preserve resolved logical failures and structured rejected HTTP failures alike. */
export async function serviceRequest<T>(request: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> {
  try {
    return await request();
  } catch (error: unknown) {
    if (isFailure(error)) return error;
    return { success: false, error: { code: 'REQUEST_FAILED', message: 'The request could not be completed.' } };
  }
}

/** These limits match the local API's bounded page/limit contract. */
export function pagination(params?: PaginationParams): PaginationParams & { page: number; limit: number } {
  const requestedPage = params?.page ?? 1;
  const requestedLimit = params?.limit ?? 10;
  const page = Number.isFinite(requestedPage) ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(1, Math.floor(requestedPage))) : 1;
  const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, Math.floor(requestedLimit))) : 10;
  return { ...params, page, limit, ...(params?.search !== undefined ? { search: params.search.trim() } : {}) };
}

export function unsupported(feature: string): ApiFailure {
  return { success: false, error: { code: 'UNSUPPORTED', message: `${feature} is unavailable: no local file storage backend is implemented.`, status: 501 } };
}
