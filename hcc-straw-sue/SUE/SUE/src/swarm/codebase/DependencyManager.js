export class DependencyManager {
  constructor(codeStore) {
    this.codeStore = codeStore;
    this.registry = new Map();
  }

  extractImports(code) {
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    const packages = [];
    let match;
    while ((match = importRegex.exec(code)) !== null) {
      const value = match[1];
      if (!value.startsWith('.') && !value.startsWith('/')) {
        packages.push(value);
      }
    }
    return [...new Set(packages)];
  }

  isAvailable(packageName) {
    return this.registry.has(packageName);
  }

  async resolveImports(fileContent) {
    const imports = this.extractImports(fileContent);
    const missing = imports.filter((item) => !this.isAvailable(item));
    if (missing.length === 0) {
      return { installed: [], alreadyAvailable: imports };
    }

    const installed = await this.installPackages(missing);
    return {
      installed,
      alreadyAvailable: imports.filter((item) => !missing.includes(item)),
    };
  }

  async installPackages(packages) {
    const installed = [];
    for (const pkg of packages) {
      const url = `https://unpkg.com/${pkg}/?module`;
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          this.registry.set(pkg, {
            package: pkg,
            url,
            version: 'latest',
            discoveredAt: Date.now(),
          });
          installed.push(pkg);
        }
      } catch {
        // Network failures are tolerated; caller can proceed with unresolved imports.
      }
    }
    return installed;
  }

  getImportMap() {
    const imports = {};
    for (const [pkg, meta] of this.registry.entries()) {
      imports[pkg] = meta.url;
    }
    return { imports };
  }
}
