/**
 * E2E Tests: Toast Notification System
 */
import { test, expect, switchMode } from './fixtures.js';

test.describe('Toast Notifications', () => {
  test('toast appears after creating a new flow', async ({ page }) => {
    await page.getByRole('button', { name: '+ New' }).click();
    // Use specific class selector to get first toast
    await expect(page.locator('.toast-container').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.toast-container').first().filter({ hasText: /[Cc]reated/ }))
      .toBeVisible({ timeout: 5000 });
  });

  test('toast appears after sending NLP message', async ({ page }) => {
    await switchMode(page, 'AI Chat');
    await page.locator('.msg-input').fill('Hello');
    await page.locator('.send-btn').click();
    // Mock responds in ~0ms, toast should appear
    await expect(page.locator('.toast-container').first().filter({ hasText: /ms/ }))
      .toBeVisible({ timeout: 8000 });
  });

  test('toast appears after generating code', async ({ page }) => {
    await switchMode(page, 'Create');
    await page.locator('.prompt-input').fill('Test');
    await page.locator('.generate-btn').click();
    await expect(page.locator('.toast-container').first().filter({ hasText: /Generated|files/ }))
      .toBeVisible({ timeout: 10000 });
  });
});
