import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (!Number.isFinite(d.getTime())) throw new RangeError('Invalid date')
  const components: (keyof Intl.DateTimeFormatOptions)[] = [
    'weekday', 'era', 'year', 'month', 'day', 'hour', 'minute', 'second',
    'fractionalSecondDigits', 'timeZoneName',
  ]
  const explicitFormat = options?.dateStyle !== undefined || options?.timeStyle !== undefined ||
    components.some(key => options?.[key] !== undefined)
  const format: Intl.DateTimeFormatOptions | undefined = explicitFormat
    ? options : { dateStyle: 'medium', timeStyle: 'short', ...options }
  return new Intl.DateTimeFormat('en-US', format).format(d)
}

/**
 * Truncate a string to a specified length
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.substring(0, length) + '...'
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Generate a random string
 */
export function randomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy:', error)
    return false
  }
}

/**
 * Format bytes to human-readable format
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (!Number.isFinite(bytes) || bytes < 0) throw new RangeError('Bytes must be finite and nonnegative')
  if (!Number.isFinite(decimals)) throw new RangeError('Decimals must be finite')
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = Math.min(100, Math.max(0, Math.trunc(decimals)))
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.min(sizes.length - 1, Math.max(0, Math.floor(Math.log(bytes) / Math.log(k))))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Get the first letter of a string
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

/** Best-effort storage; browser privacy settings can deny access. */
export const localStorageUtils = {
  get: <T>(key: string, fallback?: T): T | undefined => {
    try {
      if (typeof window === 'undefined') return fallback
      const item = window.localStorage.getItem(key)
      return item === null ? fallback : JSON.parse(item) as T
    } catch {
      return fallback
    }
  },
  set: <T>(key: string, value: T): void => {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem(key, JSON.stringify(value))
    } catch { /* Storage is optional. */ }
  },
  remove: (key: string): void => {
    try {
      if (typeof window !== 'undefined') window.localStorage.removeItem(key)
    } catch { /* Storage is optional. */ }
  },
  clear: (): void => {
    try {
      if (typeof window !== 'undefined') window.localStorage.clear()
    } catch { /* Storage is optional. */ }
  },
}

/** @deprecated Legacy storage presence only; supported sessions use HttpOnly cookies. */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null
}

/** @deprecated Legacy compatibility; the API client never reads this credential. */
export function getAuthToken(): string | null {
  try {
    if (typeof window === 'undefined') return null
    const stored = window.localStorage.getItem('auth_token')
    if (!stored) return null
    // Accept tokens written by the old JSON helper as well as raw callers.
    if (stored.startsWith('"')) {
      try {
        const decoded: unknown = JSON.parse(stored)
        return typeof decoded === 'string' && decoded.length > 0 ? decoded : null
      } catch { return null }
    }
    return stored
  } catch { return null }
}

/** @deprecated Legacy compatibility; never use this for cookie authentication. */
export function setAuthToken(token: string): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem('auth_token', token)
  } catch { /* Storage is optional. */ }
}

/** @deprecated Removes legacy browser storage only. */
export function removeAuthToken(): void {
  localStorageUtils.remove('auth_token')
}
