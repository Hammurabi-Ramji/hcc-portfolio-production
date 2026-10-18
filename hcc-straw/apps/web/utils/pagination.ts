import { PAGINATION_CONFIG } from './config';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export function getPaginationParams(params: PaginationParams): PaginationParams {
  const validation = validatePaginationParams(params);
  if (!validation.isValid) {
    throw new RangeError(validation.errors.join('; '));
  }
  return {
    page: params.page ?? 1,
    limit: params.limit ?? PAGINATION_CONFIG.defaultLimit,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder ?? 'asc',
    search: params.search,
  };
}

export function calculateTotalPages(total: number, limit: number): number {
  if (!Number.isSafeInteger(total) || total < 0) {
    throw new RangeError('Total must be a non-negative safe integer');
  }
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new RangeError('Limit must be a positive safe integer');
  }
  return Math.ceil(total / limit);
}

export function validatePaginationParams(
  params: PaginationParams
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (params.page !== undefined && (!Number.isSafeInteger(params.page) || params.page < 1)) {
    errors.push('Page must be a positive safe integer');
  }

  if (params.limit !== undefined && (!Number.isSafeInteger(params.limit) ||
      params.limit < PAGINATION_CONFIG.minLimit || params.limit > PAGINATION_CONFIG.maxLimit)) {
    errors.push(`Limit must be an integer between ${PAGINATION_CONFIG.minLimit} and ${PAGINATION_CONFIG.maxLimit}`);
  }

  if (params.sortOrder !== undefined && !['asc', 'desc'].includes(params.sortOrder)) {
    errors.push('Sort order must be "asc" or "desc"');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/** Relative URLs require an explicit origin when used outside a browser. */
export function buildPaginationUrl(
  baseUrl: string,
  params: PaginationParams,
  origin?: string
): string {
  const validation = validatePaginationParams(params);
  if (!validation.isValid) {
    throw new RangeError(validation.errors.join('; '));
  }
  const url = new URL(baseUrl, origin ?? (typeof window === 'undefined' ? undefined : window.location.origin));

  if (params.page) url.searchParams.set('page', params.page.toString());
  if (params.limit) url.searchParams.set('limit', params.limit.toString());
  if (params.sortBy) url.searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) url.searchParams.set('sortOrder', params.sortOrder);
  if (params.search) url.searchParams.set('search', params.search);

  return url.toString();
}
