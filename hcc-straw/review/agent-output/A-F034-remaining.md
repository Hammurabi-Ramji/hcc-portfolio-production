# A-F034 remaining — PARTIAL

Wave follow-up · Folder: `C:\IEDB\STRAW Stack\straw-app\crates\engine` · Prior foundation: [A-F034.md](A-F034.md). Child sources remain A-F035 / A-F036 ownership.

## Scope

Owned edits limited to crate root (`Cargo.toml` / `README.md`). No `src/` or `src/nodes/` changes. No Tauri coupling added. No commit/push/PR.

## Changes

| File | Action |
| --- | --- |
| `straw-app/crates/engine/README.md` | **Added.** Documents desktop-shell independence, plain-HTTP `ureq` boundary, and historical vs current documentation ownership. |
| `straw-app/crates/engine/Cargo.toml` | **Unchanged.** Still a plain library: workspace serde/sqlx/chrono/uuid/specta/thiserror, path `straw-storage`, csv, `ureq` without TLS defaults; `tempfile` dev-only. No Tauri dependency or feature. |

## Checklist status

1. **Preserve engine independence from Tauri when fixing child-module findings.** — **DONE (engine-owned).** After F035/F036 child fixes, crate root still has no Tauri dep; README records the boundary for future child work. Resolved tree: 0 `tauri` matches ([engine-independence.log](A-F034-remaining/logs/engine-independence.log), [engine-dependency-tree.log](A-F034-remaining/logs/engine-dependency-tree.log)).

2. **After those fixes, rerun focused engine tests and root workspace checks.** — **Reran; engine PASS, workspace FAIL.** Focused `straw-engine` tests: **44 passed**, exit **0** ([engine-tests.log](A-F034-remaining/logs/engine-tests.log)). Root `cargo test --workspace --offline --locked`: exit **101** — failure is `crucible` `security_env_handling` (`crates/crucible/tests/gates.rs:164`, expected Fail got Pass), outside engine ownership ([workspace-tests.log](A-F034-remaining/logs/workspace-tests.log)). Engine package itself compiled and its tests ran in that workspace invocation before the crucible failure stopped the run.

3. **Complete observed desktop command/model acceptance and clarify historical documentation ownership.** — **PARTIAL; checkbox remains open.** Historical ownership clarified in crate `README.md` (current: `straw-app/README.md`; historical May guides under `output/`; reconciliation A-F028/A-S16; observed desktop/UI/live-model A-S15/A-F051). Live model assets are **present** (not the missing-model case): GGUF `svelte-coder-v0.9.0-4b-q4_k_m.gguf` under `src-tauri/resources/models/svelte-coder/`, and `ollama` is on PATH ([live-model-probe.log](A-F034-remaining/logs/live-model-probe.log)). Observed desktop IPC/command/UI acceptance was **not** executed here (out of crate-root edit scope; retained by A-S15/A-F051). Leave stack checkbox open.

## Verification commands

Cargo working directory: `C:\IEDB\STRAW Stack\straw-app`. PATH prefixed with `C:\Users\hammu\.cargo\bin`. Process-local `TEMP`/`TMP`: `review\agent-output\A-F034-remaining\tmp`. All Cargo invocations: `--offline --locked`.

| # | Command | Exit | Acceptance |
| --- | --- | ---: | --- |
| 1 | `cargo tree -p straw-engine --offline --locked --edges normal,build,dev` | 0 | yes |
| 2 | `Select-String` tree log for `\btauri(?:[- ]|\b)` → match_count 0 | 0 | yes |
| 3 | `cargo test -p straw-engine --offline --locked -- --nocapture` | 0 | yes (44 unit + 0 doc) |
| 4 | `cargo test --workspace --offline --locked` | 101 | no — crucible `gates::security_env_handling` |

## Blockers

1. **Root workspace check not green:** `crucible` test `security_env_handling` fails (Pass vs expected Fail). Not an engine defect; needs crucible/root owner disposition. Blocks claiming full checklist item 2 closure as PASS.
2. **Observed desktop command/model acceptance unfinished:** Model pack GGUF and `ollama` CLI are present, but no live desktop launch/IPC/UI observation was performed under this agent’s edit boundary. Remains A-S15 / A-F051. Stack checkbox 3 stays open.

## Triple-Ripple

Primary: Engine crate root remains Tauri-independent; README documents the boundary and doc ownership; focused engine tests 44/44 PASS offline/locked.

Secondary: Workspace rerun exposed a non-engine crucible gate failure; do not patch crucible from F034. Child `src`/`nodes` stay with F035/F036.

Tertiary: Desktop/live-model observation and historical-guide release disposition remain A-S15/A-F051 and A-F028/A-S16. Whole-tree source-scan release hold retained.

## Settlement

`A-F034-remaining | PARTIAL | straw-app/crates/engine crate root | README added; Cargo.toml unchanged | independence PASS; focused engine 44/44 PASS exit 0; workspace exit 101 (crucible out of scope); desktop observation open | evidence: review/agent-output/A-F034-remaining.md`
