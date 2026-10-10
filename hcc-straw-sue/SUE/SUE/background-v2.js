// ── SUE v2.0 — Background Service Worker (THE SIDECAR) ──
// This IS the sidecar: provider routing, tool execution, health, logs, config

import './shared/message-contract.js';
import { getActivePersona, switchPersona } from './characters/rk-girdhari.js';

const MESSAGE_TYPES = globalThis.SUE_CONTRACT?.MESSAGE_TYPES || {
  GET_PAGE_CONTEXT: 'getPageContext',
  TAKE_SCREENSHOT: 'takeScreenshot',
  EXECUTE_ACTION: 'executeAction',
  LEGACY_GET_PAGE_CONTEXT: 'GET_PAGE_INFO',
  LEGACY_EXECUTE_TOOL: 'EXECUTE_TOOL',
  LEGACY_EXTRACT_TEXT: 'EXTRACT_TEXT',
  LEGACY_OPEN_SIDEBAR: 'OPEN_SIDEBAR',
  CAPTURE_MEMORY: 'CAPTURE_MEMORY',
};

const { PORT_NAMES } = globalThis.SUE_CONTRACT;
const DEFAULT_VENICE_MODEL = 'llama-3.3-70b';

// ═══════════════════════════════════════════════
// SIDECAR STATE
// ═══════════════════════════════════════════════

const sidecar = {
  startedAt: Date.now(),
  connected: 0, // sidebar instances connected
  toolCalls: 0, // total tool calls executed
  apiCalls: 0, // total LLM API calls
  errors: 0, // total errors
  lastActivity: null,
  lastHealthCheck: null,
  status: 'ok', // 'ok' | 'degraded' | 'error'
  activeAgents: new Map(), // tabId → { messages, budget, persona }
};

async function getCurrentTabId(fallbackTabId = null) {
  if (Number.isInteger(fallbackTabId)) {
    return fallbackTabId;
  }

  if (Number.isInteger(state.currentTabId)) {
    return state.currentTabId;
  }

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs?.length && Number.isInteger(tabs[0].id)) {
      state.currentTabId = tabs[0].id;
      return tabs[0].id;
    }
  } catch (error_) {
    sidecarLog(`Active tab lookup failed: ${error_.message}`, 'warn');
  }

  return null;
}

function supportsSidePanel() {
  return typeof chrome.sidePanel?.open === 'function';
}

async function openSidebarForWindow(windowId) {
  if (supportsSidePanel()) {
    await chrome.sidePanel.open({ windowId });
    return { success: true, mode: 'side_panel' };
  }

  // Firefox/Safari WebExtension fallback.
  if (typeof chrome.sidebarAction?.open === 'function') {
    await chrome.sidebarAction.open();
    return { success: true, mode: 'sidebar_action' };
  }

  return {
    success: false,
    error: 'Sidebar API is not available in this browser build',
  };
}

const state = {
  currentTabId: null,
  settings: {
    provider: 'venice',
    veniceKey: '',
    veniceModel: DEFAULT_VENICE_MODEL,
    geminiKey: '',
    geminiModel: 'gemini-1.5-flash',
    ollamaEndpoint: 'http://localhost:11434',
    ollamaModel: '',
    activePersona: 'girdhari',
    temperature: 0.7,
    maxTokens: 4096,
    actionBudget: 15,
    requireConfirmation: false,
    streamEnabled: true,
    providerTimeoutMs: 30000,
    theme: 'dark',
  },
};

// ═══════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════

chrome.runtime.onInstalled.addListener(async () => {
  try {
    // Create offscreen document for persistent WebSocket
    if (chrome.offscreen?.createDocument !== undefined) {
      if (!(await chrome.offscreen.hasDocument?.())) {
        await chrome.offscreen.createDocument({
          url: 'offscreen.html',
          reasons: ['BLOBS'],
          justification: 'Persistent WebSocket for agent loop and live streaming',
        });
        console.log('[Sidecar] Offscreen document created');
      }
    }

    if (typeof chrome.sidePanel?.setPanelBehavior === 'function') {
      await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    }
    const stored = await chrome.storage.local.get('sue_settings');
    if (stored.sue_settings) Object.assign(state.settings, stored.sue_settings);

    // Default persona: opt-in off
    if (!state.settings.activePersona) {
      state.settings.activePersona = 'sue'; // Default to basic SUE, not Girdhari
      await chrome.storage.local.set({ sue_settings: state.settings });
    }

    console.log('🕉️ SUE v2.0 (R.K. Girdhari Edition) installed. Sidecar initializing...');
    sidecarLog('System initialized', 'info');
  } catch (error) {
    console.error('[Sidecar] Initialization error:', error);
  }
});

