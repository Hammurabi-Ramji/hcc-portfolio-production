# Email template source review

Scope: `C:\IEDB\STRAW SaaS Generator\components\email_template_system\src` (index 15). The only direct file is the 39-line `lib.rs`: an `EmailTemplate` with subject/HTML fields, two static rendering functions, and one welcome-string test. Parent `Cargo.toml` defines a Rust 2024 library without dependencies. No applicable ancestor `AGENTS.md` was found.

The generator README describes reusable starter bundles; `docs/README.md` describes desktop-first STRAW applications. `docs/EXPANDED_SAAS_FRAMEWORK.md:25` advertises email templates for marketing, and `core/controller.py:186-202` includes this component in marketing and education bundles. Stack output guides contain no specific email-rendering contract. `docs/FINAL_VERIFICATION_REPORT.md:7,41` claims production completeness, which the source does not substantiate. Needed baseline behavior is safe, predictable HTML generation for welcome and reset messages.

## Findings and concrete patch targets

- **P1 — Proven HTML injection:** `lib.rs:12-15` interpolates `user_name` directly into HTML text. A name containing markup can replace greeting content or introduce misleading links/images into the email. Escape text-context characters before interpolation. Preserve legitimate Unicode names. This is an email content-integrity issue; script execution depends on the receiving client's filtering.
- **P1 — Proven reset-link attribute injection:** `lib.rs:22-24` inserts an arbitrary string into a single-quoted `href`. A quote closes the attribute, allowing additional markup; unsafe schemes are also accepted. Change `password_reset` to return a typed rendering error, parse and validate an absolute URL against the application's configured scheme/origin policy, then HTML-attribute escape the accepted URL. URL validation and escaping solve different problems. Coordinate signature changes with future callers; no callers were found in inspected generator core/templates/docs.
- **P2 — Validation gap:** `lib.rs:34-37` checks only a normal welcome name. Add tests for markup-bearing names, quote-bearing links, encoded query parameters, Unicode, disallowed schemes/origins, malformed URLs, and successful reset rendering. Existing coverage cannot support the production-ready assertion.

A plain-text alternative, branding configuration, and campaign templates are proposed enhancements, not explicit requirements established by the inspected documentation. Delivery integration is separate: the adjacent notification manager merely prints messages (`notification_system/src/lib.rs:11-17`), so rendering must not be represented as sent-email capability.

## Dependencies and acceptance

Choose either a small reviewed escaping helper or an HTML-escaping dependency; URL validation needs a parser and application-origin configuration. The sibling `templates.rs` appears to duplicate the implementation and should be checked by its owning folder reviewer when applying fixes. Acceptance: hostile values render only as text, rejected links produce errors, approved links retain their correct decoded destination, and both templates pass focused unit tests. Confidence is high from complete numbered source inspection; no builds, tests, installs, network actions, or delivery-client checks were run here.

- [ ] Escape welcome names and reset attributes.
- [ ] Validate reset URLs and propagate rendering errors.
- [ ] Add adversarial and valid-link regression tests.
- [ ] Coordinate duplicated source and caller integration.
