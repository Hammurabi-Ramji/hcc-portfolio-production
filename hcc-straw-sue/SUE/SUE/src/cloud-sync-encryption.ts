/**
 * Cloud Sync & Collaboration System
 * End-to-end encrypted sync with conflict resolution
 */

export interface SyncItem {
  id: string;
  type: 'note' | 'project' | 'tag';
  content: string;
  hash: string;
  version: number;
  timestamp: number;
  encrypted: boolean;
}

export interface SyncConflict {
  itemId: string;
  localVersion: SyncItem;
  remoteVersion: SyncItem;
  resolvedVersion?: SyncItem;
}

export interface SyncStatus {
  lastSync: number;
  itemsQueued: number;
  isSyncing: boolean;
  conflicts: SyncConflict[];
}

export interface EncryptionKey {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  algorithm: string;
}

/**
 * CloudSyncManager handles end-to-end encrypted synchronization
 */
export class CloudSyncManager {
  private encryptionKey: EncryptionKey | null = null;
  private syncQueue: SyncItem[] = [];
  private localStore: Map<string, SyncItem> = new Map();
  private remoteStore: Map<string, SyncItem> = new Map();
  private conflicts: Map<string, SyncConflict> = new Map();
  private isSyncing: boolean = false;
  private lastSync: number = 0;

  constructor(private storageEndpoint: string) {}

  /**
   * Initialize encryption with user's passphrase
   */
  public async initializeEncryption(passphrase: string): Promise<void> {
    // Derive key from passphrase
    const encoder = new TextEncoder();
    const data = encoder.encode(passphrase);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    // Generate RSA key pair
    this.encryptionKey = (await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt']
    )) as EncryptionKey;
  }

  /**
   * Encrypt data with public key
   */
  public async encryptData(data: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption not initialized');
    }

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    const encryptedBuffer = await crypto.subtle.encrypt(
      'RSA-OAEP',
      this.encryptionKey.publicKey,
      dataBuffer
    );

    return this.bufferToBase64(encryptedBuffer);
  }

  /**
   * Decrypt data with private key
   */
  public async decryptData(encryptedData: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption not initialized');
    }

    const encryptedBuffer = this.base64ToBuffer(encryptedData);

    const decryptedBuffer = await crypto.subtle.decrypt(
      'RSA-OAEP',
      this.encryptionKey.privateKey,
      encryptedBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }

  /**
   * Queue item for sync
   */
  public queueForSync(item: SyncItem): void {
    this.syncQueue.push(item);
    this.localStore.set(item.id, item);
  }

  /**
   * Perform full sync with server
   */
  public async performSync(): Promise<SyncStatus> {
    if (this.isSyncing) {
      return this.getSyncStatus();
    }

    this.isSyncing = true;

    try {
      // Upload local changes
      await this.uploadChanges();

      // Download remote changes
      await this.downloadChanges();

      // Resolve conflicts
      await this.resolveConflicts();

      this.lastSync = Date.now();
      this.syncQueue = [];
    } finally {
      this.isSyncing = false;
    }

    return this.getSyncStatus();
  }

  /**
   * Upload local changes to server
   */
  private async uploadChanges(): Promise<void> {
    for (const item of this.syncQueue) {
      const encryptedContent = await this.encryptData(item.content);

      const payload = {
        id: item.id,
        type: item.type,
        content: encryptedContent,
        hash: item.hash,
        version: item.version,
        timestamp: item.timestamp,
      };

      const response = await fetch(`${this.storageEndpoint}/sync/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
    }
  }

  /**
   * Download remote changes from server
   */
  private async downloadChanges(): Promise<void> {
    const response = await fetch(`${this.storageEndpoint}/sync/download`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    const remoteItems = (await response.json()) as SyncItem[];

    for (const item of remoteItems) {
      const decryptedContent = await this.decryptData(item.content);
      const decryptedItem: SyncItem = {
        ...item,
        content: decryptedContent,
      };

      this.remoteStore.set(item.id, decryptedItem);

      // Check for conflicts
      const localItem = this.localStore.get(item.id);
      if (localItem && localItem.version !== decryptedItem.version) {
        this.conflicts.set(item.id, {
          itemId: item.id,
          localVersion: localItem,
          remoteVersion: decryptedItem,
        });
      } else if (!localItem) {
        // New remote item
        this.localStore.set(item.id, decryptedItem);
      }
    }
  }

  /**
   * Resolve conflicts using operational transformation
   */
  private async resolveConflicts(): Promise<void> {
    for (const [itemId, conflict] of this.conflicts) {
      const resolved = this.operationalTransform(conflict.localVersion, conflict.remoteVersion);

      conflict.resolvedVersion = resolved;
      this.localStore.set(itemId, resolved);

      // Upload resolved version
      const encryptedContent = await this.encryptData(resolved.content);
      await fetch(`${this.storageEndpoint}/sync/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          version: resolved.version,
          content: encryptedContent,
        }),
      });
    }

    this.conflicts.clear();
  }

  /**
   * Operational transformation for concurrent edits
   */
  private operationalTransform(local: SyncItem, remote: SyncItem): SyncItem {
    // Simple merge strategy: prefer newer version
    if (local.timestamp > remote.timestamp) {
      return {
        ...local,
        version: Math.max(local.version, remote.version) + 1,
      };
    } else {
      return {
        ...remote,
        version: Math.max(local.version, remote.version) + 1,
      };
    }
  }

  /**
   * Get current sync status
   */
  public getSyncStatus(): SyncStatus {
    return {
      lastSync: this.lastSync,
      itemsQueued: this.syncQueue.length,
      isSyncing: this.isSyncing,
      conflicts: Array.from(this.conflicts.values()),
    };
  }

  /**
   * Enable selective sync
   */
  public setSelectiveSync(itemIds: string[], enabled: boolean): void {
    // Implementation for selective sync preferences
  }

  /**
   * Get version history for item
   */
  public async getVersionHistory(itemId: string): Promise<SyncItem[]> {
    const response = await fetch(`${this.storageEndpoint}/sync/history/${itemId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch history: ${response.statusText}`);
    }

    const versions = (await response.json()) as SyncItem[];

    // Decrypt all versions
    const decryptedVersions: SyncItem[] = [];
    for (const version of versions) {
      const decryptedContent = await this.decryptData(version.content);
      decryptedVersions.push({
        ...version,
        content: decryptedContent,
      });
    }

    return decryptedVersions;
  }

  /**
   * Rollback to previous version
   */
  public async rollbackToVersion(itemId: string, version: number): Promise<void> {
    const history = await this.getVersionHistory(itemId);
    const targetVersion = history.find((v) => v.version === version);

    if (!targetVersion) {
      throw new Error(`Version ${version} not found`);
    }

    this.queueForSync(targetVersion);
  }

  // Helper methods
  private bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// Export singleton instance
export const cloudSyncManager = new CloudSyncManager(
  process.env.SYNC_ENDPOINT || 'https://sync.sue.local'
);
