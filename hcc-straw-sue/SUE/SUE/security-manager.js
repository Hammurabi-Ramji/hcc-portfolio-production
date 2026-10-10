'use strict';

class SUESecurityManager {
  constructor() {
    this.blockedCommandTokens = new Set(['rm', 'del', 'format', 'mkfs', 'shutdown']);
    this.rateLimiter = new Map();
  }

  checkRateLimit(scopeKey, action, windowMs = 60_000, maxRequests = 40) {
    const key = `${scopeKey}:${action}`;
    const now = Date.now();
    const history = this.rateLimiter.get(key) || [];
    const pruned = history.filter((stamp) => now - stamp < windowMs);
    pruned.push(now);
    this.rateLimiter.set(key, pruned);

    if (pruned.length > maxRequests) {
      throw new Error('Rate limit exceeded for this action');
    }

    return true;
  }

  validateDesktopCommand(commandText) {
    const text = String(commandText || '')
      .trim()
      .toLowerCase();
    if (!text) {
      throw new Error('Desktop command is empty');
    }

    const firstToken = text.split(/\s+/)[0];
    if (this.blockedCommandTokens.has(firstToken)) {
      throw new Error(`Blocked command: ${firstToken}`);
    }

    return true;
  }

  sanitizeSelector(selector) {
    const text = String(selector || '').trim();
    if (!text) {
      throw new Error('Selector is required');
    }
    if (text.length > 300) {
      throw new Error('Selector too long');
    }
    return text;
  }
}

globalThis.SUESecurityManager = SUESecurityManager;
