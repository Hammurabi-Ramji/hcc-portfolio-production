# Review: components/api_layer_axum (direct files)

Inspected every direct file: `Cargo.toml`, `api.rs`, and `.gitignore`; `src/` and nested `.git/` are separate content. No applicable ancestor AGENTS.md was found. The manifest declares Axum 0.7, Tokio, Serde/JSON, and Tower (`Cargo.toml:6-11`). With no explicit library path, Cargo compiles `src/lib.rs`; direct `api.rs` is an unreferenced legacy source. `.gitignore:1` appropriately excludes `/target`.

**P2 — Ownership ambiguity:** legacy `api.rs:7-15` builds the same two routes, prints readiness, and leaves the serving call commented out. Its commented `axum::Server` API (`api.rs:14`) also predates the declared Axum 0.7 dependency. Restoring that line would neither repair the compiled crate nor provide a compatible implementation. Current `src/lib.rs:13-17` remains nonfunctional at startup; see [the child review](generator--components--api_layer_axum--src.md) for the P1 defect and repair. Generator directory copying (`core/controller.py:95`) propagates both versions. The supplied copy comparison's cosmetic `app`/`_app` difference does not fix startup.

The starter description (`README.md:3`) matches this scaffold; full-implementation claims (`docs/EXPANDED_SAAS_FRAMEWORK.md:35`, `docs/FINAL_VERIFICATION_REPORT.md:7`) exceed demonstrated behavior. Patch the compiled source through the child task, then remove or explicitly label legacy `api.rs` and align status documentation. Existing Axum/Tokio dependencies suffice. Acceptance: generated bundles have one clearly owned implementation, real loopback health requests succeed, and bind failures propagate. Root's 35 passing Rust tests do not establish socket startup. This review ran no tests; ownership confidence is high.

- [ ] Resolve legacy-source ownership and generated-bundle duplication.
- [ ] Complete child startup repair and reconcile capability claims.
