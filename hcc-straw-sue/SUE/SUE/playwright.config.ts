import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * HCC Sovereign Sidebar — Playwright E2E Configuration
 * Tests run against the built extension in dist/
 *
 * Run: pnpm test
 * UI:  pnpm test:ui
 */

const EXTENSION_PATH = path.resolve(__dirname, 'dist');

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  webServer: {
    command: 'node local-api-server.js',
    env: {
      ...process.env,
      SUE_API_ENABLE_TEST_HELPERS: '1',
    },
    url: 'http://127.0.0.1:8080/api/v1/status',
    reuseExistingServer: true,
    timeout: 30_000,
  },

  /* Timeout per test */
  timeout: 30_000,

  /* Fail fast in CI */
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Extensions need a single browser context

  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],

  use: {
    /* Base URL for any page() navigation */
    baseURL: 'https://example.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium-extension',
      use: {
        ...devices['Desktop Chrome'],
        // Load the extension into Chromium
        launchOptions: {
          args: [
            `--disable-extensions-except=${EXTENSION_PATH}`,
            `--load-extension=${EXTENSION_PATH}`,
            '--no-sandbox',
            '--disable-setuid-sandbox',
          ],
          headless: false, // Extensions require headed mode
        },
      },
    },
  ],

  /* Output folder for test artifacts */
  outputDir: 'test-results/',
});
