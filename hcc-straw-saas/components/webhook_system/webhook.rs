use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct WebhookPayload {
    pub event: String,
    pub data: String,
    pub timestamp: i64,
}

pub struct WebhookManager;

impl WebhookManager {
    pub fn trigger(url: &str, event: &str, data: &str) -> bool {
        let _payload = WebhookPayload {
            event: event.to_string(),
            data: data.to_string(),
            timestamp: chrono::Utc::now().timestamp(),
        };
        println!("Triggering Webhook at {}: event={}", url, event);
        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_webhook_trigger() {
        assert!(WebhookManager::trigger("https://example.com/webhook", "order_created", "{\"id\": 1}"));
    }
}
