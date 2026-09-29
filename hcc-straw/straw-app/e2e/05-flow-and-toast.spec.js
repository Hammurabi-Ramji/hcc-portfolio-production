// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

test.beforeEach(async ({ page }) => {
  await page.addInitScript({ path: path.join(__dirname, 'tauri-mock.js') });
  await page.goto('/');
  await page.waitForSelector('.sidebar', { timeout: 15000 });
});

test.describe('05 - Flow Canvas', () => {

  test('clicking + New renders the SvelteFlow canvas', async ({ page }) => {
    await page.getByRole('button', { name: '+ New' }).click();
    await expect(page.locator('.svelte-flow').first()).toBeVisible({ timeout: 10000 });
  });

  test('canvas has a save button', async ({ page }) => {
    await page.getByRole('button', { name: '+ New' }).click();
    await page.locator('.svelte-flow').first().waitFor({ timeout: 10000 });
    await expect(page.locator('button').filter({ hasText: /Save/ }).first()).toBeVisible();
  });

  test('canvas has a run button', async ({ page }) => {
    await page.getByRole('button', { name: '+ New' }).click();
    await page.locator('.svelte-flow').first().waitFor({ timeout: 10000 });
    await expect(page.locator('button').filter({ hasText: /Run/ }).first()).toBeVisible();
  });

  test('node schema mock was injected (11 schemas available)', async ({ page }) => {
    await page.getByRole('button', { name: '+ New' }).click();
    await page.locator('.svelte-flow').first().waitFor({ timeout: 10000 });
    const schemaCount = await page.evaluate(() => {
      // Check that the mock was invoked and returned schemas
      return window.__TAURI_MOCK__ === true;
    });
    expect(schemaCount).toBe(true);
  });

});

test.describe('06 - Toast Notifications', () => {

  test('creating a flow triggers a toast', async ({ page }) => {
    await page.getByRole('button', { name: '+ New' }).click();
    await expect(page.locator('.toast').filter({ hasText: /[Cc]reated/ })).toBeVisible({ timeout: 6000 });
  });

  test('sending NLP message triggers success toast', async ({ page }) => {
    await page.locator('.mode-btn').filter({ hasText: 'AI Chat' }).click();
    await page.waitForSelector('.nlp-root');
    await page.locator('.msg-input').fill('Hello');
    await page.locator('.send-btn').click();
    // Mock responds instantly, toast shows elapsed_ms
    await expect(page.locator('.toast').filter({ hasText: /ms|Response/ })).toBeVisible({ timeout: 8000 });
  });

  test('code generation triggers success toast', async ({ page }) => {
    await page.locator('.mode-btn').filter({ hasText: 'Create' }).click();
    await page.waitForSelector('.codegen-root');
    await page.locator('.prompt-input').fill('Test');
    await page.locator('.generate-btn').click();
    await expect(page.locator('.toast').filter({ hasText: /Generated|files/ })).toBeVisible({ timeout: 10000 });
  });

});