chrome.runtime.onStartup.addListener(async () => {
  const stored = await chrome.storage.local.get('sue_settings');
  if (stored.sue_settings) Object.assign(state.settings, stored.sue_settings);
  sidecarLog('Sidecar restarted', 'info');
});

// ═══════════════════════════════════════════════
// SIDECAR LOGGING & DIAGNOSTICS
// ═══════════════════════════════════════════════

function sidecarLog(text, level = 'info') {
  const entry = {
    timestamp: Date.now(),
    text,
    level,
    uptime: Math.floor((Date.now() - sidecar.startedAt) / 1000),
  };
  sidecar.lastActivity = entry;
  if (level === 'error') sidecar.errors++;
  console.log(`[Sidecar][${level}] ${text}`);

  // Broadcast to all sidebar instances
  broadcastToSidebars({ type: MESSAGE_TYPES.SIDECAR_LOG, payload: entry });
}

function getSidecarHealth() {
  return {
    status: sidecar.status,
    uptime: Math.floor((Date.now() - sidecar.startedAt) / 1000),
    connected: sidecar.connected,
    toolCalls: sidecar.toolCalls,
    apiCalls: sidecar.apiCalls,
    errors: sidecar.errors,
    lastActivity: sidecar.lastActivity,
    memory: {
      conversations: sidecar.activeAgents.size,
      settingsLoaded: !!state.settings,
    },
  };
}

// Broadcast to all sidebar ports
const sidebarPorts = new Set();
function broadcastToSidebars(msg) {
  for (const port of sidebarPorts) {
    try {
      port.postMessage(msg);
    } catch {
      sidebarPorts.delete(port);
    }
  }
}

// ═══════════════════════════════════════════════
// MESSAGE ROUTER
// ═══════════════════════════════════════════════

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === PORT_NAMES.SIDEBAR) {
    sidebarPorts.add(port);
    sidecar.connected = sidebarPorts.size;
    sidecarLog(`Sidebar connected (${sidecar.connected} total)`, 'info');
    port.postMessage({
      type: MESSAGE_TYPES.SIDECAR_READY,
      payload: {
        health: getSidecarHealth(),
        persona: getActivePersona().name,
      },
    });

    port.onMessage.addListener(async (msg) => {
      const handler = messageHandlers[msg.type];
      if (handler) {
        try {
          const result = await handler(msg.payload, port);
          port.postMessage({
            type: `${msg.type}:result`,
            payload: result,
            id: msg.id,
          });
        } catch (e) {
          sidecarLog(`Handler error: ${e.message}`, 'error');
          port.postMessage({
            type: `${msg.type}:error`,
            payload: { error: e.message },
            id: msg.id,
          });
        }
      }
    });

    port.onDisconnect.addListener(() => {
      sidebarPorts.delete(port);
      sidecar.connected = sidebarPorts.size;
      sidecarLog(`Sidebar disconnected (${sidecar.connected} remaining)`);
    });
  }
});

// Fallback for non-port messages (legacy)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const aliases = {
    [MESSAGE_TYPES.LEGACY_GET_PAGE_CONTEXT]: MESSAGE_TYPES.GET_PAGE_CONTEXT,
    [MESSAGE_TYPES.LEGACY_EXECUTE_TOOL]: MESSAGE_TYPES.EXECUTE_TOOL,
    [MESSAGE_TYPES.LEGACY_TAKE_SCREENSHOT]: MESSAGE_TYPES.TAKE_SCREENSHOT,
    [MESSAGE_TYPES.LEGACY_OPEN_SIDEBAR]: MESSAGE_TYPES.OPEN_SIDEBAR,
    [MESSAGE_TYPES.LEGACY_OPEN_SIDEBAR_SNAKE]: MESSAGE_TYPES.OPEN_SIDEBAR,
    [MESSAGE_TYPES.CAPTURE_MEMORY]: MESSAGE_TYPES.CAPTURE_MEMORY,
  };

  const mappedType = aliases[msg.type] || msg.type;
  if (messageHandlers[mappedType]) {
    messageHandlers[mappedType](msg.payload || msg, sender)
      .then(sendResponse)
      .catch((e) => sendResponse({ error: e.message }));
    return true;
  }
  return false;
});

