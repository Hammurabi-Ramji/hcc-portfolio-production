use std::collections::HashMap;
use super::{NodeError, NodeInputs, NodeOutputs, NodeResult, NodeSchema, NodeValue, SchemaField};

pub fn schema() -> NodeSchema {
    NodeSchema {
        kind: "split_text".into(),
        label: "Split Text".into(),
        description: "Split a string into a List by a delimiter, with optional limit and trim.".into(),
        category: "Text".into(),
        inputs: vec!["text".into()],
        outputs: vec!["parts".into(), "count".into()],
        config_fields: vec![
            SchemaField {
                name: "delimiter".into(),
                label: "Delimiter".into(),
                field_type: "text".into(),
                default: Some(",".into()),
                options: None,
                required: true,
            },
            SchemaField {
                name: "trim".into(),
                label: "Trim each part".into(),
                field_type: "bool".into(),
                default: Some("true".into()),
                options: None,
                required: false,
            },
            SchemaField {
                name: "skip_empty".into(),
                label: "Skip empty parts".into(),
                field_type: "bool".into(),
                default: Some("true".into()),
                options: None,
                required: false,
            },
            SchemaField {
                name: "limit".into(),
                label: "Max parts (0 = unlimited)".into(),
                field_type: "number".into(),
                default: Some("0".into()),
                options: None,
                required: false,
            },
        ],
    }
}

pub fn execute(config: &HashMap<String, String>, inputs: NodeInputs) -> NodeResult {
    let text = inputs.0.get("text")
        .and_then(|v| v.as_text())
        .ok_or_else(|| NodeError::MissingInput("text".into()))?
        .to_string();

    let delimiter = config.get("delimiter").map(|s| s.as_str()).unwrap_or(",");
    let do_trim = config.get("trim").map(|s| s == "true").unwrap_or(true);
    let skip_empty = config.get("skip_empty").map(|s| s == "true").unwrap_or(true);
    let limit: usize = config.get("limit").and_then(|s| s.parse().ok()).unwrap_or(0);

    // Handle special escape sequences in delimiter
    let delim = delimiter
        .replace("\\n", "\n")
        .replace("\\t", "\t")
        .replace("\\r", "\r");

    let raw: Vec<&str> = if limit > 0 {
        text.splitn(limit, delim.as_str()).collect()
    } else {
        text.split(delim.as_str()).collect()
    };

    let parts: Vec<NodeValue> = raw
        .into_iter()
        .map(|s| if do_trim { s.trim() } else { s })
        .filter(|s| !skip_empty || !s.is_empty())
        .map(|s| NodeValue::Text(s.to_string()))
        .collect();

    let count = parts.len() as f64;

    let mut out = HashMap::new();
    out.insert("parts".into(), NodeValue::List(parts));
    out.insert("count".into(), NodeValue::Number(count));
    Ok(NodeOutputs(out))
}
