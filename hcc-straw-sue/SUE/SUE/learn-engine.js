// SUE Learn Engine — content extraction, caption listening, document assembly, skills generation
// Loaded via importScripts in background.js — runs in the service worker context
'use strict';

const LEARN_STORAGE_KEY = 'sue_learn_sessions';
const LEARN_CAPTION_KEY = 'sue_learn_caption_session';
const LEARN_MAX_SESSIONS = 20;

// ── AI generation helper ──────────────────────────────────────────────────────
// These provider helpers are defined as function declarations in background.js
// and therefore available globally in the same service worker scope when these
// functions are called via the handlers.
// Declare them as external functions for eslint:
/* global getVeniceConfig, getHuggingFaceConfig, getOllamaConfig */
/* global sendVeniceChat, sendHuggingFaceChat, sendPrimaryOllamaChat */

async function learnAiGenerate(messages) {
  try {
    // These functions are defined in background.js and available globally
    // eslint-disable-next-line no-undef
    const veniceConfig = await getVeniceConfig();
    // eslint-disable-next-line no-undef
    const hfConfig = await getHuggingFaceConfig();
    // eslint-disable-next-line no-undef
    const ollamaConfig = await getOllamaConfig();

    let result;
    if (veniceConfig.apiKey) {
      // eslint-disable-next-line no-undef
      result = await sendVeniceChat(veniceConfig, messages);
    } else if (hfConfig.token) {
      // eslint-disable-next-line no-undef
      result = await sendHuggingFaceChat(hfConfig, messages);
    } else {
      // eslint-disable-next-line no-undef
      result = await sendPrimaryOllamaChat(ollamaConfig, messages);
    }

    if (!result.success) return { success: false, error: result.error };
    return { success: true, content: result.data?.content || '' };
  } catch (err) {
    return { success: false, error: `AI generation failed: ${err.message}` };
  }
}

// ── Document assembly ─────────────────────────────────────────────────────────

async function learnGenerateDocument(rawContent) {
  const messages = [
    {
      role: 'system',
      content: `You are a structured document creator. Given raw page content, produce a clear, logical document using markdown ## headers for sections:
1. Summary (2-3 sentences)
2. Main sections organized by topic
3. Key concepts, facts, and data points
4. Step-by-step order if the content is procedural
5. References and URLs preserved

Be factual and complete. Include only what is in the source content.`,
    },
    {
      role: 'user',
      content: `Organize this into a structured document:\n\n${rawContent.slice(0, 10000)}`,
    },
  ];

  return learnAiGenerate(messages);
}

// ── Skills generation ─────────────────────────────────────────────────────────

async function learnGenerateSkills(documentContent) {
  const messages = [
    {
      role: 'system',
      content: `You are a skills extraction expert. Given a document, generate exactly 5 actionable skills representing different ways to apply the knowledge. Generate one skill of each type: summary, how-to, concept, application, practice.

Return ONLY valid JSON with this exact shape, no extra text:
{"skills":[{"type":"summary","title":"...","description":"...","steps":["...","..."],"tags":["...","..."]},{"type":"how-to",...},{"type":"concept",...},{"type":"application",...},{"type":"practice",...}]}

Fields:
- type: "summary" | "how-to" | "concept" | "application" | "practice"
- title: 5-8 words describing the skill
- description: 1-2 sentences on what this skill enables
- steps: array of 3-5 concrete action steps
- tags: array of 2-4 topic tags`,
    },
    {
      role: 'user',
      content: `Generate 5 skills from this document:\n\n${documentContent.slice(0, 8000)}`,
    },
  ];

  const result = await learnAiGenerate(messages);
  if (!result.success) return result;

  try {
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { success: false, error: 'AI did not return valid JSON' };
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      success: true,
      data: { skills: Array.isArray(parsed.skills) ? parsed.skills : [] },
    };
  } catch (err) {
    return { success: false, error: `Failed to parse skills JSON: ${err.message}` };
  }
}

// ── Deep page extraction (via content script) ─────────────────────────────────

async function learnExtractDeepContent(tabId) {
  let resolvedTabId = tabId;
  if (!resolvedTabId) {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    resolvedTabId = activeTab?.id;
  }
  if (!resolvedTabId) return { success: false, error: 'No active tab found' };

  try {
    return await chrome.tabs.sendMessage(resolvedTabId, { type: 'LEARN_EXTRACT_DEEP' });
  } catch (err) {
    return { success: false, error: `Content script unavailable: ${err.message}` };
  }
}

