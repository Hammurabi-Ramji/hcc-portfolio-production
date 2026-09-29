use std::collections::HashMap;
use super::{NodeError, NodeInputs, NodeOutputs, NodeResult, NodeSchema, NodeValue, SchemaField};

pub fn schema() -> NodeSchema {
    NodeSchema {
        kind: "json_extract".into(),
        label: "JSON Extract".into(),
        description: "Extract a value from JSON using a dot-path (e.g. user.address.city).".into(),
        category: "Data".into(),
        inputs: vec!["json".into()],
        outputs: vec!["value".into(), "found".into()],
        config_fields: vec![
            SchemaField {
                name: "path".into(),
                label: "Path (dot-notation)".into(),
                field_type: "text".into(),
                default: Some("key".into()),
                options: None,
                required: true,
            },
            SchemaField {
                name: "default".into(),
                label: "Default if missing".into(),
                field_type: "text".into(),
                default: Some("".into()),
                options: None,
                required: false,
            },
        ],
    }
}

pub fn execute(config: &HashMap<String, String>, inputs: NodeInputs) -> NodeResult {
    let json_str = inputs.0.get("json")
        .and_then(|v| v.as_text())
        .ok_or_else(|| NodeError::MissingInput("json".into()))?;

    let path = config.get("path").map(|s| s.as_str()).unwrap_or("").trim();
    let default = config.get("default").map(|s| s.as_str()).unwrap_or("");

    let root: serde_json::Value = serde_json::from_str(json_str)
        .map_err(|e| NodeError::Execution(format!("invalid JSON: {e}")))?;

    let extracted = if path.is_empty() {
        None
    } else {
        let mut cur = &root;
        let mut found = true;
        for segment in path.split('.') {
            // support array indexing: key[0] or just an integer segment
            if let Ok(idx) = segment.parse::<usize>() {
                match cur.get(idx) {
                    Some(v) => cur = v,
                    None => { found = false; break; }
                }
            } else {
                match cur.get(segment) {
                    Some(v) => cur = v,
                    None => { found = false; break; }
                }
            }
        }
        if found { Some(cur.clone()) } else { None }
    };

    let (value, was_found) = match extracted {
        Some(v) => {
            let nv = json_val_to_node(&v);
            (nv, NodeValue::Bool(true))
        }
        None => (NodeValue::Text(default.to_string()), NodeValue::Bool(false)),
    };

    let mut out = HashMap::new();
    out.insert("value".into(), value);
    out.insert("found".into(), was_found);
    Ok(NodeOutputs(out))
}

fn json_val_to_node(v: &serde_json::Value) -> NodeValue {
    match v {
        serde_json::Value::Null => NodeValue::Null,
        serde_json::Value::Bool(b) => NodeValue::Bool(*b),
        serde_json::Value::Number(n) => NodeValue::Number(n.as_f64().unwrap_or(0.0)),
        serde_json::Value::String(s) => NodeValue::Text(s.clone()),
        serde_json::Value::Array(arr) => {
            NodeValue::List(arr.iter().map(json_val_to_node).collect())
        }
        serde_json::Value::Object(_) => NodeValue::Text(v.to_string()),
    }
}
