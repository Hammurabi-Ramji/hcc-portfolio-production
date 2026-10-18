/**
 * UI Performance Optimization System
 * Virtual scrolling, debounce/throttle, lazy loading, offline caching, and more
 */

export interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  bufferSize?: number;
  overscan?: number;
}

export interface VirtualScrollState {
  scrollTop: number;
  visibleStart: number;
  visibleEnd: number;
  items: unknown[];
}

export interface DebouncedFunction<T extends (...args: unknown[]) => unknown> {
  (...args: Parameters<T>): void;
  cancel(): void;
  flush(): void;
}

export interface LazyLoadConfig {
  threshold?: number;
  rootMargin?: string;
  loadingClass?: string;
  errorClass?: string;
}

/**
 * VirtualScroller handles rendering large lists efficiently
 */
export class VirtualScroller {
  private config: VirtualScrollConfig;
  private state: VirtualScrollState;

  constructor(config: VirtualScrollConfig) {
    this.config = {
      bufferSize: 5,
      overscan: 3,
      ...config,
    };

    this.state = {
      scrollTop: 0,
      visibleStart: 0,
      visibleEnd: 0,
      items: [],
    };
  }

  /**
   * Update items to render
   */
  public setItems(items: unknown[]): void {
    this.state.items = items;
  }

  /**
   * Handle scroll event
   */
  public handleScroll(scrollTop: number): VirtualScrollState {
    this.state.scrollTop = scrollTop;

    const visibleStart = Math.max(
      0,
      Math.floor(scrollTop / this.config.itemHeight) - this.config.overscan!
    );

    const visibleCount = Math.ceil(this.config.containerHeight / this.config.itemHeight);

    const visibleEnd = Math.min(
      this.state.items.length,
      visibleStart + visibleCount + this.config.overscan! * 2
    );

    this.state.visibleStart = visibleStart;
    this.state.visibleEnd = visibleEnd;

    return this.state;
  }

  /**
   * Get visible items
   */
  public getVisibleItems(): unknown[] {
    return this.state.items.slice(this.state.visibleStart, this.state.visibleEnd);
  }

  /**
   * Get offset for visible items
   */
  public getOffsetY(): number {
    return this.state.visibleStart * this.config.itemHeight;
  }

  /**
   * Get total height
   */
  public getTotalHeight(): number {
    return this.state.items.length * this.config.itemHeight;
  }
}

/**
 * Debounce utility
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): DebouncedFunction<T> {
  let timeout: NodeJS.Timeout | null = null;
  let lastArgs: unknown[] | null = null;

  function debounced(...args: unknown[]): void {
    lastArgs = args;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...(lastArgs || []));
      timeout = null;
      lastArgs = null;
    }, wait);
  }

  debounced.cancel = function (): void {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
      lastArgs = null;
    }
  };

  debounced.flush = function (): void {
    if (timeout) {
      clearTimeout(timeout);
      if (lastArgs) {
        func(...lastArgs);
      }
      timeout = null;
      lastArgs = null;
    }
  };

  return debounced as DebouncedFunction<T>;
}

/**
 * Throttle utility
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  let lastArgs: unknown[] | null = null;

  return function (...args: unknown[]): void {
    lastArgs = args;

    if (!inThrottle) {
      func(...args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          func(...lastArgs);
        }
      }, limit);
    }
  };
}

/**
 * LazyLoader handles lazy loading of images and content
 */
export class LazyLoader {
  private config: LazyLoadConfig;
  private observer: IntersectionObserver | null = null;
  private loadedElements: Set<Element> = new Set();

  constructor(config: LazyLoadConfig = {}) {
    this.config = {
      threshold: 0.1,
      rootMargin: '50px',
      loadingClass: 'lazy-loading',
      errorClass: 'lazy-error',
      ...config,
    };
  }

