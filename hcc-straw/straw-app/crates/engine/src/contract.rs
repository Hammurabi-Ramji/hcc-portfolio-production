use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Attachment {
    pub name: String,
    pub mime_type: String,
    pub size_bytes: u64,
    pub data: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CodeFile {
    pub id: String,
    pub path: String,
    pub content: String,
    pub is_dirty: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ModelSettings {
    pub model: String,
    pub api_url: String,
    pub temperature: f64,
}

impl Default for ModelSettings {
    fn default() -> Self {
        Self {
            model: "llama3.2".into(),
            api_url: "http://127.0.0.1:11434/api/generate".into(),
            temperature: 0.7,
        }
    }
}
