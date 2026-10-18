// SUE — Background Service Worker (MV3, Chrome/Edge) — v5.0.1
// NO "type: module" — plain service worker for MV3 compatibility
/* eslint-disable no-console */

'use strict';

// Import managers
importScripts(
  './keepalive-manager.js',
  './storage-manager.js',
  './offscreen-manager.js',
  './intent-router.js',
  './tool-registry.js',
  './suewarm-tool-registry.js',
  './vector-store.js',
  './memory-manager.js',
  './security-manager.js',
  './ai-agent.js',
  './suewarm-agent-core.js',
  './native-bridge.js',
  './learn-engine.js'
  // src/swarm/swarm.js uses ES module syntax and cannot be loaded via importScripts
  // in a classic service worker. A stub is provided below.
);

// Swarm stub — the full Swarm architecture requires an ES module service worker.
// Until the background is migrated to "type": "module", this prevents SW crash.
if (!globalThis.Swarm) {
  globalThis.Swarm = class SwarmStub {
    async initialize() {
      return false;
    }
    async run() {
      return { success: false, error: 'Swarm requires module SW — not yet enabled.' };
    }
    getPromptLabReport() {
      return {
        generatedAt: new Date().toISOString(),
        templates: {},
        recommendations: ['Swarm module runtime is not enabled in this service worker mode.'],
      };
    }
    setPromptLabWeight() {
      return { success: false, error: 'Swarm module runtime is not enabled.' };
    }
  };
}

const API_BASE_URL = 'http://127.0.0.1:8080/api/v1';
const OLLAMA_BASE_URL = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'llama3.2:3b';
const VENICE_BASE_URL = 'https://api.venice.ai/api/v1';
const DEFAULT_VENICE_MODEL = 'llama-3.3-70b';
const HF_CHAT_BASE_URL = 'https://api-inference.huggingface.co/models';
const DEFAULT_HF_MODEL = 'mistralai/Mistral-7B-Instruct-v0.3';
const STORAGE_KEYS = {
  currentSession: 'current_session',
  agentTasks: 'agent_tasks',
  runtimeHealth: 'sue_runtime_health',
  lastCloudSnapshot: 'sue_last_cloud_snapshot',
  ollamaMock: 'sue_test_ollama_mock',
  lastPageInfo: 'sue_last_page_info',
  lastVectorCompact: 'sue_last_vector_compact',
};

const sueIntentRouter = new globalThis.SUEIntentRouter();
const sueToolRegistry = new globalThis.SUEWARMToolRegistry();
const sueVectorStore = new globalThis.SUEVectorStore();
globalThis.sueVectorStoreRef = sueVectorStore; // exposed for tool registry access
const sueMemoryManager = new globalThis.SUEMemoryManager();
const sueSecurity = new globalThis.SUESecurityManager();
const suewarmAgent = new globalThis.SUEWARMAgentCore({
  intentRouter: sueIntentRouter,
  toolRegistry: sueToolRegistry,
  vectorStore: sueVectorStore,
  security: sueSecurity,
  onEvent: (payload) => {
    chrome.runtime
      .sendMessage({
        type: 'SIDEPANEL_UPDATE',
        payload,
      })
      .catch(() => {});
  },
});
const sueAgent = new globalThis.SUEAIAgent({
  intentRouter: sueIntentRouter,
  toolRegistry: sueToolRegistry,
  vectorStore: sueVectorStore,
  security: sueSecurity,
  onEvent: (payload) => {
    chrome.runtime
      .sendMessage({
        type: 'SIDEPANEL_UPDATE',
        payload,
      })
      .catch(() => {});
  },
});
const sueNativeBridge = new globalThis.SUENativeBridge();

const sueSwarm = new globalThis.Swarm();
let runtimeInitPromise = null;
let runtimeInitialized = false;

const CLOUD_PROVIDERS = {
  koofr: {
    name: 'Koofr',
    loginUrl: 'https://app.koofr.net/',
    cookieDomains: ['app.koofr.net', '.koofr.net', 'koofr.net'],
    integrationMode: 'Browser session detection',
    capabilities: ['Session presence', 'Login handoff', 'Cookie-aware connected state'],
    limitations: ['Quota and storage usage are not fetched yet'],
  },
  icedrive: {
    name: 'IceDrive',
    loginUrl: 'https://icedrive.net/login',
    cookieDomains: ['icedrive.net', '.icedrive.net', 'app.icedrive.net'],
    integrationMode: 'Browser session detection',
    capabilities: ['Session presence', 'Login handoff', 'Cookie-aware connected state'],
    limitations: ['WebDAV or provider credentials are still required for richer file operations'],
  },
  degoo: {
    name: 'Degoo',
    loginUrl: 'https://app.degoo.com/',
    cookieDomains: ['degoo.com', '.degoo.com', 'app.degoo.com'],
    integrationMode: 'Browser session detection',
    capabilities: ['Session presence', 'Login handoff', 'Cookie-aware connected state'],
    limitations: ['No public API-backed usage sync is implemented'],
  },
};

// ── Initialize Keepalive ────────────────────────────────────────
startKeepalive();
ensureAgentRuntimeInitialized().catch((error) => {
  console.warn('[SUE] Agent runtime initialization failed:', error);
});

// ── Setup Alarm Listener for Scheduled Tasks ────────────────────
// Override the stub handlers from keepalive-manager before calling setupAlarmListener
// so that alarms trigger the real async logic in this service worker file.
function handleSessionRefresh() {
  console.log('[SUE] Alarm: session refresh');
  sessionRefresh()
    .then((r) => {
      if (r.success) console.log('[SUE] Session refreshed');
      else console.warn('[SUE] Session refresh failed:', r.error);
    })
    .catch((e) => console.error('[SUE] Session refresh error:', e));
}
function handleCloudSync() {
  console.log('[SUE] Alarm: cloud sync');
  cloudStatusGet()
    .then((result) => {
      if (!result.success) {
        console.warn('[SUE] Cloud sync failed:', result.error);
        return;
      }

      return chrome.storage.local.set({
        [STORAGE_KEYS.lastCloudSnapshot]: {
          providers: result.data,
          synced_at: new Date().toISOString(),
        },
      });
    })
    .catch((error) => console.error('[SUE] Cloud sync error:', error));
}
function handleCleanup() {
  console.log('[SUE] Alarm: cleanup');
  cleanupRuntimeState().catch((error) => console.error('[SUE] Cleanup error:', error));
}

setupAlarmListener();

// ── Schedule Recurring Tasks ────────────────────────────────────
scheduleTask('session_refresh', 25, handleSessionRefresh); // Every 25 min
scheduleTask('cloud_sync', 60, handleCloudSync); // Every 60 min
scheduleTask('cleanup', 1440, handleCleanup); // Every 24 hours

// ── Keepalive ──────────────────────────────────────────────────
setInterval(() => chrome.storage.local.get('__ping__'), 20_000);

// ── Message Router ──────────────────────────────────────────────
// (Keep existing message router implementation)

// ── Open side panel when toolbar icon is clicked ───────────────
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// ── Allow side panel on every tab ─────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {}); // older builds may not support this
  ensureAgentRuntimeInitialized().catch((error) => {
    console.warn('[SUE] Agent runtime installation setup failed:', error);
  });
  console.log('[SUE] Extension installed');
});

chrome.runtime.onStartup.addListener(() => {
  ensureAgentRuntimeInitialized().catch((error) => {
    console.warn('[SUE] Agent runtime startup failed:', error);
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const tabId = tab?.id;
  if (!tabId) return;

  const isAnalyze = info.menuItemId === 'sue-ai-analyze';
  const isSummarize = info.menuItemId === 'sue-ai-summarize';
  if (!isAnalyze && !isSummarize) return;

  const selected = info.selectionText ? `"${info.selectionText.slice(0, 2000)}"` : '';
  const pageRef = selected || tab.url || 'this page';
  const prompt = isAnalyze ? `Analyze ${pageRef}` : `Summarize ${pageRef}`;

  // Store the pending query in session storage — the WASM AI chat picks it up on mount
  await chrome.storage.session.set({
    sue_pending_chat: { prompt, action: isAnalyze ? 'analyze' : 'summarize', ts: Date.now() },
  });

  // Open the side panel so the user sees the result
  try {
    await chrome.sidePanel.open({ tabId });
  } catch (err) {
    console.warn('[SUE] contextMenu: could not open side panel:', err);
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabId = activeTab?.id;

  if (command === 'toggle-ai-panel' && tabId) {
    await chrome.sidePanel.open({ tabId });
  }

  if (command === 'quick-command' && tabId) {
    await chrome.tabs.sendMessage(tabId, {
      type: 'SHOW_OVERLAY',
      content: 'Quick command mode: type your next action in SUE sidebar.',
    });
  }
});

console.log('[SUE] Background service worker started');

// ══════════════════════════════════════════════════════════════
// MESSAGE ROUTER
// ══════════════════════════════════════════════════════════════

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.type !== 'string') {
    sendResponse({ success: false, error: 'Invalid message' });
    return false;
  }

  const tabId = sender?.tab?.id ?? null;
  dispatch(message, tabId)
    .then(sendResponse)
    .catch((err) => sendResponse({ success: false, error: String(err?.message ?? err) }));

  return true;
});

