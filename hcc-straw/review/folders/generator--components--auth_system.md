# Review: generator/components/auth_system

Direct files: `Cargo.toml`, `auth.rs`, `.gitignore`; nested directories: `src`, `.git`. No ancestor AGENTS.md found. `Cargo.toml:1–9` declares Rust 2021 with serde derive, jsonwebtoken 9.3, and chrono; workspace `Cargo.toml:3` includes it. Cargo's default library is `src/lib.rs`; its existing review owns runtime/security findings.

**P2 — Ambiguous legacy ownership.** `auth.rs:1–44` duplicates canonical implementation lines 1–44 except canonical Claims additionally derives PartialEq; the direct copy lacks canonical tests. It is uncompiled, but `core/controller.py:90–95` packages both copies. `docs/README.md:122` broadly instructs editing component Rust files, enabling edits to unused code. Patch: remove/archive `auth.rs`, document `src/lib.rs` as authoritative, and check consumers before removal. Targeted core searches found no alternate direct-file consumer.

**P2 — Repository metadata is packaged.** The component contains `.git`; `core/controller.py:95` copies without exclusions. `.gitignore:1` ignores `/target` for Git, not copytree. Patch shared bundling to exclude `.git` and build/cache directories; coordinate with the controller owner.

Current code provides a JWT primitive; authentication/authorization claims (`docs/README.md:44`) and production completeness (`docs/FINAL_VERIFICATION_REPORT.md:7`) need reconciliation with the src review. Manifest dependencies match canonical imports; no additional manifest defect demonstrated.

- [ ] Consolidate source and document ownership.
- [ ] Exclude repository/build metadata from generation.
- [ ] Verify generated crate builds, retains canonical tests, and excludes metadata.

Confidence: high from numbered inspection. No builds, generation, tests, network, or source edits performed.
