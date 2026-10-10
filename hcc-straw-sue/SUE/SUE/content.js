// SUE Extension - Enhanced Content Script
// Provides browser automation tools and page interaction

const MESSAGE_TYPES = globalThis.SUE_CONTRACT?.MESSAGE_TYPES || {
  GET_PAGE_CONTEXT: 'getPageContext',
  TAKE_SCREENSHOT: 'takeScreenshot',
  EXECUTE_ACTION: 'executeAction',
  LEGACY_GET_PAGE_CONTEXT: 'GET_PAGE_INFO',
  LEGACY_EXECUTE_TOOL: 'EXECUTE_TOOL',
  LEGACY_EXTRACT_TEXT: 'EXTRACT_TEXT',
  LEGACY_OPEN_SIDEBAR: 'OPEN_SIDEBAR',
  CAPTURE_MEMORY: 'CAPTURE_MEMORY',
  PAGE_INJECT_SIDEBAR: 'PAGE_INJECT_SIDEBAR',
  INJECT_SIDEBAR: 'INJECT_SIDEBAR',
};

function getExtensionRuntime() {
  if (globalThis.chrome?.runtime) {
    return globalThis.chrome.runtime;
  }
  if (globalThis.browser?.runtime) {
    return globalThis.browser.runtime;
  }
  return null;
}

const EXT_RUNTIME = getExtensionRuntime();

class SUEContentScript {
  constructor() {
    this.init();
  }

  init() {
    if (!EXT_RUNTIME?.onMessage?.addListener) {
      console.warn('[SUE] Extension runtime API unavailable in this execution context');
      return;
    }

    // Listen for messages from background/sidebar.
    // Return the handleMessage result so MV3 keeps the response channel open
    // for async cases (handleMessage returns true) while closing it correctly
    // for synchronous ones (handleMessage returns undefined).
    EXT_RUNTIME.onMessage.addListener((request, sender, sendResponse) => {
      return this.handleMessage(request, sendResponse);
    });

    // Add SUE action button to page
    this.addSUEButton();

    // Monitor for changes
    this.watchForDOMChanges();

    console.log('[SUE] Content script initialized');
  }

  handleMessage(request, sendResponse) {
    switch (request.type) {
      case MESSAGE_TYPES.GET_PAGE_CONTEXT:
        sendResponse(this.getPageInfo());
        return true;

      case MESSAGE_TYPES.TAKE_SCREENSHOT:
        sendResponse({
          error: 'Screenshot should be captured by background service worker',
        });
        return true;

      case MESSAGE_TYPES.EXECUTE_ACTION:
        this.executeAction(request.payload || {})
          .then((result) => sendResponse(result))
          .catch((error) => sendResponse({ success: false, error: error.message }));
        return true;

      case MESSAGE_TYPES.LEGACY_GET_PAGE_CONTEXT:
        sendResponse({
          success: true,
          info: this.getPageInfo(),
        });
        return true;

      case MESSAGE_TYPES.LEGACY_EXTRACT_TEXT:
        sendResponse({
          success: true,
          text: this.getSelectedText(),
        });
        return true;

      case MESSAGE_TYPES.LEGACY_EXECUTE_TOOL:
        this.executeTool(request.tool, request.args)
          .then((result) => sendResponse(result))
          .catch((error) => sendResponse({ success: false, error: error.message }));
        return true;

      case MESSAGE_TYPES.CAPTURE_MEMORY:
        sendResponse(this.capturePageMemory());
        return true;

      case MESSAGE_TYPES.PAGE_INJECT_SIDEBAR:
      case MESSAGE_TYPES.INJECT_SIDEBAR:
        sendResponse(this.injectSidebar(request.targetId));
        return true;

      case 'CAPTURE_DOM':
        sendResponse(this.captureDOMStructured(request.selector || 'body'));
        return true;

      case 'WAIT_FOR_ELEMENT':
        this.waitForSelector(request.selector, request.timeout || 10000)
          .then((result) => sendResponse(result))
          .catch((error) => sendResponse({ success: false, error: error.message }));
        return true;

      case 'SCROLL_TO_ELEMENT':
        sendResponse(this.scrollToElement(request.selector));
        return true;

      case 'GET_ELEMENT_TEXT':
        sendResponse(this.getElementText(request.selector));
        return true;

      case 'GET_ELEMENT_ATTRIBUTE':
        sendResponse(this.getElementAttribute(request.selector, request.attribute));
        return true;

      case 'IS_ELEMENT_VISIBLE':
        sendResponse(this.isElementVisible(request.selector));
        return true;

      case 'GET_PAGE_METADATA':
        sendResponse(this.getPageMetadata());
        return true;

      case 'GET_LOCAL_STORAGE':
        sendResponse(this.getLocalStorage());
        return true;

      case 'SET_LOCAL_STORAGE':
        sendResponse(this.setLocalStorage(request.key, request.value));
        return true;

      case 'GET_ALL_LINKS':
        sendResponse(this.getAllLinks());
        return true;

      case 'GET_ALL_BUTTONS':
        sendResponse(this.getAllButtons());
        return true;

      case 'GET_ALL_FORMS':
        sendResponse(this.getAllForms());
        return true;

      case 'LEARN_EXTRACT_DEEP':
        sendResponse(this.learnExtractDeep());
        return true;

      case 'LEARN_CAPTION_START':
        sendResponse(this.learnStartCaptions());
        return true;

      case 'LEARN_CAPTION_STOP':
        this.learnStopCaptions();
        sendResponse({ success: true });
        return true;

      case 'LEARN_EXTRACT_FULL':
        sendResponse(this.learnExtractFull());
        return true;

      case 'LEARN_INSPECT_URLS':
        this.learnInspectUrls(request.urls || [])
          .then((result) => sendResponse(result))
          .catch((err) => sendResponse({ success: false, error: err.message }));
        return true;

      default:
        sendResponse({ error: 'Unknown request type' });
        return true;
    }
  }

