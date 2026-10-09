const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const TEMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'sue-api-test-'));
const DATA_FILE = path.join(TEMP_DIR, 'sue-local-api.json');
const PORT = 18080 + Math.floor(Math.random() * 1000);
const BASE_URL = `http://127.0.0.1:${PORT}/api/v1`;

let serverProcess;

async function waitForServer() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 15_000) {
    try {
      const response = await fetch(`${BASE_URL}/status`);
      if (response.ok) {
        return;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error('Timed out waiting for local API server');
}

async function api(pathname, options = {}) {
  const response = await fetch(`${BASE_URL}${pathname}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const payload = await response.json();
  return { response, payload };
}

test.before(async () => {
  serverProcess = spawn(process.execPath, ['local-api-server.js'], {
    cwd: path.resolve(__dirname, '../..'),
    env: {
      ...process.env,
      SUE_API_HOST: '127.0.0.1',
      SUE_API_PORT: String(PORT),
      SUE_API_DATA_FILE: DATA_FILE,
      SUE_API_ENABLE_TEST_HELPERS: '1',
    },
    stdio: 'ignore',
  });

  await waitForServer();
});

test.after(async () => {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
    await new Promise((resolve) => serverProcess.once('exit', resolve));
  }

  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
});

test('status exposes readiness and backing data file', async () => {
  const { response, payload } = await api('/status');

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.api, 'ready');
  assert.equal(payload.data.data_file, DATA_FILE);
});

test('auth register, login, and refresh succeed end-to-end', async () => {
  const username = `tester-${Date.now()}`;
  const password = 'sue-password';

  const registerResult = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  assert.equal(registerResult.response.status, 201);
  assert.equal(registerResult.payload.success, true);
  assert.equal(registerResult.payload.user.username, username);

  const loginResult = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  assert.equal(loginResult.response.status, 200);
  assert.equal(loginResult.payload.success, true);
  assert.ok(loginResult.payload.session.token);

  const refreshResult = await api('/auth/refresh', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${loginResult.payload.session.token}`,
    },
  });
  assert.equal(refreshResult.response.status, 200);
  assert.equal(refreshResult.payload.success, true);
  assert.equal(refreshResult.payload.session.username, username);
});

test('validation rejects malformed project, note, and method usage', async () => {
  const projectResult = await api('/projects', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  assert.equal(projectResult.response.status, 400);
  assert.match(projectResult.payload.error, /Project name is required/);

  const noteResult = await api('/notes', {
    method: 'POST',
    body: JSON.stringify({ title: 'Bad note', pinned: 'yes' }),
  });
  assert.equal(noteResult.response.status, 400);
  assert.match(noteResult.payload.error, /Note pinned must be a boolean/);

  const methodResult = await api('/notes', {
    method: 'PUT',
  });
  assert.equal(methodResult.response.status, 405);
  assert.match(methodResult.payload.error, /Method not allowed/);
});

test('test helpers reset and seed deterministic state', async () => {
  const resetResult = await api('/test/reset', {
    method: 'POST',
    body: JSON.stringify({ preset: 'empty' }),
  });
  assert.equal(resetResult.response.status, 200);
  assert.equal(resetResult.payload.data.project_count, 0);
  assert.equal(resetResult.payload.data.note_count, 0);

  const seedResult = await api('/test/seed', {
    method: 'POST',
    body: JSON.stringify({
      preset: 'empty',
      projects: [{ name: 'Seeded Project', status: 'doing' }],
      notes: [{ title: 'Seeded Note', body: 'Seeded body', pinned: true }],
    }),
  });
  assert.equal(seedResult.response.status, 200);
  assert.equal(seedResult.payload.data.project_count, 1);
  assert.equal(seedResult.payload.data.note_count, 1);

  const projectsResult = await api('/projects');
  assert.equal(projectsResult.payload.data[0].name, 'Seeded Project');

  const notesResult = await api('/notes');
  assert.equal(notesResult.payload.data[0].title, 'Seeded Note');
  assert.equal(notesResult.payload.data[0].pinned, true);
});
