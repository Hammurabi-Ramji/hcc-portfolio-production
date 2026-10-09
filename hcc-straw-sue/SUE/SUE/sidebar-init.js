// SUE — Initialization Script (External, CSP-compliant)
// Loads WASM and mounts Leptos app to body
// MUST be loaded with type="module" (added via sue.html)

import './compression-manager.js';
import './extension-api.js';
import './popover-manager.js';
import './storage-manager.js';
import './view-transitions-manager.js';
import { isSupported as isBackgroundFetchSupported } from './background-fetch-manager.js';
import { getAccentColor, initEyeDropper, initTextDetector } from './eyedropper-manager.js';
import { initOPFS } from './opfs-manager.js';
import './web-locks-manager.js';
import { getGPUInfo } from './webgpu-manager.js';

// Debug logging
console.log('[SUE] Starting initialization...');
console.log('[SUE] Document ready:', document.readyState);

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

async function initApp() {
  console.log('[SUE] DOMContentLoaded fired — loading WASM via webpack bundle');

  try {
    const featureSetupPromise = initializeFeatureSetup();
    const init = await loadWasmInit();

    // No URL argument needed: webpack's asyncWebAssembly experiment handles
    // the WASM fetch internally via its own asset module. Passing a URL here
    // was causing a mismatch between the webpack-hashed WASM name and the
    // chrome.runtime.getURL path.
    await init();
    const featureSetup = await featureSetupPromise;
    console.log('[SUE] WASM init() completed successfully');
    console.log('[SUE] Body children after mount:', document.body.children.length);
    console.log('[SUE] Feature setup ready:', featureSetup.features);
  } catch (err) {
    console.error('[SUE] WASM init() FAILED:', err);
    console.error('[SUE] Error stack:', err.stack);

    // Show error page
    document.body.innerHTML =
      '<div style="padding:24px;color:#ef4444;font-family:sans-serif">' +
      '<h2>SUE failed to load</h2>' +
      '<p><strong>WebAssembly Initialization Error</strong></p>' +
      '<p><pre>' +
      String(err) +
      '</pre></p>' +
      '<p>Check browser console (F12) for details.</p>' +
      '</div>';
  }
}

async function loadWasmInit() {
  const candidates = ['./sue-runtime.js', './sue-view.js', './sue-view/pkg/sue_view.js'];
  const errors = [];

  for (const modulePath of candidates) {
    try {
      const wasmModule = await import(modulePath);
      if (typeof wasmModule.default === 'function') {
        console.log(`[SUE] Loaded WASM module: ${modulePath}`);
        return wasmModule.default;
      }

      errors.push(`${modulePath}: missing default init export`);
    } catch (err) {
      errors.push(`${modulePath}: ${String(err?.message ?? err)}`);
    }
  }

  throw new Error(`Unable to load WASM module. Attempts: ${errors.join(' | ')}`);
}

async function initializeFeatureSetup() {
  const accentColor = await applyAccentColor();
  const backgroundFetch = getBackgroundFetchStatus();
  const opfsReady = await captureFeatureSetup('opfs', () => initOPFS(), false);
  const eyeDropperReady = await captureFeatureSetup('eyeDropper', () => initEyeDropper(), false);
  const textDetectorReady = await captureFeatureSetup(
    'textDetector',
    () => initTextDetector(),
    false
  );
  const featureSetup = {
    ready: true,
    initializedAt: new Date().toISOString(),
    accentColor,
    managers: {
      storageGlobal: Boolean(globalThis.SUEStorageManager),
      viewTransitionsGlobal: Boolean(globalThis.SUEViewTransitionsManager),
      popoverGlobal: Boolean(globalThis.SUEPopoverManager),
      compressionModule: true,
      backgroundFetchModule: true,
      eyedropperModule: true,
      opfsModule: true,
      webLocksModule: true,
      webGpuModule: true,
    },
    features: {
      popover: Boolean(globalThis.SUEPopoverManager?.supportsPopover?.()),
      viewTransitions: Boolean(globalThis.SUEViewTransitionsManager?.supportsViewTransitions?.()),
      webLocks: 'locks' in navigator,
      broadcastChannel: typeof BroadcastChannel !== 'undefined',
      compression: globalThis.CompressionStream !== undefined,
      opfs: opfsReady,
      eyeDropper: eyeDropperReady,
      textDetector: textDetectorReady,
      webGpu: Boolean(getGPUInfo()),
      backgroundFetch,
    },
  };

  globalThis.SUEFeatureSetup = featureSetup;

  await persistFeatureSetup(featureSetup);

  globalThis.dispatchEvent(
    new CustomEvent('sue:features-ready', {
      detail: featureSetup,
    })
  );

  return featureSetup;
}

async function captureFeatureSetup(name, callback, fallbackValue) {
  try {
    return await callback();
  } catch (err) {
    console.warn(`[SUE] ${name} setup failed:`, err);
    return fallbackValue;
  }
}

async function applyAccentColor() {
  const accentColor = await captureFeatureSetup('accent-colour', () => getAccentColor(), '#4a9eed');
  const glow = hexToRgba(accentColor, 0.3);
  const shadowGlow = hexToRgba(accentColor, 0.25);

  document.documentElement.style.setProperty('--blue', accentColor);
  document.documentElement.style.setProperty('--blue-glow', accentColor);
  document.documentElement.style.setProperty('--border-glow', glow);
  document.documentElement.style.setProperty('--shadow-glow', `0 0 30px ${shadowGlow}`);
  document.documentElement.style.setProperty(
    '--gradient-primary',
    `linear-gradient(135deg, ${accentColor} 0%, var(--purple) 50%, var(--pink) 100%)`
  );

  return accentColor;
}

function getBackgroundFetchStatus() {
  if (!navigator.serviceWorker) {
    return { supported: false, reason: 'sw-unavailable' };
  }

  if (!navigator.serviceWorker.controller) {
    return { supported: false, reason: 'sw-not-controller' };
  }

  return {
    supported: Boolean(isBackgroundFetchSupported()),
    reason: isBackgroundFetchSupported() ? null : 'background-fetch-unavailable',
  };
}

async function persistFeatureSetup(featureSetup) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ sue_feature_setup: featureSetup }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve();
    });
  });
}

function hexToRgba(hex, alpha) {
  const normalized = hex.replace('#', '');

  if (!/^[\da-f]{6}$/i.test(normalized)) {
    return `rgba(74, 158, 237, ${alpha})`;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
