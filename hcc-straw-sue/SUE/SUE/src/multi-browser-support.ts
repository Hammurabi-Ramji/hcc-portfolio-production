/**
 * Phase 6: Multi-Browser Support
 * Firefox and Safari compatibility layer
 */

export type BrowserType = 'chrome' | 'firefox' | 'safari' | 'edge';

export interface BrowserCapabilities {
  type: BrowserType;
  supportsWebAssembly: boolean;
  supportsServiceWorker: boolean;
  supportsStorageAPI: boolean;
  supportsOffscreenCanvas: boolean;
  supportsWebGL: boolean;
  maxStorageSize: number;
}

export interface ManifestConfig {
  browser: BrowserType;
  version: string;
  permissions: string[];
  hostPermissions: string[];
  backgroundScripts: string[];
  contentScripts: Array<{
    matches: string[];
    scripts: string[];
    runAt: string;
  }>;
}

/**
 * Browser Detection and Compatibility Layer
 */
export class BrowserCompatibility {
  private browserType: BrowserType;
  private capabilities: BrowserCapabilities;

  constructor() {
    this.browserType = this.detectBrowser();
    this.capabilities = this.computeCapabilities();
  }

  /**
   * Detect browser type
   */
  private detectBrowser(): BrowserType {
    const userAgent = navigator.userAgent;

    if (userAgent.includes('Firefox')) {
      return 'firefox';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      return 'safari';
    } else if (userAgent.includes('Edg')) {
      return 'edge';
    } else {
      return 'chrome';
    }
  }

  /**
   * Compute browser capabilities
   */
  private computeCapabilities(): BrowserCapabilities {
    const baseCapabilities: BrowserCapabilities = {
      type: this.browserType,
      supportsWebAssembly: typeof WebAssembly !== 'undefined',
      supportsServiceWorker: 'serviceWorker' in navigator,
      supportsStorageAPI: 'storage' in navigator,
      supportsOffscreenCanvas: typeof OffscreenCanvas !== 'undefined',
      supportsWebGL: !!document.createElement('canvas').getContext('webgl'),
      maxStorageSize: this.getMaxStorageSize(),
    };

    // Browser-specific adjustments
    if (this.browserType === 'firefox') {
      baseCapabilities.maxStorageSize = 50 * 1024 * 1024; // 50MB
    } else if (this.browserType === 'safari') {
      baseCapabilities.maxStorageSize = 50 * 1024 * 1024; // 50MB
      baseCapabilities.supportsOffscreenCanvas = false; // Limited support
    } else if (this.browserType === 'chrome') {
      baseCapabilities.maxStorageSize = 100 * 1024 * 1024; // 100MB
    }

    return baseCapabilities;
  }

  /**
   * Get maximum storage size
   */
  private getMaxStorageSize(): number {
    if ('storage' in navigator && typeof navigator.storage?.estimate === 'function') {
      return 100 * 1024 * 1024; // Default 100MB
    }
    return 50 * 1024 * 1024; // Fallback 50MB
  }

  /**
   * Get browser type
   */
  public getBrowserType(): BrowserType {
    return this.browserType;
  }

  /**
   * Get capabilities
   */
  public getCapabilities(): BrowserCapabilities {
    return { ...this.capabilities };
  }

  /**
   * Check if feature is supported
   */
  public isFeatureSupported(feature: keyof BrowserCapabilities): boolean {
    const value = this.capabilities[feature];
    return typeof value === 'boolean' ? value : true;
  }
}

/**
 * Manifest V3 Generator for different browsers
 */
export class ManifestGenerator {
  /**
   * Generate Chrome manifest
   */
  public static generateChromeManifest(version: string): ManifestConfig {
    return {
      browser: 'chrome',
      version,
      permissions: [
        'storage',
        'tabs',
        'activeTab',
        'scripting',
        'webRequest',
        'webRequestBlocking',
      ],
      hostPermissions: ['<all_urls>'],
      backgroundScripts: ['background.js'],
      contentScripts: [
        {
          matches: ['<all_urls>'],
          scripts: ['content.js'],
          runAt: 'document_start',
        },
      ],
    };
  }

  /**
   * Generate Firefox manifest
   */
  public static generateFirefoxManifest(version: string): ManifestConfig {
    return {
      browser: 'firefox',
      version,
      permissions: ['storage', 'tabs', 'activeTab', 'webRequest', 'webRequestBlocking'],
      hostPermissions: ['<all_urls>'],
      backgroundScripts: ['background.js'],
      contentScripts: [
        {
          matches: ['<all_urls>'],
          scripts: ['content.js'],
          runAt: 'document_start',
        },
      ],
    };
  }

