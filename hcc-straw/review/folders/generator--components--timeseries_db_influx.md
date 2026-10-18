# Folder review: timeseries_db_influx

Scope: all direct files in `C:\IEDB\STRAW SaaS Generator\components\timeseries_db_influx`: `.gitignore`, `Cargo.toml`, and the 33-line legacy `db.rs`. Nested `.git` metadata is excluded; `src` has its own report, `generator--components--timeseries_db_influx--src.md`. No applicable ancestor AGENTS.md was found.

The manifest defines an edition-2024 library with no dependencies (`Cargo.toml:1–6`); normal Cargo discovery compiles `src/lib.rs`, not `db.rs`. SHA-256 comparison confirms the two sources are currently byte-identical. `.gitignore:1` excludes build output. Generator workspace membership is declared at root `Cargo.toml:32`; availability is registered at `core/config.json:32`, and healthcare/logistics select it (`core/controller.py:158,228`). Generation copies the entire component directory (`core/controller.py:90–95`), so both source copies are distributed.

**P1 — proven requirement gap, shared with child report:** legacy `db.rs:10–12` only logs writes; `:15–17` returns three constants for every measurement and range. Its test (`:26–31`) asserts nothing. This fails the specified high-frequency metric storage (`docs/FINAL_VERIFICATION_REPORT.md:25`) and healthcare/logistics expectations (`docs/EXPANDED_SAAS_FRAMEWORK.md:22,29`), despite production-grade claims (`FINAL_VERIFICATION_REPORT.md:7`). The child report owns canonical implementation remediation; this parent must supply actual provider dependencies and keep shipped legacy code consistent with that work.

**P2 — proposed maintenance improvement:** duplicated source permits a developer to edit `db.rs` successfully without changing Cargo behavior. No current divergence was found. Patch target: remove `db.rs` after checking external consumers, or explicitly document and enforce its derivation from canonical `src/lib.rs`; do not independently implement two clients. Update `Cargo.toml:6` for the chosen Influx transport/API and correct readiness claims until verified.

Dependencies: canonical client remediation, supported Influx version/precision decision, configuration and token injection, local provider fixture. Acceptance: Cargo and generated output use the same canonical client; write/query round trips persist points and respect range/measurement; provider/authentication/timeout errors propagate; duplicate-copy checks catch drift if retained. Confidence is high for inspected static behavior and copy equality. No builds, tests, installs, network operations, or source edits were performed.

- [ ] Add provider dependencies with canonical client remediation.
- [ ] Remove or document/enforce the legacy source copy.
- [ ] Verify generated-component behavior and correct readiness documentation.
