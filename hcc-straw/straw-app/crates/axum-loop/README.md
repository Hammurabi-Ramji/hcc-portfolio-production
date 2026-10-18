# axum-loop

Read-only STRAW Desk loopback API. Production bind is literal **127.0.0.1:8741** (`BIND_ADDRESS`). Routes: `GET /health`, `GET /flows`. Browser Origin is restricted to the local PWA (`http://127.0.0.1:8081`).

## Package invariants (STACK-F032)

This crate's direct ownership is the package manifest and this README. Keep:

- workspace membership under `straw-app` (`members` / `default-members`)
- sibling `straw-engine` path dependency (`../engine`)
- `tempfile` confined to `[dev-dependencies]` for real SQLite integration tests

Do not move Axum/Tokio versions out of the workspace inheritance without a workspace-owner change.

From `straw-app/`:

```powershell
cargo test --offline --locked -p axum-loop
cargo tree -p axum-loop --offline --locked
```

## Handoff — STACK-F033 (`src/` listener tests)

**Owner:** A-F033 · `straw-app/crates/axum-loop/src`

F032 does not patch `src/` tests. F033 owns:

1. **Ephemeral-port isolation** for the HTTP integration test: bind `(127.0.0.1, 0)`, keep the production-address constant test on 8741, and prove the suite passes while 8741 is occupied and under concurrent `cargo test` processes.
2. **Focused listener rejection** (non-loopback / wildcard / IPv6) and **shutdown/rebind** checks that the port is released after `serve` completes.

Crate-level coordination note: current `src/lib.rs` already exercises ephemeral bind, production-port hold-aside, reject-non-loopback, and `graceful_shutdown_releases_listener_for_rebind`. F033 remains the acceptance owner for those cases (including concurrent/occupied-8741 proof) and any further `src/` patches.

## Handoff — STACK-F046 (Tauri exit verification)

**Owner:** A-F046 · `straw-app/src-tauri/src`

F032 does not edit Tauri. F046 owns desktop lifecycle proof that:

1. setup bind failures on occupied **127.0.0.1:8741** are reported
2. Axum routes share the shell `DbState`
3. `RunEvent::Exit` takes `LoopService`, signals graceful shutdown, and joins (or times out/aborts) the listener task — recorded in the promised verification document

API-crate `serve` graceful shutdown on oneshot is the callee contract; completed desktop draining remains F046 verification, not an axum-loop manifest change.
