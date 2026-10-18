use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Report {
    pub title: String,
    pub content: String,
    pub format: String,
}

pub struct ReportingEngine;

impl ReportingEngine {
    pub fn generate_pdf(title: &str, data: &str) -> Report {
        Report {
            title: title.to_string(),
            content: format!("PDF content for: {}", data),
            format: "pdf".to_string(),
        }
    }

    pub fn generate_csv(title: &str, data: Vec<Vec<String>>) -> Report {
        let mut csv_content = String::new();
        for row in data {
            csv_content.push_str(&row.join(","));
            csv_content.push('\n');
        }
        Report {
            title: title.to_string(),
            content: csv_content,
            format: "csv".to_string(),
        }
    }
}
