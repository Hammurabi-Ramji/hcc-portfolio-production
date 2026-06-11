/**
 * Phase 4: Bug Fixes & Refinements
 * Error handling, stability, edge cases, security hardening
 */

export interface ErrorReport {
  id: string;
  timestamp: number;
  message: string;
  stack: string;
  context: Record<string, unknown>;
  severity: 'critical' | 'error' | 'warning' | 'info';
}

export interface RecoveryStrategy {
  name: string;
  condition: (error: Error) => boolean;
  handler: (error: Error) => Promise<void>;
}

/**
 * Error Boundary for crash prevention
 */
export class ErrorBoundary {
  private errorHandlers: Map<string, (error: Error) => void> = new Map();
  private errorReports: ErrorReport[] = [];
  private maxReports: number = 1000;
  private recoveryStrategies: RecoveryStrategy[] = [];

  constructor() {
    this.setupGlobalErrorHandlers();
    this.registerDefaultRecoveryStrategies();
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Catch uncaught errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error, 'critical');
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, 'error');
    });
  }

  /**
   * Capture and report error
   */
  public captureError(
    error: Error,
    severity: 'critical' | 'error' | 'warning' | 'info' = 'error',
    context: Record<string, unknown> = {}
  ): void {
    const report: ErrorReport = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack || '',
      context,
      severity,
    };

    this.errorReports.push(report);

    // Keep only recent reports
    if (this.errorReports.length > this.maxReports) {
      this.errorReports.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${severity.toUpperCase()}]`, error, context);
    }

    // Try recovery strategies
    this.attemptRecovery(error);

    // Send to error tracking service
    this.sendErrorReport(report);
  }

  /**
   * Register error handler
   */
  public registerHandler(errorType: string, handler: (error: Error) => void): void {
    this.errorHandlers.set(errorType, handler);
  }

  /**
   * Register recovery strategy
   */
  public registerRecoveryStrategy(strategy: RecoveryStrategy): void {
    this.recoveryStrategies.push(strategy);
  }

  /**
   * Attempt automatic recovery
   */
  private async attemptRecovery(error: Error): Promise<void> {
    for (const strategy of this.recoveryStrategies) {
      if (strategy.condition(error)) {
        try {
          await strategy.handler(error);
          return;
        } catch (recoveryError) {
          console.error('Recovery failed:', recoveryError);
        }
      }
    }
  }

  /**
   * Register default recovery strategies
   */
  private registerDefaultRecoveryStrategies(): void {
    // Network error recovery
    this.registerRecoveryStrategy({
      name: 'network-retry',
      condition: (error) => error.message.includes('fetch') || error.message.includes('network'),
      handler: async (error) => {
        console.log('Attempting network recovery...');
        // Implement retry logic
        await new Promise((resolve) => setTimeout(resolve, 1000));
      },
    });

    // Memory error recovery
    this.registerRecoveryStrategy({
      name: 'memory-cleanup',
      condition: (error) => error.message.includes('memory') || error.message.includes('heap'),
      handler: async () => {
        console.log('Cleaning up memory...');
        if (global.gc) {
          global.gc();
        }
      },
    });

    // Storage error recovery
    this.registerRecoveryStrategy({
      name: 'storage-cleanup',
      condition: (error) => error.message.includes('storage') || error.message.includes('quota'),
      handler: async () => {
        console.log('Cleaning up storage...');
        // Clear old cache entries
        const cache = await caches.keys();
        for (const cacheName of cache) {
          const cacheStorage = await caches.open(cacheName);
          const keys = await cacheStorage.keys();
          for (const request of keys) {
            await cacheStorage.delete(request);
          }
        }
      },
    });
  }

  /**
   * Send error report to tracking service
   */
  private async sendErrorReport(report: ErrorReport): Promise<void> {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
    } catch (error) {
      console.error('Failed to send error report:', error);
    }
  }

  /**
   * Get error reports
   */
  public getErrorReports(severity?: 'critical' | 'error' | 'warning' | 'info'): ErrorReport[] {
    if (severity) {
      return this.errorReports.filter((r) => r.severity === severity);
    }
    return [...this.errorReports];
  }

  /**
   * Clear error reports
   */
  public clearErrorReports(): void {
    this.errorReports = [];
  }
}

/**
 * Session Recovery Manager
 */
export class SessionRecoveryManager {
  private sessionKey: string = 'sue_session_state';
  private autoSaveInterval: number = 30000; // 30 seconds
  private autoSaveTimer: number | null = null;

  /**
   * Save session state
   */
  public saveSessionState(state: Record<string, unknown>): void {
    try {
      const serialized = JSON.stringify({
        state,
        timestamp: Date.now(),
        version: 1,
      });
      localStorage.setItem(this.sessionKey, serialized);
    } catch (error) {
      console.error('Failed to save session state:', error);
    }
  }

  /**
   * Restore session state
   */
  public restoreSessionState(): Record<string, unknown> | null {
    try {
      const stored = localStorage.getItem(this.sessionKey);
      if (!stored) {
        return null;
      }

      const data = JSON.parse(stored);
      const age = Date.now() - data.timestamp;

      // Only restore if less than 24 hours old
      if (age > 86400000) {
        localStorage.removeItem(this.sessionKey);
        return null;
      }

      return data.state;
    } catch (error) {
      console.error('Failed to restore session state:', error);
      return null;
    }
  }

  /**
   * Enable auto-save
   */
  public enableAutoSave(getState: () => Record<string, unknown>): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = window.setInterval(() => {
      this.saveSessionState(getState());
    }, this.autoSaveInterval);
  }

  /**
   * Disable auto-save
   */
  public disableAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Clear session state
   */
  public clearSessionState(): void {
    localStorage.removeItem(this.sessionKey);
  }
}

/**
 * Input Validation & Sanitization
 */
export class InputValidator {
  /**
   * Validate and sanitize string input
   */
  public sanitizeString(input: string, maxLength: number = 10000): string {
    if (typeof input !== 'string') {
      return '';
    }

    // Remove null bytes
    let sanitized = input.replace(/\0/g, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /**
   * Validate email
   */
  public validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL
   */
  public validateURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Escape HTML
   */
  public escapeHTML(input: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return input.replace(/[&<>"']/g, (char) => map[char]);
  }

  /**
   * Validate JSON
   */
  public validateJSON(input: string): boolean {
    try {
      JSON.parse(input);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Rate Limiter
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowSize: number = 60000; // 1 minute
  private maxRequests: number = 100;

  /**
   * Check if request is allowed
   */
  public isAllowed(key: string): boolean {
    const now = Date.now();
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const timestamps = this.requests.get(key)!;

    // Remove old timestamps outside window
    const validTimestamps = timestamps.filter((ts) => now - ts < this.windowSize);

    if (validTimestamps.length >= this.maxRequests) {
      return false;
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    return true;
  }

  /**
   * Reset rate limit for key
   */
  public reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Get remaining requests
   */
  public getRemaining(key: string): number {
    const timestamps = this.requests.get(key) || [];
    const now = Date.now();
    const validTimestamps = timestamps.filter((ts) => now - ts < this.windowSize);
    return Math.max(0, this.maxRequests - validTimestamps.length);
  }
}

// Export singletons
export const errorBoundary = new ErrorBoundary();
export const sessionRecoveryManager = new SessionRecoveryManager();
export const inputValidator = new InputValidator();
export const rateLimiter = new RateLimiter();
