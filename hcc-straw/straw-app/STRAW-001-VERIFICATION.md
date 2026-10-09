# STRAW-001 verification — 2026-10-09

Status: native Svelte compilation is implemented; the slice remains gated on G3 and observed UI execution. The subsequently requested standalone ledger core has separate evidence in `STRAW-002-VERIFICATION.md`; it does not close these gates.

## Native frontend

`tools/frontend-build` calls `rsvelte_core` 0.12.6 directly from Rust, pinned to Git revision `5ed8ea3a3401b9fbbe780d3b18d6f90073291d6b`. The JavaScript compiler and embedded scripting engine were removed. All eight `.svelte` components compile with runes enabled. The browser runtime matches the compiler's upstream Svelte 5.57.1 target at commit `636eaaaa6f06`.

Trunk runs the Cargo compiler hook, copies its local browser modules, and builds `crates/wasm-frontend` with wasm-bindgen. An OXC parser walks the resulting static import graph: 110 local modules resolve successfully for each entry, with the compute module supplied by Trunk. This found and repaired the upstream runtime's additional `#client/constants` import mapping. This is static validation, not observed browser execution.

The delivered UI contains JavaScript DOM code. A native compiler removes the JavaScript build engine; it does not remove the browser runtime. The compiler is an independent pre-1.0 implementation. No upstream compatibility, performance multiplier, or supply-chain certification is inferred from these application build results.

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
| G6 — UI invokes WASM | IMPLEMENTED; live acceptance pending | `ui/App.svelte` directly imports the compute module and calls its export from the compute button. Native compute tests and WASM build pass. Browser action was not observed. |

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

- Browser access to `http://127.0.0.1:8080` was rejected by automatic approval review. The reason stated that accessing this origin would bypass a prior browser-security denial. No alternate browser connection was used to perform the blocked action. Live UI, desktop IPC interaction and the compute-button acceptance remain unverified.
- Live model inference and installer execution were not tested. WebView2 and an available local model are prerequisites.
- The bundler reports that it could not patch its bundle-type marker. No updater is configured. The installer-generation result does not establish update support.
- New persistence tables preserve existing databases but do not migrate the previous incompatible graph format.
- Attachments are explicitly text-only. Image and audio inputs are rejected.

## Recovery copies

Retired original files were copied outside the app and verified by SHA-256 before removal. Recovery inventory and files are under:

`C:\Users\hammu\.codex\visualizations\2026\10\09\01a11f48-be27-7273-b30d-c4f91df89a57\STRAW-001-retired`

The prior local browser runtime and compiler are also preserved there. Application source and configuration changes were made in place; no commit or deployment was performed.
