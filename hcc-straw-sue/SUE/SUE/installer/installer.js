'use strict';

/**
 * SUE Setup v5.0.0 — One-click Windows installer
 * Compiled to SUE-Setup.exe via pkg (node18-win-x64).
 * Bundled assets: sue-host.exe, sue-api.exe
 *
 * What it does:
 *   1. Copies the extension/ folder (alongside this exe) → %LOCALAPPDATA%\SUE\extension\
 *   2. Extracts sue-host.exe + sue-api.exe → %LOCALAPPDATA%\SUE\
 *   3. Writes the native messaging host manifest
 *   4. Registers the manifest for Chrome and Edge (HKCU registry)
 *   5. Adds sue-api.exe to Windows startup (HKCU Run key)
 *   6. Starts the API server immediately (no reboot required)
 *   7. Copies the extension path to clipboard
 *   8. Opens Chrome to chrome://extensions
 *   9. Opens a local getting-started guide in the default browser
 */

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { execSync, spawn } = require('child_process');

// ── Config ───────────────────────────────────────────────────────────────────

const VERSION      = '5.0.0';
const EXTENSION_ID = 'hlfmlaemeoaaeoccpdlhembcljiojcom';
const HOST_NAME    = 'com.hammurabi.sue.nativehost';
const INSTALL_DIR  = path.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
  'SUE'
);
const EXT_DIR      = path.join(INSTALL_DIR, 'extension');

// ── Terminal colours ─────────────────────────────────────────────────────────

const G = '\x1b[32m';  // green
const R = '\x1b[31m';  // red
const C = '\x1b[36m';  // cyan
const Y = '\x1b[33m';  // yellow
const B = '\x1b[1m';   // bold
const X = '\x1b[0m';   // reset

function ok  (msg) { console.log(`  ${G}✓${X} ${msg}`); }
function fail(msg) { console.log(`  ${R}✗${X} ${msg}`); }
function warn(msg) { console.log(`  ${Y}!${X} ${msg}`); }
function sec (msg) { console.log(`\n${C}▸${X} ${B}${msg}${X}`); }
function div ()    { console.log(`${C}${'─'.repeat(58)}${X}`); }

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Recursively copy a directory. */
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

/** Count files recursively. */
function countFiles(dir) {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    n += e.isDirectory() ? countFiles(path.join(dir, e.name)) : 1;
  }
  return n;
}

/** Copy clipboard contents using PowerShell. */
function copyToClipboard(text) {
  try {
    execSync(`powershell -Command "Set-Clipboard -Value '${text}'"`, { windowsHide: true });
    return true;
  } catch (_) { return false; }
}

/** Run a reg add command, swallow errors silently. */
function regAdd(key, flags) {
  try {
    execSync(`reg add "${key}" ${flags} /f`, { windowsHide: true });
    return true;
  } catch (_) { return false; }
}

