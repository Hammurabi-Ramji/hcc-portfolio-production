# straw-app/public — current folder review

Inventory/current versus specified: there are no direct files; `ui/` is generated output, intentionally separate from authored `ui/` sources. This matches the native compiler/import-map pipeline documented in `straw-app/README.md:29`.

Evidence: `tools/frontend-build/src/main.rs:34–82` creates `public/ui`, compiles components, copies local runtime modules and validates imports. `Trunk.toml:13–19` watches authored inputs, ignores generated public output and runs the offline pre-build hook. `index.html:8,11–25` copies public assets and loads their matching URLs; `.gitignore:3` excludes generated UI files. Root's saved `review/frontend-copy-comparison.json` reports all 150 generated files matching clean output and zero extras.

Findings/patch: no direct-folder defect demonstrated; no patch warranted. Dependencies: authored UI, compiler, vendored runtime, Trunk and WASM asset output.

Acceptance/follow-up:
- [ ] Confirm packaged Trunk assets resolve and the desktop UI mounts during root integration validation.

Confidence is high for container integration. This review inspected configuration and saved comparison evidence; it did not run builds or browser checks.
