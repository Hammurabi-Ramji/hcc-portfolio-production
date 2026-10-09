use super::{NodeError, NodeInputs, NodeOutputs, NodeResult, NodeSchema, NodeValue, SchemaField};
use std::collections::HashMap;

pub fn schema() -> NodeSchema {
    NodeSchema {
        kind: "write_file".into(),
        label: "Write File".into(),
        description: "Write text content to a local file.".into(),
        category: "I/O".into(),
        inputs: vec!["content".into()],
        outputs: vec!["path".into()],
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
                name: "mode".into(),
                label: "Write Mode".into(),
                field_type: "select".into(),
                default: Some("overwrite".into()),
                options: Some(vec!["overwrite".into(), "append".into()]),
                required: false,
            },
        ],
    }
}

pub fn execute(config: &HashMap<String, String>, inputs: NodeInputs) -> NodeResult {
    let config = schema()
        .validated_config(config)
        .map_err(NodeError::Execution)?;
    let path = config
        .get("path")
        .ok_or_else(|| NodeError::MissingInput("path".into()))?;
    let mode = config
        .get("mode")
        .map(|s| s.as_str())
        .unwrap_or("overwrite");

    let content = inputs
        .0
        .get("content")
        .ok_or_else(|| NodeError::MissingInput("content".into()))?
        .as_text()
        .ok_or_else(|| NodeError::WrongType("content".into()))?;

    if mode == "append" {
        use std::io::Write;
        let mut f = std::fs::OpenOptions::new()
            .append(true)
            .create(true)
            .open(path)?;
        writeln!(f, "{}", content)?;
    } else {
        std::fs::write(path, content)?;
    }

    Ok(NodeOutputs::single("path", NodeValue::Text(path.clone())))
}
