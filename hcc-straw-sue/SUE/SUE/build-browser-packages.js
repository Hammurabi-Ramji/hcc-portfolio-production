'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const SOURCE_DIR = path.join(ROOT, 'dist');
const OUTPUT_DIR = path.join(ROOT, 'dist-browsers');
const TARGETS = ['chrome', 'firefox', 'safari'];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function removeDirRecursive(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

function copyRecursive(srcDir, outDir) {
  ensureDir(outDir);
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const outPath = path.join(outDir, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, outPath);
    } else {
      fs.copyFileSync(srcPath, outPath);
    }
  }
}

function writeManifest(target, outDir) {
  const manifestPath = path.join(ROOT, `manifest.${target}.json`);
  const outputManifestPath = path.join(outDir, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing manifest variant: ${manifestPath}`);
  }

  const raw = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(raw);
  fs.writeFileSync(outputManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

function buildTarget(target) {
  const outDir = path.join(OUTPUT_DIR, target);
  removeDirRecursive(outDir);
  copyRecursive(SOURCE_DIR, outDir);
  writeManifest(target, outDir);
  console.log(`Built ${target}: ${outDir}`);
}

function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(
      'dist folder not found. Run "pnpm run package" before building browser targets.'
    );
  }

  removeDirRecursive(OUTPUT_DIR);
  ensureDir(OUTPUT_DIR);

  for (const target of TARGETS) {
    buildTarget(target);
  }

  console.log('Cross-browser extension packages generated successfully.');
}

main();
