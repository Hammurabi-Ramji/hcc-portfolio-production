const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const HOST = process.env.SUE_API_HOST || '127.0.0.1';
const PORT = Number(process.env.SUE_API_PORT || 8080);
// When compiled with pkg, __dirname is a virtual snapshot path — use LOCALAPPDATA instead.
const DEFAULT_DATA_DIR = process.pkg
  ? path.join(
      process.env.LOCALAPPDATA || path.join(require('os').homedir(), 'AppData', 'Local'),
      'SUE',
      'data'
    )
  : path.join(__dirname, 'data');
const DATA_FILE =
  process.env.SUE_API_DATA_FILE || path.join(DEFAULT_DATA_DIR, 'sue-local-api.json');
const DATA_DIR = path.dirname(DATA_FILE);
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const OTP_TTL_MS = 1000 * 60 * 10; // 10 minutes
const MAX_TEXT_LENGTH = 8000;
const TEST_HELPERS_ENABLED = process.env.SUE_API_ENABLE_TEST_HELPERS !== '0';

// In-memory OTP store — not persisted to disk intentionally
const otpStore = new Map(); // email -> { code, expires_at }

function buildInitialState({ preset = 'default' } = {}) {
  const defaultUser = buildUser('sue', 'sue');
  const hasWelcomeNote = preset !== 'empty';

  return {
    users: [defaultUser],
    sessions: [],
    projects: [],
    notes: hasWelcomeNote
      ? [
          {
            id: crypto.randomUUID(),
            title: 'Welcome',
            body: 'SUE local API is ready. Create notes, projects, and chat from the sidebar.',
            pinned: true,
            created_at: Date.now(),
            updated_at: Date.now(),
          },
        ]
      : [],
    memories: [],
  };
}

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(buildInitialState(), null, 2));
  }
}

function readState() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeState(state) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

function nowIso() {
  return new Date().toISOString();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, encoded) {
  const [salt, expected] = String(encoded).split(':');
  if (!salt || !expected) {
    return false;
  }

  const actual = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}

function buildUser(username, password) {
  return {
    id: crypto.randomUUID(),
    username,
    password_hash: hashPassword(password),
    created_at: Date.now(),
  };
}

function buildSession(user) {
  const createdAt = Date.now();
  return {
    session_id: crypto.randomUUID(),
    token: crypto.randomBytes(32).toString('hex'),
    user_id: user.id,
    username: user.username,
    email: user.email || null,
    created_at: createdAt,
    expires_at: createdAt + SESSION_TTL_MS,
    last_activity: createdAt,
    is_active: true,
  };
}

function buildEmailUser(email) {
  return {
    id: crypto.randomUUID(),
    username: email,
    email,
    password_hash: null,
    api_settings: {},
    created_at: Date.now(),
  };
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

function notFound(res) {
  sendJson(res, 404, { success: false, error: 'Not found' });
}

function badRequest(res, message) {
  sendJson(res, 400, { success: false, error: message });
}

function methodNotAllowed(res, method) {
  sendJson(res, 405, { success: false, error: `Method not allowed: ${method}` });
}

function parseUrl(req) {
  return new URL(req.url || '/', `http://${req.headers.host || `${HOST}:${PORT}`}`);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function getBearerToken(req) {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice('Bearer '.length);
}

function getSession(state, req) {
  const token = getBearerToken(req);
  if (!token) {
    return null;
  }

  const session = state.sessions.find((entry) => entry.token === token && entry.is_active);
  if (!session) {
    return null;
  }

  if (session.expires_at < Date.now()) {
    session.is_active = false;
    writeState(state);
    return null;
  }

  session.last_activity = Date.now();
  return session;
}

function buildAudit(state) {
  return {
    generated_at: nowIso(),
    project_count: state.projects.length,
    note_count: state.notes.length,
    active_session_count: state.sessions.filter((entry) => entry.is_active).length,
  };
}

function clampText(value, fieldName) {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (trimmed.length > MAX_TEXT_LENGTH) {
    throw new Error(`${fieldName} is too long`);
  }

  return trimmed;
}

function validateProjectInput(body, { partial = false } = {}) {
  const next = {};
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'name')) {
    const name = clampText(body.name ?? '', 'Project name');
    if (!partial && !name) {
      throw new Error('Project name is required');
    }
    if (name) {
      next.name = name;
    }
  }
  if (Object.prototype.hasOwnProperty.call(body, 'description')) {
    next.description = clampText(body.description ?? '', 'Project description');
  }
  if (Object.prototype.hasOwnProperty.call(body, 'status')) {
    if (!['todo', 'doing', 'done'].includes(body.status)) {
      throw new Error('Project status must be todo, doing, or done');
    }
    next.status = body.status;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'tag')) {
    if (body.tag !== null && typeof body.tag !== 'string') {
      throw new Error('Project tag must be a string or null');
    }
    next.tag = body.tag === null ? null : clampText(body.tag, 'Project tag');
  }
  return next;
}

