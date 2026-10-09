# Cross-Browser Extension Development Skills Reference
### Built from the SUE — Sovereign AI Sidebar (v5.0.0)
> Chrome · Firefox · Edge · MV3 · Rust/WASM · Leptos · Node.js · Native Messaging

---

## Overview

This document captures every major skill applied in building a production-grade,
fully local, cross-browser extension with a Rust/WASM frontend, a service-worker
backend, a multi-agent AI layer, and a one-click Windows installer. Each entry
names its type, lists concrete steps, and tags the technologies involved.

**Skill types used:**
- `[summary]` — conceptual overview of a domain
- `[how-to]` — step-by-step procedure
- `[concept]` — deeper understanding of a mechanism
- `[application]` — how to apply a skill in real code
- `[practice]` — challenge or pattern to implement yourself

---

## Table of Contents

1. [Core Extension Architecture](#part-1-core-extension-architecture)
2. [Manifest V3 & Permissions](#part-2-manifest-v3--permissions)
3. [Rust / WASM Frontend with Leptos](#part-3-rust--wasm-frontend-with-leptos)
4. [Build & Tooling Pipeline](#part-4-build--tooling-pipeline)
5. [Service Worker Architecture](#part-5-service-worker-architecture)
6. [Content Script Patterns](#part-6-content-script-patterns)
7. [AI Provider Integration](#part-7-ai-provider-integration)
8. [Advanced Browser APIs](#part-8-advanced-browser-apis)
9. [Native Messaging & Local API Server](#part-9-native-messaging--local-api-server)
10. [Cross-Browser Compatibility](#part-10-cross-browser-compatibility)
11. [Authentication & Session Management](#part-11-authentication--session-management)
12. [Testing & Distribution](#part-12-testing--distribution)

---

## Part 1: Core Extension Architecture

---

### Skill 1.1 — `[summary]` The Four Layers of a Modern Browser Extension

**Description:** Every production-quality MV3 extension is composed of four
distinct execution environments, each with different capabilities and lifetimes.
Understanding the layer model before writing a single line of code prevents
architectural mistakes that are expensive to fix.

**Steps:**
1. **Service Worker (background)** — runs in a headless JS context, no DOM, wakes
   on events, sleeps after 30 s of inactivity. Owns network calls, storage writes,
   and all message dispatch.
2. **Content Script** — injected into every page the user visits. Has DOM access
   and can call page JS, but lives in an isolated world. Communicates with the SW
   via `chrome.runtime.sendMessage`.
3. **Extension Page (sidebar / popup / options)** — a full HTML page served from
   the extension package. In SUE this is the Leptos/WASM sidebar. Communicates
   with the SW via the same message API.
4. **Offscreen Document** — a hidden, persistent page used to run APIs that require
   a DOM context (e.g., audio processing, canvas) without showing UI.
5. Map every feature to its correct layer before coding it. Wrong-layer placement
   is the most common source of MV3 bugs.

**Tags:** `mv3`, `architecture`, `service-worker`, `content-script`, `sidebar`

---

### Skill 1.2 — `[how-to]` Wire a Full Message-Passing Dispatch System

**Description:** A clean dispatch table in the service worker decouples the
extension UI from all I/O logic and makes the codebase trivially testable and
extensible. This is the single most impactful architectural decision in SUE.

**Steps:**
1. In the service worker, define an `async function dispatch(msg, tabId)` that
   receives every incoming message.
2. Inside, build a plain object `handlers = { MSG_TYPE: () => handlerFn(...) }`.
   Each handler is a zero-arg lambda that calls the real function with already-
   destructured params from `msg`.
3. Resolve with `const handler = handlers[msg.type]; return handler ? handler() :
   fail('Unknown type')`.
4. Register `chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
   dispatch(msg, sender?.tab?.id).then(sendResponse); return true; })`.
   The `return true` keeps the channel open for the async response.
5. In the sidebar (WASM/JS), call the background with a single helper:
   `sueRequestJson(JSON.stringify({ type: 'MY_ACTION', ...payload }))`.
6. Add new capabilities by adding one line to `handlers` and one new function —
   no scaffolding required.

**Tags:** `message-passing`, `dispatch`, `service-worker`, `architecture`

---

### Skill 1.3 — `[concept]` Service Worker Lifecycle & the Keepalive Problem

**Description:** MV3 service workers terminate after ~30 seconds of inactivity.
Any in-flight async operation (large AI call, native host communication) will be
killed. You must actively prevent termination while critical work is running.

**Steps:**
1. **Understand the timer:** Chrome resets the 30 s timer on any chrome.* API call.
   Use a `keepalive-manager.js` that fires `chrome.runtime.getPlatformInfo()` every
   25 s to reset the timer while the SW is busy.
2. **Use alarms for periodic work:** `chrome.alarms.create('session_refresh',
   { periodInMinutes: 25 })`. Alarm callbacks wake a sleeping SW automatically.
3. **Persist state before sleeping:** Write any critical in-memory state to
   `chrome.storage.local` immediately — the SW can be killed between messages.
4. **Lazy-initialize singletons:** Use a `runtimeInitialized` flag + a
   `runtimeInitPromise` to ensure expensive setup (vector store, agent runtime)
   runs exactly once per SW lifetime, not on every message.
5. **Test termination:** In DevTools → Service Workers → press "Stop". Verify the
   extension still works correctly after the SW restarts.

**Tags:** `service-worker`, `lifecycle`, `keepalive`, `mv3`

---

### Skill 1.4 — `[application]` Side Panel vs Popup vs Injected Sidebar

**Description:** Chrome 114+ has a first-class `sidePanel` API. Firefox uses
`sidebar_action`. Edge mirrors Chrome. Choosing the right container determines
your UX, permissions required, and how the extension opens.

**Steps:**
1. For Chrome/Edge side panel: add `"sidePanel"` to `permissions`, set
   `"side_panel": { "default_path": "sue.html" }` in the manifest, and call
   `chrome.sidePanel.open({ tabId })` from an action click listener.
2. For Firefox sidebar: use `"sidebar_action": { "default_panel": "sue.html" }` —
   no special permission needed.
3. For cross-browser injected sidebar (fallback): inject a fixed-position `<div>`
   via the content script and mount your WASM app inside it with `injectSidebar()`.
   Width 400 px, `z-index: 2147483647`, `position: fixed; right: 0; top: 0`.
4. Add an `externally_connectable` manifest field so local web servers (your API)
   can message the extension directly.
5. Handle the `chrome.action.onClicked` event to toggle the panel open/closed.
   Store the open state in `chrome.storage.local` so it restores on browser restart.

**Tags:** `side-panel`, `sidebar`, `firefox`, `chrome`, `edge`, `ux`

---

## Part 2: Manifest V3 & Permissions

---

### Skill 2.1 — `[how-to]` Author a Production MV3 Manifest

**Description:** The manifest is the contract between your extension and the
browser. Mistakes here cause silent failures, security rejections, or broken
functionality. Every field matters.

**Steps:**
1. Set `"manifest_version": 3`. Use `"key"` to pin the extension ID in development
   (base64-encoded public key). The browser derives the ID from this key, making
   native host registration consistent before Web Store submission.
2. Split permissions into `"permissions"` (always granted) vs
   `"optional_permissions"` (prompt on first use). Start minimal and expand.
3. List only the `"host_permissions"` you genuinely need. Overly broad
   `"<all_urls>"` triggers manual review on Chrome Web Store.
4. For WASM: add `"script-src 'self' 'wasm-unsafe-eval'"` to
   `"content_security_policy": { "extension_pages": "..." }`. Without this, WASM
   instantiation throws a CSP violation.
5. Add every runtime-generated resource (your WASM binary, manager JS files) to
   `"web_accessible_resources"` with `"matches": ["<all_urls>"]`.
6. Register commands (keyboard shortcuts) under `"commands"`. Limit to 4;
   browsers cap them.
7. Test the manifest with `web-ext lint` before every release.

**Tags:** `manifest`, `mv3`, `permissions`, `csp`, `wasm`, `host-permissions`

---

### Skill 2.2 — `[concept]` The Permission Request Model

**Description:** Browsers enforce a layered permission model. Understanding it
prevents "permission denied" errors that are impossible to fix at runtime.

**Steps:**
1. **Declared permissions** in the manifest are granted silently at install time.
   `storage`, `tabs`, `activeTab`, `scripting`, `sidePanel`, `nativeMessaging`,
   `tabCapture`, `alarms`, `offscreen` are all silent grants.
2. **Optional permissions** (`downloads`, `bookmarks`, `history`) require an
   explicit `chrome.permissions.request()` call in a user gesture context.
   Never call this from a service worker.
3. **Host permissions** (`https://api.venice.ai/*`) are needed for the SW to
   `fetch()` cross-origin URLs without CORS errors. Content scripts bypass CORS for
   same-origin URLs on the pages they run on, but the SW cannot.
4. **`activeTab`** grants temporary elevated access to the active tab without a
   broad host permission — use it for `scripting.executeScript` after user gesture.
5. **`tabCapture`** is required to capture tab audio via `chrome.tabCapture`. It
   also requires user gesture and only works from the active tab.

**Tags:** `permissions`, `cors`, `activeTab`, `host-permissions`, `security`

---

### Skill 2.3 — `[application]` Multi-Browser Manifest Strategy

**Description:** Chrome, Firefox, and Edge share MV3 but differ in specific APIs.
Maintain one source-of-truth manifest and patch per-browser at build time.

**Steps:**
1. Keep a canonical `manifest.json` at the repo root with shared fields.
2. Create `manifest.chrome.json`, `manifest.firefox.json`, `manifest.edge.json`
   with only the overrides (e.g., Firefox needs `"browser_specific_settings"`,
   removes `"side_panel"` and replaces with `"sidebar_action"`).
3. In your build script, deep-merge the base + override:
   ```js
   const base = JSON.parse(fs.readFileSync('manifest.json'));
   const patch = JSON.parse(fs.readFileSync(`manifest.${browser}.json`));
   const merged = { ...base, ...patch };
   fs.writeFileSync(`dist-${browser}/manifest.json`, JSON.stringify(merged, null, 2));
   ```
4. Firefox requires `"gecko": { "id": "sue@hammurabicoding.com" }` inside
   `"browser_specific_settings"` for signed AMO submission.
5. Edge is Chromium-based and accepts the Chrome manifest as-is, but some
   Microsoft-specific APIs (`ms_*`) can be layered in via the Edge override.

**Tags:** `firefox`, `chrome`, `edge`, `manifest`, `cross-browser`, `build`

---

## Part 3: Rust / WASM Frontend with Leptos

---

### Skill 3.1 — `[summary]` Why Rust/WASM in a Browser Extension

**Description:** Using Rust + Leptos for the extension UI brings compile-time
correctness, zero-cost reactive state, and sub-millisecond render updates. The
tradeoff is a longer initial build and a more complex toolchain.

**Steps:**
1. **Leptos 0.7 (CSR mode)** compiles to WASM via wasm-pack. The output is a
   single `.wasm` binary + a JS glue module that webpack bundles into the extension.
2. **`cdylib` crate type** produces the `.wasm` shared library. `rlib` allows
   unit-testing the logic outside the browser with `cargo test`.
3. **`wasm-bindgen`** generates the JS↔Rust FFI layer. `#[wasm_bindgen]` marks
   functions/types exported to JS. `extern "C" { ... }` marks JS functions
   imported into Rust.
4. **`serde-wasm-bindgen`** bridges serde (Rust's serialisation library) and
   wasm-bindgen's `JsValue`, letting you deserialise arbitrary JSON from JS into
   typed Rust structs cleanly.
5. All network I/O stays in JS (the service worker). Rust stays pure UI. The
   boundary is `sueRequestJson(msgJson) -> Promise<JsValue>`.

**Tags:** `rust`, `wasm`, `leptos`, `wasm-bindgen`, `cdylib`, `frontend`

---

### Skill 3.2 — `[how-to]` Set Up the Rust/WASM Build Chain

**Description:** wasm-pack compiles, optimises, and packages Rust to WASM in one
command. Connecting it to webpack delivers the binary to the browser correctly.

**Steps:**
1. Add the WASM target: `rustup target add wasm32-unknown-unknown`.
2. Install wasm-pack: `cargo install wasm-pack`.
3. In `sue-view/Cargo.toml`, set `crate-type = ["cdylib", "rlib"]` and add
   `wasm-bindgen = "0.2"`, `web-sys = { version = "0.3", features = ["Window",
   "Storage", "Document", ...] }`, `js-sys = "0.3"`,
   `serde-wasm-bindgen = "0.6"`.
4. Build: `wasm-pack build sue-view --release --target web --no-opt`. This writes
   `sue-view/pkg/sue_view.js` and `sue-view/pkg/sue_view_bg.wasm`.
5. In `webpack.config.js`, set `entry: './sue-view/pkg/sue_view.js'`,
   `experiments: { asyncWebAssembly: true, outputModule: true }`,
   `output: { filename: 'sue-runtime.js', assetModuleFilename: 'sue-runtime.wasm',
   library: { type: 'module' } }`.
6. The WASM asset filename must exactly match the `web_accessible_resources` entry
   in the manifest, or Chrome will refuse to load it.
7. Never use `wasm-opt` (the `--no-opt` flag) in extension builds — wasm-opt
   sometimes produces code that violates extension CSP.

**Tags:** `wasm-pack`, `webpack`, `rust`, `wasm`, `build`, `cdylib`

---

### Skill 3.3 — `[application]` Reactive State with Leptos 0.7 Signals

**Description:** Leptos 0.7 uses fine-grained reactivity. `RwSignal<T>` is both
a getter and setter in one handle. Understanding the signal lifecycle prevents
common bugs like stale closures and double-borrows.

**Steps:**
1. Create signals with `let value = RwSignal::new(initial)`. `RwSignal<T>` is
   `Copy` when `T: 'static`, so closures capture it without borrowing issues.
2. Read with `.get()` inside a reactive context (inside `view!`, `move ||`
   closures, or `Effect::new`). This creates a subscription.
3. Write with `.set(new_value)` or `.update(|v| { *v = ... })`. Both trigger
   re-renders of subscribed views.
4. For async work, use `spawn_local(async move { ... })`. Signals captured by
   `move` are still usable inside the async block because they are `Copy`.
5. Use `get_untracked()` inside polling loops or timers to read a value without
   creating a reactive dependency — prevents infinite re-render cycles.
6. Wrap `Vec<T>` signals as `RwSignal<Vec<T>>`. Use `.update(|list| list.push(x))`
   for in-place mutation.

**Tags:** `leptos`, `signals`, `reactive`, `rwsignal`, `frontend`, `rust`

---

### Skill 3.4 — `[how-to]` Build Leptos Components for Extension UI

**Description:** Leptos `view!` macro produces a strongly-typed virtual DOM.
Certain patterns are required for browser extension sidebars that differ from
normal web apps.

**Steps:**
1. Declare a component: `#[component] pub fn MyView() -> impl IntoView { ... }`.
2. Use the `view!` macro for JSX-like HTML. String literals require quotes:
   `"text"`. Reactive values use `{move || signal.get()}`.
3. For conditional rendering: `{move || condition.then(|| view! { ... })}` returns
   `Option<impl IntoView>` — Leptos renders `None` as nothing.
4. When `if/else` branches return different view types, call `.into_any()` on each
   branch to erase the type to `AnyView`.
5. For lists: `<For each=move || list.get() key=|item| item.id.clone()
   children=move |item| { view! { ... } } />`. The `key` function must return a
   stable, unique value for correct diffing.
6. Dynamic CSS classes: `class:active=move || is_active.get()`. Class names with
   hyphens work natively.
7. Keep components small. Each `#[component]` creates a reactive boundary — split
   large views into sub-components to limit re-render scope.

**Tags:** `leptos`, `view-macro`, `components`, `for-loop`, `css-classes`

---

### Skill 3.5 — `[application]` JS Interop: Calling the Background from WASM

**Description:** WASM cannot call Chrome APIs directly. The pattern is a small JS
shim that wraps `chrome.runtime.sendMessage` in a Promise, exposed to Rust via
`wasm_bindgen`.

**Steps:**
1. In `sidebar-init.js`, define the shim:
   ```js
   globalThis.sueRequestJson = (msgJson) =>
     new Promise((resolve, reject) => {
       chrome.runtime.sendMessage(JSON.parse(msgJson), (resp) => {
         chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve(resp);
       });
     });
   ```
2. In each Rust component file, declare the import inside the calling function:
   ```rust
   #[wasm_bindgen] extern "C" {
     #[wasm_bindgen(js_namespace = globalThis, js_name = sueRequestJson, catch)]
     fn sue_request_json(msg: &str) -> Result<js_sys::Promise, JsValue>;
   }
   ```
3. Call it with:
   ```rust
   let json = serde_json::to_string(&msg_value)?;
   let promise = sue_request_json(&json)?;
   let js_val = JsFuture::from(promise).await?;
   let result: MyType = serde_wasm_bindgen::from_value(js_val)?;
   ```
4. Declare this `extern "C"` block locally inside the async function that needs it,
   not at module level — this avoids name conflicts across files that all import
   the same JS function.
5. Use `#[serde(rename_all = "camelCase")]` on response structs to match JS's
   camelCase field names without manual renames.

**Tags:** `wasm-bindgen`, `js-interop`, `serde-wasm-bindgen`, `promise`, `rust`

---

### Skill 3.6 — `[application]` Async Sleep in WASM (setTimeout Bridge)

**Description:** Rust's standard `thread::sleep` does not exist in WASM. Async
polling loops (e.g., the transcript poller in Listen mode) need a JS-backed sleep.

**Steps:**
1. Implement the sleep helper:
   ```rust
   async fn sleep_ms(ms: u32) {
     let promise = js_sys::Promise::new(&mut |resolve, _| {
       web_sys::window()
         .expect("no window")
         .set_timeout_with_callback_and_timeout_and_arguments_0(&resolve, ms as i32)
         .expect("set_timeout failed");
     });
     let _ = wasm_bindgen_futures::JsFuture::from(promise).await;
   }
   ```
2. Enable the `Window` feature in `[dependencies.web-sys]` — this exposes both
   `web_sys::window()` and `set_timeout_with_callback_and_timeout_and_arguments_0`.
3. Use in polling loops with `get_untracked()` on the stop signal:
   ```rust
   spawn_local(async move {
     loop {
       if !should_run.get_untracked() { break; }
       // do work ...
       sleep_ms(2000).await;
     }
   });
   ```
4. Kick off the loop from an event handler (e.g., button click) and stop it by
   setting `should_run` to `false` — the loop checks it next iteration.

**Tags:** `wasm`, `async`, `sleep`, `polling`, `web-sys`, `leptos`

---

## Part 4: Build & Tooling Pipeline

---

### Skill 4.1 — `[how-to]` Configure webpack for a Browser Extension

**Description:** Browser extensions are not standard web apps. webpack must copy
files without bundling them (service workers cannot be bundled), handle WASM as an
async asset, and preserve exact filenames that the manifest references.

**Steps:**
1. Set `entry` to the wasm-pack JS glue (`sue-view/pkg/sue_view.js`) — this is
   the only file webpack truly bundles.
2. Set `output.clean: true` to wipe `dist/` before each build.
3. Enable `experiments: { asyncWebAssembly: true, outputModule: true }`.
4. Set `output.assetModuleFilename` to the exact name in your manifest
   (`sue-runtime.wasm`) so the content-hash variant is never generated.
5. Set `output.library.type = 'module'` so the ES module exports survive bundling
   and `sidebar-init.js` can `import init from './sue-runtime.js'` correctly.
6. Use `CopyWebpackPlugin` for every other extension file:
   `{ from: 'background.js', to: '.' }` — one entry per file. These are copied
   verbatim, not parsed or minified.
7. Add new source files to the `CopyPlugin` patterns; forgetting this is the most
   common cause of "module not found" errors after adding a new feature.
8. Set `optimization.minimize: false` — minification breaks some service worker
   edge-case syntax and is not needed for extensions.

**Tags:** `webpack`, `copy-plugin`, `wasm`, `build`, `extension`

---

### Skill 4.2 — `[how-to]` Compile Node.js Scripts to Standalone Executables with pkg

**Description:** `@vercel/pkg` compiles a Node.js script + its runtime into a
self-contained `.exe` (Windows), eliminating Node.js as a user prerequisite.
Used in SUE for both the API server and the installer.

**Steps:**
1. Install globally: `npm i -g @vercel/pkg`.
2. In `package.json`, add a `"pkg"` field:
   ```json
   { "targets": ["node18-win-x64"], "outputPath": "release",
     "assets": ["assets/sue-host.exe", "assets/sue-api.exe"] }
   ```
3. Large binary assets (other exes, WASM files) go in `"assets"` — they are
   embedded in the output exe and accessible via `fs.readFileSync(
   path.join(__dirname, 'assets/file'))`.
4. Use `path.dirname(process.execPath)` to locate files that are *alongside* the
   exe in the filesystem (not embedded). This is correct for the `extension/`
   folder in the ZIP.
5. Run: `pkg installer/installer.js --target node18-win-x64 --output
   release/SUE-Setup.exe`.
6. Test with `SUE-Setup.exe --verify` before distributing — verify that all
   embedded assets are readable and any sibling files are detected.
7. Repeat for the API server: `pkg local-api-server.js --target node18-win-x64
   --output installer/assets/sue-api.exe`.

**Tags:** `pkg`, `node.js`, `executable`, `windows`, `installer`, `build`

---

### Skill 4.3 — `[how-to]` Automate the Full Release Pipeline

**Description:** Reproducible releases require a single command that rebuilds
every artifact from source, verifies critical files, and produces the distributable
ZIP. Manual multi-step releases cause inconsistent packages.

**Steps:**
1. Define the pipeline in order: WASM compile → webpack bundle → backend exe
   builds → installer exe build → package assembly → ZIP creation → verification.
2. Check prerequisites before running: `cargo`, `wasm-pack`, `node`, `pnpm`,
   `pkg` — fail fast with a helpful message if any are missing.
3. Only rebuild backend exes when the source file is newer than the output:
   ```powershell
   if (-not (Test-Path $exe) -or ((Get-Item $src).LastWriteTime -gt
     (Get-Item $exe).LastWriteTime)) { rebuild... }
   ```
4. Assemble the package dir (`SUE-v5.0.0-Windows/`) separately from the ZIP so you
   can inspect it before compressing.
5. After compressing, verify required files in the ZIP:
   `manifest.json`, `background.js`, `learn-engine.js`, `sue-runtime.wasm`,
   `SUE-Setup.exe`.
6. Wire as a package.json script: `"release:zip": "powershell -ExecutionPolicy
   Bypass -File build-release.ps1"` for one-command releases.

**Tags:** `powershell`, `ci`, `release`, `zip`, `automation`, `pipeline`

---

## Part 5: Service Worker Architecture

---

### Skill 5.1 — `[application]` Modular Service Worker with importScripts

**Description:** MV3 service workers are classic scripts (not ES modules by
default). `importScripts()` is the only way to split logic across files without
a bundler, and it runs synchronously at SW startup.

**Steps:**
1. At the top of `background.js`, call `importScripts` with all modules in
   dependency order:
   ```js
   importScripts('./keepalive-manager.js', './vector-store.js',
     './memory-manager.js', './ai-agent.js', './learn-engine.js');
   ```
2. Each imported module can expose its API via `globalThis.functionName = fn`.
   Functions declared with `function` declarations are automatically hoisted into
   the global scope.
3. Modules imported earlier can be referenced by modules imported later. The reverse
   causes a ReferenceError at runtime.
4. Functions defined in later-loaded modules (e.g., `background.js`'s own
   `getVeniceConfig()`) are hoisted and therefore callable from `learn-engine.js`
   functions at *runtime* — even though the import happens first. This is safe as
   long as you don't call them at module top-level.
5. Use ES modules (type: module SW) only if you need dynamic `import()`. The
   migration requires changing the manifest and all `importScripts` calls to
   static `import` statements — a significant refactor.

**Tags:** `service-worker`, `importscripts`, `modular`, `hoisting`, `mv3`

---

### Skill 5.2 — `[application]` Multi-Provider AI Chat with Automatic Fallback

**Description:** Real-world users have different AI providers configured. A
priority chain — Venice AI → Hugging Face → Ollama — tries the best available
provider and falls back gracefully. This is the core of SUE's AI flexibility.

**Steps:**
1. Store provider configs in `chrome.storage.local` under prefixed keys
   (`sue_setup_venice_api_key`, `sue_setup_hugging_face_token`,
   `sue_setup_ollama_url`). Load them with a single `chrome.storage.local.get`
   call in each provider-loader function.
2. Check in order: if `veniceConfig.apiKey` is non-empty → Venice; else if
   `hfConfig.token` is non-empty → Hugging Face; else → Ollama (always available
   if running locally).
3. Each provider function takes `(config, messages)` and returns the same shape:
   `{ success: true, data: { content, model } }` or
   `{ success: false, error: string }`.
4. Normalise the messages array to `[{ role, content }]` before sending to any
   provider — different providers reject differently structured messages.
5. Use `fetchWithRetry(url, options, { retries: 1, timeoutMs: 60000 })` for all
   AI calls. A 60-second timeout prevents the service worker from hanging on slow
   remote endpoints.
6. After any successful chat, save the user message to the vector store for future
   memory context retrieval.

**Tags:** `ai`, `venice`, `ollama`, `huggingface`, `fallback-chain`, `chat`

---

### Skill 5.3 — `[concept]` chrome.storage API — Local, Session, and Sync

**Description:** Extensions have three storage areas, each with different
persistence, capacity, and sync behaviour. Choosing the wrong one causes data
loss or unexpected cross-device sharing.

**Steps:**
1. **`chrome.storage.local`** — persisted to disk, up to 10 MB (unlimited with
   permission). Use for: sessions, vector memory, learn sessions, API keys,
   learn caption cues. Data survives browser restarts.
2. **`chrome.storage.session`** — in-memory only, cleared on browser close, up to
   10 MB. Use for: ephemeral state, active task tracking, temporary UI state.
3. **`chrome.storage.sync`** — up to 100 KB, synced across Chrome profiles via
   Google account. Use for: user preferences, compact layout toggle. Never store
   secrets here.
4. All three are asynchronous. Always `await chrome.storage.X.get(keys)` — never
   assume synchronous reads.
5. Use `chrome.storage.local.set({ key: value })` not `.set(key, value)` — the API
   takes an object, not key-value pairs.
6. Listen for changes: `chrome.storage.onChanged.addListener((changes, area) =>
   { ... })`. The change object has `{ newValue, oldValue }` per key.

**Tags:** `chrome.storage`, `local`, `session`, `sync`, `persistence`

---

### Skill 5.4 — `[application]` ok/fail Response Envelope Pattern

**Description:** Every handler in the dispatch table returns the same envelope
shape. This lets the WASM side use a single deserialization path regardless of
which message type was sent.

**Steps:**
1. Define helpers at the top of `background.js`:
   ```js
   function ok(extra = {})  { return { success: true, ...extra }; }
   function fail(msg)        { return { success: false, error: msg }; }
   ```
2. Every handler returns `ok({ data: { ... } })` on success or `fail('reason')`
   on error. Never throw — always return.
3. For data payloads wrap in a `data` key: `ok({ data: { project: record } })`.
   This matches Leptos's `Envelope<T>` pattern: `{ success, data, error }`.
4. On the Rust side, use `#[derive(Deserialize)] struct Envelope<T> { success:
   bool, data: Option<T>, error: Option<String> }` and deserialise via
   `serde_wasm_bindgen::from_value`.
5. In the Rust UI: `if resp.get("success")...unwrap_or(false) { handle ok }
   else { let e = resp.get("error")...}`. This single pattern handles every message
   type.

**Tags:** `error-handling`, `envelope`, `serde`, `rust`, `message-passing`

---

## Part 6: Content Script Patterns

---

### Skill 6.1 — `[how-to]` Deep Structural DOM Extraction

**Description:** Extracting meaningful, structured content from arbitrary pages
requires a hierarchy of selectors, fallbacks, and sanitisation. A flat
`document.body.innerText` misses context and structure.

**Steps:**
1. Prefer semantic containers over `body`:
   `document.querySelector('article') || document.querySelector('[role="main"]') ||
   document.querySelector('main') || document.body`.
2. Extract headings with levels:
   ```js
   document.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => {
     headings.push({ level: parseInt(h.tagName[1], 10),
       text: h.innerText.trim().slice(0, 200) });
   });
   ```
3. For YouTube: read `window.ytInitialPlayerResponse.videoDetails` for title and
   description — far more reliable than scraping the DOM.
4. Check for `<video>` elements and their `.textTracks` to detect caption
   availability before starting listen mode.
5. Extract Open Graph and meta tags for page description:
   `document.querySelector('meta[property="og:description"]')?.content`.
6. Truncate all text before sending to the service worker — limit fullText to 15 KB
   to stay within message size limits.
7. Never block the main thread: all extraction is synchronous (DOM reads), but keep
   operations short. Defer heavy processing to the service worker.

**Tags:** `content-script`, `dom`, `extraction`, `youtube`, `text-tracks`

---

### Skill 6.2 — `[application]` Live Video Caption Capture with TextTrack API

**Description:** The Web TextTrack API lets you listen to caption cue changes as
a video plays — no audio capture required. Works on YouTube, Vimeo, Coursera, and
any site with WebVTT/SRT captions.

**Steps:**
1. Find all `<video>` elements: `document.querySelectorAll('video')`.
2. For each video, iterate `video.textTracks`. If `track.kind === 'subtitles'` or
   `'captions'`, set `track.mode = 'hidden'` (must be `'showing'` or `'hidden'`,
   not `'disabled'`) to enable cue firing.
3. Add a `cuechange` listener to the track:
   ```js
   track.addEventListener('cuechange', () => {
     const cue = track.activeCues?.[0];
     if (!cue) return;
     const text = (cue.text || '').replace(/<[^>]+>/g, '').trim();
     if (text) chrome.runtime.sendMessage({ type: 'LEARN_CAPTION_CUE',
       cue: { text, startTime: cue.startTime, endTime: cue.endTime } });
   });
   ```
4. Also watch for tracks added dynamically (YouTube lazy-loads caption tracks after
   the user enables them) via `video.textTracks.addEventListener('addtrack', ...)`.
5. Store all handler references in `this._captionHandlers = []` so you can cleanly
   remove them on stop: `track.removeEventListener('cuechange', handler)`.
6. Deduplicate cues in the service worker: skip cues whose text is identical to the
   last stored cue — YouTube repeats active cues on each cue change tick.

**Tags:** `texttrack`, `captions`, `youtube`, `content-script`, `web-api`, `listen`

---

### Skill 6.3 — `[application]` Parallel URL HEAD Inspection from Content Script

**Description:** The content script runs in the page's origin context, giving it
CORS-free access to same-origin URLs. Use this to validate internal links at scale
without needing broad host permissions in the service worker.

**Steps:**
1. Accept a `urls` array from the background via `chrome.tabs.sendMessage`.
2. Fire all HEAD requests in parallel with `Promise.allSettled`:
   ```js
   await Promise.allSettled(urls.slice(0, 20).map(async url => {
     const res = await fetch(url, { method: 'HEAD', credentials: 'omit',
       signal: AbortSignal.timeout(6000) });
     results.push({ url, status: res.status,
       contentType: res.headers.get('content-type')?.split(';')[0] || '',
       finalUrl: res.url !== url ? res.url : null });
   }));
   ```
3. Use `AbortSignal.timeout(6000)` (Chrome 103+) instead of a manual AbortController
   for clean per-request timeouts.
4. `Promise.allSettled` (not `Promise.all`) ensures that one failing request does
   not cancel the others.
5. Catch per-request errors inside each map callback and push an error entry —
   never let a thrown error escape the `allSettled` lambda.
6. Return `{ success: true, results }` — the service worker integrates the results
   into the AI context for the deep scan document.

**Tags:** `fetch`, `head-request`, `cors`, `content-script`, `url-inspection`

---

### Skill 6.4 — `[application]` Interactive Element & Form Map Extraction

**Description:** Mapping every button, form, and interactive pattern on a page
reveals the functional structure of a web app — essential for the deep scan document.

**Steps:**
1. Select buttons broadly: `button, [role="button"], input[type="submit"],
   input[type="button"], input[type="reset"]`.
2. For each, capture: `.innerText || .value || aria-label`, `.type`, `.disabled`,
   the closest `<form>`'s `.action` and `.method`.
3. For forms, iterate `form.querySelectorAll('input:not([type="hidden"]), select,
   textarea')`. For each field, find its label via
   `document.querySelector(\`label[for="${field.id}"]\`)` and include placeholder,
   required, and for `<select>` the top 8 option texts.
4. Detect interactive patterns with class and ARIA selectors:
   ```js
   hasTabs: Boolean(document.querySelector('[role="tablist"], [role="tab"]'))
   hasPagination: Boolean(document.querySelector('[aria-label*="pagination" i]') ||
     document.querySelector('a[rel="next"]'))
   ```
5. Detect load-more by searching button text:
   `allButtons.some(b => /load more|show more|view more/i.test(b.innerText))`.
6. Limit arrays before returning to the SW: `buttons.slice(0, 40)`,
   `forms` (unlimited), `internal.slice(0, 60)`, `external.slice(0, 25)`.

**Tags:** `dom`, `forms`, `buttons`, `aria`, `extraction`, `deep-scan`

---

## Part 7: AI Provider Integration

---

### Skill 7.1 — `[how-to]` Integrate Venice AI (OpenAI-Compatible Chat API)

**Description:** Venice AI exposes an OpenAI-compatible `/chat/completions`
endpoint. Any OpenAI SDK or raw `fetch` call works with a single base URL change.

**Steps:**
1. Base URL: `https://api.venice.ai/api/v1/chat/completions`.
2. Auth: `Authorization: Bearer <venice_api_key>`.
3. Request body:
   ```json
   { "model": "llama-3.3-70b", "messages": [...], "stream": false,
     "max_tokens": 1024 }
   ```
4. Parse response: `payload.choices[0].message.content`.
5. Validate the key by calling `/models` — a non-empty model list means the key is
   valid. Cache the model list for the Settings UI dropdown.
6. Store the key as `sue_setup_venice_api_key` in `chrome.storage.local`. Never
   store in the manifest or any source file.
7. For document assembly and skills generation, increase `max_tokens` to 4096.
   Venice enforces a rate limit — add retry logic with exponential backoff.

**Tags:** `venice`, `openai-compatible`, `chat-completion`, `api-key`, `llm`

---

### Skill 7.2 — `[how-to]` Integrate Ollama (Local LLM, Fully Offline)

**Description:** Ollama runs LLMs locally on the user's machine, eliminating any
API key requirement. It's the default fallback in SUE when no cloud provider is
configured.

**Steps:**
1. Detect Ollama at startup: `GET http://localhost:11434/api/tags`. A 200 response
   with a non-empty `models` array means it's running.
2. Chat endpoint: `POST http://localhost:11434/api/chat` with body
   `{ "model": "llama3.2:3b", "messages": [...], "stream": false }`.
3. Parse: `payload.message.content`.
4. If the model is missing (HTTP 404 or 400), auto-pull it:
   `POST /api/pull { "name": "llama3.2:3b" }`. Re-attempt the chat after pull.
5. Add `http://localhost:11434/*` and `http://127.0.0.1:11434/*` to
   `host_permissions` — this is required for the service worker to `fetch` Ollama
   without CORS errors.
6. The Ollama URL is user-configurable. Normalise it with `new URL(url).origin`
   before building endpoint paths — prevents double-slash issues.
7. For embeddings (vector memory), use `POST /api/embeddings { "model":
   "nomic-embed-text", "prompt": text }`. This returns a 768-dimensional vector.

**Tags:** `ollama`, `local-llm`, `offline`, `embeddings`, `host-permissions`

---

### Skill 7.3 — `[how-to]` Integrate Hugging Face Inference API

**Description:** Hugging Face's Inference API supports hundreds of open models
with a single token. It uses the OpenAI-compatible chat endpoint for Mistral,
Llama, and others.

**Steps:**
1. Chat endpoint: `POST https://api-inference.huggingface.co/models/<model>/v1/
   chat/completions`.
2. Auth: `Authorization: Bearer <hf_token>`.
3. Request body: same OpenAI shape. Parse `choices[0].message.content`.
4. Validate the token via `GET https://huggingface.co/api/whoami-v2`.
   A 200 response with a `name` field confirms the token is valid.
5. Recommended models: `mistralai/Mistral-7B-Instruct-v0.3` (chat),
   `meta-llama/Llama-3.2-3B-Instruct` (fast), `sentence-transformers/all-MiniLM-
   L6-v2` (embeddings).
6. Add `https://huggingface.co/*` and `https://api-inference.huggingface.co/*`
   to `host_permissions`.
7. Rate limits are strict on the free tier — implement a 30 s retry backoff for
   HTTP 503 (model loading) and 429 (rate limit) responses.

**Tags:** `huggingface`, `inference-api`, `mistral`, `llama`, `embeddings`

---

### Skill 7.4 — `[application]` Structured AI Output with JSON Extraction

**Description:** Asking the AI to return JSON for skills generation is unreliable
without careful prompting and robust parsing. The model will wrap JSON in markdown
code fences or add explanations. Parse defensively.

**Steps:**
1. In the system prompt, be explicit: *"Return ONLY valid JSON with this exact
   shape, no extra text."* Include the full schema inline in the prompt.
2. Extract JSON from the model response with a regex:
   `const match = content.match(/\{[\s\S]*\}/);` — this handles models that wrap
   output in markdown code fences or prose.
3. Validate with `JSON.parse(match[0])` inside a try/catch. Return a structured
   error if parsing fails — never crash the handler.
4. Validate the parsed object: `Array.isArray(parsed.skills)` etc. Silently drop
   skills that are missing required fields rather than erroring out.
5. Use `temperature: 0.3` for structured outputs — lower temperature reduces
   creative deviation from the schema.
6. For large documents, truncate the input to 8–10 KB before sending. Most models
   have 4 K–8 K context windows on the free tier.

**Tags:** `structured-output`, `json-extraction`, `prompt-engineering`, `skills`

---

## Part 8: Advanced Browser APIs

---

### Skill 8.1 — `[application]` Vector Memory / RAG in a Browser Extension

**Description:** A vector store built on top of `chrome.storage.local` enables
semantic memory — the AI finds relevant past conversations and injects them as
context. This is SUE's RAMemory system.

**Steps:**
1. Store each memory as `{ id, text, embedding: number[], source, sessionId,
   timestamp }` in a `sue_vector_memories` storage key.
2. To add: compute the embedding with Ollama's nomic-embed-text (or a HF model),
   then append to the stored array.
3. To search: compute the query embedding, then calculate cosine similarity
   against all stored embeddings. Return the top-K by score:
   ```js
   function cosine(a, b) {
     const dot = a.reduce((s, v, i) => s + v * b[i], 0);
     const magA = Math.sqrt(a.reduce((s, v) => s + v*v, 0));
     const magB = Math.sqrt(b.reduce((s, v) => s + v*v, 0));
     return dot / (magA * magB);
   }
   ```
4. Before every AI chat, search the vector store for the user's message and inject
   the top 4 results as a system message: *"Use this context when relevant."*
5. Compact the vector store periodically: remove entries older than 30 days or
   when total count exceeds 500. Track `lastCompactedAt` to avoid redundant runs.
6. Expose `MEMORY_VECTOR_LIST`, `MEMORY_VECTOR_CLEAR`, and `MEMORY_VECTOR_COMPACT`
   message handlers so the UI can manage memory from the Mem tab.

**Tags:** `vector-store`, `rag`, `embeddings`, `cosine-similarity`, `memory`

---

### Skill 8.2 — `[application]` Tab Capture & Offscreen Documents

**Description:** `chrome.tabCapture` captures a tab's audio/video stream as a
`MediaStream`. Because it requires a browser context (not a SW), the capture must
be processed in an offscreen document.

**Steps:**
1. Add `"offscreen"` to permissions and create an `offscreen.html` that loads
   `offscreen-worker.js`.
2. Create the offscreen document from the SW:
   ```js
   await chrome.offscreen.createDocument({
     url: chrome.runtime.getURL('offscreen.html'),
     reasons: ['USER_MEDIA'],
     justification: 'Tab audio capture for transcript generation'
   });
   ```
3. Request the MediaStream from the offscreen document using
   `chrome.tabCapture.capture()` — note: `tabCapture` must be called from a page
   context (popup, sidebar, or offscreen), NOT from the service worker.
4. For caption-based listening (no audio needed), skip `tabCapture` entirely and
   use the TextTrack API in the content script instead — simpler and more reliable.
5. Destroy the offscreen document when done to free memory:
   `chrome.offscreen.closeDocument()`.
6. Only one offscreen document can exist per extension at a time.

**Tags:** `tab-capture`, `offscreen`, `media-stream`, `audio`, `chrome-api`

---

### Skill 8.3 — `[concept]` Native Messaging Protocol

**Description:** Native messaging is the IPC channel between the extension and a
local process (your API server launcher). Messages are prefixed with a 4-byte
little-endian length header.

**Steps:**
1. The host process (compiled with `pkg`) reads stdin in a loop:
   ```js
   const lenBuf = fs.readSync(fd, Buffer.alloc(4));
   const msgLen = lenBuf.readUInt32LE(0);
   const msgBuf = Buffer.alloc(msgLen);
   fs.readSync(fd, msgBuf);
   const msg = JSON.parse(msgBuf.toString());
   ```
2. Reply by writing a length-prefixed JSON response to stdout.
3. The host manifest specifies `"type": "stdio"` and the absolute path to the
   host executable.
4. Register the manifest for Chrome:
   `reg add "HKCU\SOFTWARE\Google\Chrome\NativeMessagingHosts\com.yourname.host"
   /ve /d "C:\path\to\host-manifest.json" /f`
   And separately for Edge (different registry key).
5. In the extension: `const port = chrome.runtime.connectNative('com.yourname.host');
   port.postMessage({ command: 'start_server' });`.
6. The host's job in SUE is simply to spawn `sue-api.exe` as a detached child
   process and confirm it's running. The API server then handles all real requests
   over HTTP.

**Tags:** `native-messaging`, `ipc`, `stdio`, `registry`, `host-manifest`

---

## Part 9: Native Messaging & Local API Server

---

### Skill 9.1 — `[how-to]` Build a Node.js Local HTTP API Server

**Description:** Running a local HTTP server at `127.0.0.1:8080` decouples
persistence logic from the service worker, survives SW sleep/restart cycles, and
provides a standard REST API the WASM UI can call via `fetch`.

**Steps:**
1. Use Node.js's built-in `http.createServer`. No Express needed — the server
   is simple enough to route manually.
2. Parse the URL and method: `const u = new URL(req.url, 'http://x'); const
   { pathname } = u;`.
3. Read request body: accumulate `req.on('data')` chunks and parse `JSON.parse`
   on `req.on('end')`.
4. Persist state as a single JSON file in `%LOCALAPPDATA%\SUE\sue-local-api.json`.
   Read on every request (`readState()`), mutate, and write back (`writeState()`).
   For low-traffic local servers this is reliable and simple.
5. Auth with Bearer tokens: `req.headers['authorization']?.replace('Bearer ', '')`.
   Issue tokens on login/OTP verify. Store sessions in the JSON state with a 7-day
   TTL.
6. Add `Access-Control-Allow-Origin: *` to every response so the extension's
   content scripts and WASM can call it.
7. Compile to a standalone exe with `pkg` so users don't need Node.js installed.

**Tags:** `node.js`, `http-server`, `rest-api`, `json-persistence`, `local-api`

---

### Skill 9.2 — `[application]` OTP Email Authentication Without an Email Server

**Description:** Passwordless login via one-time codes is more usable than
passwords and requires no external email infrastructure for developer/internal
use cases. The OTP is returned in the API response and displayed in the UI.

**Steps:**
1. On `POST /auth/otp/request { email }`: generate a 6-digit code, store in an
   in-memory Map `otpStore.set(email, { code, expiresAt: Date.now() + 600_000 })`,
   and return `{ data: { otp: code, expires_in: 600 } }` directly in the response.
2. The extension UI reads the code from the response and displays it in a clearly
   labelled input box: "Your one-time code: 123456".
3. On `POST /auth/otp/verify { email, code }`: look up the OTP, check expiry,
   compare codes. On success, create a session and return `{ session, api_settings }`.
4. The extension auto-applies the returned API settings to `chrome.storage.local`
   with the `sue_setup_*` key prefix.
5. The OTP store is in-memory only — it is intentionally never persisted. If the
   server restarts, the user must request a new code. This is the correct behaviour.
6. In production, replace the response-returned OTP with an email send. The rest
   of the flow (verify, session creation) is unchanged.

**Tags:** `otp`, `auth`, `passwordless`, `session`, `api`, `chrome.storage`

---

## Part 10: Cross-Browser Compatibility

---

### Skill 10.1 — `[summary]` Chrome vs Firefox vs Edge: What Actually Differs

**Description:** Edge is Chromium-based and accepts Chrome MV3 extensions with
near-zero changes. Firefox MV3 support is substantial but has specific divergences.
Understanding the exact differences saves hours of debugging.

**Steps:**
1. **Edge (Chromium):** Same MV3 API as Chrome. Different native messaging registry
   path: `HKCU\SOFTWARE\Microsoft\Edge\NativeMessagingHosts\...`. Side panel is
   identical. No code changes required for most extensions.
2. **Firefox:**
   - Replace `"side_panel"` with `"sidebar_action": { "default_panel":
     "sue.html" }`. No `chrome.sidePanel` API; Firefox opens the sidebar natively.
   - Add `"browser_specific_settings": { "gecko": { "id": "ext@domain.com",
     "strict_min_version": "128.0" } }` for MV3.
   - Firefox does not support `chrome.offscreen`. Use a background page or a
     content script for audio/canvas work.
   - Firefox does not support `chrome.tabCapture`. Use `browser.tabs.captureTab`
     (screenshots) or the TextTrack API.
   - `chrome.scripting.executeScript` works but requires `"scripting"` permission.
3. **Shared:** Both support `chrome.storage`, `chrome.tabs`, `chrome.runtime`,
   `chrome.scripting`, `chrome.contextMenus`, and `chrome.alarms`.
4. Use the `webextension-polyfill` library to bridge `chrome.*` → `browser.*`
   differences. Import it as the first script in all extension pages.

**Tags:** `firefox`, `edge`, `cross-browser`, `mv3`, `compatibility`

---

### Skill 10.2 — `[application]` Write Extension Code That Runs on All Three Browsers

**Description:** With the right abstractions, 95 % of extension code is
browser-agnostic. The remaining 5 % (sidebar open, native host, offscreen) needs
per-browser guards.

**Steps:**
1. Detect the API namespace: `const EXT = globalThis.browser ?? globalThis.chrome`.
   Firefox uses `browser.*` (Promise-based); Chrome uses `chrome.*` (callback).
   The polyfill resolves this, but a direct check is a reliable fallback.
2. Guard browser-specific blocks:
   ```js
   if (EXT.sidePanel) { EXT.sidePanel.open({ tabId }); }           // Chrome/Edge
   else { /* Firefox opens via sidebar_action, no JS needed */ }
   ```
3. For manifest differences, maintain per-browser JSON patches and merge at build
   time (see Skill 2.3).
4. In the extension runtime, check for API availability before calling:
   `if (chrome.offscreen) { await chrome.offscreen.createDocument(...) }`.
5. Test all three browsers in CI using `web-ext run --target chromium` (Chrome),
   `web-ext run --target firefox-desktop`, and Edge via Chromium profile.
6. Keep polyfill + browser guards in a single `extension-api.js` file imported by
   all extension pages. This is the only place browser-specific logic lives.

**Tags:** `polyfill`, `browser-detection`, `cross-browser`, `guard`, `web-ext`

---

### Skill 10.3 — `[how-to]` Package the Extension for Multiple Browsers

**Description:** The Chrome Web Store, Firefox AMO, and Edge Add-ons store all
require different ZIP structures and manifests. A single build pipeline can produce
all three.

**Steps:**
1. Build the base extension into `dist/`.
2. For each browser target, create `dist-browsers/<browser>/`:
   - Copy all `dist/` files.
   - Overwrite with the browser-specific manifest.
   - Remove any files not supported by that browser (e.g., `offscreen.html` for
     Firefox).
3. Chrome submission: ZIP the directory, upload to
   `https://chrome.google.com/webstore/devconsole`. Use the `manifest.key` field
   to maintain a consistent extension ID for your users.
4. Firefox AMO: ZIP the directory, add `source code URL` in the AMO submission for
   Wasm artifacts (AMO reviewers require buildable source). Sign locally with
   `web-ext sign --channel listed`.
5. Edge submission: use the same ZIP as Chrome. Edge Add-ons accepts Chrome
   packages directly.
6. Automate with `pnpm run build:browsers` which calls `build-browser-packages.js`
   to produce `dist-browsers/chrome.zip`, `dist-browsers/firefox.zip`,
   `dist-browsers/edge.zip`.

**Tags:** `packaging`, `chrome-store`, `firefox-amo`, `edge-addons`, `zip`, `build`

---

## Part 11: Authentication & Session Management

---

### Skill 11.1 — `[application]` Persist User API Keys Across Sessions

**Description:** Extension storage is ephemeral for session-level data but
persistent for `local` storage. The challenge is syncing user credentials between
the local API server (Node.js process) and the extension storage layer.

**Steps:**
1. On OTP verify success, the API server returns the user's saved API settings:
   `{ api_settings: { venice_api_key, hf_token, hf_model, ollama_url } }`.
2. The service worker writes these to `chrome.storage.local` immediately:
   ```js
   await chrome.storage.local.set({
     sue_setup_venice_api_key: settings.venice_api_key,
     sue_setup_hugging_face_token: settings.hf_token,
     ...
   });
   ```
3. The same keys are read by `getVeniceConfig()`, `getHuggingFaceConfig()`, etc.
   at chat time — so writing them here makes them effective immediately.
4. To push updates back to the server: `PUT /api/v1/users/me/api-settings` with
   Bearer token. Call this from `USER_SETTINGS_SAVE` in the dispatch table.
5. On next login (same email), the server returns the saved keys again, restoring
   the user's full configuration without re-entry.
6. Never store API keys in `chrome.storage.sync` — they would be synced to all
   Chrome profiles, which is a security risk.

**Tags:** `auth`, `api-keys`, `storage`, `session`, `persistence`, `otp`

---

### Skill 11.2 — `[concept]` Extension Identity and the Key Field

**Description:** Browser extensions get random IDs unless you pin them with a
cryptographic key. A pinned ID is required for stable native messaging registration,
known redirect URIs for OAuth flows, and consistent CSP hashes.

**Steps:**
1. Generate a key pair: `openssl genrsa -out key.pem 2048`.
2. Extract the public key in DER + Base64:
   `openssl rsa -in key.pem -pubout -outform DER | openssl base64 -A`.
3. Paste the Base64 string into `manifest.json` as `"key": "..."`.
4. Chrome derives the extension ID from the SHA-256 hash of the DER public key —
   this ID is now consistent across all installs, regardless of whether the
   extension came from the Web Store or was loaded unpacked.
5. Store `key.pem` securely. If lost, the extension's ID changes and all native
   host registrations must be re-done for every user.
6. The `key` field is ignored by Firefox — Firefox uses the `"id"` in
   `browser_specific_settings.gecko` instead.

**Tags:** `extension-id`, `key-field`, `native-messaging`, `identity`, `security`

---

## Part 12: Testing & Distribution

---

### Skill 12.1 — `[how-to]` Load an Unpacked Extension in Developer Mode

**Description:** The fastest development loop is loading the `dist/` folder as an
unpacked extension. Changes take effect after reloading the extension with one
click, without re-installing.

**Steps:**
1. Navigate to `chrome://extensions` (Chrome/Edge) or `about:debugging#/runtime/this-firefox` (Firefox).
2. Chrome/Edge: toggle **Developer mode** (top right), click **Load unpacked**,
   select the `dist/` folder.
3. Firefox: click **Load Temporary Add-on**, select `dist/manifest.json`.
4. After any code change, run your build (`pnpm run bundle`) and click the reload
   icon (⟳) on the extension card — no re-select needed.
5. For WASM changes, rebuild the WASM first (`pnpm run build:wasm`) then bundle.
   Total turnaround: ~35 s for a release WASM build, ~2 s for a webpack bundle.
6. Open the service worker DevTools by clicking **"service worker"** link on the
   extension card. This gives you a console and Network tab for the SW context.
7. Use `chrome.storage.local.get(null, console.log)` in the SW console to inspect
   all stored values instantly.

**Tags:** `developer-mode`, `unpacked`, `debugging`, `workflow`, `dist`

---

### Skill 12.2 — `[application]` End-to-End Testing with Playwright

**Description:** Playwright can launch a real browser with your extension loaded
and assert on the UI. This catches regressions that unit tests miss.

**Steps:**
1. Install: `pnpm add -D @playwright/test`.
2. In `playwright.config.ts`, launch Chrome with the extension:
   ```ts
   use: {
     channel: 'chrome',
     args: [
       `--disable-extensions-except=${path.resolve('dist')}`,
       `--load-extension=${path.resolve('dist')}`,
     ],
   }
   ```
3. In tests, get the extension ID from the background service worker URL:
   ```ts
   const background = await context.waitForEvent('serviceworker',
     sw => sw.url().includes('background'));
   const extId = new URL(background.url()).hostname;
   ```
4. Open the sidebar by navigating to `chrome-extension://${extId}/sue.html`.
5. Assert on WASM-rendered UI: `await page.getByText('📖 Learn').click()`.
   Wait with `waitForSelector` since WASM initialisation has ~100 ms latency.
6. Mock the local API server for deterministic tests:
   `await page.route('http://127.0.0.1:8080/**', route => route.fulfill({ ... }))`.

**Tags:** `playwright`, `e2e`, `testing`, `chrome-extension`, `wasm`

---

### Skill 12.3 — `[how-to]` Build the Windows Installer with pkg

**Description:** A one-click `.exe` installer eliminates the Node.js prerequisite,
installs the backend services, and guides the user through the single manual step
(loading the unpacked extension in Chrome).

**Steps:**
1. The installer reads backend exes from embedded pkg assets and the extension
   from a sibling `extension/` folder in the ZIP.
2. Installation steps in order: create `%LOCALAPPDATA%\SUE\`, copy the extension,
   write the backend exes, write the native host manifest, register in the Windows
   registry for Chrome and Edge, add to startup, start the API server.
3. Copy the extension path to the user's clipboard with PowerShell:
   `execSync(\`powershell -Command "Set-Clipboard -Value '${extDir}'"\`)`.
4. Open Chrome to `chrome://extensions`:
   find the Chrome exe path from common installation locations and spawn it with
   `['chrome://extensions']` as the argument.
5. Write a `getting-started.html` to the install directory and open it in the
   default browser with `start "" "file:///..."`. This survives Chrome not being
   installed.
6. Show clear console output: banner, per-step checkmarks, and a final instructions
   block. The user must see exactly what to click.
7. Handle errors with a try/catch at the top level — on failure, print the error,
   suggest "Run as administrator", and wait for keypress before exit.

**Tags:** `installer`, `pkg`, `windows`, `registry`, `native-host`, `distribution`

---

### Skill 12.4 — `[practice]` Full-Stack Extension Challenge

**Description:** Build a minimal extension that demonstrates every layer: WASM UI,
service worker dispatch, content script, and a packaged local server. This
exercise validates end-to-end understanding.

**Steps:**
1. **Manifest:** MV3, `sidePanel`, `storage`, `scripting`, one host permission
   for localhost.
2. **Service Worker:** One dispatch handler — `PAGE_WORD_COUNT` — that sends a
   `GET_WORD_COUNT` message to the content script and returns the result.
3. **Content Script:** Handle `GET_WORD_COUNT` — count words in
   `document.body.innerText`, return `{ count, url, title }`.
4. **Leptos Sidebar:** One button "Count Words", one `RwSignal<Option<usize>>`,
   one `spawn_local` that calls the SW and sets the signal. Display the count.
5. **Local Server:** A single `GET /api/v1/count-history` endpoint that returns
   an in-memory list of past word counts (appended by the SW on each count).
6. **Build:** wasm-pack + webpack to `dist/`. Load unpacked in Chrome.
7. **Verify:** Click the button on three different pages. Confirm history persists.
   Reload the extension and confirm history survived the SW restart via the server.
8. **Bonus:** Add `chrome://extensions`-free auto-install by writing a PowerShell
   script that copies `dist/` and registers a native host for the local server.

**Tags:** `practice`, `full-stack`, `leptos`, `content-script`, `node.js`, `e2e`

---

## Quick Reference: Key File Roles in SUE

| File | Layer | Responsibility |
|------|-------|---------------|
| `manifest.json` | Config | Permissions, entry points, CSP, commands |
| `background.js` | Service Worker | Dispatch table, all I/O, AI providers |
| `learn-engine.js` | Service Worker | Learn Tab: scan, listen, skills, sessions |
| `content.js` | Page | DOM extraction, caption capture, URL inspection |
| `sidebar-init.js` | Extension Page | WASM loader, `sueRequestJson` shim |
| `sue.html` | Extension Page | Sidebar HTML shell |
| `sue-runtime.js` | Extension Page | webpack-bundled WASM glue |
| `sue-runtime.wasm` | Extension Page | Compiled Leptos UI binary |
| `local-api-server.js` | Local Process | REST API, persistence, auth |
| `native-host/host.js` | Native Process | IPC host, spawns API server |
| `installer/installer.js` | Installer | Setup exe, registry, startup config |

---

## Quick Reference: Permissions & When You Need Them

| Permission | When Required |
|------------|---------------|
| `storage` | `chrome.storage.local/session/sync` — always |
| `tabs` | `chrome.tabs.query/get/update/sendMessage` |
| `activeTab` | `scripting.executeScript` on current tab after gesture |
| `scripting` | Inject scripts/CSS via the API (not manifest content_scripts) |
| `sidePanel` | `chrome.sidePanel.open()` — Chrome/Edge only |
| `nativeMessaging` | `chrome.runtime.connectNative()` |
| `offscreen` | `chrome.offscreen.createDocument()` |
| `alarms` | `chrome.alarms.create()` for scheduled background tasks |
| `tabCapture` | `chrome.tabCapture.capture()` for tab audio/video |
| `contextMenus` | `chrome.contextMenus.create()` for right-click menus |

---

*Built with SUE v5.0.0 — Sovereign AI Sidebar*
*Techniques proven in production across Chrome, Firefox, and Edge.*
