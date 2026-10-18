// SUE — Web Locks & BroadcastChannel Manager
// Multi-tab coordination with zero polling latency

/**
 * Acquire lock for critical operation
 * @param {string} name - Lock name
 * @param {Function} callback - Async callback
 * @returns {Promise<any>}
 */
export async function acquireLock(name, callback) {
  if (!navigator.locks) {
    console.warn('[HCC Locks] Web Locks API not supported');
    return await callback();
  }

  let result;

  await navigator.locks.request(name, async (lock) => {
    result = await callback(lock);
  });

  return result;
}

/**
 * BroadcastChannel for instant multi-tab sync
 */
class HCCBroadcastChannel {
  constructor(name = 'hcc-sync') {
    this.channel = new BroadcastChannel(name);
    this.listeners = [];

    // Listen for messages
    this.channel.onmessage = (event) => {
      this.listeners.forEach((callback) => callback(event.data));
    };

    console.log(`[HCC BroadcastChannel] Created: ${name}`);
  }

  /**
   * Subscribe to channel messages
   * @param {Function} callback
   */
  subscribe(callback) {
    this.listeners.push(callback);
  }

  /**
   * Send message to all tabs
   * @param {Object} message
   */
  postMessage(message) {
    this.channel.postMessage(message);
  }

  /**
   * Close channel
   */
  close() {
    this.channel.close();
  }
}

/**
 * Create new sync channel
 * @param {string} name - Channel name
 * @returns {HCCBroadcastChannel}
 */
export function createSyncChannel(name = 'hcc-sync') {
  return new HCCBroadcastChannel(name);
}

/**
 * Sync state across tabs
 * @param {string} key - State key
 * @param {any} value - State value
 */
export async function syncState(key, value) {
  // Acquire lock to prevent conflicts
  await acquireLock('state-sync', async () => {
    // Update state
    await chrome.storage.local.set({ [key]: value });

    // Broadcast to other tabs
    const channel = createSyncChannel('hcc-sync');
    channel.postMessage({
      type: 'STATE_UPDATE',
      key,
      value,
      timestamp: Date.now(),
    });
  });
}

/**
 * Listen for state updates from other tabs
 * @param {string} key - State key to monitor
 * @param {Function} callback - Callback on update
 */
export function listenForStateUpdates(key, callback) {
  const channel = createSyncChannel('hcc-sync');
  channel.subscribe((event) => {
    if (event.key === key) {
      callback(event.value, event.timestamp);
    }
  });
}

/**
 * Get Kanban state
 * @returns {Promise<Object>}
 */
export async function getKanbanState() {
  return new Promise((resolve) => {
    chrome.storage.local.get('kanban_state', (result) => {
      resolve(result.kanban_state || {});
    });
  });
}

/**
 * Set Kanban state
 * @param {Object} state
 */
export async function setKanbanState(state) {
  await syncState('kanban_state', state);
}

/**
 * Sync notes across tabs
 * @param {Array} notes
 */
export async function syncNotes(notes) {
  await syncState('notes', notes);
}

/**
 * Get synced notes
 * @returns {Promise<Array>}
 */
export async function getNotes() {
  return new Promise((resolve) => {
    chrome.storage.local.get('notes', (result) => {
      resolve(result.notes || []);
    });
  });
}

/**
 * Handle tab close - release locks
 */
export function cleanup() {
  if (typeof BroadcastChannel !== 'undefined') {
    // All channels will auto-close on tab close
  }
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup);
