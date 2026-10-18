use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use thiserror::Error;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/// Represents a value that can flow through the workflow
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

impl WorkflowValue {
    pub fn as_string(&self) -> Result<String, ExecutionError> {
        match self {
            WorkflowValue::String(s) => Ok(s.clone()),
            WorkflowValue::Integer(i) => Ok(i.to_string()),
            WorkflowValue::Float(f) => Ok(f.to_string()),
            WorkflowValue::Boolean(b) => Ok(b.to_string()),
            _ => Err(ExecutionError::TypeMismatch(
                format!("Cannot convert {:?} to string", self),
            )),
        }
    }

    pub fn as_number(&self) -> Result<f64, ExecutionError> {
        match self {
            WorkflowValue::Integer(i) => Ok(*i as f64),
            WorkflowValue::Float(f) => Ok(*f),
            WorkflowValue::String(s) => s.parse::<f64>().map_err(|_| {
                ExecutionError::TypeMismatch(format!("Cannot parse '{}' as number", s))
            }),
            _ => Err(ExecutionError::TypeMismatch(
                format!("Cannot convert {:?} to number", self),
            )),
        }
    }

    pub fn as_bool(&self) -> bool {
        match self {
            WorkflowValue::Null => false,
            WorkflowValue::Boolean(b) => *b,
            WorkflowValue::Integer(i) => *i != 0,
            WorkflowValue::Float(f) => *f != 0.0,
            WorkflowValue::String(s) => !s.is_empty(),
            WorkflowValue::Array(a) => !a.is_empty(),
            WorkflowValue::Object(o) => !o.is_empty(),
        }
    }
}

/// Error types for workflow execution
#[derive(Error, Debug)]
pub enum ExecutionError {
    #[error("Type mismatch: {0}")]
    TypeMismatch(String),

    #[error("Node not found: {0}")]
    NodeNotFound(String),

    #[error("Invalid condition: {0}")]
    InvalidCondition(String),

    #[error("IO error: {0}")]
    IoError(String),

    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("Network error: {0}")]
    NetworkError(String),

    #[error("Parse error: {0}")]
    ParseError(String),

    #[error("Workflow error: {0}")]
    WorkflowError(String),
}

/// Node configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeConfig {
    pub condition: Option<String>,
    pub format: Option<String>,
    pub error_strategy: Option<String>,
    #[serde(default)]
    pub extra: HashMap<String, WorkflowValue>,
}

/// Represents a node in the workflow
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowNode {
    pub id: String,
    pub label: String,
    pub node_type: String, // "input", "logic", "output"
    pub description: String,
    #[serde(default)]
    pub config: NodeConfig,
    #[serde(default)]
    pub ports: PortConfig,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct PortConfig {
    #[serde(default)]
    pub in_ports: Vec<String>,
    #[serde(default)]
    pub out_ports: Vec<String>,
}

/// Represents a connection between nodes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowEdge {
    pub source: String,
    pub target: String,
    pub source_port: Option<String>,
    pub target_port: Option<String>,
}

/// Complete workflow definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowDefinition {
    pub id: String,
    pub name: String,
    pub nodes: Vec<WorkflowNode>,
    pub edges: Vec<WorkflowEdge>,
}

