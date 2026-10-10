# STRAW-001 verification — 2026-10-09

Sovereign baseline: Svelte 5 runes compiled by Trunk to WASM, Tauri 2, pure Rust, Axum on `127.0.0.1`, and Eduba (`crates/eduba-ledger`, `crates/eduba-server`) as the append-only SQLite archival ledger via sqlx `query!` macros. Supported commands are `trunk build`, `cargo tauri build`, `cargo test --workspace --offline --locked`, and `cargo tree`. No Node.js, npm, pnpm, yarn, Python, pip, Playwright, Vite, or Webpack. This file records the 2026-10-09 desktop checks. Eduba tests are not part of the counts below.

Status: native Svelte compilation is implemented; the slice remains gated on G3 and observed UI execution. The subsequently requested standalone ledger core has separate evidence in `STRAW-002-VERIFICATION.md`; it does not close these gates. Eduba is the archival record house, not a school or curriculum product.

## Native frontend

`tools/frontend-build` calls `rsvelte_core` 0.12.6 directly from Rust, pinned to Git revision `5ed8ea3a3401b9fbbe780d3b18d6f90073291d6b`. Svelte 5 runes compile through that Rust hook to the Trunk WASM build. All eight `.svelte` components compile with runes enabled. The `.svelte` sources are not a Node application. There is no Node, npm, Vite, or Python step in this build.

Trunk runs the Cargo compiler hook and builds `crates/wasm-frontend` with wasm-bindgen. An OXC parser walks the resulting static import graph: 110 local modules resolve successfully for each entry, with the compute module supplied by Trunk. This found and repaired the upstream runtime's additional `#client/constants` import mapping. This is static validation, not observed browser execution.

The supported path is `trunk build` and `cargo tauri build`. This record does not authorize a Node, npm, Vite, or JavaScript runtime step. The compiler is an independent pre-1.0 implementation. No upstream compatibility, performance multiplier, or supply-chain certification is inferred from these application build results.

## Required checks

| Check | Result | Evidence |
|---|---|---|
| Cargo dependency tree | PASS | Native compiler and OXC present; previous scripting engine, disallowed HTTP client, cloud SDKs and telemetry absent from the inspected dependency tree. |
| Workspace tests | PASS | 49 tests: 40 engine, 3 Axum, 1 compute, 5 frontend-build tests; zero failures in the final run with loopback access. The HTTP test uses an actual loopback server and SQLite rows. |
| Workspace check | PASS | `cargo check --workspace --offline`. |
| Formatting | PASS | `cargo fmt --all --check`. |
| Standalone frontend | PASS | `trunk build`, native compiler hook, static module graph and WASM output. |
| Desktop package | PASS | Final `cargo tauri build` completed after the desktop/PWA extension and current engine changes. Native release compilation passed and both MSI and setup executable were regenerated. |

## Gate evidence

| Gate | Result | Evidence |
|---|---|---|
| G1 — wire contracts | PASS | Actual serde round trips for attachment and generated-file data, including camelCase names and stable identity fields. |
| G2 — listener | PASS | Sole listener binds the fixed IPv4 loopback address on port 8741; test asserts it. HTTP client rejects other hosts and disables redirects and environment proxies. |
| G3 — literal source scan | FAIL | Complete app source-tree scan, excluding generated outputs, matches 95 upstream Svelte files; first-party files have zero matches. Upstream identifiers are retained. Compiler replacement does not resolve this literal requirement. |
| G4 — failed graphs | PASS | Empty, cyclic, duplicate-ID and invalid-port graphs rejected. Cycle execution persists Failed with distinct clock timestamps. Upstream node failure prevents downstream file writes. |
| G5 — output confinement | PASS for tested cases | Named-fence parsing, batch validation before writes, refusal to overwrite on initial generation, and rejection of traversal, roots and Windows aliases are tested. Linked existing path components are rejected in implementation. No claim of race-free multi-file transactions is made. |
| G6 — UI invokes WASM | PASS for S15 installed-window observation | Browser: 2026-10-09 Trunk page at `http://127.0.0.1:8094/#/modules` showed `fibonacci(10) = 55 · WebAssembly`. Desktop: 2026-10-10 isolated NSIS install opened WebView2 `STRAW Desk` (`tauri.localhost`); WASM, IPC save/run/history, attachment→fixture, and live Ollama were observed. Evidence: `../review/agent-output/A-S15/`. |

