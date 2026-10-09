'use strict';

class SUEToolRegistry {
  constructor() {
    this.tools = new Map();
    this.registerDefaults();
  }

  register(name, handler) {
    this.tools.set(name, handler);
  }

  getAvailableTools() {
    return Array.from(this.tools.keys());
  }

  async execute(toolName, params = {}, context = {}) {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    return tool(params, context);
  }

  registerDefaults() {
    this.register('navigate', async ({ url }) => {
      const safeUrl = this.normalizeUrl(url);
      const tab = await chrome.tabs.create({ url: safeUrl, active: true });
      return { success: true, tabId: tab.id, url: safeUrl };
    });

    this.register('navigateCurrent', async ({ url }, { tabId }) => {
      if (!tabId) throw new Error('tabId required');
      const safeUrl = this.normalizeUrl(url);
      await chrome.tabs.update(tabId, { url: safeUrl });
      return { success: true, tabId, url: safeUrl };
    });

    this.register('clickElement', async ({ selector }, { tabId }) => {
      if (!tabId) throw new Error('tabId required');
      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'CLICK_ELEMENT',
        selector,
      });
      return response || { success: true };
    });

    this.register('fillInput', async ({ selector, value }, { tabId }) => {
      if (!tabId) throw new Error('tabId required');
      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'FILL_FORM',
        data: { [selector]: value },
      });
      return response || { success: true };
    });

    this.register('extractTable', async ({ selector }, { tabId }) => {
      if (!tabId) throw new Error('tabId required');
      return chrome.tabs.sendMessage(tabId, {
        type: 'EXTRACT_TABLE',
        selector,
      });
    });

    this.register('highlightElement', async ({ selector }, { tabId }) => {
      if (!tabId) throw new Error('tabId required');
      return chrome.tabs.sendMessage(tabId, {
        type: 'HIGHLIGHT_ELEMENT',
        selector,
      });
    });

    this.register('downloadFile', async ({ url, filename }) => {
      await this.ensureOptionalPermission('downloads');
      const id = await chrome.downloads.download({
        url: this.normalizeUrl(url),
        filename: filename || undefined,
        saveAs: false,
      });
      return { success: true, downloadId: id };
    });

    this.register('searchBookmarks', async ({ query }) => {
      await this.ensureOptionalPermission('bookmarks');
      const results = await chrome.bookmarks.search(String(query || ''));
      return { success: true, results };
    });

    this.register('recentHistory', async ({ text = '' }) => {
      await this.ensureOptionalPermission('history');
      const items = await chrome.history.search({
        text: String(text),
        maxResults: 20,
        startTime: Date.now() - 24 * 60 * 60 * 1000,
      });
      return { success: true, items };
    });

    this.register('getPageContext', async (_, { tabId }) => {
      if (!tabId) throw new Error('tabId required');
      const tab = await chrome.tabs.get(tabId);
      return {
        success: true,
        context: {
          title: tab.title || '',
          url: tab.url || '',
        },
      };
    });

    this.register('captureMemory', async (_, { tabId }) => {
      if (!tabId) throw new Error('tabId required');

      let response;
      try {
        response = await chrome.tabs.sendMessage(tabId, { type: 'CAPTURE_MEMORY' });
      } catch (err) {
        return {
          success: false,
          error: `Content script not available: ${String(err?.message ?? err)}`,
        };
      }

      if (!response?.success) {
        return response || { success: false, error: 'Content script returned no data' };
      }

      // Save directly to chrome.storage.local — tool runs in SW context so sendMessage
      // back to the SW would loop; write the store directly instead.
      const memoryObject = {
        id: globalThis.crypto.randomUUID(),
        url: String(response.url || ''),
        title: String(response.title || ''),
        content_text: String(response.contentText || ''),
        content_images: Array.isArray(response.images) ? response.images : [],
        content_videos: Array.isArray(response.videos) ? response.videos : [],
        captured_at: Number(response.capturedAt) || Date.now(),
        tags: ['captured_page', 'agent'],
        metadata: {},
      };

      const stored = await chrome.storage.local.get('sue_ramemories');
      const ramemories = Array.isArray(stored.sue_ramemories) ? stored.sue_ramemories : [];
      ramemories.push(memoryObject);
      await chrome.storage.local.set({ sue_ramemories: ramemories });

      return { success: true, id: memoryObject.id };
    });
  }

  normalizeUrl(value) {
    const text = String(value || '').trim();
    if (!text) throw new Error('URL required');
    if (/^https?:\/\//i.test(text)) return text;
    return `https://${text}`;
  }

  async ensureOptionalPermission(permission) {
    if (!chrome.permissions || typeof chrome.permissions.contains !== 'function') {
      return;
    }

    const query = { permissions: [permission] };
    const hasPermission = await chrome.permissions.contains(query);
    if (hasPermission) {
      return;
    }

    const granted =
      typeof chrome.permissions.request === 'function'
        ? await chrome.permissions.request(query)
        : false;
    if (!granted) {
      throw new Error(`Permission '${permission}' is required for this action`);
    }
  }
}

globalThis.SUEToolRegistry = SUEToolRegistry;
