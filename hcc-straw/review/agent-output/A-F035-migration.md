# A-F035 migration — DONE

Remaining STACK-F035 item: shutdown-only migration for ownerless legacy Running rows as a separately controlled upgrade path. No user database was migrated.

## Scope

- Edited only `straw-app/crates/engine/src/**` (not `nodes/`).
- Ordinary `DbState::open` still leaves ownerless Running rows untouched.
- Operator path: stop all processes using the DB, backup, then call `DbState::migrate_ownerless_legacy_running` (embeds `offline-legacy-migration.sql`).

## Files changed

| Path | Change |
|------|--------|
| `straw-app/crates/engine/src/offline-legacy-migration.sql` | Documented SQL: ownerless Running → Failed + `finishedAt`; owned/terminal preserved; transactional |
| `straw-app/crates/engine/src/db.rs` | `OWNERLESS_LEGACY_RUNNING_MIGRATION_SQL`; `migrate_ownerless_legacy_running()` (opt-in, idempotent, returns pending count) |
| `straw-app/crates/engine/src/schema.sql` | Comment points at controlled upgrade API |
| `straw-app/crates/engine/src/tests.rs` | `shutdown_only_ownerless_legacy_migration_is_opt_in_and_idempotent` on isolated tempfile DB |

## Verify

CWD: `C:\IEDB\STRAW Stack\straw-app`

1. Filtered: `cargo test -p straw-engine --offline --locked ownerless_legacy -- --nocapture`  
   - Exit **0** — 2 passed (`ownerless_legacy_running_is_not_falsely_recovered`, `shutdown_only_ownerless_legacy_migration_is_opt_in_and_idempotent`)  
   - Log: [A-F035-migration-test.log](A-F035-migration-test.log)

2. Full crate: `cargo test -p straw-engine --offline --locked -- --nocapture`  
   - Exit **0** — **44** passed; 0 doc-tests  
   - Log: [A-F035-migration-engine-full.log](A-F035-migration-engine-full.log)

## Acceptance covered

- Migration exists in-tree and is not applied by `open`.
- Changes only ownerless Running rows; sets finish timestamp; preserves owned Running and completed rows; second apply is a no-op.
- Tests use ephemeral fixture DBs only; **no real user database was opened or migrated**.

## Blockers

None.
