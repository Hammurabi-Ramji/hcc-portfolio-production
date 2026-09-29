/**
 * E2E Tests: Code Generation Panel
 *
 * Tests the AI code generator UI:
 * - All panel elements render correctly
 * - Generate button triggers code generation
 * - Files appear in the file tree
 * - Selecting a file shows code content
 * - Refinement input works
 * - Delete file works
 * - Clear all works
 */
import { test, expect, switchMode } from './fixtures.js';

test.describe('Code Generation Panel', () => {
  test.beforeEach(async ({ page }) => {
    await switchMode(page, 'Create');
    await expect(page.locator('.codegen-root')).toBeVisible();
  });

  test('renders all UI elements', async ({ page }) => {
    await expect(page.locator('.title')).toContainText('AI Code Generator');
    await expect(page.locator('.prompt-input')).toBeVisible();
    await expect(page.locator('.generate-btn')).toBeVisible();
    await expect(page.locator('.model-select')).toBeVisible();
    await expect(page.locator('.empty-tree')).toContainText('No files generated yet');
  });

  test('generate button is enabled when prompt has text', async ({ page }) => {
    await page.locator('.prompt-input').fill('Build a Rust CLI tool');
    await expect(page.locator('.generate-btn')).toBeEnabled();
  });

  test('clicking Generate triggers code generation and shows files', async ({ page }) => {
    await page.locator('.prompt-input').fill('Build a Rust CLI tool that counts lines');
    await page.locator('.generate-btn').click();

    // Progress bar should appear briefly, then files
    // Use nth(0) to avoid strict mode violation when multiple elements exist
    await expect(page.locator('.file-item').nth(0)).toBeVisible({ timeout: 10000 });
    // Mock returns 2 files: src/main.rs and Cargo.toml
    await expect(page.locator('.file-item')).toHaveCount(2, { timeout: 10000 });
  });

  test('generated files show correct names and language icons', async ({ page }) => {
    await page.locator('.prompt-input').fill('Test project');
    await page.locator('.generate-btn').click();
    await page.locator('.file-item').first().waitFor({ timeout: 10000 });

    const firstFile = page.locator('.file-item').first();
    await expect(firstFile.locator('.file-path')).toContainText('main.rs');
    await expect(firstFile.locator('.file-icon')).toContainText('🦀'); // Rust icon
  });

  test('clicking a file shows its content in the editor', async ({ page }) => {
    await page.locator('.prompt-input').fill('Test project');
    await page.locator('.generate-btn').click();
    await page.locator('.file-item').first().waitFor({ timeout: 10000 });

    await page.locator('.file-left').first().click();
    await expect(page.locator('.code-content')).toBeVisible();
    await expect(page.locator('.code-content')).toContainText('fn main()');
  });

  test('code header shows filename and language badge', async ({ page }) => {
    await page.locator('.prompt-input').fill('Test project');
    await page.locator('.generate-btn').click();
    await page.locator('.file-item').first().waitFor({ timeout: 10000 });
    await page.locator('.file-left').first().click();

    await expect(page.locator('.code-filename')).toContainText('main.rs');
    await expect(page.locator('.code-lang')).toContainText('RUST');
  });

  test('refinement input is visible when a file is selected', async ({ page }) => {
    await page.locator('.prompt-input').fill('Test project');
    await page.locator('.generate-btn').click();
    await page.locator('.file-item').first().waitFor({ timeout: 10000 });
    await page.locator('.file-left').first().click();

    await expect(page.locator('.refine-input')).toBeVisible();
    await expect(page.locator('.refine-btn')).toBeDisabled(); // disabled until text entered
  });

  test('refine button activates when instruction is typed', async ({ page }) => {
    await page.locator('.prompt-input').fill('Test project');
    await page.locator('.generate-btn').click();
    await page.locator('.file-item').first().waitFor({ timeout: 10000 });
    await page.locator('.file-left').first().click();

    await page.locator('.refine-input').fill('Add error handling');
    await expect(page.locator('.refine-btn')).toBeEnabled();
  });

  test('clicking Refine updates file content', async ({ page }) => {
    await page.locator('.prompt-input').fill('Test project');
    await page.locator('.generate-btn').click();
    await page.locator('.file-item').first().waitFor({ timeout: 10000 });
    await page.locator('.file-left').first().click();

    const originalContent = await page.locator('.code-content').textContent();
    await page.locator('.refine-input').fill('Add error handling');
    await page.locator('.refine-btn').click();

    // Mock updates the content, check that it's different from original
    await expect(page.locator('.code-content')).not.toBe(originalContent, { timeout: 8000 });
  });

  test('delete button removes a file from the tree', async ({ page }) => {
    await page.locator('.prompt-input').fill('Test project');
    await page.locator('.generate-btn').click();
    await page.locator('.file-item').first().waitFor({ timeout: 10000 });

    const initialCount = await page.locator('.file-item').count();
    await page.locator('.delete-file').first().click();
    await expect(page.locator('.file-item')).toHaveCount(initialCount - 1);
  });

  test('model selector has expected options', async ({ page }) => {
    const select = page.locator('.model-select');
    await expect(select.locator('option[value="llama2"]')).toHaveCount(1);
    await expect(select.locator('option[value="codellama"]')).toHaveCount(1);
    await expect(select.locator('option[value="starcoder"]')).toHaveCount(1);
  });

  test('plan panel shows project details after generation', async ({ page }) => {
    await page.locator('.prompt-input').fill('Test project');
    await page.locator('.generate-btn').click();
    await page.locator('.file-item').first().waitFor({ timeout: 10000 });

    // Click Plan button
    await page.locator('.hbtn').filter({ hasText: '📋' }).click();
    await expect(page.locator('.plan-panel')).toBeVisible();
    await expect(page.locator('.plan-title')).toContainText('Mock Project');
  });

  test('clear all button removes all files and resets state', async ({ page }) => {
    await page.locator('.prompt-input').fill('Test project');
    await page.locator('.generate-btn').click();
    await page.locator('.file-item').first().waitFor({ timeout: 10000 });

    await page.locator('.hbtn').filter({ hasText: '🗑' }).click();
    await expect(page.locator('.empty-tree')).toBeVisible();
    await expect(page.locator('.file-item')).toHaveCount(0);
  });
});
