# STRAW-stack

Approved STRAW hybrid: Svelte 5 runes compiled to browser JavaScript by the native Rust compiler, Tauri 2, Rust/WASM compute, SQLx SQLite WAL storage, Tower/Tokio, Specta contracts, and optional loopback Axum. A supervised Candle sidecar bundles the verified Qwen3-based `rockypod/svelte-coder-4b` GGUF. The native vault, signed single-use grants and checkpointed ledger govern protected operations. See [the hybrid implementation record](straw-app/HYBRID-MERGE.md).

There is no Node.js, npm, pnpm, yarn, Python, pip, Playwright, Vite, or Webpack toolchain on the sovereign path. No `package.json` lockstep, `node_modules`, or `vite.config.js`. From `straw-app/`, the supported commands are `trunk build`, `cargo tauri build`, `cargo test --workspace --offline --locked`, and `cargo tree`. When `cargo` is not already on PATH, add `%USERPROFILE%\.cargo\bin`. Trunk accepts `NO_COLOR` as `true` or `false`, not `1`.

## Boundaries

- **Desktop:** `straw-app/`. Trunk, Tauri 2, Rust, Axum on `127.0.0.1`, and SQLite/sqlx. This is the sovereign product.
- **Legacy web:** `apps/web` is the quarantined Next.js tree. `apps/api` is the separate local Rust/Axum service that tree calls. Neither builds the desktop or Eduba. See [apps/README.md](apps/README.md).
- **Generator:** the original SaaS generator remains available in its own tree. The native `straw-fabricator` in this workspace preserves its nine template names and emits the reviewed shared core. Domain integrations are separate modules; legacy cloud clients are not imported into the runtime.

## Setup and current entry

Supported setup and commands are [straw-app/README.md](straw-app/README.md). The current entry is that file together with [straw-app/STRAW-001-VERIFICATION.md](straw-app/STRAW-001-VERIFICATION.md) and [straw-app/STRAW-002-VERIFICATION.md](straw-app/STRAW-002-VERIFICATION.md).

May 2026 guides under `output/` are historical. Each is labeled at the top and is not a setup instruction. The current engine does not import the previous UI's graph format. `output/historical/demo-nlp-to-code-flow.json` is an archived demo the engine rejects. `output/current-text-transform-graph.json` is a current graph fixture.

Upstream provenance for the vendored Svelte runtime and clsx is [straw-app/third-party/NOTICE.md](straw-app/third-party/NOTICE.md).

## Current validation

Latest source closeout: [2026-10-18 checks and remaining gates](review/closeout-2026-10-18/README.md). Desktop workspace tests, legacy web checks/build, local API tests, and generator unit tests passed. This checkpoint retains the release hold below.

Dated build evidence begins in the 2026-10-09 record in `straw-app/STRAW-001-VERIFICATION.md`. S15 desktop observation evidence is dated 2026-10-10 under `review/agent-output/A-S15/`.

- That verification file records workspace tests, cargo check, formatting, a standalone Trunk build, and desktop package generation for its snapshot. Eduba and the in-memory ledger core have separate notes in `STRAW-002-VERIFICATION.md`.
- **G3 literal source scan failed** and remains a release hold. The scan matches vendored upstream Svelte sources. Replacing the JavaScript compiler does not clear that result. This document does not grant a release exception.
- **G6 desktop observation is recorded for S15.** On 2026-10-10 an isolated NSIS install launched a WebView2 window titled `STRAW Desk` (`Edg/154.0.4258.62`, `http://tauri.localhost/#/modules`). In that window: WASM `fibonacci(10) = 55`, IPC save/run/history completed, chat attachment bytes reached a loopback capture fixture, and a live Ollama model answered. Evidence: `review/agent-output/A-S15/`.
- **S15 is complete** for those stated observations. Broader folder smoke rows (full editor matrix, packaging checklist) remain separately tracked where still unchecked.

This stack is not released while G3 remains a failed hold.
