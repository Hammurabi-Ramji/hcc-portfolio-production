use super::{NodeError, NodeInputs, NodeOutputs, NodeResult, NodeSchema, NodeValue, SchemaField};
use std::collections::HashMap;

pub fn schema() -> NodeSchema {
    NodeSchema {
        kind: "filter".into(),
        label: "Filter".into(),
        description: "Filter lines or list items by a condition.".into(),
        category: "Logic".into(),
        inputs: vec!["input".into()],
        outputs: vec!["passed".into(), "rejected".into()],
        config_fields: vec![
            SchemaField {
                name: "condition".into(),
                label: "Condition".into(),
                field_type: "select".into(),
                default: Some("contains".into()),
                options: Some(vec![
                    "contains".into(),
                    "not_contains".into(),
                    "starts_with".into(),
                    "ends_with".into(),
                    "is_empty".into(),
                    "not_empty".into(),
                    "longer_than".into(),
                    "shorter_than".into(),
                ]),
                required: true,
            },
            SchemaField {
                name: "value".into(),
                label: "Value".into(),
                field_type: "text".into(),
                default: None,
                options: None,
                required: false,
            },
        ],
    }
}

pub fn execute(config: &HashMap<String, String>, inputs: NodeInputs) -> NodeResult {
    let config = schema()
        .validated_config(config)
        .map_err(NodeError::Execution)?;
    let condition = config
        .get("condition")
        .map(|s| s.as_str())
        .unwrap_or("contains");
    let value = config.get("value").map(|s| s.as_str()).unwrap_or("");

    let input = inputs
        .0
        .get("input")
        .ok_or_else(|| NodeError::MissingInput("input".into()))?;

    let items: Vec<String> = match input {
        NodeValue::Text(t) => t.lines().map(|l| l.to_string()).collect(),
        NodeValue::List(l) => l
            .iter()
            .enumerate()
            .map(|(index, v)| {
                v.as_text()
                    .map(str::to_owned)
                    .ok_or_else(|| NodeError::WrongType(format!("input[{index}]")))
            })
            .collect::<Result<Vec<_>, _>>()?,
        _ => return Err(NodeError::WrongType("input".into())),
    };

    let threshold = if matches!(condition, "longer_than" | "shorter_than") {
        Some(
            value
                .parse::<usize>()
                .map_err(|_| NodeError::Execution("invalid numeric filter value".into()))?,
        )
    } else {
        None
    };

    let (passed, rejected): (Vec<_>, Vec<_>) =
        items.into_iter().partition(|item| match condition {
            "contains" => item.contains(value),
            "not_contains" => !item.contains(value),
            "starts_with" => item.starts_with(value),
            "ends_with" => item.ends_with(value),
            "is_empty" => item.trim().is_empty(),
            "not_empty" => !item.trim().is_empty(),
            "longer_than" => threshold.is_some_and(|n| item.len() > n),
            "shorter_than" => threshold.is_some_and(|n| item.len() < n),
            _ => false,
        });

    let to_list = |v: Vec<String>| NodeValue::List(v.into_iter().map(NodeValue::Text).collect());

    let mut out = HashMap::new();
    out.insert("passed".into(), to_list(passed));
    out.insert("rejected".into(), to_list(rejected));
    Ok(NodeOutputs(out))
}
