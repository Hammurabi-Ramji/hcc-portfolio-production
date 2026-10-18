# Folder 113 — Desktop no-code backend

Scope: `C:\IEDB\STRAW Stack\straw-app\src-tauri\src\no_code`, nine direct files: `mod.rs`, `types.rs`, `database.rs`, `executor.rs`, `workflow_executor.rs`, `tests.rs`, `main.rs`, `build.rs`, and `001_init_schema.sql`. All were read with numbered lines. No applicable ancestor AGENTS.md was present. Source was not changed.

The folder supplies two competing workflow executors, SQLite initialization/save, value types, and four unit tests. `mod.rs:1-5` compiles both executors but excludes its copied application entrypoint and build script. Required behavior is durable workflow CRUD/history, execution according to edges/ports, configurable operations, and honest outcome reporting. Generator docs describe sovereign desktop-first applications; Stack `output/CODEBASE_VERIFICATION_REPORT.md:39,168-174` marks this module complete and free of stubs. The implementation contradicts those claims. The separate Next.js web guide does not establish desktop workflow integration.

## Findings and concrete patch targets

1. **P1 — Registered commands lack managed state and usable CRUD.** `database.rs:203-206` and `workflow_executor.rs:541-547` require `State<DbState>`, but the real `src-tauri/src/lib.rs:101-120` registers them without `.manage(DbState(...))`; invoking either cannot resolve state. The execution command additionally expects `definition/input`, while `src/no-code/useWorkflow.ts:91-94` sends `workflow_id/input_data`. Other hook commands are absent from the actual handler. Copied `main.rs:29-193` is excluded by `mod.rs`, references missing Database methods and summary types, and `import_workflow:191-192` returns `Result<(), String>` despite its String signature. Patch: implement a compiled commands module, manage application-data DB state during setup, register CRUD/history/templates, and agree on IPC arguments/return types. Do not simply register the copied main.

2. **P1 — Active execution ignores the graph and downstream values.** `workflow_executor.rs:489-504` runs every node in vector order, ignores all edges, and saves outputs only under node IDs; executors repeatedly read the unchanged `value`. Input→uppercase→output therefore receives the original input downstream. Both conditional outputs can execute. Alternate `executor.rs:120-123` follows only the first edge and has no visited/cycle guard. Patch: retain one executor, validate IDs/endpoints/cycles, schedule reachable nodes by dependencies, resolve port inputs, and select conditional edges. Capture log inputs before adding outputs (`workflow_executor.rs:509`).

3. **P1 — UI node/config contracts differ.** Active dispatch registers `transform/if_then/save/email` (`workflow_executor.rs:457-466`), whereas sample/UI nodes use `logic/output` (`src/no-code/workflows.ts:30,40,50,60`); valid samples fail with NodeNotFound. `NodeConfig.extra` lacks flattening (`workflow_executor.rs:81-86`), while sample email fields are top-level (`workflows.ts:63-64`), so recipient settings disappear. Patch: define one operation identifier and configuration schema across Rust/UI, migrate samples, and reject unsupported configs explicitly.

4. **P1 — Successful statuses conceal absent effects.** `workflow_executor.rs:264-275` saves only to transient context and reports “saved”; email reports “sent” without transport (`332-339`). Alternate `executor.rs:245-287` similarly fabricates DB/CSV/email/webhook completion. Patch: wire persistence/email services or return explicit unsupported errors; seed actual template graphs instead of empty arrays (`database.rs:153-166`).

5. **P2 — Incorrect conditions, network failures, and CSV.** `workflow_executor.rs:554-569` defaults unsupported conditions to true and malformed thresholds to zero; `>=` is misparsed. AI silently returns empty text for error JSON (`380-392`), and webhook treats HTTP failures as success (`428-440`). CSV emits unordered `key=value,` cells without quoting (`291-304`). Patch: structured comparison parsing with errors, HTTP status/schema validation and timeouts, and the existing `csv` dependency with stable headers/escaped fields.

6. **P2 — Saving resets workflow metadata.** `database.rs:183-194` uses INSERT OR REPLACE, resetting creation time and execution counters to defaults. Patch with ON CONFLICT UPDATE of editable columns; use one versioned migration instead of divergent inline/SQL schemas, explicitly enable foreign keys, and preserve history transactionally.

## Acceptance and confidence

Dependencies: real Tauri setup/IPC caller, SQLite migrations, UI node schema, email transport, HTTP clients. High confidence in static findings; no builds/tests/network/installations run. Existing tests cover only isolated nodes and a two-node transform, not integration or propagation.

- [ ] Fresh-launch IPC: initialize, save, load, execute, restart, history, delete.
- [ ] Shuffled-node DAG, fan-out/merge, true/false routes, cycles/dangling edges, output propagation.
- [ ] Sample/config round-trip; malformed conditions; HTTP 500/timeouts; CSV commas/quotes/newlines.
- [ ] Re-save preserves created_at/counters/history; effects verified independently; templates execute.
