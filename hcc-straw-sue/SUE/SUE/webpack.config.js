const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  // Entry: wasm-pack generated JS glue
  entry: './sue-view/pkg/sue_view.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'sue-runtime.js',
    clean: true,
    // REQUIRED: preserve ES module exports so sidebar-init.js can
    // "import init from './sue-view.js'" and get the real default export.
    // Without this webpack wraps everything in an IIFE and strips all exports,
    // causing `init` to be undefined and WASM to never load.
    library: {
      type: 'module',
    },
    // Fix WASM asset name so it matches what chrome.runtime.getURL('sue-view.wasm') resolves.
    // Without this, asyncWebAssembly emits a content-hashed filename that the extension can't find.
    assetModuleFilename: 'sue-runtime.wasm',
  },
  experiments: {
    asyncWebAssembly: true,
    // Required to enable module output format
    outputModule: true,
  },
  optimization: {
    minimize: false, // Keep readable; Terser chokes on content.js edge-case syntax
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: '.' },
        { from: 'sue.html', to: '.' },
        { from: 'extension-api.js', to: '.' },
        { from: 'sidebar-init.js', to: '.' },
        { from: 'sue-debug.html', to: '.' },
        { from: 'sidebar-init-debug.js', to: '.' },
        { from: 'offline.html', to: '.' },
        { from: 'offline-handler.js', to: '.' },
        { from: 'speculation-rules.html', to: '.' }, // Pre-rendering
        { from: 'offscreen.html', to: '.' },
        { from: 'offscreen-worker.js', to: '.' },
        { from: 'offscreen-manager.js', to: '.' },
        { from: 'keepalive-manager.js', to: '.' },
        { from: 'storage-manager.js', to: '.' },
        { from: 'intent-router.js', to: '.' },
        { from: 'tool-registry.js', to: '.' },
        { from: 'suewarm-tool-registry.js', to: '.' },
        { from: 'vector-store.js', to: '.' },
        { from: 'memory-manager.js', to: '.' },
        { from: 'security-manager.js', to: '.' },
        { from: 'ai-agent.js', to: '.' },
        { from: 'suewarm-agent-core.js', to: '.' },
        { from: 'native-bridge.js', to: '.' },
        { from: 'src/swarm', to: 'src/swarm' }, // Swarm Multi-Agent Architecture
        { from: 'view-transitions-manager.js', to: '.' }, // Smooth transitions
        { from: 'view-transitions-enhanced.js', to: '.' }, // Enhanced transitions
        { from: 'popover-manager.js', to: '.' },
        { from: 'popover.css', to: '.' },
        { from: 'opfs-manager.js', to: '.' },
        { from: 'webgpu-manager.js', to: '.' },
        { from: 'web-locks-manager.js', to: '.' },
        { from: 'compression-manager.js', to: '.' },
        { from: 'background-fetch-manager.js', to: '.' },
        { from: 'eyedropper-manager.js', to: '.' },
        { from: 'styles.css', to: '.' },
        { from: 'background.js', to: '.' },
        { from: 'content.js', to: '.' },
        { from: 'content.css', to: '.' },
        { from: 'learn-engine.js', to: '.' },
        { from: 'icons', to: 'icons' },
      ],
    }),
  ],
  stats: {
    all: false,
    errors: true,
    warnings: false,
  },
};
