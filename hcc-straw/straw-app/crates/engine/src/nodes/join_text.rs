use super::{NodeError, NodeInputs, NodeOutputs, NodeResult, NodeSchema, NodeValue, SchemaField};
use std::collections::HashMap;

pub fn schema() -> NodeSchema {
    NodeSchema {
        kind: "join_text".into(),
        label: "Join Text".into(),
        description: "Join a list of text items into a single string with a separator.".into(),
        category: "Text".into(),
        inputs: vec!["list".into()],
        outputs: vec!["text".into()],
        config_fields: vec![SchemaField {
            name: "separator".into(),
            label: "Separator".into(),
            field_type: "text".into(),
            default: Some("\n".into()),
            options: None,
            required: false,
        }],
    }
}

pub fn execute(config: &HashMap<String, String>, inputs: NodeInputs) -> NodeResult {
    let config = schema()
        .validated_config(config)
        .map_err(NodeError::Execution)?;
    let list_value = inputs
        .0
        .get("list")
        .ok_or_else(|| NodeError::MissingInput("list".into()))?;

    let items: Vec<String> = match list_value {
        NodeValue::List(items) => items
            .iter()
            .enumerate()
            .map(|(index, v)| {
                v.as_text()
                    .map(str::to_owned)
                    .ok_or_else(|| NodeError::WrongType(format!("list[{index}]")))
            })
            .collect::<Result<Vec<_>, _>>()?,
        _ => return Err(NodeError::WrongType("list".into())),
    };

    let separator = config.get("separator").map(|s| s.as_str()).unwrap_or("\n");
    let result = items.join(separator);

    Ok(NodeOutputs::single("text", NodeValue::Text(result)))
}
