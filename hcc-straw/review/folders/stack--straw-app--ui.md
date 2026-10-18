# Current review: straw-app/ui (index 147)

Reviewed the replacement tree on 2026-10-09. Scope: every direct file, with numbered source inspection; no source changes, installs, network, builds, or runtime checks. No applicable ancestor/root/folder AGENTS.md was found. Historical desktop logs and legacy findings are superseded.

## Inventory and intended behavior

- `App.svelte`: navigation, minted flow identity/list/save callbacks, delete, startup health, real WASM initialization/compute.
- `FlowCanvas.svelte`: schema palette, graph/config/position/edge edits, save-before-run, results/history.
- `NodeConfigPanel.svelte`: schema-driven string configuration and deletion.
- `NlpChatPanel.svelte`: local-model conversation with validated UTF-8 text/JSON attachments.
- `CodeGenPanel.svelte`: named-file generation, dirty editing, explicit save, persisted refinement.
- `Toast.svelte`: escaped status/error feedback. `main.js`: generated `App.js` mount entry.

Current `straw-app/README.md:29-58` accurately describes this bounded desktop slice: real IPC, camelCase contracts, text-only attachments, local model defaults, and refinement saved before display replacement. Checked handlers in `src-tauri/src/lib.rs:27-129`, `contract.rs:3-26`, `flow.rs:35-43`, `dag.rs:20-44,128-158`, `nlp.rs:4-37`, and `codegen.rs:143-162`; UI payload/response names agree. Flow identities come from `flow_new`; node UUIDs match NodeId serialization. No carry-forward finding for old command names, attachment casing, fake timestamps, or unsaved refinement.

Build integration is coherent statically: `main.js:2` imports generated JavaScript intentionally; `tools/frontend-build/src/main.rs:36-81` compiles each Svelte file, rewrites imports and copies the entry. Trunk pre-build hook and `index.html:7-24` supply the runtime/compute import map. Tauri enables its global bridge (`tauri.conf.json:25`). Generator docs describe the broader modular SaaS framework; their blanket production/completion claims (`docs/FINAL_VERIFICATION_REPORT.md:3-7,41`) do not establish this UI's runtime correctness. Stack output guides describe historical snapshots and do not establish acceptance of this replacement UI.

## Evidence-backed findings and patch targets

1. **P2 — Edits made during save can be incorrectly marked persisted.** `FlowCanvas.svelte:44-45` snapshots the graph, awaits IPC, then unconditionally clears `dirty`. Name input (68), dragging (87), connection controls (98-104), and `NodeConfigPanel` (9-19) remain enabled while busy. A change after request serialization remains visible but is absent from the returned row/database and marked “Saved.” Patch: pass `disabled={busy}` into the config panel; disable/guard every mutator during save/run, including drag and name/connection controls. Alternatively track an edit revision and clear dirty only when it equals the submitted revision.

2. **P2 — Changing flow identity silently discards the working draft; pending saves can override navigation.** `App.svelte:40,75,84` replaces/destroys the keyed editor without preserving its local `graph/name` (`FlowCanvas:5-6`). Selecting another flow then returning restores the older persisted record. A newly minted unsaved flow disappears entirely. Also, a delayed save still calls `onsaved` after unmount, and `App:43-45` unconditionally reactivates its row. Patch: maintain drafts/dirty state by flow ID in App or route switches through a save/discard decision; separate list-update from active-selection callbacks and ignore obsolete editor completion for selection purposes. Apply the same dirty-discard policy to CodeGen “New project” (`CodeGenPanel:44`).

3. **P2 — Sending can race attachment ingestion.** `NlpChatPanel:14-15` awaits file reads, but Send (39) has no attaching state. `send:23-28` can snapshot partial/empty attachments, then clear a document that finishes reading while model IPC is pending. Patch: add an attachment-read counter/batch promise, disable Send while reading, and atomically append a validated batch; release the state in `finally`.

## Dependencies, acceptance, confidence

Dependencies: pinned native rsvelte compiler/Svelte DOM runtime, Trunk WASM output, Tauri bridge, engine schemas/SQLite, local Ollama for live inference. Static confidence is high for contract alignment and described state races; compiled browser behavior remains unverified here. Root owns current build/test checks.

- [ ] Delay `flow_save`; attempt every editor mutation; ensure persisted data and dirty indicator agree.
- [ ] Switch away from a dirty/new flow and resolve a prior save; verify draft retention and stable selection.
- [ ] Defer `File.arrayBuffer()`, press Send, then resolve reading/model response; ensure the selected document is transmitted once and remains visible until captured.
- [ ] Smoke-test compiled UI in WebView2: startup, all schema editors, save/reopen/run/history, chat failure/retry, generation/edit/refine/save, and WASM bounds.
