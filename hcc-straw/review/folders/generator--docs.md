# Review: generator/docs

Scope: all five direct Markdown files were fully inspected with numbered lines: `README.md`, `EXPANDED_SAAS_FRAMEWORK.md`, `FINAL_VERIFICATION_REPORT.md`, `GENERATED_TEMPLATES.md`, and `TEST_REPORT.md`. No applicable ancestor AGENTS.md was found. Integration evidence came from the generator root README, controller/config/manifests, Stack desktop/web guides, saved component reviews, and parent verification artifacts. Only this report was written; no production edits, installs, network, or checks were run.

## Existing content and intended contract

The folder contains a user guide and May 23–24, 2026 expansion, generation, verification, and test snapshots. The current root `README.md:3,11,26–35` establishes a source-bundle starter that permits placeholders and requires component integration. Therefore missing runnable application scaffolding is a limitation to disclose, not automatically a defect against an older full-stack vision. Nine configured industries remain accurate (`core/config.json:50–59`); the current version is 1.3.0 (`:3`) and there are 43 configured components (`:5–48`). The older 1.1.0 and twelve-component results may remain historical facts if explicitly identified as snapshots.

## Findings and concrete patch targets

1. **P1 — Unsupported completion promises.** `FINAL_VERIFICATION_REPORT.md:3,7,21–33,41–44` claims no placeholders, production provider integrations, and universal completion. `EXPANDED_SAAS_FRAMEWORK.md:3,7–14,35,40–45` similarly conflates feature aspirations with implemented capabilities. Patch both introductions/status blocks with dated historical-claim labels and a link to current evidence; add a present capability matrix distinguishing local implementations, mocks/logging demonstrations, shells, and unavailable components. Preserve historical version/date instead of silently presenting new measurements as May results. Component reports establish fake checkout (`billing_stripe/src/lib.rs:20–22`), nontransmitting S3 (`object_storage_s3/src/lib.rs:10–15`), and logging/constant Influx results (`timeseries_db_influx/src/lib.rs:10–17`). These contradict provider readiness directly. Do not require implementing every older aspiration merely to repair the documentation.

2. **P1 — Test evidence overstates coverage and delivery.** `TEST_REPORT.md:4,13,15–16,21,24,29` elevates small unit tests into comprehensive verification, notification delivery/MFA verification, and “100% Core Logic.” `FINAL_VERIFICATION_REPORT.md:36–37` claims every Rust component is workspace-tested. Replace present conclusions with scoped evidence: the parent's `review/generator-cargo-test.log` records 35 passing tests across 32 workspace crates, not a coverage percentage or provider/application acceptance. `Cargo.toml:2–35` excludes no-code; its source review records missing packaging and static compilation defects. Tests of mocked PDF/checkout or unconditional notification success must be named as demonstration tests. Add command/date/package scope and explicit unchecked integration criteria.

3. **P2 — User instructions no longer match the CLI.** `README.md:65–79` says no-argument execution generates healthcare and requires editing Python to choose a template; current `core/controller.py:289–318` prints help without generation and supports `--template`, `--components`, and `--all`. Replace examples with repository-relative CLI commands and explain explicit all-template generation. `README.md:97–100` suggests arbitrary `my_custom_saas`, but `controller.py:48–53` rejects unconfigured names even with component overrides: use an existing configured template or document registration. Replace obsolete absolute checkout paths at `README.md:68` and `GENERATED_TEMPLATES.md:25,41`.

4. **P2 — Bundle topology and readiness need qualification.** `GENERATED_TEMPLATES.md:7,13–21,25–35` accurately describes the legacy bundler's smaller `templates/` sets; distinguish these from controller `output/<name>/src/` bundles instead of treating the table as current controller defaults. Parent `review/copy-comparison.log:3–8` finds 18 saved bundles, no application entrypoints, and eleven cosmetic Axum-copy differences. Document manual application assembly and that saved copies can drift. Explain the known manifest limitation: placeholders count as included and still receive `ready_to_build` (`controller.py:94–116`; saved controller probes), pending the core fix.

## Dependencies and acceptance

Coordinate capability labels with component owners and readiness semantics with core; retain snapshot provenance. High confidence in contradictions and CLI behavior; historical execution cannot be independently reconstructed.

- [ ] Mark historical reports and replace unsupported current readiness/coverage promises.
- [ ] Align CLI examples, configured-name constraints, paths, and both bundle layouts.
- [ ] Publish capability/test scope tied to saved evidence and core readiness correction.
- [ ] Verify documented commands in isolated fixtures and require separate provider/generated-application acceptance before future completion claims.