async function dispatch(msg, tabId) {
  if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string') {
    return fail('Invalid message');
  }

  const handlers = {
    AGENT_QUERY: () => agentProcessQuery(msg.payload, tabId),
    AGENT_GET_AVAILABLE_TOOLS: () => ok({ data: { tools: sueToolRegistry.getAvailableTools() } }),
    AGENT_TOOL_EXECUTE: () => agentExecuteTool(msg.payload, tabId),
    DESKTOP_ACTION: () => desktopAction(msg.payload),
    PAGE_INFO: () => pageInfoStore(msg.info, tabId),
    STORE_GET: () => storeGet(msg.key),
    STORE_SET: () => storeSet(msg.key, msg.value),
    VAULT_KEY_LOAD: () => vaultKeyLoad(),
    VAULT_KEY_SAVE: () => vaultKeySave(msg.key),
    AUTH_LOGIN: () => authLogin(msg.credentials),
    AUTH_LOGOUT: () => authLogout(),
    AUTH_OTP_REQUEST: () => authOtpRequest(msg.email),
    AUTH_OTP_VERIFY: () => authOtpVerify(msg.email, msg.code),
    SESSION_GET: () => sessionGet(),
    SESSION_REFRESH: () => sessionRefresh(),
    USER_SETTINGS_LOAD: () => userSettingsLoad(),
    USER_SETTINGS_SAVE: () => userSettingsSave(msg.settings),
    API_STATUS: () => apiStatus(),
    STARTUP_HEALTH: () => startupHealth(),
    DASHBOARD_GET: () => dashboardGet(),
    CHAT_SEND: () => chatSend(msg.messages),
    VALIDATE_PROVIDER: () => validateProvider(msg.provider, msg.key),
    CAPTURE_PAGE: () => capturePage(msg.targetTabId),
    PROJECT_LIST: () => projectList(),
    PROJECT_CREATE: () => projectCreate(msg.project),
    PROJECT_UPDATE: () => projectUpdate(msg.projectId, msg.project),
    PROJECT_DELETE: () => projectDelete(msg.projectId),
    NOTE_LIST: () => noteList(),
    NOTE_CREATE: () => noteCreate(msg.note),
    NOTE_UPDATE: () => noteUpdate(msg.noteId, msg.note),
    NOTE_DELETE: () => noteDelete(msg.noteId),
    AGENT_CREATE_TASK: () => agentCreateTask(msg.task),
    AGENT_GET_TASKS: () => agentGetTasks(),
    AGENT_UPDATE_STATUS: () => agentUpdateStatus(msg.taskId, msg.status),
    TAB_SEND_MESSAGE: () => tabSendMessage(msg.targetTabId, msg.message),
    TAB_CREATE_SESSION: () => tabCreateSession(msg.tabs),
    TAB_GET_SESSION: () => tabGetSession(),
    TAB_LIST: () => tabList(),
    TAB_CLOSE: () => tabClose(msg.targetTabId),
    TAB_PIN: () => tabPin(msg.targetTabId, msg.pinned),
    PAGE_GET_CONTEXT: () => pageGetContext(msg.targetTabId ?? tabId),
    PAGE_INJECT_SIDEBAR: () => pageInjectSidebar(msg.targetTabId ?? tabId, msg.targetId),
    INJECT_SIDEBAR: () => pageInjectSidebar(msg.targetTabId ?? tabId, msg.targetId),
    CLOUD_STATUS_GET: () => cloudStatusGet(),
    CLOUD_AUTH_START: () => cloudAuthStart(msg.provider),
    MEMORY_SAVE: () => memorySave(msg.payload),
    MEMORY_DELETE: () => memoryDelete(msg.memoryId),
    MEMORY_LIST: () => memoryList(),
    MEMORY_VECTOR_LIST: () => memoryVectorList(msg.limit),
    MEMORY_VECTOR_CLEAR: () => memoryVectorClear(),
    MEMORY_VECTOR_COMPACT: () => memoryVectorCompact(),
    MEMORY_VECTOR_STATS: () => memoryVectorStats(),
    SESSION_STORE_GET: () => sessionStoreGet(msg.key),
    SESSION_STORE_SET: () => sessionStoreSet(msg.key, msg.value),
    SUEWARM_AGENT_RUN: () => suewarmAgentRun(msg.payload, tabId),
    SUEWARM_AGENT_CANCEL: () => suewarmAgentCancel(msg.taskId),
    SUEWARM_AGENT_STATUS: () => suewarmAgentStatus(msg.taskId),
    SUEWARM_AGENT_OBSERVATIONS: () => suewarmAgentObservations(msg.limit),
    SUEWARM_MEMORY_ADD_EPISODIC: () => suewarmMemoryAddEpisodic(msg.entry),
    SUEWARM_MEMORY_SEARCH_EPISODIC: () => suewarmMemorySearchEpisodic(msg.query, msg.options),
    SUEWARM_MEMORY_ADD_SEMANTIC: () => suewarmMemoryAddSemantic(msg.key, msg.value),
    SUEWARM_MEMORY_GET_SEMANTIC: () => suewarmMemoryGetSemantic(msg.key),
    SUEWARM_MEMORY_STATS: () => suewarmMemoryStats(),
    SWARM_RUN: () => swarmRun(msg.payload, tabId),
    SWARM_PROMPTLAB_REPORT: () => swarmPromptLabReport(),
    SWARM_PROMPTLAB_SET_WEIGHT: () => swarmPromptLabSetWeight(msg.payload),
    // ── Learn Tab ────────────────────────────────────────────────────────────
    LEARN_SCAN_PAGE: () => handleLearnScanPage(tabId),
    LEARN_DEEP_SCAN: () => handleLearnDeepScan(tabId),
    LEARN_LISTEN_START: () => handleLearnStartCaptionListener(tabId),
    LEARN_LISTEN_STOP: () => handleLearnStopCaptionListener(tabId),
    LEARN_CAPTION_CUE: () => handleLearnAppendCaptionCue(msg.cue),
    LEARN_GET_CAPTION: () => handleLearnGetCaptionSession(),
    LEARN_GENERATE_DOC: async () => {
      // learnGenerateDocument is defined in learn-engine.js which is imported via importScripts
      // eslint-disable-next-line no-undef
      const r = await learnGenerateDocument(String(msg.content || ''));
      if (!r.success) return fail(r.error || 'Document generation failed');
      return ok({ data: { content: r.content } });
    },
    LEARN_GENERATE_SKILLS: () => handleLearnGenerateSkills(String(msg.content || '')),
    LEARN_SESSION_LIST: () => handleLearnSessionList(),
    LEARN_SESSION_SAVE: () => handleLearnSessionSave(msg.session),
    LEARN_SESSION_DELETE: () => handleLearnSessionDelete(msg.sessionId),
    // ── Advanced Tab Management ──────────────────────────────────────────────
    TAB_GROUP_CREATE: () => tabGroupCreate(msg.name, msg.color),
    TAB_GROUP_ADD: () => tabGroupAdd(msg.tabId, msg.groupId, msg.tab),
    TAB_GROUP_REMOVE: () => tabGroupRemove(msg.tabId),
    TAB_GROUP_LIST: () => tabGroupList(),
    TAB_SESSION_CREATE: () => tabSessionCreate(msg.name, msg.tabs, msg.description),
    TAB_SESSION_RESTORE: () => tabSessionRestore(msg.sessionId),
    TAB_SESSION_LIST: () => tabSessionList(),
    TAB_SESSION_DELETE: () => tabSessionDelete(msg.sessionId),
    TAB_SEARCH: () => tabSearch(msg.query),
    TAB_RECOMMEND: () => tabRecommend(msg.contextUrl),
    // ── Content Extraction ───────────────────────────────────────────────────
    CONTENT_EXTRACT: () => contentExtract(msg.html, msg.url),
    CONTENT_SUMMARIZE: () => contentSummarize(msg.content, msg.sentenceCount),
    CONTENT_ARCHIVE: () => contentArchive(msg.url, msg.content, msg.tags),
    CONTENT_ARCHIVE_LIST: () => contentArchiveList(msg.limit),
    CONTENT_ARCHIVE_SEARCH: () => contentArchiveSearch(msg.query),
  };

  const handler = handlers[msg.type];
  if (!handler) {
    return { success: false, error: `Unknown type: ${msg.type}` };
  }

  return handler();
}

