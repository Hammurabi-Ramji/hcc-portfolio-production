use super::{NodeError, NodeInputs, NodeOutputs, NodeResult, NodeSchema, NodeValue, SchemaField};
use std::collections::HashMap;

pub fn schema() -> NodeSchema {
    NodeSchema {
        kind: "http_request".into(),
        label: "HTTP Request".into(),
        description: "Make an HTTP GET or POST request and return the response body.".into(),
        category: "I/O".into(),
        inputs: vec!["body".into()],
        outputs: vec!["response".into(), "status".into()],
        config_fields: vec![
            SchemaField {
                name: "url".into(),
                label: "URL".into(),
                field_type: "text".into(),
                default: None,
                options: None,
                required: true,
            },
            SchemaField {
                name: "method".into(),
                label: "Method".into(),
                field_type: "select".into(),
                default: Some("GET".into()),
                options: Some(vec![
                    "GET".into(),
                    "POST".into(),
                    "PUT".into(),
                    "DELETE".into(),
                ]),
                required: true,
            },
            SchemaField {
                name: "headers".into(),
                label: "Headers (JSON)".into(),
                field_type: "textarea".into(),
                default: Some("{}".into()),
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
    let url = config
        .get("url")
        .ok_or_else(|| NodeError::MissingInput("url".into()))?;
    let method = config.get("method").map(String::as_str).unwrap_or("GET");
    let headers = config
        .get("headers")
        .map(|s| serde_json::from_str::<HashMap<String, String>>(s))
        .transpose()
        .map_err(|e| NodeError::Execution(e.to_string()))?
        .unwrap_or_default();
    let body = match inputs.0.get("body") {
        None => "",
        Some(NodeValue::Text(text)) => text.as_str(),
        Some(_) => return Err(NodeError::WrongType("body".into())),
    };
    let (status, text) =
        crate::network::request(method, url, &headers, body).map_err(NodeError::Execution)?;
    Ok(NodeOutputs(HashMap::from([
        ("response".into(), NodeValue::Text(text)),
        ("status".into(), NodeValue::Number(status as f64)),
    ])))
}
