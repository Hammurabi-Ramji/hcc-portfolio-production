// SUE — Storage Manager
// Optimized storage operations with batching and debouncing

// Storage Queue
let storageQueue = [];
let isFlushing = false;
const FLUSH_DELAY = 100; // Batch writes within 100ms

// Add storage operation to queue
function queueStorageOperation(type, key, value) {
  storageQueue.push({ type: type, key: key, value: value });

  if (!isFlushing) {
    setTimeout(flushStorageQueue, FLUSH_DELAY);
  }
}

// Flush queued storage operations
function flushStorageQueue() {
  if (isFlushing || storageQueue.length === 0) return;

  isFlushing = true;
  const operations = storageQueue.slice();
  storageQueue = [];

  const promise = new Promise(function (resolve) {
    if (operations[0].type === 'set') {
      // Batch set operations
      const setOps = {};
      operations.forEach(function (op) {
        setOps[op.key] = op.value;
      });

      chrome.storage.local.set(setOps, function () {
        console.log('[SUE Storage] Batch set ' + operations.length + ' items');
        resolve();
      });
    } else {
      // Individual get operations (can't batch)
      chrome.storage.local.get(
        operations.map(function (op) {
          return op.key;
        }),
        function (result) {
          console.log('[SUE Storage] Batch get ' + operations.length + ' items');
          resolve(result);
        }
      );
    }
  });

  isFlushing = false;
  return promise;
}

// Get storage value with caching
function storageGet(key) {
  queueStorageOperation('get', key);
  return new Promise(function (resolve) {
    setTimeout(function () {
      chrome.storage.local.get(key, function (result) {
        resolve(result[key]);
      });
    }, FLUSH_DELAY);
  });
}

// Set storage value with batching
function storageSet(key, value) {
  queueStorageOperation('set', key, value);
  return Promise.resolve();
}

// Remove storage value
function storageRemove(key) {
  return new Promise(function (resolve) {
    chrome.storage.local.remove(key, function () {
      console.log('[SUE Storage] Removed: ' + key);
      resolve();
    });
  });
}

// Clear all storage
function storageClear() {
  return new Promise(function (resolve) {
    chrome.storage.local.clear(function () {
      console.log('[SUE Storage] Cleared all storage');
      resolve();
    });
  });
}

// Get multiple keys
function storageGetMultiple(keys) {
  return new Promise(function (resolve) {
    chrome.storage.local.get(keys, function (result) {
      resolve(result);
    });
  });
}

// Event Listener for Storage Changes
chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (namespace === 'local') {
    console.log('[SUE Storage] Changes detected:', Object.keys(changes));
  }
});

// Get storage size
function getStorageSize() {
  return new Promise(function (resolve) {
    chrome.storage.local.get(null, function (storage) {
      const size = JSON.stringify(storage).length;
      console.log('[SUE Storage] Current size: ' + (size / 1024).toFixed(2) + ' KB');
      resolve(size);
    });
  });
}

// Export to global scope
if (typeof window !== 'undefined') {
  window.SUEStorageManager = {
    storageGet: storageGet,
    storageSet: storageSet,
    storageRemove: storageRemove,
    storageClear: storageClear,
    storageGetMultiple: storageGetMultiple,
    getStorageSize: getStorageSize,
  };
} else {
  self.SUEStorageManager = {
    storageGet: storageGet,
    storageSet: storageSet,
    storageRemove: storageRemove,
    storageClear: storageClear,
    storageGetMultiple: storageGetMultiple,
    getStorageSize: getStorageSize,
  };
}