// ═══════════════════════════════════════════════
// MESSAGE HANDLERS
// ═══════════════════════════════════════════════

const messageHandlers = {
  // ── Settings ──
  getSettings: () => state.settings,

  async saveSettings(payload) {
    Object.assign(state.settings, payload);
    await chrome.storage.local.set({ sue_settings: state.settings });
    sidecarLog('Settings updated', 'info');
    return { success: true };
  },

  // ── Health ──
  getHealth: () => getSidecarHealth(),

  // ── UI helpers ──
  async openSidebar(payload, sender) {
    const windowId = sender?.tab?.windowId || payload?.windowId;
    if (!windowId) {
      return {
        success: false,
        error: 'No target window available for side panel',
      };
    }

    return openSidebarForWindow(windowId);
  },

  // ── Conversation ──
  getConversation: (_, sender) => {
    const tabId = sender?.tab?.id || state.currentTabId;
    return sidecar.activeAgents.get(tabId)?.messages || [];
  },

  async clearConversation(_, sender) {
    const tabId = sender?.tab?.id || state.currentTabId;
    sidecar.activeAgents.delete(tabId);
    sidecarLog(`Conversation cleared for tab ${tabId}`);
    return { success: true };
  },

  // ── Page Context ──
  getPageContext: async (_, sender) => {
    const tabId = await getCurrentTabId(sender?.tab?.id);
    if (!tabId) {
      return { error: 'No active tab available for context extraction' };
    }
    try {
      return await chrome.tabs.sendMessage(tabId, {
        type: MESSAGE_TYPES.GET_PAGE_CONTEXT,
      });
    } catch (e) {
      sidecarLog(`Page context failed: ${e.message}`, 'error');
      return { error: e.message };
    }
  },

  // ── Screenshot ──
  takeScreenshot: async (_, sender) => {
    const tabId = await getCurrentTabId(sender?.tab?.id);
    if (!tabId) {
      return { error: 'No active tab available for screenshot' };
    }
    try {
      const dataUrl = await chrome.tabs.captureVisibleTab(null, {
        format: 'png',
        quality: 80,
      });
      return { dataUrl };
    } catch (error_) {
      sidecarLog(`Primary screenshot capture failed: ${error_.message}`, 'error');
      try {
        return await chrome.tabs.sendMessage(tabId, {
          type: MESSAGE_TYPES.TAKE_SCREENSHOT,
        });
      } catch (fallbackError_) {
        sidecarLog(`Fallback screenshot capture failed: ${fallbackError_.message}`, 'error');
        return { error: 'Screenshot failed' };
      }
    }
  },

  // ── Tool Execution ──
  executeTool: async (payload, sender) => {
    const tabId = await getCurrentTabId(payload.tabId || sender?.tab?.id);
    if (!tabId) {
      return { error: 'No active tab available for tool execution' };
    }
    sidecar.toolCalls++;
    sidecarLog(`Tool: ${payload.tool.action || payload.tool.name}`, 'info');
    try {
      const result = await chrome.tabs.sendMessage(tabId, {
        type: MESSAGE_TYPES.EXECUTE_ACTION,
        payload: payload.tool,
      });
      return result;
    } catch (e) {
      sidecarLog(`Tool failed: ${e.message}`, 'error');
      return { error: e.message };
    }
  },

  // ── RAMemory Integration ──
  captureMemory: async (payload) => {
    const { url, title, contentText, images, videos, capturedAt } = payload;
    const memoryObject = {
      id: crypto.randomUUID(),
      url,
      title,
      contentText,
      images,
      videos,
      capturedAt,
      tags: ['captured_page'],
      metadata: {},
    };

    const storedMemories = await chrome.storage.local.get('sue_ramemories');
    const ramemories = storedMemories.sue_ramemories || [];
    ramemories.push(memoryObject);
    await chrome.storage.local.set({ sue_ramemories: ramemories });
    sidecarLog(`Captured memory: ${title}`, 'info');
    return { success: true, memoryId: memoryObject.id };
  },

  // ── Stream Chat (Main Agent Loop) ──
  streamChat: async (payload, port) => {
    const tabId = await getCurrentTabId(payload.tabId);
    if (!tabId) throw new Error('No active tab');

    // Get persona from settings (opt-in)
    const personaId = state.settings.activePersona || 'sue';
    const persona = switchPersona(personaId);

    // Build conversation
    const messages = sidecar.activeAgents.get(tabId)?.messages || [];
    const systemPrompt = persona.buildSystemPrompt({
      url: payload.pageContext?.url,
      title: payload.pageContext?.title,
      actionBudget: state.settings.actionBudget,
    });

    if (!messages.length) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: payload.userMessage });
    sidecar.activeAgents.set(tabId, {
      messages,
      persona: persona.name,
      budget: state.settings.actionBudget,
    });

    // Route to provider
    sidecar.apiCalls++;
    const provider = state.settings.provider;
    sidecarLog(`API call → ${provider}`, 'info');

    if (provider === 'venice') return streamVenice(messages, tabId, port);
    if (provider === 'gemini') return streamGemini(messages, tabId, port);
    if (provider === 'local' || provider === 'ollama') {
      return streamOllama(messages, tabId, port);
    }
    throw new Error(`Unknown provider: ${provider}`);
  },
};

