'use strict';

/**
 * Memory Manager: Hierarchical Memory for SWAM-Agent
 * Implements Working, Episodic, and Semantic memory layers
 */

class SUEMemoryManager {
  constructor() {
    this.workingMemory = new Map(); // Session-scoped, volatile
    this.episodicStore = 'sue_episodic_memory'; // IndexedDB key
    this.semanticStore = 'sue_semantic_memory'; // IndexedDB key
    this.maxWorkingItems = 100;
    this.maxEpisodicItems = 1000;
    this.initialized = false;
  }

  /**
   * Initialize memory system
   */
  async initialize() {
    try {
      await this._initializeIndexedDB();
      this.initialized = true;
      console.log('[SUE Memory] Initialized');
    } catch (error) {
      console.warn('[SUE Memory] IndexedDB initialization failed:', error);
      this.initialized = false;
    }
  }

  /**
   * Initialize IndexedDB if available
   */
  async _initializeIndexedDB() {
    if (!globalThis.indexedDB) {
      console.warn('[SUE Memory] IndexedDB not available');
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SUEMemoryDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('episodic')) {
          const store = db.createObjectStore('episodic', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('sessionId', 'sessionId', { unique: false });
        }

        if (!db.objectStoreNames.contains('semantic')) {
          db.createObjectStore('semantic', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Add to working memory (session-scoped)
   */
  addToWorkingMemory(key, value) {
    if (this.workingMemory.size >= this.maxWorkingItems) {
      const firstKey = this.workingMemory.keys().next().value;
      this.workingMemory.delete(firstKey);
    }

    this.workingMemory.set(key, {
      value,
      addedAt: Date.now(),
    });
  }

  /**
   * Retrieve from working memory
   */
  getFromWorkingMemory(key) {
    const entry = this.workingMemory.get(key);
    return entry ? entry.value : null;
  }

  /**
   * Add to episodic memory (persistent, session-aware)
   */
  async addEpisodic(entry) {
    const episodic = {
      id: crypto.randomUUID(),
      text: String(entry?.text || '').slice(0, 10_000),
      source: entry?.source || 'agent',
      sessionId: entry?.sessionId || 'global',
      url: entry?.url || null,
      actionTaken: entry?.actionTaken || null,
      result: entry?.result || null,
      embedding: entry?.embedding || null,
      timestamp: Date.now(),
    };

    if (this.initialized) {
      try {
        await this._storeInIndexedDB('episodic', episodic);
      } catch (error) {
        console.warn('[SUE Memory] Failed to store episodic:', error);
        // Fallback to chrome.storage.local
        await this._storeInChromeStorage(this.episodicStore, episodic);
      }
    } else {
      await this._storeInChromeStorage(this.episodicStore, episodic);
    }

    return episodic;
  }

  /**
   * Search episodic memory with semantic support
   */
  async searchEpisodic(query, options = {}) {
    const limit = options.limit || 10;
    const sessionId = options.sessionId || null;
    const useSemantic = options.useSemantic !== false;

    let results = [];
    if (this.initialized) {
      try {
        results = await this._searchIndexedDB('episodic', query, { limit, sessionId });
      } catch (error) {
        console.warn('[SUE Memory] IndexedDB search failed:', error);
      }
    } else {
      results = await this._searchChromeStorage(this.episodicStore, query, { limit, sessionId });
    }

    // If semantic search is requested and we have a vector store, use it to re-rank
    if (useSemantic && globalThis.sueVectorStore && query) {
      const semanticResults = await globalThis.sueVectorStore.search(query, { limit });
      // Merge results, prioritizing semantic hits
      const merged = [...semanticResults];
      const seenIds = new Set(merged.map((r) => r.id));

      for (const r of results) {
        if (!seenIds.has(r.id)) {
          merged.push(r);
        }
      }
      return merged.slice(0, limit);
    }

    return results;
  }

  /**
   * Add to semantic memory (long-term patterns, preferences)
   */
  async addSemantic(key, value) {
    const semantic = {
      key,
      value,
      updatedAt: Date.now(),
    };

    if (this.initialized) {
      try {
        await this._storeInIndexedDB('semantic', semantic);
      } catch (error) {
        console.warn('[SUE Memory] Failed to store semantic:', error);
        await this._storeInChromeStorage(this.semanticStore, semantic);
      }
    } else {
      await this._storeInChromeStorage(this.semanticStore, semantic);
    }

    return semantic;
  }

  /**
   * Retrieve from semantic memory
   */
  async getSemantic(key) {
    if (this.initialized) {
      try {
        return await this._getFromIndexedDB('semantic', key);
      } catch (error) {
        console.warn('[SUE Memory] IndexedDB retrieval failed:', error);
      }
    }

    return await this._getFromChromeStorage(this.semanticStore, key);
  }

  /**
   * Record user goal (semantic memory)
   */
  async recordUserGoal(goal) {
    const goals = (await this.getSemantic('user_goals')) || [];
    if (!Array.isArray(goals)) {
      goals.splice(0);
    }

    goals.push({
      goal,
      recordedAt: Date.now(),
    });

    // Keep last 50 goals
    if (goals.length > 50) {
      goals.shift();
    }

    await this.addSemantic('user_goals', goals);
    return goals;
  }

  /**
   * Record site pattern (semantic memory)
   */
  async recordSitePattern(domain, pattern) {
    const patterns = (await this.getSemantic('site_patterns')) || {};
    if (typeof patterns !== 'object' || patterns === null) {
      Object.assign(patterns, {});
    }

    patterns[domain] = {
      ...patterns[domain],
      ...pattern,
      updatedAt: Date.now(),
    };

    await this.addSemantic('site_patterns', patterns);
    return patterns;
  }

  /**
   * Record failure (semantic memory)
   */
  async recordFailure(failureInfo) {
    const failures = (await this.getSemantic('failures')) || [];
    if (!Array.isArray(failures)) {
      failures.splice(0);
    }

    failures.push({
      ...failureInfo,
      recordedAt: Date.now(),
    });

    // Keep last 100 failures
    if (failures.length > 100) {
      failures.shift();
    }

    await this.addSemantic('failures', failures);
    return failures;
  }

  /**
   * Get memory statistics
   */
  async getMemoryStats() {
    const workingCount = this.workingMemory.size;
    let episodicCount = 0;
    let semanticCount = 0;

    try {
      if (this.initialized) {
        episodicCount = await this._countIndexedDB('episodic');
        semanticCount = await this._countIndexedDB('semantic');
      } else {
        const episodic = await chrome.storage.local.get(this.episodicStore);
        episodicCount = Array.isArray(episodic[this.episodicStore])
          ? episodic[this.episodicStore].length
          : 0;

        const semantic = await chrome.storage.local.get(this.semanticStore);
        semanticCount =
          typeof semantic[this.semanticStore] === 'object'
            ? Object.keys(semantic[this.semanticStore]).length
            : 0;
      }
    } catch (error) {
      console.warn('[SUE Memory] Stats retrieval failed:', error);
    }

    return {
      workingMemory: workingCount,
      episodicMemory: episodicCount,
      semanticMemory: semanticCount,
      totalItems: workingCount + episodicCount + semanticCount,
    };
  }

  /**
   * Compact memory by removing old items
   */
  async compact() {
    if (!this.initialized) return;

    try {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('SUEMemoryDB', 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      const tx = db.transaction('episodic', 'readwrite');
      const store = tx.objectStore('episodic');
      const countRequest = store.count();

      countRequest.onsuccess = async () => {
        if (countRequest.result > this.maxEpisodicItems) {
          const toDelete = countRequest.result - this.maxEpisodicItems;
          const index = store.index('timestamp');
          const cursorRequest = index.openCursor();
          let deleted = 0;

          cursorRequest.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor && deleted < toDelete) {
              cursor.delete();
              deleted++;
              cursor.continue();
            }
          };
        }
      };
    } catch (error) {
      console.warn('[SUE Memory] Compaction failed:', error);
    }
  }

  /**
   * Clear all memory (for testing)
   */
  async clearAll() {
    this.workingMemory.clear();

    try {
      if (this.initialized) {
        await this._clearIndexedDB('episodic');
        await this._clearIndexedDB('semantic');
      }
    } catch (error) {
      console.warn('[SUE Memory] IndexedDB clear failed:', error);
    }

    await chrome.storage.local.remove([this.episodicStore, this.semanticStore]);
    return { success: true };
  }

  /**
   * ─────────────────────────────────────────────────────────────
   * IndexedDB Helpers
   * ─────────────────────────────────────────────────────────────
   */

  async _storeInIndexedDB(storeName, data) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SUEMemoryDB', 1);

      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const putRequest = store.put(data);

        putRequest.onsuccess = () => resolve(data);
        putRequest.onerror = () => reject(putRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async _getFromIndexedDB(storeName, key) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SUEMemoryDB', 1);

      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const getRequest = store.get(key);

        getRequest.onsuccess = () => resolve(getRequest.result || null);
        getRequest.onerror = () => reject(getRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async _searchIndexedDB(storeName, query, options = {}) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SUEMemoryDB', 1);

      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const allRequest = store.getAll();

        allRequest.onsuccess = () => {
          let results = allRequest.result || [];

          // Filter by sessionId if provided
          if (options.sessionId) {
            results = results.filter((r) => r.sessionId === options.sessionId);
          }

          // Filter by query text
          if (query) {
            const queryLower = String(query).toLowerCase();
            results = results.filter((r) =>
              String(r.text || '')
                .toLowerCase()
                .includes(queryLower)
            );
          }

          // Sort by timestamp descending
          results.sort((a, b) => b.timestamp - a.timestamp);

          // Limit results
          const limit = options.limit || 10;
          resolve(results.slice(0, limit));
        };

        allRequest.onerror = () => reject(allRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async _countIndexedDB(storeName) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SUEMemoryDB', 1);

      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const countRequest = store.count();

        countRequest.onsuccess = () => resolve(countRequest.result);
        countRequest.onerror = () => reject(countRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async _clearIndexedDB(storeName) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SUEMemoryDB', 1);

      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const clearRequest = store.clear();

        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * ─────────────────────────────────────────────────────────────
   * Chrome Storage Fallback
   * ─────────────────────────────────────────────────────────────
   */

  async _storeInChromeStorage(key, data) {
    const stored = await chrome.storage.local.get(key);
    const items = Array.isArray(stored[key]) ? stored[key] : [];

    items.unshift(data);

    if (items.length > this.maxEpisodicItems) {
      items.length = this.maxEpisodicItems;
    }

    await chrome.storage.local.set({ [key]: items });
  }

  async _searchChromeStorage(key, query, options = {}) {
    const stored = await chrome.storage.local.get(key);
    let items = Array.isArray(stored[key]) ? stored[key] : [];

    if (options.sessionId) {
      items = items.filter((item) => item.sessionId === options.sessionId);
    }

    if (query) {
      const queryLower = String(query).toLowerCase();
      items = items.filter((item) =>
        String(item.text || '')
          .toLowerCase()
          .includes(queryLower)
      );
    }

    const limit = options.limit || 10;
    return items.slice(0, limit);
  }

  async _getFromChromeStorage(key, itemKey) {
    const stored = await chrome.storage.local.get(key);
    const items = stored[key];

    if (typeof items === 'object' && items !== null) {
      return items[itemKey] || null;
    }

    return null;
  }
}

globalThis.SUEMemoryManager = SUEMemoryManager;
