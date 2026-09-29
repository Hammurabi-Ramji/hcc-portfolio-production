import { test, expect } from '@playwright/test';

// Desktop App UI Tests
test.describe('Desktop App - Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173'); // Vite dev server
  });

  test('should render dashboard with workflows', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('button:has-text("New Workflow")')).toBeVisible();
  });

  test('should display workflow list', async ({ page }) => {
    const workflows = page.locator('[data-testid="workflow-list"]');
    await expect(workflows).toBeVisible();
  });

  test('should create new workflow', async ({ page }) => {
    await page.click('button:has-text("New Workflow")');
    await expect(page.locator('h1')).toContainText('Workflow Editor');
  });

  test('should open workflow template', async ({ page }) => {
    const templateButton = page.locator('[data-testid="template-button"]').first();
    await templateButton.click();
    await expect(page.locator('text=Create from template')).toBeVisible();
  });

  test('should display database statistics', async ({ page }) => {
    const stats = page.locator('[data-testid="db-stats"]');
    await expect(stats).toBeVisible();
    await expect(stats.locator('text=Workflows:')).toBeVisible();
  });
});

test.describe('Desktop App - Workflow Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.click('button:has-text("New Workflow")');
  });

  test('should render workflow canvas', async ({ page }) => {
    const canvas = page.locator('[data-testid="workflow-canvas"]');
    await expect(canvas).toBeVisible();
  });

  test('should add node to canvas', async ({ page }) => {
    // Drag node from palette to canvas
    const nodeType = page.locator('[data-testid="node-type-http"]');
    const canvas = page.locator('[data-testid="workflow-canvas"]');
    
    await nodeType.dragTo(canvas);
    
    const node = page.locator('[data-testid="node-"]').first();
    await expect(node).toBeVisible();
  });

  test('should connect nodes with edges', async ({ page }) => {
    // Add two nodes
    const nodeType = page.locator('[data-testid="node-type-http"]');
    const canvas = page.locator('[data-testid="workflow-canvas"]');
    
    await nodeType.dragTo(canvas);
    await nodeType.dragTo(canvas, { position: { x: 200, y: 200 } });
    
    // Connect them
    const outputHandle = page.locator('[data-testid="handle-output"]').first();
    const inputHandle = page.locator('[data-testid="handle-input"]').nth(1);
    
    await outputHandle.dragTo(inputHandle);
    
    const edge = page.locator('[data-testid="edge-"]').first();
    await expect(edge).toBeVisible();
  });

  test('should save workflow', async ({ page }) => {
    await page.fill('input[placeholder="Workflow name"]', 'Test Workflow');
    await page.click('button:has-text("Save")');
    
    await expect(page.locator('text=Workflow saved')).toBeVisible();
  });

  test('should execute workflow', async ({ page }) => {
    await page.fill('input[placeholder="Workflow name"]', 'Test Workflow');
    await page.click('button:has-text("Execute")');
    
    await expect(page.locator('[data-testid="execution-status"]')).toContainText(/completed|running|failed/);
  });

  test('should delete workflow', async ({ page }) => {
    await page.click('button:has-text("Delete")');
    await page.click('button:has-text("Confirm")');
    
    await expect(page.locator('text=Workflow deleted')).toBeVisible();
  });
});

test.describe('Desktop App - Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.click('button:has-text("Settings")');
  });

  test('should render settings page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Settings');
  });

  test('should update settings', async ({ page }) => {
    await page.fill('input[name="theme"]', 'dark');
    await page.click('button:has-text("Save Settings")');
    
    await expect(page.locator('text=Settings updated')).toBeVisible();
  });
});

test.describe('Desktop App - Error Handling', () => {
  test('should show error boundary on crash', async ({ page }) => {
    await page.goto('http://localhost:5173/invalid-page');
    await expect(page.locator('text=Something went wrong')).toBeVisible();
  });

  test('should display validation errors', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.click('button:has-text("New Workflow")');
    await page.click('button:has-text("Save")'); // Missing name
    
    await expect(page.locator('text=Workflow name is required')).toBeVisible();
  });
});
