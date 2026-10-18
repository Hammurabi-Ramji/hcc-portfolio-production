# Review 108 — straw-app/src-tauri

Reviewed current direct files at **2026-10-09 06:52–06:54 UTC**, after the Rust-workspace rewrite. No applicable ancestor `AGENTS.md` was present. Owned inventory: `.gitignore` (7 lines), `build.rs` (3), `Cargo.toml` (22), `tauri.conf.json` (43). All were read with line numbers; there is no direct lockfile. Children are outside this review.

Snapshot SHA-256 (unchanged on second read):

| File | SHA-256 |
| --- | --- |
| .gitignore | `88707CDA7BA4226EDA3FFA91D8284F1A0D12B827F06FB9BC48425CC0D4AF04AF` |
| build.rs | `487059EAF8A947B80F20A9AACAC038A5047B2AD69D2401B827376C67D6FE847F` |
| Cargo.toml | `6D19AB6F22C66E51F0C44C1AE0021A55C2BCD88CD22E6DF4B677375E83DD971C` |
| tauri.conf.json | `89F0344985251B7E1EE6718B279C2045A7B8AAE3EA01E42CD56B4FA7B4C5C0C2` |

## Current versus specified

The root README names Svelte/Tauri/Rust/Axum/WASM; the new desktop README describes an offline build pipeline, SQLite persistence, local commands and literal-loopback networking. The current manifest correctly forwards shared Serde/Tokio dependencies and links the new engine, Axum and compute crates (`Cargo.toml:17–22`). The parent workspace includes all three and this shell (`../Cargo.toml:3`); lockfile entries now include `straw-stack`, Tauri 2.12.2 and tauri-build 2.7.1. `build.rs:2` delegates standard Tauri build processing. Existing generated-schema/target ignores remain appropriate.

The config pairs `trunk serve` with **127.0.0.1:8080**, and `trunk build` with `../dist` (`tauri.conf.json:7–10`); parent Trunk configuration confirms those values and invokes the Rust frontend compiler hook. The CSP permits local IPC, loopback API/dev connections and WASM compilation (`:23`). Global Tauri exposure (`:25`) matches the shell's invoke-based UI integration. WebView2 download skipping (`:39`) is expressly documented as an installation prerequisite (`../README.md:66`). These are evidence of wiring, not proof of successful packaged execution.

## Findings and concrete patch targets

**No proven blocking defect in the four owned files.** Proposed **P3 build improvement**: `tauri.conf.json:9` uses plain `trunk build`, so the packaging hook does not request Trunk's release profile. Change the single value to `"trunk build --release"` if optimized packaged WASM is the intended release contract; keep `beforeDevCommand` unchanged. Validate resulting assets before adoption. This is an optimization gap, not a demonstrated startup failure.

Documentation update after this inspection: the `STRAW-001-VERIFICATION.md` link now resolves; the package report reviews that new document. Older `output/TESTING_GUIDE.md:191–201` still prescribes npm and describes WASM as unintegrated. Generator documents' blanket production-readiness claims cannot validate this rewritten shell.

## Dependencies, acceptance, confidence

Depends on the parent workspace/lockfile, Trunk and native compiler hook, three Rust crates, generated frontend assets, child capabilities/icons and Windows WebView2. Child command behavior is separately reviewed.

- [ ] Root runs current offline workspace checks and Trunk build; earlier Svelte/Cargo logs are historical.
- [ ] Build installer, launch with Trunk stopped, and confirm embedded UI, IPC and WASM under the CSP.
- [ ] Confirm loopback API startup/shutdown and WebView2 prerequisite handling on the supported Windows environment.
- [ ] Decide release-WASM profile and publish the missing current verification record.

High confidence in inventory and static integration; runtime packaging, installer execution and live model inference were not run. No installs, network activity, source edits or broad tests were performed.


## Final verification update from the root reviewer

Subsequent current-source `cargo test --workspace --offline --locked` passed all 15 tests (12 engine,2Axum,1WASM), superseding interim lock/sandbox failures quoted above. An isolated clean native compiler build passed and all 150 generated browser files match saved output, with no extras. Current verification documentation now exists. These results do not verify live native UI/model behavior or cover the proposed new regression cases. See review/desktop-current-full-tests.log, frontend-copy-comparison.json and source-stability.json.
