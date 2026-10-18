# Review: components/read_replicas_manager

Inventory: all three direct files reviewed with numbered lines: `.gitignore` (one `/target` exclusion), `Cargo.toml` (six lines), and `replicas.rs` (32 lines). The nested `src` folder is separately reviewed in `generator--components--read_replicas_manager--src.md`; `.git` is repository metadata, outside source review. No applicable ancestor AGENTS.md was found.

Specified versus current: `docs/FINAL_VERIFICATION_REPORT.md:24` specifies round-robin database load balancing; `docs/EXPANDED_SAAS_FRAMEWORK.md:11` includes read replicas in the data layer. The implementation rotates endpoint strings and has a wraparound test (`replicas.rs:11-17,25-30`). This satisfies the narrow selector behavior, not the broader production-ready claim (`docs/FINAL_VERIFICATION_REPORT.md:41-44`). The workspace includes this crate (`Cargo.toml:30` at repository root), and the finance preset selects it (`core/controller.py:164-174`), but generation copies its directory (`:90-96`), not database routing.

- **P2, contract gap shared with canonical source:** empty configuration returns the invented string `"primary"` (`replicas.rs:11-13`). An explicit primary endpoint or `Option`/`Result` contract is needed before an adapter can reliably use the output. This is an API ambiguity, not evidence of an observed live routing failure; canonical source and integration findings are owned by the child report.
- **Maintenance improvement:** `replicas.rs` and `src/lib.rs` have identical SHA-256 hashes. The parent manifest has no `[lib]` path override (`Cargo.toml:1-6`), so Cargo compiles `src/lib.rs`; the direct legacy file and its test are not independently compiled. No current drift is present. Retaining two editable copies risks fixing an inactive file, and the generator copies both.

Concrete patch targets: establish `src/lib.rs` as canonical and remove `replicas.rs` after checking any external consumers, or explicitly document/generate the legacy copy. Apply the empty-list contract change in canonical source and update any retained copy together. No changes are warranted for `.gitignore` or the dependency-free selector manifest itself. Database integration requires a supported replication adapter and caller policy; adding crate dependencies alone does not establish scaling.

- [ ] Resolve canonical/legacy file ownership and ensure generated output contains the intended source.
- [ ] Implement explicit empty-list behavior; verify empty, single, and wraparound selections.
- [ ] Align scaling claims with a demonstrated database caller or document this as an endpoint selector.

Acceptance: Cargo uses the chosen source; edits cannot silently affect only an inactive duplicate; generated finance output builds and its read/write routing behavior is demonstrated before claiming database scaling. Confidence high for direct-file evidence. No installs, network calls, builds, or tests were run in this review.
