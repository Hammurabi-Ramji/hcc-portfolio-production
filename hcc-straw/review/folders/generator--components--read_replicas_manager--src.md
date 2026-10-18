# Review: read_replicas_manager/src

Inventory: the only direct file is `lib.rs` (32 lines). It defines an owned endpoint list and mutable round-robin cursor, plus one two-endpoint wraparound unit test. The parent manifest declares no dependencies and Cargo uses this source as its library. No applicable ancestor AGENTS.md was found.

Specified versus actual: `docs/FINAL_VERIFICATION_REPORT.md:24` promises a round-robin database load balancer; selection does satisfy round-robin ordering for nonempty input (`lib.rs:15-17`). However, broader production/database-scaling claims (`docs/EXPANDED_SAAS_FRAMEWORK.md:11,35`; verification report `:7,41`) exceed this endpoint selector. Finance includes the component (`core/controller.py:164-174`), but generation only copies folders (`:90-96`). Searches found no application caller of `ReplicaManager` or `get_read_replica`; SQLite uses one connection (`components/database_sqlite/src/lib.rs:3-10,38-40`).

- **P2 — Contract gap: empty configuration returns an invented target.** `lib.rs:11-13` returns literal `"primary"` despite receiving no primary address. A caller cannot distinguish absence from a configured endpoint, and treating this string as a SQLite path would open a different file. Patch `new`/`get_read_replica` to require an explicit primary or return `Option`/`Result`; document fallback semantics. This is a proven API ambiguity, not an observed application misroute.
- **P2 — Requirement gap: no database integration or health policy.** `lib.rs:1-18` rotates all supplied strings unconditionally, without connectivity, lag, or read/write separation. Either describe it as a selector utility in the reports, or add an explicit database adapter and policy before claiming working scaling. Health exclusion is a proposed operational enhancement, not part of the narrow round-robin specification.

Dependencies: changing the return contract affects future adapters and the existing test; integration needs a supported database/replication design rather than assuming local SQLite supplies replicas.

- [ ] Implement explicit empty-list behavior and test empty/single/multiple endpoints.
- [ ] Scope capability documentation accurately or wire a database adapter with read routing and primary writes.
- [ ] If health gating is implemented, verify failed/stale replicas are skipped and recovery restores selection.

Confidence: high from source inspection. No tests were rerun; parent-reported 35 passing Rust tests do not establish live replication or fallback correctness.