// ── Full scan workflow ────────────────────────────────────────────────────────

async function learnScanPage(tabId) {
  const extracted = await learnExtractDeepContent(tabId);
  if (!extracted?.success)
    return { success: false, error: extracted?.error || 'Extraction failed' };

  const rawText = [
    `Title: ${extracted.title}`,
    `URL: ${extracted.url}`,
    extracted.description ? `Description: ${extracted.description}` : '',
    '',
    extracted.fullText || '',
  ]
    .filter(Boolean)
    .join('\n');

  const docResult = await learnGenerateDocument(rawText);
  if (!docResult.success) return { success: false, error: docResult.error };

  return {
    success: true,
    data: {
      url: extracted.url,
      title: extracted.title,
      document: docResult.content,
      rawText: (extracted.fullText || '').slice(0, 5000),
      pageType: extracted.pageType || 'generic',
      hasVideo: Boolean(extracted.hasVideo),
      hasCaptions: Boolean(extracted.hasCaptions),
    },
  };
}

// ── Caption listening ─────────────────────────────────────────────────────────

async function learnStartCaptionListener(tabId) {
  let resolvedTabId = tabId;
  if (!resolvedTabId) {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    resolvedTabId = activeTab?.id;
  }
  if (!resolvedTabId) return { success: false, error: 'No active tab found' };

  await chrome.storage.local.set({
    [LEARN_CAPTION_KEY]: {
      tabId: resolvedTabId,
      tabTitle: '',
      tabUrl: '',
      cues: [],
      startedAt: Date.now(),
    },
  });

  // Capture current tab title/url for later document assembly
  try {
    const tab = await chrome.tabs.get(resolvedTabId);
    const stored = await chrome.storage.local.get(LEARN_CAPTION_KEY);
    if (stored[LEARN_CAPTION_KEY]) {
      stored[LEARN_CAPTION_KEY].tabTitle = tab.title || '';
      stored[LEARN_CAPTION_KEY].tabUrl = tab.url || '';
      await chrome.storage.local.set({ [LEARN_CAPTION_KEY]: stored[LEARN_CAPTION_KEY] });
    }
  } catch (_) {}

  try {
    const result = await chrome.tabs.sendMessage(resolvedTabId, { type: 'LEARN_CAPTION_START' });
    if (result?.success) {
      return {
        success: true,
        data: {
          tabId: resolvedTabId,
          hasCaptions: Boolean(result.hasCaptions),
          videoCount: result.videoCount || 0,
        },
      };
    }
    return { success: false, error: result?.error || 'Could not start caption listener' };
  } catch (err) {
    return { success: false, error: `Content script unavailable: ${err.message}` };
  }
}

async function learnStopCaptionListener(tabId) {
  let resolvedTabId = tabId;
  if (!resolvedTabId) {
    const stored = await chrome.storage.local.get(LEARN_CAPTION_KEY);
    resolvedTabId = stored[LEARN_CAPTION_KEY]?.tabId;
  }

  if (resolvedTabId) {
    try {
      await chrome.tabs.sendMessage(resolvedTabId, { type: 'LEARN_CAPTION_STOP' });
    } catch (_) {
      // Tab may have closed; ignore
    }
  }

  const stored = await chrome.storage.local.get(LEARN_CAPTION_KEY);
  const session = stored[LEARN_CAPTION_KEY] || { cues: [] };
  const transcript = session.cues
    .map((c) => c.text)
    .join(' ')
    .trim();

  return {
    success: true,
    data: {
      transcript,
      cueCount: session.cues.length,
      tabTitle: session.tabTitle || '',
      tabUrl: session.tabUrl || '',
    },
  };
}

async function learnGetCaptionSession() {
  const stored = await chrome.storage.local.get(LEARN_CAPTION_KEY);
  const session = stored[LEARN_CAPTION_KEY] || null;
  const transcript = session
    ? session.cues
        .map((c) => c.text)
        .join(' ')
        .trim()
    : '';
  return {
    success: true,
    data: {
      transcript,
      cueCount: session?.cues?.length || 0,
      tabTitle: session?.tabTitle || '',
      tabUrl: session?.tabUrl || '',
    },
  };
}

