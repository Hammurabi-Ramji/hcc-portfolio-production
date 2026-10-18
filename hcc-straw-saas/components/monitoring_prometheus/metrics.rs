use std::collections::HashMap;

pub struct MetricsCollector {
    counters: HashMap<String, u64>,
}

impl MetricsCollector {
    pub fn new() -> Self {
        Self { counters: HashMap::new() }
    }

    pub fn increment(&mut self, name: &str) {
        let count = self.counters.entry(name.to_string()).or_insert(0);
        *count += 1;
    }

    pub fn get_value(&self, name: &str) -> u64 {
        *self.counters.get(name).unwrap_or(&0)
    }

    pub fn export_prometheus(&self) -> String {
        let mut output = String::new();
        for (name, value) in &self.counters {
            output.push_str(&format!("{}_total {}\n", name, value));
        }
        output
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_metrics_collection() {
        let mut collector = MetricsCollector::new();
        collector.increment("http_requests");
        collector.increment("http_requests");
        assert_eq!(collector.get_value("http_requests"), 2);
        assert!(collector.export_prometheus().contains("http_requests_total 2"));
    }
}
