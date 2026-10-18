# Folder review: error_tracking_sentry/src

Scope: `C:\IEDB\STRAW SaaS Generator\components\error_tracking_sentry\src`; direct files only. Inventory: one 21-line `lib.rs` defining a zero-state `SentryTracker`, two static capture functions, and one unit test. No applicable AGENTS.md was found in the checked ancestors. The parent manifest has no dependencies; the workspace includes this crate and the generator registers the component (`core/controller.py:148`, `core/config.json:40`). Targeted searches found no `SentryTracker` caller in generator core/templates or desktop Rust sources.

Expected behavior: the expanded framework promises Sentry error tracking (`docs/EXPANDED_SAAS_FRAMEWORK.md:13`), and the verification report describes it as integrated (`docs/FINAL_VERIFICATION_REPORT.md:32`). A usable component therefore needs initialization/configuration, actual event capture, and documented delivery/lifecycle behavior. Root README describes a component bundler; merely copying this crate does not create application integration. Stack desktop/web guides establish separate host applications, so initialization belongs in the consuming host when this feature is selected.

## Findings and concrete targets

- **P1 — Proven capability gap:** `lib.rs:4-9` only calls `println!`; errors and messages never reach Sentry or any persistent event store. The `[SENTRY] Captured` label falsely implies collection. There is no DSN/client, event serialization, severity, or shutdown flush. Replace these methods with an explicit configured tracker using a supported Sentry transport, retain its client guard, and return an event identifier or clear disabled/error status. Add the necessary dependency/configuration contract in the parent manifest and initialize the tracker in generated application startup. Until implemented, mark this component as a stub in capability/verification documentation.
- **P2 — Proven validation gap:** `lib.rs:18-20` invokes a method without asserting anything. This test passes when capture silently does nothing, so it cannot substantiate integrated tracking. Replace it with deterministic capture assertions through an injectable test transport; cover exception and message payloads plus disabled/unconfigured behavior.
- **Proposed hardening:** raw input is printed at `lib.rs:5,9`; add payload redaction/filtering and explicit opt-in remote delivery before hosts submit potentially sensitive error context. No actual secret exposure was demonstrated.

Dependencies: SDK/transport selection, host startup/shutdown ownership, generator capability metadata, and documented local-first/offline behavior.

## Acceptance tasks

- [ ] Replace stdout-only capture or label the feature unavailable.
- [ ] Verify one exception and one message produce inspectable events using a local fake transport.
- [ ] Verify missing configuration, redaction, and shutdown handling without external network calls.
- [ ] Verify a generated host initializes and retains the tracker when selected.

Confidence: high for source findings, moderate for host integration because only targeted callers were searched. This review ran no builds, tests, installs, or network requests; root verification remains separate.
