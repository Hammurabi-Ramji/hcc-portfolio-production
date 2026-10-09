use super::{NodeError, NodeInputs, NodeOutputs, NodeResult, NodeSchema, NodeValue, SchemaField};
use std::collections::HashMap;

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
    let config = schema()
        .validated_config(config)
        .map_err(NodeError::Execution)?;
    let path = config
        .get("path")
        .ok_or_else(|| NodeError::MissingInput("path".into()))?;
    let bytes = std::fs::read(path)?;
    let content = match config.get("encoding").map(String::as_str).unwrap_or("utf8") {
        "latin1" => bytes.into_iter().map(char::from).collect(),
        "utf8" => String::from_utf8(bytes).map_err(|e| NodeError::Execution(e.to_string()))?,
        _ => return Err(NodeError::Execution("unsupported encoding".into())),
    };
    Ok(NodeOutputs::single("content", NodeValue::Text(content)))
}
