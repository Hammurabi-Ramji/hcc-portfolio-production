// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

test.beforeEach(async ({ page }) => {
  await page.addInitScript({ path: path.join(__dirname, 'tauri-mock.js') });
  await page.goto('/');
  await page.waitForSelector('.sidebar', { timeout: 15000 });
  await page.locator('.mode-btn').filter({ hasText: 'Create' }).click();
  await page.waitForSelector('.codegen-root', { timeout: 8000 });
});

test.describe('04 - Code Generation Panel', () => {

  test('renders header with title', async ({ page }) => {
    await expect(page.locator('.title')).toContainText('AI Code Generator');
  });

  test('prompt textarea is visible', async ({ page }) => {
    await expect(page.locator('.prompt-input')).toBeVisible();
  });

  test('generate button is visible', async ({ page }) => {
    await expect(page.locator('.generate-btn')).toBeVisible();
  });

  test('model selector has llama2, codellama, starcoder', async ({ page }) => {
    const sel = page.locator('.model-select');
    await expect(sel.locator('option[value="llama2"]')).toHaveCount(1);
    await expect(sel.locator('option[value="codellama"]')).toHaveCount(1);
    await expect(sel.locator('option[value="starcoder"]')).toHaveCount(1);
  });

  test('empty state is shown before generation', async ({ page }) => {
    await expect(page.locator('.empty-tree')).toContainText('No files generated yet');
  });

  test('generate triggers and shows 2 mock files', async ({ page }) => {
    await page.locator('.prompt-input').fill('Build a Rust CLI tool');
    await page.locator('.generate-btn').click();
    await expect(page.locator('.file-item')).toHaveCount(2, { timeout: 10000 });
  });

  test('first file shows main.rs with Rust icon', async ({ page }) => {
    await page.locator('.prompt-input').fill('Test');
    await page.locator('.generate-btn').click();
    await page.locator('.file-item').first().waitFor({ timeout: 10000 });
    await expect(page.locator('.file-item').first().locator('.file-path')).toContainText('main.rs');
    await expect(page.locator('.file-item').first().locator('.file-icon')).toContainText('🦀');
  });

  test('clicking file button shows code content', async ({ page }) => {
    await page.locator('.prompt-input').fill('Test');
    await page.locator('.generate-btn').click();
    await page.locator('.file-left').first().waitFor({ timeout: 10000 });
    await page.locator('.file-left').first().click();
    await expect(page.locator('.code-content')).toBeVisible();
    await expect(page.locator('.code-content')).toContainText('fn main()');
  });

  test('code header shows filename and RUST badge', async ({ page }) => {
    await page.locator('.prompt-input').fill('Test');
    await page.locator('.generate-btn').click();
    await page.locator('.file-left').first().waitFor({ timeout: 10000 });
    await page.locator('.file-left').first().click();
    await expect(page.locator('.code-filename')).toContainText('main.rs');
    await expect(page.locator('.code-lang')).toContainText('RUST');
  });

  test('refine input is disabled until text is entered', async ({ page }) => {
    await page.locator('.prompt-input').fill('Test');
    await page.locator('.generate-btn').click();
    await page.locator('.file-left').first().waitFor({ timeout: 10000 });
    await page.locator('.file-left').first().click();
    await expect(page.locator('.refine-btn')).toBeDisabled();
    await page.locator('.refine-input').fill('Add error handling');
    await expect(page.locator('.refine-btn')).toBeEnabled();
  });

  test('clicking Refine updates file content to mock refined content', async ({ page }) => {
    await page.locator('.prompt-input').fill('Test');
    await page.locator('.generate-btn').click();
    await page.locator('.file-left').first().waitFor({ timeout: 10000 });
    await page.locator('.file-left').first().click();
    await page.locator('.refine-input').fill('Add error handling');
    await page.locator('.refine-btn').click();
    await expect(page.locator('.code-content')).toContainText('Refined', { timeout: 8000 });
  });

  test('delete removes one file from tree', async ({ page }) => {
    await page.locator('.prompt-input').fill('Test');
    await page.locator('.generate-btn').click();
    await page.locator('.file-item').first().waitFor({ timeout: 10000 });
    await page.locator('.delete-file').first().click();
    await expect(page.locator('.file-item')).toHaveCount(1);
  });

  test('plan button shows plan panel with project title', async ({ page }) => {
    await page.locator('.prompt-input').fill('Test');
    await page.locator('.generate-btn').click();
    await page.locator('.file-item').first().waitFor({ timeout: 10000 });
    await page.locator('.hbtn').filter({ hasText: /Plan|📋/ }).click();
    await expect(page.locator('.plan-panel')).toBeVisible();
    await expect(page.locator('.plan-title')).toContainText('Mock Project');
  });

  test('clear all removes all files', async ({ page }) => {
    await page.locator('.prompt-input').fill('Test');
    await page.locator('.generate-btn').click();
    await page.locator('.file-item').first().waitFor({ timeout: 10000 });
    await page.locator('.hbtn').filter({ hasText: '🗑' }).click();
    await expect(page.locator('.file-item')).toHaveCount(0);
    await expect(page.locator('.empty-tree')).toBeVisible();
  });

});
