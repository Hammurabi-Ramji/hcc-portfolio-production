export class CostTracker {
  constructor() {
    this.models = {
      'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
      'text-embedding-3-small': { input: 0.00002, output: 0 },
    };
    this.entries = [];
  }

  trackRequest({ model, inputTokens = 0, outputTokens = 0, agent = 'unknown', metadata = {} }) {
    const rates = this.models[model] || this.models['gpt-4-turbo-preview'];
    const cost = (inputTokens * rates.input + outputTokens * rates.output) / 1000;
    const entry = {
      timestamp: Date.now(),
      model,
      agent,
      inputTokens,
      outputTokens,
      cost,
      cumulative: this.getTotalCost() + cost,
      metadata,
    };
    this.entries.push(entry);
    return entry;
  }

  getTotalCost() {
    return this.entries.reduce((sum, item) => sum + item.cost, 0);
  }

  shouldOptimize(threshold = 0.05) {
    const recent = this.entries.slice(-5);
    if (recent.length === 0) return false;
    const avg = recent.reduce((sum, item) => sum + item.cost, 0) / recent.length;
    return avg > threshold;
  }

  getRecommendations() {
    const recommendations = [];
    if (this.getTotalCost() > 1) {
      recommendations.push('Consider cheaper models for low-risk tasks or increase cache usage.');
    }

    const byAgent = new Map();
    for (const entry of this.entries) {
      byAgent.set(entry.agent, (byAgent.get(entry.agent) || 0) + entry.cost);
    }

    const sorted = [...byAgent.entries()].sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0 && sorted[0][1] > 0.5) {
      recommendations.push(
        `${sorted[0][0]} has the highest spend; consider additional prompt compression.`
      );
    }

    if (this.shouldOptimize()) {
      recommendations.push('Average per-request cost is high; prefer cache hits when available.');
    }

    return recommendations;
  }
}
