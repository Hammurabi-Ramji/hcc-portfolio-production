'use strict';

/**
 * SUE Native Messaging Host
 * Launched by Chrome/Edge when the extension connects. Spawns local-api-server.js
 * as a detached subprocess (so it outlives this host process), meaning the
 * extension never requires the server to be started manually.
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

// process.pkg is truthy when running as a pkg-compiled binary; in that case
// __dirname points inside the virtual snapshot, so use process.execPath instead.
// Compiled: exe dir is the install dir. Dev: workspace root is parent of native-host/
const BASE_DIR = process.pkg
  ? path.dirname(process.execPath)
  : path.resolve(__dirname, '..');

// Compiled: run sue-api.exe directly (no Node needed). Dev: run local-api-server.js with node.
const SERVER_CMD = process.pkg ? path.join(BASE_DIR, 'sue-api.exe') : 'node';
const SERVER_ARGS = process.pkg ? [] : [path.join(BASE_DIR, 'local-api-server.js')];
const API_STATUS_URL = 'http://127.0.0.1:8080/api/v1/status';

// ── Native messaging I/O ─────────────────────────────────────────

function sendMessage(obj) {
  const payload = Buffer.from(JSON.stringify(obj), 'utf8');
  const header = Buffer.alloc(4);
  header.writeUInt32LE(payload.length, 0);
  process.stdout.write(Buffer.concat([header, payload]));
}

// ── Server management ────────────────────────────────────────────

function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(API_STATUS_URL, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureServer() {
  if (await checkServer()) return true;

  try {
    const child = spawn(SERVER_CMD, SERVER_ARGS, {
      cwd: BASE_DIR,
      stdio: 'ignore',
      detached: true,
      windowsHide: true,
    });
    child.unref(); // let the server outlive this host process
  } catch {
    return false;
  }

  // Poll up to 5 seconds for the server to become ready
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 500));
    if (await checkServer()) return true;
  }
  return false;
}

// Start the server immediately when Chrome launches this host
ensureServer().catch(() => {});

// ── Message loop ─────────────────────────────────────────────────

let buf = Buffer.alloc(0);

process.stdin.on('data', (chunk) => {
  buf = Buffer.concat([buf, chunk]);
  while (buf.length >= 4) {
    const len = buf.readUInt32LE(0);
    if (buf.length < 4 + len) break;
    const raw = buf.slice(4, 4 + len);
    buf = buf.slice(4 + len);
    let msg;
    try {
      msg = JSON.parse(raw.toString('utf8'));
    } catch {
      continue;
    }
    dispatch(msg);
  }
});

async function dispatch(msg) {
  const { id, command } = msg;
  switch (command) {
    case 'ping':
      sendMessage({ id, payload: { status: 'ok' } });
      break;
    case 'start_server': {
      const started = await ensureServer();
      sendMessage({ id, payload: { started } });
      break;
    }
    case 'server_status': {
      const running = await checkServer();
      sendMessage({ id, payload: { running } });
      break;
    }
    default:
      sendMessage({ id, error: `Unknown command: ${command}` });
  }
}

process.stdin.on('end', () => process.exit(0));
