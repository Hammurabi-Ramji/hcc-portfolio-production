use std::collections::HashMap;
use super::{NodeError, NodeInputs, NodeOutputs, NodeResult, NodeSchema, NodeValue, SchemaField};

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
    let path = config.get("path").ok_or_else(|| NodeError::MissingInput("path".into()))?;
    let mode = config.get("mode").map(|s| s.as_str()).unwrap_or("overwrite");

    let content = inputs.0.get("content")
        .and_then(|v| v.as_text())
        .unwrap_or("");

    if mode == "append" {
        use std::io::Write;
        let mut f = std::fs::OpenOptions::new().append(true).create(true).open(path)?;
        writeln!(f, "{}", content)?;
    } else {
        std::fs::write(path, content)?;
    }

    Ok(NodeOutputs::single("path", NodeValue::Text(path.clone())))
}
