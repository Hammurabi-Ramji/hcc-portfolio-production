// SUE — Origin Private File System (OPFS) Manager
// Structured local data storage using native file system APIs
// Note: SQLite functionality removed - using native IndexedDB for structured data

let opfsInitialized = false;

/**
 * Initialize OPFS storage
 * @returns {Promise<boolean>}
 */
export async function initOPFS() {
  if (opfsInitialized) return true;

  try {
    // Check for OPFS support
    if (!navigator.storage?.getDirectory) {
      console.warn('[HCC OPFS] Origin Private File System not supported');
      return false;
    }

    opfsInitialized = true;

    console.log('[HCC OPFS] Initialized successfully');
    return true;
  } catch (err) {
    console.error('[HCC OPFS] Initialization failed:', err);
    return false;
  }
}

/**
 * Open or create a file in OPFS
 * @param {string} filename - Name of the file
 * @returns {Promise<FileSystemFileHandle>}
 */
export async function openFile(filename) {
  const root = await navigator.storage.getDirectory();
  return root.getFileHandle(filename, { create: true });
}

/**
 * Write data to a file in OPFS
 * @param {string} filename - Name of the file
 * @param {string|Blob|BufferSource} data - Data to write
 */
export async function writeFile(filename, data) {
  const fileHandle = await openFile(filename);
  const writable = await fileHandle.createWritable();

  await writable.write(data);

  await writable.close();
  console.log(`[HCC OPFS] Written to ${filename}`);
}

/**
 * Read data from a file in OPFS
 * @param {string} filename - Name of the file
 * @returns {Promise<string>} File contents
 */
export async function readFile(filename) {
  try {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle(filename);
    const file = await fileHandle.getFile();
    return await file.text();
  } catch (err) {
    console.warn(`[HCC OPFS] File not found: ${filename}`, err);
    return null;
  }
}

/**
 * Delete a file from OPFS
 * @param {string} filename - Name of the file
 */
export async function deleteFile(filename) {
  const root = await navigator.storage.getDirectory();
  await root.removeEntry(filename);
  console.log(`[HCC OPFS] Deleted ${filename}`);
}
