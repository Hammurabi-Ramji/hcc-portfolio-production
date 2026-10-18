use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_zero_trust_verification() {
        let mut guard = ZeroTrustGuard::new();
        guard.add_policy(AccessPolicy {
            resource: "admin_panel".to_string(),
            allowed_roles: vec!["admin".to_string()],
            mfa_required: true,
        });
        
        // Correct role, but no MFA
        assert!(!guard.verify_access("admin", "admin_panel", false));
        
        // Correct role + MFA
        assert!(guard.verify_access("admin", "admin_panel", true));
        
        // Wrong role
        assert!(!guard.verify_access("user", "admin_panel", true));
    }
}
