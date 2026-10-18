# Folder review: components/billing_stripe/src

## Inventory and intended behavior

The direct inventory is one fully inspected source file, `lib.rs` (54 lines): a serializable `SubscriptionPlan`, a `BillingManager`, fixed example plans, a checkout URL formatter, and two unit tests. No applicable ancestor `AGENTS.md` was found. The parent manifest supplies only `serde` and `uuid`; the crate is a generator workspace member. Controller defaults include it in finance, ecommerce, and creative-agency templates (`core/controller.py:164–176,234–235`). Source searches found no application caller of `BillingManager` outside this module and copied templates.

Generator `docs/README.md` explicitly describes the technology as “mock Stripe API,” while the expanded framework promises integrated billing and checkout (`docs/EXPANDED_SAAS_FRAMEWORK.md:14,35`) and the final report claims production implementation with no placeholders (`docs/FINAL_VERIFICATION_REPORT.md:7,41`). The module satisfies a demonstration scaffold, but payment processing and subscription management remain requirement gaps. Stack desktop and web guides establish their separate application shells; they supply no evidence that this crate is wired to either shell.

## Prioritized findings

1. **P1 — Proven production-path defect: checkout success is fabricated.** `lib.rs:20–22` returns an apparent Stripe payment URL formed from a random UUID, without creating any remote Checkout Session. The stored credential at `lib.rs:12,16–17` is never read. Consequently arbitrary customer IDs, plan IDs, and invalid credentials all produce a success string, and the returned URL cannot establish that Stripe has created a payable session. Replace `create_checkout_session` with an asynchronous fallible operation that submits an authenticated request through a provider client, maps a validated internal plan to a configured provider Price ID, and returns the provider response URL/session ID. Keep an explicit mock implementation for demonstrations rather than exposing a fabricated provider URL as real checkout.

2. **P1 — Documented requirement gap: subscriptions have no lifecycle or verified payment state.** The entire public API (`lib.rs:15–32`) contains no persisted customer/subscription mapping, reconciliation, cancellation/update capability, or verified webhook handling. A UI redirect alone would not prove payment. Specify which flows this component owns, introduce durable subscription status and event deduplication, and add a backend webhook adapter that verifies incoming events before updating entitlements. If this remains a scaffold, correct the component readiness description and generated manifest status instead of claiming complete billing.

3. **P2 — Proposed correctness improvement: plan configuration and amounts need stronger types.** `lib.rs:7,25–29` uses binary floating-point prices, hardcoded currency and demo plan IDs. This is not an observed arithmetic defect because the module performs no amount calculation. Replace it with configured provider Price IDs plus integer minor units and a validated currency representation for any local amounts; ensure the submitted plan belongs to the server-owned catalog. Direct interpolation at `lib.rs:21–22` also accepts reserved query characters; remove URL fabrication rather than treating encoding as sufficient billing implementation.

4. **P2 — Proven verification gap.** `lib.rs:39–52` tests only list length/first ID and URL substrings. The root-provided `review/generator-cargo-test.log:217–223` records both passing, but neither test detects nonexistent sessions, rejected credentials, unknown plans, provider failures, or inconsistent payment state.

## Patch targets, dependencies, and acceptance

Primary changes belong in `src/lib.rs`; dependency additions belong in the parent `Cargo.toml`. Backend routing, authenticated customer ownership, secrets configuration, durable storage, and provider event verification need explicit adapters coordinated with their owning components. Never expose provider secrets through frontend configuration.

- [ ] Define explicit mock versus live billing capability and truthful readiness metadata.
- [ ] Implement provider-backed checkout with typed errors and configured price mapping.
- [ ] Add durable subscription/event reconciliation and verified backend ingress.
- [ ] Verify mock HTTP request payloads, failures, unknown plans, duplicate events, and cross-user customer access; later perform a provider test-mode checkout lifecycle.

Confidence is high for the mock behavior and absent local lifecycle API, moderate for broader integration absence based on source searches. No source was changed, installs/network were not used, and no new tests were run; root logs were inspected only. Live provider behavior and end-to-end desktop/web integration remain unverified.
