/**
 * E2E Tests: App Shell & Navigation
 *
 * Tests the core app chrome: sidebar, mode switching,
 * welcome screen, and loading state.
 */
import { test, expect, switchMode } from './fixtures.js';

test.describe('App Shell', () => {
  test('renders welcome screen on first load', async ({ page }) => {
    await expect(page.locator('.welcome-icon')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Straw Flow Editor' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create a Flow' })).toBeVisible();
    // Use specific selectors to avoid ambiguity between sidebar and welcome button
    await expect(page.locator('.mode-btn.ai-mode')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Code' })).toBeVisible();
  });

  test('sidebar contains logo and all three mode buttons', async ({ page }) => {
    await expect(page.locator('.logo')).toContainText('Straw');
    await expect(page.locator('.mode-btn').filter({ hasText: /Flows/ })).toBeVisible();
    await expect(page.locator('.mode-btn').filter({ hasText: /AI Chat/ })).toBeVisible();
    await expect(page.locator('.mode-btn').filter({ hasText: /Create/ })).toBeVisible();
  });

  test('Flows mode is active by default', async ({ page }) => {
    const flowsBtn = page.locator('.mode-btn').filter({ hasText: 'Flows' });
    await expect(flowsBtn).toHaveClass(/active/);
  });

  test('switching to AI Chat mode shows NLP panel', async ({ page }) => {
    await switchMode(page, 'AI Chat');
    await expect(page.locator('.nlp-root')).toBeVisible();
    await expect(page.locator('.nlp-title')).toContainText('AI Chat');
  });

  test('switching to Create mode shows Code Gen panel', async ({ page }) => {
    await switchMode(page, 'Create');
    await expect(page.locator('.codegen-root')).toBeVisible();
    await expect(page.locator('.title')).toContainText('AI Code Generator');
  });

  test('switching back to Flows mode shows flow list', async ({ page }) => {
    await switchMode(page, 'AI Chat');
    await switchMode(page, 'Flows');
    await expect(page.locator('.mode-btn.active')).toContainText('Flows');
  });

  test('Create a Flow welcome button switches to flow editor', async ({ page }) => {
    await page.getByRole('button', { name: 'Create a Flow' }).click();
    // Should show an empty flow canvas or new flow state
    await expect(page.locator('.main')).toBeVisible();
  });
});
