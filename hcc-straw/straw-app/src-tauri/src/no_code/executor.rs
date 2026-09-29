// src-tauri/src/executor.rs

use crate::no_code::types::*;
use std::collections::HashMap;
use chrono::Utc;
use std::time::Instant;
use async_recursion::async_recursion;

/// Main workflow executor that orchestrates node execution
pub struct WorkflowExecutor {
    definition: WorkflowDefinition,
}

impl WorkflowExecutor {
    pub fn new(definition: WorkflowDefinition) -> Self {
        WorkflowExecutor { definition }
    }

    /// Execute the workflow with the given input
    pub async fn execute(
        &self,
        input: HashMap<String, WorkflowValue>,
    ) -> Result<ExecutionResult, String> {
        let start_time = Instant::now();
        let mut log = Vec::new();
        let mut context: HashMap<String, WorkflowValue> = input.clone();

        // Find start nodes (input nodes with no predecessors)
        let start_nodes = self.find_start_nodes();

        if start_nodes.is_empty() {
            return Err("No start nodes found in workflow".to_string());
        }

        let mut final_output: Option<WorkflowValue> = None;
        let mut error: Option<String> = None;

        // Execute the workflow graph
        for start_node_id in start_nodes {
            match self
                .execute_node_path(&start_node_id, &mut context, &mut log)
                .await
            {
                Ok(output) => {
                    final_output = Some(output);
                }
                Err(e) => {
                    error = Some(e.clone());
                    break;
                }
            }
        }

        let total_duration = start_time.elapsed().as_millis();

        Ok(ExecutionResult {
            success: error.is_none(),
            final_output,
            error,
            log,
            total_duration_ms: total_duration,
        })
    }

    #[async_recursion]
    async fn execute_node_path(
        &self,
        node_id: &str,
        context: &mut HashMap<String, WorkflowValue>,
        log: &mut Vec<ExecutionLogEntry>,
    ) -> Result<WorkflowValue, String> {
        let node = self
            .definition
            .nodes
            .iter()
            .find(|n| n.id == node_id)
            .ok_or_else(|| format!("Node not found: {}", node_id))?;

        let node_start = Instant::now();

        // Build input for this node
        let mut node_input = HashMap::new();
        if let Some(value) = context.get("value") {
            node_input.insert("value".to_string(), value.clone());
        }

        // Execute the node
        let result = self.execute_node(node, &node_input, context).await;

        let duration = node_start.elapsed().as_millis();

        // Log the execution
        let output_result = match &result {
            Ok(val) => Ok(val.clone()),
            Err(e) => Err(e.clone()),
        };

        log.push(ExecutionLogEntry {
            node_id: node.id.clone(),
            node_name: node.label.clone(),
            timestamp: Utc::now().to_rfc3339(),
            input: node_input,
            output: output_result,
            duration_ms: duration,
        });

        // Get the output value
        let output = result?;

        // Store in context for next nodes
        context.insert("value".to_string(), output.clone());

        // Find and execute next nodes
        let next_nodes = self.find_next_nodes(node_id);

        if next_nodes.is_empty() {
            // This is an end node
            Ok(output)
        } else {
            // Execute the first next node (simple linear execution)
            // In a more complex system, you'd handle branching here
            let next_id = &next_nodes[0];
            self.execute_node_path(next_id, context, log).await
        }
    }

    async fn execute_node(
        &self,
        node: &WorkflowNode,
        input: &HashMap<String, WorkflowValue>,
        _context: &HashMap<String, WorkflowValue>,
    ) -> Result<WorkflowValue, String> {
        match node.node_type.as_str() {
            "input" => self.execute_input_node(input),
            "logic" => self.execute_logic_node(node, input).await,
            "output" => self.execute_output_node(node, input).await,
            _ => Err(format!("Unknown node type: {}", node.node_type)),
        }
    }

    fn execute_input_node(
        &self,
        input: &HashMap<String, WorkflowValue>,
    ) -> Result<WorkflowValue, String> {
        // Input nodes pass through their input
        if let Some(value) = input.get("value") {
            Ok(value.clone())
        } else {
            Ok(WorkflowValue::Null)
        }
    }

