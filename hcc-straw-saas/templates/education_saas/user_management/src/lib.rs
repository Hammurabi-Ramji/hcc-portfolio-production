use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct UserProfile {
    pub id: String,
    pub name: String,
    pub role: String,
    pub status: String,
}

pub struct UserRegistry;

impl UserRegistry {
    pub fn get_profile(id: &str) -> UserProfile {
        UserProfile {
            id: id.to_string(),
            name: "John Doe".to_string(),
            role: "Admin".to_string(),
            status: "Active".to_string(),
        }
    }

    pub fn update_status(id: &str, status: &str) -> String {
        format!("User {} status updated to {}", id, status)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_user_profile() {
        let profile = UserRegistry::get_profile("123");
        assert_eq!(profile.name, "John Doe");
        assert_eq!(profile.role, "Admin");
    }

    #[test]
    fn test_status_update() {
        let msg = UserRegistry::update_status("123", "Inactive");
        assert!(msg.contains("Inactive"));
    }
}