  /**
   * Initialize lazy loading for images
   */
  public initializeImageLazyLoading(container: Element): void {
    if (!('IntersectionObserver' in window)) {
      // Fallback for browsers without IntersectionObserver
      this.loadAllImages(container);
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.loadImage(entry.target as HTMLImageElement);
          }
        }
      },
      {
        threshold: this.config.threshold,
        rootMargin: this.config.rootMargin,
      }
    );

    const images = container.querySelectorAll('img[data-src]');
    for (const img of images) {
      this.observer.observe(img);
    }
  }

  /**
   * Load a single image
   */
  private loadImage(img: HTMLImageElement): void {
    if (this.loadedElements.has(img)) {
      return;
    }

    const src = img.getAttribute('data-src');
    if (!src) {
      return;
    }

    img.classList.add(this.config.loadingClass!);

    const tempImg = new Image();
    tempImg.onload = () => {
      img.src = src;
      img.classList.remove(this.config.loadingClass!);
      img.classList.add('lazy-loaded');
      this.loadedElements.add(img);

      if (this.observer) {
        this.observer.unobserve(img);
      }
    };

    tempImg.onerror = () => {
      img.classList.remove(this.config.loadingClass!);
      img.classList.add(this.config.errorClass!);
    };

    tempImg.src = src;
  }

  /**
   * Load all images (fallback)
   */
  private loadAllImages(container: Element): void {
    const images = container.querySelectorAll('img[data-src]');
    for (const img of images) {
      this.loadImage(img as HTMLImageElement);
    }
  }

  /**
   * Cleanup
   */
  public cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.loadedElements.clear();
  }
}

/**
 * OfflineCache handles offline caching of resources
 */
export class OfflineCache {
  private cacheName: string = 'sue-offline-cache-v1';
  private urlPatterns: RegExp[] = [];

  constructor() {
    this.initializeDefaultPatterns();
  }

  /**
   * Initialize default cache patterns
   */
  private initializeDefaultPatterns(): void {
    this.urlPatterns = [/\.js$/, /\.css$/, /\.woff2?$/, /\.png|jpg|jpeg|gif|svg$/, /\/api\/v1\//];
  }

  /**
   * Check if URL should be cached
   */
  private shouldCache(url: string): boolean {
    return this.urlPatterns.some((pattern) => pattern.test(url));
  }

  /**
   * Cache a response
   */
  public async cacheResponse(url: string, response: Response): Promise<void> {
    if (!('caches' in window) || !this.shouldCache(url)) {
      return;
    }

    try {
      const cache = await caches.open(this.cacheName);
      await cache.put(url, response.clone());
    } catch (error) {
      console.warn('Failed to cache response:', error);
    }
  }

  /**
   * Get cached response
   */
  public async getCachedResponse(url: string): Promise<Response | null> {
    if (!('caches' in window)) {
      return null;
    }

    try {
      const cache = await caches.open(this.cacheName);
      const match = await cache.match(url);
      return match ?? null;
    } catch (error) {
      console.warn('Failed to get cached response:', error);
      return null;
    }
  }

  /**
   * Clear cache
   */
  public async clearCache(): Promise<void> {
    if (!('caches' in window)) {
      return;
    }

    try {
      await caches.delete(this.cacheName);
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache size
   */
  public async getCacheSize(): Promise<number> {
    if (!('caches' in window) || !('storage' in navigator)) {
      return 0;
    }

    try {
      const estimate = await (navigator.storage as StorageManager).estimate();
      return estimate.usage || 0;
    } catch (error) {
      console.warn('Failed to get cache size:', error);
      return 0;
    }
  }
}

/**
 * PerformanceMonitor tracks UI performance metrics
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();

  /**
   * Start measuring a metric
   */
  public startMeasure(name: string): void {
    if ('performance' in window) {
      performance.mark(`${name}-start`);
    }
  }

  /**
   * End measuring a metric
   */
  public endMeasure(name: string): number {
    if ('performance' in window) {
      performance.mark(`${name}-end`);
      try {
        performance.measure(name, `${name}-start`, `${name}-end`);
        const measures = performance.getEntriesByName(name, 'measure');
        if (measures.length > 0) {
          const duration = measures[measures.length - 1].duration;
          this.recordMetric(name, duration);
          return duration;
        }
      } catch (error) {
        console.warn('Failed to measure performance:', error);
      }
    }
    return 0;
  }

  /**
   * Record a metric
   */
  private recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  /**
   * Get metric statistics
   */
  public getMetricStats(name: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p95: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const count = values.length;
    const min = sorted[0];
    const max = sorted[count - 1];
    const avg = values.reduce((a, b) => a + b, 0) / count;
    const p95 = sorted[Math.floor(count * 0.95)];

    return { count, min, max, avg, p95 };
  }

  /**
   * Clear metrics
   */
  public clearMetrics(): void {
    this.metrics.clear();
  }
}

// Export singleton instances
export const virtualScroller = new VirtualScroller({
  itemHeight: 50,
  containerHeight: 500,
});

export const lazyLoader = new LazyLoader();
export const offlineCache = new OfflineCache();
export const performanceMonitor = new PerformanceMonitor();
