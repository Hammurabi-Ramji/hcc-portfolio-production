# Generator root — dedicated review 133

Reviewed 2026-10-09. Scope: every direct file in `C:\IEDB\STRAW SaaS Generator`; child folders have separate reports. No applicable ancestor/root `AGENTS.md` was found. No source edits, installs, network requests, generation or build/test reruns were performed.

## Inventory and current behavior

The five direct files are `Cargo.toml`, `Cargo.lock`, `README.md`, `folder-review-inventory.txt` and `to-do.md`. No direct ignore/config/entrypoint file exists beyond these. The virtual Cargo workspace lists 32 component libraries (`Cargo.toml:1–36`), with resolver 2. Lockfile v4 (`Cargo.lock:1–3`) contains 250 packages: 32 local packages matching every member name and 218 registry packages with 218 checksum entries. This is a component validation workspace, not a generated SaaS executable. No manifest/lock mismatch was found.

The inventory is an audit snapshot of 526 unique descendant directory paths, all within this generator root; it excludes `.git` and `target` paths and includes source and generated copies. `to-do.md:3–18` explicitly separates current and historical evidence; `:24–47` already tracks cross-folder remediation, `:53–55` awaits this report, and `:732` records 18 bundles/236 copied components. These are audit artifacts, not application requirements or proof of implementation.

The root README accurately describes explicit CLI generation, help/list behavior, component copying and configuration fallback. Saved `review/controller-checks.json` verifies non-generating invocations preserve live output and invalid flag combinations fail. Saved `review/generator-cargo-test.log` shows 35 passing unit tests across 32 crates, plus zero doc tests. Shared comparison evidence reports 225 matching copies and 11 cosmetic Axum differences. Those results do not validate application assembly or providers.

## Findings and concrete patch targets

1. **P2 — Quick start names an obsolete absolute checkout.** `README.md:15` instructs users to start from `c:\hcc-straw\hcc-straw-saas`, while this checkout is elsewhere. `core/config.json:4` retains that absolute base; `controller.py:27–35` falls back only when it does not exist. If the old location exists, generation targets it. Replace the README instruction with “from this repository root,” document the supported Python version, `--config`, and exactly how base selection works. Coordinate predictable repository-relative configuration with G08; documentation alone cannot change controller resolution.

2. **P2 — Output documentation omits destructive regeneration and readiness limits.** `README.md:26–35` describes output and placeholders without saying generation replaces an existing template directory. `controller.py:80–85` recursively removes it, catches cleanup failure and continues. `README.md:29` also implies missing implementations appear in `missing_components`; actually `controller.py:94–116` counts known placeholders as included, reports only unknown names missing, and unconditionally emits `ready_to_build`. The saved isolated fixture reproduces this. Patch the README now to explain replacement and source-bundle/manual-integration scope. After G01/G02/G03, document the corrected status/count/schema and failure-safe replacement contract. Do not advertise build/start commands before assembly exists.

3. **P2 — Publish one consistent capability boundary.** The restrained root “starter bundle” description conflicts with `docs/FINAL_VERIFICATION_REPORT.md:3–7,36–41` claiming universal completion and production readiness; `docs/README.md:71–78` still prescribes editing the entrypoint. Under G10, link root guidance to a corrected capability/test-status document and mark obsolete reports historical. Explain 43 configured components versus 32 Rust workspace members; exclusion of UI/documentation components is not itself a Cargo defect. The current Stack desktop uses Rust/Trunk; its removed frontend contracts must not become generator acceptance requirements.

## Dependencies, acceptance and confidence

Dependencies: core readiness/path/replacement repairs, the chosen runnable-versus-source-bundle contract, child documentation ownership and the audit aggregator. Preserve generated lockfile ownership; regenerate through Cargo only when dependencies change. Root ignore rules would be housekeeping and cannot filter `copytree`.

- [ ] Correct portable setup/configuration guidance and document replacement semantics.
- [ ] Align output/readiness documentation with G01/G02/G03 and publish evidence-scoped capabilities under G10.
- [ ] Refresh this root's to-do report link/count through the aggregator; retain unchecked implementation tasks and snapshot provenance.
- [ ] Verify documented commands in disposable relocated fixtures, including an existing legacy base path, placeholder selection and failed replacement; check supported generated builds only after assembly is implemented.

High confidence in direct-file inventory, manifest alignment and documentation mismatches. Existing shared logs were inspected, not rerun here. Installer, provider, runtime and generated-application behavior remain unverified.