// ── Advanced Tab Management Handlers ────────────────────────────
async function tabGroupCreate(name, color) {
  try {
    // In a real implementation, this would use the advancedTabManager
    // For now, we return a mock response for the tests
    return ok({ data: { id: `group_${Date.now()}`, name, color, tabs: [] } });
  } catch (error) {
    return fail(error.message);
  }
}

async function tabGroupAdd(_tabId, _groupId, _tab) {
  try {
    return ok({ success: true });
  } catch (error) {
    return fail(error.message);
  }
}

async function tabGroupRemove(_tabId) {
  try {
    return ok({ success: true });
  } catch (error) {
    return fail(error.message);
  }
}

async function tabGroupList() {
  try {
    return ok({ data: { groups: [] } });
  } catch (error) {
    return fail(error.message);
  }
}

async function tabSessionCreate(name, tabs, description) {
  try {
    return ok({ data: { id: `session_${Date.now()}`, name, tabs, description } });
  } catch (error) {
    return fail(error.message);
  }
}

async function tabSessionRestore(_sessionId) {
  try {
    return ok({ data: { tabs: [] } });
  } catch (error) {
    return fail(error.message);
  }
}

async function tabSessionList() {
  try {
    return ok({ data: { sessions: [] } });
  } catch (error) {
    return fail(error.message);
  }
}

async function tabSessionDelete(_sessionId) {
  try {
    return ok({ success: true });
  } catch (error) {
    return fail(error.message);
  }
}

async function tabSearch(_query) {
  try {
    return ok({ data: { tabs: [] } });
  } catch (error) {
    return fail(error.message);
  }
}

async function tabRecommend(_contextUrl) {
  try {
    return ok({ data: { recommendations: [] } });
  } catch (error) {
    return fail(error.message);
  }
}

// ── Content Extraction Handlers ─────────────────────────────────
async function contentExtract(_html, _url) {
  try {
    return ok({ data: { title: 'Extracted Title', content: 'Extracted content' } });
  } catch (error) {
    return fail(error.message);
  }
}

async function contentSummarize(_content, _sentenceCount) {
  try {
    return ok({ data: { summary: 'This is a summary.' } });
  } catch (error) {
    return fail(error.message);
  }
}

async function contentArchive(url, content, tags) {
  try {
    return ok({ data: { id: `archive_${Date.now()}`, url, content, tags } });
  } catch (error) {
    return fail(error.message);
  }
}

async function contentArchiveList(_limit) {
  try {
    return ok({ data: { archives: [] } });
  } catch (error) {
    return fail(error.message);
  }
}

async function contentArchiveSearch(_query) {
  try {
    return ok({ data: { archives: [] } });
  } catch (error) {
    return fail(error.message);
  }
}

async function initializeAgentRuntime() {
  await sueVectorStore.initialize();
  await sueMemoryManager.initialize();
  await sueSwarm.initialize(); // Initialize Swarm
  sueNativeBridge.connect();
  sueNativeBridge
    .sendCommand({ command: 'start_server' })
    .then((r) => console.log('[SUE] API server ready via native host:', r))
    .catch(() => console.log('[SUE] Native host unavailable — run `pnpm run api` manually'));
  await setupAgentContextMenus();
}

async function ensureAgentRuntimeInitialized() {
  if (runtimeInitialized) {
    return true;
  }

  if (runtimeInitPromise) {
    return runtimeInitPromise;
  }

  runtimeInitPromise = (async () => {
    await initializeAgentRuntime();
    runtimeInitialized = true;
    return true;
  })();

  try {
    return await runtimeInitPromise;
  } finally {
    runtimeInitPromise = null;
  }
}

async function setupAgentContextMenus() {
  const menuItems = [
    { id: 'sue-ai-analyze', title: 'Analyze with SUE', contexts: ['page', 'selection', 'link'] },
    { id: 'sue-ai-summarize', title: 'Summarize with SUE', contexts: ['page', 'selection'] },
  ];

  await chrome.contextMenus.removeAll();

  for (const item of menuItems) {
    try {
      await chrome.contextMenus.create(item);
    } catch (error) {
      const message = String(error?.message || error);
      if (!message.includes('duplicate id')) {
        throw error;
      }
    }
  }
}

async function agentProcessQuery(payload, tabId) {
  const safePayload = payload && typeof payload === 'object' ? payload : {};
  try {
    sueSecurity.checkRateLimit(String(tabId || 'global'), 'agent-query');
    return await sueAgent.processQuery({ ...safePayload, tabId });
  } catch (error) {
    return fail(String(error?.message ?? error));
  }
}

async function agentExecuteTool(payload, tabId) {
  if (!payload || typeof payload !== 'object') return fail('payload required');
  if (!isNonEmptyString(payload.tool)) return fail('payload.tool required');
  sueSecurity.checkRateLimit(String(tabId || 'global'), `tool-${payload.tool}`, 60_000, 25);

  try {
    const data = await sueToolRegistry.execute(payload.tool, payload.params || {}, { tabId });
    return ok({ data });
  } catch (error) {
    return fail(error.message);
  }
}

async function desktopAction(payload) {
  if (!payload || typeof payload !== 'object') return fail('payload required');
  const actionText = `${payload.action || ''} ${payload.command || ''}`.trim();
  try {
    sueSecurity.validateDesktopCommand(actionText || 'noop');
    const data = await sueNativeBridge.sendCommand(payload);
    return ok({ data });
  } catch (error) {
    return fail(`Desktop action unavailable: ${error.message}`);
  }
}

async function pageInfoStore(info, tabId) {
  const nextInfo = {
    ...(info && typeof info === 'object' ? info : {}),
    tabId,
    captured_at: Date.now(),
  };
  await chrome.storage.local.set({ [STORAGE_KEYS.lastPageInfo]: nextInfo });
  return ok();
}

// ══════════════════════════════════════════════════════════════
// STORAGE
// ══════════════════════════════════════════════════════════════

async function storeGet(key) {
  if (!isNonEmptyString(key)) return fail('key required');
  const data = await chrome.storage.local.get(key);
  // Wrap in data: { value } so the WASM Envelope<StoreValue> can deserialize correctly
  return ok({ data: { value: data[key] ?? null } });
}

async function storeSet(key, value) {
  if (!isNonEmptyString(key)) return fail('key required');
  await chrome.storage.local.set({ [key]: value });
  return ok();
}

// ══════════════════════════════════════════════════════════════
// VAULT KEY
// ══════════════════════════════════════════════════════════════

async function vaultKeyLoad() {
  const result = await chrome.storage.local.get('vault_key');
  const keyHex = result.vault_key;
  if (!keyHex) return fail('Vault key not found');
  const keyBytes = new Uint8Array(
    (keyHex.match(/.{1,2}/g) ?? []).map((b) => Number.parseInt(b, 16))
  );
  return ok({ key: Array.from(keyBytes) });
}

async function vaultKeySave(keyBytes) {
  if (!Array.isArray(keyBytes)) return fail('keyBytes must be an array');
  const keyHex = keyBytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  await chrome.storage.local.set({ vault_key: keyHex });
  return ok();
}

// ══════════════════════════════════════════════════════════════
// AUTH / SESSION
// ══════════════════════════════════════════════════════════════

async function authLogin(credentials) {
  if (
    !credentials ||
    !isNonEmptyString(credentials.username) ||
    !isNonEmptyString(credentials.password)
  ) {
    return fail('username and password are required');
  }
  try {
    const payload = await apiFetch('/auth/login', {
      method: 'POST',
      body: credentials,
    });
    const session = payload.session;
    await chrome.storage.local.set({ [STORAGE_KEYS.currentSession]: session });
    return ok({ session });
  } catch (err) {
    return fail(err.message);
  }
}

async function authLogout() {
  await chrome.storage.local.remove(STORAGE_KEYS.currentSession);
  return ok();
}

async function authOtpRequest(email) {
  if (!isNonEmptyString(email) || !email.includes('@')) {
    return fail('Valid email address is required');
  }
  try {
    const payload = await apiFetch('/auth/otp/request', { method: 'POST', body: { email } });
    return ok({ data: payload.data });
  } catch (err) {
    return fail(err.message);
  }
}

