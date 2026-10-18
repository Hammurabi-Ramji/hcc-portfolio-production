use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
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

    pub fn update_status(id: &str, status: &str) {
        println!("User {} status updated to {}", id, status);
    }
}
