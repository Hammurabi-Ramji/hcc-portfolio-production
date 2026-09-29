# SUE v5.0.0 — BUILD/VERIFY Evidence Summary
Date: 2026-09-17 | Scope: hcc-straw-sue/SUE/SUE/ | Node v24.15.0 (PATH)

## Toolchain note
- `npm.cmd`/`npx.cmd` found at `C:\Users\hammu\AppData\Local\Programs\Kimi\resources\resources\runtime\` (NOT in the `runtime\node\` subdir stated in the brief — that subdir does not exist).
- pnpm not installed. Both `package-lock.json` (stale, says version 4.0.0) and `pnpm-lock.yaml` (lockfileVersion 9.0) exist. npm used.

## Step results
1. package.json scripts read: sue-sidebar-extension@5.0.0, private, MIT, 0 runtime deps, 14 devDeps. Key scripts: `bundle` = `node node_modules/webpack-cli/bin/cli.js --config webpack.config.js`; `test:unit` = `node --test tests/unit/local-api-server.test.js`; `test:e2e` = `pnpm run package && playwright test` (pnpm-chained); `build:wasm` = wasm-pack (cargo unavailable → UNVERIFIED-BY-ENVIRONMENT).

2. Install: `npm install --no-audit --no-fund` → PASS, exit 0, **623 packages added in 28s**. Log: npm-install.log. Warnings only (deprecated transitive deps).

3. Manifests (all 4 PARSE OK, all MV3, name "SUE — Sovereign Sidebar"):
   - manifest.json:        v5.0.0, perms 12, host_perms 14, optional 3
   - manifest.chrome.json: v4.0.0 (STALE), perms 12, host_perms 8, optional 3
   - manifest.firefox.json:v4.0.0 (STALE), perms 10, host_perms 8, optional 3
   - manifest.safari.json: v5.0.0, perms 9, host_perms 8, optional 3
   → 4.0.0/5.0.0 drift CONFIRMED. Log: manifests.log.

4. Unit tests: `node --test tests/unit/local-api-server.test.js` → PASS exit 0, **4 pass / 0 fail** (tests 4, duration 643ms). Matches prior "unit 4/4" claim. Log: unit-tests.log.

5. Bundle: `node node_modules/webpack-cli/bin/cli.js --config webpack.config.js` → PASS exit 0 (webpack printed no stats to stdout/stderr; verified by artifacts). dist/ = 42 entries, fresh-mtime 17:47. Key artifacts:
   - dist/sue-runtime.wasm  1,263,147 B (valid WASM magic \0asm)
   - dist/background.js     73,019 B
   - dist/sue-runtime.js    49,241 B
   - dist/content.js        44,254 B
   - dist/manifest.json     3,439 B
   Log: bundle.log (0 bytes — webpack silent on success in this config).

6. E2E: ENV-BLOCKED. Playwright CLI 1.63.0 (satisfies ^1.60.0). No browsers in %LOCALAPPDATA%\ms-playwright or ~/.cache/ms-playwright. `playwright install chromium --dry-run` documents 4 required downloads (Chrome for Testing 153.0.8010.12, ffmpeg v1011, headless shell, winldd) → not installed per audit constraints. playwright.config.ts uses bundled chromium (no system-chrome channel), headless:false (extension tests need headed mode). E2E spec contains **40 `test(` cases / 2 describes** — NOT run. Prior doc claim "e2e 18/18 green" contradicts the 40-case suite (drift confirmed). Log: e2e-env.log.

7. WASM prebuilt: PASS — `sue-view/pkg/` exists; extension works without cargo:
   - sue_view_bg.wasm        1,263,147 B (2025-05-24) — identical size to dist/sue-runtime.wasm
   - hcc_sidebar_view_bg.wasm  545,032 B (2025-05-18) — stale older artifact alongside current
   - plus matching .js glue + .d.ts for both; all 3 wasm files verified with \0asm magic header.
   `build:wasm` (wasm-pack/cargo) itself UNVERIFIED — no Rust toolchain in environment.

## Contradictions flagged
- Brief's npm.cmd path had extra `node\` segment (real: `runtime\npm.cmd`).
- package-lock.json version field = 4.0.0 vs package.json 5.0.0 (stale lock metadata).
- chrome/firefox manifests at 4.0.0 vs package/manifest/safari at 5.0.0.
- "e2e 18/18" doc claim vs 40 test cases present in extension.spec.ts.
- Scripts chain `pnpm run ...` internally (build/release/test:e2e/validate/ci/dev) but pnpm is not installed and no packageManager field pins it — those scripts fail as-is without pnpm; npm-only equivalents work for bundle/test:unit.
- Two parallel WASM packages in sue-view/pkg (hcc_sidebar_view 545 KB stale from May 18 vs sue_view 1.26 MB from May 24) — dead artifact drift.
