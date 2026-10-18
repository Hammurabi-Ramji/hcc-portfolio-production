// SUE Offscreen Worker — External script for MV3 CSP compliance
// Loaded by offscreen.html. Handles clipboard, audio, compute messages
// from the background service worker.

'use strict';

// ── Message listener ──────────────────────────────────────────
chrome.runtime.onMessage.addListener(function (message, _sender, sendResponse) {
  // Only handle messages targeted at the offscreen document
  if (!message || message.target !== 'offscreen') return false;
  if (message.type !== 'OFFSCREEN_MESSAGE') return false;

  const type = message.payload && message.payload.type;
  const data = message.payload && message.payload.data;

  try {
    switch (type) {
      case 'CLIPBOARD_READ':
        // Clipboard API requires a secure context + user gesture history
        navigator.clipboard
          .readText()
          .then(function (text) {
            sendResponse({ success: true, data: text });
          })
          .catch(function (err) {
            sendResponse({ success: false, error: err.message });
          });
        return true; // async response

      case 'CLIPBOARD_WRITE':
        navigator.clipboard
          .writeText(data)
          .then(function () {
            sendResponse({ success: true });
          })
          .catch(function (err) {
            sendResponse({ success: false, error: err.message });
          });
        return true;

      case 'AUDIO_PROCESS':
        sendResponse({
          success: false,
          error: 'AUDIO_PROCESS is not implemented in the extension runtime yet',
        });
        break;

      case 'HEAVY_COMPUTE':
        sendResponse({
          success: false,
          error: 'HEAVY_COMPUTE is not implemented in the extension runtime yet',
        });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown offscreen type: ' + type });
    }
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }

  return true;
});

// ── Stale-ping watchdog ───────────────────────────────────────
// Checks chrome.storage.session every 10s; logs if the background
// stopped pinging us (service worker was likely terminated).
setInterval(function () {
  chrome.storage.session.get('__hcc_offscreen_ping__', function (result) {
    const ping = result['__hcc_offscreen_ping__'];
    if (ping && Date.now() - parseInt(ping, 10) > 30000) {
      console.warn('[SUE Offscreen] Background ping is stale — SW may be sleeping');
    }
  });
}, 10000);

console.log('[SUE Offscreen] Worker ready');
