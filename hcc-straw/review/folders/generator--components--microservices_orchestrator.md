# Review: components/microservices_orchestrator

Scope: registry index 65. Inspected every direct file with numbered lines: `.gitignore` (1), `Cargo.toml` (6), and `orchestrator.rs` (42). Nested `src` has its own review; nested `.git` is repository metadata, excluded. No applicable ancestor AGENTS.md was present.

## Current versus specified behavior

The manifest declares a dependency-free Rust 2024 library package. With no explicit `[lib]` path, Cargo uses `src/lib.rs`; the parent `orchestrator.rs` is not the compiled library. Both files have identical SHA-256 hashes at review time. The direct implementation stores named endpoints in a HashMap, replaces duplicate names, and retrieves immutable service information. Its one unit test only checks an endpoint after registration (`orchestrator.rs:35–40`). `.gitignore:1` appropriately excludes `/target`.

The workspace includes this package (`../../Cargo.toml:27`). The generator copies the complete component directory (`../../core/controller.py:90–95`) and selects it for logistics (`:224–232`). This establishes packaging, not runtime orchestration. `docs/EXPANDED_SAAS_FRAMEWORK.md:10` names orchestration; `docs/FINAL_VERIFICATION_REPORT.md:19` specifically claims health monitoring.

## Evidence and patch targets

**P1, inherited proven behavior gap:** `orchestrator.rs:18–23` labels every endpoint healthy without checking it; there is no update or probe API in lines 13–29. The compiled copy has the same problem. The canonical-source report, `generator--components--microservices_orchestrator--src.md`, owns detailed health remediation. Implement its unknown initial state and bounded probe/update contract in `src/lib.rs`, then reconcile this direct copy and the verification claim. Editing only the parent file would leave Cargo behavior unchanged.

**Maintenance proposal, not current functional divergence:** eliminate duplicate source ownership. Remove `orchestrator.rs` after confirming external consumers, or replace it with a documented compatibility mechanism referencing the canonical implementation. No manifest defect or source mismatch was observed. Define lifecycle requirements before adding launch/restart functionality; those details are not specified by the cited framework text.

## Dependencies and acceptance

No external crate dependencies currently exist. Monitoring would require a defined probe protocol, timeout, execution owner, and corresponding dependencies. Acceptance should verify Cargo compiles the canonical file, generated logistics packages retain the intended public API, registration cannot assert checked health, and local success/failure/timeout/recovery scenarios update state correctly.

- [ ] Resolve canonical versus legacy source ownership.
- [ ] Apply the child report's health-state remediation to canonical code and reconcile the parent source.
- [ ] Correct health-monitoring documentation and verify packaged integration.

Confidence: high for manifest/source ownership and observed behavior. Static inspection and file hashes only; no builds, tests, generation, installs, network access, or source edits performed.
