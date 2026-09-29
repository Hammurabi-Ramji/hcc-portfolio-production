use serde::{Deserialize, Serialize};

// ── Request / Response types ──────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NlpAttachment {
    pub id: String,
    pub kind: String,   // "image" | "document" | "url" | "audio"
    pub name: String,
    pub data: String,   // base64 for binary; raw text for url/audio transcript
    pub mime_type: String,
    pub size_bytes: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NlpMessage {
    pub id: String,
    pub role: String,   // "user" | "assistant" | "system"
    pub text: String,
    pub attachments: Vec<NlpAttachment>,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NlpRequest {
    pub messages: Vec<NlpMessage>,
    pub model: String,
    pub system_prompt: String,
    pub api_url: String,
    pub temperature: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NlpResponse {
    pub text: String,
    pub model: String,
    pub elapsed_ms: u64,
}

// ── Context builder ───────────────────────────────────────────────────────────

/// Converts attachments into human-readable context injected before the prompt.
fn build_context(attachments: &[NlpAttachment]) -> String {
    let mut parts: Vec<String> = Vec::new();

    for att in attachments {
        match att.kind.as_str() {
            "url" => {
                parts.push(format!(
                    "[URL: {}]\nContent:\n{}\n---",
                    att.name, att.data
                ));
            }
            "document" => {
                parts.push(format!(
                    "[Document: {}]\nContent:\n{}\n---",
                    att.name, att.data
                ));
            }
            "image" => {
                // For LLMs that support vision, we embed a note;
                // base64 data is available at att.data for multimodal APIs
                parts.push(format!(
                    "[Image attached: {} ({})]\n---",
                    att.name, att.mime_type
                ));
            }
            "audio" => {
                parts.push(format!(
                    "[Audio transcript: {}]\n{}\n---",
                    att.name, att.data
                ));
            }
            _ => {}
        }
    }

    parts.join("\n")
}

/// Build the full prompt string from conversation history + attachments.
fn build_prompt(messages: &[NlpMessage]) -> String {
    let mut parts: Vec<String> = Vec::new();

    for msg in messages {
        let context = build_context(&msg.attachments);
        let role_label = match msg.role.as_str() {
            "user" => "User",
            "assistant" => "Assistant",
            "system" => "System",
            _ => "User",
        };

        if !context.is_empty() {
            parts.push(format!("{}: [Context]\n{}\n{}", role_label, context, msg.text));
        } else {
            parts.push(format!("{}: {}", role_label, msg.text));
        }
    }

    parts.join("\n\n")
}

// ── URL fetcher ────────────────────────────────────────────────────────────────

pub fn fetch_url_content(url: &str) -> Result<String, String> {
    let runtime = tokio::runtime::Runtime::new()
        .map_err(|e| format!("Runtime error: {}", e))?;

    runtime.block_on(async {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(15))
            .user_agent("StrawFlow/0.1 URL-Fetcher")
            .build()
            .map_err(|e| e.to_string())?;

        let response = client.get(url).send().await.map_err(|e| e.to_string())?;

        if !response.status().is_success() {
            return Err(format!("HTTP {}: {}", response.status(), url));
        }

        let content_type = response
            .headers()
            .get("content-type")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("")
            .to_string();

        let text = response.text().await.map_err(|e| e.to_string())?;

        // Strip HTML tags for cleaner context
        if content_type.contains("text/html") {
            Ok(strip_html(&text))
        } else {
            Ok(text)
        }
    })
}

fn strip_html(html: &str) -> String {
    let mut result = String::new();
    let mut in_tag = false;

    for ch in html.chars() {
        match ch {
            '<' => in_tag = true,
            '>' => in_tag = false,
            _ if !in_tag => result.push(ch),
            _ => {}
        }
    }

    // Collapse whitespace
    result
        .lines()
        .map(|l| l.trim())
        .filter(|l| !l.is_empty())
        .collect::<Vec<_>>()
        .join("\n")
}

// ── Main NLP send ──────────────────────────────────────────────────────────────

pub fn send_nlp(request: &NlpRequest) -> Result<NlpResponse, String> {
    let start = std::time::Instant::now();

    let prompt = build_prompt(&request.messages);

    let body = serde_json::json!({
        "model": request.model,
        "prompt": prompt,
        "system": request.system_prompt,
        "stream": false,
        "options": {
            "temperature": request.temperature
        }
    });

    let runtime = tokio::runtime::Runtime::new()
        .map_err(|e| format!("Runtime error: {}", e))?;

    let response_text = runtime.block_on(async {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(120))
            .build()
            .map_err(|e| e.to_string())?;

        let response = client
            .post(&request.api_url)
            .header("Content-Type", "application/json")
            .body(body.to_string())
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("API error {}", response.status()));
        }

        response.text().await.map_err(|e| e.to_string())
    })?;

    let parsed: serde_json::Value = serde_json::from_str(&response_text)
        .map_err(|_| "Failed to parse JSON response".to_string())?;

    let text = parsed
        .get("response")
        .and_then(|v| v.as_str())
        .unwrap_or(&response_text)
        .to_string();

    Ok(NlpResponse {
        text,
        model: request.model.clone(),
        elapsed_ms: start.elapsed().as_millis() as u64,
    })
}
