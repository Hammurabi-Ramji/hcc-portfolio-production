// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

test.beforeEach(async ({ page }) => {
  await page.addInitScript({ path: path.join(__dirname, 'tauri-mock.js') });
  await page.goto('/');
  await page.waitForSelector('.sidebar', { timeout: 15000 });
  // Switch to AI Chat mode
  await page.locator('.mode-btn').filter({ hasText: 'AI Chat' }).click();
  await page.waitForSelector('.nlp-root', { timeout: 8000 });
});

test.describe('03 - NLP Chat Panel', () => {

  test('renders header with title and model badge', async ({ page }) => {
    await expect(page.locator('.nlp-title')).toContainText('AI Chat');
    await expect(page.locator('.model-badge')).toBeVisible();
  });

  test('shows empty state initially', async ({ page }) => {
    await expect(page.locator('.empty-state')).toBeVisible();
    await expect(page.locator('.empty-state')).toContainText('Start a conversation');
  });

  test('textarea and send button are present', async ({ page }) => {
    await expect(page.locator('.msg-input')).toBeVisible();
    await expect(page.locator('.send-btn')).toBeVisible();
  });

  test('send button is disabled when input is empty', async ({ page }) => {
    await expect(page.locator('.send-btn')).toBeDisabled();
  });

  test('send button becomes enabled when text is typed', async ({ page }) => {
    await page.locator('.msg-input').fill('Hello AI');
    await expect(page.locator('.send-btn')).toBeEnabled();
    await expect(page.locator('.send-btn')).toHaveClass(/ready/);
  });

  test('sends message and shows user bubble', async ({ page }) => {
    await page.locator('.msg-input').fill('Build a Python script to list files');
    await page.locator('.send-btn').click();
    await expect(page.locator('.message.user').last()).toContainText('Build a Python script');
  });

  test('receives mock AI response', async ({ page }) => {
    await page.locator('.msg-input').fill('Hello');
    await page.locator('.send-btn').click();
    await expect(page.locator('.message.assistant').last()).toContainText('Mock AI response', { timeout: 8000 });
  });

  test('input clears after sending', async ({ page }) => {
    await page.locator('.msg-input').fill('Test message');
    await page.locator('.send-btn').click();
    await expect(page.locator('.msg-input')).toHaveValue('');
  });

  test('Enter key sends message', async ({ page }) => {
    await page.locator('.msg-input').fill('Sent via Enter');
    await page.locator('.msg-input').press('Enter');
    await expect(page.locator('.message.user').last()).toContainText('Sent via Enter');
  });

  test('Shift+Enter does not send (adds newline)', async ({ page }) => {
    await page.locator('.msg-input').fill('Line one');
    await page.locator('.msg-input').press('Shift+Enter');
    const count = await page.locator('.message.user').count();
    expect(count).toBe(0);
  });

  test('settings button toggles settings panel', async ({ page }) => {
    const settingsBtn = page.locator('.hbtn').filter({ hasText: '⚙' });
    await expect(page.locator('.settings-panel')).not.toBeVisible();
    await settingsBtn.click();
    await expect(page.locator('.settings-panel')).toBeVisible();
    await settingsBtn.click();
    await expect(page.locator('.settings-panel')).not.toBeVisible();
  });

  test('settings panel has temperature slider', async ({ page }) => {
    await page.locator('.hbtn').filter({ hasText: '⚙' }).click();
    await expect(page.locator('.settings-panel input[type="range"]')).toBeVisible();
  });

  test('URL button shows URL input popup', async ({ page }) => {
    await page.locator('.tool-btn').first().click();
    await expect(page.locator('.url-popup')).toBeVisible();
    await expect(page.locator('.url-field')).toBeVisible();
  });

  test('URL fetch adds an attachment chip', async ({ page }) => {
    await page.locator('.tool-btn').first().click();
    await page.locator('.url-field').fill('https://example.com');
    await page.locator('.url-go').click();
    await expect(page.locator('.tray-item')).toBeVisible({ timeout: 5000 });
  });

  test('clear button removes all messages', async ({ page }) => {
    await page.locator('.msg-input').fill('First message');
    await page.locator('.send-btn').click();
    await page.locator('.message.user').waitFor({ timeout: 5000 });
    await page.locator('.hbtn').filter({ hasText: '🗑' }).click();
    await expect(page.locator('.empty-state')).toBeVisible();
  });

  test('all four tool buttons are visible', async ({ page }) => {
    const toolBtns = page.locator('.tool-row .tool-btn');
    await expect(toolBtns).toHaveCount(4);
  });

});