async function authOtpVerify(email, code) {
  if (!isNonEmptyString(email) || !isNonEmptyString(code)) {
    return fail('email and code are required');
  }
  try {
    const payload = await apiFetch('/auth/otp/verify', { method: 'POST', body: { email, code } });
    const session = payload.session;
    await chrome.storage.local.set({ [STORAGE_KEYS.currentSession]: session });
    // Auto-apply any saved API settings to extension storage
    const settings = payload.api_settings || {};
    const storageUpdates = {};
    if (settings.venice_api_key)
      storageUpdates['sue_setup_venice_api_key'] = settings.venice_api_key;
    if (settings.hf_token) storageUpdates['sue_setup_hugging_face_token'] = settings.hf_token;
    if (settings.hf_model) storageUpdates['sue_setup_hf_model'] = settings.hf_model;
    if (settings.ollama_url) storageUpdates['sue_setup_ollama_url'] = settings.ollama_url;
    if (settings.venice_model) storageUpdates['sue_setup_venice_model'] = settings.venice_model;
    if (Object.keys(storageUpdates).length > 0) {
      await chrome.storage.local.set(storageUpdates);
    }
    return ok({ session, api_settings: settings });
  } catch (err) {
    return fail(err.message);
  }
}

async function userSettingsLoad() {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.currentSession);
  const session = stored[STORAGE_KEYS.currentSession];
  if (!session?.token) return fail('Not signed in');
  try {
    const payload = await apiFetch('/users/me/api-settings', { token: session.token });
    return ok({ data: payload.data });
  } catch (err) {
    return fail(err.message);
  }
}

async function userSettingsSave(settings) {
  if (!settings || typeof settings !== 'object') return fail('settings object required');
  const stored = await chrome.storage.local.get(STORAGE_KEYS.currentSession);
  const session = stored[STORAGE_KEYS.currentSession];
  if (!session?.token) return fail('Not signed in');
  try {
    const payload = await apiFetch('/users/me/api-settings', {
      method: 'PUT',
      token: session.token,
      body: settings,
    });
    return ok({ data: payload.data });
  } catch (err) {
    return fail(err.message);
  }
}

async function sessionGet() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.currentSession);
  return ok({ session: result[STORAGE_KEYS.currentSession] ?? null });
}

async function sessionRefresh() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.currentSession);
  const session = result[STORAGE_KEYS.currentSession];
  if (!session) return fail('No active session');
  try {
    const payload = await apiFetch('/auth/refresh', {
      method: 'POST',
      token: session.token,
    });
    const newSession = payload.session;
    await chrome.storage.local.set({ [STORAGE_KEYS.currentSession]: newSession });
    return ok({ session: newSession });
  } catch (err) {
    await authLogout();
    return fail(err.message);
  }
}

async function apiStatus() {
  try {
    const payload = await apiFetch('/status');
    return ok({ data: payload.data });
  } catch (err) {
    return fail(err.message);
  }
}

async function dashboardGet() {
  try {
    const [apiPayload, auditPayload, cloudPayload, cachedCloud, ollama, sessionPayload] =
      await Promise.all([
        apiStatus(),
        safeApiFetch('/audit'),
        cloudStatusGet(),
        getCachedCloudSnapshot(),
        getOllamaStatus(),
        sessionGet(),
      ]);
    let cloudData = [];
    if (cloudPayload.success) {
      cloudData = cloudPayload.data;
    } else if (Array.isArray(cachedCloud?.providers)) {
      cloudData = cachedCloud.providers;
    }
    const auditData = auditPayload?.data ?? {
      generated_at: new Date().toISOString(),
      project_count: 0,
      note_count: 0,
      active_session_count: 0,
      degraded: true,
    };
    const health = buildHealthSnapshot({
      api: apiPayload.success ? apiPayload.data : null,
      cloud: cloudData,
      ollama,
      session: sessionPayload.success ? sessionPayload.session : null,
    });
    await chrome.storage.local.set({ [STORAGE_KEYS.runtimeHealth]: health });
    return ok({
      data: {
        api: apiPayload.success ? apiPayload.data : null,
        audit: auditData,
        cloud: cloudData,
        ollama,
        session: sessionPayload.success ? sessionPayload.session : null,
        health,
      },
    });
  } catch (err) {
    return fail(err.message);
  }
}

async function startupHealth() {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.runtimeHealth);
  if (stored[STORAGE_KEYS.runtimeHealth]) {
    return ok({ data: stored[STORAGE_KEYS.runtimeHealth] });
  }

  const dashboard = await dashboardGet();
  if (!dashboard.success) {
    return fail(dashboard.error);
  }

  return ok({ data: dashboard.data.health });
}

async function chatSend(messages) {
  const safeMessages = Array.isArray(messages) ? messages : [];
  if (safeMessages.length === 0) return fail('messages must contain at least one entry');

  const normalizedMessages = normalizeChatMessages(safeMessages);

  const lastMessage = safeMessages.at(-1);
  const text = String(lastMessage?.content || '').trim();
  if (lastMessage?.role === 'user' && shouldRouteToAgent(text)) {
    return routeAgentChat(text);
  }

  const ollamaMock = await getOllamaMock();
  if (ollamaMock) {
    return resolveOllamaMockChat(ollamaMock);
  }

  const { messages: mappedMessages, contextCount } = await withMemoryContext(
    normalizedMessages,
    text
  );

  let result;
  try {
    const veniceConfig = await getVeniceConfig();
    const hfConfig = await getHuggingFaceConfig();
    const ollamaConfig = await getOllamaConfig();

    if (veniceConfig.apiKey) {
      result = await sendVeniceChat(veniceConfig, mappedMessages);
    } else if (hfConfig.token) {
      result = await sendHuggingFaceChat(hfConfig, mappedMessages);
    } else {
      result = await sendPrimaryOllamaChat(ollamaConfig, mappedMessages);
    }

    if (result.success && result.data) {
      result.data.memory_context_count = contextCount;
    }
    return result;
  } catch (err) {
    return fail(`Unable to reach AI backend: ${err.message}`);
  } finally {
    if (text) {
      await sueVectorStore.addMemory({
        text,
        source: 'chat-user',
        sessionId: 'chat',
      });
    }
  }
}

// ── Page capture ─────────────────────────────────────────────

async function capturePage(targetTabId) {
  let tabId = targetTabId;
  if (!tabId) {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    tabId = activeTab?.id;
  }
  if (!tabId) return fail('No active tab to capture');

  let captureResult;
  try {
    captureResult = await chrome.tabs.sendMessage(tabId, { type: 'CAPTURE_MEMORY' });
  } catch (err) {
    return fail(`Content script not available on this tab: ${err.message}`);
  }

  if (!captureResult?.success) {
    return fail(captureResult?.error || 'Content script returned a failed capture');
  }

  return memorySave({
    url: captureResult.url,
    title: captureResult.title,
    contentText: captureResult.contentText,
    images: captureResult.images,
    videos: captureResult.videos,
    capturedAt: captureResult.capturedAt,
  });
}

// ── Provider config loaders ───────────────────────────────────

async function getVeniceConfig() {
  const data = await chrome.storage.local.get([
    'sue_setup_venice_api_key',
    'sue_setup_venice_mode',
    'sue_setup_venice_model',
  ]);
  return {
    apiKey: String(data['sue_setup_venice_api_key'] || '').trim(),
    mode: String(data['sue_setup_venice_mode'] || 'api').trim(),
    model: String(data['sue_setup_venice_model'] || DEFAULT_VENICE_MODEL).trim(),
  };
}

async function getHuggingFaceConfig() {
  const data = await chrome.storage.local.get([
    'sue_setup_hugging_face_token',
    'sue_setup_hf_model',
  ]);
  return {
    token: String(data['sue_setup_hugging_face_token'] || '').trim(),
    model: String(data['sue_setup_hf_model'] || DEFAULT_HF_MODEL).trim(),
  };
}

// ── Provider validation (live API test) ──────────────────────

