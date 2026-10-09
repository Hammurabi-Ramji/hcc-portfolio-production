# STRAW Desk

A local application with a Tauri desktop surface and a static browser/PWA surface, sharing Svelte 5 runes components and Rust WebAssembly compute. SQLite is the desktop database. Engine networking accepts only literal IPv4 loopback endpoints.

## Prerequisites

- Rust 1.95 or later with the Windows MSVC toolchain, Visual Studio C++ Build Tools and WebView2.
- `rustup target add wasm32-unknown-unknown`
- Trunk 0.21.14 or compatible (`cargo install trunk --locked`).
- Tauri CLI 2 (`cargo install tauri-cli --locked`).
- wasm-bindgen CLI **0.2.121**, matching the pinned compute crate (`cargo install wasm-bindgen-cli --version 0.2.121 --locked`).
- Local Ollama with a downloaded model for chat and code generation; model name defaults to `llama3.2` and is editable.

Run all commands from this folder. Cargo's manifest establishes a workspace boundary independent of ancestor workspaces. Tools must be available on PATH.

## Build and run

```powershell
cargo fetch --locked
cargo build --workspace --offline
cargo test --workspace --offline
trunk build
trunk build --config Trunk.site.toml
cargo run --offline -p frontend-build -- verify-site
cargo tauri dev
cargo tauri build
```

Dependency provisioning is separate from application networking. After provisioning, the build hook operates offline. The test framework is `cargo test`. Tests exercise contract serialization, actual SQLite persistence, graph failure propagation, path validation, named-file parsing, and an actual Axum server.

Trunk does not have a built-in Svelte asset type. Its pre-build hook runs `tools/frontend-build`, which calls the native `rsvelte_core` Rust compiler pinned to revision `5ed8ea3a3401b9fbbe780d3b18d6f90073291d6b` (0.12.6). Components compile in Svelte 5 runes mode to browser modules with injected CSS. Trunk builds the compute crate through its Rust asset pipeline and wasm-bindgen. No JavaScript compiler or scripting runtime runs during the build. The browser still executes Svelte's local JavaScript DOM runtime, pinned to the compiler's Svelte 5.57.1 target. Import maps resolve modules without a bundler. See `third-party/NOTICE.md` for provenance and licenses. The compiler is an independent pre-1.0 implementation; a successful build is not a claim of complete upstream compatibility or supply-chain certification.

`trunk serve` binds **127.0.0.1:8080** for desktop development. Desktop assets go to `dist/`. `trunk serve --config Trunk.site.toml` binds **127.0.0.1:8081** for the PWA and writes `site-dist/`. Build the two entries sequentially because they share generated component assets. Serve the PWA output at an origin's root, rather than a subdirectory; opening its HTML as a local file does not support installation.

Both surfaces use hash routes: `#/modules`, `#/flows`, `#/chat`, and `#/code`. The browser navigation offers modules and desktop-flow viewing; direct chat/code routes explain the desktop requirement. The PWA's standalone function is bounded WASM compute. It does not pretend to provide a browser database, model inference, or filesystem access.

The PWA caches its static shell, browser modules, licenses, manifest, icon, and WASM after its first successful connected load. A Rust post-build hook hashes all asset contents into the cache version and writes the precache list in Trunk's staging directory. The worker serves cached navigation and listed static assets, and does not cache API responses. Downloaded updates wait for the operator to press **Apply downloaded update**. Installation uses the browser's install menu or the install button when the browser offers it. Browser support for installation varies.

The UI owns WASM initialization. Trunk's automatic script injection is disabled to prevent a second initializer and to keep import maps before application modules. The PWA build also generates a CSP hash for its inline import map, restricts scripts and workers to local assets, and permits data connections only to its own origin and the fixed desktop API.

**Load desktop flows** explicitly requests a read-only snapshot from **127.0.0.1:8741**. It makes no request on startup or reconnect. The API accepts browser reads only from **http://127.0.0.1:8081**; other browser origins are rejected. This origin restriction is a browser boundary, not authentication against local processes. No browser mutation routes are added. Editing, execution, chat, and file writes use desktop IPC. Browser snapshots are held in memory only, excluded from offline caches, and fetched without credentials or redirect following.

To check offline behavior manually: serve the PWA, open `http://127.0.0.1:8081/#/modules`, wait for **Offline shell ready**, select offline mode in browser developer tools, reload, then compute Fibonacci(10). The expected result is 55. Verify the flows view makes no API request until its load button is pressed. This browser acceptance check remains unobserved in the current environment; static asset verification does not substitute for it.

## Workspace

- `crates/engine`: typed identities, contracts, validation/execution, persistence, node implementations, local model calls, generation/refinement, and file guards. It has no desktop-shell dependency.
- `crates/axum-loop`: read-only `/health` and `/flows` routes, **127.0.0.1:8741** only.
- `crates/wasm-frontend`: bounded Fibonacci compute and greeting exports, built for both browser WASM and the optional native command.
- `src-tauri`: managed database and flow registry, command handlers, and API service lifecycle.
- `ui`: standalone Svelte 5 runes components. The compute action directly imports and executes the WASM export.
- `site`: PWA entry, install manifest, icon, and service worker. The same compiled UI serves both surfaces.
- `tools/frontend-build`: local compiler/build hook.
- `crates/straw-ledger`: dependency-free, in-memory outcome hash chain with a sealed/verified lifecycle. Persistence integration is deferred; see `STRAW-002-VERIFICATION.md`.

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

See `STRAW-001-VERIFICATION.md` for actual results, deviations, and pending work. Installer generation alone does not prove successful installation or live model inference. The next slice remains gated on completion of the verification contract.

WebView2 is a prerequisite. The Windows installer skips downloading it. In terminals that set NO_COLOR to the numeric string 1, set it to true before invoking Trunk 0.21.14.

