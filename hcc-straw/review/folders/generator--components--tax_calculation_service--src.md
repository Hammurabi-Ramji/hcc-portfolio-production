# Review: tax_calculation_service/src (index 30)

Inventory: one 33-line `lib.rs`, inspected completely; no nested sources. No applicable ancestor AGENTS.md was found. Its dependency-free edition-2024 crate exposes two multiplications using three country codes and two state codes, with one two-example test.

Actual versus promised: this is a lookup helper. `docs/EXPANDED_SAAS_FRAMEWORK.md:14,23` advertises billing/tax services; `docs/FINAL_VERIFICATION_REPORT.md:7,41` claims production-grade completion. The root README describes copied starter bundles. Controller defaults select this crate for finance/ecommerce (`core/controller.py:169,179`), but copying at lines 90–96 does not establish runtime integration. Searches of billing, controller, and desktop Rust found no `TaxService` callers; relevant desktop/web output guides provide no tax integration contract. Constants' legal correctness/currency was not assessed.

Prioritized findings and patches:

- **P1 — unsupported jurisdiction silently succeeds:** `lib.rs:5–11,15–20` maps unknown identifiers to zero. `"DE "` produces an indistinguishable successful zero calculation. Return `Result<TaxQuote, TaxError>` with explicit unsupported-jurisdiction errors; normalize according to a documented contract and distinguish configured zero rates.
- **P2 — unrestricted numeric domain:** `lib.rs:4,11,14,20` accepts NaN/infinity and propagates them; negatives pass without a sale/refund policy. Validate finite inputs, define signed-refund handling, and reject result overflow.
- **P2 — money contract gap:** those lines use binary floating-point multiplication without currency, rounding policy, or minor-unit output. Fractional cents are returned, leaving invoice totals undefined. Replace money with checked integer minor units and rational rates, or add a decimal crate; round once using an explicit policy. Configurable/versioned rate data and quote provenance are proposed enhancements.

Dependencies: coordinate signature changes with billing/API consumers and generated-template wiring; integer arithmetic requires no added crate. Confidence is high for direct logic; no tests/builds were run and runtime integration is unverified.

- [ ] Extend `lib.rs:29–31` with unsupported/normalized identifier, nonfinite, overflow, refund, and rounding-boundary cases.
- [ ] Verify configured-zero versus unsupported behavior and deterministic minor-unit totals.
- [ ] Wire one generated checkout consumer; verify calculation errors reach its caller.
