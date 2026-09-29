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
  return {
    page: params.page || 1,
    limit: params.limit || 20,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder || 'asc',
    search: params.search,
  };
}

export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}

export function validatePaginationParams(
  params: PaginationParams
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (params.page && params.page < 1) {
    errors.push('Page must be greater than 0');
  }

  if (params.limit && (params.limit < 1 || params.limit > 100)) {
    errors.push('Limit must be between 1 and 100');
  }

  if (params.sortOrder && !['asc', 'desc'].includes(params.sortOrder)) {
    errors.push('Sort order must be "asc" or "desc"');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function buildPaginationUrl(
  baseUrl: string,
  params: PaginationParams
): string {
  const url = new URL(baseUrl, window.location.origin);

  if (params.page) url.searchParams.set('page', params.page.toString());
  if (params.limit) url.searchParams.set('limit', params.limit.toString());
  if (params.sortBy) url.searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) url.searchParams.set('sortOrder', params.sortOrder);
  if (params.search) url.searchParams.set('search', params.search);

  return url.toString();
}