  /**
   * Generate Safari manifest
   */
  public static generateSafariManifest(version: string): ManifestConfig {
    return {
      browser: 'safari',
      version,
      permissions: ['storage', 'tabs', 'activeTab'],
      hostPermissions: ['<all_urls>'],
      backgroundScripts: ['background.js'],
      contentScripts: [
        {
          matches: ['<all_urls>'],
          scripts: ['content.js'],
          runAt: 'document_start',
        },
      ],
    };
  }

  /**
   * Generate Edge manifest
   */
  public static generateEdgeManifest(version: string): ManifestConfig {
    return {
      browser: 'edge',
      version,
      permissions: [
        'storage',
        'tabs',
        'activeTab',
        'scripting',
        'webRequest',
        'webRequestBlocking',
      ],
      hostPermissions: ['<all_urls>'],
      backgroundScripts: ['background.js'],
      contentScripts: [
        {
          matches: ['<all_urls>'],
          scripts: ['content.js'],
          runAt: 'document_start',
        },
      ],
    };
  }
}

/**
 * Storage API Compatibility Layer
 */
export class StorageCompat {
  private compatibility: BrowserCompatibility;

  constructor() {
    this.compatibility = new BrowserCompatibility();
  }

  /**
   * Get storage estimate
   */
  public async getStorageEstimate(): Promise<{
    usage: number;
    quota: number;
  }> {
    if ('storage' in navigator && typeof navigator.storage?.estimate === 'function') {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage ?? 0,
        quota: estimate.quota ?? this.compatibility.getCapabilities().maxStorageSize,
      };
    }

    // Fallback for browsers without estimate
    return {
      usage: 0,
      quota: this.compatibility.getCapabilities().maxStorageSize,
    };
  }

  /**
   * Request persistent storage
   */
  public async requestPersistentStorage(): Promise<boolean> {
    if (navigator.storage && navigator.storage.persist) {
      return navigator.storage.persist();
    }
    return false;
  }

  /**
   * Check if storage is persistent
   */
  public async isPersistent(): Promise<boolean> {
    if (navigator.storage && navigator.storage.persisted) {
      return navigator.storage.persisted();
    }
    return false;
  }

  /**
   * Clear storage
   */
  public async clearStorage(): Promise<void> {
    if (navigator.storage && navigator.storage.getDirectory) {
      try {
        const root = await navigator.storage.getDirectory();
        const values = (root as any).values?.();
        if (values) {
          for await (const entry of values) {
            await root.removeEntry(entry.name, { recursive: true });
          }
        }
      } catch (error) {
        console.error('Failed to clear storage:', error);
      }
    }
  }
}

/**
 * API Compatibility Layer
 */
export class APICompat {
  private compatibility: BrowserCompatibility;

  constructor() {
    this.compatibility = new BrowserCompatibility();
  }

  /**
   * Get compatible fetch implementation
   */
  public fetch(resource: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    return fetch(resource, init);
  }

  /**
   * Get compatible IndexedDB
   */
  public getIndexedDB(): IDBFactory {
    return (
      window.indexedDB ||
      (window as any).webkitIndexedDB ||
      (window as any).mozIndexedDB ||
      (window as any).msIndexedDB
    );
  }

  /**
   * Get compatible WebWorker
   */
  public createWorker(scriptURL: string | URL): Worker {
    return new Worker(scriptURL);
  }

  /**
   * Get compatible Blob
   */
  public createBlob(blobParts: BlobPart[], options?: BlobPropertyBag): Blob {
    return new Blob(blobParts, options);
  }

  /**
   * Get compatible URL
   */
  public createObjectURL(object: Blob | MediaSource): string {
    return URL.createObjectURL(object);
  }

  /**
   * Revoke object URL
   */
  public revokeObjectURL(url: string): void {
    URL.revokeObjectURL(url);
  }
}

/**
 * Event Compatibility Layer
 */
export class EventCompat {
  /**
   * Add event listener with compatibility
   */
  public static addEventListener(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void {
    target.addEventListener(type, listener, options);
  }

  /**
   * Remove event listener with compatibility
   */
  public static removeEventListener(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: boolean | EventListenerOptions
  ): void {
    target.removeEventListener(type, listener, options);
  }

  /**
   * Dispatch event with compatibility
   */
  public static dispatchEvent(target: EventTarget, event: Event): boolean {
    return target.dispatchEvent(event);
  }

  /**
   * Create custom event
   */
  public static createCustomEvent(type: string, detail: unknown = null): CustomEvent {
    if (typeof CustomEvent === 'function') {
      return new CustomEvent(type, { detail });
    }

    // Fallback for older browsers
    const event = document.createEvent('CustomEvent');
    event.initCustomEvent(type, true, true, detail);
    return event as any;
  }
}

// Export singletons
export const browserCompatibility = new BrowserCompatibility();
export const storageCompat = new StorageCompat();
export const apiCompat = new APICompat();
