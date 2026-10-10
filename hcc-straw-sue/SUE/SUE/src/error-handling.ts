// ──────────────────────────────────────────────────────────────
// SUE - ERROR HANDLING MODULE
// ──────────────────────────────────────────────────────────────

import { AppError, ErrorConfig } from '../types/index.js';

// ──────────────────────────────────────────────────────────────
// ERROR CATALOG
// ──────────────────────────────────────────────────────────────

export const ERROR_CONFIG: Record<string, ErrorConfig> = {
  // Network errors
  NETWORK_TIMEOUT: {
    category: 'NETWORK',
    message: 'Request timeout',
    userMessage: 'The request timed out. Please try again.',
    retryable: true,
  },
  NETWORK_UNAVAILABLE: {
    category: 'NETWORK',
    message: 'Network unavailable',
    userMessage: 'Unable to connect. Please check your internet connection.',
    retryable: true,
  },
  NETWORK_ERROR: {
    category: 'NETWORK',
    message: 'Network error',
    userMessage: 'A network error occurred. Please try again.',
    retryable: true,
  },

  // Storage errors
  STORAGE_QUOTA_EXCEEDED: {
    category: 'STORAGE',
    message: 'Storage quota exceeded',
    userMessage: 'Storage is full. Please clear some space.',
    retryable: false,
  },
  STORAGE_ERROR: {
    category: 'STORAGE',
    message: 'Storage error',
    userMessage: 'Unable to save data. Please try again.',
    retryable: true,
  },

  // Authentication errors
  AUTH_INVALID_CREDENTIALS: {
    category: 'AUTH',
    message: 'Invalid credentials',
    userMessage: 'Invalid username or password.',
    retryable: true,
  },
  AUTH_TOKEN_EXPIRED: {
    category: 'AUTH',
    message: 'Token expired',
    userMessage: 'Your session has expired. Please log in again.',
    retryable: false,
  },
  AUTH_UNAUTHORIZED: {
    category: 'AUTH',
    message: 'Unauthorized',
    userMessage: 'You are not authorized to perform this action.',
    retryable: false,
  },

  // Validation errors
  VALIDATION_ERROR: {
    category: 'VALIDATION',
    message: 'Validation error',
    userMessage: 'Please check your input and try again.',
    retryable: true,
  },
  VALIDATION_REQUIRED: {
    category: 'VALIDATION',
    message: 'Required field missing',
    userMessage: 'This field is required.',
    retryable: true,
  },

  // System errors
  SYSTEM_UNKNOWN: {
    category: 'SYSTEM',
    message: 'Unknown error',
    userMessage: 'An unexpected error occurred. Please try again.',
    retryable: true,
  },
  SYSTEM_ERROR: {
    category: 'SYSTEM',
    message: 'System error',
    userMessage: 'An internal error occurred. Please try again.',
    retryable: true,
  },
  SYSTEM_NOT_IMPLEMENTED: {
    category: 'SYSTEM',
    message: 'Not implemented',
    userMessage: 'This feature is not yet available.',
    retryable: false,
  },

  // WASM errors
  WASM_LOAD_FAILURE: {
    category: 'SYSTEM',
    message: 'WASM load failure',
    userMessage: 'Failed to load the application. Please refresh the page.',
    retryable: true,
  },
  WASM_INIT_ERROR: {
    category: 'SYSTEM',
    message: 'WASM initialization error',
    userMessage: 'Error initializing the application.',
    retryable: false,
  },

  // Sidebar errors
  SIDEBAR_INJECTION_FAILURE: {
    category: 'UI',
    message: 'Sidebar injection failed',
    userMessage: 'Unable to load the sidebar. Please refresh the page.',
    retryable: true,
  },
};

// ──────────────────────────────────────────────────────────────
// ERROR CLASS
// ──────────────────────────────────────────────────────────────

export class HCCError extends Error {
  public readonly code: string;
  public readonly category: ErrorConfig['category'];
  public readonly userMessage: string;
  public readonly retryable: boolean;
  public readonly details?: unknown;
  public readonly timestamp: number;
  public readonly stackTrace?: string;

  constructor(
    code: string,
    options?: {
      message?: string;
      category?: ErrorConfig['category'];
      userMessage?: string;
      retryable?: boolean;
      details?: unknown;
    }
  ) {
    const config = ERROR_CONFIG[code] || {
      category: 'SYSTEM',
      message: 'Unknown error',
      userMessage: 'An unexpected error occurred.',
      retryable: true,
    };

    super(options?.message || config.message);

    this.code = code;
    this.category = options?.category || config.category;
    this.userMessage = options?.userMessage || config.userMessage;
    this.retryable = options?.retryable ?? config.retryable;
    this.details = options?.details;
    this.timestamp = Date.now();
    this.stackTrace = new Error().stack;

    Object.setPrototypeOf(this, HCCError.prototype);
  }

  toJSON() {
    return {
      code: this.code,
      category: this.category,
      message: this.message,
      userMessage: this.userMessage,
      retryable: this.retryable,
      timestamp: this.timestamp,
      details: this.details,
    };
  }
}

// ──────────────────────────────────────────────────────────────
// ERROR HANDLER UTILITIES
// ──────────────────────────────────────────────────────────────

export function createError(
  code: string,
  options?: {
    message?: string;
    category?: ErrorConfig['category'];
    userMessage?: string;
    retryable?: boolean;
    details?: unknown;
  }
): HCCError {
  return new HCCError(code, options);
}

