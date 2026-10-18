# Review 029 — security_zero_trust/src

Scope: sole direct file `lib.rs`, manifest/workspace, caller searches and documentation. No applicable ancestor AGENTS.md found.

**Actual versus promised behavior.** `AccessPolicy` and `ZeroTrustGuard` provide an in-memory, exact-resource, single-role predicate. Unknown resources default to deny (`components/security_zero_trust/src/lib.rs:23–33`); required MFA blocks a false input. One test covers three role/MFA cases (`:42–57`). This supports `docs/README.md:57` narrowly as policy evaluation. It does not establish authenticated identities, perform MFA verification, or protect requests automatically. The generator copies component folders (`core/controller.py:90–96`); symbol searches found definitions/tests and template copies, no application call sites. Thus the broad production-complete claims (`docs/FINAL_VERIFICATION_REPORT.md:7,41`) exceed evidence for integrated enforcement. This is an integration gap, not a demonstrated bypass: trusted callers supplying roles/booleans is not itself a vulnerability.

**P2 — duplicate policy ambiguity (proven behavior; proposed API hardening).** `add_policy` always appends (`lib.rs:19–20`), while lookup selects only the first matching resource (`:24`). Adding an MFA-required policy after a permissive policy silently leaves access allowed without MFA; reversing order can deny otherwise intended access. No update contract is documented; this is a configuration hazard, not a proven replacement-contract violation. Patch these locations to reject duplicate resources with a typed error, or provide explicitly named replacement semantics using a resource-keyed map. This needs only standard-library collections, preserving serde.

Acceptance should cover empty/unknown resources, empty roles, MFA-optional policies, and duplicate rejection/replacement. Integration requires an authenticated-session adapter supplying verified roles and MFA state and applying the guard before protected operations; tests should exercise allow/deny through that boundary. Do not claim full zero-trust delivery until that caller exists.

Confidence: high for source behavior, limited for intended policy lifecycle. No tests/builds or deployment checks were run in this review.

- [ ] Define and implement duplicate-resource semantics.
- [ ] Add policy boundary and duplicate-policy tests.
- [ ] Wire verified session context into protected operations and test enforcement.
- [ ] Align documentation with predicate-only capability until integration is verified.

