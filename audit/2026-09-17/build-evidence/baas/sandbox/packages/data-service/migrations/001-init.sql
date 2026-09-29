-- Data Service Schema
-- Multi-tenant document/record storage with FTS5 search

CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  schema_json TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_collections_tenant_name ON collections(tenant_id, name);

CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  collection_id TEXT NOT NULL,
  data_json TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_records_tenant ON records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_records_collection ON records(collection_id);
CREATE INDEX IF NOT EXISTS idx_records_created ON records(created_at);

-- Full-text search (FTS5) for records
CREATE VIRTUAL TABLE IF NOT EXISTS records_fts USING fts5(
  record_id UNINDEXED,
  tenant_id UNINDEXED,
  title,
  content,
  content=records,
  content_rowid=rowid
);

CREATE TABLE IF NOT EXISTS record_versions (
  id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  data_json TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(record_id) REFERENCES records(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_record_versions ON record_versions(record_id, version_number);