/** Find an installed Chrome or Edge executable. */
function findBrowser() {
  const candidates = [
    ['Chrome', path.join(process.env.PROGRAMFILES  || '', 'Google\\Chrome\\Application\\chrome.exe')],
    ['Chrome', path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google\\Chrome\\Application\\chrome.exe')],
    ['Chrome', path.join(process.env.LOCALAPPDATA  || '', 'Google\\Chrome\\Application\\chrome.exe')],
    ['Edge',   path.join(process.env.PROGRAMFILES  || '', 'Microsoft\\Edge\\Application\\msedge.exe')],
    ['Edge',   path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft\\Edge\\Application\\msedge.exe')],
  ];
  for (const [name, p] of candidates) {
    if (p && fs.existsSync(p)) return { name, path: p };
  }
  return null;
}

/** Sleep for ms milliseconds. */
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/** Wait for a keypress. */
function waitForKeypress() {
  return new Promise(resolve => {
    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', () => { process.stdin.pause(); resolve(); });
  });
}

// ── Getting-started HTML (generated at install time with exact paths) ─────────

function buildGettingStartedHtml(extDir, browser) {
  const safeDir = extDir.replace(/\\/g, '\\\\');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SUE — Installation Guide</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a14;color:#f1f5f9;min-height:100vh;padding:40px 20px}
  .wrap{max-width:640px;margin:0 auto}
  h1{font-size:24px;font-weight:800;background:linear-gradient(135deg,#d946ef,#8b5cf6,#6366f1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:6px}
  .sub{color:#94a3b8;font-size:14px;margin-bottom:32px}
  .step{background:rgba(255,255,255,0.04);border:1px solid rgba(139,92,246,0.2);border-radius:12px;padding:20px 24px;margin-bottom:14px;display:flex;gap:18px;align-items:flex-start}
  .num{width:36px;height:36px;min-width:36px;background:linear-gradient(135deg,#d946ef,#8b5cf6);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px}
  .step-body h3{font-size:15px;font-weight:700;color:#f8fafc;margin-bottom:5px}
  .step-body p{font-size:13px;color:#94a3b8;line-height:1.6}
  .path-box{background:#0f0f1a;border:1px solid rgba(139,92,246,0.35);border-radius:8px;padding:12px 16px;font-family:'Consolas','Monaco',monospace;font-size:13px;color:#a78bfa;margin-top:10px;word-break:break-all}
  .open-btn{display:inline-block;margin-top:12px;padding:8px 18px;background:linear-gradient(135deg,#d946ef,#8b5cf6);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;text-decoration:none}
  .done{background:rgba(52,211,153,0.08);border-color:rgba(52,211,153,0.3);margin-top:24px;padding:16px 24px;border-radius:12px;border:1px solid;color:#6ee7b7;font-size:13px;line-height:1.7}
  .tag{display:inline-block;background:rgba(139,92,246,0.2);color:#c4b5fd;font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px}
</style>
</head>
<body>
<div class="wrap">
  <div class="tag">SUE v${VERSION} — Setup Complete</div>
  <h1>One last step in ${browser || 'Chrome'}</h1>
  <p class="sub">The SUE backend is installed and running. Load the extension to finish.</p>

  <div class="step">
    <div class="num">1</div>
    <div class="step-body">
      <h3>Open the Extensions page</h3>
      <p>In ${browser || 'Chrome'}, navigate to the extensions manager.</p>
      <a class="open-btn" href="chrome://extensions" target="_blank">Open chrome://extensions</a>
    </div>
  </div>

  <div class="step">
    <div class="num">2</div>
    <div class="step-body">
      <h3>Enable Developer mode</h3>
      <p>Toggle the <strong>Developer mode</strong> switch in the <strong>top-right corner</strong> of the page. New buttons will appear.</p>
    </div>
  </div>

  <div class="step">
    <div class="num">3</div>
    <div class="step-body">
      <h3>Click "Load unpacked" and select this folder</h3>
      <p>Click the <strong>Load unpacked</strong> button, navigate to the folder below, and click <strong>Select Folder</strong>.</p>
      <div class="path-box">${extDir}</div>
      <p style="margin-top:8px;font-size:12px;color:#64748b">The path was also copied to your clipboard.</p>
    </div>
  </div>

  <div class="done">
    <strong style="color:#34d399">✓ That's it!</strong>&nbsp; The SUE sidebar will appear.
    Press <strong>Ctrl+Shift+A</strong> (or click the puzzle-piece icon → SUE) to open it.
    The API server starts automatically with Windows.
  </div>
</div>
</body>
</html>`;
}

// ── Main installer ────────────────────────────────────────────────────────────

async function install() {
  console.clear();
  console.log(`\n${B}╔${'═'.repeat(54)}╗${X}`);
  console.log(`${B}║${X}${C}${B}   SUE — Sovereign AI Sidebar  v${VERSION}${' '.repeat(21)}${X}${B}║${X}`);
  console.log(`${B}╚${'═'.repeat(54)}╝${X}\n`);
  console.log(`Installing to: ${Y}${INSTALL_DIR}${X}\n`);

  // ── Step 1: Locate extension source ────────────────────────────────────────
  sec('Locating extension files');

  // When compiled with pkg, process.execPath is the .exe path.
  // The extension/ folder lives alongside the exe in the ZIP.
  const exeDir = path.dirname(
    process.pkg ? process.execPath : __filename
  );
  const extSrc = path.join(exeDir, 'extension');

  if (!fs.existsSync(extSrc)) {
    fail(`extension/ folder not found next to the installer.`);
    fail(`Expected: ${extSrc}`);
    fail(`Make sure you extracted the full ZIP before running this installer.`);
    console.log('\nPress any key to exit...');
    await waitForKeypress();
    process.exit(1);
  }
  ok(`Found extension/ at ${extSrc}`);

  // ── Step 2: Create install directory and copy extension ──────────────────
  sec('Installing extension files');

  fs.mkdirSync(EXT_DIR, { recursive: true });
  copyDir(extSrc, EXT_DIR);
  const fileCount = countFiles(EXT_DIR);
  ok(`${fileCount} files copied → extension\\`);

  // ── Step 3: Extract bundled executables ────────────────────────────────────
  sec('Installing SUE backend components');

  const hostExePath = path.join(INSTALL_DIR, 'sue-host.exe');
  const apiExePath  = path.join(INSTALL_DIR, 'sue-api.exe');

  const hostData = fs.readFileSync(path.join(__dirname, 'assets', 'sue-host.exe'));
  fs.writeFileSync(hostExePath, hostData);
  ok(`sue-host.exe  (${(hostData.length / 1_048_576).toFixed(1)} MB)`);

  const apiData = fs.readFileSync(path.join(__dirname, 'assets', 'sue-api.exe'));
  fs.writeFileSync(apiExePath, apiData);
  ok(`sue-api.exe   (${(apiData.length / 1_048_576).toFixed(1)} MB)`);

  // ── Step 4: Write native messaging host manifest ──────────────────────────
  sec('Registering native messaging host');

  const manifestPath = path.join(INSTALL_DIR, 'host-manifest.json');
  const hostManifest = {
    name: HOST_NAME,
    description: 'SUE Native Host — bridges Chrome extension to local API server',
    path: hostExePath,
    type: 'stdio',
    allowed_origins: [`chrome-extension://${EXTENSION_ID}/`],
  };
  fs.writeFileSync(manifestPath, JSON.stringify(hostManifest, null, 2));
  ok('host-manifest.json written');

  const chromeKey = `HKCU\\SOFTWARE\\Google\\Chrome\\NativeMessagingHosts\\${HOST_NAME}`;
  const edgeKey   = `HKCU\\SOFTWARE\\Microsoft\\Edge\\NativeMessagingHosts\\${HOST_NAME}`;

  if (regAdd(chromeKey, `/ve /d "${manifestPath}"`)) {
    ok('Registered for Google Chrome');
  } else {
    warn('Chrome registration skipped (Chrome may not be installed)');
  }
  if (regAdd(edgeKey, `/ve /d "${manifestPath}"`)) {
    ok('Registered for Microsoft Edge');
  } else {
    warn('Edge registration skipped (Edge may not be installed)');
  }

  // ── Step 5: Add to Windows startup ───────────────────────────────────────
  sec('Configuring automatic startup');

  const runKey = `HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run`;
  if (regAdd(runKey, `/v "SUE API Server" /d "${apiExePath}"`)) {
    ok('API server will start automatically with Windows');
  } else {
    warn('Could not add to startup — you may need to start sue-api.exe manually');
  }

  // ── Step 6: Start the server right now ────────────────────────────────────
  sec('Starting SUE API server');

  const child = spawn(apiExePath, [], { detached: true, stdio: 'ignore', windowsHide: true });
  child.unref();
  await sleep(2000);
  ok('API server started at http://127.0.0.1:8080');

  // ── Step 7: Create getting-started guide ──────────────────────────────────
  const browser = findBrowser();
  const guideHtml = buildGettingStartedHtml(EXT_DIR, browser?.name || 'Chrome');
  const guidePath = path.join(INSTALL_DIR, 'getting-started.html');
  fs.writeFileSync(guidePath, guideHtml);

  // ── Step 8: Copy extension path to clipboard ──────────────────────────────
  const clipOk = copyToClipboard(EXT_DIR);

  // ── Step 9: Open Chrome / Edge to extensions page ────────────────────────
  sec('Opening browser');

  if (browser) {
    const extFlag = browser.name === 'Edge' ? 'edge://extensions' : 'chrome://extensions';
    try {
      spawn(browser.path, [extFlag], { detached: true, stdio: 'ignore' }).unref();
      ok(`Opened ${browser.name} → ${extFlag}`);
    } catch (_) {
      warn(`Could not open ${browser.name} automatically`);
    }
  } else {
    warn('Chrome/Edge not detected — open manually');
  }

  // Always open the local guide in the default browser
  try {
    execSync(`start "" "file:///${guidePath.replace(/\\/g, '/')}"`, { windowsHide: true });
    ok('Installation guide opened in default browser');
  } catch (_) {
    warn(`Open this file manually: ${guidePath}`);
  }

  // ── Done ─────────────────────────────────────────────────────────────────
  console.log(`\n${G}${B}╔${'═'.repeat(54)}╗${X}`);
  console.log(`${G}${B}║   Installation complete! ✓${' '.repeat(28)}║${X}`);
  console.log(`${G}${B}╚${'═'.repeat(54)}╝${X}\n`);

  div();
  console.log(`${B} FINAL STEP — Load the extension in Chrome/Edge${X}`);
  div();
  console.log(` ${B}1.${X} Go to  ${C}chrome://extensions${X}  (just opened)`);
  console.log(` ${B}2.${X} Enable ${Y}Developer mode${X}  (toggle, top-right)`);
  console.log(` ${B}3.${X} Click  ${Y}Load unpacked${X}`);
  console.log(` ${B}4.${X} Select this folder:\n`);
  console.log(`    ${Y}${B}${EXT_DIR}${X}`);
  if (clipOk) {
    console.log(`\n    ${G}[Path copied to clipboard — just paste!]${X}`);
  }
  div();
  console.log(`\n Press ${B}Ctrl+Shift+A${X} anytime to open the SUE sidebar.\n`);

  console.log('Press any key to finish...');
  await waitForKeypress();
}

// ── Entry point ───────────────────────────────────────────────────────────────

if (process.argv.includes('--verify')) {
  // Quick asset check without installing
  try {
    const h = fs.readFileSync(path.join(__dirname, 'assets', 'sue-host.exe'));
    const a = fs.readFileSync(path.join(__dirname, 'assets', 'sue-api.exe'));
    console.log(`sue-host.exe : ${(h.length / 1_048_576).toFixed(1)} MB — OK`);
    console.log(`sue-api.exe  : ${(a.length / 1_048_576).toFixed(1)} MB — OK`);
    const extSrc = path.join(path.dirname(process.execPath), 'extension');
    if (fs.existsSync(extSrc)) {
      console.log(`extension/   : ${countFiles(extSrc)} files — OK`);
    } else {
      console.log(`extension/   : NOT FOUND at ${extSrc}`);
    }
    process.exit(0);
  } catch (e) {
    console.error('FAIL:', e.message);
    process.exit(1);
  }
}

install().catch(err => {
  console.error(`\n${R}${B}Installation failed:${X} ${err.message}`);
  console.error('\nTry right-clicking SUE-Setup.exe and selecting "Run as administrator".');
  console.error(`\nError details: ${err.stack || err.message}`);
  waitForKeypress().then(() => process.exit(1));
});
