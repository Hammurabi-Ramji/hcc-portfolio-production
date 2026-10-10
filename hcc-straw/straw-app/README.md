# STRAW Desk

Sovereign desktop: Svelte 5 runes compiled by Trunk to WASM, Tauri 2, pure Rust, and Axum bound only to literal IPv4 loopback. A Tauri surface and a static browser/PWA surface share those compiled components and Rust WebAssembly compute. SQLite is local. This is not a Node.js or Vite application. The `.svelte` sources are not a Node app.

Eduba (`crates/eduba-ledger`, `crates/eduba-server`) is the archival ledger: an append-only SQLite record house using sqlx `query!` macros. It is not a school, LMS, curriculum, or student product.

There is no Node.js, npm, pnpm, yarn, Python, pip, Playwright, Vite, or Webpack step. No `package.json` lockstep, `node_modules`, or `vite.config.js`. Supported commands are `trunk build`, `cargo tauri build`, `cargo test --workspace --offline --locked`, and `cargo tree`.

This folder is the desktop. `apps/web` is the quarantined legacy Next.js tree and is not built from here. The SaaS generator is a separate tree; it does not build this desktop or Eduba.

## Prerequisites

- Rust 1.95 or later with the Windows MSVC toolchain, Visual Studio C++ Build Tools and WebView2.
- `rustup target add wasm32-unknown-unknown`
- Trunk 0.21.14 or compatible (`cargo install trunk --locked`).
- Tauri CLI 2 (`cargo install tauri-cli --locked`).
- wasm-bindgen CLI **0.2.121**, matching the pinned compute crate (`cargo install wasm-bindgen-cli --version 0.2.121 --locked`).
- Local Ollama with a downloaded model for chat and code generation; model name defaults to `llama3.2` and is editable.

Run all commands from this folder. Cargo's manifest establishes a workspace boundary independent of ancestor workspaces. When `cargo` is not already on PATH, add `%USERPROFILE%\.cargo\bin`. Trunk 0.21.14 accepts `NO_COLOR=true` or `NO_COLOR=false`, not the numeric string `1`.

## Build and run

```powershell
cargo fetch --locked
cargo build --workspace --offline --locked
cargo test --workspace --offline --locked
cargo tree --offline
trunk build
trunk build --config Trunk.site.toml
cargo run --offline --locked -p frontend-build -- verify-site
cargo tauri dev
cargo tauri build
```

Dependency provisioning is separate from application networking. After provisioning, the build hook operates offline. The test framework is `cargo test`. Tests exercise contract serialization, actual SQLite persistence, graph failure propagation, path validation, named-file parsing, and an actual Axum server.

Trunk does not have a built-in Svelte asset type. Its pre-build hook runs `tools/frontend-build`, which calls the native `rsvelte_core` Rust compiler pinned to revision `5ed8ea3a3401b9fbbe780d3b18d6f90073291d6b` (0.12.6). Svelte 5 runes compile through that Rust hook. Trunk builds the compute crate to WASM with wasm-bindgen. There is no Node, npm, Vite, or Python build step. Import maps resolve modules without a bundler. See `third-party/NOTICE.md` for provenance and licenses. The compiler is an independent pre-1.0 implementation; a successful build is not a claim of complete upstream compatibility or supply-chain certification.

`trunk serve` binds **127.0.0.1:8080** for desktop development. Desktop assets go to `dist/`. `trunk serve --config Trunk.site.toml` binds **127.0.0.1:8081** for the PWA and writes `site-dist/`. Build the two entries sequentially because they share generated component assets. Serve the PWA output at an origin's root, rather than a subdirectory; opening its HTML as a local file does not support installation.

Both surfaces use hash routes: `#/modules`, `#/flows`, `#/chat`, and `#/code`. The browser navigation offers modules and desktop-flow viewing; direct chat/code routes explain the desktop requirement. The PWA's standalone function is bounded WASM compute. It does not pretend to provide a browser database, model inference, or filesystem access.

The PWA caches its static shell, browser modules, licenses, manifest, icon, and WASM after its first successful connected load. A Rust post-build hook hashes all asset contents into the cache version and writes the precache list in Trunk's staging directory. The worker serves cached navigation and listed static assets, and does not cache API responses. Downloaded updates wait for the operator to press **Apply downloaded update**. Installation uses the browser's install menu or the install button when the browser offers it. Browser support for installation varies.

The UI owns WASM initialization. Trunk's automatic script injection is disabled to prevent a second initializer and to keep import maps before application modules. The PWA build also generates a CSP hash for its inline import map, restricts scripts and workers to local assets, and permits data connections only to its own origin and the fixed desktop API.

**Load desktop flows** explicitly requests a read-only snapshot from **127.0.0.1:8741**. It makes no request on startup or reconnect. The API accepts browser reads only from **http://127.0.0.1:8081**; other browser origins are rejected. This origin restriction is a browser boundary, not authentication against local processes. No browser mutation routes are added. Editing, execution, chat, and file writes use desktop IPC. Browser snapshots are held in memory only, excluded from offline caches, and fetched without credentials or redirect following.

To check offline behavior manually: serve the PWA, open `http://127.0.0.1:8081/#/modules`, wait for **Offline shell ready**, select offline mode in browser developer tools, reload, then compute Fibonacci(10). The expected result is 55. Verify the flows view makes no API request until its load button is pressed. This browser acceptance check remains unobserved in the current environment; static asset verification does not substitute for it.

## Workspace

