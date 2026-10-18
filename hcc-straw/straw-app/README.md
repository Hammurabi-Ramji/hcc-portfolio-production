# STRAW Desk

STRAW hybrid desktop: Svelte 5 runes compiled to browser JavaScript by the native Rust compiler, Tauri 2, Rust WebAssembly compute, SQLx SQLite WAL storage, Tower/Tokio, Specta contracts, and optional loopback Axum. Tauri supervises a separate Candle CPU worker with a bundled, verified SvelteCoder GGUF. A native encrypted vault, signed single-use grants and independently checkpointed ledger govern inference and file exports. The PWA shares the UI and WASM compute.

Eduba (`crates/eduba-ledger`, `crates/eduba-server`) is the archival ledger: an append-only SQLite record house using sqlx `query!` macros. It is not a school, LMS, curriculum, or student product.

There is no Node.js, npm, pnpm, yarn, Python, pip, Playwright, Vite, or Webpack step. No `package.json` lockstep, `node_modules`, or `vite.config.js`. Supported commands are `trunk build`, `cargo tauri build`, `cargo test --workspace --offline --locked`, and `cargo tree`.

This folder is the consolidated core and desktop. The native `straw-fabricator` preserves the original generator's template names and emits the reviewed shared core. `apps/web` and the original generator remain available as legacy source trees. See [HYBRID-MERGE.md](HYBRID-MERGE.md) for implementation, use and migration boundaries.

## Prerequisites

- Rust 1.96 or later with the Windows MSVC toolchain, Visual Studio C++ Build Tools and WebView2. The locked dependency set is verified with Rust 1.98.1.
- `rustup target add wasm32-unknown-unknown`
- Trunk 0.21.14 or compatible (`cargo install trunk --locked`).
- Tauri CLI 2 (`cargo install tauri-cli --locked`).
- wasm-bindgen CLI **0.2.121**, matching the pinned compute crate (`cargo install wasm-bindgen-cli --version 0.2.121 --locked`).
- The bundled SvelteCoder pack under `src-tauri/resources/models/svelte-coder`. Large model files are excluded from Git; restore the verified pack with `scripts/stage-model-pack.ps1 -SourceDirectory PATH`.
- Ollama or llama.cpp is optional. Start its local service, then scan and select an installed model in **Local models**.

Run all commands from this folder. Cargo's manifest establishes a workspace boundary independent of ancestor workspaces. When `cargo` is not already on PATH, add `%USERPROFILE%\.cargo\bin`. Trunk 0.21.14 accepts `NO_COLOR=true` or `NO_COLOR=false`, not the numeric string `1`.

## Build and run

```powershell
cargo fetch --locked
cargo build --workspace --offline --locked
cargo test --workspace --all-features --offline --locked
cargo tree --offline
trunk build
trunk build --config Trunk.site.toml
cargo run --offline --locked -p frontend-build -- verify-site
cargo tauri dev
cargo tauri build --no-bundle
powershell -NoProfile -File scripts/check-bindings.ps1
```

Dependency provisioning is separate from application networking. After provisioning, the build hook operates offline. The test framework is `cargo test`. Tests exercise contract serialization, actual SQLite persistence, graph failure propagation, path validation, named-file parsing, and an actual Axum server.

Trunk does not have a built-in Svelte asset type. Its pre-build hook runs `tools/frontend-build`, which calls the native `rsvelte_core` Rust compiler pinned to revision `5ed8ea3a3401b9fbbe780d3b18d6f90073291d6b` (0.12.6). Svelte 5 runes compile through that Rust hook. Trunk builds the compute crate to WASM with wasm-bindgen. There is no Node, npm, Vite, or Python build step. Import maps resolve modules without a bundler. See `third-party/NOTICE.md` for provenance and licenses. The compiler is an independent pre-1.0 implementation; a successful build is not a claim of complete upstream compatibility or supply-chain certification.

`trunk serve` binds **127.0.0.1:8080** for desktop development and writes `dist/`. The Tauri production build writes `desktop-dist/`, keeping its temporary output separate from browser builds. `trunk serve --config Trunk.site.toml` binds **127.0.0.1:8081** for the PWA and writes `site-dist/`. Build the two entries sequentially because they share generated component assets. Serve the PWA output at an origin's root, rather than a subdirectory; opening its HTML as a local file does not support installation.

Desktop routes include modules, records, project validation, vault/grants, ledger, workflows, documents, local models, fabricator, chat, and code generation. Initialize or unlock **Vault and grants**, then Load → Warm the bundled model in **Local models**. A native consent dialog issues a single-use request grant before protected operations. The browser navigation offers modules and desktop-flow viewing; its standalone function is bounded WASM compute.

## BSM-C product decisions

**See A Need, Code A Seed. Keep the faith, the good exists.**

This workspace implements BSM-C through measurable checks and explicit failure reports. See [PRODUCT-DECISIONS.md](PRODUCT-DECISIONS.md) for the reconciled product scope, architecture decisions, corrected terminology, and remaining research boundaries.

