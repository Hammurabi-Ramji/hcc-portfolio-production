//! NLP (Natural Language Processing) Command Handlers
//!
//! This module provides Tauri commands for multimodal AI interaction,
//! including text chat, URL fetching, and attachment processing.

use crate::types::{NlpRequest, NlpResponse, NlpMessage, NlpAttachment};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::time::Instant;
use tauri::State;

/// NLP Engine State
#[derive(Clone)]
pub struct NLPState {
    /// LLM API URL
    pub api_url: String,
    /// Model name
    pub model: String,
    /// Temperature setting
    pub temperature: f64,
    /// System prompt for general assistant
    pub system_prompt: String,
}

impl Default for NLPState {
    fn default() -> Self {
        Self {
            api_url: "http://localhost:11434/api/generate".to_string(),
            model: "llama2".to_string(),
            temperature: 0.7,
            system_prompt: "You are a helpful assistant. When you receive URLs, documents, or images, analyse them as part of the conversation.".to_string(),
        }
    }
}

/// Send a message to the LLM and get a response
#[tauri::command]
pub async fn nlp_send(request: NlpRequest) -> Result<NlpResponse, String> {
    let start = Instant::now();
    
    // Build the prompt from conversation history
    let prompt = build_conversation_prompt(&request.messages, &request.system_prompt);
    
    // Call the LLM
    let response = call_llm(&prompt, &request.model, &request.api_url, request.temperature)
        .await?;
    
    let elapsed = start.elapsed();
    
    Ok(NlpResponse {
        text: response,
        model: request.model,
        elapsed_ms: elapsed.as_millis() as u64,
    })
}

/// Fetch content from a URL
#[tauri::command]
pub async fn nlp_fetch_url(url: String) -> Result<String, String> {
    use reqwest::Client;
    
    let client = Client::new();
    
    let response = client
        .get(&url)
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .send()
        .await
        .map_err(|e| format!("Failed to fetch URL: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("URL returned error: {}", response.status()));
    }
    
    let content = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;
    
    Ok(content)
}

/// Build a conversation prompt from message history
fn build_conversation_prompt(messages: &[NlpMessage], system_prompt: &str) -> String {
    let mut prompt = String::new();
    
    // Add system prompt
    prompt.push_str(&format!("System: {}\n\n", system_prompt));
    
    // Add conversation history
    for msg in messages {
        match msg.role.as_str() {
            "user" => {
                prompt.push_str(&format!("User: {}\n", msg.text));
                
                // Add attachment context
                for att in &msg.attachments {
                    prompt.push_str(&format!("\n[Attachment: {} ({})]\n", att.name, att.kind));
                    
                    match att.kind.as_str() {
                        "document" => {
                            // For documents, use the content as context
                            if att.data.len() < 10000 {
                                prompt.push_str(&format!("Content:\n{}\n", att.data));
                            } else {
                                prompt.push_str(&format!("Content (truncated): {} chars\n", att.data.len()));
                            }
                        }
                        "image" => {
                            prompt.push_str(&format!("Image: {} (base64 data, {} bytes)\n", att.name, att.size_bytes.unwrap_or(0)));
                        }
                        "url" => {
                            prompt.push_str(&format!("URL: {}\n", att.data));
                        }
                        "audio" => {
                            prompt.push_str(&format!("Audio: {} (base64 data, {} bytes)\n", att.name, att.size_bytes.unwrap_or(0)));
                        }
                        _ => {}
                    }
                }
            }
            "assistant" => {
                prompt.push_str(&format!("Assistant: {}\n", msg.text));
            }
            "system" => {} // Already added at start
        }
    }
    
    // Add the final user prompt
    prompt.push_str("Assistant: ");
    
    prompt
}

/// Call the LLM API to generate a response
async fn call_llm(prompt: &str, model: &str, api_url: &str, temperature: f64) -> Result<String, String> {
    use reqwest::Client;
    
    let client = Client::new();
    
    let payload = serde_json::json!({
        "model": model,
        "prompt": prompt,
        "stream": false,
        "options": {
            "temperature": temperature,
            "num_predict": 2048,
        }
    });
    
    let response = client
        .post(api_url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Failed to call LLM API: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("LLM API returned error: {}", response.status()));
    }
    
    let result: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse LLM response: {}", e))?;
    
    let text = result["response"]
        .as_str()
        .ok_or("Invalid LLM response format")?
        .to_string();
    
    Ok(text)
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_build_conversation_prompt() {
        let messages = vec![
            NlpMessage {
                id: "1".to_string(),
                role: "user".to_string(),
                text: "Hello".to_string(),
                attachments: vec![],
                timestamp: Utc::now().to_rfc3339(),
                thinking: false,
                error: None,
            },
            NlpMessage {
                id: "2".to_string(),
                role: "assistant".to_string(),
                text: "Hi there!".to_string(),
                attachments: vec![],
                timestamp: Utc::now().to_rfc3339(),
                thinking: false,
                error: None,
            },
        ];
        
        let prompt = build_conversation_prompt(&messages, "Be helpful");
        assert!(prompt.contains("System: Be helpful"));
        assert!(prompt.contains("User: Hello"));
        assert!(prompt.contains("Assistant: Hi there!"));
    }
}
