# Folder review: dashboard_analytics

Scope: direct files in `C:\IEDB\STRAW SaaS Generator\components\dashboard_analytics`; child `src` is separately reviewed.

## Existing and expected behavior

All three direct files were inspected with numbered lines: `.gitignore` excludes `/target`; `Cargo.toml:1-8` defines the Rust 2021 library package with Serde derive and Chrono; `analytics.rs:1-36` defines serializable metrics, timestamped in-memory tracking, and per-name sums. No applicable ancestor `AGENTS.md` was found. The workspace owns this package at root `Cargo.toml:5`. Because this manifest has no `[lib]` override, Cargo compiles `src/lib.rs`, not direct `analytics.rs`.

`docs/README.md:46` specifies tracking and summarization, which the implementation supplies. Its dashboard description at line 17 and production claims in `docs/FINAL_VERIFICATION_REPORT.md:3-7,41` exceed evidence for this small accumulator. Root README describes starter bundles. `core/controller.py:95` copies whole component folders, so both source versions reach generated bundles.

## Findings and patch targets

**P3 — Duplicate source ownership is ambiguous (maintenance issue).** `analytics.rs:4` derives only Serialize/Deserialize; canonical `src/lib.rs:4` additionally derives Debug/Clone, and its lines 38-53 contain the unit test absent from the direct file. Runtime tracking and summary bodies match. A developer following `docs/README.md:122` could edit the visible direct Rust file without changing the compiled library. Proposed diff: remove obsolete `analytics.rs` after checking external/manual consumers, and add a short component README identifying `src/lib.rs` as the public implementation; alternatively explicitly label the direct file as an archived example. Do not point Cargo to the older file merely to eliminate ambiguity.

No independent manifest defect was found. Numeric validation, unbounded retention, and missing dashboard integration belong to the canonical review at `review/folders/generator--components--dashboard_analytics--src.md`; this report does not duplicate those findings.

## Dependencies and acceptance

Cleanup depends on generator copy behavior and any external example consumers. Acceptance: package metadata still resolves the library to `src/lib.rs`; generated bundles document one authoritative source; existing weighted-sum test still passes. High confidence from static comparison; no builds, tests, installs, or network calls executed.

- [ ] Establish and document canonical source ownership.
- [ ] Remove or explicitly archive duplicate `analytics.rs` after consumer check.
- [ ] Verify package resolution and generated bundle contents following cleanup.