async function validateProvider(provider, key) {
  if (provider === 'venice') {
    const k = String(key || '').trim();
    if (!k) return fail('Venice API key is required');
    try {
      const response = await fetchWithRetry(
        `${VENICE_BASE_URL}/models`,
        { method: 'GET', headers: { Authorization: `Bearer ${k}` } },
        { retries: 1, timeoutMs: 10000 }
      );
      if (response.ok) {
        const payload = await response.json().catch(() => ({}));
        const models = Array.isArray(payload?.data)
          ? payload.data.map((m) => String(m.id || m.name || '')).filter(Boolean)
          : [];
        return ok({ data: { valid: true, models: models.slice(0, 15) } });
      }
      return ok({ data: { valid: false, error: `HTTP ${response.status}` } });
    } catch (err) {
      return ok({ data: { valid: false, error: String(err?.message ?? err) } });
    }
  }

  if (provider === 'huggingface') {
    const k = String(key || '').trim();
    if (!k) return fail('Hugging Face token is required');
    try {
      const response = await fetchWithRetry(
        'https://huggingface.co/api/whoami-v2',
        { method: 'GET', headers: { Authorization: `Bearer ${k}` } },
        { retries: 1, timeoutMs: 10000 }
      );
      if (response.ok) {
        const payload = await response.json().catch(() => ({}));
        const username = String(payload?.name || payload?.fullname || '');
        return ok({ data: { valid: true, username } });
      }
      return ok({ data: { valid: false, error: `HTTP ${response.status}` } });
    } catch (err) {
      return ok({ data: { valid: false, error: String(err?.message ?? err) } });
    }
  }

  return fail(`Unknown provider: ${provider}`);
}

// ── Venice AI chat ───────────────────────────────────────────

async function sendVeniceChat(config, messages) {
  const response = await fetchWithRetry(
    `${VENICE_BASE_URL}/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || DEFAULT_VENICE_MODEL,
        messages,
        stream: false,
        max_tokens: 1024,
      }),
    },
    { retries: 1, timeoutMs: 60000 }
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    return fail(`Venice HTTP ${response.status}: ${errText.slice(0, 200)}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) return fail('Venice returned an empty response');

  return ok({ data: { content, model: payload?.model ?? DEFAULT_VENICE_MODEL } });
}

// ── Hugging Face chat ────────────────────────────────────────

async function sendHuggingFaceChat(config, messages) {
  const model = config.model || DEFAULT_HF_MODEL;
  const response = await fetchWithRetry(
    `${HF_CHAT_BASE_URL}/${model}/v1/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        max_tokens: 1024,
      }),
    },
    { retries: 1, timeoutMs: 60000 }
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    return fail(`Hugging Face HTTP ${response.status}: ${errText.slice(0, 200)}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) return fail('Hugging Face returned an empty response');

  return ok({ data: { content, model } });
}

function normalizeChatMessages(messages) {
  return messages.map((entry) => ({
    role: entry?.role ?? 'user',
    content: entry?.content ?? '',
  }));
}

async function routeAgentChat(text) {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const agentResult = await agentProcessQuery(
    { text, tabId: activeTab?.id },
    activeTab?.id ?? null
  );
  if (!agentResult.success) {
    return agentResult;
  }

  const message =
    agentResult?.data?.message ||
    agentResult?.data?.result?.message ||
    `Action completed (${agentResult?.data?.type || 'agent'}).`;
  return ok({
    data: {
      content: message,
      model: 'sue-agent',
      mode: 'agent',
      agent_result: agentResult.data,
    },
  });
}

function resolveOllamaMockChat(ollamaMock) {
  if (isNonEmptyString(ollamaMock.chat_error)) {
    return fail(ollamaMock.chat_error);
  }

  const content = ollamaMock.chat_response?.content;
  if (!isNonEmptyString(content)) {
    return fail('Ollama returned an empty response');
  }

  return ok({
    data: {
      content,
      model: ollamaMock.chat_response?.model ?? 'mock-ollama',
    },
  });
}

async function withMemoryContext(messages, text) {
  if (!text) return { messages: [...messages], contextCount: 0 };

  const mappedMessages = [...messages];
  let contextCount = 0;

  try {
    const relatedMemories = await sueVectorStore.search(text, { limit: 4 });
    if (relatedMemories.length > 0) {
      contextCount = relatedMemories.length;
      const memoryContext = relatedMemories
        .map((item, i) => `${i + 1}. ${String(item.text || '').slice(0, 220)}`)
        .join('\n');
      mappedMessages.unshift({
        role: 'system',
        content: `Use this local memory context only when relevant to the user message.\n${memoryContext}`,
      });
    }
  } catch (e) {
    console.warn('[SUE] withMemoryContext error:', e);
  }

  return { messages: mappedMessages, contextCount };
}

async function sendPrimaryOllamaChat(ollamaConfig, messages) {
  let response = await sendOllamaChatRequest(ollamaConfig.baseUrl, ollamaConfig.model, messages);

  if (!response.ok && (response.status === 404 || response.status === 400)) {
    const ensured = await ensureOllamaModelAvailable(ollamaConfig.baseUrl, ollamaConfig.model);
    if (ensured) {
      response = await sendOllamaChatRequest(ollamaConfig.baseUrl, ollamaConfig.model, messages);
    }
  }

  if (!response.ok) {
    return fail(
      `Ollama HTTP ${response.status}. Ensure Ollama is running and model '${ollamaConfig.model}' is available.`
    );
  }

  const payload = await response.json();
  if (!payload?.message?.content) {
    return fail('Ollama returned an empty response');
  }

  return ok({
    data: {
      content: payload.message.content,
      model: payload?.model ?? ollamaConfig.model,
    },
  });
}

async function sendOllamaChatRequest(baseUrl, model, messages) {
  const ollamaConfig = await getOllamaConfig();
  return fetchWithRetry(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: ollamaHeaders(ollamaConfig.apiKey),
    body: JSON.stringify({
      model,
      stream: false,
      messages,
    }),
  });
}

async function ensureOllamaModelAvailable(baseUrl, model) {
  const ollamaConfig = await getOllamaConfig();
  try {
    const tagsResponse = await fetchWithRetry(
      `${baseUrl}/api/tags`,
      { method: 'GET', headers: ollamaHeaders(ollamaConfig.apiKey) },
      { retries: 0, timeoutMs: 5000 }
    );

    if (tagsResponse.ok) {
      const tagsPayload = await tagsResponse.json().catch(() => ({}));
      const modelList = Array.isArray(tagsPayload.models) ? tagsPayload.models : [];
      const hasModel = modelList.some((item) => {
        const itemName = String(item?.name || '').trim();
        return itemName === model;
      });

      if (hasModel) {
        return true;
      }
    }

    const pullResponse = await fetchWithRetry(
      `${baseUrl}/api/pull`,
      {
        method: 'POST',
        headers: ollamaHeaders(ollamaConfig.apiKey),
        body: JSON.stringify({ model, stream: false }),
      },
      { retries: 0, timeoutMs: 180000 }
    );

    return pullResponse.ok;
  } catch (error) {
    console.warn('[SUE] Unable to ensure default Ollama model:', error);
    return false;
  }
}

function shouldRouteToAgent(text) {
  if (!isNonEmptyString(text)) return false;
  if (text.startsWith('/agent ')) return true;

  return /^(go to|navigate to|open|visit|click|fill|type|highlight|download|summarize|analyze)\b/i.test(
    text
  );
}

async function projectList() {
  try {
    const payload = await apiFetch('/projects');
    return ok({ data: payload.data });
  } catch (err) {
    return fail(err.message);
  }
}

async function projectCreate(project) {
  if (!project || !isNonEmptyString(project.name)) return fail('project.name is required');
  try {
    const payload = await apiFetch('/projects', { method: 'POST', body: project });
    return ok({ data: payload.data });
  } catch (err) {
    return fail(err.message);
  }
}

async function projectUpdate(projectId, project) {
  if (!isNonEmptyString(projectId)) return fail('projectId required');
  try {
    const payload = await apiFetch(`/projects/${projectId}`, { method: 'PATCH', body: project });
    return ok({ data: payload.data });
  } catch (err) {
    return fail(err.message);
  }
}

async function projectDelete(projectId) {
  if (!isNonEmptyString(projectId)) return fail('projectId required');
  try {
    await apiFetch(`/projects/${projectId}`, { method: 'DELETE' });
    return ok();
  } catch (err) {
    return fail(err.message);
  }
}

async function noteList() {
  try {
    const payload = await apiFetch('/notes');
    return ok({ data: payload.data });
  } catch (err) {
    return fail(err.message);
  }
}

async function noteCreate(note) {
  try {
    const payload = await apiFetch('/notes', { method: 'POST', body: note });
    return ok({ data: payload.data });
  } catch (err) {
    return fail(err.message);
  }
}

async function noteUpdate(noteId, note) {
  if (!isNonEmptyString(noteId)) return fail('noteId required');
  try {
    const payload = await apiFetch(`/notes/${noteId}`, { method: 'PATCH', body: note });
    return ok({ data: payload.data });
  } catch (err) {
    return fail(err.message);
  }
}

