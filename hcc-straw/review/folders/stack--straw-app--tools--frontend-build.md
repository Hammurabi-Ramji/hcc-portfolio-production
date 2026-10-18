# Folder review: straw-app/tools/frontend-build (145)

## Inventory and specified behavior

The only direct file is `Cargo.toml` (12 lines), reviewed in full. No applicable ancestor AGENTS.md was present. Manifest SHA256: `E557C75CFD9BF71FCD60998206F0BF2FC5403DA221E4529886459EB07044266F`. Child source is covered by report 146; it was inspected here only for integration.

The current contract is a native Rust Svelte 5 compiler hook, operating offline after dependency provisioning (`straw-app/README.md:19-29`). The manifest meets that contract: `Cargo.toml:7` pins rsvelte_core to revision `5ed8ea3a3401b9fbbe780d3b18d6f90073291d6b`, disables default features, lines 8-10 pin the three OXC APIs to 0.149.0, and line 11 inherits workspace serde_json. These match the child's imports, lockfile entries, workspace membership (`straw-app/Cargo.toml:3`), and Trunk's explicit offline package invocation (`Trunk.toml:16-19`). The former QuickJS dependency mismatch is resolved.

## Findings and patch targets

**No current direct-manifest defect found; no manifest patch warranted.** Browser JavaScript remains required: `third-party/NOTICE.md:3-9` records Svelte 5.57.1 and clsx 2.1.1, while `index.html:9-21` maps their local modules and Trunk's compute output. This is consistent with the native compiler claim.

The child report's stale generated-output finding remains its owner's patch target; successful clean compilation does not exercise deletion/rename behavior. Shared documentation still needs consolidation: `output/QUICK_REFERENCE.md:23,251` and `output/FINAL_VERIFICATION_100PCT.md:13` describe the older npm/Vite desktop pipeline. Update those references to the current README or label their historical scope; the separate web platform's npm instructions remain relevant to that application. Generator completion claims do not establish this compiler's runtime correctness.

## Evidence, dependencies, and acceptance

Root evidence: `frontend-clean-build.log` records native compilation and validation of 107 reachable modules; `frontend-copy-comparison.json` reports all 150 outputs matching, no extras. `desktop-current-full-tests.log` records 15 passing workspace tests. These are saved checks, not tests executed by this reviewer.

- [ ] Preserve compiler/OXC/runtime alignment when dependencies change; rerun the isolated clean output comparison.
- [ ] Complete the child-owned stale-output fix and deletion/rename acceptance case.
- [ ] Reconcile legacy desktop commands; complete Trunk/browser/desktop WASM smoke acceptance.

Requires provisioned Cargo dependencies, Rust 1.95+, Trunk, pinned wasm-bindgen, and browser import-map support. High confidence in current manifest integration; no source edits, installs, network, or new builds/tests performed. Saved compiler success does not establish browser execution or installer acceptance.
