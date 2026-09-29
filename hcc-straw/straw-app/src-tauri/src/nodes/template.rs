use std::collections::HashMap;
use super::{NodeInputs, NodeOutputs, NodeResult, NodeSchema, NodeValue, SchemaField};

pub fn schema() -> NodeSchema {
    NodeSchema {
        kind: "template".into(),
        label: "Text Template".into(),
        description: "Build a string using {{variable}} placeholders filled from inputs.".into(),
        category: "Text".into(),
        inputs: vec!["vars".into()],
        outputs: vec!["output".into()],
        config_fields: vec![
            SchemaField {
                name: "template".into(),
                label: "Template".into(),
                field_type: "textarea".into(),
                default: Some("Hello, {{name}}!".into()),
                options: None,
                required: true,
            },
        ],
    }
}

pub fn execute(config: &HashMap<String, String>, inputs: NodeInputs) -> NodeResult {
    let template = config.get("template").map(|s| s.as_str()).unwrap_or("");
    let mut result = template.to_string();

    // Replace {{key}} with matching input values or direct config values
    for (key, value) in &inputs.0 {
        if let Some(text) = value.as_text() {
            result = result.replace(&format!("{{{{{key}}}}}"), text);
        }
    }

    // Also allow direct inputs passed as flat text under their key names
    for (key, val) in config {
        if key != "template" {
            result = result.replace(&format!("{{{{{key}}}}}"), val);
        }
    }

    Ok(NodeOutputs::single("output", NodeValue::Text(result)))
}