// ═══════════════════════════════════════════════
// BROWSER TOOL DEFINITIONS
// ═══════════════════════════════════════════════

const BROWSER_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'capture_memory',
      description:
        'Captures the current page content (text, images, videos) and stores it as a memory. Use this to remember important information from web pages.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL of the page to capture.',
          },
          title: {
            type: 'string',
            description: 'The title of the page to capture.',
          },
          contentText: {
            type: 'string',
            description: 'The main textual content of the page.',
          },
          images: {
            type: 'array',
            items: { type: 'string' },
            description: 'A list of image URLs found on the page.',
          },
          videos: {
            type: 'array',
            items: { type: 'string' },
            description: 'A list of video URLs found on the page.',
          },
          capturedAt: {
            type: 'number',
            description: 'Timestamp when the page was captured.',
          },
        },
        required: ['url', 'title', 'contentText'],
      },
    },
  },

  {
    type: 'function',
    function: {
      name: 'click_element',
      description: 'Click a page element identified by CSS selector.',
      parameters: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector for the element',
          },
          reason: {
            type: 'string',
            description: 'Brief reason (for the audit log)',
          },
        },
        required: ['selector'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'type_text',
      description: 'Type text into an input/textarea identified by CSS selector.',
      parameters: {
        type: 'object',
        properties: {
          selector: { type: 'string' },
          text: { type: 'string' },
          clear_first: { type: 'boolean', default: true },
        },
        required: ['selector', 'text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'capture_memory',
      description: 'Captures the current page content (text, images, videos) as a memory object.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'scroll_page',
      description: 'Scroll the page in a direction or to an element.',
      parameters: {
        type: 'object',
        properties: {
          direction: { type: 'string', enum: ['up', 'down', 'top', 'bottom'] },
          amount: { type: 'number', description: 'Pixels (0 = one viewport)' },
          selector: {
            type: 'string',
            description: 'Scroll to this element (takes priority)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'navigate_to',
      description: 'Navigate browser to a URL or reload.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL or "reload"' },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'extract_content',
      description: 'Extract structured content from the current page.',
      parameters: {
        type: 'object',
        properties: {
          mode: {
            type: 'string',
            enum: ['full_text', 'headings', 'tables', 'lists', 'selection'],
          },
          selector: {
            type: 'string',
            description: 'CSS selector for targeted extraction',
          },
        },
        required: ['mode'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'take_screenshot',
      description: 'Capture a screenshot for visual analysis.',
      parameters: {
        type: 'object',
        properties: {
          full_page: { type: 'boolean', default: false },
          selector: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'fill_form',
      description: 'Fill multiple form fields at once.',
      parameters: {
        type: 'object',
        properties: {
          fields: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                selector: { type: 'string' },
                value: { type: 'string' },
              },
              required: ['selector', 'value'],
            },
          },
        },
        required: ['fields'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'wait',
      description: 'Wait for duration or until an element appears.',
      parameters: {
        type: 'object',
        properties: {
          ms: { type: 'number' },
          selector: {
            type: 'string',
            description: 'Wait for this selector (max 10s)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'download_content',
      description: 'Save extracted content as a downloadable file.',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          filename: { type: 'string' },
          mime_type: { type: 'string', default: 'text/plain' },
        },
        required: ['content', 'filename'],
      },
    },
  },
];

// ═══════════════════════════════════════════════
// PROVIDER: VENICE AI (PRIVACY-FIRST)
// ═══════════════════════════════════════════════

function getProviderTimeoutMs() {
  const timeoutMs = Number(state.settings.providerTimeoutMs);
  if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
    return timeoutMs;
  }
  return 30000;
}

async function fetchWithTimeout(url, options = {}) {
  const timeoutMs = getProviderTimeoutMs();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new Error(`Provider request timed out after ${timeoutMs}ms`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function streamVenice(messages, tabId, port) {
  const key = state.settings.veniceKey;
  if (!key) throw new Error('Venice AI API key not configured. Visit Settings to add your key.');

  const configuredModel = state.settings.veniceModel;
  const model =
    configuredModel === 'llama-3.1-70b-instruct' ? DEFAULT_VENICE_MODEL : configuredModel;

  if (model !== configuredModel) {
    sidecarLog(
      `Unsupported Venice model '${configuredModel}' detected; falling back to '${model}'`,
      'warn'
    );
  }

  const body = {
    model,
    messages,
    tools: BROWSER_TOOLS,
    tool_choice: 'auto',
    temperature: state.settings.temperature,
    max_tokens: state.settings.maxTokens,
    stream: true,
  };

  const res = await fetchWithTimeout('https://api.venice.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Venice AI ${res.status}: ${err.slice(0, 200)}`);
  }

  return processProviderStream(res, messages, tabId, port, 'venice');
}

// ═══════════════════════════════════════════════
// PROVIDER: GOOGLE GEMINI
// ═══════════════════════════════════════════════

async function streamGemini(messages, tabId, port) {
  const key = state.settings.geminiKey;
  if (!key) throw new Error('Gemini API key not configured.');

  const systemMsg = messages.find((m) => m.role === 'system')?.content || '';
  const geminiMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.content }],
    }));

  const body = {
    generationConfig: {
      temperature: state.settings.temperature,
      maxOutputTokens: state.settings.maxTokens,
      toolConfig: {
        functionCallingConfig: { mode: 'AUTO' },
      },
    },
    tools: BROWSER_TOOLS.map((t) => ({ functionDeclarations: [t.function] })),
    systemInstruction: systemMsg,
    contents: geminiMessages,
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${state.settings.geminiModel}:streamGenerateContent?key=${key}`;
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err.slice(0, 200)}`);
  }

  return processGeminiStream(res, messages, tabId, port);
}

function emitStreamTextChunk(port, content) {
  port.postMessage({
    type: 'stream:chunk',
    payload: { kind: 'text', content },
  });
}

function postToolCallsChunk(port, toolCalls) {
  port.postMessage({
    type: 'stream:chunk',
    payload: {
      kind: 'tool_calls',
      calls: toolCalls.map((tc) => ({
        name: tc.name,
        arguments: tc.arguments,
        id: tc.id,
      })),
    },
  });
}

function finalizeAgentResponse(messages, tabId, fullContent, toolCallAccumulator, port) {
  if (fullContent) {
    messages.push({ role: 'assistant', content: fullContent });
  }

  sidecar.activeAgents.set(tabId, {
    messages,
    persona: getActivePersona().name,
  });
  port.postMessage({ type: 'stream:done', payload: { content: fullContent } });

  sidecarLog(
    `Agent response complete (${fullContent.length} chars, ${Object.keys(toolCallAccumulator).length} tools)`,
    'info'
  );

  return { done: true, content: fullContent, messages };
}

function parseGeminiLine(line, toolCallAccumulator, port, currentContent) {
  if (!line.trim()) {
    return currentContent;
  }

  try {
    const json = JSON.parse(line);
    const candidates = json.candidates?.[0];
    if (!candidates) {
      return currentContent;
    }

    let updatedContent = currentContent;
    const parts = candidates.content?.parts || [];
    for (const part of parts) {
      if (part.text) {
        updatedContent += part.text;
        emitStreamTextChunk(port, part.text);
      }

      if (part.functionCall) {
        const idx = Object.keys(toolCallAccumulator).length;
        toolCallAccumulator[idx] = {
          id: '',
          name: part.functionCall.name,
          arguments: JSON.stringify(part.functionCall.args || {}),
        };
      }
    }

    return updatedContent;
  } catch {
    return currentContent;
  }
}

async function readGeminiStream(reader, decoder, port) {
  let buffer = '';
  let fullContent = '';
  const toolCallAccumulator = {};

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      fullContent = parseGeminiLine(line, toolCallAccumulator, port, fullContent);
    }
  }

  return { fullContent, toolCallAccumulator };
}

