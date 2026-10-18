# Review: components/billing_stripe

Inventory: `.gitignore`, `Cargo.toml`, all 33 lines of legacy `billing.rs`, and embedded `.git` metadata. No ancestor `AGENTS.md` was found. `Cargo.toml:1–8` declares a serde/uuid library without a custom library path: canonical compiled code is `src/lib.rs`, included by workspace `Cargo.toml:4`. `.gitignore:1` excludes build output only.

**P2 — Duplicate source drift.** `billing.rs:3,12,21` differs from `src/lib.rs:3,12,20–22` in derives, credential field naming, and its explicit mock comment. No inspected caller references the legacy filename. Both fabricate checkout URLs and fixed plans (`billing.rs:20–30`). `docs/README.md:45` documents mocking; production claims (`docs/FINAL_VERIFICATION_REPORT.md:7,41`) exceed that behavior. Existing `generator--components--billing_stripe--src.md` owns provider/lifecycle remediation.

**P2 — Packaging contamination.** `core/controller.py:90–95` and `templates/bundle_templates.py:28–33` copy this entire directory, including duplicate code and repository metadata. Patch both copy boundaries to exclude `.git` and `target`; retire `billing.rs` after checking external consumers. Preserve repository metadata until ownership is established.

Dependencies: coordinate controller/template owners and child billing changes. Live billing requires backend/provider and durable subscription adapters. Desktop/web guides establish no billing wiring.

- [ ] Retire/archive legacy source and correct readiness documentation.
- [ ] Exclude repository/build metadata from generated bundles.
- [ ] Accept when generated billing contains one canonical source, no `.git`/`target`, and Cargo resolves its library to `src/lib.rs`; apply child-review provider acceptance checks separately.

Confidence: high from inspection. No source edits, installs, network, or tests; generation/provider execution unchecked.