export function handleError(error: unknown, context?: string): HCCError {
  if (error instanceof HCCError) {
    if (context) {
      console.error(`[${context}] ${error.message}:`, error.details);
    }
    return error;
  }

  const message = error instanceof Error ? error.message : 'Unknown error';
  const newError = createError('SYSTEM_UNKNOWN', {
    message: context ? `${context}: ${message}` : message,
    details: error,
  });

  if (context) {
    console.error(`[${context}] ${message}:`, error);
  }

  return newError;
}

export async function safeExecute<T>(
  operation: () => Promise<T>,
  errorContext?: string,
  fallbackValue?: T
): Promise<{ success: boolean; data?: T; error?: HCCError }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const hccError = handleError(error, errorContext);
    return {
      success: false,
      error: hccError,
      data: fallbackValue,
    };
  }
}

// ──────────────────────────────────────────────────────────────
// FALLBACK MECHANISMS
// ──────────────────────────────────────────────────────────────

export class FallbackManager {
  private readonly maxRetries: number;
  private readonly delayMs: number;
  private retryCount: Map<string, number> = new Map();

  constructor(options?: { maxRetries?: number; delayMs?: number }) {
    this.maxRetries = options?.maxRetries ?? 3;
    this.delayMs = options?.delayMs ?? 1000;
  }

  shouldRetry(operationId: string): boolean {
    const count = this.retryCount.get(operationId) ?? 0;
    return count < this.maxRetries;
  }

  incrementRetry(operationId: string): number {
    const count = (this.retryCount.get(operationId) ?? 0) + 1;
    this.retryCount.set(operationId, count);
    return count;
  }

  resetRetry(operationId: string): void {
    this.retryCount.delete(operationId);
  }

  async executeWithFallback<T>(
    operationId: string,
    operations: Array<{
      execute: () => Promise<T>;
      isFallback?: boolean;
    }>,
    options?: {
      onRetry?: (attempt: number, operation: number) => void;
      onError?: (error: HCCError, attempt: number) => void;
    }
  ): Promise<{ success: boolean; data?: T; error?: HCCError; attempt: number }> {
    let lastError: HCCError | null = null;

    for (let attempt = 0; attempt < operations.length; attempt++) {
      const operation = operations[attempt];

      try {
        if (attempt > 0) {
          options?.onRetry?.(attempt, operations.length);
          await new Promise((resolve) => setTimeout(resolve, this.delayMs));
        }

        const data = await operation.execute();
        return { success: true, data, attempt: attempt + 1 };
      } catch (error) {
        lastError = handleError(error);
        options?.onError?.(lastError, attempt);

        if (attempt === operations.length - 1) {
          break;
        }
      }
    }

    return { success: false, error: lastError!, attempt: operations.length };
  }
}

// ──────────────────────────────────────────────────────────────
// STORAGE FALLBACK
// ──────────────────────────────────────────────────────────────

export class StorageFallback {
  private readonly storage: Storage;
  private readonly maxRetries = 3;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  async get<T>(key: string, fallback: T): Promise<T> {
    try {
      const value = this.storage.getItem(key);
      return value ? (JSON.parse(value) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  async set<T>(key: string, value: T): Promise<boolean> {
    let retries = 0;

    while (retries < this.maxRetries) {
      try {
        this.storage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        retries++;

        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.warn('Storage quota exceeded, attempting cleanup');
          await this.cleanupOldItems();
          continue;
        }

        if (retries === this.maxRetries) {
          console.error('Storage set failed after retries:', error);
          return false;
        }
      }
    }

    return false;
  }

  async remove(key: string): Promise<boolean> {
    try {
      this.storage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      this.storage.clear();
      return true;
    } catch {
      return false;
    }
  }

  private async cleanupOldItems(): Promise<void> {
    const keys = Object.keys(this.storage);
    const now = Date.now();

    // Remove items older than 7 days (assuming they have timestamp)
    for (const key of keys) {
      try {
        const value = this.storage.getItem(key);
        if (value) {
          const parsed = JSON.parse(value);
          if (parsed.timestamp && now - parsed.timestamp > 7 * 24 * 60 * 60 * 1000) {
            this.storage.removeItem(key);
          }
        }
      } catch {
        // Ignore invalid JSON items
      }
    }
  }
}

// ──────────────────────────────────────────────────────────────
// NETWORK FALLBACK
// ──────────────────────────────────────────────────────────────

export class NetworkFallback {
  private readonly timeoutMs: number;
  private readonly maxRetries = 3;

  constructor(options?: { timeoutMs?: number }) {
    this.timeoutMs = options?.timeoutMs ?? 10000;
  }

  async fetch<T>(
    url: string,
    options?: RequestInit
  ): Promise<{ success: boolean; data?: T; error?: HCCError }> {
    let lastError: HCCError | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new HCCError('NETWORK_ERROR', {
            message: `HTTP ${response.status}`,
            details: await response.text(),
          });
        }

        const data = await response.json();
        return { success: true, data: data as T };
      } catch (error) {
        lastError = handleError(error);

        if (attempt === this.maxRetries) {
          break;
        }

        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    return { success: false, error: lastError! };
  }
}

// ──────────────────────────────────────────────────────────────
// INITIALIZATION
// ──────────────────────────────────────────────────────────────

export async function initializeErrorHandling(): Promise<void> {
  // Global error handler
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
  });

  // Global promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });

  console.log('Error handling initialized');
}
