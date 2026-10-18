# Folder review: straw-app/src/lib (index 40)

Reviewed all ten direct files: six Svelte components (flow canvas/node/config, chat, generation, toast), stores, TypeScript contracts, IPC wrappers, and WASM initialization. No ancestor AGENTS.md was found. Requirements consulted: generator README/docs README, EXPANDED_SAAS_FRAMEWORK and FINAL_VERIFICATION_REPORT; Stack NLP_AI_CODE_CREATION_GUIDE and FINAL_VERIFICATION_100PCT. This desktop interface must reliably save/run graphs, transmit attachments, generate/refine identifiable files, and reflect asynchronous state. Registered commands are in src-tauri/src/lib.rs, not the unused code_gen directory.

## Prioritized findings and patch targets

1. **P1 — Attachment IPC rejects every attachment.** types.ts:83-84 and NlpChatPanel.svelte:85,123,150,177 send `mimeType`/`sizeBytes`; registered nlp.rs:11-12 requires `mime_type`/`size_bytes` without serde aliases. `mime_type` is required, so requests with attachments cannot deserialize. Patch tauri.ts:28-29 with an explicit request serializer, or align frontend fields and all construction/display sites with Rust. Empty-attachment text requests have the matching outer request fields.

2. **P1 — Generated-file identity is fictitious.** types.ts:130-138 requires `id`/`is_dirty`, but registered codegen.rs:8-13 returns only path/language/content/is_new. CodeGenPanel.svelte:90 copies raw results into a keyed list at :260; multiple files share undefined keys, while :123 and :140 match/delete all undefined IDs. Introduce separate wire/UI types and normalize results into unique stable IDs plus dirty flags in tauri.ts; test against actual serialized Rust payloads. Correct :178 to `result.project_name`. Normalize empty flow IDs at FlowCanvas.svelte:23 (`record?.id || null`): route +page.svelte:35 constructs `id: ""`, while Rust lib.rs:37 generates UUIDs only for None, otherwise new flows reuse one empty ID.

3. **P1 — Frontend checking currently fails.** Saved review/svelte-check.log identifies CodeGenPanel.svelte:30 (missing CreationResult import), :213 (object style instead of string/style directive), and :306 (nullable selectedFile captured in callback). Import the type at :10-13, use `style:width`, and guard/capture the selected file. Historical zero-error claims are contradicted by this evidence; the saved check reports 247 errors overall, not all owned here.

4. **P1 — Flow edits stop being saveable; run state/output stays stale.** FlowCanvas.svelte:41-43 has an effect with no reactive reads: it marks dirty once, then save resets it at :148 and later graph/config/name changes never mark dirty. Add mutation-aware dirty tracking or compare against a saved snapshot. At :158-164, `get(store)` inside `$derived` does not subscribe to subsequent store updates; replace with `$executionResult`, `$running`, `$schemas` and `$schemasByKind` (:57). Disable repeat runs, clear old execution state, and report returned node errors rather than always showing success at :134.

5. **P2 — Refinement and settings lose their intended behavior.** Generation :76 reads codeGenModel while selector :236 updates only local model. Bind both requests to one settings source. Refinement :123 writes `isDirty` instead of `is_dirty`, retains the stale selectedFile object, and never exits refining (:107-132). Update by stable ID, derive selection from current files, and terminate both success/error stages. Request :111-117 supplies only a relative path; Rust codegen.rs:269-272 never reads/sends existing content, and :316-320 never saves refinement. Extend the request with content and implement explicit persistence. OutputDir's empty store (:45; store.ts:54) replaces its default with no editor/chooser. Provide a usable destination control.

6. **P2 — Uploaded text is corrupted; advertised context integration is absent.** NlpChatPanel.svelte:111 splits plain text at commas, and :118 attempts base64 decoding already decoded text; a CSV becomes its second field and base64-looking text becomes gibberish. Preserve readAsText results; decode only genuine data URLs. PDF/DOCX/audio are sent as encoded bytes instead of extracted text/transcripts (backend nlp.rs:54-72). CodeGenPanel imports neither chat store, contrary to guide:38-42. Add extraction/transcription and an explicit conversation-context handoff, or accurately limit the UI/docs.

## Dependencies, acceptance, confidence

Depends on registered Rust serde contracts, Svelte 5 stores, XYFlow, Ollama, and the existing wasm-compute package (wasm.ts exports match its declarations). High confidence in source/contract findings; no installs, network, source edits, builds, or runtime tests were performed here. Root's saved check was inspected.

- [ ] Make folder-owned svelte-check diagnostics pass.
- [ ] Exercise native attachment IPC and a two-file generation response.
- [ ] Save two new flows; edit/save/reopen each and verify distinct IDs.
- [ ] Verify live running/results, returned node failures, model choice, completed refinement/persistence.
- [ ] Preserve CSV/Unicode uploads and verify destination/context handoff.
