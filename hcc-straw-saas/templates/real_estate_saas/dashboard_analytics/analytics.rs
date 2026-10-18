use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize)]
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
