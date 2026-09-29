use std::collections::HashMap;
use super::{NodeError, NodeInputs, NodeOutputs, NodeResult, NodeSchema, NodeValue, SchemaField};

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
                options: Some(vec!["GET".into(), "POST".into(), "PUT".into(), "DELETE".into()]),
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
    let url = config.get("url").ok_or_else(|| NodeError::MissingInput("url".into()))?;
    let method = config.get("method").map(|s| s.as_str()).unwrap_or("GET");

    // Use non-blocking reqwest (tokio runtime)
    let runtime = tokio::runtime::Runtime::new().map_err(|e| NodeError::Execution(e.to_string()))?;
    
    let response = runtime.block_on(async {
        let client = reqwest::Client::new();
        let body = inputs.0.get("body").and_then(|v| v.as_text()).unwrap_or("").to_string();

        let mut req = match method {
            "POST"   => client.post(url).body(body),
            "PUT"    => client.put(url).body(body),
            "DELETE" => client.delete(url),
            _        => client.get(url),
        };

        if let Some(headers_json) = config.get("headers") {
            if let Ok(map) = serde_json::from_str::<HashMap<String, String>>(headers_json) {
                for (k, v) in map {
                    req = req.header(k, v);
                }
            }
        }

        req.send().await.map_err(|e| NodeError::Execution(e.to_string()))
    })?;
    
    let status = response.status().as_u16() as f64;
    let text = runtime.block_on(response.text()).map_err(|e| NodeError::Execution(e.to_string()))?;

    let mut out = HashMap::new();
    out.insert("response".into(), NodeValue::Text(text));
    out.insert("status".into(), NodeValue::Number(status));
    Ok(NodeOutputs(out))
}
