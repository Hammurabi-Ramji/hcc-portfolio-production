# Folder review: data_warehouse_connector

Scope: direct files in `C:\IEDB\STRAW SaaS Generator\components\data_warehouse_connector`. Fully inspected `.gitignore` (1 line), `Cargo.toml` (6 lines), and legacy `warehouse.rs` (36 lines). Hidden `.git/` exists; its contents were excluded. Nested `src/` is separately reviewed in `generator--components--data_warehouse_connector--src.md`. No applicable ancestor AGENTS.md was found.

## Ownership and requirements

`Cargo.toml:1-6` declares an edition-2024 library package with no dependencies or custom library path. Cargo therefore compiles `src/lib.rs`, not direct `warehouse.rs`. Root `Cargo.toml:33` includes this package; `core/config.json:29` makes it selectable. The direct implementation matches the canonical implementation except `warehouse.rs:8` keeps `w_type` private whereas `src/lib.rs:8` makes it public. Direct tests at `warehouse.rs:26-36` are consequently not executed by ordinary crate tests.

Root `README.md:3,26-29` accurately describes starter bundles containing copied component folders. `docs/README.md:116,122` promises bundled Rust source and invites component edits without explaining duplicate ownership. `docs/EXPANDED_SAAS_FRAMEWORK.md:11` promises analytics warehouses; `docs/FINAL_VERIFICATION_REPORT.md:7,26` claims implemented Snowflake, BigQuery, and Redshift connectors. Targeted Stack desktop/web output guides supply no additional warehouse contract.

## Findings and patch targets

- **P1 — Requirement gap, confirmed in both copies:** `warehouse.rs:12-22` stores only a provider enum and formats an execution-looking string. There is no connection configuration, authenticated request, returned data, or failure path. Its test at lines 31-34 checks only a provider name. This repeats the canonical-source report's connector finding; fixing this direct file alone cannot fix the compiled package. Patch `src/lib.rs` and coordinate dependencies at `Cargo.toml:6` for provider clients, async operation, validated configuration, typed results/errors, and transport tests; until implemented, report an explicit unavailable error. Correct the verification claim.
- **P2 — Duplicate source ownership creates ineffective edits:** Direct `warehouse.rs:1-36` is shipped beside the actual library and already differs in public API at line 8. A contributor following the general customization guidance can edit this file successfully without affecting Cargo output. Remove/archive the legacy copy from distributed content, or deliberately make it canonical through an explicit library path and eliminate the second implementation. Document the selected source path; this is a maintenance/build-ownership defect rather than a second runtime connector defect.
- **P2 — Packaging boundary includes repository metadata:** This component contains a hidden `.git/` directory, while `core/controller.py:94-95` and `templates/bundle_templates.py:32-33` recursively copy component directories without filters. Generation therefore includes nested repository metadata along with both sources. `.gitignore:1` excludes only `/target` from Git and does not filter Python copying. Patch those copy sites with an explicit distribution filter for `.git`, build output, and caches; do not delete the working repository metadata as remediation.

## Acceptance and confidence

Acceptance: Cargo and generated consumers compile the documented single source; changing its query implementation changes consumer behavior; generated bundles omit nested `.git` and build output; each advertised provider returns verified rows or an explicit unavailable error. Dependency additions require a provider configuration/secret boundary and runtime consumer contract. Confidence is high for static ownership and copy behavior. No builds, tests, installation, network, or source edits were performed; live provider behavior remains unverified.

- [ ] Resolve duplicate source ownership and document the canonical path.
- [ ] Filter repository/build metadata at both packaging entrypoints.
- [ ] Implement or explicitly disable adapters in canonical source; align manifest and claims.
- [ ] Verify generated-consumer compilation and provider transport/error acceptance.
