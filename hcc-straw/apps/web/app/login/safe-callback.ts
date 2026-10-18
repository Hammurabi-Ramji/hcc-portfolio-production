/**
 * Accept only same-origin relative paths for post-login return.
 * Rejects protocol-relative, absolute, and escape-prone values.
 */
export function safeCallback(value: string | null | undefined): string {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    value.includes('://')
  ) {
    return '/dashboard';
  }
  return value;
}
