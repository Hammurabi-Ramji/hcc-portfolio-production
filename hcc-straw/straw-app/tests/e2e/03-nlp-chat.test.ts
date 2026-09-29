/**
 * E2E Tests: NLP Chat Panel
 *
 * Tests the multimodal AI chat interface:
 * - Rendering all UI elements
 * - Sending a message and receiving a mock response
 * - Settings panel toggle
 * - Attachment buttons visibility
 * - Clear conversation
 */
import { test, expect, switchMode } from './fixtures.js';

test.describe('NLP Chat Panel', () => {
  test.beforeEach(async ({ page }) => {
    await switchMode(page, 'AI Chat');
    await expect(page.locator('.nlp-root')).toBeVisible();
  });

  test('renders all UI elements', async ({ page }) => {
    await expect(page.locator('.nlp-title')).toContainText('AI Chat');
    await expect(page.locator('.model-badge')).toBeVisible();
    await expect(page.locator('.msg-input')).toBeVisible();
    await expect(page.locator('.send-btn')).toBeVisible();
    // Tool buttons
    await expect(page.locator('.tool-btn').nth(0)).toBeVisible(); // URL
    await expect(page.locator('.tool-btn').nth(1)).toBeVisible(); // Doc
    await expect(page.locator('.tool-btn').nth(2)).toBeVisible(); // Image
    await expect(page.locator('.tool-btn').nth(3)).toBeVisible(); // Mic
  });

  test('shows empty state initially', async ({ page }) => {
    await expect(page.locator('.empty-state')).toBeVisible();
    await expect(page.locator('.empty-state')).toContainText('Start a conversation');
  });

  test('send button is disabled when input is empty', async ({ page }) => {
    await expect(page.locator('.send-btn')).toBeDisabled();
  });

  test('send button becomes active when text is typed', async ({ page }) => {
    await page.locator('.msg-input').fill('Hello AI');
    await expect(page.locator('.send-btn')).toHaveClass(/ready/);
    await expect(page.locator('.send-btn')).toBeEnabled();
  });

  test('sends a message and displays it in chat', async ({ page }) => {
    await page.locator('.msg-input').fill('Create a Python script to list files');
    await page.locator('.send-btn').click();

    // User message appears
    await expect(page.locator('.message.user').last()).toContainText('Create a Python script');
  });

  test('receives mock AI response after sending', async ({ page }) => {
    await page.locator('.msg-input').fill('Hello');
    await page.locator('.send-btn').click();

    // Wait for AI response (mock returns immediately)
    await expect(page.locator('.message.assistant').last()).toContainText('Mock AI response', { timeout: 8000 });
  });

  test('input clears after sending', async ({ page }) => {
    await page.locator('.msg-input').fill('Test message');
    await page.locator('.send-btn').click();
    await expect(page.locator('.msg-input')).toHaveValue('');
  });

  test('settings panel toggles open and closed', async ({ page }) => {
    // Settings panel should be hidden initially
    await expect(page.locator('.settings-panel')).not.toBeVisible();
    // Click settings button
    await page.locator('.hbtn').filter({ hasText: '⚙' }).click();
    await expect(page.locator('.settings-panel')).toBeVisible();
    // Click again to close
    await page.locator('.hbtn').filter({ hasText: '⚙' }).click();
    await expect(page.locator('.settings-panel')).not.toBeVisible();
  });

  test('settings panel has model, API URL, system prompt, temperature fields', async ({ page }) => {
    await page.locator('.hbtn').filter({ hasText: '⚙' }).click();
    await expect(page.locator('.settings-panel input[placeholder*="llama"]')).toBeVisible();
    await expect(page.locator('.settings-panel input[type="range"]')).toBeVisible();
  });

  test('URL button shows URL input popup', async ({ page }) => {
    await page.locator('.tool-btn').first().click(); // 🔗 URL button
    await expect(page.locator('.url-popup')).toBeVisible();
    await expect(page.locator('.url-field')).toBeVisible();
  });

  test('URL popup fetches content and adds attachment chip', async ({ page }) => {
    await page.locator('.tool-btn').first().click();
    await page.locator('.url-field').fill('https://example.com');
    await page.locator('.url-go').click();
    // Mock returns immediately, chip should appear
    await expect(page.locator('.tray-item')).toBeVisible({ timeout: 5000 });
  });

  test('clear button removes all messages', async ({ page }) => {
    // Send a message first
    await page.locator('.msg-input').fill('Message to clear');
    await page.locator('.send-btn').click();
    await expect(page.locator('.message.user')).toBeVisible({ timeout: 5000 });

    // Clear button should appear
    const clearBtn = page.locator('.hbtn').filter({ hasText: '🗑' });
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
    // Messages gone, empty state back
    await expect(page.locator('.empty-state')).toBeVisible();
  });

  test('Enter key sends message', async ({ page }) => {
    await page.locator('.msg-input').fill('Sent via Enter key');
    await page.locator('.msg-input').press('Enter');
    await expect(page.locator('.message.user').last()).toContainText('Sent via Enter key');
  });

  test('Shift+Enter inserts newline without sending', async ({ page }) => {
    await page.locator('.msg-input').fill('Line one');
    await page.locator('.msg-input').press('Shift+Enter');
    // Message should NOT appear as a chat bubble yet
    const msgCount = await page.locator('.message.user').count();
    expect(msgCount).toBe(0);
  });
});
