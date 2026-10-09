/**
 * web-ext configuration for HCC Sovereign Sidebar
 * Run with: pnpm dev:ext
 *
 * This hot-reloads the extension in a Chromium instance whenever
 * dist/ changes — use alongside `pnpm bundle -- --watch` for live dev.
 */

export default {
  sourceDir: './dist',
  artifactsDir: './web-ext-artifacts',

  run: {
    target: ['chromium'],
    startUrl: ['about:newtab'],
    browserConsole: true,
    watchFiles: ['dist/**/*.js', 'dist/**/*.css', 'dist/manifest.json'],
  },

  build: {
    overwriteDest: true,
    ignoreFiles: [
      '*.map',
      'playwright-report/**',
      'test-results/**',
      'tests/**',
      'node_modules/**',
      'target/**',
      'sue-view/target/**',
    ],
  },

  lint: {
    warningsAsErrors: false,
    // Suppress known false-positive for MV3 side_panel
    selfHosted: false,
  },
};

