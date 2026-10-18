use std::collections::HashMap;

pub struct ServiceInfo {
    pub name: String,
    pub endpoint: String,
    pub status: String,
}

pub struct Orchestrator {
    services: HashMap<String, ServiceInfo>,
}

impl Orchestrator {
    pub fn new() -> Self {
        Self { services: HashMap::new() }
    }

    pub fn register_service(&mut self, name: &str, endpoint: &str) {
        self.services.insert(name.to_string(), ServiceInfo {
            name: name.to_string(),
            endpoint: endpoint.to_string(),
            status: "healthy".to_string(),
        });
    }

    pub fn get_service(&self, name: &str) -> Option<&ServiceInfo> {
        self.services.get(name)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_service_registration() {
        let mut orch = Orchestrator::new();
        orch.register_service("billing", "http://billing:8080");
        let svc = orch.get_service("billing").unwrap();
        assert_eq!(svc.endpoint, "http://billing:8080");
    }
}
