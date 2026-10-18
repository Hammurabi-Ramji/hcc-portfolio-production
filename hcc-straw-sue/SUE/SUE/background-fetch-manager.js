// SUE — Background Fetch Manager
// Download large files even when sidebar closes

let currentFetchId = null;

/**
 * Start background fetch for large files
 * @param {string} id - Fetch ID
 * @param {string[]} urls - Files to download
 * @param {Object} options - Fetch options
 * @returns {Promise<number>} Fetch ID
 */
export async function startBackgroundFetch(id, urls, options = {}) {
  const { title = 'HCC Download', download_path = undefined } = options;

  // Check for background fetch support
  if (!navigator.serviceWorker || !navigator.serviceWorker.ready) {
    console.warn('[HCC BackgroundFetch] Service worker not available');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    const fetch = await registration.backgroundFetch.fetch(id, urls, {
      title,
      download_path,
    });

    currentFetchId = fetch.id;
    console.log(`[HCC BackgroundFetch] Started: ${id}`);

    // Listen for progress
    fetch.addEventListener('progress', (event) => {
      if (event.downloadCount > 0) {
        const downloaded = event.totalDownloaded;
        const total = event.bytesExpected;
        const progress = total ? ((downloaded / total) * 100).toFixed(1) : 0;
        console.log(`[HCC BackgroundFetch] ${progress}% downloaded`);
      }
    });

    // Listen for completion
    fetch.addEventListener('success', () => {
      console.log(`[HCC BackgroundFetch] Completed: ${id}`);
      currentFetchId = null;
    });

    return fetch.id;
  } catch (err) {
    console.error('[HCC BackgroundFetch] Failed to start:', err);
    return null;
  }
}

/**
 * List active background fetches
 * @returns {Promise<Array>}
 */
export async function listBackgroundFetches() {
  if (!navigator.serviceWorker) return [];

  const registration = await navigator.serviceWorker.ready;
  const fetches = await registration.backgroundFetch.get(currentFetchId);

  return fetches || [];
}

/**
 * Resume paused background fetch
 * @param {number} id - Fetch ID
 * @returns {Promise<void>}
 */
export async function resumeBackgroundFetch(id) {
  if (!navigator.serviceWorker) return;

  const registration = await navigator.serviceWorker.ready;
  const fetch = await registration.backgroundFetch.get(id);

  if (fetch) {
    fetch.resume();
    console.log(`[HCC BackgroundFetch] Resumed: ${id}`);
  }
}

/**
 * Delete completed background fetch
 * @param {number} id - Fetch ID
 * @returns {Promise<void>}
 */
export async function deleteBackgroundFetch(id) {
  if (!navigator.serviceWorker) return;

  const registration = await navigator.serviceWorker.ready;
  await registration.backgroundFetch.delete(id);

  console.log(`[HCC BackgroundFetch] Deleted: ${id}`);
}

/**
 * Download AI model with progress tracking
 * @param {string} modelId - Model identifier
 * @param {string} url - Model URL
 */
export async function downloadModel(modelId, url) {
  const fetchId = `model-${modelId}`;

  const id = await startBackgroundFetch(fetchId, [url], {
    title: `Downloading HCC AI Model: ${modelId}`,
  });

  if (!id) {
    throw new Error('Background fetch not supported');
  }

  return {
    id,
    modelId,
    status: 'running',
  };
}

/**
 * Check if background fetch is supported
 * @returns {boolean}
 */
export function isSupported() {
  return (
    navigator.serviceWorker &&
    navigator.serviceWorker.controller &&
    'backgroundFetch' in navigator.serviceWorker
  );
}

/**
 * Get current download status
 * @returns {Promise<Object|null>}
 */
export async function getCurrentStatus() {
  if (!currentFetchId) return null;

  const registration = await navigator.serviceWorker.ready;
  const fetch = await registration.backgroundFetch.get(currentFetchId);

  if (!fetch) return null;

  return {
    id: fetch.id,
    title: fetch.title,
    progress: fetch.progress,
    status: 'active',
  };
}