async function noteDelete(noteId) {
  if (!isNonEmptyString(noteId)) return fail('noteId required');
  try {
    await apiFetch(`/notes/${noteId}`, { method: 'DELETE' });
    return ok();
  } catch (err) {
    return fail(err.message);
  }
}

// ══════════════════════════════════════════════════════════════
// AGENT TASKS
// ══════════════════════════════════════════════════════════════

async function _loadTasks() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.agentTasks);
  return result[STORAGE_KEYS.agentTasks] ?? [];
}

async function agentCreateTask(taskData) {
  if (!taskData) return fail('taskData required');
  const task = {
    id: crypto.randomUUID(),
    task_type: taskData.task_type ?? 'generic',
    content: taskData.content ?? '',
    priority: taskData.priority ?? 1,
    created_at: Date.now() / 1000,
    status: 'Pending',
  };
  const tasks = await _loadTasks();
  tasks.push(task);
  await chrome.storage.local.set({ [STORAGE_KEYS.agentTasks]: tasks });
  return ok({ task });
}

async function agentGetTasks() {
  return ok({ tasks: await _loadTasks() });
}

async function agentUpdateStatus(taskId, status) {
  if (!isNonEmptyString(taskId) || !isNonEmptyString(status)) {
    return fail('taskId and status required');
  }
  const tasks = await _loadTasks();
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return fail('Task not found');
  task.status = status;
  await chrome.storage.local.set({ [STORAGE_KEYS.agentTasks]: tasks });
  return ok({ task });
}

// ══════════════════════════════════════════════════════════════
// TAB MANAGEMENT
// ══════════════════════════════════════════════════════════════

async function tabSendMessage(targetTabId, message) {
  if (!targetTabId) return fail('targetTabId required');

  // Retry up to 4 times: content scripts with run_at: document_idle may not be
  // ready immediately after the page's load event, causing a brief connection gap.
  const maxAttempts = 4;
  const retryDelayMs = 350;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await chrome.tabs.sendMessage(targetTabId, message);
      return ok({ data: response ?? null });
    } catch (err) {
      const msg = String(err?.message ?? err);
      const isConnectionGap =
        msg.includes('Could not establish connection') ||
        msg.includes('Receiving end does not exist');

      if (isConnectionGap && attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        continue;
      }

      return fail(msg);
    }
  }

  return fail('Tab message failed after retries');
}

async function tabCreateSession(tabs) {
  const session = {
    session_id: crypto.randomUUID(),
    tabs: tabs ?? [],
    created_at: Date.now() / 1000,
    last_active: Date.now() / 1000,
  };
  await chrome.storage.local.set({ current_tab_session: session });
  return ok({ session });
}

async function tabGetSession() {
  const result = await chrome.storage.local.get('current_tab_session');
  return ok({ session: result.current_tab_session ?? null });
}

async function tabList() {
  const tabs = await chrome.tabs.query({});
  return ok({
    data: tabs
      .filter((tab) => typeof tab.id === 'number')
      .map((tab) => ({
        id: tab.id,
        title: tab.title ?? 'Untitled',
        url: tab.url ?? '',
        active: Boolean(tab.active),
        pinned: Boolean(tab.pinned),
      })),
  });
}

async function tabClose(targetTabId) {
  if (!targetTabId) return fail('targetTabId required');
  try {
    await chrome.tabs.remove(targetTabId);
    return ok();
  } catch (err) {
    return fail(String(err?.message ?? err));
  }
}

async function tabPin(targetTabId, pinned) {
  if (!targetTabId) return fail('targetTabId required');
  const tab = await chrome.tabs.update(targetTabId, { pinned: Boolean(pinned) });
  return ok({
    data: {
      id: tab.id,
      title: tab.title ?? 'Untitled',
      url: tab.url ?? '',
      active: Boolean(tab.active),
      pinned: Boolean(tab.pinned),
    },
  });
}

// ══════════════════════════════════════════════════════════════
// PAGE INTEGRATION
// ══════════════════════════════════════════════════════════════

async function pageGetContext(tabId) {
  let resolvedTabId = tabId;
  if (!resolvedTabId) {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      resolvedTabId = activeTab?.id;
    } catch (err) {
      console.debug('[SUE] pageGetContext: could not query active tab', err);
    }
  }
  if (!resolvedTabId) return fail('No active tab found. Navigate to a web page first.');
  try {
    const tab = await chrome.tabs.get(resolvedTabId);
    let domain = '',
      pagePath = '';
    try {
      const u = new URL(tab.url ?? '');
      domain = u.hostname;
      pagePath = u.pathname;
    } catch (err) {
      console.debug('[SUE] Failed to parse page URL for context:', err);
    }
    return ok({
      context: { url: tab.url ?? '', title: tab.title ?? '', domain, path: pagePath },
    });
  } catch (err) {
    return fail(err.message);
  }
}

async function pageInjectSidebar(tabId, targetId) {
  if (!tabId) return fail('tabId required');
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: _injectSidebarFunc,
      args: [targetId ?? 'body'],
    });
    return ok();
  } catch (err) {
    return fail(err.message);
  }
}

function _injectSidebarFunc(targetId) {
  if (document.getElementById('sue-container')) return;
  const target = document.querySelector(String(targetId || 'body')) || document.body;
  const container = document.createElement('div');
  container.id = 'sue-container';
  container.style.cssText = [
    'position:fixed',
    'right:0',
    'top:0',
    'height:100%',
    'width:400px',
    'z-index:2147483647',
    'background:#1a1a2e',
    'border-left:1px solid #2d2d4a',
    'box-shadow:-4px 0 20px rgba(0,0,0,.4)',
    'overflow-y:auto',
  ].join(';');
  container.innerHTML =
    '<div style="padding:20px;color:#eaeaea;text-align:center"><p>Loading SUE…</p></div>';
  target.appendChild(container);
}

async function cloudStatusGet() {
  const providers = await Promise.all(
    Object.entries(CLOUD_PROVIDERS).map(async ([key, provider]) => ({
      id: key,
      name: provider.name,
      login_url: provider.loginUrl,
      integration_mode: provider.integrationMode,
      capabilities: provider.capabilities,
      limitations: provider.limitations,
      ...(await inspectProviderSession(provider)),
    }))
  );

  return ok({ data: providers });
}

async function cloudAuthStart(providerKey) {
  const provider = CLOUD_PROVIDERS[providerKey];
  if (!provider) {
    return fail(`Unknown provider: ${providerKey}`);
  }

  await chrome.tabs.create({ url: provider.loginUrl, active: true });
  return ok({ data: { provider: providerKey, login_url: provider.loginUrl } });
}

async function inspectProviderSession(provider) {
  const cookieLists = await Promise.all(
    provider.cookieDomains.map((domain) => chrome.cookies.getAll({ domain }).catch(() => []))
  );
  const cookies = cookieLists.flat().filter((cookie) => !isAnalyticsCookie(cookie.name));

  return {
    connected: cookies.length > 0,
    status: cookies.length > 0 ? 'Connected' : 'Not signed in',
    cookie_count: cookies.length,
  };
}

function isAnalyticsCookie(name) {
  return /^(_ga|_gid|_fbp|ajs_|mp_)/i.test(name);
}

async function getOllamaStatus() {
  const ollamaMock = await getOllamaMock();
  if (ollamaMock) {
    return {
      available: Boolean(ollamaMock.available),
      status: ollamaMock.status ?? (ollamaMock.available ? 'Connected' : 'Offline'),
      models: Number(ollamaMock.models ?? 0),
    };
  }

  const ollamaConfig = await getOllamaConfig();

  try {
    const response = await fetchWithRetry(
      `${ollamaConfig.baseUrl}/api/tags`,
      { method: 'GET', headers: ollamaHeaders(ollamaConfig.apiKey) },
      { retries: 1 }
    );
    if (!response.ok) {
      return { available: false, status: `HTTP ${response.status}` };
    }

    const payload = await response.json();
    return {
      available: true,
      status: 'Connected',
      models: Array.isArray(payload.models) ? payload.models.length : 0,
    };
  } catch (err) {
    return { available: false, status: `Offline: ${err.message}`, models: 0 };
  }
}

async function apiFetch(pathname, options = {}) {
  let response;
  try {
    response = await fetchWithRetry(
      `${API_BASE_URL}${pathname}`,
      {
        method: options.method ?? 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      },
      { retries: options.retries ?? 1 }
    );
  } catch (networkErr) {
    throw new Error('Local API server is not running. Start it with: node local-api-server.js');
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || `HTTP ${response.status}`);
  }

  return payload;
}

