# A-F036 remaining — NOT DONE (UI leg open)

Owned folder: `straw-app/crates/engine/src/nodes`. No source edits in this remaining pass. No commit/push/PR. No agents spawned.

Checklist item under review:

> After the proposed node fixes, run focused regression cases and one real UI-to-engine flow for every node kind.

## Focused regression (engine) — PASS

Prior A-F036 node fixes and `regression.rs` remain in place. This remaining pass re-ran the focused owned regressions only.

Command (from `straw-app`):

```powershell
$env:PATH='C:\Users\hammu\.cargo\bin;'+$env:PATH
$env:TEMP='C:\IEDB\STRAW Stack\review\agent-output\A-F036-remaining\tmp'
$env:TMP=$env:TEMP
& 'C:\Users\hammu\.cargo\bin\cargo.exe' test -p straw-engine --offline --locked nodes:: -- --nocapture
```

- Log: [logs/engine-nodes.log](A-F036-remaining/logs/engine-nodes.log)
- Exit code: **0**
- Result: `ok. 9 passed; 0 failed; 0 ignored; 0 measured; 35 filtered out; finished in 0.37s`

Covered tests (every owned node kind via Graph/DbState and/or direct executor acceptance):

| Test | Node kinds exercised |
| --- | --- |
| `writer_rejects_every_invalid_content_before_touch_and_preserves_valid_modes` | write_file |
| `invalid_writer_and_csv_graphs_persist_failures_before_side_effects` | write_file, csv_parse (+ graph failure persistence) |
| `both_branches_record_explicit_skips_through_filter_join_and_writer` | conditional, filter, join_text, write_file, text_input |
| `conditional_rejects_unsupported_values_and_preserves_supported_values` | conditional |
| `csv_preserves_headers_first_headerless_row_and_quoted_fields` | csv_parse |
| `template_json_vars_are_connectable_nonrecursive_and_fail_when_malformed` | template |
| `latin1_read_transform_filter_join_writer_graph_and_mixed_list_errors` | read_file, transform, filter, join_text, write_file |
| `http_and_llm_nodes_execute_real_loopback_graphs_with_schema_default_parity` | http_request, llm_prompt, text_input |
| `successful_csv_graph_records_headerless_rows_and_transform_outputs_match_metadata` | csv_parse, transform, text_input |

Eleven registered kinds (`read_file`, `write_file`, `transform`, `filter`, `template`, `http_request`, `text_input`, `csv_parse`, `join_text`, `conditional`, `llm_prompt`) are covered by these engine regressions. These are not native UI observations.

A package-wide `cargo test -p straw-engine --offline --locked` re-run was started afterward but remained blocked on concurrent workspace cargo file locks (`Blocking waiting for file lock on package cache` / `build directory`). It is **not** acceptance evidence for this remaining item; the focused `nodes::` run above is.

## UI-to-engine flow (every node kind) — BLOCKED / LEFT OPEN

Per remediation roster and A-F036 Triple-Ripple Secondary, the real UI→engine leg defers to **A-F051** (`straw-app/ui`), with desktop shell/IPC lifecycle owned by **A-F046** (`straw-app/src-tauri/src`).

Coordination check (this remaining pass):

- **A-F051**: no `review/agent-output/A-F051*` deliverable exists. Folder checklist still unchecked (dirty-state, draft retention, WebView2 smoke of all schema editors / run / history).
- **A-F046**: has `shared-contract.md` only; no `result.json` / DONE settlement. Contract explicitly states native WebView2/IPC and packaged UI interactions are W4 acceptance and are **not** established by Rust helper/loopback tests.
- This agent’s edit scope is **only** `straw-app/crates/engine/src/nodes/**`. Launching or driving the desktop UI / Tauri IPC / Svelte editors is outside ownership.

**Blocker:** desktop UI / WebView2 acceptance surface is unavailable to A-F036 remaining; F051 (and F046 native IPC observation) have not settled a runnable UI-to-engine path that can exercise every node kind from the editor.

Per instructions: document blocker, record regression results, **leave the checklist item open**.

## Files changed

None under `straw-app/crates/engine/src/nodes/**`. Evidence-only writes under `review/agent-output/A-F036-remaining/`.

## Status

| Leg | Status |
| --- | --- |
| Focused engine node regressions | **DONE** (9/9, exit 0) |
| One real UI-to-engine flow per node kind | **NOT DONE** — blocked on A-F051/A-F046 desktop UI |
| Overall remaining checklist item | **NOT DONE** (left open) |

Root-only note: `A-F036-remaining | NOT DONE | nodes regressions 9 PASS exit 0; UI-to-engine blocked on F051/F046; no node source edits | evidence review/agent-output/A-F036-remaining.md`.
