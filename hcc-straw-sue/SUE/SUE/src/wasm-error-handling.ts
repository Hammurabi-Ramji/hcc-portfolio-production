// ──────────────────────────────────────────────────────────────
// SUE - WASM ERROR HANDLING
// Safe error handling for Rust WASM integration
// ──────────────────────────────────────────────────────────────

import { createError, HCCError } from './error-handling.js';

// ──────────────────────────────────────────────────────────────
// WASM LOADING WITH FALLBACKS
// ──────────────────────────────────────────────────────────────

interface WASMBundle {
  wasmUrl: string;
  jsUrl: string;
  onload?: () => void;
  onerror?: (error: Error) => void;
}

export async function loadWasmBundle(
  bundle: WASMBundle,
  options?: {
    timeoutMs?: number;
    fallback?: () => void;
  }
): Promise<{ success: boolean; error?: HCCError }> {
  const timeoutMs = options?.timeoutMs ?? 30000;

  return new Promise((resolve) => {
    let resolved = false;
    let timer: NodeJS.Timeout | null = null;

    const cleanup = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const fail = (error: Error) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        bundle.onerror?.(error);
        resolve({
          success: false,
          error: createError('WASM_LOAD_FAILURE', {
            message: error.message,
            details: error,
          }),
        });
      }
    };

    const succeed = () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        bundle.onload?.();
        resolve({ success: true });
      }
    };

    // Set timeout
    timer = setTimeout(() => {
      fail(
        createError('NETWORK_TIMEOUT', {
          message: 'WASM bundle load timeout',
        })
      );
    }, timeoutMs);

    try {
      // Create script tag
      const script = document.createElement('script');
      script.src = bundle.jsUrl;

      script.onload = () => {
        // Try to load WASM file
        loadWasmFile(bundle.wasmUrl)
          .then(() => succeed())
          .catch((wasmError) => {
            console.warn('WASM file load failed:', wasmError);
            // Continue anyway, some features may not work
            succeed();
          });
      };

      script.onerror = () => {
        fail(new Error('Failed to load WASM JavaScript bundle'));
      };

      // Append to body
      document.body.appendChild(script);
    } catch (error) {
      fail(error as Error);
    }
  });
}

// ──────────────────────────────────────────────────────────────
// WASM FILE LOADING
// ──────────────────────────────────────────────────────────────

async function loadWasmFile(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve();
      } else {
        reject(new Error(`WASM fetch failed: ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('WASM fetch network error'));
    };

    xhr.onabort = () => {
      reject(new Error('WASM fetch aborted'));
    };

    xhr.open('GET', url);
    xhr.responseType = 'arraybuffer';
    xhr.send();
  });
}

// ──────────────────────────────────────────────────────────────
// SAFE WASM EXECUTION
// ──────────────────────────────────────────────────────────────

export class SafeWasmExecutor {
  private readonly wasmInstance: WebAssembly.Instance | null;

  constructor(wasmInstance: WebAssembly.Instance | null) {
    this.wasmInstance = wasmInstance;
  }

  execute<T>(
    functionName: string,
    args: unknown[] = [],
    options?: {
      timeoutMs?: number;
      fallback?: T;
    }
  ): { success: boolean; data?: T; error?: HCCError } {
    try {
      if (!this.wasmInstance) {
        return {
          success: false,
          error: createError('WASM_INIT_ERROR', {
            message: 'WASM not initialized',
          }),
        };
      }

      const func = this.wasmInstance.exports[functionName] as CallableFunction | undefined;

      if (typeof func !== 'function') {
        return {
          success: false,
          error: createError('SYSTEM_NOT_IMPLEMENTED', {
            message: `WASM function not found: ${functionName}`,
          }),
        };
      }

      try {
        const result = func(...args) as T;
        return { success: true, data: result };
      } catch (wasmError) {
        if (options?.fallback !== undefined) {
          return { success: false, data: options.fallback };
        }

        return {
          success: false,
          error: createError('SYSTEM_ERROR', {
            message: `WASM execution error: ${functionName}`,
            details: wasmError,
          }),
        };
      }
    } catch (error) {
      return {
        success: false,
        error: createError('SYSTEM_ERROR', {
          message: `WASM executor error: ${functionName}`,
          details: error,
        }),
      };
    }
  }
}

// ──────────────────────────────────────────────────────────────
// ERROR CONVERSION FROM RUST PANIC
// ──────────────────────────────────────────────────────────────

// Global panic handler for WASM
export function setupWasmPanicHandler(): void {
  // Handle Rust panics
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      const error = event.error;

      if (error?.message?.includes('rust') || error?.message?.includes('panic')) {
        console.error('WASM Panic detected:', error);

        // Show user-friendly error message
        showErrorOverlay('WASM Error', 'An internal error occurred. Please refresh the page.');
      }
    });
  }
}

function showErrorOverlay(title: string, message: string): void {
  // Remove existing overlay
  const existing = document.getElementById('hcc-error-overlay');
  if (existing) {
    existing.remove();
  }

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'hcc-error-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
  `;

  // Create error box
  const errorBox = document.createElement('div');
  errorBox.style.cssText = `
    background: #fff;
    color: #000;
    padding: 24px;
    border-radius: 8px;
    max-width: 400px;
    text-align: center;
  `;

  const titleEl = document.createElement('h3');
  titleEl.textContent = title;
  titleEl.style.cssText = 'margin-bottom: 12px; color: #ef4444;';

  const messageEl = document.createElement('p');
  messageEl.textContent = message;
  messageEl.style.cssText = 'margin-bottom: 16px;';

  const retryBtn = document.createElement('button');
  retryBtn.textContent = 'Retry';
  retryBtn.style.cssText = `
    padding: 8px 16px;
    background: #4a9eed;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
  `;

  retryBtn.onclick = () => {
    window.location.reload();
  };

  errorBox.appendChild(titleEl);
  errorBox.appendChild(messageEl);
  errorBox.appendChild(retryBtn);
  overlay.appendChild(errorBox);
  document.body.appendChild(overlay);
}

// ──────────────────────────────────────────────────────────────
// MEMORY LIMIT HANDLING
// ──────────────────────────────────────────────────────────────

export function checkWasmMemoryLimit(): boolean {
  if (typeof performance === 'undefined') {
    return true; // Can't check, assume OK
  }

  const memoryUsage = (
    performance as Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    }
  ).memory;

  if (!memoryUsage) {
    return true;
  }

  const usedHeapSize = memoryUsage.usedJSHeapSize;
  const heapSizeLimit = memoryUsage.jsHeapSizeLimit;

  const usagePercent = (usedHeapSize / heapSizeLimit) * 100;

  if (usagePercent > 80) {
    console.warn(`WASM memory usage high: ${usagePercent.toFixed(1)}%`);
    return false;
  }

  return true;
}

export function cleanupWasmResources(): void {
  // Garbage collection hint
  if (typeof window !== 'undefined' && window.gc) {
    window.gc();
  }

  // Clear any pending timeouts
  // Note: Can't clear all timeouts, but can track them
  console.log('WASM resources cleanup requested');
}

// ──────────────────────────────────────────────────────────────
// EXPORTS
// ──────────────────────────────────────────────────────────────

export const WASM_CONFIG = {
  DEFAULT_TIMEOUT: 30000,
  EXECUTION_TIMEOUT: 5000,
  MEMORY_WARNING_THRESHOLD: 80,
};
