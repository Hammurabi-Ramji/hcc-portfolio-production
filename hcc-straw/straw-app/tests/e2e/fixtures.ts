import { test as base, expect, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Extended test fixture that:
 * 1. Injects the Tauri IPC mock before every page load
 * 2. Navigates to the app root
 * 3. Waits for the app to be interactive (sidebar visible)
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Inject mock before any script runs on the page
    await page.addInitScript({ path: path.join(__dirname, 'tauri-mock.js') });
    await page.goto('/');
    // Wait for app shell to be ready
    await page.waitForSelector('.sidebar', { timeout: 15000 });
    await use(page);
  },
});

export { expect };

/**
 * Helper: click a sidebar mode button by its visible label text
 */
export async function switchMode(page: Page, label: 'Flows' | 'AI Chat' | 'Create') {
  await page.getByRole('button', { name: label }).first().click();
}

/**
 * Helper: wait for toast notification containing text
 */
export async function waitForToast(page: Page, text: string) {
  await page.locator('.toast').filter({ hasText: text }).waitFor({ timeout: 5000 });
}