async function executeGeminiToolCalls(toolCalls, messages, fullContent, tabId, port) {
  postToolCallsChunk(port, toolCalls);

  const assistantMsg = { role: 'assistant', content: fullContent || null };
  if (toolCalls.length) {
    assistantMsg.content = fullContent ? [{ text: fullContent }] : [];
    for (const tc of toolCalls) {
      assistantMsg.content.push({
        functionCall: {
          name: tc.name,
          args: JSON.parse(tc.arguments),
        },
      });
    }
  }
  messages.push(assistantMsg);

  const toolMessages = [];
  for (const tc of toolCalls) {
    const args = JSON.parse(tc.arguments);

    port.postMessage({
      type: 'stream:chunk',
      payload: { kind: 'tool_start', name: tc.name, args },
    });

    const result = await executeBrowserTool(tc.name, args, tabId);

    port.postMessage({
      type: 'stream:chunk',
      payload: { kind: 'tool_result', name: tc.name, result },
    });

    toolMessages.push({
      role: 'function',
      name: tc.name,
      response: { result: JSON.stringify(result) },
    });
  }

  messages.push(...toolMessages);
  sidecar.activeAgents.set(tabId, {
    messages,
    persona: getActivePersona().name,
  });

  port.postMessage({
    type: 'stream:chunk',
    payload: { kind: 'agent_continue' },
  });
}