/// Execution context
pub struct ExecutionContext {
    pub variables: HashMap<String, WorkflowValue>,
    pub execution_log: Vec<ExecutionLogEntry>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ExecutionLogEntry {
    pub node_id: String,
    pub node_name: String,
    pub timestamp: String,
    pub input: HashMap<String, WorkflowValue>,
    pub output: Result<WorkflowValue, String>,
    pub duration_ms: u128,
}

#[derive(Debug, Clone, Serialize)]
pub struct ExecutionResult {
    pub success: bool,
    pub final_output: Option<WorkflowValue>,
    pub error: Option<String>,
    pub log: Vec<ExecutionLogEntry>,
    pub total_duration_ms: u128,
}

// ============================================================================
// NODE EXECUTOR TRAIT
// ============================================================================

/// Trait for executing different node types
#[async_trait::async_trait]
pub trait NodeExecutor: Send + Sync {
    async fn execute(
        &self,
        node: &WorkflowNode,
        input: HashMap<String, WorkflowValue>,
        context: &mut ExecutionContext,
    ) -> Result<WorkflowValue, ExecutionError>;
}

// ============================================================================
// INPUT NODE EXECUTOR
// ============================================================================

pub struct InputNodeExecutor;

#[async_trait::async_trait]
impl NodeExecutor for InputNodeExecutor {
    async fn execute(
        &self,
        _node: &WorkflowNode,
        input: HashMap<String, WorkflowValue>,
        _context: &mut ExecutionContext,
    ) -> Result<WorkflowValue, ExecutionError> {
        // For input nodes, pass through the input value
        // In a real application, this might validate against a schema
        if let Some(value) = input.get("value") {
            Ok(value.clone())
        } else {
            Ok(WorkflowValue::Null)
        }
    }
}

// ============================================================================
// LOGIC NODE EXECUTORS
// ============================================================================

pub struct IfThenNodeExecutor;

#[async_trait::async_trait]
impl NodeExecutor for IfThenNodeExecutor {
    async fn execute(
        &self,
        node: &WorkflowNode,
        input: HashMap<String, WorkflowValue>,
        _context: &mut ExecutionContext,
    ) -> Result<WorkflowValue, ExecutionError> {
        let value = input
            .get("value")
            .ok_or_else(|| ExecutionError::WorkflowError("Missing input value".to_string()))?;

        let condition = node
            .config
            .condition
            .as_ref()
            .ok_or_else(|| ExecutionError::InvalidCondition("No condition specified".to_string()))?;

        // Simple condition evaluation
        let result = evaluate_condition(value, condition)?;

        Ok(WorkflowValue::Object({
            let mut obj = HashMap::new();
            obj.insert("condition_result".to_string(), WorkflowValue::Boolean(result));
            obj.insert("value".to_string(), value.clone());
            obj
        }))
    }
}

pub struct TransformNodeExecutor;

#[async_trait::async_trait]
impl NodeExecutor for TransformNodeExecutor {
    async fn execute(
        &self,
        _node: &WorkflowNode,
        input: HashMap<String, WorkflowValue>,
        _context: &mut ExecutionContext,
    ) -> Result<WorkflowValue, ExecutionError> {
        // Transform the input based on config
        if let Some(value) = input.get("value") {
            match value {
                WorkflowValue::String(s) => {
                    // Simple transformations
                    Ok(WorkflowValue::String(s.to_uppercase()))
                }
                WorkflowValue::Array(arr) => {
                    // Filter nulls
                    let filtered: Vec<_> = arr
                        .iter()
                        .filter(|v| !matches!(v, WorkflowValue::Null))
                        .cloned()
                        .collect();
                    Ok(WorkflowValue::Array(filtered))
                }
                other => Ok(other.clone()),
            }
        } else {
            Ok(WorkflowValue::Null)
        }
    }
}

pub struct LoopNodeExecutor;

#[async_trait::async_trait]
impl NodeExecutor for LoopNodeExecutor {
    async fn execute(
        &self,
        _node: &WorkflowNode,
        input: HashMap<String, WorkflowValue>,
        _context: &mut ExecutionContext,
    ) -> Result<WorkflowValue, ExecutionError> {
        let value = input
            .get("value")
            .ok_or_else(|| ExecutionError::WorkflowError("Missing input value".to_string()))?;

        match value {
            WorkflowValue::Array(arr) => {
                let results: Vec<_> = arr
                    .iter()
                    .enumerate()
                    .map(|(idx, item)| {
                        let mut obj = HashMap::new();
                        obj.insert("index".to_string(), WorkflowValue::Integer(idx as i64));
                        obj.insert("item".to_string(), item.clone());
                        WorkflowValue::Object(obj)
                    })
                    .collect();

                Ok(WorkflowValue::Array(results))
            }
            _ => Err(ExecutionError::TypeMismatch(
                "Loop node expects an array".to_string(),
            )),
        }
    }
}

pub struct MergeNodeExecutor;

#[async_trait::async_trait]
impl NodeExecutor for MergeNodeExecutor {
    async fn execute(
        &self,
        _node: &WorkflowNode,
        input: HashMap<String, WorkflowValue>,
        _context: &mut ExecutionContext,
    ) -> Result<WorkflowValue, ExecutionError> {
        // Merge all inputs into a single object
        Ok(WorkflowValue::Object(input))
    }
}

// ============================================================================
// OUTPUT NODE EXECUTORS
// ============================================================================

pub struct SaveNodeExecutor;

#[async_trait::async_trait]
impl NodeExecutor for SaveNodeExecutor {
    async fn execute(
        &self,
        node: &WorkflowNode,
        input: HashMap<String, WorkflowValue>,
        context: &mut ExecutionContext,
    ) -> Result<WorkflowValue, ExecutionError> {
        let value = input.get("value").cloned().unwrap_or(WorkflowValue::Null);

        // Store in context variables for potential later use
        context.variables.insert(node.id.clone(), value.clone());

        Ok(WorkflowValue::Object({
            let mut obj = HashMap::new();
            obj.insert(
                "status".to_string(),
                WorkflowValue::String("saved".to_string()),
            );
            obj.insert("id".to_string(), WorkflowValue::String(node.id.clone()));
            obj
        }))
    }
}

pub struct ExportCsvNodeExecutor;

#[async_trait::async_trait]
impl NodeExecutor for ExportCsvNodeExecutor {
    async fn execute(
        &self,
        _node: &WorkflowNode,
        input: HashMap<String, WorkflowValue>,
        _context: &mut ExecutionContext,
    ) -> Result<WorkflowValue, ExecutionError> {
        let value = input.get("value").cloned().unwrap_or(WorkflowValue::Null);

        // Convert to CSV format
        let csv_content = match value {
            WorkflowValue::Array(arr) => {
                // Simple CSV conversion for arrays of objects
                let mut csv = String::new();
                for item in arr {
                    if let WorkflowValue::Object(obj) = item {
                        for (key, val) in obj {
                            csv.push_str(&format!("{}={},", key, format_csv_value(&val)));
                        }
                        csv.push('\n');
                    }
                }
                csv
            }
            other => format!("{:?}", other),
        };

        Ok(WorkflowValue::Object({
            let mut obj = HashMap::new();
            obj.insert("format".to_string(), WorkflowValue::String("csv".to_string()));
            obj.insert("content".to_string(), WorkflowValue::String(csv_content));
            obj
        }))
    }
}

pub struct SendEmailNodeExecutor;

#[async_trait::async_trait]
impl NodeExecutor for SendEmailNodeExecutor {
    async fn execute(
        &self,
        node: &WorkflowNode,
        input: HashMap<String, WorkflowValue>,
        _context: &mut ExecutionContext,
    ) -> Result<WorkflowValue, ExecutionError> {
        let subject = node.config.extra.get("subject").cloned();
        let to = node.config.extra.get("to").cloned();

        Ok(WorkflowValue::Object({
            let mut obj = HashMap::new();
            obj.insert("status".to_string(), WorkflowValue::String("sent".to_string()));
            if let Some(addr) = to {
                obj.insert("to".to_string(), addr);
            }
            if let Some(subj) = subject {
                obj.insert("subject".to_string(), subj);
            }
            obj
        }))
    }
}

// ============================================================================
// WORKFLOW EXECUTOR
// ============================================================================

pub struct WorkflowExecutor {
    definition: WorkflowDefinition,
    node_executors: HashMap<String, Box<dyn NodeExecutor>>,
}

impl WorkflowExecutor {
    pub fn new(definition: WorkflowDefinition) -> Self {
        let mut executors: HashMap<String, Box<dyn NodeExecutor>> = HashMap::new();

        // Register all built-in executors
        executors.insert("input".to_string(), Box::new(InputNodeExecutor));
        executors.insert("if_then".to_string(), Box::new(IfThenNodeExecutor));
        executors.insert("transform".to_string(), Box::new(TransformNodeExecutor));
        executors.insert("loop".to_string(), Box::new(LoopNodeExecutor));
        executors.insert("merge".to_string(), Box::new(MergeNodeExecutor));
        executors.insert("save".to_string(), Box::new(SaveNodeExecutor));
        executors.insert("export_csv".to_string(), Box::new(ExportCsvNodeExecutor));
        executors.insert("email".to_string(), Box::new(SendEmailNodeExecutor));

        Self {
            definition,
            node_executors: executors,
        }
    }

