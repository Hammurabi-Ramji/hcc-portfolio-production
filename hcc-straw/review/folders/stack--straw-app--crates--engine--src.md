# Current engine source review — index 138

Reviewed the replacement tree on 2026-10-09, not the removed desktop implementation. Scope: every direct file (`lib.rs`, `contract.rs`, `dag.rs`, `db.rs`, `flow.rs`, `network.rs`, `nlp.rs`, `codegen.rs`, `schema.sql`, `tests.rs`). Node implementations have their own report; inspected schemas/callers only for integration. No applicable ancestor `AGENTS.md` was found.

## Existing behavior and documentation

The crate exports real generation/refinement, typed UUID flows, schema-aware topological execution, SQLite CRUD/run history, and a synchronous loopback-only Ollama client. `contract.rs:4-26` and graph/flow serializers agree with current UI camelCase. `flow.rs:16-21` rejects invalid/nil flow IDs. `schema.sql:1-12` enables WAL, foreign keys, and cascading run deletion. `lib.rs:1-11` correctly exports modules and includes tests. `nlp.rs:21-37` validates roles and text/JSON attachment size; `network.rs:7-31,48-85,94-115` restricts literal loopback, disables proxies/redirects, bounds bodies, and checks model settings/responses.

Current `straw-app/README.md:44-60` is substantially supported. Historical `output/ENGINES_IMPLEMENTATION_GUIDE.md:36,49,259,280` promises multimodal attachments, localhost URLs, reqwest and configurable networking; these differ deliberately from current text-only/literal-loopback/ureq behavior. Generator `docs/FINAL_VERIFICATION_REPORT.md:3-7,36-44` and `EXPANDED_SAAS_FRAMEWORK.md:35-45` are broad historical claims, not proof of this replacement's production readiness. `output/WEB_PLATFORM_SUMMARY.md` describes the separate web app. Legacy graph import is explicitly excluded by current README:44, not an accidental missing migration.

Fixed legacy concerns must stay closed: UUID flow identity, named multi-file parsing, current-content refinement preserving IDs, non-placeholder DAG execution, persistent running/final statuses, and strict wire casing now have implementations and tests. Current UI saves before executing (`ui/FlowCanvas.svelte:43-53`) and saves refinements before displaying them (`ui/CodeGenPanel.svelte:29-35`); Tauri delegates blocking work off its async runtime (`src-tauri/src/lib.rs:19-24`).

## Findings and concrete patch targets

1. **P2 — generation can partially commit a conflicting batch.** `codegen.rs:174-189` checks exact duplicates but accepts paths ordered `a/b.txt`, `a`. Staging creates directory `a`; commit saves the child, then fails the second existence check (`209-216`). The returned error discards the result list (`generate:241`); UI displays only an error (`CodeGenPanel.svelte:16-19`), while retry refuses the already-written child. Before `create_dir_all`, reject directory/file prefix collisions using normalized path components, reject existing directory destinations, and add a staging cleanup guard. Suggested preflight addition:

```diff
 // after complete path/identity validation, before creating the root
+for a in &unique {
+    for b in &unique {
+        if b.strip_prefix(a).is_some_and(|tail| tail.starts_with('/')) {
+            return Err("file/directory path conflict".into());
+        }
+    }
+}
```

   Remaining I/O failures (`194-206,216`) also leave temporary files or earlier committed destinations. Add explicit rollback/backups or return structured partial outcomes; staging alone is not batch atomicity. Preserve no-overwrite guarantees using an atomic no-clobber commit rather than `exists()` followed by rename.

2. **P2 — graph preflight misses statically detectable errors.** `dag.rs:74-103` validates required configuration presence and supplied edge names, but neither missing mandatory connections nor select values/types. A disconnected `transform` passes validation and fails only in execution (`nodes/transform.rs:52-56`); earlier ready side-effect nodes can already run. This limits README:46's “invalid graphs execute no nodes.” Extend node schemas with required/optional input and type metadata, validate connectivity/config choices before constructing `AcyclicGraph`, and retain optional HTTP body behavior. Child-node runtime defaults/branch semantics remain the child review's scope.

3. **P2 recovery gap — interrupted runs remain running permanently.** `db.rs:111-132` persists Running then updates only after normal return; `open:19-24` never reconciles stale runs. Closing/crashing during a model call leaves restart history claiming running (`FlowCanvas.svelte:107`). At application startup, mark prior-session Running records failed/interrupted with a real finish timestamp; never replay side effects automatically. Coordinate session ownership with Tauri startup if multiple engine instances are supported.

## Dependencies, acceptance, confidence

Dependencies: serde/JSON, UUID, chrono, bundled rusqlite, thiserror, csv and ureq; consumers are Tauri commands, Axum read routes and Svelte UI. Schema additions require coordinated node/UI changes.

- [ ] Reject both prefix-collision orderings before any destination write; verify original files and no staging remnants after forced failures.
- [ ] Reject disconnected mandatory inputs/config choices before any file/network side effect; retain optional inputs and valid DAG ordering/failure persistence.
- [ ] Restart after an interrupted run shows a terminal interrupted status and no re-execution.
- [ ] Add local fixture coverage for model response/status/body limits, redirects/proxy disabling, successful chat, generation and refinement.

High confidence in static findings. All 12 tests were read; coverage includes contracts, SQLite restart, DAG completion/failure, parser/path guards and image rejection, but not these failures. No builds, tests, installs or network requests were run. Root's current-tree checks supersede historical logs; live model/desktop behavior remains unverified here.


## Final verification update from the root reviewer

Subsequent current-source `cargo test --workspace --offline --locked` passed all 15 tests (12 engine,2Axum,1WASM), superseding interim lock/sandbox failures quoted above. An isolated clean native compiler build passed and all 150 generated browser files match saved output, with no extras. Current verification documentation now exists. These results do not verify live native UI/model behavior or cover the proposed new regression cases. See review/desktop-current-full-tests.log, frontend-copy-comparison.json and source-stability.json.