function validateMemoryInput(body, { partial = false } = {}) {
  const next = {};
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'url')) {
    const url = clampText(body.url ?? '', 'Memory URL');
    if (!partial && !url) {
      throw new Error('Memory URL is required');
    }
    if (url) {
      next.url = url;
    }
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'title')) {
    next.title = clampText(body.title ?? 'Untitled', 'Memory title') || 'Untitled';
  }
  if (Object.prototype.hasOwnProperty.call(body, 'content_text')) {
    next.content_text =
      typeof body.content_text === 'string' ? body.content_text.slice(0, MAX_TEXT_LENGTH) : null;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'content_images')) {
    if (!Array.isArray(body.content_images)) {
      throw new Error('Memory content_images must be an array');
    }
    next.content_images = body.content_images.map(String);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'content_videos')) {
    if (!Array.isArray(body.content_videos)) {
      throw new Error('Memory content_videos must be an array');
    }
    next.content_videos = body.content_videos.map(String);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'tags')) {
    if (!Array.isArray(body.tags)) {
      throw new Error('Memory tags must be an array');
    }
    next.tags = body.tags.map(String);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'metadata')) {
    if (typeof body.metadata !== 'object' || body.metadata === null) {
      throw new Error('Memory metadata must be an object');
    }
    next.metadata = body.metadata;
  }
  return next;
}

function validateNoteInput(body, { partial = false } = {}) {
  const next = {};
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'title')) {
    next.title = clampText(body.title ?? 'Untitled', 'Note title') || 'Untitled';
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'body')) {
    next.body = typeof body.body === 'string' ? body.body.slice(0, MAX_TEXT_LENGTH) : '';
  }
  if (Object.prototype.hasOwnProperty.call(body, 'pinned')) {
    if (typeof body.pinned !== 'boolean') {
      throw new Error('Note pinned must be a boolean');
    }
    next.pinned = body.pinned;
  }
  return next;
}

function buildProjectRecord(input) {
  return {
    id: input.id || crypto.randomUUID(),
    name: input.name,
    description: input.description ?? '',
    status: input.status ?? 'todo',
    tag: input.tag ?? null,
    created_at: input.created_at ?? Date.now(),
    updated_at: input.updated_at ?? Date.now(),
  };
}

function buildMemoryRecord(input) {
  return {
    id: input.id || crypto.randomUUID(),
    url: input.url,
    title: input.title,
    content_text: input.content_text ?? null,
    content_images: input.content_images ?? [],
    content_videos: input.content_videos ?? [],
    captured_at: input.captured_at ?? Date.now(),
    tags: input.tags ?? [],
    metadata: input.metadata ?? {},
  };
}

function buildNoteRecord(input) {
  return {
    id: input.id || crypto.randomUUID(),
    title: input.title,
    body: input.body,
    pinned: input.pinned ?? false,
    created_at: input.created_at ?? Date.now(),
    updated_at: input.updated_at ?? Date.now(),
  };
}

