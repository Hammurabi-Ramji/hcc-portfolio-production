// src-tauri/src/database.rs

use rusqlite::{Connection, params};
use crate::no_code::types::*;
use serde_json::json;
use chrono::Utc;
use tauri::State;
use std::sync::Mutex;

pub struct Database {
    conn: Connection,
}

pub struct DbState(pub Mutex<Option<Database>>);

impl Database {
    pub fn new(path: &str) -> Result<Self, String> {
        let conn = Connection::open(path)
            .map_err(|e| format!("Failed to open database: {}", e))?;

        let db = Database { conn };
        db.init_schema()?;

        Ok(db)
    }

    fn init_schema(&self) -> Result<(), String> {
        self.conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS workflows (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                nodes_json TEXT NOT NULL,
                edges_json TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'draft',
                version INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                total_executions INTEGER NOT NULL DEFAULT 0,
                successful_executions INTEGER NOT NULL DEFAULT 0,
                failed_executions INTEGER NOT NULL DEFAULT 0
            );

            CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
            CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON workflows(created_at);

            CREATE TABLE IF NOT EXISTS workflow_executions (
                id TEXT PRIMARY KEY,
                workflow_id TEXT NOT NULL,
                status TEXT NOT NULL,
                input_data TEXT,
                output_data TEXT,
                error_message TEXT,
                error_node_id TEXT,
                started_at TEXT NOT NULL,
                completed_at TEXT,
                duration_ms INTEGER,
                triggered_by TEXT NOT NULL DEFAULT 'manual',
                FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_executions_workflow_id ON workflow_executions(workflow_id);
            CREATE INDEX IF NOT EXISTS idx_executions_status ON workflow_executions(status);
            CREATE INDEX IF NOT EXISTS idx_executions_started_at ON workflow_executions(started_at);

            CREATE TABLE IF NOT EXISTS execution_nodes (
                id TEXT PRIMARY KEY,
                execution_id TEXT NOT NULL,
                node_id TEXT NOT NULL,
                node_name TEXT NOT NULL,
                node_type TEXT NOT NULL,
                status TEXT NOT NULL,
                input_data TEXT,
                output_data TEXT,
                error_message TEXT,
                started_at TEXT,
                completed_at TEXT,
                duration_ms INTEGER,
                sequence INTEGER NOT NULL,
                FOREIGN KEY (execution_id) REFERENCES workflow_executions(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_execution_nodes_execution_id ON execution_nodes(execution_id);
            CREATE INDEX IF NOT EXISTS idx_execution_nodes_node_id ON execution_nodes(node_id);

            CREATE TABLE IF NOT EXISTS workflow_templates (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                category TEXT,
                nodes_json TEXT NOT NULL,
                edges_json TEXT NOT NULL,
                usage_count INTEGER NOT NULL DEFAULT 0,
                rating REAL,
                created_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_templates_category ON workflow_templates(category);
            "#
        ).map_err(|e| format!("Failed to initialize schema: {}", e))?;

        self.init_default_templates()?;

        Ok(())
    }

    fn init_default_templates(&self) -> Result<(), String> {
        let count: i32 = self.conn.query_row(
            "SELECT COUNT(*) FROM workflow_templates",
            [],
            |row| row.get(0),
        ).unwrap_or(0);

        if count > 0 {
            return Ok(());
        }

        let templates = vec![
            (
                "invoice-processing",
                "Invoice Processing",
                "Automatically extract and process invoice data",
                "data-processing",
            ),
            (
                "data-sync",
                "Data Synchronization",
                "Sync data between two databases with conflict resolution",
                "data-processing",
            ),
            (
                "email-campaign",
                "Email Campaign",
                "Send personalized emails from a CSV list",
                "automation",
            ),
            (
                "report-generation",
                "Report Generation",
                "Query data, generate charts, and send scheduled reports",
                "reporting",
            ),
            (
                "data-validation",
                "Data Validation",
                "Validate CSV or JSON data against rules",
                "data-processing",
            ),
        ];

        for (id, name, desc, category) in templates {
            let empty_workflow = json!({
                "nodes": [],
                "edges": []
            });

            self.conn.execute(
                "INSERT OR IGNORE INTO workflow_templates (id, name, description, category, nodes_json, edges_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                params![
                    id,
                    name,
                    desc,
                    category,
                    empty_workflow["nodes"].to_string(),
                    empty_workflow["edges"].to_string(),
                    Utc::now().to_rfc3339(),
                ],
            ).map_err(|e| format!("Failed to insert template: {}", e))?;
        }

        Ok(())
    }

    pub fn save_workflow(&self, workflow: &WorkflowDefinition) -> Result<(), String> {
        let now = Utc::now().to_rfc3339();
        let nodes_json = serde_json::to_string(&workflow.nodes)
            .map_err(|e| format!("Failed to serialize nodes: {}", e))?;
        let edges_json = serde_json::to_string(&workflow.edges)
            .map_err(|e| format!("Failed to serialize edges: {}", e))?;

        self.conn.execute(
            "INSERT OR REPLACE INTO workflows (id, name, description, nodes_json, edges_json, status, version, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                workflow.id,
                workflow.name,
                workflow.description,
                nodes_json,
                edges_json,
                workflow.status,
                workflow.version,
                now,
                now,
            ],
        ).map_err(|e| format!("Failed to save workflow: {}", e))?;

        Ok(())
    }
}

#[tauri::command]
pub fn initialize_db(state: State<DbState>, path: String) -> Result<(), String> {
    let db = Database::new(&path)?;
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    *guard = Some(db);
    Ok(())
}
