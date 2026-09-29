pub mod read_file;
pub mod write_file;
pub mod transform;
pub mod filter;
pub mod template;
pub mod http_request;
pub mod text_input;
pub mod csv_parse;
pub mod join_text;
pub mod conditional;
pub mod llm_prompt;

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use thiserror::Error;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", content = "value")]
pub enum NodeValue {
    Text(String),
    Number(f64),
    Bool(bool),
    List(Vec<NodeValue>),
    Table(Vec<HashMap<String, String>>),
    Null,
}

impl NodeValue {
    pub fn as_text(&self) -> Option<&str> {
        if let NodeValue::Text(s) = self { Some(s) } else { None }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeInputs(pub HashMap<String, NodeValue>);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeOutputs(pub HashMap<String, NodeValue>);

impl NodeOutputs {
    pub fn single(key: &str, value: NodeValue) -> Self {
        let mut map = HashMap::new();
        map.insert(key.to_string(), value);
        NodeOutputs(map)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SchemaField {
    pub name: String,
    pub label: String,
    pub field_type: String, // "text" | "textarea" | "number" | "bool" | "select"
    pub default: Option<String>,
    pub options: Option<Vec<String>>,
    pub required: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeSchema {
    pub kind: String,
    pub label: String,
    pub description: String,
    pub category: String,
    pub inputs: Vec<String>,
    pub outputs: Vec<String>,
    pub config_fields: Vec<SchemaField>,
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
        "read_file"    => read_file::execute(config, inputs),
        "write_file"   => write_file::execute(config, inputs),
        "transform"    => transform::execute(config, inputs),
        "filter"       => filter::execute(config, inputs),
        "template"     => template::execute(config, inputs),
        "http_request" => http_request::execute(config, inputs),
        "text_input"   => text_input::execute(config, inputs),
        "csv_parse"    => csv_parse::execute(config, inputs),
        "join_text"    => join_text::execute(config, inputs),
        "conditional"  => conditional::execute(config, inputs),
        "llm_prompt"   => llm_prompt::execute(config, inputs),
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
