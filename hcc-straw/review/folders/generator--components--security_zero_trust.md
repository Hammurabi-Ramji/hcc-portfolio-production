# Review 074 — security_zero_trust

Reviewed every direct file: `.gitignore` (ignores `/target`), `Cargo.toml`, and `security.rs` (35 lines). Nested Git metadata is excluded; `src` is separately owned. No applicable ancestor or folder AGENTS.md found.

**Current versus specified.** The manifest declares a Rust 2021 library with serde derive (`Cargo.toml:1–7`); the workspace includes it (`../../Cargo.toml:14`). With no explicit library path, Cargo uses `src/lib.rs`, not the root `security.rs`. The legacy file implements the same exact-resource, role/MFA predicate and default-deny behavior (`security.rs:23–33`). Compared with canonical source, it lacks `AccessPolicy: Clone` (`src/lib.rs:3`) and all canonical tests (`:37–59`), but has identical access decisions. Documentation promises policy/MFA enforcement (`docs/README.md:57`) and healthcare zero-trust security (`docs/EXPANDED_SAAS_FRAMEWORK.md:22`). The existing child report `generator--components--security_zero_trust--src.md` owns the duplicate-policy hazard and missing authenticated enforcement integration; those findings are not repeated here as new defects.

**P3 — ambiguous legacy source (maintenance issue).** Root `security.rs:1–35` is not a Cargo target, yet `core/controller.py:90–96` copies the whole component into generated bundles. Consumers therefore receive two similar implementations, while edits to the legacy file do not change the compiled crate. No runtime divergence was found today. Concrete patch: remove the obsolete root file after checking external consumers, or replace it with an explicit compatibility re-export of the canonical crate; document `src/lib.rs` as the source of truth. No new dependency is needed. The manifest and ignore rule need no demonstrated correction.

Acceptance: verify generated healthcare/finance/legal bundles still resolve the canonical library, contain no competing policy implementation, and compile against the documented public API. Coordinate policy changes with the child report. Confidence is high for source/manifest selection; no builds, tests, generation, network, or external-consumer checks were run. Targeted Stack desktop/web guides provide no additional contract for this component.

- [ ] Consolidate or explicitly document the legacy root source.
- [ ] Verify generated bundle library selection and public API after consolidation.
