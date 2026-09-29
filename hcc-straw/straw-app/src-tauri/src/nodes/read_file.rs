use std::collections::HashMap;
use super::{NodeError, NodeInputs, NodeOutputs, NodeResult, NodeSchema, NodeValue, SchemaField};

pub fn schema() -> NodeSchema {
    NodeSchema {
        kind: "read_file".into(),
        label: "Read File".into(),
        description: "Read text content from a local file.".into(),
        category: "I/O".into(),
        inputs: vec![],
        outputs: vec!["content".into()],
        config_fields: vec![
            SchemaField {
                name: "path".into(),
                label: "File Path".into(),
                field_type: "text".into(),
                default: None,
                options: None,
                required: true,
            },
            SchemaField {
                name: "encoding".into(),
                label: "Encoding".into(),
                field_type: "select".into(),
                default: Some("utf8".into()),
                options: Some(vec!["utf8".into(), "latin1".into()]),
                required: false,
            },
        ],
    }
}

pub fn execute(config: &HashMap<String, String>, _inputs: NodeInputs) -> NodeResult {
    let path = config.get("path").ok_or_else(|| NodeError::MissingInput("path".into()))?;
    let content = std::fs::read_to_string(path)?;
    Ok(NodeOutputs::single("content", NodeValue::Text(content)))
}
