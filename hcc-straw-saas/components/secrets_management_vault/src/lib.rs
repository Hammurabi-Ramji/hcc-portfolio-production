use std::collections::HashMap;

pub struct Vault {
    secrets: HashMap<String, String>,
}

impl Vault {
    pub fn new() -> Self {
        Self { secrets: HashMap::new() }
    }

    pub fn store_secret(&mut self, key: &str, value: &str) {
        // In real app, this would be encrypted
        self.secrets.insert(key.to_string(), value.to_string());
    }

    pub fn get_secret(&self, key: &str) -> Option<String> {
        self.secrets.get(key).cloned()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vault_operations() {
        let mut vault = Vault::new();
        vault.store_secret("DB_PASSWORD", "super-secret");
        assert_eq!(vault.get_secret("DB_PASSWORD"), Some("super-secret".to_string()));
    }
}