    pub async fn execute(
        &self,
        initial_input: HashMap<String, WorkflowValue>,
    ) -> Result<ExecutionResult, ExecutionError> {
        let start_time = std::time::Instant::now();
        let mut context = ExecutionContext {
            variables: initial_input.clone(),
            execution_log: Vec::new(),
        };

        // Find start nodes (input nodes with no predecessors)
        let start_nodes = self.find_start_nodes();

        if start_nodes.is_empty() {
            return Err(ExecutionError::WorkflowError(
                "No start nodes found".to_string(),
            ));
        }

        let mut final_output: Option<WorkflowValue> = None;
        let mut error: Option<String> = None;

        // Execute each path through the workflow
        for start_node_id in start_nodes {
            match self
                .execute_node_path(&start_node_id, &mut context, HashMap::new())
                .await
            {
                Ok(output) => {
                    final_output = Some(output);
                }
                Err(e) => {
                    error = Some(e.to_string());
                    if let Some(error_strategy) = &start_node_id {
                        // Handle error based on strategy
                        // For now, just log and continue
                    }
                }
            }
        }

        let total_duration = start_time.elapsed().as_millis();

        Ok(ExecutionResult {
            success: error.is_none(),
            final_output,
            error,
            log: context.execution_log,
            total_duration_ms: total_duration,
        })
    }

