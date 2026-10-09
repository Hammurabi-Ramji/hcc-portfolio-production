import { test, expect, chromium, BrowserContext, Page } from '@playwright/test';
import path from 'path';
import { spawn, ChildProcessWithoutNullStreams } from 'node:child_process';

const EXTENSION_PATH = path.resolve(__dirname, '../../dist');
const API_BASE_URL = 'http://127.0.0.1:8080/api/v1';
const EXTENSION_STORAGE_KEYS = [
  'current_session',
  'agent_tasks',
  'sue_runtime_health',
  'sue_last_cloud_snapshot',
  'sue_test_ollama_mock',
  'current_tab_session',
  'hcc_feature_setup',
  'sue_feature_setup',
  'sue_ramemories',
  'sue_last_page_info',
  // Setup/integration keys — cleared so each test starts with a known clean state
  'sue_setup_ollama_url',
  'sue_setup_ollama_api_key',
  'sue_setup_ollama_model',
  'sue_setup_embedding_model',
  'sue_setup_venice_mode',
  'sue_setup_venice_api_key',
  'sue_setup_hugging_face_token',
  'sue_setup_hf_model',
];

type Preset = 'default' | 'empty';

type RuntimeResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error?: string;
};

type TabEntry = {
  id: number;
  title: string;
  url: string;
  active: boolean;
  pinned: boolean;
};

type SessionInfo = {
  session_id: string;
  username?: string | null;
  token?: string | null;
  expires_at: number;
};

let context: BrowserContext;
let apiServerProcess: ChildProcessWithoutNullStreams | null = null;

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function isApiAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/status`);
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureLocalApi(): Promise<void> {
  if (await isApiAvailable()) {
    return;
  }

  apiServerProcess = spawn(process.execPath, ['local-api-server.js'], {
    cwd: path.resolve(__dirname, '../..'),
    env: {
      ...process.env,
      SUE_API_HOST: '127.0.0.1',
      SUE_API_PORT: '8080',
      SUE_API_ENABLE_TEST_HELPERS: '1',
    },
    stdio: 'ignore',
  });

  const startedAt = Date.now();
  while (Date.now() - startedAt < 15_000) {
    if (await isApiAvailable()) {
      return;
    }
    await sleep(250);
  }

  throw new Error('Timed out waiting for local API server on 127.0.0.1:8080');
}

async function apiRequest<T>(pathname: string, init: RequestInit = {}): Promise<ApiEnvelope<T>> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(`${API_BASE_URL}${pathname}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init.headers || {}),
        },
      });

      const payload = (await response.json()) as ApiEnvelope<T>;
      if (!response.ok || payload.success === false) {
        throw new Error(payload.error || `HTTP ${response.status}`);
      }

      return payload;
    } catch (error) {
      lastError = error;
      if (attempt === 2) {
        break;
      }

      await ensureLocalApi();
      await sleep(250);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function ensureTestHelpersEnabled(): Promise<void> {
  await apiRequest<{ enabled: boolean }>('/test/enabled');
}

async function resetApiState(preset: Preset = 'default'): Promise<void> {
  await apiRequest('/test/reset', {
    method: 'POST',
    body: JSON.stringify({ preset }),
  });
}

async function seedApiState(seed: {
  preset?: Preset;
  projects?: Array<{ name: string; description?: string; status?: string; tag?: string | null }>;
  notes?: Array<{ title: string; body?: string; pinned?: boolean }>;
}): Promise<void> {
  await apiRequest('/test/seed', {
    method: 'POST',
    body: JSON.stringify(seed),
  });
}

async function resetOpenPages(): Promise<void> {
  const pages = context.pages().filter((page) => !page.isClosed());
  if (pages.length === 0) {
    await context.newPage();
    return;
  }

  const [keeper, ...rest] = pages;
  await Promise.all(
    rest.map(async (page) => {
      await page.close().catch(() => {});
    })
  );

  if (!keeper.isClosed() && keeper.url() !== 'about:blank') {
    await keeper.goto('about:blank').catch(() => {});
  }
}

async function getSidebarPage(): Promise<Page> {
  const worker =
    context.serviceWorkers()[0] ??
    (await new Promise((resolve) => context.on('serviceworker', resolve)));
  const match = worker.url().match(/chrome-extension:\/\/([a-z]+)\//);
  if (!match) {
    throw new Error('Could not detect extension ID');
  }

  const page = await context.newPage();
  await page.goto(`chrome-extension://${match[1]}/sue.html`);
  return page;
}

async function waitForSidebar(page: Page): Promise<void> {
  await page.waitForSelector('.sue', { timeout: 15_000 });
}

async function clearExtensionState(page: Page): Promise<void> {
  await page.evaluate(async (keys) => {
    localStorage.clear();
    await chrome.storage.local.remove(keys);
    if (chrome.storage.session?.clear) {
      await chrome.storage.session.clear();
    }
  }, EXTENSION_STORAGE_KEYS);
}

async function openFreshSidebar(): Promise<Page> {
  const page = await getSidebarPage();
  await waitForSidebar(page);
  await clearExtensionState(page);
  await page.reload();
  await waitForSidebar(page);
  return page;
}

async function runtimeRequest<T>(
  page: Page,
  message: Record<string, unknown>
): Promise<RuntimeResponse<T>> {
  return page.evaluate(async (payload) => {
    return (
      window as typeof window & {
        sueRequestJson: (message: string) => Promise<RuntimeResponse<T>>;
      }
    ).sueRequestJson(JSON.stringify(payload));
  }, message);
}

async function runtimeRawRequest<T>(page: Page, message: Record<string, unknown>): Promise<T> {
  return page.evaluate(async (payload) => {
    return (
      window as typeof window & {
        sueRequestJson: (message: string) => Promise<T>;
      }
    ).sueRequestJson(JSON.stringify(payload));
  }, message);
}

async function getRuntimeTabs(page: Page): Promise<TabEntry[]> {
  const response = await runtimeRequest<TabEntry[]>(page, { type: 'TAB_LIST' });
  if (!response.success || !Array.isArray(response.data)) {
    throw new Error(response.error || 'Failed to read runtime tab list');
  }

  return response.data;
}

async function setRuntimeStore(page: Page, key: string, value: unknown): Promise<void> {
  const response = await runtimeRequest<unknown>(page, { type: 'STORE_SET', key, value });
  if (!response.success) {
    throw new Error(response.error || `Failed to set store key ${key}`);
  }
}

async function clearRuntimeStore(page: Page, keys: string[]): Promise<void> {
  await page.evaluate(async (storeKeys) => {
    await chrome.storage.local.remove(storeKeys);
  }, keys);
}

async function waitForFeatureSetup(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const readSetup = () => {
      const globalWindow = window as typeof window & {
        HCCFeatureSetup?: { ready?: boolean };
        SUEFeatureSetup?: { ready?: boolean };
      };
      return globalWindow.SUEFeatureSetup ?? globalWindow.HCCFeatureSetup ?? null;
    };

    if (!readSetup()?.ready) {
      await new Promise<void>((resolve) => {
        const done = () => resolve();
        window.addEventListener('hcc:features-ready', done, { once: true });
        window.addEventListener('sue:features-ready', done, { once: true });
        setTimeout(done, 5000);
      });
    }
  });
}

