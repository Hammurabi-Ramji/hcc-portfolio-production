use std::collections::HashMap;
use super::{NodeError, NodeInputs, NodeOutputs, NodeResult, NodeSchema, NodeValue, SchemaField};

pub fn schema() -> NodeSchema {
    NodeSchema {
        kind: "llm_prompt".into(),
        label: "LLM Prompt".into(),
        description: "Send a prompt to a local LLM (Ollama) or configurable API endpoint.".into(),
        category: "AI".into(),
        inputs: vec!["prompt".into()],
        outputs: vec!["response".into()],
        config_fields: vec![
            SchemaField {
                name: "model".into(),
                label: "Model".into(),
                field_type: "text".into(),
                default: Some("llama2".into()),
                options: None,
                required: false,
            },
            SchemaField {
                name: "system_prompt".into(),
                label: "System Prompt".into(),
                field_type: "textarea".into(),
                default: Some("You are a helpful assistant.".into()),
                options: None,
                required: false,
            },
            SchemaField {
                name: "api_url".into(),
                label: "API URL".into(),
                field_type: "text".into(),
                default: Some("http://localhost:11434/api/generate".into()),
                options: None,
                required: false,
            },
            SchemaField {
                name: "temperature".into(),
                label: "Temperature".into(),
                field_type: "number".into(),
                default: Some("0.7".into()),
                options: None,
                required: false,
            },
        ],
    }
}

pub fn execute(config: &HashMap<String, String>, inputs: NodeInputs) -> NodeResult {
    let prompt = inputs.0.get("prompt")
        .and_then(|v| v.as_text())
        .ok_or_else(|| NodeError::MissingInput("prompt".into()))?;

    let model = config.get("model").map(|s| s.as_str()).unwrap_or("llama2");
    let system_prompt = config.get("system_prompt").map(|s| s.as_str()).unwrap_or("");
    let api_url = config.get("api_url").map(|s| s.as_str()).unwrap_or("http://localhost:11434/api/generate");
    let temperature: f64 = config.get("temperature").map(|s| s.parse().unwrap_or(0.7)).unwrap_or(0.7);

    // Prepare request body for Ollama API
    let request_json = serde_json::json!({
        "model": model,
        "prompt": prompt,
        "system": system_prompt,
        "options": {
            "temperature": temperature
        }
    });

    let runtime = tokio::runtime::Runtime::new().map_err(|e| NodeError::Execution(e.to_string()))?;
    
    let response = runtime.block_on(async {
        let client = reqwest::Client::new();
        
        client
            .post(api_url)
            .header("Content-Type", "application/json")
            .body(request_json.to_string())
            .send()
            .await
            .map_err(|e| NodeError::Execution(format!("API request failed: {}", e)))
    })?;
    
    if !response.status().is_success() {
        return Err(NodeError::Execution(format!("API error: {}", response.status())));
    }

    // Parse response - Ollama returns: { "response": "the generated text", ... }
    let text = runtime.block_on(response.text())
        .map_err(|e| NodeError::Execution(format!("Failed to parse response: {}", e)))?;

    // Try to extract "response" field from JSON
    let parsed: serde_json::Value = serde_json::from_str(&text)
        .map_err(|_| NodeError::Execution("Failed to parse JSON response".into()))?;

    let response_text = parsed
        .get("response")
        .and_then(|v| v.as_str())
        .unwrap_or(&text)
        .to_string();

    Ok(NodeOutputs::single("response", NodeValue::Text(response_text)))
}
