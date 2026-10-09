export class CodeStore {
  constructor() {
    this.files = new Map(); // file_path -> content
    this.versions = new Map(); // file_path -> [{ label, content, timestamp }]
  }

  async readFile(filePath) {
    return this.files.get(filePath) || null;
  }

  async readFiles(filePaths) {
    const codebase = {};
    for (const filePath of filePaths) {
      const content = await this.readFile(filePath);
      if (content) {
        codebase[filePath] = content;
      }
    }
    return codebase;
  }

  async writeFile(filePath, content) {
    this.files.set(filePath, content);
    this.recordVersion(filePath, content, 'latest');
  }

  async deleteFile(filePath) {
    const currentContent = this.files.get(filePath);
    if (typeof currentContent === 'string') {
      this.recordVersion(filePath, currentContent, 'deleted');
    }
    this.files.delete(filePath);
  }

  async listFiles() {
    return Array.from(this.files.keys());
  }

  async applyPatches(patches) {
    for (const patch of patches) {
      switch (patch.operation) {
        case 'create':
          await this.writeFile(patch.file, patch.replace);
          break;
        case 'modify': {
          const currentContent = await this.readFile(patch.file);
          if (currentContent?.includes(patch.search)) {
            await this.writeFile(patch.file, currentContent.replace(patch.search, patch.replace));
          } else {
            console.warn(
              `[CodeStore] Modify operation failed: search string not found in ${patch.file}`
            );
            // Fallback: if search string not found, append/prepend or replace entire file
            await this.writeFile(patch.file, patch.replace); // Simple replace for now
          }
          break;
        }
        case 'delete':
          await this.deleteFile(patch.file);
          break;
      }
    }
  }

  async getFiles() {
    return Object.fromEntries(this.files);
  }

  recordVersion(filePath, content, label = 'latest') {
    const history = this.versions.get(filePath) || [];
    history.push({
      label,
      content,
      timestamp: Date.now(),
    });

    // Keep memory bounded for long swarm sessions.
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
    this.versions.set(filePath, history);
  }

  async getVersion(filePath, label = 'latest') {
    const history = this.versions.get(filePath) || [];
    for (let i = history.length - 1; i >= 0; i -= 1) {
      if (history[i].label === label) {
        return history[i].content;
      }
    }
    return null;
  }
}
