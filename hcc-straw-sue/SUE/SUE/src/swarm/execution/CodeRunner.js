export class CodeRunner {
  constructor(codeStore) {
    this.codeStore = codeStore;
  }

  async runStaticValidation(files) {
    const report = [];
    for (const file of files || []) {
      const content = await this.codeStore.readFile(file);
      if (typeof content !== 'string') continue;
      const item = {
        file,
        hasContent: content.length > 0,
        hasUnresolvedConflictMarkers: /<<<<<<<|=======|>>>>>>>/.test(content),
        balancedBraces: this.hasBalancedPairs(content, '{', '}'),
        balancedParens: this.hasBalancedPairs(content, '(', ')'),
      };
      item.passed =
        item.hasContent &&
        !item.hasUnresolvedConflictMarkers &&
        item.balancedBraces &&
        item.balancedParens;
      report.push(item);
    }

    return {
      success: report.every((entry) => entry.passed),
      checks: report,
    };
  }

  hasBalancedPairs(content, left, right) {
    let count = 0;
    for (const char of content) {
      if (char === left) count += 1;
      if (char === right) count -= 1;
      if (count < 0) return false;
    }
    return count === 0;
  }
}
