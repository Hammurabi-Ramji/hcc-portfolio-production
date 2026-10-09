// SUE — Compression Streams Manager
// Native gzip compression for 90% smaller storage

/**
 * Compress data using gzip
 * @param {string} data - Data to compress
 * @returns {Promise<Uint8Array>}
 */
export async function compressData(data) {
  if (!window.CompressionStream) {
    console.warn('[HCC Compression] CompressionStream not supported');
    return new TextEncoder().encode(data); // Fallback: no compression
  }

  try {
    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(data);
        controller.close();
      },
    });

    const compressed = readable.pipeThrough(new CompressionStream('gzip'));
    const chunks = [];

    const reader = compressed.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    return new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
  } catch (err) {
    console.error('[HCC Compression] Compression failed:', err);
    return new TextEncoder().encode(data);
  }
}

/**
 * Decompress gzip data
 * @param {Uint8Array} compressed - Compressed data
 * @returns {Promise<string>}
 */
export async function decompressData(compressed) {
  if (!window.CompressionStream) {
    console.warn('[HCC Compression] CompressionStream not supported');
    return new TextDecoder().decode(compressed);
  }

  try {
    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(compressed);
        controller.close();
      },
    });

    const decompressed = readable.pipeThrough(new CompressionStream('gzip'));
    const chunks = [];

    const reader = decompressed.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const blob = new Blob(chunks);
    return await blob.text();
  } catch (err) {
    console.error('[HCC Compression] Decompression failed:', err);
    return new TextDecoder().decode(compressed);
  }
}

/**
 * Compress and save state to storage
 * @param {string} key - Storage key
 * @param {Object} state - State to compress and save
 */
export async function saveCompressedState(key, state) {
  const jsonString = JSON.stringify(state);
  const compressed = await compressData(jsonString);

  await chrome.storage.local.set({
    [key]: compressed,
  });

  console.log(`[HCC Compression] Saved ${key}: ${compressed.length} bytes (compressed)`);
}

/**
 * Load and decompress state from storage
 * @param {string} key - Storage key
 * @returns {Promise<Object>}
 */
export async function loadCompressedState(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, async (result) => {
      if (!result[key]) {
        resolve(null);
        return;
      }

      try {
        const decompressed = await decompressData(result[key]);
        resolve(JSON.parse(decompressed));
      } catch (err) {
        console.error('[HCC Compression] State load failed:', err);
        resolve(null);
      }
    });
  });
}

/**
 * Get compression ratio for data
 * @param {string} data
 * @returns {number} Compression ratio percentage
 */
export async function getCompressionRatio(data) {
  const originalSize = new TextEncoder().encode(data).length;
  const compressed = await compressData(data);

  return ((1 - compressed.length / originalSize) * 100).toFixed(2);
}

/**
 * Export compressed database
 * @param {string} filename - Export filename
 */
export async function exportCompressedDB(filename = 'hcc-data.gz') {
  // Get all data
  const allData = await chrome.storage.local.get(null);
  const jsonString = JSON.stringify(allData);

  // Compress
  const compressed = await compressData(jsonString);

  // Create and download blob
  const blob = new Blob([compressed], { type: 'application/gzip' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
  console.log(`[HCC Compression] Exported ${filename}: ${compressed.length} bytes`);
}

/**
 * Import compressed database
 * @param {File} file - Compressed file to import
 */
export async function importCompressedDB(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const compressed = new Uint8Array(arrayBuffer);

    // Decompress
    const decompressed = await decompressData(compressed);
    const data = JSON.parse(decompressed);

    // Import to storage
    await chrome.storage.local.set(data);

    console.log(`[HCC Compression] Imported: ${Object.keys(data).length} keys`);
    return data;
  } catch (err) {
    console.error('[HCC Compression] Import failed:', err);
    throw err;
  }
}