async function processGeminiStream(response, messages, tabId, port) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const { fullContent, toolCallAccumulator } = await readGeminiStream(reader, decoder, port);
  const MAX_ACTIONS = state.settings.actionBudget;

  // Agent loop: Execute tool calls
  const toolCalls = Object.values(toolCallAccumulator).filter((tc) => tc.name);

  if (toolCalls.length && MAX_ACTIONS > 0) {
    await executeGeminiToolCalls(toolCalls, messages, fullContent, tabId, port);
    // Recursive agent loop
    return streamGemini(messages, tabId, port);
  }

  return finalizeAgentResponse(messages, tabId, fullContent, toolCallAccumulator, port);
}

function parseOllamaDataLine(line, toolCallAccumulator, port, currentContent) {
  if (!line.startsWith('data: ')) {
    return currentContent;
  }

  const data = line.slice(6);
  if (data === '[DONE]') {
    return currentContent;
  }

  try {
    const json = JSON.parse(data);
    let updatedContent = currentContent;

    if (json.message?.content) {
      updatedContent += json.message.content;
      emitStreamTextChunk(port, json.message.content);
    }

    if (json.message?.tool_calls) {
      for (const tc of json.message.tool_calls) {
        const idx = Object.keys(toolCallAccumulator).length;
        toolCallAccumulator[idx] = {
          id: '',
          name: tc.function?.name || '',
          arguments: JSON.stringify(tc.function?.arguments || {}),
        };
      }
    }

    return updatedContent;
  } catch {
    return currentContent;
  }
}

function parseOpenAiDataLine(line, toolCallAccumulator, port, currentContent) {
  if (!line.startsWith('data: ')) {
    return currentContent;
  }

  const data = line.slice(6);
  if (data === '[DONE]') {
    return currentContent;
  }

  try {
    const json = JSON.parse(data);
    const delta = json.choices?.[0]?.delta;
    let updatedContent = currentContent;

    if (delta?.content) {
      updatedContent += delta.content;
      emitStreamTextChunk(port, delta.content);
    }

    if (delta?.tool_calls) {
      accumulateOpenAiToolCalls(delta.tool_calls, toolCallAccumulator);
    }

    return updatedContent;
  } catch {
    return currentContent;
  }
}

