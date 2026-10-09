use super::{NodeError, NodeInputs, NodeOutputs, NodeResult, NodeSchema, NodeValue, SchemaField};
use std::collections::HashMap;

pub fn schema() -> NodeSchema {
    NodeSchema {
        kind: "template".into(),
        label: "Text Template".into(),
        description:
            "Fill {{variable}} placeholders from vars: JSON text mapping names to strings.".into(),
        category: "Text".into(),
        inputs: vec!["vars".into()],
        outputs: vec!["output".into()],
        config_fields: vec![SchemaField {
            name: "template".into(),
            label: "Template".into(),
            field_type: "textarea".into(),
            default: Some("Hello, {{name}}!".into()),
            options: None,
            required: true,
        }],
    }
}

pub fn execute(config: &HashMap<String, String>, inputs: NodeInputs) -> NodeResult {
    let config = schema()
        .validated_config(config)
        .map_err(NodeError::Execution)?;
    let template = config
        .get("template")
        .map(String::as_str)
        .unwrap_or("Hello, {{name}}!");
    let vars: HashMap<String, String> = match inputs.0.get("vars") {
        None => HashMap::new(),
        Some(NodeValue::Text(json)) => serde_json::from_str(json).map_err(|e| {
            NodeError::Execution(format!("vars must be a JSON object of strings: {e}"))
        })?,
        Some(_) => return Err(NodeError::WrongType("vars".into())),
    };
    // Scan only original text. Inserted values cannot introduce replacements.
    let mut result = String::new();
    let mut remaining = template;
    while let Some(start) = remaining.find("{{") {
        result.push_str(&remaining[..start]);
        let placeholder = &remaining[start..];
        let Some(end) = placeholder[2..].find("}}") else {
            result.push_str(placeholder);
            remaining = "";
            break;
        };
        let end = end + 2;
        let key = &placeholder[2..end];
        result.push_str(
            vars.get(key)
                .map(String::as_str)
                .unwrap_or(&placeholder[..end + 2]),
        );
        remaining = &placeholder[end + 2..];
    }
    result.push_str(remaining);

    Ok(NodeOutputs::single("output", NodeValue::Text(result)))
}
