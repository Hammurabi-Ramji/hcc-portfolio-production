CREATE TABLE IF NOT EXISTS document_revisions(id TEXT PRIMARY KEY, document_id TEXT NOT NULL, parent TEXT REFERENCES document_revisions(id), digest TEXT NOT NULL, text TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS document_heads(id TEXT PRIMARY KEY, revision TEXT NOT NULL REFERENCES document_revisions(id));
CREATE TRIGGER IF NOT EXISTS immutable_revision_update BEFORE UPDATE ON document_revisions BEGIN SELECT RAISE(ABORT, 'immutable revision'); END;
CREATE TRIGGER IF NOT EXISTS immutable_revision_delete BEFORE DELETE ON document_revisions BEGIN SELECT RAISE(ABORT, 'immutable revision'); END;
CREATE TABLE IF NOT EXISTS vectors(id TEXT NOT NULL, model TEXT NOT NULL, dimension INTEGER NOT NULL CHECK(dimension BETWEEN 1 AND 8192), embedding BLOB NOT NULL, PRIMARY KEY(id,model), CHECK(length(embedding)=dimension*4));
CREATE INDEX IF NOT EXISTS vector_model_dimension ON vectors(model,dimension);
CREATE TABLE IF NOT EXISTS eduba_archives(digest TEXT PRIMARY KEY, source_path TEXT NOT NULL, counts TEXT NOT NULL, bytes INTEGER NOT NULL, imported_at TEXT NOT NULL, snapshot TEXT NOT NULL);
CREATE TRIGGER IF NOT EXISTS immutable_eduba_update BEFORE UPDATE ON eduba_archives BEGIN SELECT RAISE(ABORT, 'immutable Eduba archive'); END;
CREATE TRIGGER IF NOT EXISTS immutable_eduba_delete BEFORE DELETE ON eduba_archives BEGIN SELECT RAISE(ABORT, 'immutable Eduba archive'); END;
