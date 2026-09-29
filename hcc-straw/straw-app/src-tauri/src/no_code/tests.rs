#[cfg(test)]
mod tests {
    use crate::no_code::workflow_executor::*;
    use crate::no_code::types::*;
    use std::collections::HashMap;

    #[tokio::test]
    async fn test_input_node() {
        let executor = InputNodeExecutor;
        let mut context = ExecutionContext {
            variables: HashMap::new(),
            execution_log: Vec::new(),
        };
        let node = WorkflowNode {
            id: "test".to_string(),
            label: "Input".to_string(),
            node_type: "input".to_string(),
            description: "".to_string(),
            config: serde_json::json!({}),
            position: NodePosition::default(),
        };
        let mut input = HashMap::new();
        input.insert("value".to_string(), WorkflowValue::String("hello".to_string()));

        let result = executor.execute(&node, input, &mut context).await.unwrap();
        assert_eq!(result, WorkflowValue::String("hello".to_string()));
    }

    #[tokio::test]
    async fn test_transform_node() {
        let executor = TransformNodeExecutor;
        let mut context = ExecutionContext {
            variables: HashMap::new(),
            execution_log: Vec::new(),
        };
        let node = WorkflowNode {
            id: "test".to_string(),
            label: "Transform".to_string(),
            node_type: "transform".to_string(),
            description: "".to_string(),
            config: serde_json::json!({}),
            position: NodePosition::default(),
        };
        let mut input = HashMap::new();
        input.insert("value".to_string(), WorkflowValue::String("hello".to_string()));

        let result = executor.execute(&node, input, &mut context).await.unwrap();
        assert_eq!(result, WorkflowValue::String("HELLO".to_string()));
    }

    #[tokio::test]
    async fn test_if_then_node() {
        let executor = IfThenNodeExecutor;
        let mut context = ExecutionContext {
            variables: HashMap::new(),
            execution_log: Vec::new(),
        };
        let node = WorkflowNode {
            id: "test".to_string(),
            label: "IfThen".to_string(),
            node_type: "if_then".to_string(),
            description: "".to_string(),
            config: serde_json::json!({
                "condition": "> 10"
            }),
            position: NodePosition::default(),
        };
        
        // Test true case
        let mut input = HashMap::new();
        input.insert("value".to_string(), WorkflowValue::Integer(15));
        let result = executor.execute(&node, input, &mut context).await.unwrap();
        if let WorkflowValue::Object(obj) = result {
            assert_eq!(obj.get("condition_result").unwrap(), &WorkflowValue::Boolean(true));
        } else {
            panic!("Expected object result");
        }

        // Test false case
        let mut input = HashMap::new();
        input.insert("value".to_string(), WorkflowValue::Integer(5));
        let result = executor.execute(&node, input, &mut context).await.unwrap();
        if let WorkflowValue::Object(obj) = result {
            assert_eq!(obj.get("condition_result").unwrap(), &WorkflowValue::Boolean(false));
        } else {
            panic!("Expected object result");
        }
    }

    #[tokio::test]
    async fn test_workflow_execution() {
        let definition = WorkflowDefinition {
            id: "wf1".to_string(),
            name: "Test Workflow".to_string(),
            description: "A test workflow".to_string(),
            status: "active".to_string(),
            version: 1,
            nodes: vec![
                WorkflowNode {
                    id: "node1".to_string(),
                    label: "Input".to_string(),
                    node_type: "input".to_string(),
                    description: "".to_string(),
                    config: serde_json::json!({}),
                    position: NodePosition::default(),
                },
                WorkflowNode {
                    id: "node2".to_string(),
                    label: "Transform".to_string(),
                    node_type: "transform".to_string(),
                    description: "".to_string(),
                    config: serde_json::json!({}),
                    position: NodePosition::default(),
                }
            ],
            edges: vec![
                WorkflowEdge {
                    source: "node1".to_string(),
                    target: "node2".to_string(),
                    source_port: None,
                    target_port: None,
                }
            ],
        };

        let executor = WorkflowExecutor::new(definition);
        let mut input = HashMap::new();
        input.insert("value".to_string(), WorkflowValue::String("hello".to_string()));

        let result = executor.execute(input).await.unwrap();
        assert!(result.success);
        assert_eq!(result.final_output.unwrap(), WorkflowValue::String("HELLO".to_string()));
        assert_eq!(result.log.len(), 2);
    }
}
