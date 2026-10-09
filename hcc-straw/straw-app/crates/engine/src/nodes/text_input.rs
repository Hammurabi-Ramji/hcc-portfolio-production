use super::{NodeError, NodeInputs, NodeOutputs, NodeResult, NodeSchema, NodeValue, SchemaField};
use std::collections::HashMap;

pub fn schema() -> NodeSchema {
    NodeSchema {
        kind: "text_input".into(),
        label: "Text Input".into(),
        description: "Provide static text as a source for your flow.".into(),
        category: "I/O".into(),
        inputs: vec![],
        outputs: vec!["text".into()],
        config_fields: vec![SchemaField {
            name: "text".into(),
            label: "Text Content".into(),
            field_type: "textarea".into(),
            default: Some("Hello, World!".into()),
            options: None,
            required: true,
        }],
    }
}

pub fn execute(config: &HashMap<String, String>, _inputs: NodeInputs) -> NodeResult {
    let config = schema()
        .validated_config(config)
        .map_err(NodeError::Execution)?;
    let text = config
        .get("text")
        .map(|s| s.as_str())
        .unwrap_or("Hello, World!");
    Ok(NodeOutputs::single(
        "text",
        NodeValue::Text(text.to_string()),
    ))
}
