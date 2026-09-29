use std::collections::HashMap;
use csv::ReaderBuilder;
use super::{NodeError, NodeInputs, NodeOutputs, NodeResult, NodeSchema, NodeValue, SchemaField};

pub fn schema() -> NodeSchema {
    NodeSchema {
        kind: "csv_parse".into(),
        label: "Parse CSV".into(),
        description: "Parse CSV text into a table of records.".into(),
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
    let csv_text = inputs.0.get("csv")
        .and_then(|v| v.as_text())
        .ok_or_else(|| NodeError::MissingInput("csv".into()))?
        .to_string();

    let delimiter = config.get("delimiter").map(|s| s.as_bytes()[0]).unwrap_or(b',');
    let has_header = config.get("has_header").map(|s| s == "true").unwrap_or(true);

    let mut reader = ReaderBuilder::new()
        .delimiter(delimiter)
        .has_headers(has_header)
        .from_reader(csv_text.as_bytes());

    let mut table = Vec::new();
    
    for result in reader.deserialize() {
        let record: HashMap<String, String> = result.map_err(|e| NodeError::Execution(e.to_string()))?;
        table.push(record);
    }

    Ok(NodeOutputs::single("table", NodeValue::Table(table)))
}
