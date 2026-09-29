-- database/migrations/001_init_schema.sql
-- Initial database schema for Workflow Builder

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  nodes_json TEXT NOT NULL,
  edges_json TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  tags TEXT -- JSON array of tags
);

CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflows_created_at ON workflows(created_at);
CREATE INDEX idx_workflows_updated_at ON workflows(updated_at);

-- Workflow Versions table
CREATE TABLE IF NOT EXISTS workflow_versions (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  nodes_json TEXT NOT NULL,
  edges_json TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  change_description TEXT,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
  UNIQUE(workflow_id, version_number)
);

CREATE INDEX idx_workflow_versions_workflow_id ON workflow_versions(workflow_id);

-- Workflow Executions table
CREATE TABLE IF NOT EXISTS workflow_executions (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  status TEXT NOT NULL,
  input_data TEXT,
  output_data TEXT,
  error_message TEXT,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  duration_ms INTEGER,
  triggered_by TEXT,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

CREATE INDEX idx_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX idx_executions_status ON workflow_executions(status);
CREATE INDEX idx_executions_started_at ON workflow_executions(started_at);

-- Execution Nodes (detailed node-level logs)
CREATE TABLE IF NOT EXISTS execution_nodes (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  node_name TEXT NOT NULL,
  status TEXT NOT NULL,
  input_data TEXT,
  output_data TEXT,
  error_message TEXT,
  duration_ms INTEGER,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (execution_id) REFERENCES workflow_executions(id) ON DELETE CASCADE
);

CREATE INDEX idx_execution_nodes_execution_id ON execution_nodes(execution_id);
CREATE INDEX idx_execution_nodes_node_id ON execution_nodes(node_id);

-- Workflow Templates table
CREATE TABLE IF NOT EXISTS workflow_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  nodes_json TEXT NOT NULL,
  edges_json TEXT NOT NULL,
  thumbnail_url TEXT,
  usage_count INTEGER DEFAULT 0,
  rating REAL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_templates_category ON workflow_templates(category);

-- Workflow Schedules table (for future scheduled execution)
CREATE TABLE IF NOT EXISTS workflow_schedules (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  cron_expression TEXT NOT NULL,
  enabled BOOLEAN DEFAULT 1,
  last_execution_at DATETIME,
  next_execution_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

CREATE INDEX idx_schedules_workflow_id ON workflow_schedules(workflow_id);
CREATE INDEX idx_schedules_next_execution ON workflow_schedules(next_execution_at);

-- Workflow Webhooks table (for future webhook triggers)
CREATE TABLE IF NOT EXISTS workflow_webhooks (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  webhook_url TEXT NOT NULL UNIQUE,
  webhook_secret TEXT,
  events TEXT,
  enabled BOOLEAN DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

CREATE INDEX idx_webhooks_workflow_id ON workflow_webhooks(workflow_id);

-- Audit Log table
CREATE TABLE IF NOT EXISTS workflow_audit_log (
  id TEXT PRIMARY KEY,
  workflow_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  old_value TEXT,
  new_value TEXT,
  actor_id TEXT,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT
);

CREATE INDEX idx_audit_log_workflow_id ON workflow_audit_log(workflow_id);
CREATE INDEX idx_audit_log_timestamp ON workflow_audit_log(timestamp);

-- Workflow Sharing table
CREATE TABLE IF NOT EXISTS workflow_sharing (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  shared_with TEXT NOT NULL,
  permission_level TEXT NOT NULL,
  shared_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
  UNIQUE(workflow_id, shared_with)
);

CREATE INDEX idx_sharing_workflow_id ON workflow_sharing(workflow_id);

-- Workflow Statistics table
CREATE TABLE IF NOT EXISTS workflow_statistics (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  average_duration_ms REAL,
  last_execution_at DATETIME,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
  UNIQUE(workflow_id)
);

CREATE INDEX idx_statistics_workflow_id ON workflow_statistics(workflow_id);

-- System Logs table
CREATE TABLE IF NOT EXISTS system_logs (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  context TEXT,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_logs_level ON system_logs(level);
CREATE INDEX idx_logs_timestamp ON system_logs(timestamp);
