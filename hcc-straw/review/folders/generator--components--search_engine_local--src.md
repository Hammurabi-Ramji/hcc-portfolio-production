# Review: generator components/search_engine_local/src

Direct inventory: one 40-line Rust library, `lib.rs`, including one unit test. The adjacent Cargo manifest declares a dependency-free edition-2024 library. No applicable ancestor AGENTS.md was found. Documentation promises local full-text search (`docs/README.md:56`; `docs/EXPANDED_SAAS_FRAMEWORK.md:27`). Actual behavior is an ephemeral vector of lowercased document bodies, searched with case-insensitive contiguous substring matching; results preserve insertion order and contain document IDs. The controller copies this component into generated bundles (`core/controller.py:90–96`); template configuration selects it for ecommerce, real estate, and logistics. Copying establishes availability, not application-level search wiring.

Findings and patch targets:

- **P2 requirement gap — full-text capability is overstated.** `lib.rs:14–19` performs a linear `contains` scan, without tokenization, term combination, ranking, pagination, or persistence. For example, `quick fox` cannot match `quick brown fox`, while `he` matches `the`. The docs do not define query semantics, so those examples demonstrate limitations rather than a proven violation of a detailed contract. Either describe this as in-memory substring search in the component and capability docs, or replace the scan with explicitly specified token-based matching and a maintained local index. Avoid claiming production readiness from the happy-path test.
- **P2 lifecycle gap — repeated IDs retain stale content.** `lib.rs:10–11` always appends; indexing `doc1` twice can return duplicate IDs, and replacing its body leaves the old body searchable. No update/delete contract exists. Define that contract, then use keyed storage/upsert and a removal API if IDs represent mutable records; otherwise document append-only behavior and duplicate results. This is a proposed lifecycle correction, not evidence of an existing caller failure.

Dependencies: Rust/Cargo; controller and bundled component copies must receive agreed behavior changes. Confidence is high in inspected semantics, moderate in product expectations. Existing test (`lib.rs:28–38`) checks only two substring queries; parent reports 35 tests passed. I ran no additional builds, benchmarks, or runtime checks.

- [ ] Specify token, empty-query, ordering, duplicate-ID, and persistence behavior.
- [ ] Verify mixed-case queries, repeated-ID updates, removal, and agreed multi-term semantics.
- [ ] Confirm generated consumers invoke the library and document realistic dataset limits.
