# Review 109 — desktop capabilities

Scope: current direct file `straw-app/src-tauri/capabilities/default.json` (11 lines), reviewed against the rewritten Rust workspace/Trunk desktop on 2026-10-09. No applicable ancestor AGENTS.md was found. Generated schemas, current Tauri handlers, config, UI calls, README, and relevant generator/output documentation supplied integration evidence only.

## Current versus specified

The sole capability targets `main` (default.json:5-7), grants `core:default` only (8-10), and references the present desktop schema (2). Generated `gen/schemas/capabilities.json:1` agrees and marks it local. No remote-origin grant, filesystem plugin permission, shell permission, or wildcard window grant is present. `src-tauri/Cargo.toml:15-22` contains no filesystem/dialog/shell plugin. This is consistent with current architecture: `ui/App.svelte:23-25` uses global core invoke; `tauri.conf.json:25` enables that bridge; native application handlers are registered at `src-tauri/src/lib.rs:141-155`. File saving is an application command (`lib.rs:121-129`), so adding `fs:default` would neither be necessary for this UI nor establish the custom command's output-root policy.

The current README specifies local desktop engine commands, guarded generated-file paths, and explicit operator-configured file-node paths (README.md:48,58-60). The capability matches that integration. No proven runtime defect was found in the owned file. Broad production-ready generator claims are not verification evidence for this desktop boundary.

## Findings and patch targets

**P2 documentation drift (proven, outside owned folder):** `output/TESTING_GUIDE.md:65,73-76` claims completed Tauri file-access permissions and references removed Svelte routes. Its capability explanation is historical. Update that section to describe current custom-command file access and link the current engine/path validation checks; do not add plugin permissions to make the old claim appear true.

**Optional hardening:** make `"label": "main"` explicit in `tauri.conf.json:14-20` to document the coupling with default.json:6. This is maintainability hardening, not an identified label mismatch. If future windows need different authority, define application command permissions and per-window grants as a coordinated build/handler change; this existing capability alone should not be described as a command-by-command sandbox.

## Dependencies and acceptance

Depends on Tauri 2 ACL generation, the main-window label, and the global invoke bridge. Root verification should launch the actual desktop, exercise initialize/list/new/save/delete plus chat/code/file commands, and check generated ACL output still grants only the intended local window. Verify an unrelated window receives no additional core grant and remote content receives no capability grant.

- [ ] Correct the historical testing-guide capability explanation.
- [ ] Consider an explicit main-window label.
- [ ] Complete live desktop command/ACL acceptance checks after the concurrent rewrite settles.

Confidence: high for inspected file/config/caller consistency; runtime authorization and packaging remain unverified. No builds, tests, installs, network calls, or source edits were performed. Earlier logs were not treated as current evidence.
