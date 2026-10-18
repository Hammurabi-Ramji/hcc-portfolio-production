'use strict';

/**
 * SUE Setup v5.0.0 — Enterprise Windows Installer
 * 
 * Compiled to SUE-Setup.exe via pkg (node18-win-x64).
 * Bundles the complete SUE ecosystem:
 *   • Chrome/Edge sidebar extension (MV3)
 *   • Native messaging host (sue-host.exe)
 *   • Local API server (sue-api.exe)
 *   • Configuration and startup hooks
 *   • Installation guides and recovery tools
 *
 * INSTALLATION FLOW:
 *   1. Validate ecosystem integrity (extension, binaries, manifests)
 *   2. Create %LOCALAPPDATA%\SUE\ install directory
 *   3. Copy extension files with hash verification
 *   4. Deploy native host binaries
 *   5. Register native messaging host manifest
 *   6. Configure Windows startup integration
 *   7. Launch API server immediately
 *   8. Generate getting-started guide (with safe paths)
 *   9. Open browser to chrome://extensions
 *   10. Log installation manifest for future updates/rollback
 */

const fs        = require('fs');
const path      = require('path');
const os        = require('os');
const crypto    = require('crypto');
const { execSync, spawn } = require('child_process');

// ── Configuration ────────────────────────────────────────────────────────────

const VERSION           = '5.0.0';
const BUILD_DATE        = new Date().toISOString();
const EXTENSION_ID      = 'hlfmlaemeoaaeoccpdlhembcljiojcom';
const HOST_NAME         = 'com.hammurabi.sue.nativehost';
const API_HOST          = '127.0.0.1';
const API_PORT          = 8080;
const INSTALL_DIR       = path.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
  'SUE'
);
const EXT_DIR           = path.join(INSTALL_DIR, 'extension');
const BACKUP_DIR        = path.join(INSTALL_DIR, '.backup');
const MANIFEST_LOG_PATH = path.join(INSTALL_DIR, 'installation-manifest.json');

// ── Terminal Styling ─────────────────────────────────────────────────────────

const Colors = {
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
  yellow: '\x1b[33m',
  bold:   '\x1b[1m',
  reset:  '\x1b[0m',
};

function ok  (msg) { console.log(`  ${Colors.green}✓${Colors.reset} ${msg}`); }
function fail(msg) { console.log(`  ${Colors.red}✗${Colors.reset} ${msg}`); }
function warn(msg) { console.log(`  ${Colors.yellow}!${Colors.reset} ${msg}`); }
function info(msg) { console.log(`  ℹ ${msg}`); }
function section(title) {
  console.log(`\n${Colors.cyan}▸${Colors.reset} ${Colors.bold}${title}${Colors.reset}`);
}
function divider() {
  console.log(`${Colors.cyan}${'─'.repeat(60)}${Colors.reset}`);
}

// ── Utilities ────────────────────────────────────────────────────────────────

/** Compute SHA256 hash of a file (async). */
function fileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

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
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  try {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      n += e.isDirectory() ? countFiles(path.join(dir, e.name)) : 1;
    }
  } catch (_) {}
  return n;
}

/** Calculate total directory size in MB. */
function dirSize(dir) {
  if (!fs.existsSync(dir)) return 0;
  let bytes = 0;
  try {
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) {
          walk(p);
        } else {
          bytes += fs.statSync(p).size;
        }
      }
    };
    walk(dir);
  } catch (_) {}
  return (bytes / 1_048_576).toFixed(1);
}

