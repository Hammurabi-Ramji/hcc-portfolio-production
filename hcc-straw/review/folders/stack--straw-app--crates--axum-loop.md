# Current folder review: straw-app/crates/axum-loop

Scope: registry index 135. The sole direct file is `Cargo.toml` (13 lines), read completely with numbered lines. `src/` is owned by index 136; its existing report was consulted. No applicable ancestor AGENTS.md was found. No source edits, installs, network access, registry changes, or tests were performed.

## Current versus specified

The manifest defines the Rust 2021 `axum-loop` library (`Cargo.toml:1-4`), inherits Axum and Tokio from the desktop workspace (`:7-8`), and uses the sibling `straw-engine` crate (`:9`). `tempfile` is correctly dev-only (`:11-12`) for real SQLite integration tests. Workspace `straw-app/Cargo.toml:3-4` includes this package in both members and default-members; its Axum 0.7 and Tokio runtime/macros/network/sync features (`:11-12`) support the current implementation. The workspace lockfile's package entry agrees with these dependencies.

`straw-app/README.md:36,38` specifies read-only `/health` and `/flows` at IPv4 localhost port 8741 with a Tauri-managed lifecycle. Tauri depends directly on this crate (`src-tauri/Cargo.toml:20`), binds during setup and passes the shared database (`src-tauri/src/lib.rs:157-167`), then signals shutdown at exit (`:173-177`). This is concrete integration evidence. Generator completion claims and older output guides do not establish current desktop verification.

## Findings, dependencies, acceptance

No manifest defect or manifest patch is warranted. The child report's fixed-port test collision and caller shutdown-verification gap remain with their respective source owners; do not duplicate those changes here. Dependencies are the workspace versions/features, engine database/flow contracts, and Tauri lifecycle.

- [ ] Preserve workspace membership, sibling engine dependency, and test-only tempfile when changing the API crate.
- [ ] Coordinate the child source's ephemeral-port test patch and Tauri exit verification with their owners.

Confidence: high for manifest integration. Root-provided `review/desktop-current-full-tests.log` records 15 passing workspace tests, including both Axum tests; this supersedes the older lockfile-blocked observation in the child report. No checks were independently rerun.
