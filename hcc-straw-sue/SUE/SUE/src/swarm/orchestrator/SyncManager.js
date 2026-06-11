import { ConflictResolver } from './ConflictResolver.js';

export class SyncManager {
  constructor(codeStore, conflictResolver = null) {
    this.codeStore = codeStore;
    this.conflictResolver = conflictResolver || new ConflictResolver(codeStore);
    this.subscribers = new Set(); // Agents subscribed to code changes
  }

  subscribe(agent) {
    this.subscribers.add(agent);
  }

  unsubscribe(agent) {
    this.subscribers.delete(agent);
  }

  async applyAgentPatches(agentId, patches = []) {
    const files = [...new Set(patches.map((patch) => patch?.file).filter(Boolean))];

    return this.conflictResolver.applyWithFileLocks(files, agentId, async () => {
      const applied = [];

      for (const patch of patches) {
        if (patch.operation === 'create') {
          await this.codeStore.writeFile(patch.file, patch.replace || '');
          applied.push({ ...patch, resolvedBy: 'create' });
          continue;
        }

        if (patch.operation === 'delete') {
          await this.codeStore.deleteFile(patch.file);
          applied.push({ ...patch, resolvedBy: 'delete' });
          continue;
        }

        const current = await this.codeStore.readFile(patch.file);
        const resolved = await this.conflictResolver.resolveMergeConflict(
          patch.file,
          current || '',
          patch.search,
          patch.replace || ''
        );
        await this.codeStore.writeFile(patch.file, resolved.content);
        applied.push({
          ...patch,
          hasConflicts: resolved.hasConflicts,
          resolvedBy: resolved.resolvedBy,
        });
      }

      await this.notifySubscribers(applied, agentId);
      return applied;
    });
  }

  async broadcastChanges(patches) {
    await this.applyAgentPatches('system', patches);
  }

  async notifySubscribers(patches, sourceAgent = null) {
    for (const agent of this.subscribers) {
      if (sourceAgent && (agent.name || agent.constructor?.name) === sourceAgent) {
        continue;
      }

      if (typeof agent.onCodebaseChange === 'function') {
        try {
          agent.onCodebaseChange(patches);
        } catch (error) {
          console.warn('[SyncManager] Subscriber update failed:', error);
        }
      }
    }
  }

  async getLatestCodebase() {
    return this.codeStore.getFiles();
  }
}