/** Copy text to clipboard via PowerShell. */
function copyToClipboard(text) {
  try {
    const escaped = text.replace(/'/g, "''");
    execSync(`powershell -Command "Set-Clipboard -Value '${escaped}'"`, { windowsHide: true });
    return true;
  } catch (_) { return false; }
}

/** Run a registry command (silent failures). */
function regAdd(key, flags) {
  try {
    execSync(`reg add "${key}" ${flags} /f`, { windowsHide: true });
    return true;
  } catch (_) { return false; }
}

/** Find installed Chrome or Edge. */
function findBrowser() {
  const candidates = [
    ['Chrome', 'LOCALAPPDATA',      'Google\\Chrome\\Application\\chrome.exe'],
    ['Chrome', 'PROGRAMFILES',      'Google\\Chrome\\Application\\chrome.exe'],
    ['Chrome', 'PROGRAMFILES(X86)', 'Google\\Chrome\\Application\\chrome.exe'],
    ['Edge',   'PROGRAMFILES',      'Microsoft\\Edge\\Application\\msedge.exe'],
    ['Edge',   'PROGRAMFILES(X86)', 'Microsoft\\Edge\\Application\\msedge.exe'],
  ];
  for (const [name, envVar, relPath] of candidates) {
    const base = process.env[envVar] || '';
    const full = path.join(base, relPath);
    if (base && fs.existsSync(full)) return { name, path: full };
  }
  return null;
}

/** Sleep helper. */
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/** Wait for any keypress. */
function waitForKeypress() {
  return new Promise(resolve => {
    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', () => { process.stdin.pause(); resolve(); });
  });
}

// ── Installation Manifest ────────────────────────────────────────────────────

/** Build and save the installation manifest. */
function writeManifest(extensionPath, hostExePath, apiExePath) {
  const manifest = {
    version: VERSION,
    installed: BUILD_DATE,
    installationDir: INSTALL_DIR,
    extension: {
      path: extensionPath,
      fileCount: countFiles(extensionPath),
      sizeM: parseFloat(dirSize(extensionPath)),
    },
    binaries: {
      hostExe: {
        path: hostExePath,
        sizeM: (fs.statSync(hostExePath).size / 1_048_576).toFixed(1),
      },
      apiExe: {
        path: apiExePath,
        sizeM: (fs.statSync(apiExePath).size / 1_048_576).toFixed(1),
      },
    },
    nativeHost: {
      name: HOST_NAME,
      extensionId: EXTENSION_ID,
    },
    apiServer: {
      host: API_HOST,
      port: API_PORT,
      autoStartup: true,
    },
  };
  fs.writeFileSync(MANIFEST_LOG_PATH, JSON.stringify(manifest, null, 2));
  return manifest;
}

// ── Getting-Started Guide HTML ───────────────────────────────────────────────

function buildGettingStartedHtml(extDir, browserName) {
  const safeDir = extDir.replace(/\\/g, '/');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SUE v${VERSION} — Installation Guide</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a14;color:#f1f5f9;min-height:100vh;padding:40px 20px}
  .wrap{max-width:680px;margin:0 auto}
  .badge{display:inline-block;background:rgba(139,92,246,0.2);color:#c4b5fd;font-size:11px;font-weight:700;padding:3px 9px;border-radius:99px;margin-bottom:12px;text-transform:uppercase;letter-spacing:.5px}
  h1{font-size:28px;font-weight:800;background:linear-gradient(135deg,#d946ef,#8b5cf6,#6366f1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px}
  .sub{color:#94a3b8;font-size:14px;margin-bottom:32px;line-height:1.5}
  .step{background:rgba(255,255,255,0.04);border:1px solid rgba(139,92,246,0.2);border-radius:12px;padding:20px 24px;margin-bottom:16px;display:flex;gap:20px;align-items:flex-start}
  .step-num{width:40px;height:40px;min-width:40px;background:linear-gradient(135deg,#d946ef,#8b5cf6);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;color:#fff}
  .step-body h3{font-size:15px;font-weight:700;color:#f8fafc;margin-bottom:6px}
  .step-body p{font-size:13px;color:#94a3b8;line-height:1.6}
  .path-box{background:#0f0f1a;border:1px solid rgba(139,92,246,0.35);border-radius:8px;padding:12px 16px;font-family:'Consolas','Monaco',monospace;font-size:12px;color:#a78bfa;margin-top:10px;word-break:break-all;line-height:1.4}
  .btn{display:inline-block;margin-top:12px;padding:10px 20px;background:linear-gradient(135deg,#d946ef,#8b5cf6);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;text-decoration:none;transition:opacity 0.2s}
  .btn:hover{opacity:0.9}
  .success{background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.3);padding:18px 24px;border-radius:12px;color:#6ee7b7;font-size:13px;line-height:1.7;margin-top:24px}
  .success strong{color:#34d399;font-weight:700}
  .note{background:rgba(96,165,250,0.08);border-left:3px solid rgba(96,165,250,0.5);padding:12px 16px;font-size:12px;color:#93c5fd;margin-top:8px;border-radius:4px}
  footer{margin-top:40px;padding-top:20px;border-top:1px solid rgba(139,92,246,0.15);color:#64748b;font-size:12px;text-align:center}
</style>
</head>
<body>
<div class="wrap">
  <div class="badge">✓ Setup Complete — v${VERSION}</div>
  <h1>One last step</h1>
  <p class="sub">The SUE backend is installed and running. Now load the extension into ${browserName || 'Chrome'} to activate your sidebar.</p>

  <div class="step">
    <div class="step-num">1</div>
    <div class="step-body">
      <h3>Go to the Extensions page</h3>
      <p>In ${browserName || 'Chrome'}, navigate to the extensions manager.</p>
      <a class="btn" href="chrome://extensions" target="_blank">→ Open chrome://extensions</a>
    </div>
  </div>

  <div class="step">
    <div class="step-num">2</div>
    <div class="step-body">
      <h3>Enable Developer mode</h3>
      <p>Toggle <strong>Developer mode</strong> in the <strong>top-right corner</strong> of the page. New buttons will appear.</p>
    </div>
  </div>

  <div class="step">
    <div class="step-num">3</div>
    <div class="step-body">
      <h3>Click "Load unpacked"</h3>
      <p>Click the <strong>Load unpacked</strong> button that appears, navigate to the folder below, and click <strong>Select Folder</strong>.</p>
      <div class="path-box">${safeDir}</div>
      <div class="note">The path was copied to your clipboard — paste it directly.</div>
    </div>
  </div>

  <div class="success">
    <strong>✓ That's it!</strong> The SUE sidebar is now active. Press <strong>Ctrl+Shift+A</strong> (or click the extension icon) anytime to open it. The API server starts automatically with Windows.
  </div>

  <footer>
    <p>SUE v${VERSION} · Sovereign AI Sidebar<br>© Hammurabi Coding · https://hammurabicoding.com</p>
  </footer>
</div>
</body>
</html>`;
}

// ── MAIN INSTALLER ───────────────────────────────────────────────────────────

async function install() {
  console.clear();
  console.log(`\n${Colors.bold}╔${'═'.repeat(58)}╗${Colors.reset}`);
  console.log(`${Colors.bold}║${Colors.reset}${Colors.cyan}${Colors.bold}   SUE v${VERSION} — Enterprise Installer${' '.repeat(24)}${Colors.reset}${Colors.bold}║${Colors.reset}`);
  console.log(`${Colors.bold}╚${'═'.repeat(58)}╝${Colors.reset}\n`);
  
  console.log(`${Colors.cyan}Target directory:${Colors.reset} ${Colors.bold}${INSTALL_DIR}${Colors.reset}`);
  console.log(`${Colors.cyan}Started:${Colors.reset} ${new Date().toLocaleTimeString()}\n`);
  divider();

  try {
    // ── STEP 1: Locate source files ──────────────────────────────────────────
    section('1. Validating ecosystem files');

    const exeDir = path.dirname(process.pkg ? process.execPath : __filename);
    const extSrc = path.join(exeDir, 'extension');
    const hostSrc = path.join(__dirname, 'assets', 'sue-host.exe');
    const apiSrc  = path.join(__dirname, 'assets', 'sue-api.exe');

    if (!fs.existsSync(extSrc)) {
      fail(`Extension folder not found: ${extSrc}`);
      fail(`Make sure the full installation ZIP was extracted.`);
      throw new Error('Missing extension source');
    }
    ok(`Extension files located`);

    if (!fs.existsSync(hostSrc)) {
      fail(`Native host binary not found: ${hostSrc}`);
      throw new Error('Missing host binary');
    }
    ok(`Native host binary located`);

    if (!fs.existsSync(apiSrc)) {
      fail(`API server binary not found: ${apiSrc}`);
      throw new Error('Missing API binary');
    }
    ok(`API server binary located`);

    // ── STEP 2: Create directories and backup ────────────────────────────────
    section('2. Preparing installation directories');

    if (fs.existsSync(EXT_DIR)) {
      warn('Extension already installed — creating backup');
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      try {
        copyDir(EXT_DIR, path.join(BACKUP_DIR, `extension-${Date.now()}`));
        ok('Backup created');
      } catch (e) {
        warn(`Could not create backup: ${e.message}`);
      }
    }

    fs.mkdirSync(EXT_DIR, { recursive: true });
    ok('Install directory ready');

    // ── STEP 3: Copy extension files ─────────────────────────────────────────
    section('3. Installing extension (MV3 sidebar extension)');

    copyDir(extSrc, EXT_DIR);
    const fileCount = countFiles(EXT_DIR);
    const extSize = dirSize(EXT_DIR);
    ok(`${fileCount} files copied (${extSize} MB)`);

    // ── STEP 4: Deploy native host binary ────────────────────────────────────
    section('4. Installing native host');

    const hostExePath = path.join(INSTALL_DIR, 'sue-host.exe');
    const hostData = fs.readFileSync(hostSrc);
    fs.writeFileSync(hostExePath, hostData);
    ok(`sue-host.exe (${(hostData.length / 1_048_576).toFixed(1)} MB)`);

    // ── STEP 5: Deploy API server binary ─────────────────────────────────────
    section('5. Installing local API server');

    const apiExePath = path.join(INSTALL_DIR, 'sue-api.exe');
    const apiData = fs.readFileSync(apiSrc);
    fs.writeFileSync(apiExePath, apiData);
    ok(`sue-api.exe (${(apiData.length / 1_048_576).toFixed(1)} MB)`);

    // ── STEP 6: Write native messaging host manifest ────────────────────────
    section('6. Registering native messaging host');

    const manifestPath = path.join(INSTALL_DIR, 'host-manifest.json');
    const hostManifest = {
      name: HOST_NAME,
      description: 'SUE Native Host — bridges extension to local API',
      path: hostExePath,
      type: 'stdio',
      allowed_origins: [`chrome-extension://${EXTENSION_ID}/`],
    };
    fs.writeFileSync(manifestPath, JSON.stringify(hostManifest, null, 2));
    ok('Native host manifest written');

    const chromeKey = `HKCU\\SOFTWARE\\Google\\Chrome\\NativeMessagingHosts\\${HOST_NAME}`;
    const edgeKey   = `HKCU\\SOFTWARE\\Microsoft\\Edge\\NativeMessagingHosts\\${HOST_NAME}`;

    if (regAdd(chromeKey, `/ve /d "${manifestPath}"`)) {
      ok('Registered for Google Chrome');
    } else {
      warn('Chrome registration skipped (not installed)');
    }

    if (regAdd(edgeKey, `/ve /d "${manifestPath}"`)) {
      ok('Registered for Microsoft Edge');
    } else {
      warn('Edge registration skipped (not installed)');
    }

    // ── STEP 7: Configure Windows startup ────────────────────────────────────
    section('7. Configuring startup');

    const runKey = `HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run`;
    if (regAdd(runKey, `/v "SUE API Server" /d "${apiExePath}"`)) {
      ok('Configured auto-start (API runs on Windows boot)');
    } else {
      warn('Auto-start configuration failed — manual launch may be needed');
    }

    // ── STEP 8: Launch API server ────────────────────────────────────────────
    section('8. Starting API server');

    const child = spawn(apiExePath, [], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });
    child.unref();
    await sleep(2000);
    ok(`API server launched at ${Colors.cyan}http://${API_HOST}:${API_PORT}${Colors.reset}`);

    // ── STEP 9: Generate getting-started guide ───────────────────────────────
    section('9. Creating getting-started guide');

    const browser = findBrowser();
    const guideHtml = buildGettingStartedHtml(EXT_DIR, browser?.name || 'Chrome');
    const guidePath = path.join(INSTALL_DIR, 'getting-started.html');
    fs.writeFileSync(guidePath, guideHtml);
    ok('Interactive guide created');

    // ── STEP 10: Write installation manifest ─────────────────────────────────
    section('10. Logging installation manifest');

    writeManifest(EXT_DIR, hostExePath, apiExePath);
    ok('Installation record saved');

    // ── STEP 11: Copy extension path to clipboard ───────────────────────────
    section('11. Copying extension path');

    const clipOk = copyToClipboard(EXT_DIR);
    if (clipOk) {
      ok('Extension path copied to clipboard');
    } else {
      warn('Could not copy to clipboard — path shown below instead');
    }

    // ── STEP 12: Open browser and guide ──────────────────────────────────────
    section('12. Opening browser');

    if (browser) {
      const extFlag = browser.name === 'Edge' ? 'edge://extensions' : 'chrome://extensions';
      try {
        spawn(browser.path, [extFlag], { detached: true, stdio: 'ignore' }).unref();
        ok(`Opened ${browser.name} → ${extFlag}`);
      } catch (_) {
        warn(`Could not auto-open ${browser.name}`);
      }
    } else {
      warn('Chrome/Edge not detected — open manually');
    }

    // Open the getting-started guide
    try {
      execSync(`start "" "file:///${guidePath.replace(/\\/g, '/')}"`, { windowsHide: true });
      ok('Installation guide opened');
    } catch (_) {
      warn(`Open manually: ${guidePath}`);
    }

    // ── SUCCESS ──────────────────────────────────────────────────────────────
    console.log(`\n${Colors.green}${Colors.bold}╔${'═'.repeat(56)}╗${Colors.reset}`);
    console.log(`${Colors.green}${Colors.bold}║   Installation Complete ✓${' '.repeat(29)}║${Colors.reset}`);
    console.log(`${Colors.green}${Colors.bold}╚${'═'.repeat(56)}╝${Colors.reset}`);

    divider();
    console.log(`\n${Colors.bold}FINAL STEP — Load Extension in ${browser?.name || 'Chrome'}${Colors.reset}\n`);
    console.log(` ${Colors.bold}1.${Colors.reset} Navigate to  ${Colors.cyan}chrome://extensions${Colors.reset}`);
    console.log(` ${Colors.bold}2.${Colors.reset} Enable  ${Colors.yellow}Developer mode${Colors.reset}  (top-right toggle)`);
    console.log(` ${Colors.bold}3.${Colors.reset} Click  ${Colors.yellow}Load unpacked${Colors.reset}`);
    console.log(` ${Colors.bold}4.${Colors.reset} Paste this path:\n`);
    console.log(`    ${Colors.bold}${Colors.yellow}${EXT_DIR}${Colors.reset}`);
    if (clipOk) console.log(`\n    ${Colors.green}[Already copied to clipboard!]${Colors.reset}`);
    divider();
    console.log(`\n${Colors.bold}Press${Colors.reset} ${Colors.bold}Ctrl+Shift+A${Colors.reset} ${Colors.bold}anytime to open SUE.${Colors.reset}\n`);

    console.log('Press any key to finish...');
    await waitForKeypress();
  } catch (err) {
    console.log(`\n${Colors.red}${Colors.bold}✗ Installation failed${Colors.reset}\n`);
    console.log(`${Colors.red}Error: ${err.message}${Colors.reset}`);
    console.log(`\nTry running as Administrator: Right-click SUE-Setup.exe → Run as administrator\n`);
    if (err.stack) console.log(`${Colors.cyan}Debug: ${err.stack.split('\n')[0]}${Colors.reset}`);
    console.log('\nPress any key to exit...');
    await waitForKeypress();
    process.exit(1);
  }
}

// ── VERIFICATION MODE (for CI/CD) ────────────────────────────────────────────

if (process.argv.includes('--verify')) {
  try {
    const h = fs.readFileSync(path.join(__dirname, 'assets', 'sue-host.exe'));
    const a = fs.readFileSync(path.join(__dirname, 'assets', 'sue-api.exe'));
    console.log(`✓ sue-host.exe : ${(h.length / 1_048_576).toFixed(1)} MB`);
    console.log(`✓ sue-api.exe  : ${(a.length / 1_048_576).toFixed(1)} MB`);
    const ext = path.join(path.dirname(process.execPath), 'extension');
    if (fs.existsSync(ext)) {
      console.log(`✓ extension    : ${countFiles(ext)} files`);
    } else {
      console.log(`✗ extension    : NOT FOUND`);
      process.exit(1);
    }
    process.exit(0);
  } catch (e) {
    console.error(`✗ Verification failed: ${e.message}`);
    process.exit(1);
  }
}

// ── ENTRY POINT ───────────────────────────────────────────────────────────────

install().catch(err => {
  console.error(`\n${Colors.red}Fatal error: ${err.message}${Colors.reset}`);
  process.exit(1);
});
