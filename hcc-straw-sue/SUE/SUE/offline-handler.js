// Offline Handler — External script for CSP compliance
// Loads sue.html when connection is restored
// checkConnection() MUST be on window so offline.html onclick="checkConnection()" works.
/* eslint-disable no-console */

let retryTimer = null;

let reloadAttempts = 0;
const MAX_RELOAD_ATTEMPTS = 10;
let reloadDelay = 10000; // start with 10s
const MAX_RELOAD_DELAY = 120000; // cap at 2 min

function isOfflinePage() {
  // Only reload if on offline.html (not sue.html or others)
  return /offline\.html(\?|#|$)/.test(globalThis.location.pathname);
}

async function checkConnection() {
  if (!isOfflinePage()) return; // Guard: only reload from offline.html
  if (reloadAttempts >= MAX_RELOAD_ATTEMPTS) {
    console.warn('[HCC] Max reload attempts reached. Stopping auto-reload.');
    if (retryTimer) {
      clearInterval(retryTimer);
      retryTimer = null;
    }
    return;
  }
  try {
    // Ping the extension's manifest.json to test reachability
    const resp = await fetch(self.location.origin + '/manifest.json', {
      method: 'HEAD',
      cache: 'no-store',
    });
    if (resp.ok) {
      // Back online — reload the real sidebar
      if (retryTimer) {
        clearInterval(retryTimer);
        retryTimer = null;
      }
      reloadAttempts = 0;
      reloadDelay = 10000;
      globalThis.location.replace('sue.html');
      console.log('[HCC] Connection restored');
    } else {
      throw new Error('Manifest fetch not ok: ' + resp.status);
    }
  } catch (err) {
    // Still offline or fetch failed
    reloadAttempts++;
    reloadDelay = Math.min(reloadDelay * 2, MAX_RELOAD_DELAY); // Exponential backoff
    console.debug(
      '[HCC] Still offline:',
      err,
      `Attempt ${reloadAttempts}, next in ${reloadDelay / 1000}s`
    );
    // Reset timer with new delay
    if (retryTimer) {
      clearInterval(retryTimer);
      retryTimer = null;
    }
    retryTimer = setInterval(checkConnection, reloadDelay);
  }
}

// Expose to window so onclick="checkConnection()" in offline.html works
globalThis.checkConnection = checkConnection;

// Listen for the browser's online event

globalThis.addEventListener('online', function () {
  if (!isOfflinePage()) return;
  if (retryTimer) {
    clearInterval(retryTimer);
    retryTimer = null;
  }
  // Only reload if actually back online (double-check)
  checkConnection();
});

// Auto-retry connection every 10 seconds when page loads

globalThis.document.addEventListener('DOMContentLoaded', function () {
  if (isOfflinePage()) {
    retryTimer = setInterval(checkConnection, reloadDelay);
  }
});
