'use strict';

class SUEIntentRouter {
  constructor() {
    this.intentPatterns = {
      NAVIGATION: [/\b(go to|navigate to|open|visit)\s+(.+)/i, /\bsearch for\s+(.+)/i],
      DOM_MANIPULATION: [
        /\b(click|tap)\s+(.+)/i,
        /\b(fill|type)\s+(.+?)\s+(with|as)\s+(.+)/i,
        /\b(scroll)\s+(up|down|to)\b/i,
      ],
      FILE_OPERATION: [/\b(download|save|export|upload)\b/i],
      RESEARCH: [/\b(research|analyze|summarize|compare|investigate)\b/i],
      MULTI_STEP_TASK: [/\bthen\b/i, /\band then\b/i, /\bstep\s+\d+\b/i],
      CONVERSATION: [],
    };
  }

  classify(query) {
    const text = typeof query === 'string' ? query.trim() : '';
    if (!text) {
      return { category: 'CONVERSATION', confidence: 0.2, extractedParams: [], rawQuery: '' };
    }

    for (const [category, patterns] of Object.entries(this.intentPatterns)) {
      for (const pattern of patterns) {
        const match = pattern.exec(text);
        if (match) {
          return {
            category,
            confidence: 0.82,
            extractedParams: match.slice(1),
            rawQuery: text,
          };
        }
      }
    }

    return {
      category: this._fallbackCategory(text),
      confidence: 0.55,
      extractedParams: [],
      rawQuery: text,
    };
  }

  _fallbackCategory(query) {
    if (query.includes('?')) return 'RESEARCH';
    if (query.split(' ').length > 20) return 'CONVERSATION';
    return 'CONVERSATION';
  }
}

globalThis.SUEIntentRouter = SUEIntentRouter;
