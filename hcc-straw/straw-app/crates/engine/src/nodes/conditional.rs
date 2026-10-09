use super::{NodeError, NodeInputs, NodeOutputs, NodeResult, NodeSchema, NodeValue};
use std::collections::HashMap;

pub fn schema() -> NodeSchema {
    NodeSchema {
        kind: "conditional".into(),
        label: "Conditional".into(),
        description: "Branch flow based on a boolean condition (true_branch / false_branch)."
            .into(),
        category: "Logic".into(),
        inputs: vec!["condition".into()],
        outputs: vec!["true_branch".into(), "false_branch".into()],
        config_fields: vec![],
    }
}

pub fn execute(_config: &HashMap<String, String>, inputs: NodeInputs) -> NodeResult {
    let condition_value = inputs
        .0
        .get("condition")
        .ok_or_else(|| NodeError::MissingInput("condition".into()))?;

    let is_true = match condition_value {
        NodeValue::Bool(b) => *b,
        NodeValue::Text(s) => s.to_lowercase() == "true" || s == "1",
        NodeValue::Number(n) if n.is_finite() => *n != 0.0,
        _ => return Err(NodeError::WrongType("condition".into())),
    };

    let mut outputs = HashMap::new();
    if is_true {
        outputs.insert("true_branch".into(), condition_value.clone());
        outputs.insert("false_branch".into(), NodeValue::Skipped);
    } else {
        outputs.insert("true_branch".into(), NodeValue::Skipped);
        outputs.insert("false_branch".into(), condition_value.clone());
    }

    Ok(NodeOutputs(outputs))
}
