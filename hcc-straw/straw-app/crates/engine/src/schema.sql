PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS desk_flows (
    id TEXT PRIMARY KEY NOT NULL,
    record TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS desk_runs (
    id TEXT PRIMARY KEY NOT NULL,
    flow_id TEXT NOT NULL REFERENCES desk_flows(id) ON DELETE CASCADE,
    result TEXT NOT NULL
);


-- Each Running record belongs to an OS-locked DbState session. Terminal records
-- remove this ownership. Ownerless legacy Running rows are not reconciled on
-- open; apply offline-legacy-migration.sql via
-- DbState::migrate_ownerless_legacy_running during a stopped-process upgrade.
CREATE TABLE IF NOT EXISTS desk_run_owners (
    run_id TEXT PRIMARY KEY NOT NULL REFERENCES desk_runs(id) ON DELETE CASCADE,
    session TEXT NOT NULL
);
