export class VersionManager {
  constructor(codeStore) {
    this.codeStore = codeStore;
    this.snapshots = new Map(); // snapshotId -> { timestamp, files: { filePath -> content } }
  }

  async createSnapshot(description = '') {
    const snapshotId = `snapshot_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const files = await this.codeStore.getFiles();
    this.snapshots.set(snapshotId, {
      id: snapshotId,
      timestamp: Date.now(),
      description,
      files: { ...files }, // Deep copy of current files
    });
    return snapshotId;
  }

  async restoreSnapshot(snapshotId) {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot ${snapshotId} not found`);
    }
    // Clear current codebase and restore from snapshot
    for (const filePath of await this.codeStore.listFiles()) {
      await this.codeStore.deleteFile(filePath);
    }
    for (const [filePath, content] of Object.entries(snapshot.files)) {
      await this.codeStore.writeFile(filePath, content);
    }
    return true;
  }

  async listSnapshots() {
    return Array.from(this.snapshots.values()).map((s) => ({
      id: s.id,
      timestamp: s.timestamp,
      description: s.description,
    }));
  }
}
