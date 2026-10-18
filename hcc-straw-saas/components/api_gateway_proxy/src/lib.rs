pub struct ApiGateway {
    routes: std::collections::HashMap<String, String>,
}

impl ApiGateway {
    pub fn new() -> Self {
        Self { routes: std::collections::HashMap::new() }
    }

    pub fn add_route(&mut self, path: &str, target_service: &str) {
        self.routes.insert(path.to_string(), target_service.to_string());
    }

    pub fn route_request(&self, path: &str) -> Option<String> {
        self.routes.get(path).cloned()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_gateway_routing() {
        let mut gateway = ApiGateway::new();
        gateway.add_route("/api/v1/billing", "billing_service");
        assert_eq!(gateway.route_request("/api/v1/billing"), Some("billing_service".to_string()));
    }
}
