use std::collections::HashMap;
use super::{NodeError, NodeInputs, NodeOutputs, NodeResult, NodeSchema, NodeValue, SchemaField};

pub fn schema() -> NodeSchema {
    NodeSchema {
        kind: "json_build".into(),
        label: "JSON Build".into(),
        description: "Build a JSON string from key=value pairs (one per line) and an optional input value.".into(),
        category: "Data".into(),
        inputs: vec!["value".into()],
        outputs: vec!["json".into()],
        config_fields: vec![
            SchemaField {
                name: "key".into(),
                label: "Root key for input value".into(),
                field_type: "text".into(),
                default: Some("data".into()),
                options: None,
                required: false,
            },
            SchemaField {
                name: "extra".into(),
                label: "Extra fields (key=value, one per line)".into(),
                field_type: "textarea".into(),
                default: None,
                options: None,
                required: false,
            },
            SchemaField {
                name: "pretty".into(),
                label: "Pretty print".into(),
                field_type: "bool".into(),
                default: Some("false".into()),
                options: None,
                required: false,
            },
        ],
    }
}

pub fn execute(config: &HashMap<String, String>, inputs: NodeInputs) -> NodeResult {
    let key = config.get("key").map(|s| s.as_str()).unwrap_or("data");
    let extra = config.get("extra").map(|s| s.as_str()).unwrap_or("");
    let pretty = config.get("pretty").map(|s| s == "true").unwrap_or(false);

    let mut obj = serde_json::Map::new();

    // Insert the wired input under its key (if provided)
    if let Some(val) = inputs.0.get("value") {
        obj.insert(key.to_string(), node_val_to_json(val));
    }

    // Parse extra key=value pairs
    for line in extra.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') { continue; }
        if let Some((k, v)) = line.split_once('=') {
            let k = k.trim().to_string();
            let v = v.trim();
            // Try numeric, then bool, then string
            let jv: serde_json::Value = if let Ok(n) = v.parse::<f64>() {
                serde_json::json!(n)
            } else if v == "true" {
                serde_json::Value::Bool(true)
            } else if v == "false" {
                serde_json::Value::Bool(false)
            } else if v == "null" {
                serde_json::Value::Null
            } else {
                serde_json::Value::String(v.to_string())
            };
            obj.insert(k, jv);
        }
    }

    let json_str = if pretty {
        serde_json::to_string_pretty(&obj)
    } else {
        serde_json::to_string(&obj)
    }
    .map_err(|e| NodeError::Execution(format!("json serialization failed: {e}")))?;

    Ok(NodeOutputs::single("json", NodeValue::Text(json_str)))
}

fn node_val_to_json(v: &NodeValue) -> serde_json::Value {
    match v {
        NodeValue::Null => serde_json::Value::Null,
        NodeValue::Bool(b) => serde_json::Value::Bool(*b),
        NodeValue::Number(n) => serde_json::json!(n),
        NodeValue::Text(s) => serde_json::Value::String(s.clone()),
        NodeValue::List(l) => serde_json::Value::Array(l.iter().map(node_val_to_json).collect()),
        NodeValue::Table(rows) => {
            let arr: Vec<serde_json::Value> = rows
                .iter()
                .map(|row| {
                    let obj: serde_json::Map<_, _> = row
                        .iter()
                        .map(|(k, v)| (k.clone(), serde_json::Value::String(v.clone())))
                        .collect();
                    serde_json::Value::Object(obj)
                })
                .collect();
            serde_json::Value::Array(arr)
        }
    }
}