    async fn execute_logic_node(
        &self,
        node: &WorkflowNode,
        input: &HashMap<String, WorkflowValue>,
    ) -> Result<WorkflowValue, String> {
        let value = input
            .get("value")
            .cloned()
            .ok_or_else(|| "Missing input value".to_string())?;

        match node.label.as_str() {
            "If/Then" => self.execute_if_then(&node.config, &value),
            "Transform" => self.execute_transform(&value),
            "Loop" => self.execute_loop(&value),
            "Merge" => Ok(WorkflowValue::Object(input.clone())),
            _ => Ok(value),
        }
    }

    fn execute_if_then(
        &self,
        config: &serde_json::Value,
        value: &WorkflowValue,
    ) -> Result<WorkflowValue, String> {
        let condition = config
            .get("condition")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "No condition specified".to_string())?;

        let result = self.evaluate_condition(value, condition)?;

        Ok(WorkflowValue::Object({
            let mut obj = HashMap::new();
            obj.insert(
                "condition_result".to_string(),
                WorkflowValue::Boolean(result),
            );
            obj.insert("value".to_string(), value.clone());
            obj
        }))
    }

    fn execute_transform(&self, value: &WorkflowValue) -> Result<WorkflowValue, String> {
        match value {
            WorkflowValue::String(s) => {
                // Simple transformation: uppercase
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
    }

    fn execute_loop(&self, value: &WorkflowValue) -> Result<WorkflowValue, String> {
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
            _ => Err("Loop node expects an array".to_string()),
        }
    }

    async fn execute_output_node(
        &self,
        node: &WorkflowNode,
        input: &HashMap<String, WorkflowValue>,
    ) -> Result<WorkflowValue, String> {
        let value = input
            .get("value")
            .cloned()
            .ok_or_else(|| "Missing input value".to_string())?;

        match node.label.as_str() {
            "Save to DB" => {
                // In a real implementation, this would save to DB
                Ok(WorkflowValue::Object({
                    let mut obj = HashMap::new();
                    obj.insert(
                        "status".to_string(),
                        WorkflowValue::String("saved".to_string()),
                    );
                    obj
                }))
            }
            "Export CSV" => {
                // Convert to CSV format
                Ok(WorkflowValue::Object({
                    let mut obj = HashMap::new();
                    obj.insert(
                        "format".to_string(),
                        WorkflowValue::String("csv".to_string()),
                    );
                    obj
                }))
            }
            "Send Email" => {
                // In a real implementation, this would send an email
                Ok(WorkflowValue::Object({
                    let mut obj = HashMap::new();
                    obj.insert(
                        "status".to_string(),
                        WorkflowValue::String("sent".to_string()),
                    );
                    obj
                }))
            }
            "Webhook" => {
                // In a real implementation, this would send an HTTP request
                Ok(WorkflowValue::Object({
                    let mut obj = HashMap::new();
                    obj.insert(
                        "status".to_string(),
                        WorkflowValue::String("sent".to_string()),
                    );
                    obj
                }))
            }
            _ => Ok(value),
        }
    }

    fn evaluate_condition(
        &self,
        value: &WorkflowValue,
        condition: &str,
    ) -> Result<bool, String> {
        // Parse simple conditions like "amount > 500"
        let parts: Vec<&str> = condition.split_whitespace().collect();

        if parts.len() != 3 {
            return Err("Condition must be in format: field operator value".to_string());
        }

        let operator = parts[1];
        let threshold: f64 = parts[2]
            .parse()
            .map_err(|_| "Value must be numeric".to_string())?;

        let num_value = match value {
            WorkflowValue::Integer(i) => *i as f64,
            WorkflowValue::Float(f) => *f,
            WorkflowValue::String(s) => s
                .parse::<f64>()
                .map_err(|_| format!("Cannot parse '{}' as number", s))?,
            _ => return Err("Cannot convert to number".to_string()),
        };

        let result = match operator {
            ">" => num_value > threshold,
            "<" => num_value < threshold,
            ">=" => num_value >= threshold,
            "<=" => num_value <= threshold,
            "==" | "=" => (num_value - threshold).abs() < f64::EPSILON,
            "!=" => (num_value - threshold).abs() >= f64::EPSILON,
            _ => return Err(format!("Unknown operator: {}", operator)),
        };

        Ok(result)
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
