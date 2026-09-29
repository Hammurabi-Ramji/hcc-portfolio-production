// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

test.beforeEach(async ({ page }) => {
  await page.addInitScript({ path: path.join(__dirname, 'tauri-mock.js') });
  await page.goto('/');
  await page.waitForSelector('.sidebar', { timeout: 15000 });
});

test.describe('01 - App Shell', () => {

  test('renders welcome screen with all elements', async ({ page }) => {
    await expect(page.locator('.welcome-icon')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Straw Flow Editor' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create a Flow' })).toBeVisible();
    await expect(page.getByRole('button', { name: /AI Chat/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Code/ })).toBeVisible();
  });

  test('sidebar shows logo and three mode buttons', async ({ page }) => {
    await expect(page.locator('.logo')).toContainText('Straw');
    const modeBtns = page.locator('.mode-btn');
    await expect(modeBtns).toHaveCount(3);
  });

  test('Flows mode is active by default', async ({ page }) => {
    const flowsBtn = page.locator('.mode-btn').filter({ hasText: 'Flows' });
    await expect(flowsBtn).toHaveClass(/active/);
  });

  test('switching to AI Chat mode shows NLP panel', async ({ page }) => {
    await page.locator('.mode-btn').filter({ hasText: 'AI Chat' }).click();
    await expect(page.locator('.nlp-root')).toBeVisible();
  });

  test('switching to Create mode shows Code Gen panel', async ({ page }) => {
    await page.locator('.mode-btn').filter({ hasText: 'Create' }).click();
    await expect(page.locator('.codegen-root')).toBeVisible();
  });

  test('switching back to Flows restores Flows mode', async ({ page }) => {
    await page.locator('.mode-btn').filter({ hasText: 'AI Chat' }).click();
    await page.locator('.mode-btn').filter({ hasText: 'Flows' }).click();
    await expect(page.locator('.mode-btn').filter({ hasText: 'Flows' })).toHaveClass(/active/);
  });

  test('Create a Flow button activates flow canvas', async ({ page }) => {
    await page.getByRole('button', { name: 'Create a Flow' }).click();
    // Canvas area should become the main content
    await expect(page.locator('.main')).toBeVisible();
  });

  test('AI Chat button from welcome screen opens NLP panel', async ({ page }) => {
    await page.getByRole('button', { name: /AI Chat/ }).click();
    await expect(page.locator('.nlp-root')).toBeVisible();
  });

  test('Create Code button from welcome screen opens CodeGen', async ({ page }) => {
    await page.getByRole('button', { name: /Create Code/ }).click();
    await expect(page.locator('.codegen-root')).toBeVisible();
  });

});
