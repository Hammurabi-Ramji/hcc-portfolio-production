# Folder review: reporting_engine

Scope: `C:\IEDB\STRAW SaaS Generator\components\reporting_engine` direct files: `.gitignore` (one target exclusion), `Cargo.toml` (serde-only Rust 2021 package), and `reporting.rs` (33-line legacy implementation). Nested `src` and `.git` are separately owned. No applicable ancestor AGENTS.md was present. Reviewed workspace membership, controller/template copying, relevant generator requirements, Stack desktop/web guide references, and the existing `generator--components--reporting_engine--src.md` child report.

Specified versus current: `docs/README.md:26,55` promises PDF/CSV generation; Finance/Legal reporting appears in `docs/EXPANDED_SAAS_FRAMEWORK.md:23,28`. The parent manifest has no custom library path, so Cargo uses `src/lib.rs`; root workspace `Cargo.toml:12` includes this package. The direct legacy file has identical generation behavior to canonical source, but lacks its `Debug`/`PartialEq` derives and unit-test module. The desktop/web guides add no reporting integration contract in their targeted matches.

Findings and patch targets:

- **P1 requirement gap, inherited from canonical implementation:** `reporting.rs:13–18` returns a plain string labeled PDF. `reporting.rs:24–25` joins cells without CSV escaping, corrupting values containing commas, quotes or newlines. These are independently visible in the owned file and already detailed in the child report; they contradict `docs/FINAL_VERIFICATION_REPORT.md:7` claiming no placeholders. Fix the compiled `src/lib.rs` API first, adding real PDF serialization and a CSV writer; update `Cargo.toml:6–7` for selected renderer/writer dependencies. Do not patch only this legacy file.
- **P2 proposed maintenance improvement:** `reporting.rs:3` differs from canonical derives while remaining an unused parallel source. `core/controller.py:90–95` and `templates/bundle_templates.py:29–33` copy whole component directories, so recipients receive both versions. Establish canonical ownership by removing the unused legacy file after confirming no external path consumers, or generating it from canonical source with an explicit compatibility purpose. No internal Cargo path selects it.

Dependencies: coordinate with the separately reviewed canonical implementation and regeneration owners; external legacy consumers remain unknown. `.gitignore` needs no local change. Acceptance: validate generated PDF using an independent parser, round-trip CSV special/empty fields, build the package through its manifest, and check regenerated bundles contain one authoritative implementation. High confidence in direct source/manifest findings; no builds, tests, installs, or network actions were run.

- [ ] Resolve canonical PDF/CSV gaps and manifest dependencies with child owner.
- [ ] Decide and document legacy-file ownership; remove or synchronize it.
- [ ] Verify valid formats and regenerate affected component bundles.
