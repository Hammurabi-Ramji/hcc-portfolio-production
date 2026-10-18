# monitoring_prometheus parent folder review

Scope: all three direct files: `.gitignore`, `Cargo.toml`, and the 42-line legacy `metrics.rs`. Nested `src/` has its own review; `.git/` is repository metadata. No applicable ancestor AGENTS.md was found. Evidence paths below are relative to `C:\IEDB\STRAW SaaS Generator`.

**Current versus specified:** `.gitignore:1` excludes Cargo build output. `Cargo.toml:1–6` defines an edition-2024, dependency-free library package. Cargo's default library entry is `src/lib.rs`; the manifest contains no override importing `metrics.rs`. The legacy file implements in-memory counters and text export with one test. SHA-256 comparison confirms it is currently byte-identical to `src/lib.rs`. Root workspace membership (`Cargo.toml:20`) and healthcare selection (`core/controller.py:153–161`) are present. This meets basic metric collection/export intent (`docs/FINAL_VERIFICATION_REPORT.md:31`), but source evidence does not establish the full-stack observability claim (`docs/EXPANDED_SAAS_FRAMEWORK.md:13`). Root README:3,26–29 accurately describes component bundle copying.

**P2 — inherited exporter defect:** `metrics.rs:12–14,24` accepts names containing spaces/newlines and interpolates them unchanged into exposition. The same issue exists in the compiled canonical source; ownership and remediation are detailed in `generator--components--monitoring_prometheus--src.md`. Patch canonical name registration/validation first, with explicit failure before state changes; do not fix only this inactive legacy file.

**P3 — maintenance proposal:** The uncompiled duplicate has no independent caller in inspected core/templates. `core/controller.py:90–95` nevertheless copies the whole folder, shipping both versions. There is no current divergence or proven duplicate compilation bug. Prefer removing `metrics.rs` after confirming external consumers, or document it as generated from canonical source and enforce equality. A parent-folder diff should retain the small manifest and ignore rule; no dependency addition is needed for duplicate cleanup.

Dependencies: Rust toolchain supporting edition 2024; generator copy policy and application/router owners for scrape integration. Acceptance: package still resolves `src/lib.rs`, selected generated bundle imports that crate, invalid names are rejected, and any retained legacy copy stays equal. Runtime instrumentation/scrape-route acceptance belongs to the child report.

- [ ] Fix canonical exporter name validation and test rejection cases.
- [ ] Decide/remove or document the legacy source copy; verify generated consumers.

Confidence: high for direct inventory, equality, and manifest ownership. Static inspection only; no source edits, installs, network, builds, or tests performed.
