// SUE — Debug Initialization Script
// Logs all errors for debugging

import init from './sue-runtime.js';

const wasmUrl = chrome.runtime.getURL('sue-runtime.wasm');

console.log('[HCC DEBUG] Starting WASM initialization...');
console.log('[HCC DEBUG] WASM URL:', wasmUrl);

init({ module_or_path: wasmUrl })
  .then(function (result) {
    console.log('[HCC DEBUG] WASM initialized successfully!');
    console.log('[HCC DEBUG] Result:', result);
    console.log('[HCC DEBUG] Body element:', document.body);
    console.log('[HCC DEBUG] Body children:', document.body.children.length);

    // Wait a bit to see if Leptos mounts anything
    setTimeout(function () {
      console.log('[HCC DEBUG] After timeout - Body children:', document.body.children.length);
      if (document.body.children.length === 0) {
        console.error('[HCC DEBUG] ERROR: Leptos did not mount any content to body!');
      }
    }, 2000);
  })
  .catch(function (err) {
    console.error('[HCC DEBUG] WASM init FAILED:', err);
    console.error('[HCC DEBUG] Error stack:', err.stack);
    console.error('[HCC DEBUG] Error type:', err.constructor.name);

    // Show detailed error
    document.body.innerHTML =
      '<div style="padding:24px;color:#ef4444;font-family:sans-serif">' +
      '<h2>HCC failed to load</h2>' +
      '<p><strong>WASM Initialization Failed</strong></p>' +
      '<p>Error: ' +
      String(err) +
      '</p>' +
      '<p>Type: ' +
      (err.constructor ? err.constructor.name : 'unknown') +
      '</p>' +
      '<pre style="font-size:11px;overflow:auto">' +
      String(err.stack || '') +
      '</pre>' +
      '<p>Check browser console (F12) for full details.</p>' +
      '</div>';
  });

console.log('[HCC DEBUG] init() promise returned');
