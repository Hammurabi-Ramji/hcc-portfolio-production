# Review 110: generated Tauri schemas

Scope: direct files in `straw-app/src-tauri/gen/schemas`, inspected against the current Rust workspace/Trunk desktop configuration. No applicable AGENTS.md was found in the workspace or checked ancestors.

## Inventory and current behavior

Four generated JSON files exist: `acl-manifests.json` (66,720 bytes), `capabilities.json` (146 bytes), and the desktop/Windows schemas (117,263 bytes each). All parse successfully. The two platform schema files have identical SHA-256 hashes and declare the same draft-07 CapabilityFile structure (`desktop-schema.json:2-35`; corresponding Windows lines). Identical output for the current Windows target is not evidence of an error.

`acl-manifests.json:1` contains core permission manifests only. Structured comparison found all 340 ACL permission/set identifiers represented exactly in each schema's Identifier vocabulary (`desktop-schema.json:176-182`). `capabilities.json:1` matches the source default capability's main window and core:default permission (`src-tauri/capabilities/default.json:3-9`). Local access is enabled and no remote URL grant is present.

## Specified behavior and findings

No proven defect in the owned generated files. The current Cargo manifest declares Tauri 2 and tauri-build 2 without filesystem/dialog plugins (`src-tauri/Cargo.toml:12-22`); build.rs invokes tauri_build (`:1-3`). Configuration now uses Trunk (`tauri.conf.json:6-10`), and the Rust app consumes generate_context (`src/lib.rs:170`). Core-only generated ACL metadata is consistent with those inputs. Schema declarations list available permissions; they do not grant all listed commands.

Historical output documentation claims completed file-access permissions (`output/TESTING_GUIDE.md:65`, `COMPLETION_SUMMARY.md:71`). These claims do not establish a missing plugin requirement for the rewritten desktop, nor justify manually adding filesystem grants. The generator documentation describes desktop-first sovereign applications but does not specify additional schema contents. Runtime IPC authorization and platform packaging remain outside this metadata review.

## Patch targets, dependencies, acceptance

No generated-file patch is warranted. Future permission changes belong first in Cargo plugin dependencies, capability source, and build configuration, followed by Tauri regeneration. Dependencies are the resolved Tauri toolchain, active target, and capability inputs; do not maintain generated permission lists by hand.

- [ ] After the concurrent desktop rewrite stabilizes, root should regenerate through the normal Tauri build and confirm capabilities and schema identifiers still match source inputs; attribute any generated diff to its toolchain or permission change.

Confidence: high for current JSON consistency, limited for runtime behavior. Per assignment, no install, network, build, broad test, source edit, or registry mutation was performed.