  async executeAction(payload) {
    const { action } = payload;

    // Log to debug panel if available
    if (globalThis.SUE_DEBUG) {
      globalThis.SUE_DEBUG.updatePendingAction(
        `${action}: ${payload.selector || payload.direction || ''}`
      );
    }

    switch (action) {
      case 'click':
        return this.clickElement(payload.selector);

      case 'click_coordinates':
        return this.clickAtCoordinates(payload.x, payload.y, payload.offsetX, payload.offsetY);

      case 'type':
        return this.typeText(payload.selector, payload.text || '');

      case 'scroll':
        return this.scrollPage(
          payload.direction || 'down',
          payload.amount || 500,
          payload.selector
        );

      case 'extract': {
        const mode = payload.mode || 'full_text';
        if (mode === 'selection') {
          return {
            success: true,
            text: this.getSelectedText() || '',
            mode,
          };
        }

        const extraction = await this.extractContent(payload.selector || 'body', 12000);
        return {
          ...extraction,
          mode,
        };
      }

      case 'fillForm':
        return this.fillForm(payload.fields || []);

      case 'waitFor':
        return this.waitForSelector(payload.selector, payload.timeout || 10000);

      case 'screenshot':
        return {
          success: false,
          error: 'Screenshot should be captured by background service worker',
        };

      default:
        return { success: false, error: `Unknown action: ${action}` };
    }
  }

  waitForSelector(selector, timeout = 10000) {
    return new Promise((resolve) => {
      const startedAt = Date.now();
      const timer = setInterval(() => {
        const el = document.querySelector(selector);
        if (el) {
          clearInterval(timer);
          resolve({ success: true, found: true, selector });
          return;
        }

        if (Date.now() - startedAt > timeout) {
          clearInterval(timer);
          resolve({
            success: false,
            found: false,
            selector,
            error: 'Timeout waiting for selector',
          });
        }
      }, 150);
    });
  }

  getPageInfo() {
    return {
      url: globalThis.location.href,
      title: document.title,
      selection: this.getSelectedText(),
      language: document.documentElement.lang || navigator.language,
      links: this.extractLinks(),
      buttons: this.extractButtons(),
      forms: this.extractForms(),
    };
  }

  capturePageMemory() {
    const url = window.location.href;
    const title = document.title;
    const contentText = document.body.innerText;
    const images = Array.from(document.querySelectorAll('img')).map((img) => img.src);
    const videos = Array.from(document.querySelectorAll('video')).map((video) => video.src);

    return {
      success: true,
      url: url,
      title: title,
      contentText: contentText,
      images: images,
      videos: videos,
      capturedAt: Date.now(),
    };
  }

  injectSidebar(targetId) {
    if (document.getElementById('sue-injected-container')) {
      return { success: true, already_present: true };
    }
    const target = (targetId ? document.querySelector(String(targetId)) : null) || document.body;
    const container = document.createElement('div');
    container.id = 'sue-injected-container';
    container.style.cssText = [
      'position:fixed',
      'right:0',
      'top:0',
      'height:100vh',
      'width:400px',
      'z-index:2147483647',
      'background:#0a0a14',
      'border-left:1px solid #2d2d4a',
      'box-shadow:-4px 0 24px rgba(0,0,0,.5)',
      'overflow:hidden',
      'display:flex',
      'flex-direction:column',
    ].join(';');
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText =
      'position:absolute;top:8px;right:10px;background:none;border:none;color:#f3f4f6;font-size:16px;cursor:pointer;z-index:1;';
    closeBtn.addEventListener('click', () => container.remove());
    container.appendChild(closeBtn);
    const msg = document.createElement('p');
    msg.textContent = 'SUE is active on this page.';
    msg.style.cssText =
      'color:#f3f4f6;padding:48px 20px 16px;text-align:center;font-family:sans-serif;font-size:14px;';
    container.appendChild(msg);
    target.appendChild(container);
    return { success: true, already_present: false };
  }

