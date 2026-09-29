use std::collections::HashMap;
use super::{NodeError, NodeInputs, NodeOutputs, NodeResult, NodeSchema, NodeValue, SchemaField};
use regex::Regex;

pub fn schema() -> NodeSchema {
    NodeSchema {
        kind: "regex_extract".into(),
        label: "Regex Extract".into(),
        description: "Extract text using a regular expression. Returns first match or all matches.".into(),
        category: "Text".into(),
        inputs: vec!["text".into()],
        outputs: vec!["match".into(), "groups".into(), "all_matches".into()],
        config_fields: vec![
            SchemaField {
                name: "pattern".into(),
                label: "Pattern (regex)".into(),
                field_type: "text".into(),
                default: Some(r"\w+".into()),
                options: None,
                required: true,
            },
            SchemaField {
                name: "mode".into(),
                label: "Mode".into(),
                field_type: "select".into(),
                default: Some("first".into()),
                options: Some(vec!["first".into(), "all".into(), "test".into()]),
                required: true,
            },
            SchemaField {
                name: "group".into(),
                label: "Capture group (0 = full match)".into(),
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

    let pattern = config.get("pattern").map(|s| s.as_str()).unwrap_or(r"\w+");
    let mode = config.get("mode").map(|s| s.as_str()).unwrap_or("first");
    let group: usize = config.get("group").and_then(|s| s.parse().ok()).unwrap_or(0);

    let re = Regex::new(pattern)
        .map_err(|e| NodeError::Execution(format!("invalid regex: {e}")))?;

    let mut out = HashMap::new();

    match mode {
        "test" => {
            let matched = re.is_match(&text);
            out.insert("match".into(), NodeValue::Bool(matched));
            out.insert("groups".into(), NodeValue::List(vec![]));
            out.insert("all_matches".into(), NodeValue::List(vec![]));
        }
        "all" => {
            let all: Vec<NodeValue> = re.find_iter(&text)
                .map(|m| NodeValue::Text(m.as_str().to_string()))
                .collect();
            let first = all.first().cloned().unwrap_or(NodeValue::Null);
            out.insert("match".into(), first);
            out.insert("groups".into(), NodeValue::List(vec![]));
            out.insert("all_matches".into(), NodeValue::List(all));
        }
        _ => {
            // "first" mode — return first match + capture groups
            match re.captures(&text) {
                None => {
                    out.insert("match".into(), NodeValue::Null);
                    out.insert("groups".into(), NodeValue::List(vec![]));
                    out.insert("all_matches".into(), NodeValue::List(vec![]));
                }
                Some(caps) => {
                    let full = caps.get(0).map(|m| m.as_str()).unwrap_or("").to_string();
                    let selected = caps.get(group).map(|m| m.as_str()).unwrap_or(&full).to_string();
                    let groups: Vec<NodeValue> = (0..caps.len())
                        .map(|i| caps.get(i).map(|m| NodeValue::Text(m.as_str().to_string())).unwrap_or(NodeValue::Null))
                        .collect();
                    out.insert("match".into(), NodeValue::Text(selected));
                    out.insert("groups".into(), NodeValue::List(groups));
                    out.insert("all_matches".into(), NodeValue::List(vec![]));
                }
            }
        }
    }

    Ok(NodeOutputs(out))
}
