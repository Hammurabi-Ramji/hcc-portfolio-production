# Review: components/user_analytics_posthog

Scope: all three direct files (`analytics.rs`, `Cargo.toml`, `.gitignore`); nested `src` is separately reviewed in `generator--components--user_analytics_posthog--src.md`. The embedded `.git` directory is repository metadata, excluded from source review. No applicable ancestor AGENTS.md was found. Evidence paths below are relative to `C:\IEDB\STRAW SaaS Generator`.

Inventory/current behavior: `Cargo.toml:1–7` defines a Rust 2021 library with only `serde_json`; no custom library path is declared, so Cargo builds `src/lib.rs`. `.gitignore:1` excludes `/target`. Root `analytics.rs:1–23` supplies static tracking/identification methods that print data and a no-assertion smoke test. It matches the canonical child implementation except for the child's extra import and leading spacing. Root workspace membership is present (`Cargo.toml:28`). Template defaults include this package for e-commerce, marketing, and creative agency (`core/controller.py:182,191,241`); copying at `:90–96` packages it without proving application instrumentation.

Specified versus actual: root README describes a component bundle generator, which this layout supports. However, `docs/EXPANDED_SAAS_FRAMEWORK.md:25,35` promises PostHog analytics and complete core logic; `docs/FINAL_VERIFICATION_REPORT.md:7` claims no placeholders. Both implementations only write stdout. The child report owns the P1 provider/configuration/delivery requirement gap and missing assertion coverage; these are not additional independent findings here.

**P2 proposed maintenance improvement:** `analytics.rs:1–23` duplicates executable-looking code outside Cargo's source tree. Editing or running its test through normal Cargo commands will have no effect. Patch target: remove this legacy file after confirming external consumers, or explicitly document its purpose; keep the implementation and tests in `src/lib.rs`. No manifest dependency defect is established for the current logging stub. Real delivery will require a configured sink/transport and caller wiring, as specified in the child report.

Acceptance: confirm Cargo metadata identifies `src/lib.rs`; verify generated bundles contain one authoritative implementation; follow child acceptance checks for actual event/identify delivery and failures. Confidence high from direct inspection. No source edits, builds, tests, network, or provider checks performed.

- [ ] Remove or explain the unused root duplicate and retain canonical source ownership.
- [ ] Complete child-report delivery/instrumentation work and reconcile completion claims.
- [ ] Verify Cargo target selection and generated bundle contents after changes.
