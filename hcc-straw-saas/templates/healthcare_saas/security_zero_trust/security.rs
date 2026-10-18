use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct AccessPolicy {
    pub resource: String,
    pub allowed_roles: Vec<String>,
    pub mfa_required: bool,
}

pub struct ZeroTrustGuard {
    policies: Vec<AccessPolicy>,
}

impl ZeroTrustGuard {
    pub fn new() -> Self {
        Self { policies: Vec::new() }
    }

    pub fn add_policy(&mut self, policy: AccessPolicy) {
        self.policies.push(policy);
    }

    pub fn verify_access(&self, user_role: &str, resource: &str, mfa_authenticated: bool) -> bool {
        if let Some(policy) = self.policies.iter().find(|p| p.resource == resource) {
            if !policy.allowed_roles.contains(&user_role.to_string()) {
                return false;
            }
            if policy.mfa_required && !mfa_authenticated {
                return false;
            }
            return true;
        }
        false // Default deny
    }
}
