# Review 124 — zap_hosting_management

Inventory: zero direct files; only `docs/` (four deployment guides) and empty `scripts/`. No direct source, manifest, or executable exists. No applicable ancestor AGENTS.md was found. Child contents were inspected only for integration evidence.

Current versus specified: this is a documentation container, registered as an available component (`core/config.json:48`). README describes selectable modular components (`docs/README.md:40,123`), while the verification report claims production implementation (`docs/FINAL_VERIFICATION_REPORT.md:7`). **P2 requirement gap:** selection copies the guides and reports an integrated, ready-to-build feature (`core/controller.py:94–96,112–114`), without hosting-management behavior. The delivered-files list additionally names configuration and DevOps assets absent from this component (`docs/ZAP_HOSTING_INTEGRATION_SUMMARY.md:25,341–346`). No runtime hosting contract is specified, so inventing an implementation would be unjustified.

Patch targets: add a component README declaring documentation-only status; coordinate registry/controller capability metadata and correct delivery claims. Depend on core and child docs/scripts reviews.

Acceptance: select ZAP in an isolated generation fixture; verify documentation-only labeling and real asset links. Confidence: high on inventory/integration; no tests, network, deployment, or source edits performed.

- [ ] Clarify documentation-only capability and reconcile advertised assets.
- [ ] Verify generated status against the declared capability.
