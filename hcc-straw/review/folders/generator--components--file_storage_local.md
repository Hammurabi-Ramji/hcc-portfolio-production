# Folder review: components/file_storage_local

Reviewed every direct file: `.gitignore` (1 line), `Cargo.toml` (6), and `storage.rs` (25). The folder also contains `src/` and an embedded `.git/`; neither is owned by this direct-file review. No applicable ancestor AGENTS.md was found.

The documented contract is local storing and retrieving of data (`docs/README.md:54`). Cargo.toml:1-6 defines a dependency-free Rust 2024 library package; with no `[lib]` path override, **the compiled target is `src/lib.rs`, not root `storage.rs`**. The canonical source provides save/read/delete and a CRUD test. Root storage.rs defines only save/delete. The root README:26-29 describes copied component bundles; `core/controller.py:90-95` copies the complete component directory, so both variants reach generated output. Targeted caller searches in core, templates, and desktop Rust sources established selection/copying, but no runtime caller importing this legacy file.

## Findings and patch targets

- **P2, proven source/packaging divergence — storage.rs:8-25; Cargo.toml:1-6.** The root file looks like the reusable implementation but lacks retrieval required by docs/README.md:54 and present in src/lib.rs:21-24. Editing it will not change Cargo builds or the canonical tests. Remove this redundant implementation after checking any external consumers, or replace it with an explicitly documented compatibility module sharing the canonical implementation. Keep Cargo's normal src/lib.rs target; adding `[lib] path = "storage.rs"` would select the incomplete legacy API and discard current tests.
- **P2, packaging hygiene — .gitignore:1 and controller.py:95.** The folder contains an embedded Git repository, while copytree has no exclusion filter. `.gitignore` affects Git tracking, not Python copying, so repository metadata is copied into generated bundles. Add generator copy exclusions for `.git`, build outputs, and caches; that integration patch belongs to the controller owner.
- **Inherited P1, compiled implementation unsafe.** Root storage.rs:9-23 repeats panic-on-initialization and unchecked root.join(name) behavior. The active src/lib.rs has the same containment flaw. The detailed exploit, resolver patch, constructor changes, and test work are already recorded in `generator--components--file_storage_local--src.md`; fixing only this root file cannot resolve them. Production-ready assertions in docs/FINAL_VERIFICATION_REPORT.md:7,41 are therefore unsupported.

## Dependencies and acceptance

No runtime crate dependencies are required by the manifest. Rust 2024 needs a compatible toolchain; actual build validation remains with the root reviewer. Stack desktop/web guide excerpts supplied no additional LocalStorage integration contract.

- [ ] Establish one canonical implementation and document its public import/API.
- [ ] Apply containment and initialization fixes to src/lib.rs per child report.
- [ ] Exclude embedded Git metadata and build artifacts during generation.
- [ ] Confirm Cargo metadata selects src/lib.rs; generated bundle CRUD compiles and passes boundary tests.
- [ ] Confirm generated components contain neither divergent legacy source nor copied `.git/` metadata.

Confidence: high for target ownership and static findings, moderate for external legacy consumers. Read-only inspection only; no source edits, installs, network calls, builds, or tests were performed.
