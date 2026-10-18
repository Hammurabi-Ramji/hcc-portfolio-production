# Current engine package review — index 137

Reviewed 2026-10-09. Direct inventory: `Cargo.toml` only, all 18 lines inspected. `src/` and `src/nodes/` are covered by indexes 138 and 139; their implementation findings remain in those reports. No applicable `AGENTS.md` exists in the checked ancestors. No application source, dependencies, or registry entries were changed.

## Existing versus specified behavior

`Cargo.toml:1-4` defines `straw-engine` 0.1.0 with Rust 2021. Cargo's implicit library target correctly resolves `src/lib.rs:1-11`, exposing the contracts, graph, database, network, chat, generation and node modules and test module. The parent workspace includes this package in both members and default-members (`straw-app/Cargo.toml:3-4`). There is no desktop-shell dependency, consistent with current `README.md:35`.

Every direct dependency has source usage. Inherited serde derive, UUID v4/serde, bundled SQLite and chrono settings are present in the parent manifest (`:7-14`); csv and tempfile support node parsing and isolated filesystem/database tests. `Cargo.toml:14` disables ureq defaults and enables JSON. Lack of TLS is intentional: `src/network.rs:14-16` accepts only plain HTTP and the current README:54 documents that constraint. Adding reqwest/TLS to match historical output guidance would contradict the current implementation boundary.

Both consumers use valid path dependencies: `src-tauri/Cargo.toml:19` and `crates/axum-loop/Cargo.toml:9`. Tauri imports the public engine library (`src-tauri/src/lib.rs:2-9`) and sends blocking engine work through `spawn_blocking` (`:19-24`). UI flow/schema and generation commands reach these handlers (`ui/FlowCanvas.svelte:22,44-53`, `ui/CodeGenPanel.svelte:16-34`). The lockfile records the same package dependencies (`Cargo.lock:3860-3872`).

## Findings and patch targets

**No manifest defect found; no package patch warranted.** Existing source defects should be fixed in the child-owned modules, without inventing package dependencies or an empty feature system. Historical `output/ENGINES_IMPLEMENTATION_GUIDE.md:49,259` describes hostname endpoints and async reqwest; current documentation deliberately supersedes these choices. The generator's production-completeness assertions (`docs/FINAL_VERIFICATION_REPORT.md:36-41`) do not establish desktop acceptance. The web summary describes a separate application (`output/WEB_PLATFORM_SUMMARY.md:127,164`). A documentation-maintenance improvement is to label those historical guides with a pointer to the current desktop README.

## Dependencies, acceptance and confidence

Root evidence `review/desktop-current-full-tests.log:16-32` shows all 12 engine tests passing; the full workspace totals 15 passing tests, including Tauri compilation. This supersedes the older lock-drift limitation recorded in the node report. No tests, installs, or network calls were run by this reviewer. Compilation proves manifest integration, not live UI or model acceptance; current verification documentation explicitly retains those limits.

- [ ] Preserve engine independence from Tauri when fixing child-module findings.
- [ ] After those fixes, rerun focused engine tests and root workspace checks.
- [ ] Complete observed desktop command/model acceptance and clarify historical documentation ownership.

High confidence in direct manifest coverage and package wiring; live runtime behavior remains unverified here.
