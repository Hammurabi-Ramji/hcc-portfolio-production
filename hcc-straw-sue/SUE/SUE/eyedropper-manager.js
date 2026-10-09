// SUE — EyeDropper & Shape Detection Manager
// Native color picker + hardware OCR

let eyeDropper = null;
let textDetector = null;

/**
 * Initialize EyeDropper (if supported)
 * @returns {Promise<boolean>}
 */
export async function initEyeDropper() {
  if ('EyeDropper' in window) {
    eyeDropper = new EyeDropper();
    console.log('[SUE EyeDropper] Initialized');
    return true;
  }

  console.warn('[SUE EyeDropper] EyeDropper API not supported');
  return false;
}

/**
 * Open color picker
 * @returns {Promise<{sRGBHex: string}>}
 */
export async function pickColor() {
  if (!eyeDropper) {
    await initEyeDropper();
    if (!eyeDropper) {
      throw new Error('EyeDropper not supported');
    }
  }

  try {
    const result = await eyeDropper.open();
    console.log('[SUE EyeDropper] Color picked:', result.sRGBHex);
    return result;
  } catch (err) {
    console.warn('[SUE EyeDropper] Color picking cancelled');
    throw err;
  }
}

/**
 * Initialize Text Detector (if supported)
 * @returns {Promise<boolean>}
 */
export async function initTextDetector() {
  if ('TextDetector' in window) {
    textDetector = new TextDetector();
    console.log('[SUE ShapeDetection] TextDetector initialized');
    return true;
  }

  console.debug('[SUE ShapeDetection] TextDetector API not available in this browser');
  return false;
}

/**
 * Extract text from image using Shape Detection API
 * @param {HTMLImageElement | HTMLCanvasElement} image - Image to detect
 * @returns {Promise<Array>} Detected text blocks
 */
export async function detectText(image) {
  if (!textDetector) {
    await initTextDetector();
    if (!textDetector) {
      throw new Error('TextDetector not supported');
    }
  }

  try {
    const texts = await textDetector.detect(image);
    console.log(`[SUE ShapeDetection] Detected ${texts.length} text blocks`);
    return texts;
  } catch (err) {
    console.error('[SUE ShapeDetection] Detection failed:', err);
    throw err;
  }
}

/**
 * Extract text from screenshot
 * @param {Blob} screenshot - Screenshot image
 * @returns {Promise<string>} Extracted text
 */
export async function extractTextFromScreenshot(screenshot) {
  // Create image element from screenshot
  const img = new Image();
  const url = URL.createObjectURL(screenshot);
  img.src = url;

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  try {
    const texts = await detectText(img);
    URL.revokeObjectURL(url);

    // Combine all text blocks
    const extractedText = texts
      .map((t) => t.text)
      .filter(Boolean)
      .join('\n');

    return extractedText;
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

/**
 * Get current color from page element
 * @param {string} selector - CSS selector
 * @returns {Promise<string>} Hex color
 */
export async function getColorFromElement(selector) {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }

  const styles = window.getComputedStyle(element);
  const color = styles.color || styles.backgroundColor;

  // Convert RGB to Hex (simple conversion)
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return rgbToHex(parseInt(r), parseInt(g), parseInt(b));
  }

  return color;
}

/**
 * Convert RGB to Hex
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {string}
 */
function rgbToHex(r, g, b) {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

/**
 * Save color to accent picker
 * @param {string} color - Hex color
 * @returns {Promise<void>}
 */
export async function saveColorToAccent(color) {
  await chrome.storage.local.set({
    accent_color: color,
  });

  console.log(`[SUE EyeDropper] Saved accent color: ${color}`);
}

/**
 * Get accent color from storage
 * @returns {Promise<string>}
 */
export async function getAccentColor() {
  return new Promise((resolve) => {
    chrome.storage.local.get('accent_color', (result) => {
      resolve(result.accent_color || '#4a9eed');
    });
  });
}
