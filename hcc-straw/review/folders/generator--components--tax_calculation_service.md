# Review: components/tax_calculation_service (index 76)

Inventory: inspected all three direct files: `.gitignore` (one `/target` rule), dependency-free edition-2024 `Cargo.toml` (six lines), and `tax.rs` (33 lines including a two-example unit test). Nested `.git` metadata is excluded; `src/` has separate ownership. No applicable ancestor AGENTS.md was found.

Current versus specified: root `README.md:3,26–29` accurately describes starter bundles. `docs/EXPANDED_SAAS_FRAMEWORK.md:14,23,35` and `docs/FINAL_VERIFICATION_REPORT.md:7,41` promise integrated, production-grade billing/tax functionality. Direct code supplies hardcoded lookup multiplication only. Generator `core/controller.py:169,179` selects this component for finance/ecommerce, while lines 90–96 copy its complete directory; copying alone does not demonstrate checkout integration. Targeted desktop/web output-guide searches yielded no tax integration contract. No legal correctness or rate currency assessment was performed.

Evidence and patch targets:

- **P2 maintenance risk — competing source entry points:** `Cargo.toml:1–6` has no explicit library path, so Cargo compiles canonical `src/lib.rs`; root `tax.rs:1–33` is an identical, uncompiled copy. SHA-256 comparison confirmed byte equality. Editing the visible root helper/tests leaves crate behavior unchanged, while generator copies both. Proposed patch: remove `tax.rs` after checking downstream standalone-file consumers, and document `src/lib.rs` as canonical; alternatively explicitly route a single implementation. This is source duplication, not a proven current runtime divergence.
- Canonical behavior gaps are already evidenced in [the child review](generator--components--tax_calculation_service--src.md): unsupported codes silently return zero, numeric inputs lack validation, and money/rounding semantics are undefined. Apply those changes in canonical source rather than maintaining a second implementation here.

Dependencies: workspace `Cargo.toml:24` registers this crate; no external Rust dependencies are declared. Coordinate source consolidation with generator copying and billing consumer wiring. `.gitignore` needs no change.

Acceptance and confidence: high confidence in direct inventory and source equivalence; static inspection/hash checks only, no builds or tests run.

- [ ] Consolidate/document the canonical source and check standalone-file references.
- [ ] Run focused canonical crate tests after remediation; confirm generated finance/ecommerce bundles expose the same implementation.
- [ ] Address canonical child-review tasks and verify a checkout caller receives calculation errors.