async function learnAppendCaptionCue(cue) {
  if (!cue || typeof cue.text !== 'string' || !cue.text.trim())
    return { success: false, error: 'Invalid cue' };
  const stored = await chrome.storage.local.get(LEARN_CAPTION_KEY);
  const session = stored[LEARN_CAPTION_KEY];
  if (!session) return { success: false, error: 'No active caption session' };

  // Deduplicate — skip if this text was already captured
  const lastCue = session.cues[session.cues.length - 1];
  if (lastCue && lastCue.text.trim() === cue.text.trim()) return { success: true };

  session.cues.push({
    text: cue.text.trim(),
    startTime: cue.startTime || 0,
    endTime: cue.endTime || 0,
    ts: Date.now(),
  });
  await chrome.storage.local.set({ [LEARN_CAPTION_KEY]: session });
  return { success: true };
}

// ── Session persistence ───────────────────────────────────────────────────────

function learnGenerateId() {
  return `learn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function learnSessionSave(session) {
  if (!session || typeof session !== 'object') return { success: false, error: 'session required' };
  const stored = await chrome.storage.local.get(LEARN_STORAGE_KEY);
  const sessions = Array.isArray(stored[LEARN_STORAGE_KEY]) ? stored[LEARN_STORAGE_KEY] : [];

  const record = {
    id: session.id || learnGenerateId(),
    url: String(session.url || ''),
    title: String(session.title || 'Untitled'),
    mode: String(session.mode || 'scan'),
    document: String(session.document || ''),
    rawText: String(session.rawText || '').slice(0, 3000),
    skills: Array.isArray(session.skills) ? session.skills : [],
    created_at: session.created_at || Date.now(),
  };

  const idx = sessions.findIndex((s) => s.id === record.id);
  if (idx >= 0) {
    sessions[idx] = record;
  } else {
    sessions.unshift(record);
    if (sessions.length > LEARN_MAX_SESSIONS) sessions.pop();
  }

  await chrome.storage.local.set({ [LEARN_STORAGE_KEY]: sessions });
  return { success: true, data: { session: record } };
}

async function learnSessionList() {
  const stored = await chrome.storage.local.get(LEARN_STORAGE_KEY);
  const sessions = Array.isArray(stored[LEARN_STORAGE_KEY]) ? stored[LEARN_STORAGE_KEY] : [];
  return { success: true, data: { sessions } };
}

async function learnSessionDelete(sessionId) {
  if (!sessionId) return { success: false, error: 'sessionId required' };
  const stored = await chrome.storage.local.get(LEARN_STORAGE_KEY);
  const sessions = (
    Array.isArray(stored[LEARN_STORAGE_KEY]) ? stored[LEARN_STORAGE_KEY] : []
  ).filter((s) => s.id !== sessionId);
  await chrome.storage.local.set({ [LEARN_STORAGE_KEY]: sessions });
  return { success: true };
}

// ── Deep scan workflow ────────────────────────────────────────────────────────

async function learnDeepScan(tabId) {
  let resolvedTabId = tabId;
  if (!resolvedTabId) {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    resolvedTabId = activeTab?.id;
  }
  if (!resolvedTabId) return { success: false, error: 'No active tab found' };

  // Phase 1: full structural extraction
  let extracted;
  try {
    extracted = await chrome.tabs.sendMessage(resolvedTabId, { type: 'LEARN_EXTRACT_FULL' });
  } catch (err) {
    return { success: false, error: `Content script unavailable: ${err.message}` };
  }
  if (!extracted?.success)
    return { success: false, error: extracted?.error || 'Extraction failed' };

  // Phase 2: URL inspection — parallel HEAD requests via content script
  // (content script runs in page context so same-origin requests bypass CORS)
  let urlReport = [];
  const internalUrls = (extracted.links?.internal || []).map((l) => l.href);
  if (internalUrls.length > 0) {
    try {
      const inspected = await chrome.tabs.sendMessage(resolvedTabId, {
        type: 'LEARN_INSPECT_URLS',
        urls: internalUrls.slice(0, 20),
      });
      if (inspected?.success) urlReport = inspected.results || [];
    } catch (_) {
      // URL inspection is best-effort; continue without it
    }
  }

  // Phase 3: build rich raw text and send to AI
  const rawText = buildDeepScanRawText(extracted, urlReport);
  const docResult = await learnGenerateDocument(rawText);
  if (!docResult.success) return { success: false, error: docResult.error };

  return {
    success: true,
    data: {
      url: extracted.url,
      title: extracted.title,
      document: docResult.content,
      rawText: rawText.slice(0, 5000),
      pageType: extracted.pageType || 'generic',
      hasVideo: Boolean(extracted.hasVideo),
      hasCaptions: Boolean(extracted.hasCaptions),
      buttonCount: (extracted.buttons || []).length,
      formCount: (extracted.forms || []).length,
      internalLinkCount: (extracted.links?.internal || []).length,
      externalLinkCount: (extracted.links?.external || []).length,
      urlReport,
      interactives: extracted.interactives || {},
    },
  };
}

function buildDeepScanRawText(extracted, urlReport) {
  const parts = [
    `# ${extracted.title}`,
    `URL: ${extracted.url}`,
    extracted.description ? `Description: ${extracted.description}` : '',
    '',
    '## Page Content',
    (extracted.fullText || '').slice(0, 6000),
    '',
  ];

  // Buttons / CTAs
  if (extracted.buttons?.length > 0) {
    parts.push('## Interactive Elements (Buttons & Actions)');
    extracted.buttons.forEach((b) => {
      let line = `- "${b.text}"`;
      if (b.formAction) line += ` → submits to ${b.formAction} [${b.formMethod}]`;
      if (b.disabled) line += ' [disabled]';
      parts.push(line);
    });
    parts.push('');
  }

  // Forms
  if (extracted.forms?.length > 0) {
    parts.push('## Forms');
    extracted.forms.forEach((f) => {
      parts.push(`### ${f.id} — ${f.method} ${f.action || '(same page)'}`);
      f.fields.forEach((field) => {
        const req = field.required ? ' *required*' : '';
        const opts = field.options?.length ? ` (options: ${field.options.join(', ')})` : '';
        parts.push(`  - ${field.label || field.name} [${field.type}]${req}${opts}`);
      });
    });
    parts.push('');
  }

  // Internal links
  if (extracted.links?.internal?.length > 0) {
    parts.push('## Internal Navigation');
    extracted.links.internal.slice(0, 30).forEach((l) => {
      parts.push(`- [${l.text || l.path}](${l.href})`);
    });
    parts.push('');
  }

  // External links
  if (extracted.links?.external?.length > 0) {
    parts.push('## External Links');
    extracted.links.external.slice(0, 15).forEach((l) => {
      parts.push(`- [${l.text || l.domain}](${l.href})`);
    });
    parts.push('');
  }

  // URL inspection results
  if (urlReport.length > 0) {
    parts.push('## URL Status Report');
    urlReport.forEach((r) => {
      const icon = !r.status ? '?' : r.status >= 400 ? '✗' : r.status >= 300 ? '↪' : '✓';
      const ct = r.contentType ? ` [${r.contentType}]` : '';
      const redirect = r.finalUrl ? ` → ${r.finalUrl}` : '';
      const err = r.error ? ` (${r.error})` : '';
      parts.push(`${icon} ${r.status || '0'} ${r.url}${ct}${redirect}${err}`);
    });
    parts.push('');
  }

  // Interactive patterns
  const int = extracted.interactives || {};
  const patterns = Object.entries(int)
    .filter(([, v]) => v === true)
    .map(([k]) => k.replace(/^has/, ''))
    .join(', ');
  if (patterns) {
    parts.push('## UI Patterns Detected');
    parts.push(patterns);
    parts.push('');
  }

  // iframes
  if (extracted.iframes?.length > 0) {
    parts.push('## Embedded Content');
    extracted.iframes.forEach((f) => parts.push(`- ${f.title || 'iframe'}: ${f.src}`));
  }

  return parts
    .filter((p) => p !== undefined)
    .join('\n')
    .trim();
}

// Expose on globalThis so background.js dispatch can call them
globalThis.learnDeepScan = learnDeepScan;
globalThis.learnScanPage = learnScanPage;
globalThis.learnStartCaptionListener = learnStartCaptionListener;
globalThis.learnStopCaptionListener = learnStopCaptionListener;
globalThis.learnGetCaptionSession = learnGetCaptionSession;
globalThis.learnAppendCaptionCue = learnAppendCaptionCue;
globalThis.learnGenerateDocument = learnGenerateDocument;
globalThis.learnGenerateSkills = learnGenerateSkills;
globalThis.learnSessionSave = learnSessionSave;
globalThis.learnSessionList = learnSessionList;
globalThis.learnSessionDelete = learnSessionDelete;
