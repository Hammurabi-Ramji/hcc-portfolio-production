/* eslint-disable no-console */

function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(response);
    });
  });
}

globalThis.sueRequestJson = function sueRequestJson(messageJson) {
  return sendMessage(JSON.parse(messageJson));
};

console.log('[SUE] Extension API bridge ready');
