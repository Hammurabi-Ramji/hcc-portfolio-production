# Folder review: data_pipeline_etl/src

Scope: `C:\IEDB\STRAW SaaS Generator\components\data_pipeline_etl\src`; direct file `lib.rs` (35 lines), reviewed completely with numbered lines. No applicable ancestor AGENTS.md was found. The containing Cargo manifest declares a Rust 2024 library with no dependencies; the workspace includes it. Its public API exposes static extract, uppercase transform, load, and run methods plus one unit test.

The expanded framework promises ETL for marketing and legal templates (`docs/EXPANDED_SAAS_FRAMEWORK.md:25,28`), and the controller selects this component for both (`core/controller.py:194,222`). Needed behavior is a configured, observable transfer of actual source records into a persistent target, with errors distinguishable from completion. The root README describes starter bundles; the final verification report's universal production-ready claim is not supported by this component.

## Findings and patch targets

- **P1 — Requirement gap: extraction and loading are demonstrations, not an ETL implementation.** `lib.rs:4-6` ignores the source except for printing and always returns two fabricated rows. `lib.rs:13-15` only prints a row count and never writes records anywhere. Consequently `run` (`17-20`) completes even for nonexistent sources or unreachable targets, with no imported data. Replace extract/load with explicit source and sink interfaces, initially backed by a real local CSV/SQLite path appropriate to the desktop-first framework. Use structured records rather than applying unconditional uppercase to entire strings (`9-10`), and make transformations configurable so identifiers and case-sensitive values are preserved. Document this as a demo until adapters exist.
- **P2 — Missing failure contract and verification.** All operations return plain values or unit (`4,13,17`); callers cannot observe read, transform, or persistence failures. The sole test (`29-33`) asserts only the first synthetic uppercase row, then calls a load that has no observable result. Change I/O methods and run to `Result` with stage/context errors and a run summary; test persisted output and both source/sink failure paths. This is a required production capability, not evidence of a current exception-handling bug in the print-only demo.

Dependencies: coordinate adapters with database/warehouse components and generated application composition; add dependencies only after choosing the supported source/target format. Preserve the small pure transform API if explicitly retained as an example.

## Acceptance and confidence

- [ ] Import known fixture records and verify exact persisted values after reopening the target.
- [ ] Invalid source and failed target return stage-specific errors without reporting success.
- [ ] Verify empty input, Unicode/case preservation, and repeated runs under a documented duplicate policy.
- [ ] Run component tests and regenerate marketing/legal bundles after implementation.

High confidence in static findings. No source was edited, installs/network were not used, and no tests were run by this reviewer; root-level checks are handled separately. Runtime integration and persistence remain unverified.
