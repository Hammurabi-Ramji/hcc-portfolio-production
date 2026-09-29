use std::collections::HashMap;
use super::{NodeError, NodeInputs, NodeOutputs, NodeResult, NodeSchema, NodeValue, SchemaField};

pub fn schema() -> NodeSchema {
    NodeSchema {
        kind: "join_text".into(),
        label: "Join Text".into(),
        description: "Join a list of text items into a single string with a separator.".into(),
        category: "Text".into(),
        inputs: vec!["list".into()],
        outputs: vec!["text".into()],
        config_fields: vec![
            SchemaField {
                name: "separator".into(),
                label: "Separator".into(),
                field_type: "text".into(),
                default: Some("\n".into()),
                options: None,
                required: false,
            },
        ],
    }
}

pub fn execute(config: &HashMap<String, String>, inputs: NodeInputs) -> NodeResult {
    let list_value = inputs.0.get("list")
        .ok_or_else(|| NodeError::MissingInput("list".into()))?;

    let items: Vec<String> = match list_value {
        NodeValue::List(items) => items.iter().filter_map(|v| v.as_text().map(|s| s.to_string())).collect(),
        _ => return Err(NodeError::WrongType("list".into())),
    };

    let separator = config.get("separator").map(|s| s.as_str()).unwrap_or("");
    let result = items.join(separator);

    Ok(NodeOutputs::single("text", NodeValue::Text(result)))
}