  getSelectedText() {
    const selection = globalThis.getSelection();
    if (selection?.toString().trim()) {
      return selection.toString().trim();
    }
    return null;
  }

  extractLinks() {
    const links = [];
    document.querySelectorAll('a[href]').forEach((a, index) => {
      links.push({
        index: index,
        text: a.textContent.trim().substring(0, 100),
        href: a.href,
        selector: this.generateSelector(a),
      });
    });
    return links;
  }

  extractButtons() {
    const buttons = [];
    document.querySelectorAll('button, [role="button"]').forEach((btn, index) => {
      buttons.push({
        index: index,
        text: btn.textContent.trim().substring(0, 100),
        type: btn.type || 'button',
        selector: this.generateSelector(btn),
      });
    });
    return buttons;
  }

  extractForms() {
    const forms = [];
    document.querySelectorAll('form').forEach((form, index) => {
      const inputs = Array.from(form.querySelectorAll('input, textarea, select')).map((input) => ({
        name: input.name || input.id || null,
        type: input.type || 'text',
        selector: this.generateSelector(input),
      }));

      forms.push({
        index: index,
        id: form.id || null,
        inputs: inputs,
      });
    });
    return forms;
  }

  async executeTool(toolName, args) {
    try {
      switch (toolName) {
        case 'click_element':
          return this.clickElement(args.selector);

        case 'type_text':
          return this.typeText(args.selector, args.text);

        case 'navigate':
          // Navigate is handled by background script
          return {
            success: false,
            error: 'Navigate must be called from background',
          };

        case 'scroll_page':
          return this.scrollPage(args.direction, args.amount);

        case 'extract_content':
          return this.extractContent(args.selector, args.maxLength);

        case 'take_screenshot':
          return {
            success: false,
            error: 'Screenshot must be requested from background',
          };

        case 'get_page_context':
          return {
            success: true,
            context: this.getPageInfo(),
          };

        case 'fill_form':
          return this.fillForm(args.fields);

        default:
          return { success: false, error: `Unknown tool: ${toolName}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async clickElementCss(selector) {
    if (!this.validateSelector(selector)) {
      throw new Error(`Invalid CSS selector: ${selector}`);
    }

    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    // Scroll into view if needed
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Highlight element
    this.highlightElement(element);

    // Click with multiple attempts
    await this.sleep(100);
    element.click();
    element.focus();

    // Dispatch events for better compatibility
    element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await this.sleep(50);
    element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    await this.sleep(50);
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    return {
      success: true,
      message: `Clicked element: ${selector}`,
      elementText: element.textContent?.trim().substring(0, 50),
    };
  }

  async clickAtCoordinates(x, y, offsetX = 0, offsetY = 0) {
    // Click at specific coordinates with optional offset
    const clickX = x + offsetX;
    const clickY = y + offsetY;

    // Find element at coordinates
    const element = document.elementFromPoint(clickX, clickY);
    if (!element) {
      return {
        success: false,
        error: `No element found at coordinates (${clickX}, ${clickY})`,
      };
    }

    // Highlight element
    this.highlightElement(element);

    // Create and dispatch click event at coordinates
    await this.sleep(100);
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: clickX,
      clientY: clickY,
      screenX: clickX + window.screenX,
      screenY: clickY + window.screenY,
    });

    // Dispatch on the element and its parents
    element.dispatchEvent(clickEvent);
    element.click();
    await this.sleep(50);

    return {
      success: true,
      message: `Clicked at coordinates (${clickX}, ${clickY})`,
      elementTag: element.tagName,
      elementText: element.textContent?.trim().substring(0, 50),
    };
  }

  async typeTextCss(selector, text) {
    if (!this.validateSelector(selector)) {
      throw new Error(`Invalid CSS selector: ${selector}`);
    }

    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    if (!['INPUT', 'TEXTAREA'].includes(element.tagName)) {
      throw new Error(`Element is not a form field: ${selector}`);
    }

    // Scroll into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Highlight
    this.highlightElement(element);

    // Clear and type
    await this.sleep(100);
    element.focus();

    // Select all and replace
    if (element.type === 'text' || element.type === 'password') {
      element.select();
      element.setRangeText('', 0, element.value.length, 'end');
    }

    // Type text character by character for better compatibility
    await this.typeByCharacter(element, text);

    // Blur to trigger change events
    await this.sleep(100);
    element.blur();

    return {
      success: true,
      message: `Typed ${text.length} characters into: ${selector}`,
      value: element.value,
    };
  }

  async typeByCharacter(element, text) {
    for (const char of text) {
      element.value += char;
      element.dispatchEvent(new InputEvent('input', { bubbles: true }));
      await this.sleep(10); // Small delay between characters
    }
  }

  async scrollPageCss(direction, amount = 500) {
    const scrollAmount = direction === 'up' ? -amount : amount;
    window.scrollBy({
      top: scrollAmount,
      behavior: 'smooth',
    });

    return {
      success: true,
      message: `Scrolled ${direction} by ${amount}px`,
    };
  }

  async extractContent(selector = 'body', maxLength = 8000) {
    if (!this.validateSelector(selector)) {
      throw new Error(`Invalid CSS selector: ${selector}`);
    }

    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    // Get text content, excluding scripts and styles
    const text = element.textContent.replace(/\s+/g, ' ').trim().substring(0, maxLength);

    return {
      success: true,
      text: text,
      length: text.length,
      selector: selector,
    };
  }

  async fillForm(fields) {
    const results = [];

    for (const field of fields) {
      try {
        const result = await this.typeText(field.selector, field.value);
        results.push({
          selector: field.selector,
          ...result,
        });
      } catch (error) {
        results.push({
          selector: field.selector,
          success: false,
          error: error.message,
        });
      }
    }

    const allSuccess = results.every((r) => r.success);

    return {
      success: allSuccess,
      results: results,
      message: `${results.filter((r) => r.success).length}/${results.length} fields filled`,
    };
  }

  validateSelector(selector) {
    return CSS.supports('selector(*)') ? CSS.supports(`selector(${selector})`) : true;
  }

  highlightElement(element) {
    // Create highlight overlay
    const rect = element.getBoundingClientRect();
    const highlight = document.createElement('div');
    highlight.id = 'sue-highlight';
    highlight.style.cssText = `
            position: fixed;
            top: ${rect.top}px;
            left: ${rect.left}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            border: 3px solid #22d3ee;
            box-shadow: 0 0 20px rgba(34, 211, 238, 0.5);
            pointer-events: none;
            z-index: 999999;
            animation: sue-pulse 1s infinite;
        `;

    document.body.appendChild(highlight);

    // Remove after 2 seconds
    setTimeout(() => {
      highlight.remove();
    }, 2000);

    // Add CSS animation if not exists
    if (!document.getElementById('sue-animation-style')) {
      const style = document.createElement('style');
      style.id = 'sue-animation-style';
      style.textContent = `
                @keyframes sue-pulse {
                    0%, 100% { box-shadow: 0 0 20px rgba(34, 211, 238, 0.5); }
                    50% { box-shadow: 0 0 40px rgba(34, 211, 238, 0.8); }
                }
            `;
      document.head.appendChild(style);
    }
  }

  buildTextSelector(element) {
    const text = element.textContent?.trim();
    if (!text || text.length < 3 || text.length >= 100) {
      return null;
    }

    const tagName = element.tagName.toLowerCase();
    const isClickable =
      ['button', 'a', 'input', 'textarea', '[role="button"]'].includes(tagName) ||
      element.getAttribute('role') === 'button' ||
      element.onclick !== null;

    if (!isClickable) {
      return null;
    }

    const safeText = text.replace(/[^\w\s-]/g, '').substring(0, 50);
    return safeText.length > 2 ? `text:${safeText}` : null;
  }

  buildIdSelector(element) {
    if (!element.id) {
      return null;
    }

    const id = element.id;
    const escapedId = CSS.escape ? CSS.escape(id) : id;
    if (document.querySelectorAll(`#${escapedId}`).length === 1) {
      return `#${id}`;
    }

    return null;
  }

  buildClassSelector(element) {
    if (!element.className || typeof element.className !== 'string') {
      return null;
    }

    const classes = element.className
      .trim()
      .split(/\s+/)
      .filter((c) => c && c.length > 0)
      .slice(0, 2);

    if (!classes.length) {
      return null;
    }

    const classSelector = classes.join('.');
    const fullSelector = `${element.tagName.toLowerCase()}.${classSelector}`;
    if (CSS.supports('selector(*)') && CSS.supports(`selector(${fullSelector})`)) {
      if (document.querySelectorAll(fullSelector).length === 1) {
        return fullSelector;
      }
    }

    return `${element.tagName.toLowerCase()}.${classes[0]}`;
  }

  buildPathSelector(element) {
    let selector = element.tagName.toLowerCase();
    let currentElement = element;
    let parent = currentElement.parentElement;
    let depth = 0;
    const maxDepth = 5;

    while (parent && depth < maxDepth) {
      const siblingIndex =
        Array.from(parent.children)
          .filter((c) => c.tagName === currentElement.tagName)
          .indexOf(currentElement) + 1;

      selector = `${currentElement.tagName.toLowerCase()}:nth-of-type(${siblingIndex}) > ${selector}`;
      currentElement = parent;
      parent = currentElement.parentElement;
      depth++;
    }

    return selector;
  }

  generateSelector(element) {
    return (
      this.buildTextSelector(element) ||
      this.buildIdSelector(element) ||
      this.buildClassSelector(element) ||
      this.buildPathSelector(element)
    );
  }

  // Helper: Resolve text-based selectors
  async resolveTextSelector(textSelector) {
    if (!textSelector.startsWith('text:')) {
      return document.querySelector(textSelector) || null;
    }

    const searchText = textSelector.substring(5).toLowerCase();
    const clickableElements = document.querySelectorAll(
      'button, a, [role="button"], input, textarea'
    );

    for (const el of clickableElements) {
      const elText = (el.textContent || el.value || el.getAttribute('aria-label') || '')
        .trim()
        .toLowerCase();
      if (elText.includes(searchText) || searchText.includes(elText)) {
        return el;
      }
    }

    return null;
  }

  // Helper: Execute action with text-based selector support
  async executeWithTextSupport(action, selector, ...args) {
    if (selector.startsWith('text:')) {
      const element = await this.resolveTextSelector(selector);
      if (!element) {
        throw new Error(`Text selector not found: ${selector}`);
      }

      // Map text selector to element for action
      switch (action) {
        case 'click':
          element.click();
          return {
            success: true,
            message: `Clicked by text: ${selector}`,
            elementText: element.textContent?.trim(),
          };
        case 'type':
          if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.value = args[0];
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            return {
              success: true,
              message: `Typed into element: ${selector}`,
              value: element.value,
            };
          }
          throw new Error(`Element ${selector} is not a form field`);
        case 'scroll':
          if (action === 'scroll' && args[0] === 'selector') {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return {
              success: true,
              message: `Scrolled to element: ${selector}`,
            };
          }
          throw new Error('Scroll by text not supported');
        default:
          throw new Error(`Action ${action} not supported for text selector`);
      }
    } else {
      // Use CSS selector logic for non-text selectors
      switch (action) {
        case 'click':
          return this.clickElementCss(selector);
        case 'type':
          return this.typeTextCss(selector, args[0]);
        case 'scroll':
          return this.scrollPageCss(args[0], args[1]);
        default:
          throw new Error(`Action ${action} not supported`);
      }
    }
  }

  // Override clickElement to support text selectors
  async clickElement(selector) {
    return this.executeWithTextSupport('click', selector);
  }

  // Override typeText to support text selectors
  async typeText(selector, text) {
    return this.executeWithTextSupport('type', selector, text);
  }

  // Override scrollPage to support text selectors
  async scrollPage(direction, amount, selector) {
    if (selector?.startsWith('text:')) {
      return this.executeWithTextSupport('scroll', selector, 'selector');
    }
    return this.scrollPageCss(direction, amount);
  }

  watchForDOMChanges() {
    const observer = new MutationObserver((_mutations) => {
      // Could add logic here to detect when new content appears
      // For example, highlight new buttons or links
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'id'],
    });
  }

