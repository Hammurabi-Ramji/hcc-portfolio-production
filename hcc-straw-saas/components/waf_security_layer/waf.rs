pub struct Waf {
    blocked_ips: Vec<String>,
}

impl Waf {
    pub fn new() -> Self {
        Self { blocked_ips: Vec::new() }
    }

    pub fn block_ip(&mut self, ip: &str) {
        self.blocked_ips.push(ip.to_string());
    }

    pub fn is_allowed(&self, ip: &str, request_path: &str) -> bool {
        if self.blocked_ips.contains(&ip.to_string()) {
            return false;
        }
        
        // Simple SQL injection check
        if request_path.to_lowercase().contains("select") || request_path.to_lowercase().contains("drop") {
            return false;
        }
        
        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_waf_blocking() {
        let mut waf = Waf::new();
        waf.block_ip("192.168.1.1");
        assert!(!waf.is_allowed("192.168.1.1", "/home"));
        assert!(!waf.is_allowed("10.0.0.1", "/users?id=1;DROP TABLE users"));
        assert!(waf.is_allowed("10.0.0.1", "/home"));
    }
}
