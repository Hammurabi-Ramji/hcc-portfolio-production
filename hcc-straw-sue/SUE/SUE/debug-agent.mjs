/**
 * SUE Agentic Debugger — CDP WebSocket client
 * Connects to the running SUE service worker via Chrome DevTools Protocol
 * and exposes it as an interactive debugging tool for AI agents.
 */
import { WebSocket } from 'ws';

const SW_TARGET_ID = 'A15C126292FCDCE40F798A2C9F7963C0';
const CDP_URL = `ws://localhost:9222/devtools/page/${SW_TARGET_ID}`;

let msgId = 1;
const pending = new Map();

function cdpSend(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = msgId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }
    }, 15000);
  });
}

async function run() {
  console.log('🔌 Connecting to SUE service worker via CDP...');
  const ws = new WebSocket(CDP_URL);

  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });
  console.log('✅ Connected to SUE service worker');

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      const args = msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ');
      const level = msg.params.type.toUpperCase().padEnd(5);
      console.log(`  [SW ${level}] ${args}`);
    }
  });

  // Enable CDP domains
  await cdpSend(ws, 'Runtime.enable');
  await cdpSend(ws, 'Log.enable');
  console.log('');

  async function evaluate(expr, label) {
    const result = await cdpSend(ws, 'Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    const val = result?.result?.value;
    console.log(`📊 ${label}:`);
    if (typeof val === 'string') {
      try { console.log(JSON.stringify(JSON.parse(val), null, 2)); }
      catch { console.log(val); }
    } else {
      console.log(val);
    }
    console.log('');
    return val;
  }

  // ── Diagnostics ──────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════');
  console.log('  SUE Extension — Live Agent Diagnostic Report');
  console.log('═══════════════════════════════════════════════\n');

  // 1. Service worker identity
  await evaluate(`self.location.href`, 'Service worker URL');

  // 2. Storage state
  await evaluate(
    `new Promise(r => chrome.storage.local.get(null, data => {
      const keys = Object.keys(data);
      const config = {};
      keys.filter(k => k.startsWith('sue_setup')).forEach(k => {
        config[k] = typeof data[k] === 'string' && data[k].length > 4
          ? data[k].substring(0, 4) + '...' : (data[k] || '(empty)');
      });
      r(JSON.stringify({ total_keys: keys.length, sue_config: config }));
    }))`,
    'Storage configuration'
  );

  // 3. Health check
  await evaluate(
    `new Promise(r => chrome.storage.local.get('sue_runtime_health', d => {
      r(JSON.stringify(d.sue_runtime_health ?? null));
    }))`,
    'Runtime health cache'
  );

  // 4. Venice config
  await evaluate(
    `new Promise(async r => {
      const data = await new Promise(res =>
        chrome.storage.local.get(['sue_setup_venice_api_key', 'sue_setup_venice_mode'], res)
      );
      r(JSON.stringify({
        veniceConfigured: !!(data.sue_setup_venice_api_key),
        veniceMode: data.sue_setup_venice_mode || 'api',
        keyPrefix: data.sue_setup_venice_api_key
          ? data.sue_setup_venice_api_key.substring(0, 6) + '...'
          : '(not set)'
      }));
    })`,
    'Venice AI config'
  );

  // 5. HuggingFace config
  await evaluate(
    `new Promise(async r => {
      const data = await new Promise(res =>
        chrome.storage.local.get(['sue_setup_hugging_face_token', 'sue_setup_hf_model'], res)
      );
      r(JSON.stringify({
        hfConfigured: !!(data.sue_setup_hugging_face_token),
        hfModel: data.sue_setup_hf_model || 'mistralai/Mistral-7B-Instruct-v0.3',
        tokenPrefix: data.sue_setup_hugging_face_token
          ? data.sue_setup_hugging_face_token.substring(0, 5) + '...'
          : '(not set)'
      }));
    })`,
    'HuggingFace config'
  );

  // 6. Memory count
  await evaluate(
    `new Promise(r => chrome.storage.local.get('sue_ramemories', d => {
      const mems = Array.isArray(d.sue_ramemories) ? d.sue_ramemories : [];
      r(JSON.stringify({ memory_count: mems.length, latest: mems.slice(-1) }));
    }))`,
    'RAMemory snapshot'
  );

  console.log('═══════════════════════════════════════════════');
  console.log('  Diagnostic complete. SUE agent debug ready.');
  console.log('═══════════════════════════════════════════════');

  ws.close();
}

run().catch(console.error);
