use serde::{Deserialize, Serialize};
use reqwest::Client;

#[derive(Serialize, Deserialize)]
pub struct OllamaRequest {
    pub model: String,
    pub prompt: String,
    pub stream: bool,
}

#[derive(Serialize, Deserialize)]
pub struct OllamaResponse {
    pub response: String,
}

pub struct AIEngine {
    client: Client,
    base_url: String,
}

impl AIEngine {
    pub fn new(base_url: Option<String>) -> Self {
        Self {
            client: Client::new(),
            base_url: base_url.unwrap_or_else(|| "http://localhost:11434".to_string()),
        }
    }

    pub async fn prompt(&self, model: &str, prompt: &str) -> Result<String, reqwest::Error> {
        let url = format!("{}/api/generate", self.base_url);
        let request = OllamaRequest {
            model: model.to_string(),
            prompt: prompt.to_string(),
            stream: false,
        };

        let res = self.client.post(&url)
            .json(&request)
            .send()
            .await?
            .json::<OllamaResponse>()
            .await?;

        Ok(res.response)
    }
}