function accumulateOpenAiToolCalls(deltaToolCalls, toolCallAccumulator) {
  for (const tc of deltaToolCalls) {
    const idx = tc.index;
    if (!toolCallAccumulator[idx]) {
      toolCallAccumulator[idx] = { id: '', name: '', arguments: '' };
    }

    if (tc.id) {
      toolCallAccumulator[idx].id = tc.id;
    }
    if (tc.function?.name) {
      toolCallAccumulator[idx].name += tc.function.name;
    }
    if (tc.function?.arguments) {
      toolCallAccumulator[idx].arguments += tc.function.arguments;
    }
  }
}

async function readProviderStream(reader, decoder, port, provider) {
  let buffer = '';
  let fullContent = '';
  const toolCallAccumulator = {};

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      fullContent =
        provider === 'ollama'
          ? parseOllamaDataLine(line, toolCallAccumulator, port, fullContent)
          : parseOpenAiDataLine(line, toolCallAccumulator, port, fullContent);
    }
  }

  return { fullContent, toolCallAccumulator };
}

async function executeProviderToolCalls(toolCalls, messages, fullContent, tabId, port) {
  postToolCallsChunk(port, toolCalls);

  const assistantMsg = { role: 'assistant', content: fullContent || null };
  assistantMsg.tool_calls = toolCalls.map((tc) => ({
    id: tc.id,
    type: 'function',
    function: { name: tc.name, arguments: tc.arguments },
  }));
  messages.push(assistantMsg);

  const toolMessages = [];
  for (const tc of toolCalls) {
    const args = safeJsonParse(tc.arguments);

    port.postMessage({
      type: 'stream:chunk',
      payload: { kind: 'tool_start', name: tc.name, args },
    });

    const result = await executeBrowserTool(tc.name, args, tabId);

    port.postMessage({
      type: 'stream:chunk',
      payload: { kind: 'tool_result', name: tc.name, result },
    });

    toolMessages.push({
      role: 'tool',
      tool_call_id: tc.id,
      content: JSON.stringify(result),
    });
  }

  messages.push(...toolMessages);
  sidecar.activeAgents.set(tabId, {
    messages,
    persona: getActivePersona().name,
  });

  port.postMessage({
    type: 'stream:chunk',
    payload: { kind: 'agent_continue' },
  });
}

// ═══════════════════════════════════════════════
// PROVIDER: OLLAMA (LOCAL)
// ═══════════════════════════════════════════════

async function streamOllama(messages, tabId, port) {
  const endpoint = state.settings.ollamaEndpoint.replace(/\/$/, '');
  const model = state.settings.ollamaModel;

  if (!model)
    throw new Error('No Ollama model selected. Open Settings to scan and select a model.');

  if (state.settings.__testMode === true) {
    if (state.settings.__providerFailureMode === '429') {
      throw new Error('Ollama 429: rate limit (simulated)');
    }
    if (state.settings.__providerFailureMode === 'timeout') {
      throw new Error(`Provider request timed out after ${getProviderTimeoutMs()}ms (simulated)`);
    }
  }

  const body = {
    model,
    messages: messages
      .filter((m) => m.role !== 'tool')
      .map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
      })),
    tools: BROWSER_TOOLS.map((t) => ({
      type: 'function',
      function: t.function,
    })),
    stream: true,
    options: {
      temperature: state.settings.temperature,
      num_predict: state.settings.maxTokens,
    },
  };

  try {
    const res = await fetchWithTimeout(`${endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Ollama ${res.status}: ${err.slice(0, 200)}`);
    }

    return processProviderStream(res, messages, tabId, port, 'ollama');
  } catch (e) {
    if (e.message.includes('Failed to fetch') || e.message.includes('NetworkError')) {
      throw new Error(`Cannot reach Ollama at ${endpoint}. Is it running? Run: ollama serve`);
    }
    throw e;
  }
}

// ═══════════════════════════════════════════════
// UNIFIED STREAM PROCESSOR + AGENT LOOP
// ═══════════════════════════════════════════════

async function processProviderStream(response, messages, tabId, port, provider) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const { fullContent, toolCallAccumulator } = await readProviderStream(
    reader,
    decoder,
    port,
    provider
  );
  const MAX_ACTIONS = state.settings.actionBudget;

  // Agent Loop: Execute Tool Calls
  const toolCalls = Object.values(toolCallAccumulator).filter((tc) => tc.name);

  if (toolCalls.length && MAX_ACTIONS > 0) {
    await executeProviderToolCalls(toolCalls, messages, fullContent, tabId, port);
    // Recursive agent loop
    if (provider === 'venice') {
      return streamVenice(messages, tabId, port);
    }
  }

  return finalizeAgentResponse(messages, tabId, fullContent, toolCallAccumulator, port);
}

