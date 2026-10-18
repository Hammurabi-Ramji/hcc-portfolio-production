CREATE TABLE IF NOT EXISTS accordion_records(entity TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL CHECK(json_valid(data)), created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, deleted_at INTEGER, PRIMARY KEY(entity,id));
CREATE INDEX IF NOT EXISTS accordion_records_live ON accordion_records(entity,deleted_at);
CREATE TABLE IF NOT EXISTS accordion_audit(seq INTEGER PRIMARY KEY AUTOINCREMENT, entity TEXT NOT NULL, record_id TEXT NOT NULL, action TEXT NOT NULL CHECK(action IN ('create','update','delete')), at INTEGER NOT NULL, data TEXT NOT NULL CHECK(json_valid(data)));
CREATE INDEX IF NOT EXISTS accordion_audit_record ON accordion_audit(entity,record_id);
CREATE TRIGGER IF NOT EXISTS accordion_audit_no_update BEFORE UPDATE ON accordion_audit BEGIN SELECT RAISE(ABORT,'append-only audit'); END;
CREATE TRIGGER IF NOT EXISTS accordion_audit_no_delete BEFORE DELETE ON accordion_audit BEGIN SELECT RAISE(ABORT,'append-only audit'); END;
