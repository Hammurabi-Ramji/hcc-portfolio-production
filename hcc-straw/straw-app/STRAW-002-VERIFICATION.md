# STRAW-002 — standalone run-ledger core

Delivered scope: `crates/straw-ledger`, registered in the Cargo workspace, with zero normal, build, or development dependencies. The supplied seed's syntax error was removed. This is an in-memory core; existing SQLite workflow runs are not yet protected by this ledger.

## Lifecycle and import boundary

`Ledger<Open>` accepts append operations. Consuming `seal()` produces `Ledger<Sealed>`. Consuming `verify_chain()` either returns a chain error or produces `Ledger<ChainVerified>`, which exposes only immutable record access and the head hash. Private fields prevent callers from directly manufacturing a verified state.

`Ledger<Sealed>::from_records(records, expected_head)` supplies the missing reconstruction seam for a future persistence adapter. It preserves the supplied rows without repair or sorting and grants no verified access before checking sequence, predecessor links, record hashes, and the expected head. The adapter must load rows in sequence order and supply a trusted checkpoint when rollback detection is required.

The digest commits to big-endian sequence, predecessor hash, big-endian timestamp, big-endian UTF-8 payload byte length, and exact payload bytes. Timestamps are supplied by the caller; the core neither reads a clock nor imposes timestamp units or ordering. Determinism applies to identical ordered inputs, not different textual serializations of equivalent structured data.

## Verification

- Ledger suite: 15 runtime tests and 5 compile-fail documentation tests passed, including the final Unicode digest case in the full workspace run.
- SHA-256 coverage includes independently generated .NET digests at block/padding boundaries, several update chunk sizes, empty updates, the supplied `abc` vector, and the million-`a` vector. An independent Unicode record digest checks field ordering and byte-length framing.
- Tamper coverage includes payload, timestamp, stored digest, genesis/predecessor link, sequence, reordered/duplicated/deleted rows, suffix truncation, empty-chain replacement, and whole-chain replacement against a trusted head.
- Compile-fail checks prevent append on sealed/verified ledgers, verification on an open ledger, receipt access before verification, and reuse of the open ledger after sealing.
- `cargo tree --offline -p straw-ledger`: only the crate itself; zero dependencies.
- `cargo clippy --offline -p straw-ledger --all-targets -- -D warnings`: passed.

- `cargo test --workspace --offline`: 68 runtime tests and 5 compile-fail documentation tests passed, including the real loopback fixtures. This includes existing desktop lifecycle tests and does not imply those tests were added as part of this ledger task.
- `cargo fmt -p straw-ledger --check`: passed. `cargo fmt --all --check` reported formatting differences in the existing desktop shell and PWA build helper; those files were not reformatted during this task.
- The new crate and this report have zero hits for the existing literal source gate. The separate upstream source conflict remains outstanding.

## Boundaries

A self-consistent chain is not an authenticated receipt. An attacker able to rewrite all records and replace the expected head can create another valid chain. Suffix truncation is detectable against an independently trusted head; using the last row of the same mutable database as the expected head does not provide that protection. Tests explicitly demonstrate this distinction. There are no signatures, external checkpoints, operator identity checks, approval actions, or durable transactions in this core.

Typestate enforces the API lifecycle; it does not prove human approval or enforce seal-before-release across an application that has not yet integrated it. No broad security certification or panic-free allocation claim is made for the supplied hashing implementation.

Persistence and startup verification remain deferred. The actual app uses `rusqlite`, rather than the attachment's stated `sqlx`. A future adapter needs transactional append/checkpoint handling, a trusted-head policy, corruption diagnostics without deleting evidence, and startup verification before workflow execution. No database schema or startup hook was changed in this delivery.

STRAW-001's literal source gate and observed browser acceptance remain outstanding and are not resolved by this core crate.
