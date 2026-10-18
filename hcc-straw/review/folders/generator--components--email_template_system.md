# Email template package review (index 58)

Scope: direct files in `C:\IEDB\STRAW SaaS Generator\components\email_template_system`. Inventory: `Cargo.toml` (six lines), `.gitignore` (`/target`), legacy `templates.rs` (39 lines), nested canonical `src/`, and an embedded non-bare `.git` repository on `main`. No applicable ancestor/folder AGENTS.md was found. Git metadata inspection was limited to structure, HEAD and core configuration; no history or credentials were read.

## Current versus specified

`Cargo.toml:1-6` defines dependency-free Rust 2024 package `email_template_system`; the generator workspace includes it at root `Cargo.toml:34`. With no explicit library path, Cargo compiles `src/lib.rs`, not direct `templates.rs`. Both files have identical SHA-256 hashes in this review, including the single normal-name test. The canonical source review is `generator--components--email_template_system--src.md`; its findings remain applicable to the legacy copy.

Root README:3,26-29 describes copied starter bundles. `docs/EXPANDED_SAAS_FRAMEWORK.md:25` advertises marketing email templates; `core/controller.py:192,201,238` selects this package for marketing, education and travel. Current functionality supplies fixed welcome/reset subjects and HTML, without delivery or campaign customization. Output desktop/web guides establish no additional rendering contract. `docs/FINAL_VERIFICATION_REPORT.md:7,41` overstates production completeness given the unsafe interpolation below.

## Findings and patch targets

- **P1, proven rendering defects shared with canonical source:** `templates.rs:12-15` interpolates names into HTML; `:22-24` interpolates reset URLs into a single-quoted attribute without escaping or URL validation. Coordinate the existing source-review remediation: escape text/attributes, validate reset URL policy and propagate typed errors. Fixing only this legacy file would leave compiled behavior unchanged. Prefer making `src/lib.rs` authoritative and removing or documenting the legacy copy after confirming external consumers; none were found in inspected core/templates.
- **P2, proven packaging behavior:** the embedded `.git` exists, while `core/controller.py:90-95` copies the entire component with no ignore filter. Generated bundles therefore inherit this component's repository metadata as well as duplicate source. Add an explicit generated-artifact exclusion for `.git` (and build caches) in the controller; preserve the original repository. This is packaging hygiene and potentially unnecessary history distribution, not evidence that secrets exist.

## Dependencies, acceptance and confidence

Rendering changes depend on a reviewed escaping implementation and URL parser/application URL policy; update Cargo dependencies only if selected helpers require them. No manifest-specific build defect was identified. High confidence in direct-file inventory, source equality and copy behavior; no builds, tests, installs, network requests or output generation were run.

- [ ] Resolve canonical/legacy ownership while applying source-review injection fixes.
- [ ] Exclude `.git` from generated component copies.
- [ ] Verify hostile/Unicode names and malformed/quote-bearing/approved reset URLs with focused package tests.
- [ ] Generate a temporary selected bundle and verify canonical source is included, repository metadata is absent, and the copied package builds.
