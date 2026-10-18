// src-tauri/src/database.rs

use rusqlite::{Connection, Result as SqlResult, params};
use crate::types::*;
use serde_json::json;
use uuid::Uuid;
use chrono::Utc;

pub struct Database {
    conn: Connection,
}

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

        // Initialize default templates
        self.init_default_templates()?;

        Ok(())
    }

    fn init_default_templates(&self) -> Result<(), String> {
        // Check if templates already exist
        let count: i32 = self.conn.query_row(
            "SELECT COUNT(*) FROM workflow_templates",
            [],
            |row| row.get(0),
        ).unwrap_or(0);

        if count > 0 {
            return Ok(());
        }

        // Insert default templates
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

            let stmt = self.conn.execute(
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
            );

            stmt.map_err(|e| format!("Failed to insert template: {}", e))?;
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

    pub fn load_workflow(&self, workflow_id: &str) -> Result<WorkflowDefinition, String> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, description, nodes_json, edges_json, status, version FROM workflows WHERE id = ?"
        ).map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let workflow = stmt.query_row(params![workflow_id], |row| {
            let nodes_json: String = row.get(3)?;
            let edges_json: String = row.get(4)?;

            Ok(WorkflowDefinition {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                nodes: serde_json::from_str(&nodes_json).unwrap_or_default(),
                edges: serde_json::from_str(&edges_json).unwrap_or_default(),
                status: row.get(5)?,
                version: row.get(6)?,
            })
        }).map_err(|e| format!("Failed to load workflow: {}", e))?;

        Ok(workflow)
    }

    pub fn list_workflows(&self) -> Result<Vec<WorkflowSummary>, String> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, description, status, created_at, updated_at, total_executions, successful_executions, failed_executions 
             FROM workflows ORDER BY updated_at DESC"
        ).map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let workflows = stmt.query_map([], |row| {
            Ok(WorkflowSummary {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                status: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
                total_executions: row.get(6)?,
                successful_executions: row.get(7)?,
                failed_executions: row.get(8)?,
            })
        }).map_err(|e| format!("Failed to query workflows: {}", e))?;

        let mut results = Vec::new();
        for workflow in workflows {
            results.push(workflow.map_err(|e| format!("Failed to map workflow: {}", e))?);
        }

        Ok(results)
    }

    pub fn save_execution(&self, workflow_id: &str, result: &ExecutionResult) -> Result<(), String> {
        let execution_id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        let output_json = result.final_output.as_ref().map(|v| {
            serde_json::to_string(v).unwrap_or_default()
        });

        let error_node_id = result.log.iter()
            .find(|entry| matches!(entry.output, Err(_)))
            .map(|entry| entry.node_id.clone());

        self.conn.execute(
            "INSERT INTO workflow_executions (id, workflow_id, status, input_data, output_data, error_message, error_node_id, started_at, completed_at, duration_ms)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                execution_id,
                workflow_id,
                if result.success { "completed" } else { "failed" },
                "{}",
                output_json,
                result.error,
                error_node_id,
                now,
                now,
                result.total_duration_ms as i32,
            ],
        ).map_err(|e| format!("Failed to save execution: {}", e))?;

        // Save node-level logs
        for (idx, log_entry) in result.log.iter().enumerate() {
            let node_id = Uuid::new_v4().to_string();
            let output_json = match &log_entry.output {
                Ok(val) => Some(serde_json::to_string(val).unwrap_or_default()),
                Err(_) => None,
            };

            self.conn.execute(
                "INSERT INTO execution_nodes (id, execution_id, node_id, node_name, node_type, status, output_data, duration_ms, sequence, started_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                params![
                    node_id,
                    execution_id,
                    log_entry.node_id,
                    log_entry.node_name,
                    "logic", // Default type, could be enhanced
                    if matches!(log_entry.output, Err(_)) { "failed" } else { "completed" },
                    output_json,
                    log_entry.duration_ms as i32,
                    idx as i32,
                    log_entry.timestamp,
                ],
            ).map_err(|e| format!("Failed to save node log: {}", e))?;
        }

        // Update workflow stats
        let status_value = if result.success { "successful" } else { "failed" };
        let update_sql = match status_value {
            "successful" => "UPDATE workflows SET total_executions = total_executions + 1, successful_executions = successful_executions + 1, updated_at = ? WHERE id = ?",
            _ => "UPDATE workflows SET total_executions = total_executions + 1, failed_executions = failed_executions + 1, updated_at = ? WHERE id = ?",
        };

        self.conn.execute(update_sql, params![now, workflow_id])
            .map_err(|e| format!("Failed to update workflow stats: {}", e))?;

        Ok(())
    }

    pub fn get_executions(&self, workflow_id: &str, limit: i32) -> Result<Vec<ExecutionSummary>, String> {
        let mut stmt = self.conn.prepare(
            "SELECT id, workflow_id, status, started_at, completed_at, duration_ms, error_message 
             FROM workflow_executions WHERE workflow_id = ? ORDER BY started_at DESC LIMIT ?"
        ).map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let executions = stmt.query_map(params![workflow_id, limit], |row| {
            Ok(ExecutionSummary {
                id: row.get(0)?,
                workflow_id: row.get(1)?,
                status: row.get(2)?,
                started_at: row.get(3)?,
                completed_at: row.get(4)?,
                duration_ms: row.get(5)?,
                error_message: row.get(6)?,
            })
        }).map_err(|e| format!("Failed to query executions: {}", e))?;

        let mut results = Vec::new();
        for execution in executions {
            results.push(execution.map_err(|e| format!("Failed to map execution: {}", e))?);
        }

        Ok(results)
    }

    pub fn get_execution_details(&self, execution_id: &str) -> Result<ExecutionDetails, String> {
        let mut stmt = self.conn.prepare(
            "SELECT id, workflow_id, status, input_data, output_data, error_message, started_at, completed_at, duration_ms 
             FROM workflow_executions WHERE id = ?"
        ).map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let details = stmt.query_row(params![execution_id], |row| {
            Ok(ExecutionDetails {
                id: row.get(0)?,
                workflow_id: row.get(1)?,
                status: row.get(2)?,
                input_data: serde_json::from_str(&row.get::<_, String>(3)?).unwrap_or(json!({})),
                output_data: row.get::<_, Option<String>>(4)?.and_then(|s| serde_json::from_str(&s).ok()),
                error_message: row.get(5)?,
                started_at: row.get(6)?,
                completed_at: row.get(7)?,
                duration_ms: row.get(8)?,
                node_logs: Vec::new(),
            })
        }).map_err(|e| format!("Failed to load execution: {}", e))?;

        // Load node logs
        let mut node_stmt = self.conn.prepare(
            "SELECT node_id, node_name, node_type, status, output_data, duration_ms, sequence, started_at 
             FROM execution_nodes WHERE execution_id = ? ORDER BY sequence"
        ).map_err(|e| format!("Failed to prepare node statement: {}", e))?;

        let mut details = details;
        let node_logs = node_stmt.query_map(params![execution_id], |row| {
            Ok(NodeExecutionLog {
                node_id: row.get(0)?,
                node_name: row.get(1)?,
                node_type: row.get(2)?,
                status: row.get(3)?,
                input_data: json!({}),
                output_data: row.get::<_, Option<String>>(4)?.and_then(|s| serde_json::from_str(&s).ok()),
                error_message: None,
                started_at: row.get(7)?,
                duration_ms: row.get(5)?,
                sequence: row.get(6)?,
            })
        }).map_err(|e| format!("Failed to query node logs: {}", e))?;

        for log in node_logs {
            details.node_logs.push(log.map_err(|e| format!("Failed to map log: {}", e))?);
        }

        Ok(details)
    }

    pub fn delete_workflow(&self, workflow_id: &str) -> Result<(), String> {
        self.conn.execute(
            "DELETE FROM workflows WHERE id = ?",
            params![workflow_id],
        ).map_err(|e| format!("Failed to delete workflow: {}", e))?;

        Ok(())
    }

    pub fn create_from_template(&self, template_id: &str, name: &str) -> Result<String, String> {
        let workflow_id = Uuid::new_v4().to_string();

        let mut stmt = self.conn.prepare(
            "SELECT nodes_json, edges_json FROM workflow_templates WHERE id = ?"
        ).map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let (nodes_json, edges_json) = stmt.query_row(params![template_id], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        }).map_err(|e| format!("Failed to load template: {}", e))?;

        let now = Utc::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO workflows (id, name, description, nodes_json, edges_json, status, version, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                workflow_id,
                name,
                format!("Created from {}", template_id),
                nodes_json,
                edges_json,
                "draft",
                1,
                now,
                now,
            ],
        ).map_err(|e| format!("Failed to create from template: {}", e))?;

        // Increment template usage
        self.conn.execute(
            "UPDATE workflow_templates SET usage_count = usage_count + 1 WHERE id = ?",
            params![template_id],
        ).ok();

        Ok(workflow_id)
    }

    pub fn get_templates(&self) -> Result<Vec<WorkflowTemplate>, String> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, description, category, nodes_json, edges_json, usage_count, rating 
             FROM workflow_templates"
        ).map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let templates = stmt.query_map([], |row| {
            Ok(WorkflowTemplate {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                category: row.get(3)?,
                nodes: serde_json::from_str(&row.get::<_, String>(4)?).unwrap_or_default(),
                edges: serde_json::from_str(&row.get::<_, String>(5)?).unwrap_or_default(),
                usage_count: row.get(6)?,
                rating: row.get(7)?,
            })
        }).map_err(|e| format!("Failed to query templates: {}", e))?;

        let mut results = Vec::new();
        for template in templates {
            results.push(template.map_err(|e| format!("Failed to map template: {}", e))?);
        }

        Ok(results)
    }

    pub fn get_statistics(&self) -> Result<DatabaseStatistics, String> {
        let total_workflows: i32 = self.conn.query_row(
            "SELECT COUNT(*) FROM workflows",
            [],
            |row| row.get(0),
        ).unwrap_or(0);

        let active_workflows: i32 = self.conn.query_row(
            "SELECT COUNT(*) FROM workflows WHERE status = 'active'",
            [],
            |row| row.get(0),
        ).unwrap_or(0);

        let total_executions: i32 = self.conn.query_row(
            "SELECT SUM(total_executions) FROM workflows",
            [],
            |row| row.get(0),
        ).unwrap_or(0);

        let successful_executions: i32 = self.conn.query_row(
            "SELECT SUM(successful_executions) FROM workflows",
            [],
            |row| row.get(0),
        ).unwrap_or(0);

        let failed_executions: i32 = self.conn.query_row(
            "SELECT SUM(failed_executions) FROM workflows",
            [],
            |row| row.get(0),
        ).unwrap_or(0);

        let success_rate = if total_executions > 0 {
            (successful_executions as f32 / total_executions as f32) * 100.0
        } else {
            0.0
        };

        let avg_duration: f32 = self.conn.query_row(
            "SELECT AVG(duration_ms) FROM workflow_executions WHERE status = 'completed'",
            [],
            |row| row.get(0),
        ).unwrap_or(0.0);

        Ok(DatabaseStatistics {
            total_workflows,
            active_workflows,
            total_executions,
            successful_executions,
            failed_executions,
            success_rate,
            avg_execution_time_ms: avg_duration,
        })
    }
}
