export class PromptLab {
  constructor() {
    this.templates = new Map();
    this._seedDefaults();
  }

  registerTemplate(templateName, variants = []) {
    const normalized = variants
      .filter((variant) => variant?.id && variant?.system)
      .map((variant) => ({
        id: variant.id,
        system: variant.system,
        user: variant.user || '',
        weight: Number.isFinite(variant.weight) ? variant.weight : 1,
        runs: 0,
        success: 0,
        failures: 0,
        totalLatencyMs: 0,
        totalCost: 0,
        avgScore: 0,
      }));

    if (normalized.length > 0) {
      this.templates.set(templateName, normalized);
    }
  }

  chooseVariant(templateName, context = {}) {
    const variants = this.templates.get(templateName) || [];
    if (variants.length === 0) {
      return null;
    }

    const explorationBonus = Number.isFinite(context.explorationBonus)
      ? context.explorationBonus
      : 0.2;
    const totalRuns = variants.reduce((sum, variant) => sum + variant.runs, 0) + 1;

    let bestVariant = variants[0];
    let bestScore = -Infinity;

    for (const variant of variants) {
      const base = variant.runs === 0 ? 0.5 : variant.avgScore;
      const explore = Math.sqrt(Math.log(totalRuns + 1) / (variant.runs + 1));
      const weightBoost = Math.max(0.05, variant.weight) * 0.05;
      const candidateScore = base + explorationBonus * explore + weightBoost;
      if (candidateScore > bestScore) {
        bestScore = candidateScore;
        bestVariant = variant;
      }
    }

    return {
      template: templateName,
      variant: bestVariant.id,
      system: bestVariant.system,
      user: bestVariant.user,
      score: bestScore,
    };
  }

  render(templateName, variables = {}, context = {}) {
    const selected = this.chooseVariant(templateName, context);
    if (!selected) {
      return null;
    }

    return {
      ...selected,
      system: this.interpolate(selected.system, variables),
      user: this.interpolate(selected.user, variables),
    };
  }

  recordOutcome({ template, variant, success, latencyMs = 0, cost = 0, score = null }) {
    if (!template || !variant) {
      return null;
    }

    const variants = this.templates.get(template) || [];
    const target = variants.find((item) => item.id === variant);
    if (!target) {
      return null;
    }

    target.runs += 1;
    target.success += success ? 1 : 0;
    target.failures += success ? 0 : 1;
    target.totalLatencyMs += Math.max(0, Number(latencyMs) || 0);
    target.totalCost += Math.max(0, Number(cost) || 0);

    let quality = success ? 1 : 0;
    if (Number.isFinite(score)) {
      quality = Number(score);
    }
    target.avgScore = (target.avgScore * (target.runs - 1) + quality) / target.runs;

    return {
      template,
      variant,
      runs: target.runs,
      successRate: target.runs === 0 ? 0 : target.success / target.runs,
      avgScore: target.avgScore,
      avgCost: target.runs === 0 ? 0 : target.totalCost / target.runs,
    };
  }

  getStats(templateName = null) {
    const toStats = (variant) => ({
      id: variant.id,
      runs: variant.runs,
      successRate: variant.runs === 0 ? 0 : variant.success / variant.runs,
      failureRate: variant.runs === 0 ? 0 : variant.failures / variant.runs,
      avgLatencyMs: variant.runs === 0 ? 0 : variant.totalLatencyMs / variant.runs,
      avgCost: variant.runs === 0 ? 0 : variant.totalCost / variant.runs,
      avgScore: variant.avgScore,
    });

    if (templateName) {
      return (this.templates.get(templateName) || []).map(toStats);
    }

    const all = {};
    for (const [name, variants] of this.templates.entries()) {
      all[name] = variants.map(toStats);
    }
    return all;
  }