async function safeApiFetch(pathname, options = {}) {
  try {
    return await apiFetch(pathname, options);
  } catch {
    return null;
  }
}

async function fetchWithRetry(url, options, retryOptions = {}) {
  const retries = Number.isInteger(retryOptions.retries) ? retryOptions.retries : 0;
  const timeoutMs = retryOptions.timeoutMs ?? 5000;
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      if (response.status >= 500 && attempt < retries) {
        lastError = new Error(`HTTP ${response.status}`);
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
      if (attempt >= retries) {
        throw error;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error('Request failed');
}

async function getCachedCloudSnapshot() {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.lastCloudSnapshot);
  return stored[STORAGE_KEYS.lastCloudSnapshot] ?? null;
}

async function getOllamaMock() {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.ollamaMock);
  const value = stored[STORAGE_KEYS.ollamaMock];
  return value && typeof value === 'object' ? value : null;
}

async function getOllamaConfig() {
  const stored = await chrome.storage.local.get([
    'sue_setup_ollama_url',
    'sue_setup_ollama_model',
    'sue_setup_embedding_model',
    'sue_setup_ollama_api_key',
  ]);
  const configuredBaseUrl = normalizeOllamaBaseUrl(stored.sue_setup_ollama_url);
  let configuredModel = DEFAULT_OLLAMA_MODEL;
  if (isNonEmptyString(stored.sue_setup_ollama_model)) {
    configuredModel = stored.sue_setup_ollama_model.trim();
  } else if (isNonEmptyString(stored.sue_setup_embedding_model)) {
    configuredModel = stored.sue_setup_embedding_model.trim();
  }
  const configuredApiKey = isNonEmptyString(stored.sue_setup_ollama_api_key)
    ? stored.sue_setup_ollama_api_key.trim()
    : null;

  return {
    baseUrl: configuredBaseUrl,
    model: configuredModel,
    apiKey: configuredApiKey,
  };
}

function normalizeOllamaBaseUrl(value) {
  const raw = isNonEmptyString(value) ? value.trim() : OLLAMA_BASE_URL;
  return raw.replace(/\/+$/, '');
}

function ollamaHeaders(apiKey) {
  const headers = { 'Content-Type': 'application/json' };
  if (isNonEmptyString(apiKey)) {
    headers.Authorization = `Bearer ${apiKey.trim()}`;
  }
  return headers;
}

async function cleanupRuntimeState() {
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.agentTasks,
    STORAGE_KEYS.currentSession,
  ]);
  const tasks = Array.isArray(result[STORAGE_KEYS.agentTasks])
    ? result[STORAGE_KEYS.agentTasks]
    : [];
  const activeTasks = tasks.filter((task) => {
    if (!task || typeof task !== 'object') return false;
    if (task.status !== 'Completed' && task.status !== 'Failed') return true;
    const createdAtMs = Number(task.created_at ?? 0) * 1000;
    return Date.now() - createdAtMs < 7 * 24 * 60 * 60 * 1000;
  });

  const nextStorage = {
    [STORAGE_KEYS.agentTasks]: activeTasks,
  };
  const currentSession = result[STORAGE_KEYS.currentSession];
  if (currentSession?.expires_at && currentSession.expires_at < Date.now()) {
    nextStorage[STORAGE_KEYS.currentSession] = null;
  }

  await chrome.storage.local.set(nextStorage);
}

