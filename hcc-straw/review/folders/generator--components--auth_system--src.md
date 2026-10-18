# Folder review: generator/components/auth_system/src

Scope: direct files in `C:\IEDB\STRAW SaaS Generator\components\auth_system\src`; reviewed all 65 numbered lines of the sole file, `lib.rs`. No applicable ancestor `AGENTS.md` was found. Read generator root/docs README, expanded framework and final verification report, Stack root README, and desktop/web output guides. Source was not edited.

## Inventory and intended behavior

`lib.rs` defines serializable subject/expiry/issued-at claims, an HMAC JWT provider, and two tests covering a round trip and malformed input. Generation creates a 24-hour token; validation explicitly selects HS256 and delegates signature/expiry checking to `jsonwebtoken`. This is a useful token primitive. Generator documentation promises user authentication, authorization, and JWT management; its production-ready claims exceed the behavior shown here. `core/controller.py:137` includes this component in every template's base stack.

## Prioritized findings and patch targets

1. **P1 — Proven configuration weakness: signing-key input is unchecked.** `lib.rs:17–18` accepts any string, including an empty or predictable secret, and `lib.rs:33,39` uses it directly as signing/verification material. A deployment that supplies a guessable key exposes all token identities to forgery. This is a missing guard, not evidence that a deployed secret is compromised. Change the constructor to return a configuration error for missing/known-placeholder/insufficient-length key material, document provisioning of at least 32 random bytes for HS256, and update callers/tests. Length validation alone cannot prove entropy.

2. **P1 — Requirement gap: token issuance is not an authentication or authorization flow.** `lib.rs:21–31` issues a token for any supplied subject, while `lib.rs:36–42` returns claims without account status, session, tenant, or permission checks. No credential verification, registration, logout/session invalidation, or authorization API exists in this direct file. A search of component Rust sources/manifests found no external use of `AuthProvider`; `api_layer_axum/src/lib.rs:7–10` exposes only root/health routes. Implement an authenticated issuance boundary and protected-route integration with a real account store, or explicitly scope this component/documentation to a JWT utility. Do not assume that making the signing method public is itself an exploit; the missing integration is the demonstrated gap.

3. **P2 — Proposed hardening and verification gap.** `lib.rs:22–30` fixes lifetime at 24 hours; claims/validation at `lib.rs:6–9,40` have no explicit issuer/audience policy or session identifier. `lib.rs:50–63` tests neither expired tokens nor wrong keys, tampering, disallowed algorithms, or blank subjects. Add configurable lifetime, subject validation, and issuer/audience isolation where applications share signing infrastructure; define revocation/session requirements before claiming logout invalidates issued tokens. These are production requirements to settle, not proven bypasses of existing signature validation.

## Dependencies and acceptance

Uses serde, jsonwebtoken 9.3, and chrono from the parent manifest; it is a workspace member (`Cargo.toml:3`). Parent `auth.rs` duplicates the implementation and should be reconciled by its owning review when public interfaces change. Account persistence, API middleware, key provisioning, and template assembly must agree on the final contract.

- [ ] Reject unsafe signing-key configuration and validate provisioning guidance.
- [ ] Connect verified credentials/accounts to issuance and exercise a protected route.
- [ ] Add negative JWT tests, explicit lifetime/isolation policy, and session invalidation checks if required.
- [ ] Update readiness claims and reconcile duplicated source.

Acceptance: valid credentials yield the intended identity; invalid/disabled accounts cannot obtain/access protected sessions; malformed, tampered, wrong-key, expired, and wrong-policy tokens fail; weak-key configuration fails clearly. Confidence is high in source observations and missing integration, moderate in production scope. No builds/tests/network actions were run by this agent; root owns workspace verification and copy comparison.
