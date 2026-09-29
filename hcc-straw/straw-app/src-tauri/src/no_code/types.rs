// src-tauri/src/types.rs

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ============================================================================
// WORKFLOW VALUE TYPE (matches React)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(untagged)]
pub enum WorkflowValue {
    Null,
    Boolean(bool),
    Integer(i64),
    Float(f64),
    String(String),
    Array(Vec<WorkflowValue>),
    Object(HashMap<String, WorkflowValue>),
}

impl From<serde_json::Value> for WorkflowValue {
    fn from(val: serde_json::Value) -> Self {
        match val {
            serde_json::Value::Null => WorkflowValue::Null,
            serde_json::Value::Bool(b) => WorkflowValue::Boolean(b),
            serde_json::Value::Number(n) => {
                if let Some(i) = n.as_i64() {
                    WorkflowValue::Integer(i)
                } else {
                    WorkflowValue::Float(n.as_f64().unwrap_or(0.0))
                }
            }
            serde_json::Value::String(s) => WorkflowValue::String(s),
            serde_json::Value::Array(arr) => {
                WorkflowValue::Array(arr.into_iter().map(WorkflowValue::from).collect())
            }
            serde_json::Value::Object(obj) => {
                let mut map = HashMap::new();
                for (k, v) in obj {
                    map.insert(k, WorkflowValue::from(v));
                }
                WorkflowValue::Object(map)
            }
        }
    }
}

impl Into<serde_json::Value> for WorkflowValue {
    fn into(self) -> serde_json::Value {
        match self {
            WorkflowValue::Null => serde_json::Value::Null,
            WorkflowValue::Boolean(b) => serde_json::Value::Bool(b),
            WorkflowValue::Integer(i) => serde_json::json!(i),
            WorkflowValue::Float(f) => serde_json::json!(f),
            WorkflowValue::String(s) => serde_json::Value::String(s),
            WorkflowValue::Array(arr) => {
                serde_json::Value::Array(arr.into_iter().map(|v| v.into()).collect())
            }
            WorkflowValue::Object(obj) => {
                let mut map = serde_json::Map::new();
                for (k, v) in obj {
                    map.insert(k, v.into());
                }
                serde_json::Value::Object(map)
            }
        }
    }
}

// ============================================================================
// NODE AND EDGE DEFINITIONS
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowNode {
    pub id: String,
    pub label: String,
    pub node_type: String, // "input", "logic", "output"
    pub description: String,
    #[serde(default)]
    pub config: serde_json::Value,
    #[serde(default)]
    pub position: NodePosition,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct NodePosition {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowEdge {
    pub source: String,
    pub target: String,
    pub source_port: Option<String>,
    pub target_port: Option<String>,
}

// ============================================================================
// WORKFLOW DEFINITION
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowDefinition {
    pub id: String,
    pub name: String,
    pub description: String,
    pub nodes: Vec<WorkflowNode>,
    pub edges: Vec<WorkflowEdge>,
    #[serde(default)]
    pub status: String, // "draft", "active", "archived"
    #[serde(default)]
    pub version: i32,
}

// ============================================================================
// EXECUTION TYPES
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionResult {
    pub success: bool,
    pub final_output: Option<WorkflowValue>,
    pub error: Option<String>,
    pub log: Vec<ExecutionLogEntry>,
    pub total_duration_ms: u128,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionLogEntry {
    pub node_id: String,
    pub node_name: String,
    pub timestamp: String,
    pub input: HashMap<String, WorkflowValue>,
    pub output: Result<WorkflowValue, String>,
    pub duration_ms: u128,
}

impl Default for ExecutionLogEntry {
    fn default() -> Self {
        Self {
            node_id: String::new(),
            node_name: String::new(),
            timestamp: String::new(),
            input: HashMap::new(),
            output: Ok(WorkflowValue::Null),
            duration_ms: 0,
        }
    }
}