// ═══════════════════════════════════════════════
// TOOL EXECUTOR
// ═══════════════════════════════════════════════

async function executeBrowserTool(name, args, tabId) {
  switch (name) {
    case 'click_element':
      return chrome.tabs.sendMessage(tabId, {
        type: MESSAGE_TYPES.EXECUTE_ACTION,
        payload: { action: 'click', selector: args.selector },
      });

    case 'type_text':
      return chrome.tabs.sendMessage(tabId, {
        type: MESSAGE_TYPES.EXECUTE_ACTION,
        payload: {
          action: 'type',
          selector: args.selector,
          text: args.text,
          clearFirst: args.clear_first !== false,
        },
      });

    case 'scroll_page':
      return chrome.tabs.sendMessage(tabId, {
        type: MESSAGE_TYPES.EXECUTE_ACTION,
        payload: {
          action: 'scroll',
          direction: args.direction,
          amount: args.amount,
          selector: args.selector,
        },
      });

    case 'navigate_to': {
      if (args.url === 'reload') {
        await chrome.tabs.reload(tabId);
        return { navigated: 'reload' };
      }
      await chrome.tabs.update(tabId, { url: args.url });
      return { navigated: args.url };
    }

    case 'extract_content':
      return chrome.tabs.sendMessage(tabId, {
        type: MESSAGE_TYPES.EXECUTE_ACTION,
        payload: {
          action: 'extract',
          mode: args.mode,
          selector: args.selector,
        },
      });

    case 'take_screenshot':
      try {
        const dataUrl = await chrome.tabs.captureVisibleTab(null, {
          format: 'png',
          quality: 80,
        });
        return { screenshot: dataUrl };
      } catch (error_) {
        sidecarLog(`CaptureVisibleTab failed in tool executor: ${error_.message}`, 'error');
        return chrome.tabs.sendMessage(tabId, {
          type: MESSAGE_TYPES.EXECUTE_ACTION,
          payload: {
            action: 'screenshot',
            fullPage: args.full_page,
            selector: args.selector,
          },
        });
      }

    case 'fill_form':
      return chrome.tabs.sendMessage(tabId, {
        type: MESSAGE_TYPES.EXECUTE_ACTION,
        payload: { action: 'fillForm', fields: args.fields },
      });

    case 'wait': {
      if (args.selector) {
        return chrome.tabs.sendMessage(tabId, {
          type: MESSAGE_TYPES.EXECUTE_ACTION,
          payload: {
            action: 'waitFor',
            selector: args.selector,
            timeout: 10000,
          },
        });
      }
      await new Promise((r) => setTimeout(r, args.ms || 1000));
      return { waited: args.ms || 1000 };
    }

    case 'download_content': {
      const dataUrl = `data:${args.mime_type || 'text/plain'};charset=utf-8,${encodeURIComponent(args.content)}`;
      await chrome.downloads.download({
        url: dataUrl,
        filename: args.filename,
        saveAs: false,
      });
      return { downloaded: args.filename };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ═══════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════

function safeJsonParse(str) {
  if (!str || str === '{}') return {};
  try {
    return JSON.parse(str);
  } catch {
    return { raw: str };
  }
}

// ═══════════════════════════════════════════════
// TAB TRACKING
// ═══════════════════════════════════════════════

chrome.tabs.onActivated.addListener(({ tabId }) => {
  state.currentTabId = tabId;
});
chrome.tabs.onRemoved.addListener((tabId) => {
  sidecar.activeAgents.delete(tabId);
});
chrome.action.onClicked.addListener((tab) => {
  openSidebarForWindow(tab.windowId);
});

// ═══════════════════════════════════════════════
// PERIODIC HEALTH CHECK BROADCAST
// ═══════════════════════════════════════════════

setInterval(() => {
  sidecar.lastHealthCheck = Date.now();
  broadcastToSidebars({
    type: MESSAGE_TYPES.SIDECAR_HEALTH,
    payload: getSidecarHealth(),
  });
}, 5000);

console.log('🕉️ SUE v2.0 Sidecar initialized. R.K. Girdhari presiding.');
