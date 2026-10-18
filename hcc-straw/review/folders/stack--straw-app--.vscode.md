# Review: straw-app/.vscode

Scope: both direct files, `extensions.json` and `settings.json`, read completely with numbered lines. No applicable AGENTS.md was present in the checked ancestor chain.

`extensions.json:2-6` recommends Svelte, Tauri, and Rust Analyzer extensions. `settings.json:2` enables the Svelte TypeScript plugin. Both files parse as JSON, contain no credentials or executable commands, and match the desktop application's technologies. `straw-app/README.md:3,29,39` specifies Svelte 5, Tauri 2, and a Rust-hosted local compiler; `straw-app/Cargo.toml:3` establishes the Rust workspace. Direct UI inventory confirms Svelte components plus `main.js`. Recommendations support development but are not application dependencies or guarantees of editor diagnostics.

Current versus specified: the root README and generator documentation describe a Svelte/Tauri/Rust stack, which these settings support. No specific editor configuration requirement was found. Generator production-readiness claims and older output-guide npm commands do not establish editor or runtime correctness; the current desktop README instead documents Cargo/Trunk tooling. No evidence-backed defect or required patch was identified in the two owned files.

Patch/dependencies: no change warranted. These recommendations depend on separately installed editor extensions; build behavior remains governed by the Cargo workspace and local compiler, not this folder.

Acceptance: JSON parsing passed for both files. An optional manual check would open `straw-app` as the editor workspace, confirm the recommendations appear, and inspect a Svelte component and Rust source for extension activation. Extension availability and TypeScript-plugin behavior were not verified online or interactively; no installs or builds were run. High confidence in the static configuration review.

- [ ] Optional developer smoke check: confirm installed Svelte/Tauri/Rust extensions activate in the desktop workspace.
