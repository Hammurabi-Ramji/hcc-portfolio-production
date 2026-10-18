# A-F029 live observation / installer execution — open

Date: 2026-10-18  
Owner: A-F029 (`straw-app` root)  
Child owners: A-F041 (packaging), A-F051 (UI smoke), A-S15 (installer observation)

## Prerequisites inventory (present)

| Prerequisite | Path / note | Present |
|---|---|---|
| Bundled SvelteCoder GGUF | `straw-app/src-tauri/resources/models/svelte-coder/svelte-coder-v0.9.0-4b-q4_k_m.gguf` (~2.50 GiB) | YES |
| Model manifest / notices | same directory (`manifest.json`, `NOTICE.md`, licenses, `tokenizer.json`) | YES |
| NSIS setup | `straw-app/target/release/bundle/nsis/STRAW Desk_0.1.0_x64-setup.exe` (2026-10-09) | YES |
| MSI | `straw-app/target/release/bundle/msi/STRAW Desk_0.1.0_x64_en-US.msi` (2026-10-09) | YES |
| WebView2 | documented README prerequisite; not re-probed here | assumed (S15 used it) |

Not blocked by missing model or missing installer artifacts.

## Why the F029 checkbox stays **open**

A-F029 may edit only straw-app **root** docs/scripts. Live browser/Tauri UI, WASM button, IPC/persistence, model inference, and installer execution are owned by **A-F051 / A-F041 / A-S15**.

Prior successful observation (retain, do not re-certify as F029):

- Evidence: `review/agent-output/A-S15/`
- Observed 2026-10-10: installed WebView2 `STRAW Desk`, WASM compute, IPC save/run/history, attachment→fixture, live Ollama.

This F029 pass did **not** re-launch `cargo tauri dev`, re-install the NSIS/MSI into an isolated destination, or click through WASM/IPC/model UI. Concurrent workspace `cargo`/`trunk` lock contention also blocked a fresh offline Trunk rebuild during this session (see `A-F029.md` command log).

## Checkbox disposition

- STACK-F029 item 4 remains **unchecked**.
- Not claimed DONE for live UI/installer re-observation.
- Downstream: A-F051 UI smoke; A-F041 packaging checklist; A-S15 already has one dated installer observation.
