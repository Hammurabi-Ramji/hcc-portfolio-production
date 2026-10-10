'use strict';

class SUEVectorStore {
  ready = false;
  storageKey = 'sue_vector_memory';
  maxRecords = 300;
  defaultOllamaBaseUrl = 'http://localhost:11434';
  defaultEmbeddingModel = 'nomic-embed-text';

  async initialize() {
    this.ready = true;
  }

  async addMemory(entry) {
    const text = String(entry?.text || '').slice(0, 10_000);
    const embedding = await this._embedText(text);

    const current = await this._load();
    current.unshift({
      id: crypto.randomUUID(),
      text,
      source: entry?.source || 'agent',
      sessionId: entry?.sessionId || 'global',
      timestamp: Date.now(),
      embedding,
    });

    if (current.length > this.maxRecords) {
      current.length = this.maxRecords;
    }

    await chrome.storage.local.set({ [this.storageKey]: current });
  }

  async search(query, options = {}) {
    const text = String(query || '')
      .toLowerCase()
      .trim();
    const limit = Number.isInteger(options.limit) ? options.limit : 5;
    if (!text) return [];

    const records = await this._load();
    const queryEmbedding = await this._embedText(text);
    const scored = records
      .map((item) => ({
        item,
        score: this._score(item, text, queryEmbedding),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry) => ({ ...entry.item, similarity: entry.score }));

    return scored;
  }

  async listMemories(options = {}) {
    const limit = Number.isInteger(options.limit) ? options.limit : 100;
    const records = await this._load();
    return records.slice(0, Math.max(1, limit));
  }

  async clearMemories() {
    await chrome.storage.local.set({ [this.storageKey]: [] });
    return { cleared: true };
  }

  async compactMemories() {
    const records = await this._load();
    const seen = new Set();
    const compacted = [];

    for (const item of records) {
      const key = `${String(item?.text || '')
        .trim()
        .toLowerCase()}::${String(item?.source || '')}`;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      compacted.push(item);
      if (compacted.length >= this.maxRecords) break;
    }

    await chrome.storage.local.set({ [this.storageKey]: compacted });
    return {
      compacted: true,
      before: records.length,
      after: compacted.length,
      removed: Math.max(0, records.length - compacted.length),
    };
  }

  _score(record, needle, queryEmbedding) {
    const base = String(record?.text || '').toLowerCase();
    if (!base || !needle) return 0;

    let lexical = 0;
    if (base.includes(needle)) {
      lexical = 1;
    }

    const words = needle.split(/\s+/).filter(Boolean);
    if (words.length > 0) {
      let hits = 0;
      for (const word of words) {
        if (base.includes(word)) hits += 1;
      }
      lexical = Math.max(lexical, hits / words.length);
    }

    const semantic = this._cosineSimilarity(queryEmbedding, record?.embedding);
    if (semantic <= 0) {
      return lexical;
    }

    // Blend lexical and semantic signals. Semantic gets higher weight when available.
    return semantic * 0.75 + lexical * 0.25;
  }

  async _load() {
    const stored = await chrome.storage.local.get(this.storageKey);
    const value = stored[this.storageKey];
    return Array.isArray(value) ? value : [];
  }

  async _embedText(text) {
    const input = String(text || '').trim();
    if (!input) return null;

    try {
      const { baseUrl, model, apiKey } = await this._getEmbeddingConfig();
      const response = await fetch(`${baseUrl}/api/embed`, {
        method: 'POST',
        headers: this._embeddingHeaders(apiKey),
        body: JSON.stringify({
          model,
          input,
        }),
      });

      if (!response.ok) {
        return null;
      }

      const payload = await response.json();
      if (Array.isArray(payload?.embeddings) && Array.isArray(payload.embeddings[0])) {
        return payload.embeddings[0];
      }
      if (Array.isArray(payload?.embedding)) {
        return payload.embedding;
      }
    } catch {
      // Keep memory feature available even if local embedding service is down.
      return null;
    }

    return null;
  }

  _cosineSimilarity(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) return 0;
    if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;

    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i += 1) {
      const av = Number(a[i]) || 0;
      const bv = Number(b[i]) || 0;
      dot += av * bv;
      normA += av * av;
      normB += bv * bv;
    }

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async _getEmbeddingConfig() {
    const keys = ['sue_setup_ollama_url', 'sue_setup_embedding_model', 'sue_setup_ollama_api_key'];
    const stored = await chrome.storage.local.get(keys);
    const baseUrl = this._normalizeBaseUrl(stored.sue_setup_ollama_url);
    const model =
      typeof stored.sue_setup_embedding_model === 'string' &&
      stored.sue_setup_embedding_model.trim().length > 0
        ? stored.sue_setup_embedding_model.trim()
        : this.defaultEmbeddingModel;
    const apiKey =
      typeof stored.sue_setup_ollama_api_key === 'string' &&
      stored.sue_setup_ollama_api_key.trim().length > 0
        ? stored.sue_setup_ollama_api_key.trim()
        : null;

    return { baseUrl, model, apiKey };
  }

  _embeddingHeaders(apiKey) {
    const headers = { 'Content-Type': 'application/json' };
    if (typeof apiKey === 'string' && apiKey.trim().length > 0) {
      headers.Authorization = `Bearer ${apiKey.trim()}`;
    }
    return headers;
  }

  _normalizeBaseUrl(value) {
    const raw =
      typeof value === 'string' && value.trim().length > 0
        ? value.trim()
        : this.defaultOllamaBaseUrl;
    return raw.replace(/\/+$/, '');
  }
}

globalThis.SUEVectorStore = SUEVectorStore;
