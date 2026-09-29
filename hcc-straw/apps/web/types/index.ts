// User types
export interface User {
  id: string
  email: string
  username?: string
  role: UserRole
  emailVerified: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  profile?: Profile
}

export type UserRole = 'admin' | 'user' | 'moderator'

// Profile types
export interface Profile {
  id: string
  userId: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  bio?: string
  website?: string
  location?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// Session types
export interface Session {
  id: string
  userId: string
  token: string
  expiresAt: Date
  ipAddress?: string
  userAgent?: string
  createdAt: Date
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    page?: number
    limit?: number
    total?: number
    pages?: number
  }
}

// Auth types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  username?: string
  firstName?: string
  lastName?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
  expiresAt: Date
}

// Authentication state
export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<ApiResponse<User>>
  register: (data: RegisterRequest) => Promise<ApiResponse<User>>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
}

// Pagination types
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// File types
export interface FileMetadata {
  filename: string
  originalFilename?: string
  mimeType: string
  size: number
  storagePath: string
  url?: string
  isPublic?: boolean
  metadata?: Record<string, any>
}

// Audit log types
export interface AuditLog {
  id: string
  userId?: string
  action: string
  resourceType?: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  createdAt: Date
}

// Error types
export interface ApiError {
  code: string
  message: string
  details?: any
  status?: number
}

// Common error codes
export const ErrorCodes = {
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  FIELD_REQUIRED: 'FIELD_REQUIRED',
  FIELD_INVALID: 'FIELD_INVALID',
  
  // Resource errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  
  // Permission errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const
