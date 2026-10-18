use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct SubscriptionPlan {
    pub id: String,
    pub name: String,
    pub price: f64,
    pub currency: String,
}

pub struct BillingManager {
    _api_key: String,
}

impl BillingManager {
    pub fn new(api_key: String) -> Self {
        Self { _api_key: api_key }
    }

    pub fn create_checkout_session(&self, customer_id: &str, plan_id: &str) -> String {
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_plans() {
        let manager = BillingManager::new("sk_test_123".to_string());
        let plans = manager.get_plans();
        assert_eq!(plans.len(), 3);
        assert_eq!(plans[0].id, "basic");
    }

    #[test]
    fn test_create_checkout_session() {
        let manager = BillingManager::new("sk_test_123".to_string());
        let url = manager.create_checkout_session("cust_1", "pro");
        assert!(url.contains("checkout.stripe.com"));
        assert!(url.contains("customer=cust_1"));
        assert!(url.contains("plan=pro"));
    }
}
