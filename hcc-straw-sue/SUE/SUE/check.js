const fs = require('fs');

console.log('=== SUE Extension — Verification ===\n');

let passed = 0;
let failed = 0;

function test(name, condition) {
  if (condition) {
    console.log(`✓ ${name}`);
    passed += 1;
  } else {
    console.log(`✗ ${name}`);
    failed += 1;
  }
}

const distFiles = fs.readdirSync('dist');
test('manifest.json exists', distFiles.includes('manifest.json'));
test('background.js exists', distFiles.includes('background.js'));
test('suewarm-agent-core.js exists', distFiles.includes('suewarm-agent-core.js'));
test('suewarm-tool-registry.js exists', distFiles.includes('suewarm-tool-registry.js'));
test('memory-manager.js exists', distFiles.includes('memory-manager.js'));
test('sue.html exists', distFiles.includes('sue.html'));
test('sidebar-init.js exists', distFiles.includes('sidebar-init.js'));
test('extension-api.js exists', distFiles.includes('extension-api.js'));
test('sue-runtime.js exists', distFiles.includes('sue-runtime.js'));
test('sue-runtime.wasm exists', distFiles.includes('sue-runtime.wasm'));
test('local-api-server.js exists', fs.existsSync('local-api-server.js'));

const manifest = JSON.parse(fs.readFileSync('dist/manifest.json', 'utf8'));
test('manifest_version is 3', manifest.manifest_version === 3);
test('cookies permission present', manifest.permissions.includes('cookies'));
test('alarms permission present', manifest.permissions.includes('alarms'));
test('offscreen permission present', manifest.permissions.includes('offscreen'));
test('side panel points to sue.html', manifest.side_panel.default_path === 'sue.html');
test(
  'runtime bundle is web accessible',
  manifest.web_accessible_resources[0].resources.includes('sue-runtime.js')
);
test(
  'runtime wasm is web accessible',
  manifest.web_accessible_resources[0].resources.includes('sue-runtime.wasm')
);
test(
  'cloud provider host permissions present',
  manifest.host_permissions.includes('https://app.koofr.net/*') &&
    manifest.host_permissions.includes('https://icedrive.net/*') &&
    manifest.host_permissions.includes('https://app.degoo.com/*')
);

const background = fs.readFileSync('dist/background.js', 'utf8');
test('background exposes chat handler', background.includes('CHAT_SEND:'));
test('background exposes project list handler', background.includes('PROJECT_LIST:'));
test('background exposes note list handler', background.includes('NOTE_LIST:'));
test('background exposes cloud status handler', background.includes('CLOUD_STATUS_GET:'));
test('background exposes SUEWARM run handler', background.includes('SUEWARM_AGENT_RUN:'));
test('background uses local API base URL', background.includes('http://localhost:8080/api/v1'));
test('background uses Ollama URL', background.includes('http://localhost:11434'));

const bridge = fs.readFileSync('dist/extension-api.js', 'utf8');
test('bridge exposes sueRequestJson', bridge.includes('globalThis.sueRequestJson'));

const sidebarInit = fs.readFileSync('dist/sidebar-init.js', 'utf8');
test('sidebar init loads extension bridge', sidebarInit.includes("import './extension-api.js'"));
test('sidebar init prefers sue-runtime.js', sidebarInit.includes('./sue-runtime.js'));

console.log(`\n${'='.repeat(50)}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);

if (failed > 0) {
  console.log('\n✗ Verification failed.\n');
  process.exitCode = 1;
} else {
  console.log('\n✓ Verification passed.\n');
}
