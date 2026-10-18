# Review 080 — components/user_management

Reviewed all direct files: `.gitignore` (1 line), `Cargo.toml` (7), and legacy `user.rs` (26). No applicable ancestor AGENTS.md was found. Nested `src` is separately owned; its completed report is `generator--components--user_management--src.md` (review 034). Embedded `.git` is repository metadata, excluded from source review.

## Current versus specified

`docs/README.md:53` promises user profiles, roles, and status updates. The root README describes modular generation; `docs/FINAL_VERIFICATION_REPORT.md:7` claims no placeholders. Both legacy and canonical sources instead fabricate John Doe/Admin/Active for every supplied ID (`user.rs:14–20`; `src/lib.rs:14–20`). Neither implements storage, role changes, validation, or unknown-user handling. These functional gaps and their remediation belong to review 034; there is no evidence here that the desktop/web application actually authorizes requests using these fabricated roles.

## Direct-file findings and patch targets

- **P2 — duplicate source has a divergent API.** `Cargo.toml:1–7` defines a normal library package with no custom library path, so Cargo compiles `src/lib.rs`, not root `user.rs`. Legacy `user.rs:23–24` prints and returns unit; canonical `src/lib.rs:23–24` returns a string. The two copies also differ in derives and tests. `core/controller.py:90–95` copies the whole component directory into generated projects, exposing both implementations. This is a proven source-ownership ambiguity, not an additional Cargo build failure. Remove obsolete `user.rs` after verifying no custom consumers, or replace it with an explicit canonical-source reference/documentation; implement behavior fixes only in `src/lib.rs`.
- `.gitignore:1` excludes `/target`; no defect identified. `Cargo.toml:7` declares serde derive support, matching both source files; no missing dependency for the current demonstration. A real repository implementation will need an agreed storage dependency and construction contract.

## Acceptance and confidence

Static ownership/API comparison is high confidence. No source changes, installs, network access, or tests were performed. Canonical runtime defects remain tracked in review 034.

- [ ] Establish `src/lib.rs` as the sole maintained implementation and remove the divergent legacy API.
- [ ] Verify generated output and any custom consumers resolve the canonical crate; compile a representative generated consumer after cleanup.
- [ ] Complete review 034's persisted updates, unknown-user rejection, role behavior, and independent-user acceptance checks.