- `crates/engine`: typed identities, contracts, validation/execution, persistence, node implementations, local model calls, generation/refinement, and file guards. It has no desktop-shell dependency.
- `crates/axum-loop`: read-only `/health` and `/flows` routes, **127.0.0.1:8741** only.
- `crates/eduba-ledger`: archival ledger. Append-only SQLite through sqlx `query!` macros. Not a school or curriculum product.
- `crates/eduba-server`: Axum for that ledger, **127.0.0.1** only (default port 8080).
- `crates/wasm-frontend`: bounded Fibonacci compute and greeting exports, built for both browser WASM and the optional native command.
- `src-tauri`: managed database and flow registry, command handlers, and API service lifecycle.
- `ui`: standalone Svelte 5 runes components. The compute action directly imports and executes the WASM export.
- `site`: PWA entry, install manifest, icon, and service worker. The same compiled UI serves both surfaces.
- `tools/frontend-build`: local compiler/build hook.
- `crates/straw-ledger`: dependency-free, in-memory outcome hash chain with a sealed/verified lifecycle. Persistence integration is deferred; see `STRAW-002-VERIFICATION.md`.

## Eduba

`eduba-ledger` inserts archival rows through sqlx `query!` macros. `eduba-server` listens on `127.0.0.1` only. The default address is `127.0.0.1:8080` (`AUTARCH_BE_ADDR`). The database URL defaults to `sqlite://eduba.db?mode=rwc` (`ACCORDION_DB_PATH`). Schema table names already in code are `learner`, `course`, `lesson`, `enrollment`, and `submission`. Those are stored record types.

```powershell
cargo test --offline --locked -p eduba-ledger
cargo test --offline --locked -p eduba-server
cargo run --offline --locked -p eduba-server
cargo tree -p eduba-ledger
```

The desk flow database in `crates/engine` is separate. It is not the Eduba record house.

## Persistence and commands

Schema: `crates/engine/src/schema.sql`. Database: `straw.db` under Tauri's application-data directory for identifier `r.k.girdhari.strawflow`. New tables are `desk_flows` and `desk_runs`; existing databases are not deleted. This slice does not import records from the previous UI's incompatible graph format.

A new editor obtains its UUID from `flow_new`. `flow_save` returns the persisted row, which updates the parent list. The engine stores a running record before validation, then records completion or failure with clock-derived start and finish timestamps. Invalid graphs execute no nodes. Node failures stop execution before any later node can run.

Commands: `flow_new`, `flow_save`, `flow_list`, `flow_delete`, `execute_workflow`, `execution_list`, `node_schemas`, `initialize_db`, `nlp_send`, `generate_code`, `refine_code`, `file_save`, `wasm_fibonacci`.

All structured wire fields use camelCase. Attachment fields are `name`, `mimeType`, `sizeBytes`, and `data`. Generated-file fields are `id`, `path`, `content`, and `isDirty`.

## Local model and files

The endpoint defaults to `http://127.0.0.1:11434/api/generate`. Hostnames, other addresses, encrypted external endpoints, redirects, and environment proxies are rejected or disabled. Body size is bounded to 4 MiB and model requests have a 180-second deadline.

Attachments are **text-context-only**: UTF-8 text and JSON documents up to 1 MiB. Images and audio are explicitly rejected in the UI and engine.

Generation requires a local output directory and named fenced blocks. The first line inside each block must be `path: relative/file.ext`. Duplicate, rooted, parent-traversing, Windows alias, and existing linked/reparse paths are rejected. Initial generation refuses existing destinations. Files are staged before destination writes. Refinement receives current content and retains the file ID; the UI calls `file_save` before replacing the visible content.

The preserved Read File and Write File nodes operate on explicit operator-configured local paths. Model-generated code paths have the separate output-root guard.

## Verification status

Current setup and release evidence is [`STRAW-001-VERIFICATION.md`](STRAW-001-VERIFICATION.md). Historical output guides that still mention the removed npm package are labeled archived under `output/historical/`; they are not current entry instructions. This README and that verification file are the current entry.

The G3 literal source scan failed and remains a release hold. The scan matches upstream Svelte sources that are vendored for the browser runtime. Replacing the JavaScript compiler does not clear that literal result, and this document does not grant a release exception.

G6 browser WASM was first seen on 2026-10-09 at `http://127.0.0.1:8094/#/modules` (`fibonacci(10) = 55 · WebAssembly`). On 2026-10-10 S15 also observed an **installed** WebView2 window (`STRAW Desk`, `tauri.localhost`): WASM compute, IPC save/run/history, attachment send into a loopback capture fixture, and a live Ollama reply. Evidence: `../review/agent-output/A-S15/`. S15 is complete for those observations; G3 remains a release hold.

Upstream provenance for the vendored Svelte runtime and clsx is `third-party/NOTICE.md`, with the local license texts copied into generated `public/ui/vendor/licenses/` and Trunk `dist/public/ui/vendor/licenses/`. A successful build is not a claim of complete upstream compatibility.

The current engine does not load the previous UI's graph format. `output/historical/demo-nlp-to-code-flow.json` is an archived incompatible example. `output/current-text-transform-graph.json` is a current graph.

Installer generation alone is not enough; S15 re-ran the NSIS setup into an isolated destination, opened the installed window, and recorded IPC/model/attachment evidence under `../review/agent-output/A-S15/`. The Trunk distribution's license paths are `dist/public/ui/vendor/licenses/svelte-LICENSE.md`, `clsx-LICENSE`, and `NOTICE.md`.

WebView2 is a prerequisite. The Windows installer skips downloading it. In terminals that set NO_COLOR to the numeric string 1, set it to true before invoking Trunk 0.21.14.