  addSUEButton() {
    // Create floating SUE button
    const button = document.createElement('div');
    button.id = 'sue-floating-button';
    button.innerHTML = `
        <img src="${EXT_RUNTIME.getURL('icons/SUE_App_Icon.png')}" alt="SUE" style="width: 38px; height: 38px; border-radius: 50%; box-shadow: 0 4px 14px rgba(34, 211, 238, 0.45);" />
        `;
    button.title = 'SUE - Open AI Assistant';
    button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            cursor: pointer;
            border: none;
            background: transparent;
            outline: none;
            transition: transform 0.2s;
        `;

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
    });

    button.addEventListener('click', () => {
      if (EXT_RUNTIME?.sendMessage) {
        EXT_RUNTIME.sendMessage({ type: MESSAGE_TYPES.LEGACY_OPEN_SIDEBAR });
      }
    });

    document.body.appendChild(button);
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * ─────────────────────────────────────────────────────────────
   * SWAM-Agent Methods
   * ─────────────────────────────────────────────────────────────
   */

  /**
   * Capture structured DOM data
   */
  captureDOMStructured(selector = 'body') {
    try {
      const element = document.querySelector(selector);
      if (!element) {
        return { success: false, error: `Element not found: ${selector}` };
      }

      const html = element.outerHTML.substring(0, 50000);
      const text = element.innerText?.substring(0, 10000) || '';
      const links = this.extractLinks();
      const buttons = this.extractButtons();
      const forms = this.extractForms();
      const images = Array.from(element.querySelectorAll('img'))
        .map((img) => ({
          src: img.src,
          alt: img.alt,
          title: img.title,
        }))
        .slice(0, 20);

      return {
        success: true,
        data: {
          html,
          text,
          links,
          buttons,
          forms,
          images,
          selector,
          elementTag: element.tagName,
          elementClass: element.className,
        },
      };
    } catch (error) {
      return { success: false, error: String(error?.message || error) };
    }
  }

  /**
   * Scroll element into view
   */
  scrollToElement(selector) {
    try {
      const element = document.querySelector(selector);
      if (!element) {
        return { success: false, error: `Element not found: ${selector}` };
      }

      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return { success: true, scrolled: true };
    } catch (error) {
      return { success: false, error: String(error?.message || error) };
    }
  }

  /**
   * Get text content of element
   */
  getElementText(selector) {
    try {
      const element = document.querySelector(selector);
      if (!element) {
        return { success: false, error: `Element not found: ${selector}` };
      }

      return {
        success: true,
        text: element.innerText || element.textContent || '',
        selector,
      };
    } catch (error) {
      return { success: false, error: String(error?.message || error) };
    }
  }

  /**
   * Get attribute value from element
   */
  getElementAttribute(selector, attribute) {
    try {
      const element = document.querySelector(selector);
      if (!element) {
        return { success: false, error: `Element not found: ${selector}` };
      }

      const value = element.getAttribute(attribute);
      return {
        success: true,
        value: value || null,
        selector,
        attribute,
      };
    } catch (error) {
      return { success: false, error: String(error?.message || error) };
    }
  }

  /**
   * Check if element is visible
   */
  isElementVisible(selector) {
    try {
      const element = document.querySelector(selector);
      if (!element) {
        return { success: true, visible: false };
      }

      const style = window.getComputedStyle(element);
      const visible =
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        element.offsetParent !== null;

      return { success: true, visible, selector };
    } catch (error) {
      return { success: false, error: String(error?.message || error) };
    }
  }

  /**
   * Get page metadata
   */
  getPageMetadata() {
    try {
      const title = document.title || '';
      const description = document.querySelector('meta[name="description"]')?.content || '';
      const keywords = document.querySelector('meta[name="keywords"]')?.content || '';
      const lang = document.documentElement.lang || navigator.language || '';
      const ogTitle = document.querySelector('meta[property="og:title"]')?.content || '';
      const ogDescription =
        document.querySelector('meta[property="og:description"]')?.content || '';
      const ogImage = document.querySelector('meta[property="og:image"]')?.content || '';

      return {
        success: true,
        metadata: {
          title,
          description,
          keywords,
          lang,
          ogTitle,
          ogDescription,
          ogImage,
          url: window.location.href,
          favicon: document.querySelector('link[rel="icon"]')?.href || '',
        },
      };
    } catch (error) {
      return { success: false, error: String(error?.message || error) };
    }
  }

  /**
   * Get localStorage for current domain
   */
  getLocalStorage() {
    try {
      const storage = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        storage[key] = localStorage.getItem(key);
      }

      return { success: true, storage };
    } catch (error) {
      return { success: false, error: String(error?.message || error) };
    }
  }

  /**
   * Set localStorage for current domain
   */
  setLocalStorage(key, value) {
    try {
      localStorage.setItem(key, String(value || ''));
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error?.message || error) };
    }
  }

  /**
   * Get all links on page
   */
  getAllLinks() {
    try {
      const links = this.extractLinks();
      return { success: true, links };
    } catch (error) {
      return { success: false, error: String(error?.message || error) };
    }
  }

  /**
   * Get all buttons on page
   */
  getAllButtons() {
    try {
      const buttons = this.extractButtons();
      return { success: true, buttons };
    } catch (error) {
      return { success: false, error: String(error?.message || error) };
    }
  }

  /**
   * Get all forms on page
   */
  getAllForms() {
    try {
      const forms = this.extractForms();
      return { success: true, forms };
    } catch (error) {
      return { success: false, error: String(error?.message || error) };
    }
  }

  // ── Learn Tab: full button/form/link/interactive extraction ──────────────

  learnExtractFull() {
    const base = this.learnExtractDeep();

    // ── Buttons & interactive elements ──────────────────────────────────────
    const buttons = [];
    const buttonSel =
      'button, [role="button"], input[type="submit"], input[type="button"], input[type="reset"]';
    document.querySelectorAll(buttonSel).forEach((el) => {
      const text = (el.innerText || el.value || el.getAttribute('aria-label') || '').trim();
      if (!text || text.length < 1) return;
      const form = el.closest('form');
      buttons.push({
        text: text.slice(0, 120),
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute('type') || '',
        role: el.getAttribute('role') || '',
        ariaLabel: el.getAttribute('aria-label') || '',
        disabled: el.disabled || false,
        formAction: form?.action || '',
        formMethod: (form?.method || '').toUpperCase(),
      });
    });

    // ── Forms ────────────────────────────────────────────────────────────────
    const forms = [];
    document.querySelectorAll('form').forEach((form, i) => {
      const fields = [];
      form.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach((f) => {
        const labelEl =
          (f.id ? document.querySelector(`label[for="${f.id}"]`) : null) || f.closest('label');
        fields.push({
          name: f.name || f.id || '',
          type: f.type || f.tagName.toLowerCase(),
          label: (labelEl?.innerText || f.placeholder || '').trim().slice(0, 60),
          required: Boolean(f.required),
          options:
            f.tagName === 'SELECT'
              ? Array.from(f.options)
                  .slice(0, 8)
                  .map((o) => o.text.trim())
              : [],
        });
      });
      forms.push({
        id: form.id || `form_${i}`,
        action: form.action || '',
        method: (form.method || 'get').toUpperCase(),
        enctype: form.enctype || '',
        fields: fields.slice(0, 20),
      });
    });

    // ── Link inventory ────────────────────────────────────────────────────────
    const currentHost = window.location.hostname;
    const internal = [];
    const external = [];
    const seen = new Set();
    document.querySelectorAll('a[href]').forEach((a) => {
      const href = a.href;
      const text = (a.innerText || a.getAttribute('aria-label') || '').trim();
      // eslint-disable-next-line no-script-url
      if (
        !href ||
        // eslint-disable-next-line no-script-url
        href.startsWith('javascript:') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        seen.has(href)
      )
        return;
      seen.add(href);
      try {
        const u = new URL(href);
        if (u.hostname === currentHost || u.hostname === '') {
          internal.push({ text: text.slice(0, 80), href, path: u.pathname, hash: u.hash });
        } else {
          external.push({ text: text.slice(0, 80), href, domain: u.hostname });
        }
      } catch (_) {}
    });

    // ── Interactive patterns ──────────────────────────────────────────────────
    const allButtons = Array.from(document.querySelectorAll('button'));
    const hasLoadMore = Boolean(
      document.querySelector('[class*="load-more"], [class*="loadmore"]') ||
      allButtons.some((b) => /load more|show more|see more|view more/i.test(b.innerText))
    );
    const interactives = {
      hasPagination: Boolean(
        document.querySelector(
          '[aria-label*="pagination" i], .pagination, .pager, [class*="paginat"]'
        ) || document.querySelector('a[rel="next"], a[rel="prev"]')
      ),
      hasLoadMore,
      hasInfiniteScroll: Boolean(
        document.querySelector('[class*="infinite"], [data-infinite]') ||
        document.querySelector('[class*="infinite-scroll"]')
      ),
      hasTabs: Boolean(document.querySelector('[role="tablist"], [role="tab"]')),
      hasAccordion: Boolean(
        document.querySelector(
          'details, [role="region"][aria-expanded], .accordion, [class*="accordion"]'
        )
      ),
      hasModal: Boolean(
        document.querySelector('[role="dialog"], [aria-modal="true"], .modal, [class*="modal"]')
      ),
      hasSearch: Boolean(
        document.querySelector('input[type="search"], [role="search"]') ||
        document.querySelector('input[placeholder*="search" i]')
      ),
      hasCarousel: Boolean(
        document.querySelector(
          '[class*="carousel"], [class*="slider"], [role="region"][aria-roledescription*="carousel" i]'
        )
      ),
    };

    // ── iframes ───────────────────────────────────────────────────────────────
    const iframes = Array.from(document.querySelectorAll('iframe[src]'))
      .slice(0, 6)
      .map((f) => ({ src: f.src, title: f.title || '', width: f.width, height: f.height }));

    return {
      ...base,
      buttons: buttons.slice(0, 40),
      forms,
      links: {
        internal: internal.slice(0, 60),
        external: external.slice(0, 25),
      },
      interactives,
      iframes,
    };
  }

  // ── Learn Tab: parallel URL HEAD inspection ────────────────────────────────

  async learnInspectUrls(urls) {
    const limited = Array.isArray(urls) ? urls.slice(0, 20) : [];
    const results = [];

    await Promise.allSettled(
      limited.map(async (url) => {
        const entry = { url, status: 0, contentType: '', finalUrl: null, error: null };
        try {
          const res = await fetch(url, {
            method: 'HEAD',
            credentials: 'omit',
            signal: AbortSignal.timeout(6000),
          });
          entry.status = res.status;
          entry.contentType = (res.headers.get('content-type') || '').split(';')[0].trim();
          // Detect redirects by comparing response URL to requested URL
          if (res.url && res.url !== url) entry.finalUrl = res.url;
        } catch (err) {
          entry.error = err.message.slice(0, 80);
        }
        results.push(entry);
      })
    );

    return { success: true, results };
  }

  // ── Learn Tab: deep content extraction ────────────────────────────────────

  learnExtractDeep() {
    const url = window.location.href;
    const title = document.title;
    const description =
      document.querySelector('meta[name="description"]')?.content ||
      document.querySelector('meta[property="og:description"]')?.content ||
      '';

    const isYouTube = url.includes('youtube.com/watch');
    const videoEls = document.querySelectorAll('video');
    const hasVideo = videoEls.length > 0 || isYouTube;
    const pageType = isYouTube ? 'video' : hasVideo ? 'video' : 'article';

    // YouTube: extract video title and description from the player state
    let videoTitle = '';
    let videoDescription = '';
    if (isYouTube) {
      try {
        const playerData = globalThis.ytInitialPlayerResponse;
        videoTitle = playerData?.videoDetails?.title || '';
        videoDescription = (playerData?.videoDetails?.shortDescription || '').slice(0, 1000);
      } catch (_) {}
      if (!videoTitle) {
        videoTitle =
          document.querySelector('h1.ytd-watch-metadata yt-formatted-string')?.innerText ||
          document.querySelector('h1.ytd-watch-metadata')?.innerText ||
          title;
      }
    }

    // Headings hierarchy
    const headings = [];
    document.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((h) => {
      const text = h.innerText?.trim();
      if (text && text.length > 1) {
        headings.push({ level: parseInt(h.tagName[1], 10), text: text.slice(0, 200) });
      }
    });

    // Check for available caption tracks
    let hasCaptions = false;
    const captionSamples = [];
    videoEls.forEach((video) => {
      Array.from(video.textTracks).forEach((track) => {
        if (track.kind === 'subtitles' || track.kind === 'captions') {
          hasCaptions = true;
          if (track.cues) {
            Array.from(track.cues)
              .slice(0, 30)
              .forEach((cue) => {
                const text = (cue.text || '').replace(/<[^>]+>/g, '').trim();
                if (text) captionSamples.push(text);
              });
          }
        }
      });
    });

    // Prefer article/main content for fullText
    const mainEl =
      document.querySelector('article') ||
      document.querySelector('[role="main"]') ||
      document.querySelector('main') ||
      document.querySelector('.content, .article-body, .post-content') ||
      document.body;

    const fullText = (mainEl?.innerText || document.body.innerText || '').slice(0, 15000);

    return {
      success: true,
      url,
      title: videoTitle || title,
      description,
      pageType,
      hasVideo,
      hasCaptions,
      headings: headings.slice(0, 30),
      captionSamples: captionSamples.slice(0, 20),
      videoDescription,
      fullText,
    };
  }

  // ── Learn Tab: live caption listening ──────────────────────────────────────

  learnStartCaptions() {
    this._captionHandlers = this._captionHandlers || [];
    this.learnStopCaptions(); // clear any previous listeners

    let foundCaptions = false;
    let videoCount = 0;

    document.querySelectorAll('video').forEach((video) => {
      videoCount++;

      const attachTrackListener = (track) => {
        if (track.kind !== 'subtitles' && track.kind !== 'captions') return;
        foundCaptions = true;
        if (track.mode === 'disabled') track.mode = 'hidden';

        const handler = () => {
          const cue = track.activeCues?.[0];
          if (!cue) return;
          const text = (cue.text || '').replace(/<[^>]+>/g, '').trim();
          if (!text) return;
          EXT_RUNTIME?.sendMessage({
            type: 'LEARN_CAPTION_CUE',
            cue: { text, startTime: cue.startTime, endTime: cue.endTime },
          }).catch(() => {});
        };

        track.addEventListener('cuechange', handler);
        this._captionHandlers.push({ track, handler });
      };

      // Attach to already-present tracks
      Array.from(video.textTracks).forEach(attachTrackListener);

      // Also watch for tracks added dynamically (YouTube lazy-loads captions)
      const addTrackHandler = (e) => attachTrackListener(e.track);
      video.textTracks.addEventListener('addtrack', addTrackHandler);
      this._captionHandlers.push({ textTracks: video.textTracks, addTrackHandler });
    });

    return { success: true, hasCaptions: foundCaptions, videoCount };
  }

  learnStopCaptions() {
    if (!this._captionHandlers) return;
    this._captionHandlers.forEach(({ track, handler, textTracks, addTrackHandler }) => {
      if (track && handler) track.removeEventListener('cuechange', handler);
      if (textTracks && addTrackHandler)
        textTracks.removeEventListener('addtrack', addTrackHandler);
    });
    this._captionHandlers = [];
  }
}

// Initialize content script
const _sueContentScript = new SUEContentScript();
console.log('[SUE] Content script ready for browser automation');