    async fn execute_node_path(
        &self,
        node_id: &str,
        context: &mut ExecutionContext,
        input: HashMap<String, WorkflowValue>,
    ) -> Result<WorkflowValue, ExecutionError> {
        let node = self
            .definition
            .nodes
            .iter()
            .find(|n| n.id == node_id)
            .ok_or_else(|| ExecutionError::NodeNotFound(node_id.to_string()))?;

        let node_start = std::time::Instant::now();
        let node_type = if node.label.contains("If") {
            "if_then"
        } else if node.label.contains("Transform") {
            "transform"
        } else if node.label.contains("Loop") {
            "loop"
        } else if node.label.contains("Merge") {
            "merge"
        } else if node.label.contains("Save") {
            "save"
        } else if node.label.contains("CSV") {
            "export_csv"
        } else if node.label.contains("Email") {
            "email"
        } else {
            "input"
        };

        let executor = self
            .node_executors
            .get(node_type)
            .ok_or_else(|| ExecutionError::NodeNotFound(format!("No executor for type: {}", node_type)))?;

        let result = executor.execute(node, input.clone(), context).await;

        let duration = node_start.elapsed().as_millis();

        context.execution_log.push(ExecutionLogEntry {
            node_id: node.id.clone(),
            node_name: node.label.clone(),
            timestamp: chrono::Local::now().to_rfc3339(),
            input,
            output: result.clone().map_err(|e| e.to_string()),
            duration_ms: duration,
        });

        // Find next nodes and execute them
        let next_nodes = self.find_next_nodes(node_id);

        let output = result?;

        if next_nodes.is_empty() {
            // This is an end node
            Ok(output)
        } else {
            // Execute the first next node (simple path - doesn't handle branching)
            let next_id = &next_nodes[0];
            let mut next_input = HashMap::new();
            next_input.insert("value".to_string(), output);
            self.execute_node_path(next_id, context, next_input).await
        }
    }

    fn find_start_nodes(&self) -> Vec<String> {
        let has_incoming = self
            .definition
            .edges
            .iter()
            .map(|e| &e.target)
            .collect::<std::collections::HashSet<_>>();

        self.definition
            .nodes
            .iter()
            .filter(|n| !has_incoming.contains(&n.id) && n.node_type == "input")
            .map(|n| n.id.clone())
            .collect()
    }

    fn find_next_nodes(&self, current_node_id: &str) -> Vec<String> {
        self.definition
            .edges
            .iter()
            .filter(|e| e.source == current_node_id)
            .map(|e| e.target.clone())
            .collect()
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

fn evaluate_condition(value: &WorkflowValue, condition: &str) -> Result<bool, ExecutionError> {
    // Parse simple conditions like "amount > 500"
    let parts: Vec<&str> = condition.split_whitespace().collect();

    if parts.len() != 3 {
        return Err(ExecutionError::InvalidCondition(
            "Condition must be in format: field operator value".to_string(),
        ));
    }

    let operator = parts[1];
    let threshold = parts[2].parse::<f64>().map_err(|_| {
        ExecutionError::InvalidCondition("Value must be numeric".to_string())
    })?;

    let num_value = value.as_number()?;

    let result = match operator {
        ">" => num_value > threshold,
        "<" => num_value < threshold,
        ">=" => num_value >= threshold,
        "<=" => num_value <= threshold,
        "==" | "=" => (num_value - threshold).abs() < f64::EPSILON,
        "!=" => (num_value - threshold).abs() >= f64::EPSILON,
        _ => {
            return Err(ExecutionError::InvalidCondition(format!(
                "Unknown operator: {}",
                operator
            )))
        }
    };

    Ok(result)
}

fn format_csv_value(value: &WorkflowValue) -> String {
    match value {
        WorkflowValue::String(s) => format!("\"{}\"", s.replace("\"", "\"\"")),
        WorkflowValue::Null => String::new(),
        other => format!("{:?}", other),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_simple_workflow() {
        let nodes = vec![
            WorkflowNode {
                id: "input1".to_string(),
                label: "Text Input".to_string(),
                node_type: "input".to_string(),
                description: "Test input".to_string(),
                config: Default::default(),
                ports: Default::default(),
            },
            WorkflowNode {
                id: "output1".to_string(),
                label: "Save".to_string(),
                node_type: "output".to_string(),
                description: "Save output".to_string(),
                config: Default::default(),
                ports: Default::default(),
            },
        ];

        let edges = vec![WorkflowEdge {
            source: "input1".to_string(),
            target: "output1".to_string(),
            source_port: None,
            target_port: None,
        }];

        let definition = WorkflowDefinition {
            id: "test-workflow".to_string(),
            name: "Test Workflow".to_string(),
            nodes,
            edges,
        };

        let executor = WorkflowExecutor::new(definition);
        let mut input = HashMap::new();
        input.insert("value".to_string(), WorkflowValue::String("test".to_string()));

        let result = executor.execute(input).await.unwrap();
        assert!(result.success);
    }
}