**Records** mounts the reusable `packages/origami-fe` canvas over the six native Accordion commands. Create a Topic before linking Notes to it. Ordinary records live in local SQLite and are not encrypted vault items. Schema is embedded from `.autarch.yaml`; edit it, regenerate bindings, rebuild, and restart. Arbitrary JSON payloads still require Rust runtime validation even when the command envelope has generated TypeScript types.

**Validate project** selects a folder and asks for a native single-use approval before executing that project's build, tests, and lint tools. Keep the vault unlocked and the app open. All nine distinct gates must pass before a certificate is carved under the existing vault signer. Warnings, missing coverage, partial checks, and failures earn no certificate. The report remains readable if certificate storage fails. Certificates record the gate verdict and a SHA-256 fingerprint of source/configuration inputs; they do not assert that the software is free of defects. Use a copy of the CLI outside this workspace's target directory when validating the workspace itself, to avoid Windows executable replacement locks.

**Ledger** re-verifies precedents before displaying them. To add your own, unlock the vault, enter title/rationale/body, review the full frozen text, then approve carving. The author label is the local operator; the cryptographic identity is the vault signer. SQL triggers and signatures detect and resist changes within their stated trust model; they are not physical immutability against a compromised administrator and signer.

The PWA caches its static shell, browser modules, licenses, manifest, icon, and WASM after its first successful connected load. A Rust post-build hook hashes all asset contents into the cache version and writes the precache list in Trunk's staging directory. The worker serves cached navigation and listed static assets, and does not cache API responses. Downloaded updates wait for the operator to press **Apply downloaded update**. Installation uses the browser's install menu or the install button when the browser offers it. Browser support for installation varies.

The UI owns WASM initialization. Trunk's automatic script injection is disabled to prevent a second initializer and to keep import maps before application modules. The PWA build also generates a CSP hash for its inline import map, restricts scripts and workers to local assets, and permits data connections only to its own origin and the fixed desktop API.

**Load desktop flows** explicitly requests a read-only snapshot from **127.0.0.1:8741**. It makes no request on startup or reconnect. The API accepts browser reads only from **http://127.0.0.1:8081**; other browser origins are rejected. This origin restriction is a browser boundary, not authentication against local processes. No browser mutation routes are added. Editing, execution, chat, and file writes use desktop IPC. Browser snapshots are held in memory only, excluded from offline caches, and fetched without credentials or redirect following.

To check offline behavior manually: serve the PWA, open `http://127.0.0.1:8081/#/modules`, wait for **Offline shell ready**, select offline mode in browser developer tools, reload, then compute Fibonacci(10). The expected result is 55. Verify the flows view makes no API request until its load button is pressed. This browser acceptance check remains unobserved in the current environment; static asset verification does not substitute for it.

## Workspace

- `crates/crucible`: reusable Nine Gates engine and standalone CLI; checks both Rust and Trunk and records certificates only after nine distinct passes.
- `crates/accordion`: six schema/entity commands backed by the embedded `.autarch.yaml` and local record storage.
- `packages/origami-fe`: shared Svelte schema renderer, field components, navigation, and injected transport adapter.
- `crates/security` and `crates/stele`: encrypted vault secrets, scoped grants, and one signed security/precedent chain under the existing signer.
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

In the desktop **Documents → Eduba archives**, choose a local Eduba database or exported JSON to preview its five supported record groups. Unlock the vault and approve an import to keep an immutable plaintext copy; approve an export to write a new JSON file. IDs, relationships and timestamps survive export/reimport. The adapter reads source records without upgrading their schema, refuses unsupported record columns, and limits each archive to 10,000 records / 16 MiB. Other database tables, including credentials, are outside this adapter; record text is copied as written. See [archive validation](../review/sovereign-consolidation-2026-10-10/eduba-archive-validation.md).

## Digital Hands credentials

In **Vault and grants → Digital Hands credentials**, choose a local legacy database, select one owner, and preview its credential IDs. Unlock the STRAW vault, enter the original installation `SECRET_KEY` in the masked field, and approve the encrypted import. The adapter authenticates every legacy AES-GCM field and atomically re-encrypts the selected batch under the STRAW vault key. Original IDs, owner IDs, stored text and timestamp storage classes are retained. Signed receipts cover both ciphertext and provenance; repeat content keeps its first receipt. Account password hashes, sessions and integrations remain outside this adapter. Revealing one credential requires a separate one-use approval; displayed text clears after 30 seconds or when this vault panel locks. See [credential migration validation](../review/sovereign-consolidation-2026-10-10/digital-hands-validation.md).

## Persistence and commands

**Core recovery copies** are available under **Vault and grants**. Unlock the vault, select **Create recovery copy**, choose a parent folder and approve the export. STRAW creates a new folder containing a standalone core database, matching signed checkpoint and signed manifest, then verifies the copy. **Verify existing copy** also works while locked and compares the signing identity with the current vault when available. Saved workflows, documents, vectors, archives and encrypted vault data are included. Records (`records.db`), models, generated projects and unsaved UI state are excluded; ordinary documents remain readable. This slice verifies copies without replacing live data. See [recovery validation](../review/sovereign-consolidation-2026-10-10/recovery-validation.md).

