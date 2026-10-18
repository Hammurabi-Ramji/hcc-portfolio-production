pub struct CrmHub;

impl CrmHub {
    pub fn sync_contact(name: &str, email: &str, platform: &str) -> bool {
        println!("Syncing {} ({}) to {}", name, email, platform);
        true
    }

    pub fn create_deal(contact_email: &str, amount: f64) -> bool {
        println!("Creating deal for {} with amount {}", contact_email, amount);
        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_crm_sync() {
        assert!(CrmHub::sync_contact("John Doe", "john@example.com", "HubSpot"));
    }
}
