# Current review: straw-app/src

Inventory/current state: `straw-app/src` exists and contains no direct files or child entries. No applicable ancestor `AGENTS.md` was found. Its emptiness is consistent with an intentional legacy-directory remnant after the desktop rewrite: `straw-app/Cargo.toml:3` selects the replacement crates, `Trunk.toml:13` watches `ui` and the WASM/compiler packages, and `index.html:7,25` selects the WASM manifest and compiled UI entrypoint. `README.md:35–40` documents those owners.

Findings/patch: No current defect or missing implementation is established in this folder; no source patch is needed. Archived frontend findings should not be applied to this empty directory.

Dependencies: Active UI, frontend-build tool, WASM crate, and Tauri shell are reviewed separately.

Acceptance/confidence: High confidence in the current inventory and entrypoint ownership; no builds or runtime tests were run.

- [ ] Root acceptance: confirm the replacement Trunk/Tauri build succeeds without recreating `src`.
