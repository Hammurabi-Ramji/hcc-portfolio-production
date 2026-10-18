# Current folder review: straw-app/crates/axum-loop/src

Scope: registry index 136; sole direct file `lib.rs` (90 lines), read completely with numbered lines. No applicable ancestor AGENTS.md found. Adjacent manifests, current engine DB/flow types, Tauri lifecycle, and README were inspected for integration only. No source edits, network access, installations, or tests performed.

## Current versus specified behavior

`straw-app/README.md:36` specifies read-only `/health` and `/flows` on `127.0.0.1:8741`. `lib.rs:8-14,27-28` implements that production binding and those GET routes. `serve` additionally refuses a supplied listener whose IP differs from literal IPv4 localhost (`:36-38`), so wildcard/IPv6 listeners cannot bypass the binding policy. `/flows` invokes the actual shared SQLite `DbState::list` on a blocking worker and serializes `FlowRecord` (`:17-24`); engine `db.rs:26-38` reads stored JSON rows and `flow.rs:35-43` defines camelCase fields. `/health` is process liveness, not database readiness; no readiness claim appears in the current API contract.

Startup opens SQLite and binds before successful Tauri setup (`src-tauri/src/lib.rs:156-168`), so an occupied production port fails initialization. Tauri clones the same database into the server and manages the oneshot sender. `lib.rs:39-43` supports graceful shutdown on signal or sender drop. Tauri sends at Exit (`src-tauri/src/lib.rs:173-177`) but does not await the stored handle; completed desktop draining remains an integration verification gap for that caller's owner, not proof that this API's shutdown future is defective. Historical output guides and Generator completion claims do not establish current desktop correctness.

## Finding and patch target

**P2 — the integration test reserves the application's fixed port.** `lib.rs:59,65,78` binds 8741 and hardcodes both requests. Running `cargo test` while STRAW Desk is open, or concurrently in two checkouts, causes `bind().await.unwrap()` to fail with address-in-use. The test should own an ephemeral localhost listener while the separate constant test (`:50-52`) continues checking the production address.

Proposed diff in `lib.rs:59`:

```diff
-        let listener = bind().await.unwrap();
+        let listener = tokio::net::TcpListener::bind((Ipv4Addr::LOCALHOST, 0)).await.unwrap();
+        let address = listener.local_addr().unwrap();
```

Change both blocking closures to `move ||`, and replace the hardcoded URLs with borrowed `format!("http://{address}/flows")` and `format!("http://{address}/health")` values. Production `bind()` remains fixed.

## Dependencies, acceptance, confidence

Depends on workspace Axum 0.7/Tokio, engine DB/serialization, and dev-only tempfile. Existing test exercises real SQLite plus health and awaits clean service completion (`:55-88`). Coverage improvements: assert parsed flow equality instead of substring presence; reject wildcard/IPv6 listeners; verify shutdown releases the listener. These are proposed checks, not additional proven runtime bugs.

- [ ] Isolate the HTTP integration test on an ephemeral loopback port; pass beside an app occupying 8741 and in concurrent test processes.
- [ ] Add focused listener-rejection and shutdown/rebind checks; have the Tauri owner verify desktop exit completion.
- [ ] Root reruns current offline checks after resolving lockfile state.

Confidence: high for source contracts and fixed-port collision; runtime unverified by this reviewer. Saved `review/desktop-current-cargo-test.log` currently reports a locked-file update refusal before tests run; older desktop logs are historical. The formerly absent `STRAW-001-VERIFICATION.md` was subsequently added and reviewed in the package report.


## Final verification update from the root reviewer

Subsequent current-source `cargo test --workspace --offline --locked` passed all 15 tests (12 engine,2Axum,1WASM), superseding interim lock/sandbox failures quoted above. An isolated clean native compiler build passed and all 150 generated browser files match saved output, with no extras. Current verification documentation now exists. These results do not verify live native UI/model behavior or cover the proposed new regression cases. See review/desktop-current-full-tests.log, frontend-copy-comparison.json and source-stability.json.
