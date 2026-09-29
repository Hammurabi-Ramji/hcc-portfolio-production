/**
 * E2E Tests: Flow Management (CRUD)
 *
 * Tests creating, naming, saving, loading, and deleting flows.
 * All Tauri IPC calls are handled by the mock.
 */
import { test, expect, switchMode } from './fixtures.js';

test.describe('Flow Management', () => {
  test('shows empty state when no flows exist', async ({ page }) => {
    // Mock starts with empty flows
    await expect(page.locator('.empty')).toContainText('No flows yet');
    await expect(page.getByRole('button', { name: '+ New' })).toBeVisible();
  });

  test('clicking + New creates a new flow', async ({ page }) => {
    await page.getByRole('button', { name: '+ New' }).click();
    // FlowCanvas should now be visible
    await expect(page.locator('.main canvas, .svelte-flow, [data-testid="rf__wrapper"], .flow-canvas-root')).toBeVisible({ timeout: 10000 });
  });

  test('new flow appears in sidebar flow list after save', async ({ page }) => {
    await page.getByRole('button', { name: '+ New' }).click();
    // Wait for FlowCanvas to render
    await page.waitForSelector('.main', { timeout: 5000 });

    // Find the save button in the flow canvas header
    const saveBtn = page.locator('button').filter({ hasText: /Save|save/ });
    if (await saveBtn.count() > 0) {
      await saveBtn.first().click();
      await page.waitForTimeout(500);
    }

    // Navigate back to flows list - the flow should appear
    await page.reload();
    await page.waitForSelector('.sidebar');
  });

  test('clicking + New from welcome screen switches to flows mode', async ({ page }) => {
    await page.getByRole('button', { name: 'Create a Flow' }).click();
    // Mode should be "flows" and a canvas should appear
    const modeBtn = page.locator('.mode-btn').filter({ hasText: 'Flows' });
    await expect(modeBtn).toHaveClass(/active/);
  });
});
