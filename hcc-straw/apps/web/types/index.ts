/** JSON timestamps are ISO 8601 strings; clients do not hydrate Date objects. */
export type IsoTimestamp = string

// Wire DTOs. User flags must come from persisted server state, not UI defaults.
export interface UserDto {
  id: string
  email: string
  username?: string
  role: UserRole
  emailVerified: boolean
  isActive: boolean
  createdAt: IsoTimestamp
  updatedAt: IsoTimestamp
  profile?: ProfileDto
}

/** Compatibility name for the wire DTO, not a Date-based domain model. */
export type User = UserDto

export type UserRole = 'admin' | 'user' | 'moderator'

// Profile types
export interface ProfileDto {
  id: string
  userId: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  bio?: string
  website?: string
  location?: string
  metadata?: Record<string, unknown>
  createdAt: IsoTimestamp
  updatedAt: IsoTimestamp
}

export type Profile = ProfileDto

// Public session metadata; the credential travels only in an HttpOnly cookie.
export interface SessionDto {
  id: string
  userId: string
  expiresAt: IsoTimestamp
  ipAddress?: string
  userAgent?: string
  createdAt: IsoTimestamp
}

export type Session = SessionDto

// One envelope per HTTP response. Void operations serialize data: null.
export interface ApiSuccess<T> {
  success: true
  data: [T] extends [void] ? null : T
  error?: never
}

export interface ApiFailure {
  success: false
  error: ApiError
  data?: never
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiFailure

// Auth types
export interface LoginRequest {
  email: string
  password: string
  /** Requests a bounded persistent server cookie; never browser token storage. */
  rememberMe?: boolean
}

export interface RegisterRequest {
  email: string
  password: string
  username?: string
  firstName?: string
  lastName?: string
}

/** @deprecated Legacy compatibility only. Cookie authentication returns AuthResponse. */
export interface AuthTokens {
  accessToken: string
  refreshToken?: string
  expiresAt: IsoTimestamp
}

export interface AuthResponse {
  user: UserDto
}

// Cookie authentication state; browser storage never holds a session credential.
export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<ApiResponse<User>>
  register: (data: RegisterRequest) => Promise<ApiResponse<User>>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  updateUser: (user: Partial<User>) => void
}

// Pagination types
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  pages: number
}

/** List payload inside ApiResponse: { success: true, data: { data: [], meta } }. */
export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export type PaginatedDto<T> = PaginatedResponse<T>

export type ProjectStatus = 'active' | 'completed' | 'archived' | 'draft'

export interface ProjectDto {
  id: string
  name: string
  description?: string
  status: ProjectStatus
  createdAt: IsoTimestamp
  updatedAt: IsoTimestamp
  createdBy: string
}

export type Project = ProjectDto

// File types
export interface FileMetadata {
  filename: string
  originalFilename?: string
  mimeType: string
  size: number
  storagePath: string
  url?: string
  isPublic?: boolean
  metadata?: Record<string, unknown>
}

// Audit log types
export interface AuditLogDto {
  id: string
  userId?: string
  action: string
  resourceType?: string
  resourceId?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  createdAt: IsoTimestamp
}

export type AuditLog = AuditLogDto

// Error types
export interface ApiError {
  code: string
  message: string
  details?: unknown
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
