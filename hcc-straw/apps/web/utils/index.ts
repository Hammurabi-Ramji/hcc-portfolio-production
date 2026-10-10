export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}

// Shared helpers have one implementation; lib/utils.ts retains its Tailwind-aware API.
export {
  debounce, throttle, capitalize, slugify, truncate, formatNumber,
  formatCurrency, formatBytes, formatDate, generateId, randomString,
  copyToClipboard, deepClone, isEmail, isUrl, sleep, downloadFile,
} from './helpers';

export function scrollToElement(elementId: string): void {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

export function getScrollbarWidth(): number {
  if (typeof window === 'undefined') return 0;
  const scrollbarDiv = document.createElement('div');
  scrollbarDiv.style.width = '100px';
  scrollbarDiv.style.height = '100px';
  scrollbarDiv.style.overflow = 'scroll';
  document.body.appendChild(scrollbarDiv);
  const scrollbarWidth = scrollbarDiv.offsetWidth - scrollbarDiv.clientWidth;
  document.body.removeChild(scrollbarDiv);
  return scrollbarWidth;
}

export function getViewportHeight(): number {
  if (typeof window === 'undefined') return 0;
  return window.innerHeight;
}

export function getViewportWidth(): number {
  if (typeof window === 'undefined') return 0;
  return window.innerWidth;
}
