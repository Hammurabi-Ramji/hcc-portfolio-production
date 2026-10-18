use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct SubscriptionPlan {
    pub id: String,
    pub name: String,
    pub price: f64,
    pub currency: String,
}

pub struct BillingManager {
    api_key: String,
}

impl BillingManager {
    pub fn new(api_key: String) -> Self {
        Self { api_key }
    }

    pub fn create_checkout_session(&self, customer_id: &str, plan_id: &str) -> String {
        // Mock Stripe API interaction
        format!("https://checkout.stripe.com/pay/{}?customer={}&plan={}", 
            uuid::Uuid::new_v4(), customer_id, plan_id)
    }

    pub fn get_plans(&self) -> Vec<SubscriptionPlan> {
        vec![
            SubscriptionPlan { id: "basic".to_string(), name: "Basic".to_string(), price: 9.99, currency: "USD".to_string() },
            SubscriptionPlan { id: "pro".to_string(), name: "Professional".to_string(), price: 29.99, currency: "USD".to_string() },
            SubscriptionPlan { id: "enterprise".to_string(), name: "Enterprise".to_string(), price: 99.99, currency: "USD".to_string() },
        ]
    }
}
