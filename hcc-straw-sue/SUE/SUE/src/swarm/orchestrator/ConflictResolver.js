export class ConflictResolver {
  constructor(codeStore) {
    this.codeStore = codeStore;
    this.locks = new Map(); // file -> { agentId, lockId, timestamp }
  }

  async acquireLock(files, agentId, timeout = 30_000) {
    const normalized = [...new Set((files || []).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b)
    );
    const lockId = `${agentId}_${Date.now()}`;
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeout) {
      const canLock = normalized.every((file) => !this.locks.has(file));
      if (canLock) {
        const payload = { agentId, lockId, timestamp: Date.now() };
        normalized.forEach((file) => this.locks.set(file, payload));
        return { success: true, lockId, files: normalized };
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    throw new Error(`Could not acquire lock for: ${normalized.join(', ')}`);
  }

  releaseLock(lockId) {
    for (const [file, lock] of this.locks.entries()) {
      if (lock.lockId === lockId) {
        this.locks.delete(file);
      }
    }
  }

  async applyWithFileLocks(files, agentId, callback, timeout = 30_000) {
    const lock = await this.acquireLock(files, agentId, timeout);
    try {
      return await callback();
    } finally {
      this.releaseLock(lock.lockId);
    }
  }

  async resolveMergeConflict(file, currentContent, search, replacement) {
    if (typeof currentContent !== 'string') {
      return {
        content: replacement,
        hasConflicts: false,
        resolvedBy: 'fallback-replace',
      };
    }

    if (typeof search === 'string' && search.length > 0 && currentContent.includes(search)) {
      return {
        content: currentContent.replace(search, replacement),
        hasConflicts: false,
        resolvedBy: 'direct-replace',
      };
    }

    const base = (await this.codeStore.getVersion(file, 'base')) || '';
    if (base && base !== currentContent && search && base.includes(search)) {
      const baseApplied = base.replace(search, replacement);
      const merged = this.threeWayMerge(base, currentContent, baseApplied);
      if (!merged.hasConflicts) {
        return {
          content: merged.content,
          hasConflicts: false,
          resolvedBy: 'three-way-merge',
        };
      }
    }

    // Conservative fallback: append update with conflict marker.
    const conflictMarkers = [
      currentContent,
      '',
      '<<<<<<< SWARM_CONFLICT',
      replacement,
      '>>>>>>> SWARM_CONFLICT',
    ].join('\n');
    return {
      content: conflictMarkers,
      hasConflicts: true,
      resolvedBy: 'conflict-markers',
    };
  }

  threeWayMerge(base, left, right) {
    if (left === right) {
      return { hasConflicts: false, content: left };
    }
    if (left === base) {
      return { hasConflicts: false, content: right };
    }
    if (right === base) {
      return { hasConflicts: false, content: left };
    }

    const leftLines = left.split('\n');
    const rightLines = right.split('\n');
    const max = Math.max(leftLines.length, rightLines.length);
    const output = [];
    let hasConflicts = false;

    for (let i = 0; i < max; i += 1) {
      const a = leftLines[i] ?? '';
      const b = rightLines[i] ?? '';
      if (a === b) {
        output.push(a);
      } else {
        hasConflicts = true;
        output.push('<<<<<<< LEFT', a, '=======', b, '>>>>>>> RIGHT');
      }
    }

    return { hasConflicts, content: output.join('\n') };
  }
}
