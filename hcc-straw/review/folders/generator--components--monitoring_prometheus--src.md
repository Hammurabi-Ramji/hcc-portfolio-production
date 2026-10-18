# monitoring_prometheus/src review

Scope: the sole direct file, `src/lib.rs` (42 lines); component/workspace manifests, controller selection, and relevant documentation inspected. No applicable ancestor AGENTS.md was found. Paths below are relative to `C:\IEDB\STRAW SaaS Generator`.

**Exists versus required:** A dependency-free Rust counter collection uses a HashMap, increments counters, returns zero for missing names, and emits `name_total value` lines. Workspace membership is present (`Cargo.toml:20`); healthcare selects it (`core/controller.py:153–161`). This supports basic collection/export promised by `docs/FINAL_VERIFICATION_REPORT.md:31`, but does not establish the full-stack observability claimed in `docs/EXPANDED_SAAS_FRAMEWORK.md:13` or production readiness (`FINAL_VERIFICATION_REPORT.md:7,41`).

**P2 — malformed exposition accepted (proven):** `src/lib.rs:12–14` accepts any string; `:24` interpolates it unchanged into the metric name. `increment("http requests")` emits `http requests_total 1`, and newline input creates extra exposition lines. Empty names and leading digits likewise receive no validation. Patch `:12–14` to validate/register names and return a typed error before changing state; preserve compatible names and use an explicit naming convention. Add exact-output assertions for valid counters and rejection tests for whitespace/newline/invalid initial characters.

**P2 — runtime integration requirement gap:** `src/lib.rs:3–27` contains no scrape handler, shared application registry, request instrumentation, or service lifecycle integration. Caller searches in core/templates found selection only. Patch the API/application assembly to retain one registry, increment actual request counters, and expose the exporter with the correct metrics content type. Depend on the owning runtime/router and choose synchronization appropriate to concurrent handlers. Acceptance: healthcare output builds, a real request increments the counter, and a local scrape retrieves it.

**P3 — coverage and overflow hardening:** The sole test (`:35–40`) checks two increments and a substring. It cannot establish parser validity, empty/multiple-counter behavior, or overflow. `:14` can panic in checked builds or wrap at u64 maximum. Define an overflow policy and test its boundary; compare parsed/exact samples rather than one substring.

- [ ] Validate metric names and strengthen exporter tests.
- [ ] Wire registry, instrumentation, and scrape route into generated runtime.
- [ ] Define/test overflow behavior and correct readiness claims.

Confidence: high for source findings; runtime integration needs generated-application verification. No tests were rerun; parent reports 35 passing generator tests, which do not resolve these coverage gaps. No sources changed.
