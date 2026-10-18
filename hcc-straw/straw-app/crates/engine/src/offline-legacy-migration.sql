-- OPERATOR PROCEDURE, not executed by DbState::open.
-- Call DbState::migrate_ownerless_legacy_running only during a controlled upgrade:
-- 1. Stop every desktop/API process using this database.
-- 2. Confirm no engine process remains; take a SQLite backup.
-- 3. Ensure the current schema (including desk_run_owners) is initialized.
-- 4. Keep all other processes stopped; apply once; then start the new version.
-- A transaction alone does not prove a model-calling process is dead.
-- Owned Running rows and terminal rows are left unchanged.
BEGIN IMMEDIATE;
UPDATE desk_runs
SET result=json_set(
    result,
    '$.status',json_object('kind','failed','failedNode',NULL,
        'error','interrupted: ownerless legacy execution reconciled during verified offline upgrade; side effects were not replayed'),
    '$.finishedAt',strftime('%Y-%m-%dT%H:%M:%fZ','now')
)
WHERE json_extract(result,'$.status.kind')='running'
  AND NOT EXISTS (SELECT 1 FROM desk_run_owners WHERE run_id=desk_runs.id);
COMMIT;
