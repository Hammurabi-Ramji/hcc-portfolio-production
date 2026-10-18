# Folder review: dashboard_analytics/src

Scope: `C:\IEDB\STRAW SaaS Generator\components\dashboard_analytics\src` (direct files only).

## Inventory and intended behavior

The only direct file is `lib.rs` (53 lines): a serializable `Metric`, an in-memory `AnalyticsEngine`, weighted per-name totals, and one unit test. The parent Cargo manifest supplies Serde and Chrono; the workspace includes this crate. No applicable ancestor `AGENTS.md` was found. Generator configuration and controller select this component for finance, marketing, real-estate, and logistics bundles.

`docs/README.md:46` accurately describes metric tracking and summarization. Its visualization description at line 17 and `docs/EXPANDED_SAAS_FRAMEWORK.md:23,35` imply broader analytics capability than this file demonstrates. Root README describes starter bundles rather than integrated applications. This implementation satisfies a minimal process-local sum accumulator; it does not substantiate production-grade dashboard or advanced analytics claims.

## Findings and concrete patch targets

1. **P2 — Non-finite values poison summaries (proven behavior; hardening gap).** `lib.rs:20-25` accepts every `f64`; `lib.rs:30-32` adds values without validation. Tracking `NaN` makes that metric's subsequent total permanently `NaN`; infinity and finite overflow also yield non-finite totals. For reporting/dashboard consumers these cease to be usable numeric results. Change `track` to return a typed error for non-finite inputs and define an overflow policy during aggregation. Add tests showing rejected inputs do not mutate existing totals. Whether negative values are valid must remain an explicit metric contract, not an assumed restriction.

2. **P2 — Unbounded event retention (production limitation).** `lib.rs:12,21` retain every event indefinitely, while `lib.rs:28-33` clone names and rescan all historical events for every summary. There is no expiry, reset, or capacity control. For the currently exposed lifetime totals, replace the vector with incremental totals to bound storage by distinct names; if event history is needed, add a bounded store and time-window API instead. Preserve documented sum semantics. This is a long-running-service risk, not evidence of an observed exhaustion failure.

3. **Requirement gap — No temporal query or connected dashboard.** Timestamps are recorded at `lib.rs:24` but never exposed or used. Searches found component copies, configuration references, and tests, without a non-test `AnalyticsEngine` consumer. Decide whether this is only a reusable accumulator; document that scope, or add a snapshot/window interface and connect an API/UI consumer in separately owned folders. Persistence and tenant separation likewise require an application-level contract before implementation.

## Dependencies, acceptance, confidence

Changes depend on parent manifest/error conventions and downstream consumers adopting any fallible API. Root's saved `review/generator-cargo-test.log:239-242` shows the existing positive weighted-sum test passing; that test covers no bounds or invalid values. Acceptance: empty summary, repeated names, independent names, rejected non-finite values, chosen overflow policy, and bounded long-run storage. Verify window boundaries only if temporal querying is added. High confidence in static behavior; no commands executing builds/tests, network, or installs were run by this reviewer.

- [ ] Define numeric and retention contracts.
- [ ] Add validation and bounded/incremental accumulation.
- [ ] Add contract-focused tests and document integration scope.