function buildSeedState(body = {}) {
  const preset = body.preset === 'empty' ? 'empty' : 'default';
  const nextState = buildInitialState({ preset });

  if (Array.isArray(body.projects)) {
    nextState.projects = body.projects.map((entry) =>
      buildProjectRecord(validateProjectInput(entry))
    );
  }

  if (Array.isArray(body.notes)) {
    nextState.notes = body.notes.map((entry) => buildNoteRecord(validateNoteInput(entry)));
  }

  return nextState;
}

async function route(req, res) {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  const url = parseUrl(req);
  const state = readState();
  const { pathname } = url;

  if (pathname === '/api/v1/status' && req.method === 'GET') {
    sendJson(res, 200, {
      success: true,
      data: {
        api: 'ready',
        version: '4.0.0',
        generated_at: nowIso(),
        data_file: DATA_FILE,
        test_helpers: TEST_HELPERS_ENABLED,
      },
    });
    return;
  }

  if (pathname === '/api/v1/test/enabled' && req.method === 'GET') {
    if (!TEST_HELPERS_ENABLED) {
      notFound(res);
      return;
    }

    sendJson(res, 200, { success: true, data: { enabled: true } });
    return;
  }

  if (pathname === '/api/v1/test/page' && req.method === 'GET') {
    if (!TEST_HELPERS_ENABLED) {
      notFound(res);
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>SUE Context Page</title>
  </head>
  <body>
    <main id="app">Context body</main>
  </body>
</html>`);
    return;
  }

  if (pathname === '/api/v1/test/reset' && req.method === 'POST') {
    if (!TEST_HELPERS_ENABLED) {
      notFound(res);
      return;
    }

    const body = await readBody(req);
    const preset = body.preset === 'empty' ? 'empty' : 'default';
    const nextState = buildInitialState({ preset });
    writeState(nextState);
    sendJson(res, 200, { success: true, data: buildAudit(nextState) });
    return;
  }

  if (pathname === '/api/v1/test/seed' && req.method === 'POST') {
    if (!TEST_HELPERS_ENABLED) {
      notFound(res);
      return;
    }

    const body = await readBody(req);
    let nextState;
    try {
      nextState = buildSeedState(body);
    } catch (error) {
      badRequest(res, error.message);
      return;
    }

    writeState(nextState);
    sendJson(res, 200, { success: true, data: buildAudit(nextState) });
    return;
  }

  if (pathname === '/api/v1/audit' && req.method === 'GET') {
    sendJson(res, 200, { success: true, data: buildAudit(state) });
    return;
  }

  if (pathname === '/api/v1/auth/register' && req.method === 'POST') {
    const body = await readBody(req);
    const username = String(body.username || '')
      .trim()
      .toLowerCase();
    const password = String(body.password || '');

    if (!username || !password) {
      badRequest(res, 'username and password are required');
      return;
    }

    if (state.users.some((user) => user.username === username)) {
      sendJson(res, 409, { success: false, error: 'User already exists' });
      return;
    }

    const user = buildUser(username, password);
    const session = buildSession(user);
    state.users.push(user);
    state.sessions.push(session);
    writeState(state);
    sendJson(res, 201, { success: true, session, user: { id: user.id, username: user.username } });
    return;
  }

  if (pathname === '/api/v1/auth/login' && req.method === 'POST') {
    const body = await readBody(req);
    const username = String(body.username || '')
      .trim()
      .toLowerCase();
    const password = String(body.password || '');
    const user = state.users.find((entry) => entry.username === username);

    if (!user || !verifyPassword(password, user.password_hash)) {
      sendJson(res, 401, { success: false, error: 'Invalid credentials' });
      return;
    }

    const session = buildSession(user);
    state.sessions.push(session);
    writeState(state);
    sendJson(res, 200, { success: true, session, user: { id: user.id, username: user.username } });
    return;
  }

  if (pathname === '/api/v1/auth/refresh' && req.method === 'POST') {
    const session = getSession(state, req);
    if (!session) {
      sendJson(res, 401, { success: false, error: 'Session expired' });
      return;
    }

    session.expires_at = Date.now() + SESSION_TTL_MS;
    session.last_activity = Date.now();
    writeState(state);
    sendJson(res, 200, { success: true, session });
    return;
  }

  if (pathname === '/api/v1/projects' && req.method === 'GET') {
    sendJson(res, 200, { success: true, data: state.projects });
    return;
  }

  if (pathname === '/api/v1/projects' && req.method === 'POST') {
    const body = await readBody(req);
    let projectInput;
    try {
      projectInput = validateProjectInput(body);
    } catch (error) {
      badRequest(res, error.message);
      return;
    }

    const project = {
      id: crypto.randomUUID(),
      name: projectInput.name,
      description: projectInput.description ?? '',
      status: projectInput.status ?? 'todo',
      tag: projectInput.tag ?? null,
      created_at: Date.now(),
      updated_at: Date.now(),
    };
    state.projects.push(project);
    writeState(state);
    sendJson(res, 201, { success: true, data: project });
    return;
  }

  if (pathname.startsWith('/api/v1/projects/') && req.method === 'PATCH') {
    const projectId = pathname.split('/').pop();
    const body = await readBody(req);
    const project = state.projects.find((entry) => entry.id === projectId);
    if (!project) {
      notFound(res);
      return;
    }

    let projectInput;
    try {
      projectInput = validateProjectInput(body, { partial: true });
    } catch (error) {
      badRequest(res, error.message);
      return;
    }
    Object.assign(project, projectInput);
    project.updated_at = Date.now();
    writeState(state);
    sendJson(res, 200, { success: true, data: project });
    return;
  }

  if (pathname.startsWith('/api/v1/projects/') && req.method === 'DELETE') {
    const projectId = pathname.split('/').pop();
    const before = state.projects.length;
    state.projects = state.projects.filter((entry) => entry.id !== projectId);
    if (state.projects.length === before) {
      notFound(res);
      return;
    }

    writeState(state);
    sendJson(res, 200, { success: true });
    return;
  }

  if (pathname === '/api/v1/notes' && req.method === 'GET') {
    sendJson(res, 200, { success: true, data: state.notes });
    return;
  }

  if (pathname === '/api/v1/memories' && req.method === 'GET') {
    sendJson(res, 200, { success: true, data: state.memories });
    return;
  }

  if (pathname === '/api/v1/memories' && req.method === 'POST') {
    const body = await readBody(req);
    let memoryInput;
    try {
      memoryInput = validateMemoryInput(body);
    } catch (error) {
      badRequest(res, error.message);
      return;
    }

    const memory = buildMemoryRecord(memoryInput);
    state.memories.push(memory);
    writeState(state);
    sendJson(res, 201, { success: true, data: memory });
    return;
  }

  if (pathname === '/api/v1/notes' && req.method === 'POST') {
    const body = await readBody(req);
    let noteInput;
    try {
      noteInput = validateNoteInput(body);
    } catch (error) {
      badRequest(res, error.message);
      return;
    }
    const note = {
      id: crypto.randomUUID(),
      title: noteInput.title,
      body: noteInput.body,
      pinned: noteInput.pinned ?? false,
      created_at: Date.now(),
      updated_at: Date.now(),
    };
    state.notes.unshift(note);
    writeState(state);
    sendJson(res, 201, { success: true, data: note });
    return;
  }

  if (pathname.startsWith('/api/v1/notes/') && req.method === 'PATCH') {
    const noteId = pathname.split('/').pop();
    const body = await readBody(req);
    const note = state.notes.find((entry) => entry.id === noteId);
    if (!note) {
      notFound(res);
      return;
    }

    let noteInput;
    try {
      noteInput = validateNoteInput(body, { partial: true });
    } catch (error) {
      badRequest(res, error.message);
      return;
    }
    Object.assign(note, noteInput);
    note.updated_at = Date.now();
    writeState(state);
    sendJson(res, 200, { success: true, data: note });
    return;
  }

  if (pathname.startsWith('/api/v1/notes/') && req.method === 'DELETE') {
    const noteId = pathname.split('/').pop();
    const before = state.notes.length;
    state.notes = state.notes.filter((entry) => entry.id !== noteId);
    if (state.notes.length === before) {
      notFound(res);
      return;
    }

    writeState(state);
    sendJson(res, 200, { success: true });
    return;
  }

  // ── OTP Auth ────────────────────────────────────────────────
  if (pathname === '/api/v1/auth/otp/request' && req.method === 'POST') {
    const body = await readBody(req);
    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    if (!email || !email.includes('@')) {
      badRequest(res, 'Valid email address is required');
      return;
    }

    let user = state.users.find((u) => u.email === email);
    if (!user) {
      user = buildEmailUser(email);
      state.users.push(user);
      writeState(state);
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    otpStore.set(email, { code, expires_at: Date.now() + OTP_TTL_MS });

    sendJson(res, 200, {
      success: true,
      data: { otp: code, expires_in: 600 },
    });
    return;
  }

  if (pathname === '/api/v1/auth/otp/verify' && req.method === 'POST') {
    const body = await readBody(req);
    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    const code = String(body.code || '').trim();

    if (!email || !code) {
      badRequest(res, 'email and code are required');
      return;
    }

    const entry = otpStore.get(email);
    if (!entry) {
      sendJson(res, 401, { success: false, error: 'No OTP requested for this email' });
      return;
    }

    if (Date.now() > entry.expires_at) {
      otpStore.delete(email);
      sendJson(res, 401, { success: false, error: 'OTP expired — please request a new code' });
      return;
    }

    if (entry.code !== code) {
      sendJson(res, 401, { success: false, error: 'Invalid code' });
      return;
    }

    otpStore.delete(email);
    const user = state.users.find((u) => u.email === email);
    if (!user) {
      sendJson(res, 500, { success: false, error: 'User record missing' });
      return;
    }

    const session = buildSession(user);
    state.sessions.push(session);
    writeState(state);

    sendJson(res, 200, {
      success: true,
      session,
      user: { id: user.id, email: user.email, username: user.username },
      api_settings: user.api_settings || {},
    });
    return;
  }

  // ── User API settings ────────────────────────────────────────
  if (pathname === '/api/v1/users/me/api-settings' && req.method === 'GET') {
    const session = getSession(state, req);
    if (!session) {
      sendJson(res, 401, { success: false, error: 'Unauthorized' });
      return;
    }
    const user = state.users.find((u) => u.id === session.user_id);
    if (!user) {
      sendJson(res, 404, { success: false, error: 'User not found' });
      return;
    }
    sendJson(res, 200, { success: true, data: user.api_settings || {} });
    return;
  }

  if (pathname === '/api/v1/users/me/api-settings' && req.method === 'PUT') {
    const session = getSession(state, req);
    if (!session) {
      sendJson(res, 401, { success: false, error: 'Unauthorized' });
      return;
    }
    const body = await readBody(req);
    const user = state.users.find((u) => u.id === session.user_id);
    if (!user) {
      sendJson(res, 404, { success: false, error: 'User not found' });
      return;
    }
    const allowed = ['venice_api_key', 'hf_token', 'ollama_url', 'hf_model', 'venice_model'];
    const patch = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        patch[key] = typeof body[key] === 'string' ? body[key].trim() : '';
      }
    }
    user.api_settings = { ...(user.api_settings || {}), ...patch };
    writeState(state);
    sendJson(res, 200, { success: true, data: user.api_settings });
    return;
  }

  if (pathname.startsWith('/api/v1/')) {
    methodNotAllowed(res, req.method);
    return;
  }

  notFound(res);
}

ensureDataFile();

const server = http.createServer((req, res) => {
  route(req, res).catch((error) => {
    console.error('[SUE API] Request failed:', error);
    sendJson(res, 500, { success: false, error: error.message || 'Internal server error' });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[SUE API] Listening on http://${HOST}:${PORT}`);
});