Schema: `crates/engine/src/schema.sql`. Database: `straw.db` under Tauri's application-data directory for identifier `r.k.girdhari.strawflow`. New tables are `desk_flows` and `desk_runs`; existing databases are not deleted. This slice does not import records from the previous UI's incompatible graph format.

A new editor obtains its UUID from `flow_new`. `flow_save` returns the persisted row, which updates the parent list. The engine stores a running record before validation, then records completion or failure with clock-derived start and finish timestamps. Invalid graphs execute no nodes. Node failures stop execution before any later node can run.

The generated `ui/bindings.ts` contract contains the command registry, including workflows, chat/code, model lifecycle/discovery, documents/vectors, vault/grants and fabricator commands. Protected inference and exports require native, signed single-use grants. See [the hybrid implementation record](HYBRID-MERGE.md).

All structured wire fields use camelCase. Attachment fields are `name`, `mimeType`, `sizeBytes`, and `data`. Generated-file fields are `id`, `path`, `content`, and `isDirty`.

## Local model and files

The desktop defaults to the bundled `rockypod/svelte-coder-4b` worker at `candle://bundled`; explicitly Load and Warm it in Local models before use. Optional Ollama discovery starts at `http://127.0.0.1:11434`; llama.cpp uses its local OpenAI-compatible endpoint. Hostnames, other addresses, external endpoints, redirects, and environment proxies are rejected or disabled. Ollama cloud tags and remote metadata are rejected. External companion services remain trusted local processes. Body size is bounded to 4 MiB and model generation has a 180-second deadline.

Attachments are **text-context-only**: UTF-8 text and JSON documents up to 1 MiB. Images and audio are explicitly rejected in the UI and engine.

Generation requires a local output directory and named fenced blocks. The first line inside each block must be `path: relative/file.ext`. Duplicate, rooted, parent-traversing, Windows alias, and existing linked/reparse paths are rejected. Initial generation refuses existing destinations. Files are staged before destination writes. Refinement receives current content and retains the file ID; the UI calls `file_save` before replacing the visible content.

The preserved Read File and Write File nodes operate on explicit operator-configured local paths. Model-generated code paths have the separate output-root guard.

## Verification status

The current hybrid implementation and dated checks are linked from [HYBRID-MERGE.md](HYBRID-MERGE.md). [`STRAW-001-VERIFICATION.md`](STRAW-001-VERIFICATION.md) and S15 observations below describe their earlier snapshots.

**Current package entry:** this README and the PowerShell helpers under `scripts/` (`dev-desktop.ps1`, `build-desktop.ps1`). Supported commands remain `trunk build` / `trunk build --offline --release`, `cargo tauri build`, `cargo test --workspace --offline --locked`, and `cargo tree`. Stack-level May 2026 guides under [`../output/`](../output/) carry archival banners and point here; see also [`../output/historical/README.md`](../output/historical/README.md). Those guides are not current entry instructions and must not be followed for npm/Vite/`package.json` desktop builds.

**G3 release hold (open):** the whole-tree literal source scan failed and remains release-blocking per `../review/arbitration.md`. Disposition evidence: [`../review/agent-output/A-F029/G3-DISPOSITION.md`](../review/agent-output/A-F029/G3-DISPOSITION.md). The scan matches upstream Svelte sources vendored for the browser runtime. Identifiers and license notices must not be disguised. Replacing the JavaScript compiler does not clear that literal result. This document does not grant a release exception; S16/human clearance is required before release promotion.

G6 browser WASM was first seen on 2026-10-09 at `http://127.0.0.1:8094/#/modules` (`fibonacci(10) = 55 · WebAssembly`). On 2026-10-10 S15 also observed an **installed** WebView2 window (`STRAW Desk`, `tauri.localhost`): WASM compute, IPC save/run/history, attachment send into a loopback capture fixture, and a live Ollama reply. Evidence: `../review/agent-output/A-S15/`. S15 is complete for those observations; G3 remains a release hold.

Upstream provenance for the vendored Svelte runtime and clsx is `third-party/NOTICE.md`, with the local license texts copied into generated `public/ui/vendor/licenses/` and Trunk `dist/public/ui/vendor/licenses/`. A successful build is not a claim of complete upstream compatibility.

The current engine does not load the previous UI's graph format. `../output/historical/demo-nlp-to-code-flow.json` is an archived incompatible example. `../output/current-text-transform-graph.json` is a current graph.

Installer generation alone is not enough; S15 re-ran the NSIS setup into an isolated destination, opened the installed window, and recorded IPC/model/attachment evidence under `../review/agent-output/A-S15/`. The Trunk distribution's license paths are `dist/public/ui/vendor/licenses/svelte-LICENSE.md`, `clsx-LICENSE`, and `NOTICE.md`.

WebView2 is a prerequisite. The Windows installer skips downloading it. In terminals that set NO_COLOR to the numeric string 1, set it to true before invoking Trunk 0.21.14.

