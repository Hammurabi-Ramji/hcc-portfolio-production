// SUE — Offscreen Document Manager
// Handles audio processing, clipboard access, heavy computation
/* eslint-disable no-console */

const OFFSCREEN_DOCUMENT_PATH = chrome.runtime.getURL('offscreen.html');
const OFFSCREEN_ACTIVE_KEY = '__hcc_offscreen_active__';
const OFFSCREEN_PING_KEY = '__hcc_offscreen_ping__';

// Check if offscreen document already exists using the real Chrome API.
// Falls back to storage if chrome.offscreen.hasDocument is unavailable.
function hasOffscreenDocument() {
  // Chrome 116+ provides the real API — use it if available
  if (chrome.offscreen && typeof chrome.offscreen.hasDocument === 'function') {
    return chrome.offscreen.hasDocument();
  }
  // Older Chrome: fall back to session storage flag
  return new Promise(function (resolve) {
    chrome.storage.session.get(OFFSCREEN_ACTIVE_KEY, function (result) {
      resolve(result[OFFSCREEN_ACTIVE_KEY] === 'true');
    });
  });
}

// Create offscreen document for workers/clipboard access
function createOffscreenDocument(reason = 'WORKERS') {
  // hasOffscreenDocument() returns a Promise — must check via .then()
  return hasOffscreenDocument().then(function (already) {
    if (already) {
      console.log('[HCC Offscreen] Already active');
      return true;
    }
    return _doCreateOffscreenDocument(reason);
  });
}

// Internal: actually create the document (called only when not already active)
function _doCreateOffscreenDocument(reason = 'WORKERS') {
  const requiresReasons = [];
  if (reason.includes('WORKERS')) requiresReasons.push('WORKERS');
  if (reason.includes('CLIPBOARD')) requiresReasons.push('CLIPBOARD');
  if (requiresReasons.length === 0) requiresReasons.push('WORKERS');

  // chrome.offscreen.createDocument returns a Promise in MV3 — no callback
  return chrome.offscreen
    .createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: requiresReasons,
      justification: 'Process audio, clipboard, and heavy computation',
    })
    .then(function () {
      return new Promise(function (resolve) {
        chrome.storage.session.set({ [OFFSCREEN_ACTIVE_KEY]: 'true' }, function () {
          console.log('[HCC Offscreen] Document created successfully');
          resolve(true);
        });
      });
    })
    .catch(function (err) {
      // "Only a single offscreen document may be created" is not fatal
      if (err?.message?.includes('single offscreen')) {
        console.log('[HCC Offscreen] Already exists (caught duplicate create)');
        return true;
      }
      console.error('[HCC Offscreen] Failed to create document:', err);
      throw err;
    });
}

// Close the offscreen document
function closeOffscreenDocument() {
  return chrome.offscreen
    .closeDocument()
    .then(function () {
      return new Promise(function (resolve) {
        chrome.storage.session.remove(OFFSCREEN_ACTIVE_KEY, function () {
          console.log('[HCC Offscreen] Document closed');
          resolve();
        });
      });
    })
    .catch(function (err) {
      console.warn('[HCC Offscreen] Close error (may already be closed):', err);
    });
}

// Send message to offscreen document
function sendToOffscreen(type, data) {
  return new Promise(function (resolve, reject) {
    chrome.runtime.sendMessage(
      {
        target: 'offscreen',
        type: 'OFFSCREEN_MESSAGE',
        payload: { type: type, data: data },
      },
      function (response) {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      }
    );
  });
}

// Keep offscreen document alive during critical operations
function keepOffscreenAlive() {
  let keepAliveInterval = null;

  function startKeepAlive() {
    keepAliveInterval = setInterval(function () {
      chrome.storage.session.get(OFFSCREEN_ACTIVE_KEY, function (result) {
        if (result[OFFSCREEN_ACTIVE_KEY] === 'true') {
          chrome.storage.session.set({ [OFFSCREEN_PING_KEY]: Date.now().toString() });
        }
      });
    }, 15000);
  }

  function stopKeepAlive() {
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
  }

  startKeepAlive();
  return { stop: stopKeepAlive };
}

// Run an operation that needs the offscreen document
function withOffscreen(operation, reason = 'WORKERS') {
  let cleanup = null;
  let created = false;

  return hasOffscreenDocument().then(function (active) {
    if (active) {
      return operation();
    }

    return createOffscreenDocument(reason)
      .then(function () {
        created = true;
        cleanup = keepOffscreenAlive();
        return operation();
      })
      .then(function (result) {
        if (cleanup) {
          cleanup.stop();
        }
        if (created) {
          setTimeout(function () {
            closeOffscreenDocument();
          }, 5000);
        }
        return result;
      })
      .catch(function (err) {
        if (cleanup) {
          cleanup.stop();
        }
        throw err;
      });
  });
}

// Export to global scope (works in both window and service worker contexts)
const _exports = {
  hasOffscreenDocument: hasOffscreenDocument,
  createOffscreenDocument: createOffscreenDocument,
  closeOffscreenDocument: closeOffscreenDocument,
  sendToOffscreen: sendToOffscreen,
  keepOffscreenAlive: keepOffscreenAlive,
  withOffscreen: withOffscreen,
};

globalThis.HCCOffscreenManager = _exports;