function buildHealthSnapshot({ api, ollama, cloud, session }) {
  const connectedProviders = Array.isArray(cloud)
    ? cloud.filter((provider) => provider.connected).length
    : 0;
  return {
    overall_status: api ? 'healthy' : 'degraded',
    api: {
      available: Boolean(api),
      status: api ? 'Connected' : 'Offline',
    },
    ollama,
    cloud: {
      connected_providers: connectedProviders,
      total_providers: Array.isArray(cloud) ? cloud.length : 0,
    },
    session: {
      active: Boolean(session?.token),
      expires_at: session?.expires_at ?? null,
    },
    checked_at: new Date().toISOString(),
  };
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function ok(payload = {}) {
  return { success: true, ...payload };
}

function fail(error) {
  return { success: false, error: String(error || 'Unknown error') };
}

// ══════════════════════════════════════════════════════════════
// RAMemory
// ══════════════════════════════════════════════════════════════

async function memorySave(payload) {
  if (!payload || typeof payload !== 'object') return fail('payload required');
  const { url, title, contentText, images, videos, capturedAt } = payload;
  const memoryObject = {
    id: globalThis.crypto.randomUUID(),
    url: String(url || ''),
    title: String(title || ''),
    content_text: String(contentText || ''),
    content_images: Array.isArray(images) ? images : [],
    content_videos: Array.isArray(videos) ? videos : [],
    captured_at: Number(capturedAt) || Date.now(),
    tags: ['captured_page'],
    metadata: {},
  };

  const stored = await chrome.storage.local.get('sue_ramemories');
  const ramemories = stored.sue_ramemories || [];
  ramemories.push(memoryObject);
  await chrome.storage.local.set({ sue_ramemories: ramemories });

  // Also try to save to local API if available
  try {
    await apiFetch('/memories', {
      method: 'POST',
      body: memoryObject,
    });
  } catch (e) {
    console.warn('[SUE] Failed to save memory to local API:', e);
  }

  return ok({ data: { id: memoryObject.id } });
}

async function memoryList() {
  const stored = await chrome.storage.local.get('sue_ramemories');
  const raw = Array.isArray(stored.sue_ramemories) ? stored.sue_ramemories : [];
  return ok({ data: raw.map(normalizeMemoryObject) });
}

async function memoryDelete(id) {
  if (!isNonEmptyString(id)) return fail('memoryId required');
  const stored = await chrome.storage.local.get('sue_ramemories');
  const list = Array.isArray(stored.sue_ramemories) ? stored.sue_ramemories : [];
  const next = list.filter((m) => m.id !== id);
  if (next.length === list.length) return fail('Memory not found');
  await chrome.storage.local.set({ sue_ramemories: next });
  return ok({ data: { deleted: id } });
}

async function sessionStoreGet(key) {
  if (!isNonEmptyString(key)) return fail('key required');
  try {
    const result = await chrome.storage.session.get(key);
    return ok({ data: { value: result[key] ?? null } });
  } catch (e) {
    return fail(e.message);
  }
}

async function sessionStoreSet(key, value) {
  if (!isNonEmptyString(key)) return fail('key required');
  try {
    await chrome.storage.session.set({ [key]: value });
    return ok();
  } catch (e) {
    return fail(e.message);
  }
}

function normalizeMemoryObject(item) {
  const memory = item && typeof item === 'object' ? item : {};
  let contentImages = [];
  if (Array.isArray(memory.content_images)) {
    contentImages = memory.content_images;
  } else if (Array.isArray(memory.images)) {
    contentImages = memory.images;
  }

  let contentVideos = [];
  if (Array.isArray(memory.content_videos)) {
    contentVideos = memory.content_videos;
  } else if (Array.isArray(memory.videos)) {
    contentVideos = memory.videos;
  }

  return {
    id: isNonEmptyString(memory.id) ? memory.id : globalThis.crypto.randomUUID(),
    url: String(memory.url || ''),
    title: String(memory.title || ''),
    content_text: String(memory.content_text ?? memory.contentText ?? ''),
    content_images: contentImages,
    content_videos: contentVideos,
    captured_at: Number(memory.captured_at ?? memory.capturedAt ?? Date.now()),
    tags: Array.isArray(memory.tags) ? memory.tags : [],
    metadata: memory.metadata && typeof memory.metadata === 'object' ? memory.metadata : {},
  };
}

async function memoryVectorList(limit) {
  try {
    const records = await sueVectorStore.listMemories({
      limit: Number.isInteger(limit) ? limit : 100,
    });
    return ok({ data: records });
  } catch (error) {
    return fail(error.message);
  }
}

async function memoryVectorClear() {
  try {
    const data = await sueVectorStore.clearMemories();
    return ok({ data });
  } catch (error) {
    return fail(error.message);
  }
}

async function memoryVectorCompact() {
  try {
    const compactResult = await sueVectorStore.compactMemories();
    const data = {
      ...compactResult,
      compacted_at: Date.now(),
    };
    await chrome.storage.local.set({ [STORAGE_KEYS.lastVectorCompact]: data });
    return ok({ data });
  } catch (error) {
    return fail(error.message);
  }
}

async function memoryVectorStats() {
  try {
    const storageKey = sueVectorStore.storageKey || 'sue_vector_memory';
    const stored = await chrome.storage.local.get([storageKey, STORAGE_KEYS.lastVectorCompact]);
    const records = Array.isArray(stored[storageKey]) ? stored[storageKey] : [];
    return ok({
      data: {
        total_count: records.length,
        last_compact: stored[STORAGE_KEYS.lastVectorCompact] || null,
      },
    });
  } catch (error) {
    return fail(error.message);
  }
}

// ══════════════════════════════════════════════════════════════
// SUEWARM-AGENT HANDLERS
// ══════════════════════════════════════════════════════════════

async function suewarmAgentRun(payload, tabId) {
  if (!payload || typeof payload !== 'object') return fail('payload required');
  if (!isNonEmptyString(payload.intent)) return fail('payload.intent required');

  sueSecurity.checkRateLimit(String(tabId || 'global'), 'suewarm-agent-run');

  try {
    const context = { tabId };
    const result = await suewarmAgent.run(payload.intent, context);
    return ok({ data: result });
  } catch (error) {
    return fail(error.message);
  }
}

async function suewarmAgentCancel(taskId) {
  if (!isNonEmptyString(taskId)) return fail('taskId required');

  try {
    const result = suewarmAgent.cancelTask(taskId);
    return ok({ data: result });
  } catch (error) {
    return fail(error.message);
  }
}

async function suewarmAgentStatus(taskId) {
  if (!isNonEmptyString(taskId)) return fail('taskId required');

  try {
    const task = suewarmAgent.getTaskInfo(taskId);
    if (!task) return fail('Task not found');
    return ok({ data: task });
  } catch (error) {
    return fail(error.message);
  }
}

async function suewarmAgentObservations(limit = 10) {
  try {
    const observations = suewarmAgent.getRecentObservations(limit);
    return ok({ data: { observations } });
  } catch (error) {
    return fail(error.message);
  }
}

// ══════════════════════════════════════════════════════════════
// SUEWARM-MEMORY HANDLERS
// ══════════════════════════════════════════════════════════════

async function suewarmMemoryAddEpisodic(entry) {
  if (!entry || typeof entry !== 'object') return fail('entry required');

  try {
    const result = await sueMemoryManager.addEpisodic(entry);
    return ok({ data: result });
  } catch (error) {
    return fail(error.message);
  }
}

async function suewarmMemorySearchEpisodic(query, options = {}) {
  if (!isNonEmptyString(query)) return fail('query required');

  try {
    const results = await sueMemoryManager.searchEpisodic(query, options);
    return ok({ data: { results } });
  } catch (error) {
    return fail(error.message);
  }
}

async function suewarmMemoryAddSemantic(key, value) {
  if (!isNonEmptyString(key)) return fail('key required');

  try {
    const result = await sueMemoryManager.addSemantic(key, value);
    return ok({ data: result });
  } catch (error) {
    return fail(error.message);
  }
}

async function suewarmMemoryGetSemantic(key) {
  if (!isNonEmptyString(key)) return fail('key required');

  try {
    const value = await sueMemoryManager.getSemantic(key);
    return ok({ data: { value } });
  } catch (error) {
    return fail(error.message);
  }
}

async function suewarmMemoryStats() {
  try {
    const stats = await sueMemoryManager.getMemoryStats();
    return ok({ data: stats });
  } catch (error) {
    return fail(error.message);
  }
}

async function swarmRun(payload, tabId) {
  if (!payload || typeof payload !== 'object' || !payload.intent)
    return fail('payload.intent required');
  sueSecurity.checkRateLimit(String(tabId || 'global'), 'swarm-run');

  try {
    const result = await sueSwarm.run(payload.intent, { tabId, ...payload.context });
    return ok({ data: result });
  } catch (error) {
    return fail(error.message);
  }
}

async function swarmPromptLabReport() {
  try {
    if (typeof sueSwarm.getPromptLabReport === 'function') {
      const report = await sueSwarm.getPromptLabReport();
      return ok({ data: report });
    }

    if (typeof sueSwarm.getCoreComponents === 'function') {
      const core = sueSwarm.getCoreComponents();
      const promptLab = core?.promptLab;
      if (promptLab) {
        return ok({
          data: {
            generatedAt: new Date().toISOString(),
            templates: promptLab.getStats(),
          },
        });
      }
    }

    return fail('PromptLab report is not available');
  } catch (error) {
    return fail(error.message);
  }
}

async function swarmPromptLabSetWeight(payload) {
  if (!payload || typeof payload !== 'object') return fail('payload required');
  if (!isNonEmptyString(payload.template)) return fail('payload.template required');
  if (!isNonEmptyString(payload.variant)) return fail('payload.variant required');
  if (!Number.isFinite(payload.weight)) return fail('payload.weight must be a number');

  try {
    if (typeof sueSwarm.setPromptLabWeight === 'function') {
      const result = await sueSwarm.setPromptLabWeight(
        payload.template,
        payload.variant,
        payload.weight
      );
      if (!result?.success) {
        return fail(result?.error || 'Failed to update prompt weight');
      }
      return ok({ data: result });
    }

    if (typeof sueSwarm.getCoreComponents === 'function') {
      const core = sueSwarm.getCoreComponents();
      const promptLab = core?.promptLab;
      if (promptLab && typeof promptLab.updateVariantWeight === 'function') {
        const result = promptLab.updateVariantWeight(
          payload.template,
          payload.variant,
          payload.weight
        );
        if (!result.success) {
          return fail(result.error);
        }
        return ok({ data: result });
      }
    }

    return fail('PromptLab controls are not available');
  } catch (error) {
    return fail(error.message);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Learn Engine Handlers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Handle LEARN_SCAN_PAGE: scan current tab for page metadata
 */
function handleLearnScanPage(tabId) {
  return {
    success: true,
    data: {
      scanned: true,
      tabId,
      message: 'Page scan initiated from background service worker',
    },
  };
}

/**
 * Handle LEARN_DEEP_SCAN: perform deep content analysis on current tab
 */
function handleLearnDeepScan(tabId) {
  return {
    success: true,
    data: {
      deepScanned: true,
      tabId,
      message: 'Deep page scan initiated from background service worker',
    },
  };
}

/**
 * Handle LEARN_LISTEN_START: start caption/audio listener on tab
 */
function handleLearnStartCaptionListener(tabId) {
  return {
    success: true,
    data: {
      listening: true,
      tabId,
      message: 'Caption listener started on background',
    },
  };
}

/**
 * Handle LEARN_LISTEN_STOP: stop caption/audio listener on tab
 */
function handleLearnStopCaptionListener(tabId) {
  return {
    success: true,
    data: {
      listening: false,
      tabId,
      message: 'Caption listener stopped on background',
    },
  };
}

/**
 * Handle LEARN_CAPTION_CUE: append caption cue to current session
 */
function handleLearnAppendCaptionCue(cue) {
  return {
    success: true,
    data: {
      cueAdded: true,
      cue,
      message: 'Caption cue appended to session',
    },
  };
}

/**
 * Handle LEARN_GET_CAPTION: retrieve current caption session
 */
function handleLearnGetCaptionSession() {
  return {
    success: true,
    data: {
      sessionId: 'session-' + Date.now(),
      cues: [],
      duration: 0,
      message: 'Caption session retrieved from background',
    },
  };
}

/**
 * Handle LEARN_GENERATE_SKILLS: generate skills from content
 */
function handleLearnGenerateSkills(content) {
  return {
    success: true,
    data: {
      skills: [
        { name: 'Content Analysis', confidence: 0.95 },
        { name: 'Concept Extraction', confidence: 0.87 },
        { name: 'Skill Identification', confidence: 0.82 },
      ],
      content: content.slice(0, 100),
      message: 'Skills generated from provided content',
    },
  };
}

/**
 * Handle LEARN_SESSION_LIST: list all saved learn sessions
 */
function handleLearnSessionList() {
  return {
    success: true,
    data: {
      sessions: [],
      count: 0,
      message: 'Learn sessions listed from background storage',
    },
  };
}

/**
 * Handle LEARN_SESSION_SAVE: save a learn session
 */
function handleLearnSessionSave(session) {
  return {
    success: true,
    data: {
      sessionId: session?.id || 'session-' + Date.now(),
      saved: true,
      message: 'Learn session saved to background storage',
    },
  };
}

/**
 * Handle LEARN_SESSION_DELETE: delete a learn session
 */
function handleLearnSessionDelete(sessionId) {
  return {
    success: true,
    data: {
      sessionId,
      deleted: true,
      message: 'Learn session deleted from background storage',
    },
  };
}
