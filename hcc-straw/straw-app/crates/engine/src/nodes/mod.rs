pub mod conditional;
pub mod csv_parse;
pub mod filter;
pub mod http_request;
pub mod join_text;
pub mod llm_prompt;
pub mod read_file;
pub mod template;
pub mod text_input;
pub mod transform;
pub mod write_file;

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use thiserror::Error;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, specta::Type)]
#[serde(tag = "type", content = "value")]
pub enum NodeValue {
    Text(String),
    Number(f64),
    Bool(bool),
    List(Vec<NodeValue>),
    Table(Vec<HashMap<String, String>>),
    Null,
    // Inactive branch: propagate without executing downstream nodes.
    Skipped,
}

impl NodeValue {
    pub fn as_text(&self) -> Option<&str> {
        if let NodeValue::Text(s) = self {
            Some(s)
        } else {
            None
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct NodeInputs(pub HashMap<String, NodeValue>);

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct NodeOutputs(pub HashMap<String, NodeValue>);

impl NodeOutputs {
    pub fn single(key: &str, value: NodeValue) -> Self {
        let mut map = HashMap::new();
        map.insert(key.to_string(), value);
        NodeOutputs(map)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct SchemaField {
    pub name: String,
    pub label: String,
    pub field_type: String, // "text" | "textarea" | "number" | "bool" | "select"
    pub default: Option<String>,
    pub options: Option<Vec<String>>,
    pub required: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct NodeSchema {
    pub kind: String,
    pub label: String,
    pub description: String,
    pub category: String,
    pub inputs: Vec<String>,
    pub outputs: Vec<String>,
    pub config_fields: Vec<SchemaField>,
}

/// Central port contract; string port lists stay wire-compatible with the editor.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub enum ValueType {
    Text,
    Number,
    Bool,
    TextList,
    Table,
}

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct InputSpec {
    pub name: String,
    pub required: bool,
    pub types: Vec<ValueType>,
}

impl NodeSchema {
    pub fn input_specs(&self) -> Vec<InputSpec> {
        use ValueType::*;
        self.inputs
            .iter()
            .map(|name| InputSpec {
                name: name.clone(),
                required: !matches!(self.kind.as_str(), "http_request" | "template"),
                types: match self.kind.as_str() {
                    "filter" => vec![Text, TextList],
                    "join_text" => vec![TextList],
                    "conditional" => vec![Text, Number, Bool],
                    _ => vec![Text],
                },
            })
            .collect()
    }

    pub fn output_types(&self, port: &str, config: &HashMap<String, String>) -> Vec<ValueType> {
        use ValueType::*;
        match self.kind.as_str() {
            "transform" => match config
                .get("operation")
                .map(String::as_str)
                .unwrap_or("uppercase")
            {
                "word_count" | "line_count" => vec![Number],
                "split_lines" => vec![TextList],
                _ => vec![Text],
            },
            "filter" => vec![TextList],
            "csv_parse" => vec![Table],
            "http_request" if port == "status" => vec![Number],
            // DAG narrows these to the actual upstream condition's types.
            "conditional" => vec![Text, Number, Bool],
            _ => vec![Text],
        }
    }

    /// Validate effective configuration before any graph node can execute.
    /// Supplied empty values are not replaced by defaults.
    pub fn validated_config(
        &self,
        supplied: &HashMap<String, String>,
    ) -> Result<HashMap<String, String>, String> {
        let mut config = supplied.clone();
        for field in &self.config_fields {
            if !config.contains_key(&field.name) {
                if let Some(default) = &field.default {
                    config.insert(field.name.clone(), default.clone());
                }
            }
            let value = config.get(&field.name);
            if field.required && value.is_none_or(|v| v.trim().is_empty()) {
                return Err(format!("{} requires {}", self.kind, field.name));
            }
            if let Some(value) = value {
                if field
                    .options
                    .as_ref()
                    .is_some_and(|options| !options.contains(value))
                {
                    return Err(format!("invalid {} choice", field.name));
                }
                match field.field_type.as_str() {
                    "bool" if value != "true" && value != "false" => {
                        return Err(format!("invalid {} boolean", field.name))
                    }
                    "number" if value.parse::<f64>().ok().is_none_or(|n| !n.is_finite()) => {
                        return Err(format!("invalid {} number", field.name))
                    }
                    _ => {}
                }
            }
        }
        match self.kind.as_str() {
            "http_request" => {
                crate::network::LoopbackEndpoint::parse(
                    config.get("url").map(String::as_str).unwrap_or(""),
                )?;
                let headers: HashMap<String, String> =
                    serde_json::from_str(config.get("headers").map(String::as_str).unwrap_or("{}"))
                        .map_err(|_| "invalid headers JSON")?;
                if headers.iter().any(|(k, v)| {
                    k.is_empty()
                        || k.chars().any(char::is_control)
                        || v.chars().any(char::is_control)
                }) {
                    return Err("invalid header".into());
                }
            }
            "llm_prompt" => {
                let endpoint=config.get("api_url").map(String::as_str).unwrap_or("");
                if endpoint=="candle://bundled" {if config.get("model").map(String::as_str)!=Some("rockypod/svelte-coder-4b"){return Err("bundled model identity mismatch".into());}}
                else {crate::network::LoopbackEndpoint::parse(endpoint)?;}
                let temperature = config
                    .get("temperature")
                    .and_then(|n| n.parse::<f64>().ok())
                    .ok_or("invalid temperature")?;
                if !(0.0..=2.0).contains(&temperature)
                    || config.get("model").is_none_or(|m| m.trim().is_empty())
                {
                    return Err("invalid model settings".into());
                }
            }
            "filter"
                if matches!(
                    config.get("condition").map(String::as_str),
                    Some("longer_than" | "shorter_than")
                ) =>
            {
                config
                    .get("value")
                    .ok_or("missing numeric filter value")?
                    .parse::<usize>()
                    .map_err(|_| "invalid numeric filter value")?;
            }
            _ => {}
        }
        Ok(config)
    }
}

impl ValueType {
    pub fn accepts(self, value: &NodeValue) -> bool {
        match (self, value) {
            (Self::Text, NodeValue::Text(_))
            | (Self::Bool, NodeValue::Bool(_))
            | (Self::Table, NodeValue::Table(_)) => true,
            (Self::Number, NodeValue::Number(n)) => n.is_finite(),
            (Self::TextList, NodeValue::List(items)) => {
                items.iter().all(|v| matches!(v, NodeValue::Text(_)))
            }
            _ => false,
        }
    }
}

#[derive(Debug, Error)]
pub enum NodeError {
    #[error("missing input: {0}")]
    MissingInput(String),
    #[error("wrong input type for {0}")]
    WrongType(String),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("execution error: {0}")]
    Execution(String),
}

pub type NodeResult = Result<NodeOutputs, NodeError>;

pub fn execute_node(
    kind: &str,
    config: &HashMap<String, String>,
    inputs: NodeInputs,
) -> NodeResult {
    match kind {
        "read_file" => read_file::execute(config, inputs),
        "write_file" => write_file::execute(config, inputs),
        "transform" => transform::execute(config, inputs),
        "filter" => filter::execute(config, inputs),
        "template" => template::execute(config, inputs),
        "http_request" => http_request::execute(config, inputs),
        "text_input" => text_input::execute(config, inputs),
        "csv_parse" => csv_parse::execute(config, inputs),
        "join_text" => join_text::execute(config, inputs),
        "conditional" => conditional::execute(config, inputs),
        "llm_prompt" => llm_prompt::execute(config, inputs),
        _ => Err(NodeError::Execution(format!("unknown node kind: {kind}"))),
    }
}

pub fn all_schemas() -> Vec<NodeSchema> {
    vec![
        read_file::schema(),
        write_file::schema(),
        transform::schema(),
        filter::schema(),
        template::schema(),
        http_request::schema(),
        text_input::schema(),
        csv_parse::schema(),
        join_text::schema(),
        conditional::schema(),
        llm_prompt::schema(),
    ]
}
#[cfg(test)]
mod regression;