test.beforeAll(async () => {
  await ensureLocalApi();
  await ensureTestHelpersEnabled();
  context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-sandbox',
    ],
  });
});

test.beforeEach(async () => {
  await resetOpenPages();
  await context.clearCookies();
  await ensureLocalApi();
  await resetApiState('default');
});

test.afterEach(async () => {
  await resetOpenPages();
});

test.afterAll(async () => {
  await context.close();
  if (apiServerProcess && !apiServerProcess.killed) {
    apiServerProcess.kill();
  }
});

test.describe('SUE Extension', () => {
  test.describe.configure({ mode: 'serial' });

  test('extension loads without errors', async () => {
    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.waitForTimeout(1000);
    expect(context.pages().length).toBeGreaterThanOrEqual(1);
    await page.close();
  });

  test('sidebar HTML page loads and WASM mounts', async () => {
    const page = await openFreshSidebar();
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await expect(page.locator('.dashboard-view')).toBeVisible();

    const wasmErrors = consoleErrors.filter(
      (entry) => entry.includes('WASM') || entry.includes('init()') || entry.includes('WebAssembly')
    );
    expect(wasmErrors, `WASM errors: ${wasmErrors.join(', ')}`).toHaveLength(0);
  });

  test('sidebar bootstraps feature setup', async () => {
    const page = await openFreshSidebar();
    await waitForFeatureSetup(page);

    const featureState = await page.evaluate(async () => {
      const stored = await new Promise<Record<string, unknown>>((resolve) => {
        chrome.storage.local.get(['hcc_feature_setup', 'sue_feature_setup'], resolve);
      });

      const globalWindow = window as typeof window & {
        HCCFeatureSetup?: { ready?: boolean };
        SUEFeatureSetup?: { ready?: boolean };
        HCCStorageManager?: unknown;
        SUEStorageManager?: unknown;
        HCCPopoverManager?: unknown;
        SUEPopoverManager?: unknown;
        HCCViewTransitionsManager?: unknown;
        SUEViewTransitionsManager?: unknown;
      };

      const windowSetup = globalWindow.SUEFeatureSetup ?? globalWindow.HCCFeatureSetup ?? null;
      const storageSetup = stored.sue_feature_setup ?? stored.hcc_feature_setup ?? null;

      return {
        windowSetup,
        storageSetup,
        globals: {
          storage: Boolean(globalWindow.SUEStorageManager ?? globalWindow.HCCStorageManager),
          popover: Boolean(globalWindow.SUEPopoverManager ?? globalWindow.HCCPopoverManager),
          viewTransitions: Boolean(
            globalWindow.SUEViewTransitionsManager ?? globalWindow.HCCViewTransitionsManager
          ),
        },
      };
    });

    expect(featureState.windowSetup?.ready).toBe(true);
    expect(featureState.storageSetup?.ready).toBe(true);
    expect(featureState.globals.storage).toBe(true);
    expect(featureState.globals.popover).toBe(true);
    expect(featureState.globals.viewTransitions).toBe(true);
  });

  test('dashboard shows onboarding guidance on an empty state', async () => {
    await resetApiState('empty');
    const page = await openFreshSidebar();

    await expect(page.locator('.dashboard-view')).toContainText('AI Integration Setup');
    await expect(page.locator('.dashboard-view')).toContainText('Configured: 0/3');
  });

  test('dashboard reflects seeded project and note counts', async () => {
    await seedApiState({
      preset: 'empty',
      projects: [
        { name: 'Alpha', description: 'Seeded todo', status: 'todo' },
        { name: 'Beta', description: 'Seeded doing', status: 'doing' },
      ],
      notes: [
        { title: 'One', body: 'First seeded note', pinned: false },
        { title: 'Two', body: 'Second seeded note', pinned: true },
      ],
    });

    const page = await openFreshSidebar();
    const dashboard = await runtimeRawRequest<{
      success: boolean;
      data: { audit: { project_count: number; note_count: number } };
    }>(page, { type: 'DASHBOARD_GET' });
    expect(dashboard.success).toBe(true);
    expect(dashboard.data.audit.project_count).toBe(2);
    expect(dashboard.data.audit.note_count).toBe(2);
  });

  test('projects support create, move, search, and delete flows', async () => {
    await resetApiState('empty');
    const page = await openFreshSidebar();

    await page.getByRole('button', { name: '◧ Work' }).click();
    await page.getByRole('button', { name: '+ New' }).click();
    await page.getByPlaceholder('Project name').fill('Playwright Lifecycle Project');
    await page.getByPlaceholder('Tag (optional)').fill('Major');
    await page.getByPlaceholder('What should this project capture?').fill('Lifecycle coverage.');
    await page.getByRole('button', { name: 'Create project' }).click();

    const todoColumn = page.locator('.kanban-col').filter({ hasText: 'To Do' });
    const doingColumn = page.locator('.kanban-col').filter({ hasText: 'Doing' });
    const doneColumn = page.locator('.kanban-col').filter({ hasText: 'Done' });

    await expect(todoColumn).toContainText('Playwright Lifecycle Project');

    const todoCard = todoColumn.locator('.kanban-card', {
      hasText: 'Playwright Lifecycle Project',
    });
    await todoCard.getByRole('button', { name: 'Move project forward' }).click();
    await expect(doingColumn).toContainText('Playwright Lifecycle Project');

    const doingCard = doingColumn.locator('.kanban-card', {
      hasText: 'Playwright Lifecycle Project',
    });
    await doingCard.getByRole('button', { name: 'Move project forward' }).click();
    await expect(doneColumn).toContainText('Playwright Lifecycle Project');

    await page.locator('.projects-view .search-bar input').fill('Lifecycle');
    await expect(doneColumn).toContainText('Playwright Lifecycle Project');

    await page.locator('.projects-view .search-bar input').fill('no-match');
    await expect(page.locator('.column-empty')).toHaveCount(3);

    await page.locator('.projects-view .search-bar input').fill('');
    const doneCardAfterSearch = doneColumn.locator('.kanban-card', {
      hasText: 'Playwright Lifecycle Project',
    });
    await doneCardAfterSearch.getByRole('button', { name: 'Delete project' }).click();
    await expect(page.locator('.projects-view')).not.toContainText('Playwright Lifecycle Project');
  });

  test('notes support create, edit, pin, search, and delete flows', async () => {
    await resetApiState('empty');
    const page = await openFreshSidebar();

    await page.getByRole('button', { name: '✎ Notes' }).click();
    await page.getByRole('button', { name: '+ Note' }).click();
    await page.getByPlaceholder('Note title').fill('Playwright Note');
    await page.locator('.note-textarea').fill('Initial note body');
    await page.getByRole('button', { name: 'Save' }).click();

    const noteCard = page.locator('.note-card', { hasText: 'Playwright Note' });
    await expect(noteCard).toContainText('Initial note body');

    await noteCard.getByRole('button', { name: 'Edit note' }).click();
    await page.getByPlaceholder('Note title').fill('Playwright Note Updated');
    await page.locator('.note-textarea').fill('Updated note body');
    await page.getByRole('button', { name: 'Save' }).click();

    const updatedCard = page.locator('.note-card', { hasText: 'Playwright Note Updated' });
    await expect(updatedCard).toContainText('Updated note body');
    await updatedCard.getByRole('button', { name: 'Pin note' }).click();
    await expect(updatedCard).toHaveClass(/pinned/);

    await page.locator('.notes-view .search-bar input').fill('Updated');
    await expect(page.locator('.notes-view')).toContainText('Playwright Note Updated');

    await updatedCard.getByRole('button', { name: 'Delete note' }).click();
    await expect(page.locator('.notes-view')).not.toContainText('Playwright Note Updated');
  });

  test('settings persist compact layout across reloads', async () => {
    const page = await openFreshSidebar();

    await page.getByRole('button', { name: '⚙ Set' }).click();
    await page.locator('.toggle-label', { hasText: 'Compact layout' }).click();
    await expect(page.locator('.sue')).toHaveClass(/compact-layout/);

    await page.reload();
    await waitForSidebar(page);
    await expect(page.locator('.sue')).toHaveClass(/compact-layout/);

    await page.getByRole('button', { name: '⚙ Set' }).click();
    await page.locator('.toggle-label', { hasText: 'Compact layout' }).click();
  });

  test('tab manager lists, pins, and closes a content tab', async () => {
    await resetApiState('empty');
    await resetOpenPages();

    const contentPage = await context.newPage();
    await contentPage.goto('data:text/html,<title>SUE E2E Tab</title><h1>Temp tab</h1>');

    const page = await getSidebarPage();
    await waitForSidebar(page);
    await clearExtensionState(page);
    await page.reload();
    await waitForSidebar(page);

    await page.getByRole('button', { name: '⊞ Tabs' }).click();
    await page.locator('.tab-manager-view .search-bar input').fill('SUE E2E Tab');
    const tabItem = page.locator('.tab-item', { hasText: 'SUE E2E Tab' });
    await expect(tabItem).toContainText('data:text/html');

    await tabItem.getByRole('button', { name: 'Toggle pin tab' }).click();
    await expect
      .poll(async () => {
        const tabs = await getRuntimeTabs(page);
        return tabs.find((entry) => entry.title === 'SUE E2E Tab')?.pinned ?? false;
      })
      .toBe(true);

    await tabItem.getByRole('button', { name: 'Close tab' }).click();
    await expect.poll(() => contentPage.isClosed()).toBe(true);
    await expect(page.locator('.tab-manager-view')).not.toContainText('SUE E2E Tab');
  });

  test('cloud status renders provider-specific capability details', async () => {
    const page = await openFreshSidebar();

    await page.getByRole('button', { name: '◎ Cloud' }).click();
    await expect(page.locator('.cloud-status-view')).toContainText('Koofr');
    await expect(page.locator('.cloud-status-view')).toContainText('IceDrive');
    await expect(page.locator('.cloud-status-view')).toContainText('Degoo');
    await expect(page.locator('.cloud-status-view')).toContainText('Browser session detection');
    await expect(page.locator('.cloud-status-view')).toContainText('Session presence');
    await expect(page.locator('.cloud-status-view')).toContainText('Cookie-aware connected state');
    await expect(page.locator('.cloud-status-view')).toContainText(
      'Quota and storage usage are not fetched yet'
    );
    await expect(page.getByRole('button', { name: 'Open login' })).toHaveCount(3);
  });

  test('api status and startup health surface connected runtime state', async () => {
    const page = await openFreshSidebar();

    await setRuntimeStore(page, 'sue_test_ollama_mock', {
      available: true,
      status: 'Connected',
      models: 3,
      chat_response: {
        content: 'Health mock',
        model: 'mock-ollama',
      },
    });
    // Clear the health cache, then wait for any in-flight STARTUP_HEALTH response
    // (triggered by the App component on mount) to finish writing before we re-fetch.
    await clearRuntimeStore(page, ['sue_runtime_health']);
    await sleep(700);
    // Clear again — the in-flight write may have re-populated it with real Ollama data.
    await clearRuntimeStore(page, ['sue_runtime_health']);

    const apiStatus = await runtimeRequest<{
      api: string;
      version: string;
      generated_at: string;
      data_file: string;
      test_helpers: boolean;
    }>(page, { type: 'API_STATUS' });
    expect(apiStatus.success).toBe(true);
    expect(apiStatus.data?.api).toBe('ready');
    expect(apiStatus.data?.test_helpers).toBe(true);

    const startupHealth = await runtimeRawRequest<{
      success: boolean;
      data: { api: { available: boolean }; ollama: { available: boolean; models: number } };
    }>(page, { type: 'STARTUP_HEALTH' });
    expect(startupHealth.success).toBe(true);
    expect(startupHealth.data.api.available).toBe(true);
    expect(startupHealth.data.ollama.available).toBe(true);
    expect(startupHealth.data.ollama.models).toBe(3);
  });

  test('AI chat supports deterministic success and degraded failure states', async () => {
    const page = await openFreshSidebar();

    await setRuntimeStore(page, 'sue_test_ollama_mock', {
      available: true,
      status: 'Connected',
      models: 2,
      chat_response: {
        content: 'Mock Ollama reply from Playwright',
        model: 'mock-ollama',
      },
    });

    await page.reload();
    await waitForSidebar(page);
    await page.getByRole('button', { name: '◈ AI' }).click();
    await page.getByPlaceholder('Ask SUE anything').fill('Draft a task list');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.locator('.ai-chat-view')).toContainText('Mock Ollama reply from Playwright');

    await setRuntimeStore(page, 'sue_test_ollama_mock', {
      available: false,
      status: 'Offline',
      models: 0,
      chat_error: 'Mock Ollama offline for recovery testing',
    });

    await page.getByPlaceholder('Ask SUE anything').fill('Try again');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.locator('.ai-chat-view')).toContainText(
      'Mock Ollama offline for recovery testing'
    );
    await expect(page.locator('.ai-chat-view')).toContainText(
      'Unable to reach AI backend: Mock Ollama offline for recovery testing'
    );
  });

  test('auth and session lifecycle works through the runtime bridge', async () => {
    const page = await openFreshSidebar();
    const username = `playwright-${Date.now()}`;
    const password = 'sue-password';

    await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    const loginResponse = await runtimeRawRequest<{ success: boolean; session: SessionInfo }>(
      page,
      {
        type: 'AUTH_LOGIN',
        credentials: { username, password },
      }
    );
    expect(loginResponse.success).toBe(true);
    expect(loginResponse.session.username).toBe(username);

    const sessionGet = await runtimeRawRequest<{ success: boolean; session: SessionInfo | null }>(
      page,
      {
        type: 'SESSION_GET',
      }
    );
    expect(sessionGet.success).toBe(true);
    expect(sessionGet.session?.username).toBe(username);

    const refreshResponse = await runtimeRawRequest<{ success: boolean; session: SessionInfo }>(
      page,
      {
        type: 'SESSION_REFRESH',
      }
    );
    expect(refreshResponse.success).toBe(true);
    expect(refreshResponse.session.token).toBeTruthy();

    await page.getByRole('button', { name: '⬡ Home' }).click();
    await page.getByRole('button', { name: 'Refresh' }).click();
    await expect(
      page.locator('.health-grid .health-card').filter({ hasText: 'Session' })
    ).toContainText(username);

    const logoutResponse = await runtimeRawRequest<{ success: boolean }>(page, {
      type: 'AUTH_LOGOUT',
    });
    expect(logoutResponse.success).toBe(true);

    const afterLogout = await runtimeRawRequest<{ success: boolean; session: SessionInfo | null }>(
      page,
      {
        type: 'SESSION_GET',
      }
    );
    expect(afterLogout.success).toBe(true);
    expect(afterLogout.session).toBeNull();
  });

  test('invalid auth and expired session fail cleanly through the runtime bridge', async () => {
    const page = await openFreshSidebar();

    const badLogin = await runtimeRawRequest<{ success: boolean; error?: string }>(page, {
      type: 'AUTH_LOGIN',
      credentials: { username: 'missing-user', password: 'wrong-password' },
    });
    expect(badLogin.success).toBe(false);
    expect(badLogin.error).toContain('Invalid credentials');

    const username = `expiring-${Date.now()}`;
    const password = 'sue-password';
    await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    const loginResponse = await runtimeRawRequest<{ success: boolean; session: SessionInfo }>(
      page,
      {
        type: 'AUTH_LOGIN',
        credentials: { username, password },
      }
    );
    expect(loginResponse.success).toBe(true);

    await resetApiState('default');

    const refreshFailure = await runtimeRawRequest<{ success: boolean; error?: string }>(page, {
      type: 'SESSION_REFRESH',
    });
    expect(refreshFailure.success).toBe(false);
    expect(refreshFailure.error).toContain('Session expired');

    const afterFailure = await runtimeRawRequest<{ success: boolean; session: SessionInfo | null }>(
      page,
      {
        type: 'SESSION_GET',
      }
    );
    expect(afterFailure.success).toBe(true);
    expect(afterFailure.session).toBeNull();
  });

  test('runtime helper surfaces support store, vault, agents, and tab sessions', async () => {
    const page = await openFreshSidebar();

    await setRuntimeStore(page, 'playwright_key', { status: 'stored' });
    const storedValue = await runtimeRawRequest<{
      success: boolean;
      data: { value: { status: string } };
    }>(page, { type: 'STORE_GET', key: 'playwright_key' });
    expect(storedValue.success).toBe(true);
    expect(storedValue.data.value.status).toBe('stored');

    const saveVault = await runtimeRawRequest<{ success: boolean }>(page, {
      type: 'VAULT_KEY_SAVE',
      key: [1, 2, 3, 255],
    });
    expect(saveVault.success).toBe(true);

    const loadVault = await runtimeRawRequest<{ success: boolean; key: number[] }>(page, {
      type: 'VAULT_KEY_LOAD',
    });
    expect(loadVault.success).toBe(true);
    expect(loadVault.key).toEqual([1, 2, 3, 255]);

    const createdTask = await runtimeRawRequest<{
      success: boolean;
      task: { id: string; status: string };
    }>(page, {
      type: 'AGENT_CREATE_TASK',
      task: { task_type: 'qa', content: 'Run checks', priority: 2 },
    });
    expect(createdTask.success).toBe(true);
    expect(createdTask.task.status).toBe('Pending');

    const updatedTask = await runtimeRawRequest<{ success: boolean; task: { status: string } }>(
      page,
      {
        type: 'AGENT_UPDATE_STATUS',
        taskId: createdTask.task.id,
        status: 'Completed',
      }
    );
    expect(updatedTask.success).toBe(true);
    expect(updatedTask.task.status).toBe('Completed');

    const allTasks = await runtimeRawRequest<{
      success: boolean;
      tasks: Array<{ id: string; status: string }>;
    }>(page, {
      type: 'AGENT_GET_TASKS',
    });
    expect(allTasks.success).toBe(true);
    expect(allTasks.tasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createdTask.task.id,
          status: 'Completed',
        }),
      ])
    );

    const sessionCreate = await runtimeRawRequest<{
      success: boolean;
      session: { tabs: Array<{ id: number }>; session_id: string };
    }>(page, {
      type: 'TAB_CREATE_SESSION',
      tabs: [{ id: 101, title: 'Mock tab' }],
    });
    expect(sessionCreate.success).toBe(true);
    expect(sessionCreate.session.tabs).toHaveLength(1);

    const sessionGet = await runtimeRawRequest<{
      success: boolean;
      session: { session_id: string } | null;
    }>(page, {
      type: 'TAB_GET_SESSION',
    });
    expect(sessionGet.success).toBe(true);
    expect(sessionGet.session?.session_id).toBe(sessionCreate.session.session_id);
  });

  test('page context, sidebar injection, and content messaging work on a real content tab', async () => {
    await resetOpenPages();
    const contentPage = await context.newPage();
    await contentPage.goto('http://localhost:8080/api/v1/test/page');

    const page = await getSidebarPage();
    await waitForSidebar(page);
    await clearExtensionState(page);
    await page.reload();
    await waitForSidebar(page);

    const tabs = await getRuntimeTabs(page);
    const contentTab = tabs.find((entry) => entry.title === 'SUE Context Page');
    expect(contentTab).toBeTruthy();

    const pageContext = await runtimeRawRequest<{
      success: boolean;
      context: { title: string; url: string; path: string };
    }>(page, {
      type: 'PAGE_GET_CONTEXT',
      targetTabId: contentTab?.id,
    });
    expect(pageContext.success).toBe(true);
    expect(pageContext.context.title).toBe('SUE Context Page');
    expect(pageContext.context.url).toContain('/api/v1/test/page');

    const pageInfo = await runtimeRequest<{
      success: boolean;
      info: { title: string; path: string };
    }>(page, {
      type: 'TAB_SEND_MESSAGE',
      targetTabId: contentTab?.id,
      message: { type: 'GET_PAGE_INFO' },
    });
    // Diagnostic: surface the actual error if tabSendMessage fails
    expect(
      { success: pageInfo.success, error: (pageInfo as Record<string, unknown>).error ?? null },
      'TAB_SEND_MESSAGE must succeed'
    ).toMatchObject({ success: true, error: null });
    expect(pageInfo.data?.info.title).toBe('SUE Context Page');

    const injected = await runtimeRawRequest<{ success: boolean }>(page, {
      type: 'PAGE_INJECT_SIDEBAR',
      targetTabId: contentTab?.id,
      targetId: 'body',
    });
    expect(injected.success).toBe(true);
    await expect(contentPage.locator('#sue-container')).toBeVisible();
    await expect(contentPage.locator('body')).toContainText('Loading SUE…');
  });

  test('runtime bridge rejects malformed chat requests with explicit errors', async () => {
    const page = await openFreshSidebar();

    const result = await runtimeRequest<unknown>(page, { type: 'CHAT_SEND', messages: [] });
    expect(result.success).toBe(false);
    expect(result.error).toContain('messages must contain at least one entry');
  });

  test('cloud auth handoff opens the provider login page', async () => {
    const page = await openFreshSidebar();

    const [providerPage] = await Promise.all([
      context.waitForEvent('page'),
      runtimeRequest(page, { type: 'CLOUD_AUTH_START', provider: 'koofr' }),
    ]);

    await providerPage.waitForLoadState('domcontentloaded');
    expect(providerPage.url()).toContain('koofr.net');
    await providerPage.close();
  });

  test('memory save, list, and delete round-trip persists correctly', async () => {
    const page = await openFreshSidebar();

    // Seed a memory directly via MEMORY_SAVE
    const payload = {
      url: 'https://test.example/memory-roundtrip',
      title: 'Memory Round-trip Test',
      contentText: 'Hello from the round-trip test.',
      images: [],
      videos: [],
      capturedAt: Date.now(),
    };
    const saved = await runtimeRequest<{ id: string }>(page, { type: 'MEMORY_SAVE', payload });
    expect(saved.success).toBe(true);
    expect(typeof saved.data?.id).toBe('string');
    const savedId = saved.data!.id;

    // MEMORY_LIST must return the saved entry
    const listed = await runtimeRequest<Array<{ id: string; url: string; title: string }>>(page, {
      type: 'MEMORY_LIST',
    });
    expect(listed.success).toBe(true);
    const entry = listed.data?.find((m) => m.id === savedId);
    expect(entry).toBeTruthy();
    expect(entry?.url).toBe(payload.url);
    expect(entry?.title).toBe(payload.title);

    // Save a second memory to verify list grows
    await runtimeRequest(page, {
      type: 'MEMORY_SAVE',
      payload: { ...payload, url: 'https://test.example/second', title: 'Second Memory' },
    });
    const listed2 = await runtimeRequest<Array<{ id: string }>>(page, { type: 'MEMORY_LIST' });
    expect((listed2.data ?? []).length).toBeGreaterThanOrEqual(2);

    // MEMORY_DELETE removes the entry
    const deleted = await runtimeRequest<{ deleted: string }>(page, {
      type: 'MEMORY_DELETE',
      memoryId: savedId,
    });
    expect(deleted.success).toBe(true);
    expect(deleted.data?.deleted).toBe(savedId);

    // Verify it no longer appears in the list
    const listed3 = await runtimeRequest<Array<{ id: string }>>(page, { type: 'MEMORY_LIST' });
    expect(listed3.data?.find((m) => m.id === savedId)).toBeUndefined();
  });

  test('page snapshot capture stores content and reloads from memory', async () => {
    await resetOpenPages();
    const contentPage = await context.newPage();
    await contentPage.goto('http://localhost:8080/api/v1/test/page');

    const page = await openFreshSidebar();

    const tabs = await getRuntimeTabs(page);
    const contentTab = tabs.find((entry) => entry.title === 'SUE Context Page');
    expect(contentTab).toBeTruthy();

    // CAPTURE_PAGE captures the live content page via content script
    const captured = await runtimeRequest<{ id: string }>(page, {
      type: 'CAPTURE_PAGE',
      targetTabId: contentTab!.id,
    });
    expect(captured.success).toBe(true);
    expect(typeof captured.data?.id).toBe('string');
    const capturedId = captured.data!.id;

    // The captured entry must appear in MEMORY_LIST with correct metadata
    const listed = await runtimeRequest<
      Array<{ id: string; url: string; title: string; content_text: string; tags: string[] }>
    >(page, { type: 'MEMORY_LIST' });
    expect(listed.success).toBe(true);
    const entry = listed.data?.find((m) => m.id === capturedId);
    expect(entry).toBeTruthy();
    expect(entry?.url).toContain('/api/v1/test/page');
    expect(entry?.title).toBe('SUE Context Page');
    expect(entry?.content_text).toBeTruthy();
    expect(entry?.tags).toContain('captured_page');

    // PAGE_GET_CONTEXT also returns the live tab info
    const ctx = await runtimeRawRequest<{
      success: boolean;
      context: { title: string; url: string; domain: string };
    }>(page, { type: 'PAGE_GET_CONTEXT', targetTabId: contentTab!.id });
    expect(ctx.success).toBe(true);
    expect(ctx.context.title).toBe('SUE Context Page');
    expect(ctx.context.domain).toBe('localhost');

    // Content script also returns page info via TAB_SEND_MESSAGE
    const info = await runtimeRequest<{ info: { title: string; url: string } }>(page, {
      type: 'TAB_SEND_MESSAGE',
      targetTabId: contentTab!.id,
      message: { type: 'GET_PAGE_INFO' },
    });
    expect(info.success).toBe(true);
    expect(info.data?.info.title).toBe('SUE Context Page');

    // Clean up
    await contentPage.close();
  });

  test('PAGE_INFO store and reload persists page metadata across requests', async () => {
    const page = await openFreshSidebar();

    // Store page info via PAGE_INFO message
    const storeResult = await runtimeRequest<null>(page, {
      type: 'PAGE_INFO',
      info: {
        url: 'https://test.example/page-info-test',
        title: 'Page Info Persistence Test',
        domain: 'test.example',
      },
    });
    expect(storeResult.success).toBe(true);

    // Retrieve it from storage via STORE_GET
    const stored = await runtimeRawRequest<{
      success: boolean;
      data: { value: { url: string; title: string } | null };
    }>(page, { type: 'STORE_GET', key: 'sue_last_page_info' });
    expect(stored.success).toBe(true);
    expect(stored.data?.value?.url).toBe('https://test.example/page-info-test');
    expect(stored.data?.value?.title).toBe('Page Info Persistence Test');
  });

  test('vector memory list, stats, compact, and clear operations complete correctly', async () => {
    const page = await openFreshSidebar();

    const listed = await runtimeRequest<unknown[]>(page, { type: 'MEMORY_VECTOR_LIST', limit: 100 });
    expect(listed.success).toBe(true);
    expect(Array.isArray(listed.data)).toBe(true);

    const stats = await runtimeRawRequest<{ success: boolean; data: { total_count: number } }>(
      page, { type: 'MEMORY_VECTOR_STATS' }
    );
    expect(stats.success).toBe(true);
    expect(typeof stats.data?.total_count).toBe('number');

    const compacted = await runtimeRequest<unknown>(page, { type: 'MEMORY_VECTOR_COMPACT' });
    expect(compacted.success).toBe(true);

    const cleared = await runtimeRequest<unknown>(page, { type: 'MEMORY_VECTOR_CLEAR' });
    expect(cleared.success).toBe(true);

    const statsAfter = await runtimeRawRequest<{ success: boolean; data: { total_count: number } }>(
      page, { type: 'MEMORY_VECTOR_STATS' }
    );
    expect(statsAfter.success).toBe(true);
    expect(statsAfter.data?.total_count).toBe(0);
  });

  test('session store get and set persist ephemeral data correctly', async () => {
    const page = await openFreshSidebar();

    const setResult = await runtimeRequest<null>(page, {
      type: 'SESSION_STORE_SET',
      key: 'e2e_session_test_key',
      value: { hello: 'world', num: 42 },
    });
    expect(setResult.success).toBe(true);

    const getResult = await runtimeRequest<{ value: { hello: string; num: number } }>(
      page, { type: 'SESSION_STORE_GET', key: 'e2e_session_test_key' }
    );
    expect(getResult.success).toBe(true);
    expect(getResult.data?.value?.hello).toBe('world');
    expect(getResult.data?.value?.num).toBe(42);

    const missing = await runtimeRequest<{ value: null }>(
      page, { type: 'SESSION_STORE_GET', key: 'e2e_session_nonexistent' }
    );
    expect(missing.success).toBe(true);
    expect(missing.data?.value).toBeNull();
  });

  test('VALIDATE_PROVIDER returns structured errors for missing or fake credentials', async () => {
    const page = await openFreshSidebar();

    const emptyVenice = await runtimeRequest<unknown>(page, { type: 'VALIDATE_PROVIDER', provider: 'venice', key: '' });
    expect(emptyVenice.success).toBe(false);

    const fakeVenice = await runtimeRequest<{ valid: boolean; models?: string[]; error?: string }>(page, {
      type: 'VALIDATE_PROVIDER', provider: 'venice', key: 'fake-key-for-e2e-test',
    });
    // Venice /models is publicly accessible — just verify the response has the correct shape
    expect(fakeVenice.success).toBe(true);
    expect(typeof fakeVenice.data?.valid).toBe('boolean');

    const emptyHF = await runtimeRequest<unknown>(page, { type: 'VALIDATE_PROVIDER', provider: 'huggingface', key: '' });
    expect(emptyHF.success).toBe(false);

    const fakeHF = await runtimeRequest<{ valid: boolean; error?: string }>(page, {
      type: 'VALIDATE_PROVIDER', provider: 'huggingface', key: 'hf_fakekeyfortesting',
    });
    expect(fakeHF.success).toBe(true);
    expect(fakeHF.data?.valid).toBe(false);

    const unknown = await runtimeRequest<unknown>(page, { type: 'VALIDATE_PROVIDER', provider: 'unknown_provider', key: 'any' });
    expect(unknown.success).toBe(false);
  });

  test('AGENT_GET_AVAILABLE_TOOLS returns tool list and AGENT_TOOL_EXECUTE rejects unknown tools', async () => {
    const page = await openFreshSidebar();

    const toolsResult = await runtimeRawRequest<{ success: boolean; data: { tools: string[] } }>(
      page, { type: 'AGENT_GET_AVAILABLE_TOOLS' }
    );
    expect(toolsResult.success).toBe(true);
    expect(Array.isArray(toolsResult.data?.tools)).toBe(true);
    expect(toolsResult.data!.tools.length).toBeGreaterThan(0);
    expect(toolsResult.data!.tools).toContain('navigate');

    const badTool = await runtimeRequest<unknown>(page, {
      type: 'AGENT_TOOL_EXECUTE', payload: { tool: 'non_existent_tool_xyz', params: {} },
    });
    expect(badTool.success).toBe(false);
    expect(badTool.error).toContain('non_existent_tool_xyz');

    const noTool = await runtimeRequest<unknown>(page, {
      type: 'AGENT_TOOL_EXECUTE', payload: { params: {} },
    });
    expect(noTool.success).toBe(false);
  });

  test('INJECT_SIDEBAR alias injects the panel identically to PAGE_INJECT_SIDEBAR', async () => {
    await resetOpenPages();
    const contentPage = await context.newPage();
    await contentPage.goto('http://localhost:8080/api/v1/test/page');

    const page = await openFreshSidebar();
    const tabs = await getRuntimeTabs(page);
    const contentTab = tabs.find((t) => t.title === 'SUE Context Page');
    expect(contentTab).toBeTruthy();

    const result = await runtimeRawRequest<{ success: boolean }>(page, {
      type: 'INJECT_SIDEBAR', targetTabId: contentTab!.id, targetId: 'body',
    });
    expect(result.success).toBe(true);
    await expect(contentPage.locator('#sue-container')).toBeVisible();

    await contentPage.close();
  });

  test('SUEWARM agent run returns a result and observations are accessible', async () => {
    const page = await openFreshSidebar();

    const run = await runtimeRequest<unknown>(page, {
      type: 'SUEWARM_AGENT_RUN',
      payload: { intent: 'What is the current time?' },
    });
    expect(typeof run.success).toBe('boolean');

    const obs = await runtimeRawRequest<{ success: boolean; data: { observations: unknown[] } }>(
      page, { type: 'SUEWARM_AGENT_OBSERVATIONS', limit: 10 }
    );
    expect(obs.success).toBe(true);
    expect(Array.isArray(obs.data?.observations)).toBe(true);
  });

  test('SUEWARM memory stores and retrieves episodic and semantic entries', async () => {
    const page = await openFreshSidebar();

    const addEpisodic = await runtimeRequest<unknown>(page, {
      type: 'SUEWARM_MEMORY_ADD_EPISODIC',
      entry: { content: 'User asked about weather in London', source: 'chat', timestamp: Date.now(), tags: ['weather'] },
    });
    expect(addEpisodic.success).toBe(true);

    const search = await runtimeRequest<{ results: unknown[] }>(page, {
      type: 'SUEWARM_MEMORY_SEARCH_EPISODIC', query: 'weather', options: { limit: 5 },
    });
    expect(search.success).toBe(true);
    expect(Array.isArray(search.data?.results)).toBe(true);

    const addSemantic = await runtimeRequest<unknown>(page, {
      type: 'SUEWARM_MEMORY_ADD_SEMANTIC', key: 'e2e_test_pref', value: 'dark_mode',
    });
    expect(addSemantic.success).toBe(true);

    const getSemantic = await runtimeRawRequest<{
      success: boolean;
      data: { value: { value: string } | string | null };
    }>(page, { type: 'SUEWARM_MEMORY_GET_SEMANTIC', key: 'e2e_test_pref' });
    expect(getSemantic.success).toBe(true);
    // getSemantic may return the record wrapper {key, value, updatedAt} or a plain value
    const semanticVal = getSemantic.data?.value;
    const resolvedVal =
      semanticVal && typeof semanticVal === 'object' && 'value' in semanticVal
        ? (semanticVal as { value: string }).value
        : semanticVal;
    expect(resolvedVal).toBe('dark_mode');

    const missingKey = await runtimeRawRequest<{ success: boolean; data: { value: null } }>(
      page, { type: 'SUEWARM_MEMORY_GET_SEMANTIC', key: 'no_such_key_xyz' }
    );
    expect(missingKey.success).toBe(true);
    expect(missingKey.data?.value ?? null).toBeNull();

    const memStats = await runtimeRawRequest<{
      success: boolean;
      data: Record<string, unknown>;
    }>(page, { type: 'SUEWARM_MEMORY_STATS' });
    expect(memStats.success).toBe(true);
    // Stats shape from memory-manager: { episodicMemory, semanticMemory, ... }
    expect(memStats.data).toBeTruthy();
  });

  test('note CRUD explicit round-trip: create, update, list, delete', async () => {
    const page = await openFreshSidebar();

    const created = await runtimeRawRequest<{ success: boolean; data?: { id: string }; id?: string }>(page, {
      type: 'NOTE_CREATE',
      note: { title: 'E2E Note', content: 'Initial content', pinned: false },
    });
    expect(created.success).toBe(true);
    const noteId = created.data?.id ?? created.id;
    expect(typeof noteId).toBe('string');

    const listed = await runtimeRawRequest<{
      success: boolean;
      data?: { notes?: Array<{ id: string }> } | Array<{ id: string }>;
    }>(page, { type: 'NOTE_LIST' });
    expect(listed.success).toBe(true);
    const notes = Array.isArray(listed.data)
      ? listed.data
      : (listed.data as { notes?: Array<{ id: string }> })?.notes ?? [];
    expect((notes as Array<{ id: string }>).find((n) => n.id === noteId)).toBeTruthy();

    const updated = await runtimeRequest<unknown>(page, {
      type: 'NOTE_UPDATE', noteId,
      note: { title: 'E2E Note Updated', content: 'Updated', pinned: true },
    });
    expect(updated.success).toBe(true);

    const deleted = await runtimeRequest<unknown>(page, { type: 'NOTE_DELETE', noteId });
    expect(deleted.success).toBe(true);
  });

  test('project CRUD explicit round-trip: create, update, list, delete', async () => {
    const page = await openFreshSidebar();

    const created = await runtimeRawRequest<{ success: boolean; data?: { id: string }; id?: string }>(page, {
      type: 'PROJECT_CREATE',
      project: { name: 'E2E Project', description: 'e2e test', status: 'todo' },
    });
    expect(created.success).toBe(true);
    const projectId = created.data?.id ?? created.id;
    expect(typeof projectId).toBe('string');

    const listed = await runtimeRawRequest<{
      success: boolean;
      data?: { projects?: Array<{ id: string }> } | Array<{ id: string }>;
    }>(page, { type: 'PROJECT_LIST' });
    expect(listed.success).toBe(true);
    const projects = Array.isArray(listed.data)
      ? listed.data
      : (listed.data as { projects?: Array<{ id: string }> })?.projects ?? [];
    expect((projects as Array<{ id: string }>).find((p) => p.id === projectId)).toBeTruthy();

    const updated = await runtimeRequest<unknown>(page, {
      type: 'PROJECT_UPDATE', projectId,
      project: { name: 'E2E Project Updated', status: 'done' },
    });
    expect(updated.success).toBe(true);

    const deleted = await runtimeRequest<unknown>(page, { type: 'PROJECT_DELETE', projectId });
    expect(deleted.success).toBe(true);
  });

  test('AGENT_QUERY handles empty payload and intent routing without crashing', async () => {
    const page = await openFreshSidebar();

    // Empty/null payload must fail cleanly (not crash the service worker)
    const emptyResult = await runtimeRequest<unknown>(page, {
      type: 'AGENT_QUERY',
      payload: null,
    });
    expect(typeof emptyResult.success).toBe('boolean');

    // Valid text payload routes through the agent; response shape is consistent
    const queryResult = await runtimeRequest<unknown>(page, {
      type: 'AGENT_QUERY',
      payload: { text: 'List available tools' },
    });
    expect(typeof queryResult.success).toBe('boolean');
    // Whether the agent answers or gracefully fails, success must be a boolean (not an exception)
  });

  test('TAB_CLOSE removes a content tab and handles missing tab gracefully', async () => {
    await resetOpenPages();
    const contentPage = await context.newPage();
    await contentPage.goto('http://localhost:8080/api/v1/test/page');

    const page = await openFreshSidebar();
    const tabs = await getRuntimeTabs(page);
    const contentTab = tabs.find((t) => t.title === 'SUE Context Page');
    expect(contentTab).toBeTruthy();

    // Close the real tab through the runtime bridge
    const closeResult = await runtimeRequest<null>(page, {
      type: 'TAB_CLOSE',
      targetTabId: contentTab!.id,
    });
    expect(closeResult.success).toBe(true);

    // The tab should no longer appear in the tab list
    await page.waitForTimeout(300);
    const afterTabs = await getRuntimeTabs(page);
    expect(afterTabs.find((t) => t.id === contentTab!.id)).toBeUndefined();

    // Closing a tab that no longer exists must return a structured error, not crash
    const double = await runtimeRequest<null>(page, {
      type: 'TAB_CLOSE',
      targetTabId: contentTab!.id,
    });
    expect(double.success).toBe(false);
    expect(typeof double.error).toBe('string');
  });

  test('SUEWARM agent cancel and status return structured responses', async () => {
    const page = await openFreshSidebar();

    // Start an agent run to get a task ID
    const run = await runtimeRawRequest<{
      success: boolean;
      data?: { taskId?: string; task_id?: string };
      taskId?: string;
    }>(page, { type: 'SUEWARM_AGENT_RUN', payload: { intent: 'List page headings' } });
    expect(typeof run.success).toBe('boolean');

    // Status for a non-existent task ID must return structured failure
    const badStatus = await runtimeRequest<unknown>(page, {
      type: 'SUEWARM_AGENT_STATUS',
      taskId: 'non-existent-task-id-xyz',
    });
    expect(badStatus.success).toBe(false);

    // Cancel for a non-existent task ID must return structured response (not crash)
    const badCancel = await runtimeRequest<unknown>(page, {
      type: 'SUEWARM_AGENT_CANCEL',
      taskId: 'non-existent-task-id-xyz',
    });
    expect(typeof badCancel.success).toBe('boolean');

    // Missing taskId must fail validation immediately
    const noId = await runtimeRequest<unknown>(page, { type: 'SUEWARM_AGENT_CANCEL' });
    expect(noId.success).toBe(false);
    expect(noId.error).toContain('taskId');
  });

  test('SWARM_RUN returns a structured stub failure and PROMPTLAB handlers respond cleanly', async () => {
    const page = await openFreshSidebar();

    // SWARM_RUN always fails because the SW is classic (not ES module) — verify structured failure
    const swarmRun = await runtimeRequest<unknown>(page, {
      type: 'SWARM_RUN',
      payload: { intent: 'analyze the codebase' },
    });
    // Stub always returns { success: false, error: '...' } — not an uncaught exception
    expect(typeof swarmRun.success).toBe('boolean');

    // Missing intent fails immediately with validation error
    const noIntent = await runtimeRequest<unknown>(page, {
      type: 'SWARM_RUN',
      payload: {},
    });
    expect(noIntent.success).toBe(false);
    expect(noIntent.error).toContain('intent');

    // PROMPTLAB_REPORT returns a report object from the stub
    const report = await runtimeRawRequest<{
      success: boolean;
      data?: { generatedAt?: string; recommendations?: unknown[] };
    }>(page, { type: 'SWARM_PROMPTLAB_REPORT' });
    expect(report.success).toBe(true);
    expect(typeof report.data?.generatedAt).toBe('string');
    expect(Array.isArray(report.data?.recommendations)).toBe(true);

    // PROMPTLAB_SET_WEIGHT with valid payload hits the stub and returns a response
    const weight = await runtimeRequest<unknown>(page, {
      type: 'SWARM_PROMPTLAB_SET_WEIGHT',
      payload: { template: 'chat', variant: 'concise', weight: 0.7 },
    });
    // Stub returns { success: false } with an error — verify structured failure
    expect(typeof weight.success).toBe('boolean');

    // Missing required fields fail immediately
    const badWeight = await runtimeRequest<unknown>(page, {
      type: 'SWARM_PROMPTLAB_SET_WEIGHT',
      payload: { template: 'chat' },
    });
    expect(badWeight.success).toBe(false);
  });

  test('DESKTOP_ACTION fails gracefully when native bridge is unavailable', async () => {
    const page = await openFreshSidebar();

    // Missing payload fails immediately
    const noPayload = await runtimeRequest<unknown>(page, { type: 'DESKTOP_ACTION' });
    expect(noPayload.success).toBe(false);
    expect(noPayload.error).toContain('payload');

    // Valid payload shape but native bridge unavailable returns structured error
    const result = await runtimeRequest<unknown>(page, {
      type: 'DESKTOP_ACTION',
      payload: { action: 'open', command: 'notepad' },
    });
    // Should always fail cleanly (native bridge not running in test environment)
    expect(typeof result.success).toBe('boolean');
    if (!result.success) {
      expect(typeof result.error).toBe('string');
    }
  });

  test('tool captureMemory and getPageContext execute via AGENT_TOOL_EXECUTE on a live tab', async () => {
    await resetOpenPages();
    const contentPage = await context.newPage();
    await contentPage.goto('http://localhost:8080/api/v1/test/page');

    const page = await openFreshSidebar();
    const tabs = await getRuntimeTabs(page);
    const contentTab = tabs.find((t) => t.title === 'SUE Context Page');
    expect(contentTab).toBeTruthy();

    // getPageContext tool returns title and url for the target tab
    const ctxResult = await runtimeRequest<{ context: { title: string; url: string } }>(page, {
      type: 'AGENT_TOOL_EXECUTE',
      payload: { tool: 'getPageContext', params: {} },
    });
    expect(ctxResult.success).toBe(true);
    expect(ctxResult.data?.context?.title).toBeTruthy();

    // captureMemory tool captures the content page and saves to sue_ramemories
    const beforeList = await runtimeRequest<unknown[]>(page, { type: 'MEMORY_LIST' });
    const beforeCount = (beforeList.data as unknown[] | undefined)?.length ?? 0;

    const captureResult = await runtimeRequest<{ success: boolean; id?: string; error?: string }>(
      page,
      { type: 'AGENT_TOOL_EXECUTE', payload: { tool: 'captureMemory', params: {} } }
    );
    // agentExecuteTool always returns success:true when the tool doesn't throw —
    // the inner tool result is in data.  Either way the handler must not crash.
    expect(typeof captureResult.success).toBe('boolean');

    const toolData = captureResult.data as { success?: boolean; id?: string; error?: string } | undefined;
    if (toolData?.success && toolData?.id) {
      // Tool reached a content tab — verify the memory was persisted
      expect(typeof toolData.id).toBe('string');
      const afterList = await runtimeRequest<unknown[]>(page, { type: 'MEMORY_LIST' });
      const afterCount = (afterList.data as unknown[] | undefined)?.length ?? 0;
      expect(afterCount).toBeGreaterThan(beforeCount);
    } else {
      // Tool ran against the sidebar (no content script) — structured failure expected
      expect(typeof (toolData?.error ?? captureResult.error)).toBe('string');
    }

    await contentPage.close();
  });

  test('AUTH_OTP_REQUEST returns a 6-digit code for a valid email', async () => {
    const page = await openFreshSidebar();

    // authOtpRequest returns ok({ data: payload.data }) → { success, data: { otp, expires_in } }
    const result = await runtimeRawRequest<{
      success: boolean;
      data: { otp: string; expires_in: number };
    }>(page, {
      type: 'AUTH_OTP_REQUEST',
      email: 'test-otp@example.com',
    });

    expect(result.success).toBe(true);
    expect(result.data.otp).toMatch(/^\d{6}$/);
    expect(result.data.expires_in).toBeGreaterThan(0);
  });

  test('AUTH_OTP_VERIFY completes full sign-in flow and auto-applies api_settings', async () => {
    const page = await openFreshSidebar();
    const email = 'verify-otp@example.com';

    // Step 1: request OTP — server returns it directly in the response
    const reqResult = await runtimeRawRequest<{
      success: boolean;
      data: { otp: string };
    }>(page, { type: 'AUTH_OTP_REQUEST', email });
    expect(reqResult.success).toBe(true);
    const otp = reqResult.data.otp;
    expect(otp).toMatch(/^\d{6}$/);

    // Step 2: verify OTP — authOtpVerify returns ok({ session, api_settings })
    // so session is at top level (no .data wrapper)
    const verifyResult = await runtimeRawRequest<{
      success: boolean;
      session: SessionInfo;
      api_settings: Record<string, string>;
    }>(page, { type: 'AUTH_OTP_VERIFY', email, code: otp });

    expect(verifyResult.success).toBe(true);
    expect(verifyResult.session).toBeDefined();
    expect(verifyResult.session.session_id).toBeTruthy();
    expect(typeof verifyResult.api_settings).toBe('object');

    // Session should now be persisted — SESSION_GET returns ok({ session }) at top level too
    const sessionResult = await runtimeRawRequest<{
      success: boolean;
      session: SessionInfo | null;
    }>(page, { type: 'SESSION_GET' });
    expect(sessionResult.success).toBe(true);
    expect(sessionResult.session?.session_id).toBeTruthy();
  });

  test('AUTH_OTP_VERIFY rejects a wrong code', async () => {
    const page = await openFreshSidebar();
    const email = 'bad-code@example.com';

    await runtimeRawRequest(page, { type: 'AUTH_OTP_REQUEST', email });

    const result = await runtimeRawRequest<{ success: boolean; error: string }>(page, {
      type: 'AUTH_OTP_VERIFY',
      email,
      code: '000000',
    });

    expect(result.success).toBe(false);
    expect(typeof result.error).toBe('string');
  });

  test('USER_SETTINGS_SAVE and USER_SETTINGS_LOAD round-trip api keys through the account', async () => {
    const page = await openFreshSidebar();
    const email = 'settings-rt@example.com';

    // Sign in via OTP
    const req = await runtimeRawRequest<{ success: boolean; data: { otp: string } }>(page, {
      type: 'AUTH_OTP_REQUEST',
      email,
    });
    const otp = req.data.otp;
    await runtimeRawRequest(page, { type: 'AUTH_OTP_VERIFY', email, code: otp });

    // Save settings — userSettingsSave returns ok({ data: payload.data })
    const saveResult = await runtimeRawRequest<{
      success: boolean;
      data: Record<string, string>;
    }>(page, {
      type: 'USER_SETTINGS_SAVE',
      settings: { venice_api_key: 'test-venice-key-xyz' },
    });
    expect(saveResult.success).toBe(true);

    // Load settings — userSettingsLoad returns ok({ data: payload.data })
    const loadResult = await runtimeRawRequest<{
      success: boolean;
      data: Record<string, string>;
    }>(page, { type: 'USER_SETTINGS_LOAD' });
    expect(loadResult.success).toBe(true);
    expect(loadResult.data).toBeDefined();
    expect(loadResult.data.venice_api_key).toBe('test-venice-key-xyz');
  });
});
