use super::{NodeError, NodeInputs, NodeOutputs, NodeResult, NodeSchema, NodeValue, SchemaField};
use std::collections::HashMap;

pub fn schema() -> NodeSchema {
    NodeSchema {
        kind: "transform".into(),
        label: "Transform Text".into(),
        description: "Apply a transformation to text: uppercase, lowercase, trim, split, replace."
            .into(),
        category: "Text".into(),
        inputs: vec!["text".into()],
        outputs: vec!["result".into()],
        config_fields: vec![
            SchemaField {
                name: "operation".into(),
                label: "Operation".into(),
                field_type: "select".into(),
                default: Some("uppercase".into()),
                options: Some(vec![
                    "uppercase".into(),
                    "lowercase".into(),
                    "trim".into(),
                    "reverse".into(),
                    "word_count".into(),
                    "line_count".into(),
                    "replace".into(),
                    "split_lines".into(),
                ]),
                required: true,
            },
            SchemaField {
                name: "find".into(),
                label: "Find (for replace)".into(),
                field_type: "text".into(),
                default: None,
                options: None,
                required: false,
            },
            SchemaField {
                name: "replace_with".into(),
                label: "Replace With".into(),
                field_type: "text".into(),
                default: Some("".into()),
                options: None,
                required: false,
            },
        ],
    }
}

pub fn execute(config: &HashMap<String, String>, inputs: NodeInputs) -> NodeResult {
    let config = schema()
        .validated_config(config)
        .map_err(NodeError::Execution)?;
    let text = inputs
        .0
        .get("text")
        .and_then(|v| v.as_text())
        .ok_or_else(|| NodeError::MissingInput("text".into()))?
        .to_string();

    let op = config
        .get("operation")
        .map(|s| s.as_str())
        .unwrap_or("uppercase");

    let result = match op {
        "uppercase" => NodeValue::Text(text.to_uppercase()),
        "lowercase" => NodeValue::Text(text.to_lowercase()),
        "trim" => NodeValue::Text(text.trim().to_string()),
        "reverse" => NodeValue::Text(text.chars().rev().collect()),
        "word_count" => NodeValue::Number(text.split_whitespace().count() as f64),
        "line_count" => NodeValue::Number(text.lines().count() as f64),
        "replace" => {
            let find = config.get("find").map(|s| s.as_str()).unwrap_or("");
            let with = config.get("replace_with").map(|s| s.as_str()).unwrap_or("");
            NodeValue::Text(text.replace(find, with))
        }
        "split_lines" => NodeValue::List(
            text.lines()
                .map(|l| NodeValue::Text(l.to_string()))
                .collect(),
        ),
        _ => return Err(NodeError::Execution(format!("unknown operation: {op}"))),
    };

    Ok(NodeOutputs::single("result", result))
}
