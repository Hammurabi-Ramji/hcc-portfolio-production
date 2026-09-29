// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

test.beforeEach(async ({ page }) => {
  await page.addInitScript({ path: path.join(__dirname, 'tauri-mock.js') });
  await page.goto('/');
  await page.waitForSelector('.sidebar', { timeout: 15000 });
});

test.describe('02 - Flow Management', () => {

  test('shows empty state when no flows exist', async ({ page }) => {
    await expect(page.locator('.empty')).toContainText('No flows yet');
  });

  test('+ New button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: '+ New' })).toBeVisible();
  });

  test('clicking + New opens a flow canvas', async ({ page }) => {
    await page.getByRole('button', { name: '+ New' }).click();
    // FlowCanvas uses @xyflow which renders a .svelte-flow container
    await expect(page.locator('.svelte-flow').first()).toBeVisible({ timeout: 10000 });
  });

  test('new flow shows Untitled Flow name in canvas header', async ({ page }) => {
    await page.getByRole('button', { name: '+ New' }).click();
    await page.waitForSelector('.svelte-flow', { timeout: 10000 });
    // Flow name input or heading should say "Untitled Flow"
    const nameEl = page.locator('input').filter({ hasText: '' }).first();
    const header = page.locator('[class*="flow-name"], [placeholder*="flow"], [value*="Untitled"]');
    // Either name input exists or "Untitled" is in the canvas header
    const headerText = await page.locator('.main').innerText();
    expect(headerText.toLowerCase()).toContain('untitled');
  });

  test('Create a Flow welcome button also opens canvas', async ({ page }) => {
    await page.getByRole('button', { name: 'Create a Flow' }).click();
    await expect(page.locator('.svelte-flow').first()).toBeVisible({ timeout: 10000 });
  });

});
