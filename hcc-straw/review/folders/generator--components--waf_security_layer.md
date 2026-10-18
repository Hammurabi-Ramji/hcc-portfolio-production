# WAF component parent review

Scope: `C:\IEDB\STRAW SaaS Generator\components\waf_security_layer` direct files only: `.gitignore` (one `/target` rule), six-line `Cargo.toml`, and 40-line `waf.rs`. Nested `src` is separately reviewed; `.git` is repository metadata. No applicable ancestor AGENTS.md was found.

Current versus specified: the manifest defines a dependency-free Rust 2024 library and the root workspace includes it (`Cargo.toml:19`). With no `[lib] path` override, Cargo uses `src/lib.rs`; root `waf.rs` is a dormant duplicate. Hash comparison confirms these two files are currently byte-identical. The code provides an in-memory string denylist and path substring checks. Requirements describe modular desktop SaaS (`docs/README.md:3`), WAF security layers (`docs/EXPANDED_SAAS_FRAMEWORK.md:13`), and production-grade SQL-injection protection (`docs/FINAL_VERIFICATION_REPORT.md:7,29,41`). Code does not substantiate the last claim. Stack desktop/web guides describe separate application boundaries and do not establish WAF enforcement.

Evidence and priorities:

- **P2 maintenance proposal:** `waf.rs:1-40` duplicates canonical code and tests but is not compiled by this manifest. Editing it alone cannot change the Cargo library. There is no current source drift; consolidate ownership before future fixes.
- **Requirement gaps, canonical ownership:** `waf.rs:10-21` shares the unnormalized denylist and broad `select`/`drop` heuristic already documented in `generator--components--waf_security_layer--src.md`. That report owns behavioral remediation. `core/controller.py:90-96` copies the component directory; selection is not middleware wiring. The inspected Axum router (`components/api_layer_axum/src/lib.rs:7-10`) has no WAF layer.

Patch targets: remove dormant `waf.rs` after confirming no external generator consumes it, or replace it with an explicitly documented compatibility mechanism referencing canonical code. Apply security behavior fixes in `src/lib.rs`; revise production claims and wire API middleware through the API manifest/router as described by the child report. No new dependency is needed for source consolidation or `HashSet<IpAddr>`; middleware depends on API integration and trusted peer-address policy.

Acceptance: confirm Cargo's library target remains `src/lib.rs`, generated output uses that target, and a canonical-code change reaches generated consumers. Exercise blocked-peer rejection and documented benign/encoded request behavior through the router. Confidence high for manifest/source ownership and inspected integration; no build, runtime, network, or tests performed.

- [ ] Establish and document one canonical WAF source; remove redundant implementation if unused.
- [ ] Complete child-report security behavior and middleware acceptance checks.
- [ ] Align WAF production/security claims with verified behavior.
