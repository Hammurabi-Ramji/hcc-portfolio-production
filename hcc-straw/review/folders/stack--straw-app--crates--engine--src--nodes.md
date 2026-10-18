# Current review: engine/src/nodes (index 139)

Reviewed 2026-10-09. Scope is the replacement desktop's current sources, not removed `src-tauri/src/nodes`. All 12 direct files were read with numbered lines: `mod.rs`, `conditional.rs`, `csv_parse.rs`, `filter.rs`, `http_request.rs`, `join_text.rs`, `llm_prompt.rs`, `read_file.rs`, `template.rs`, `text_input.rs`, `transform.rs`, `write_file.rs`. No applicable ancestor AGENTS.md was found. No application source was changed.

## Existing versus specified behavior

`mod.rs:89-123` registers and dispatches the same eleven schemas. Values support text, numbers, booleans, lists, tables and null; schema fields serialize camelCase, matching `node_schemas` and `ui/NodeConfigPanel.svelte:6-15`. Text input and transform operations have concrete implementations. HTTP and LLM delegate to the shared loopback client (`network.rs:35-115`), retaining endpoint, redirect, proxy, size and deadline restrictions from the current README. Explicit operator file paths are intentionally unrestricted by the separate generated-output guard; this is documented behavior, not a new security finding.

The current README requires invalid graphs to execute no nodes and run failures to persist. Historical `output/NODE_REFERENCE.md:19-71` describes CSV, newline joining and conditional branching; `output/TESTING_GUIDE.md:129-134` explicitly wires both branches to file writers. Those guides establish feature expectations, not proof that old desktop code remains current.

## Findings and concrete patch targets

1. **P1 — Missing or wrong-typed content destroys files.** `write_file.rs:42-56` converts absent/non-text content to `""`, then overwrites the destination successfully. A disconnected writer passes `dag.rs:74-103`; a count transform supplies Number and has the same effect. Replace `unwrap_or("")` with missing/type errors before opening the file. Coordinate required-input/type validation with the DAG owner so graph errors cannot follow earlier side effects.

2. **P1 — Conditional executes the inactive branch.** `conditional.rs:30-36` emits Null for the inactive output, while `dag.rs:167-185` schedules every node and forwards Null normally. Both connected writers execute; the inactive writer currently truncates its file. Introduce an explicit inactive-edge/skipped-node contract and scheduler propagation, including merge semantics. Merely rejecting Null prevents truncation but makes legitimate branching fail instead of skip.

3. **P1/P2 — CSV panics and headerless parsing cannot work.** `csv_parse.rs:42-45` indexes byte zero of an optional string; `delimiter=""` panics, bypassing normal run finalization (`db.rs:111-132`). Reject empty/multiple-byte/unsupported delimiters with NodeError. At `:46-60`, `has_header=false` still deserializes HashMap; cached csv-1.4.0 `deserializer.rs:494-502` invokes a sequence visitor without headers, incompatible with that map target. Read records and assign documented positional keys when headerless, or remove that option explicitly. Preserve the first data row.

4. **P2 — Template default has no connectable variable.** `template.rs:10,16,28-37` advertises only `vars`, but substitutes flat input keys; the default `{{name}}` stays unresolved through any valid editor edge (`dag.rs:93-96`). Define a vars map/JSON contract and resolve its keys, or advertise a matching scalar placeholder; avoid iteration-dependent recursive replacement.

5. **P2 — Encoding selector is ignored.** `read_file.rs:22-27` offers latin1, but `:37` always uses UTF-8 `read_to_string`. Implement selected decoding or remove the unsupported choice; latin1 bytes must not silently follow UTF-8 semantics.

6. **P2 — Defaults differ by caller.** `join_text.rs:16,37` advertises newline but omitting config joins without a separator. `llm_prompt.rs:17,56` makes UI-created nodes use llama2 while omitted config/current README use llama3.2; system defaults also differ (`:25,71`). Centralize defaults or normalize config consistently before dispatch. UI creation eagerly materializes schema defaults (`FlowCanvas.svelte:25-28`).

7. **P2 — Lists silently lose non-text entries.** `filter.rs:56-59` and `join_text.rs:30-33` discard non-text members and still succeed. Reject incompatible members with indexed errors, or document and implement an explicit conversion policy. Filter threshold/condition parsing (`:63-75`) should likewise reject invalid values rather than silently selecting zero/all-rejected behavior.

## Dependencies, acceptance and confidence

Dependencies: DAG validation/scheduling and result serialization owner; UI schema/config owner; shared network client; csv/serde; filesystem; local Ollama for live inference. Existing `tests.rs` covers dispatch serialization and a basic pipeline, not these cases. Root's current `desktop-current-cargo-test.log` stops at locked Cargo.lock drift; no compilation or runtime verification is claimed. No installs, network, broad checks or agent spawning occurred. Confidence is high for source-proven findings; proposed branch/vars semantics require contract agreement.

- [ ] Reject missing/wrong-type writer content before touching an existing sentinel file.
- [ ] Test both conditional outcomes: only the selected branch writes, with explicit skip/merge results.
- [ ] Test empty/multibyte delimiters and headerless rows; persist terminal failure, never panic.
- [ ] Exercise template variable substitution, latin1 decoding, schema/executor default parity and mixed-list rejection.
- [ ] After the proposed node fixes, run focused regression cases and one real UI-to-engine flow for every node kind.


## Final verification update from the root reviewer

Subsequent current-source `cargo test --workspace --offline --locked` passed all 15 tests (12 engine,2Axum,1WASM), superseding interim lock/sandbox failures quoted above. An isolated clean native compiler build passed and all 150 generated browser files match saved output, with no extras. Current verification documentation now exists. These results do not verify live native UI/model behavior or cover the proposed new regression cases. See review/desktop-current-full-tests.log, frontend-copy-comparison.json and source-stability.json.
