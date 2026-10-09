export class ApprovalGates {
  constructor() {
    this.criticalPatterns = [
      {
        pattern: /\b(delete|remove|truncate|drop)\b/i,
        severity: 'high',
        reason: 'Destructive operation',
      },
      {
        pattern: /\b(password|secret|api[_-]?key|token)\b/i,
        severity: 'high',
        reason: 'Sensitive data',
      },
      {
        pattern: /\beval\(|new\s+Function\(|Function\(/i,
        severity: 'critical',
        reason: 'Dynamic code execution',
      },
      {
        pattern: /\b(fetch|axios|XMLHttpRequest|http)\b/i,
        severity: 'medium',
        reason: 'Network behavior change',
      },
    ];
  }

  assessRisk(patch) {
    const text = `${patch?.search || ''}\n${patch?.replace || ''}`;
    return this.criticalPatterns.filter((entry) => entry.pattern.test(text));
  }

  async reviewChanges(patches, options = {}) {
    const approvedPatches = [];
    const deniedPatches = [];
    const gateResults = [];

    for (const patch of patches || []) {
      const risks = this.assessRisk(patch);
      const hasCritical = risks.some((r) => r.severity === 'critical');

      if (!hasCritical) {
        approvedPatches.push(patch);
        gateResults.push({ approved: true, auto: true, risks, patch });
        continue;
      }

      if (options.autoApproveCritical === true) {
        approvedPatches.push(patch);
        gateResults.push({ approved: true, auto: true, risks, patch });
        continue;
      }

      const approval = await this.requestApproval(patch, risks);
      gateResults.push({ ...approval, risks, patch });
      if (approval.approved) {
        approvedPatches.push(patch);
      } else {
        deniedPatches.push(patch);
      }
    }

    return {
      approvedPatches,
      deniedPatches,
      gateResults,
      blocked: deniedPatches.length > 0,
    };
  }

  async requestApproval(patch, risks) {
    if (!globalThis.chrome?.runtime?.sendMessage) {
      return { approved: false, reason: 'approval-channel-unavailable' };
    }

    try {
      const response = await globalThis.chrome.runtime.sendMessage({
        type: 'REQUEST_APPROVAL',
        payload: { patch, risks },
      });
      return {
        approved: Boolean(response?.approved),
        reason: response?.reason || null,
      };
    } catch {
      return { approved: false, reason: 'approval-request-failed' };
    }
  }
}
