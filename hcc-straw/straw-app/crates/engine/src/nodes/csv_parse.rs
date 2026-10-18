use super::{NodeError, NodeInputs, NodeOutputs, NodeResult, NodeSchema, NodeValue, SchemaField};
use csv::ReaderBuilder;
use std::collections::HashMap;

pub fn schema() -> NodeSchema {
    NodeSchema {
        kind: "csv_parse".into(),
        label: "Parse CSV".into(),
        description: "Parse CSV text into records; headerless columns use column_1, column_2, etc."
            .into(),
        category: "Text".into(),
        inputs: vec!["csv".into()],
        outputs: vec!["table".into()],
        config_fields: vec![
            SchemaField {
                name: "delimiter".into(),
                label: "Delimiter".into(),
                field_type: "select".into(),
                default: Some(",".into()),
                options: Some(vec![",".into(), ";".into(), "\t".into()]),
                required: false,
            },
            SchemaField {
                name: "has_header".into(),
                label: "Has Header Row".into(),
                field_type: "bool".into(),
                default: Some("true".into()),
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
    let csv_text = inputs
        .0
        .get("csv")
        .and_then(|v| v.as_text())
        .ok_or_else(|| NodeError::MissingInput("csv".into()))?
        .to_string();

    // Schema validation restricts delimiters before indexing or calling csv.
    let delimiter = match config.get("delimiter").map(String::as_str) {
        Some(",") => b',',
        Some(";") => b';',
        Some("\t") => b'\t',
        _ => return Err(NodeError::Execution("unsupported delimiter".into())),
    };
    let has_header = config.get("has_header").is_some_and(|s| s == "true");
    let mut reader = ReaderBuilder::new()
        .delimiter(delimiter)
        .has_headers(has_header)
        .from_reader(csv_text.as_bytes());
    let headers = if has_header {
        Some(
            reader
                .headers()
                .map_err(|e| NodeError::Execution(e.to_string()))?
                .clone(),
        )
    } else {
        None
    };
    let mut table = Vec::new();
    for result in reader.records() {
        let record = result.map_err(|e| NodeError::Execution(e.to_string()))?;
        let row = record
            .iter()
            .enumerate()
            .map(|(index, value)| {
                let key = headers
                    .as_ref()
                    .and_then(|h| h.get(index))
                    .map(str::to_owned)
                    .unwrap_or_else(|| format!("column_{}", index + 1));
                (key, value.to_owned())
            })
            .collect();
        table.push(row);
    }

    Ok(NodeOutputs::single("table", NodeValue::Table(table)))
}
