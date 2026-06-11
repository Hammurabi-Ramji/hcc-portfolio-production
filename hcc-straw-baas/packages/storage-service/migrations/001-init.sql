-- Storage Service Schema
-- File metadata and tenant isolation

CREATE TABLE IF NOT EXISTS file_entries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  size INTEGER NOT NULL,
  mime_type TEXT,
  file_hash TEXT UNIQUE,
  storage_path TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_files_tenant ON file_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_files_created ON file_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_files_hash ON file_entries(file_hash);

CREATE TABLE IF NOT EXISTS file_access_logs (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  access_type TEXT,
  accessed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(file_id) REFERENCES file_entries(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_access_logs_file ON file_access_logs(file_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_tenant ON file_access_logs(tenant_id);

CREATE TABLE IF NOT EXISTS quota_limits (
  tenant_id TEXT PRIMARY KEY,
  max_storage_bytes INTEGER DEFAULT 10737418240,
  used_bytes INTEGER DEFAULT 0,
  file_count INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
