# Folder review: components/database_sqlite

Scope: every direct file in `C:\IEDB\STRAW SaaS Generator\components\database_sqlite`: `.gitignore`, `Cargo.toml`, and `db.rs`. Nested `.git` is repository metadata, and `src` has its separate [source review](generator--components--database_sqlite--src.md). No applicable ancestor AGENTS.md was found.

## Current and expected behavior

`.gitignore:1` excludes `/target`. `Cargo.toml:1-7` defines a Rust 2021 library with bundled rusqlite 0.31; the root workspace includes it at `Cargo.toml:7`. With no custom library path, Cargo owns `src/lib.rs`, not direct `db.rs`. The latter opens a database, explicitly creates a users table, and inserts parameterized username/email values, propagating SQLite errors (`db.rs:8-30`). This is a valid small persistence primitive. The active source also supplies memory construction, row count, and a happy-path test.

Generator `README.md:3,28-29` describes assembling copied components; `docs/README.md:48` specifies local persistence and `docs/EXPANDED_SAAS_FRAMEWORK.md:11` describes a primary SQL layer. Those expectations exceed evidence for a fully integrated application: API routes only return static strings (`api_layer_axum/src/lib.rs:7-10`) and user management returns a fixed profile (`user_management/src/lib.rs:14-24`); neither consumer manifest depends on this crate. Web guide `output/WEB_PLATFORM_SUMMARY.md:148` instead names PostgreSQL/Redis. These are cross-component requirements, not proof that this SQLite primitive is broken.

## Findings and diff/patch targets

- **P3 — ambiguous duplicate source, proven maintenance issue.** Direct `db.rs:1-32` duplicates the active implementation but omits active APIs. Editing it will not affect the Cargo library. Whole-directory copying (`core/controller.py:90-95`; `templates/bundle_templates.py:33`) also propagates it. Remove `db.rs` after checking external path-based consumers, or replace it with an explicitly documented example importing the crate. Keep `src/lib.rs` canonical; do not repoint the manifest at the shorter legacy source. No direct-file runtime defect was found.
- **Integration requirement gap:** persistence consumers, record retrieval, and upgrade policy belong to the child/consumer reports. The production-ready assertions in `docs/FINAL_VERIFICATION_REPORT.md:7,41` are not established by this manifest and primitive.

Dependencies: generator/template copy ownership and consumer data models. Acceptance: Cargo retains the active memory/count APIs after cleanup; generated bundles contain one documented implementation; an eventual consumer integration persists and reads a record across restart. No builds, installs, network, or copy-comparison checks were run; root owns broad validation. Confidence: high for direct-file inventory and manifest ownership.

- [ ] Resolve the unused direct `db.rs` duplicate and document canonical source ownership.
- [ ] Coordinate persistence integration with child/consumer tasks before asserting application readiness.