  updateVariantWeight(templateName, variantId, weight) {
    if (!templateName || !variantId || !Number.isFinite(weight)) {
      return { success: false, error: 'templateName, variantId, and numeric weight are required' };
    }

    const variants = this.templates.get(templateName) || [];
    const target = variants.find((item) => item.id === variantId);
    if (!target) {
      return { success: false, error: 'Variant not found' };
    }

    target.weight = Math.max(0.05, Number(weight));
    return {
      success: true,
      template: templateName,
      variant: variantId,
      weight: target.weight,
    };
  }

  getLeaderboard(templateName) {
    const variants = this.templates.get(templateName) || [];
    return variants
      .map((variant) => ({
        id: variant.id,
        weight: variant.weight,
        runs: variant.runs,
        successRate: variant.runs === 0 ? 0 : variant.success / variant.runs,
        avgLatencyMs: variant.runs === 0 ? 0 : variant.totalLatencyMs / variant.runs,
        avgCost: variant.runs === 0 ? 0 : variant.totalCost / variant.runs,
        avgScore: variant.avgScore,
      }))
      .sort((a, b) => {
        if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
        if (b.successRate !== a.successRate) return b.successRate - a.successRate;
        return a.avgCost - b.avgCost;
      });
  }

  getBestVariant(templateName) {
    const leaderboard = this.getLeaderboard(templateName);
    return leaderboard[0] || null;
  }

  exportReport() {
    const templates = [...this.templates.keys()];
    const report = {
      generatedAt: new Date().toISOString(),
      templates: {},
      recommendations: [],
    };

    for (const template of templates) {
      const leaderboard = this.getLeaderboard(template);
      const best = leaderboard[0] || null;
      report.templates[template] = {
        variants: leaderboard,
        bestVariant: best,
      };

      if (best && best.runs >= 3 && best.successRate >= 0.8) {
        report.recommendations.push(
          `Template ${template}: consider increasing weight for ${best.id} (success ${(best.successRate * 100).toFixed(0)}%).`
        );
      }
    }

    return report;
  }

  interpolate(template, variables) {
    let output = String(template || '');
    for (const [key, value] of Object.entries(variables || {})) {
      const token = `{{${key}}}`;
      output = output.split(token).join(String(value ?? ''));
    }
    return output;
  }

  _seedDefaults() {
    this.registerTemplate('director', [
      {
        id: 'v1-balanced',
        weight: 1,
        system:
          'You are the Director of a code generation swarm. Break user requests into atomic, parallel tasks with explicit dependencies and complete JSON output.',
        user: String.raw`Request: {{request}}
      Context: {{context}}
      Return strict JSON with goal, techStack, tasks, and sharedContracts.`,
      },
      {
        id: 'v2-contract-first',
        weight: 1,
        system:
          'You are a contract-first Director. Prefer stable interfaces, minimal risky changes, and parallel tasks that can be validated quickly.',
        user: String.raw`Request: {{request}}
      Context: {{context}}
      Return strict JSON and ensure sharedContracts are concrete before implementation tasks.`,
      },
    ]);

    this.registerTemplate('agent', [
      {
        id: 'v1-comprehensive',
        weight: 1,
        system:
          'You are a specialized coding agent. Produce precise JSON code changes with minimal diff, preserving existing behavior unless task requires change.',
        user: String.raw`TASK: {{task}}
      ACCEPTANCE CRITERIA: {{criteria}}
      TECH STACK: {{techStack}}
      CURRENT CODEBASE:
      {{codebase}}
      SHARED CONTRACTS:
      {{contracts}}
      Return strict JSON with changes, summary, nextSteps.`,
      },
      {
        id: 'v2-token-lean',
        weight: 1,
        system:
          'You are a token-efficient coding agent. Prioritize concise patches, avoid unnecessary file rewrites, and keep output strict JSON.',
        user: String.raw`TASK: {{task}}
      CRITERIA: {{criteria}}
      STACK: {{techStack}}
      CODE:
      {{codebase}}
      CONTRACTS:
      {{contracts}}
      Return strict JSON: changes[], summary, nextSteps.`,
      },
    ]);
  }
}
