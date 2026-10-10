'use strict';

/**
 * SUEWARM Tool Registry: Extended tool system with structured DOM capture and screenshots
 * Extends SUEToolRegistry with SUEWARM-specific tools
 */

class SUEWARMToolRegistry extends globalThis.SUEToolRegistry {
  constructor() {
    super();
    this.registerSUEWARMTools();
  }

  registerSUEWARMTools() {
    /**
     * capture_dom: Extract structured data from current page
     * Returns: { success, data: { html, text, links, buttons, forms, images } }
     */
    this.register('capture_dom', async ({ selector = 'body' }, { tabId }) => {
      if (!tabId) throw new Error('tabId required');

      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'CAPTURE_DOM',
        selector,
      });

      return response || { success: true, data: {} };
    });

    /**
     * screenshot: Capture visible tab screenshot
     * Returns: { success, dataUrl, mimeType }
     */
    this.register('screenshot', async (_, { tabId }) => {
      if (!tabId) throw new Error('tabId required');

      try {
        const dataUrl = await chrome.tabs.captureVisibleTab(tabId, {
          format: 'png',
        });

        return {
          success: true,
          dataUrl,
          mimeType: 'image/png',
          capturedAt: Date.now(),
        };
      } catch (error) {
        return {
          success: false,
          error: String(error?.message || error),
        };
      }
    });

    /**
     * memory_search: Search agent memory for relevant information
     * Returns: { success, results: [ { text, source, similarity } ] }
     */
    this.register('memory_search', async ({ query, limit = 5 }, _context) => {
      if (!query) throw new Error('query required');

      const vectorStore = globalThis.sueVectorStoreRef;
      if (!vectorStore) {
        return { success: true, results: [], message: 'Vector store not yet initialized' };
      }

      try {
        const results = await vectorStore.search(String(query), {
          limit: Math.min(Number(limit) || 5, 20),
        });
        return { success: true, results: Array.isArray(results) ? results : [] };
      } catch (err) {
        return { success: false, error: String(err?.message ?? err), results: [] };
      }
    });

    /**
     * wait_for_element: Wait for an element to appear on the page
     * Returns: { success, found, selector }
     */
    this.register('wait_for_element', async ({ selector, timeout = 10000 }, { tabId }) => {
      if (!tabId) throw new Error('tabId required');
      if (!selector) throw new Error('selector required');

      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'WAIT_FOR_ELEMENT',
        selector,
        timeout,
      });

      return response || { success: false, error: 'Timeout' };
    });

    /**
     * scroll_to_element: Scroll element into view
     * Returns: { success, scrolled }
     */
    this.register('scroll_to_element', async ({ selector }, { tabId }) => {
      if (!tabId) throw new Error('tabId required');
      if (!selector) throw new Error('selector required');

      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'SCROLL_TO_ELEMENT',
        selector,
      });

      return response || { success: true };
    });

    /**
     * get_element_text: Extract text content from an element
     * Returns: { success, text }
     */
    this.register('get_element_text', async ({ selector }, { tabId }) => {
      if (!tabId) throw new Error('tabId required');
      if (!selector) throw new Error('selector required');

      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'GET_ELEMENT_TEXT',
        selector,
      });

      return response || { success: false, error: 'Element not found' };
    });

    /**
     * get_element_attribute: Extract attribute from an element
     * Returns: { success, value }
     */
    this.register('get_element_attribute', async ({ selector, attribute }, { tabId }) => {
      if (!tabId) throw new Error('tabId required');
      if (!selector) throw new Error('selector required');
      if (!attribute) throw new Error('attribute required');

      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'GET_ELEMENT_ATTRIBUTE',
        selector,
        attribute,
      });

      return response || { success: false, error: 'Element not found' };
    });

    /**
     * is_element_visible: Check if element is visible on page
     * Returns: { success, visible }
     */
    this.register('is_element_visible', async ({ selector }, { tabId }) => {
      if (!tabId) throw new Error('tabId required');
      if (!selector) throw new Error('selector required');

      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'IS_ELEMENT_VISIBLE',
        selector,
      });

      return response || { success: false, visible: false };
    });

    /**
     * get_page_title: Get current page title
     * Returns: { success, title }
     */
    this.register('get_page_title', async (_, { tabId }) => {
      if (!tabId) throw new Error('tabId required');

      try {
        const tab = await chrome.tabs.get(tabId);
        return {
          success: true,
          title: tab.title || '',
          url: tab.url || '',
        };
      } catch (error) {
        return {
          success: false,
          error: String(error?.message || error),
        };
      }
    });

    /**
     * execute_javascript: Execute custom JavaScript on page
     * Returns: { success, result }
     */
    this.register('execute_javascript', async ({ code }, { tabId }) => {
      if (!tabId) throw new Error('tabId required');
      if (!code) throw new Error('code required');

      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId },
          world: 'MAIN',
          func: (codeStr) => {
            try {
              // eslint-disable-next-line no-eval
              return { ok: true, result: eval(codeStr) };
            } catch (e) {
              return { ok: false, error: e.message };
            }
          },
          args: [String(code)],
        });

        const r = results?.[0]?.result;
        if (r?.ok === false) return { success: false, error: r.error };
        return { success: true, result: r?.result ?? null };
      } catch (error) {
        return {
          success: false,
          error: String(error?.message || error),
        };
      }
    });

    /**
     * get_cookies: Retrieve cookies for current domain
     * Returns: { success, cookies: [ { name, value, domain } ] }
     */
    this.register('get_cookies', async (_, { tabId }) => {
      if (!tabId) throw new Error('tabId required');

      try {
        const tab = await chrome.tabs.get(tabId);
        const url = new URL(tab.url || 'http://localhost');
        const cookies = await chrome.cookies.getAll({
          domain: url.hostname,
        });

        return {
          success: true,
          cookies: cookies.map((c) => ({
            name: c.name,
            value: c.value,
            domain: c.domain,
          })),
        };
      } catch (error) {
        return {
          success: false,
          error: String(error?.message || error),
        };
      }
    });

    /**
     * set_cookie: Set a cookie for current domain
     * Returns: { success }
     */
    this.register('set_cookie', async ({ name, value, domain }, { tabId }) => {
      if (!tabId) throw new Error('tabId required');
      if (!name || !value) throw new Error('name and value required');

      try {
        const tab = await chrome.tabs.get(tabId);
        const url = new URL(tab.url || 'http://localhost');

        await chrome.cookies.set({
          url: tab.url,
          name,
          value,
          domain: domain || url.hostname,
        });

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: String(error?.message || error),
        };
      }
    });

    /**
     * get_local_storage: Retrieve localStorage for current domain
     * Returns: { success, storage: { key: value } }
     */
    this.register('get_local_storage', async (_, { tabId }) => {
      if (!tabId) throw new Error('tabId required');

      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'GET_LOCAL_STORAGE',
      });

      return response || { success: false, storage: {} };
    });

    /**
     * set_local_storage: Set localStorage for current domain
     * Returns: { success }
     */
    this.register('set_local_storage', async ({ key, value }, { tabId }) => {
      if (!tabId) throw new Error('tabId required');
      if (!key) throw new Error('key required');

      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'SET_LOCAL_STORAGE',
        key,
        value,
      });

      return response || { success: true };
    });

    /**
     * get_all_links: Extract all links from page
     * Returns: { success, links: [ { text, href, selector } ] }
     */
    this.register('get_all_links', async (_, { tabId }) => {
      if (!tabId) throw new Error('tabId required');

      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'GET_ALL_LINKS',
      });

      return response || { success: true, links: [] };
    });

    /**
     * get_all_buttons: Extract all buttons from page
     * Returns: { success, buttons: [ { text, selector, type } ] }
     */
    this.register('get_all_buttons', async (_, { tabId }) => {
      if (!tabId) throw new Error('tabId required');

      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'GET_ALL_BUTTONS',
      });

      return response || { success: true, buttons: [] };
    });

    /**
     * get_all_forms: Extract all forms from page
     * Returns: { success, forms: [ { id, inputs: [ { name, type, selector } ] } ] }
     */
    this.register('get_all_forms', async (_, { tabId }) => {
      if (!tabId) throw new Error('tabId required');

      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'GET_ALL_FORMS',
      });

      return response || { success: true, forms: [] };
    });

    /**
     * get_page_metadata: Extract page metadata (title, description, etc.)
     * Returns: { success, metadata: { title, description, keywords, lang } }
     */
    this.register('get_page_metadata', async (_, { tabId }) => {
      if (!tabId) throw new Error('tabId required');

      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'GET_PAGE_METADATA',
      });

      return response || { success: true, metadata: {} };
    });
  }
}

globalThis.SUEWARMToolRegistry = SUEWARMToolRegistry;