The enclosing Git index query did not identify tracked app files. A vacuous zero-match result is not accepted: G3 above scans the complete candidate source tree, including new implementation files and local upstream sources. No Git configuration or index was modified.

Desktop artifacts:

- [Windows setup](<C:/IEDB/STRAW Stack/straw-app/target/release/bundle/nsis/STRAW Desk_0.1.0_x64-setup.exe>)
- [Windows MSI](<C:/IEDB/STRAW Stack/straw-app/target/release/bundle/msi/STRAW Desk_0.1.0_x64_en-US.msi>)

## Desktop and PWA surface extension

The same Svelte source and Rust compiler now build two entries: `index.html` to `dist/` for Tauri, and `site/index-site.html` through `Trunk.site.toml` to `site-dist/` for the PWA. Hash navigation provides the modules, flows, chat, and code views. Browser-only operation offers WASM compute and a read-only desktop-flow viewer; unavailable native features are labeled explicitly.

The PWA includes an install manifest, vector icon, service worker, content-derived cache version, operator-applied downloaded updates, and a CSP hash for its inline import map. Its post-build hook verifies 162 static assets, licenses, manifest fields, import-map ordering, and WASM presence. Trunk's injected initializer is disabled so the UI initializes WASM once. Cache tests verify that file creation order does not alter the version and changed asset bytes do.

Browser flow access starts only on a button press, targets the fixed loopback API, and is allowed only from `http://127.0.0.1:8081`. Tests reject external, opaque, hostname, lookalike, and other-port origins, and confirm that a write request has no route. Native callers without an Origin header retain the existing behavior. The API shares the engine's Rust `FlowRecord` wire format with desktop IPC; no second persistence model or browser mutation API was introduced. API responses and flow snapshots are excluded from offline caching.

Build and verification commands are in `README.md`. Browser installation, offline reload, route/back-button interaction, and actual WASM button execution remain pending live acceptance. The previously rejected browser-security action was not attempted through a new origin or alternate browser interface. Static PWA verification is not reported as a successful offline browser test.

The two supplied source archives were reviewed as references only. Findings are in `../STRAW-REFERENCE-REVIEW.md`; no archive code, scripts, or patches were imported or executed.

## Boundaries and remaining checks

- Browser access to `http://127.0.0.1:8080` was rejected by automatic approval review. The reason stated that accessing this origin would bypass a prior browser-security denial. No alternate browser connection was used to perform the blocked action. That earlier limit remains part of the record.
- On 2026-10-09 the Trunk release output was served at `http://127.0.0.1:8094`. **Compute in WASM** returned `fibonacci(10) = 55 · WebAssembly`. The flows button stayed disabled because that origin is not `http://127.0.0.1:8081`.
- On 2026-10-10 S15 installed the NSIS setup into an isolated directory, opened the WebView2 window, and recorded WASM, IPC save/run/history, attachment send to a loopback fixture, and a live Ollama reply. See `../review/agent-output/A-S15/`.
- The bundler reports that it could not patch its bundle-type marker. No updater is configured. The installer-generation result does not establish update support.
- New persistence tables preserve existing databases but do not migrate the previous incompatible graph format.
- Attachments are explicitly text-only. Image and audio inputs are rejected.

## Recovery copies

Retired original files were copied outside the app and verified by SHA-256 before removal. Recovery inventory and files are under:

`C:\Users\hammu\.codex\visualizations\2026\10\09\01a11f48-be27-7273-b30d-c4f91df89a57\STRAW-001-retired`

The prior local browser runtime and compiler are also preserved there. Application source and configuration changes were made in place; no commit or deployment was performed.
