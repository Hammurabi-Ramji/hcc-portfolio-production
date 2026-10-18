use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Metric {
    pub name: String,
    pub value: f64,
    pub timestamp: i64,
}

pub struct AnalyticsEngine {
    data_points: Vec<Metric>,
}

impl AnalyticsEngine {
    pub fn new() -> Self {
        Self { data_points: Vec::new() }
    }

    pub fn track(&mut self, name: &str, value: f64) {
        self.data_points.push(Metric {
            name: name.to_string(),
            value,
            timestamp: chrono::Utc::now().timestamp(),
        });
    }

    pub fn get_summary(&self) -> HashMap<String, f64> {
        let mut summary = HashMap::new();
        for metric in &self.data_points {
            let count = summary.entry(metric.name.clone()).or_insert(0.0);
            *count += metric.value;
        }
        summary
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_analytics_tracking() {
        let mut engine = AnalyticsEngine::new();
        engine.track("page_view", 1.0);
        engine.track("page_view", 1.0);
        engine.track("click", 5.0);
        
        let summary = engine.get_summary();
        assert_eq!(summary.get("page_view"), Some(&2.0));
        assert_eq!(summary.get("click"), Some(&5.0));
    }
}
