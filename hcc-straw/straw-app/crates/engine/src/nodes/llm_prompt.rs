use super::{NodeError, NodeInputs, NodeOutputs, NodeResult, NodeSchema, NodeValue, SchemaField};
use std::collections::HashMap;

pub fn schema() -> NodeSchema {
    NodeSchema {
        kind: "llm_prompt".into(),
        label: "LLM Prompt".into(),
        description: "Send a prompt to the bundled model or a local loopback LLM.".into(),
        category: "AI".into(),
        inputs: vec!["prompt".into()],
        outputs: vec!["response".into()],
        config_fields: vec![
            SchemaField {
                name: "model".into(),
                label: "Model".into(),
                field_type: "text".into(),
                default: Some("llama3.2".into()),
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
                default: Some("http://127.0.0.1:11434/api/generate".into()),
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
    execute_with(config, inputs, &crate::network::generate)
}
pub fn execute_with(
    config: &HashMap<String, String>,
    inputs: NodeInputs,
    generate: &dyn Fn(&crate::contract::ModelSettings, &str, &str) -> Result<String, String>,
) -> NodeResult {
    let config = schema()
        .validated_config(config)
        .map_err(NodeError::Execution)?;
    let prompt = inputs
        .0
        .get("prompt")
        .and_then(NodeValue::as_text)
        .ok_or_else(|| NodeError::MissingInput("prompt".into()))?;
    let settings = crate::contract::ModelSettings {
        model: config.get("model").cloned().unwrap_or("llama3.2".into()),
        api_url: config
            .get("api_url")
            .cloned()
            .unwrap_or("http://127.0.0.1:11434/api/generate".into()),
        temperature: config
            .get("temperature")
            .map(|s| s.parse())
            .transpose()
            .map_err(|_| NodeError::Execution("invalid temperature".into()))?
            .unwrap_or(0.7),
    };
    let system = config
        .get("system_prompt")
        .map(String::as_str)
        .unwrap_or("You are a helpful assistant.");
    let text = generate(&settings, prompt, system).map_err(NodeError::Execution)?;
    Ok(NodeOutputs::single("response", NodeValue::Text(text)))
}
