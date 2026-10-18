export class SemanticCache {
  constructor() {
    this.cache = new Map();
    this.signatureIndex = new Map();
    this.similarityThreshold = 0.9;
  }

  async get(prompt, context = {}) {
    const signature = this.createSignature(prompt);
    for (const [key, value] of this.cache.entries()) {
      const candidate = this.signatureIndex.get(key);
      const similarity = this.jaccardSimilarity(signature, candidate || []);
      if (similarity >= this.similarityThreshold) {
        const sameContext = JSON.stringify(value.context || {}) === JSON.stringify(context || {});
        if (sameContext) {
          return { ...value.result, _cache: { hit: true, similarity } };
        }
      }
    }
    return null;
  }

  async set(prompt, result, context = {}) {
    const key = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.cache.set(key, { context, result });
    this.signatureIndex.set(key, this.createSignature(prompt));
  }

  createSignature(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2)
      .slice(0, 256);
  }

  jaccardSimilarity(a, b) {
    const setA = new Set(a);
    const setB = new Set(b);
    if (setA.size === 0 && setB.size === 0) return 1;
    const intersection = [...setA].filter((item) => setB.has(item)).length;
    const union = new Set([...setA, ...setB]).size;
    return union === 0 ? 0 : intersection / union;
  }
}
