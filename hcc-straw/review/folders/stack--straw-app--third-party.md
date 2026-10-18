# Current folder review: straw-app/third-party

Reviewed 2026-10-09, registry index 143. Direct inventory: `NOTICE.md` only (10 numbered lines). `svelte/` and `clsx/` are upstream dependency assets, excluded from first-party source-agent assignments; their licenses/version markers were inspected only for notice and packaging evidence. No ancestor AGENTS.md was found in the checked repository/IEDB ancestors. No source changes, network, installs, tests, or registry changes were performed.

## Current versus specified

`NOTICE.md:3-9` identifies the local Svelte 5.57.1 runtime, clsx 2.1.1, the pinned native compiler, licensing locations, offline asset behavior, and the unresolved literal substring audit. This matches the current desktop README's native-compiler/local-runtime contract (`straw-app/README.md:27-29`), rather than the historical output guides' retired frontend paths. Generator documentation specifies Svelte/Rust modular components but adds no more specific asset provenance requirement.

Local corroboration: `svelte/src/version.js:7` says 5.57.1; its compiler directory is absent. `svelte/LICENSE.md:1-7` and `clsx/LICENSE:1-9` retain MIT copyright/permission text. `tools/frontend-build/Cargo.toml:7` pins the exact rsvelte revision, and `Cargo.lock:3321-3323` resolves 0.12.6 to that revision. The local Cargo checkout `rsvelte-ae459f1d0009db54/5ed8ea3` retains its MIT LICENSE, `crates/rsvelte_core/Cargo.toml:3-7` specifies version/license, and `README.md:75` targets Svelte 5.57.1/636eaaaa6f06. clsx's minified module contains no version marker; its stated version and the Svelte source commit were not independently authenticated against upstream. No external verification was required or performed.

## Finding and concrete patch target

**P2 — runtime licenses are omitted from generated distributions.** `NOTICE.md:9` says license text is preserved, which is true in the source tree but incomplete for distribution. `tools/frontend-build/src/main.rs:15-16,69-76` copies only `.js` files beneath `svelte/src` and the standalone clsx module, omitting the sibling license files and direct NOTICE. `index.html:8` copies only `public`; `src-tauri/tauri.conf.json:10` packages `dist`. No LICENSE/NOTICE files were found under current `public` or `dist`. Both local runtime licenses explicitly require retaining their notices in copies (`svelte/LICENSE.md:5`, `clsx/LICENSE:7`). This is a demonstrated build-artifact preservation gap, not a legal certification judgment.

Patch the frontend build hook to copy both complete license texts and the provenance notice into a stable `public/ui/vendor/licenses/` location, and clarify that path in `NOTICE.md:9`. The compiler license remains available in Cargo's build dependency source; compiler redistribution is a separate packaging concern. Optional improvement: record an immutable clsx artifact source/hash for reproducible provenance; this is not a proven runtime defect.

## Dependencies, acceptance, confidence

Coordinate the copy fix with the frontend-build/public reviewers. Root evidence `frontend-clean-build.log` reports 107 resolved local modules; `frontend-copy-comparison.json` records exit 0, all 150 generated files matching, and no extra production files. This validates code-copy reproducibility, not license packaging or browser execution.

- [ ] Copy Svelte and clsx licenses plus NOTICE through the build hook.
- [ ] In an isolated clean build, assert exact license-text preservation in public and Trunk dist; verify packaged frontend inclusion.
- [ ] Clarify the distribution license path and optionally add immutable clsx provenance.

Confidence: high for local version/pin and omitted-file evidence; limited for upstream artifact authenticity. Installer contents, browser behavior, and external provenance were not tested by this reviewer.
