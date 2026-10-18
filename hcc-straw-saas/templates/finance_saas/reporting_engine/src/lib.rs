use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, PartialEq)]
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_report_generation() {
        let pdf = ReportingEngine::generate_pdf("Monthly Sales", "Sales data here");
        assert_eq!(pdf.format, "pdf");
        
        let csv_data = vec![
            vec!["Name".to_string(), "Age".to_string()],
            vec!["Alice".to_string(), "30".to_string()],
        ];
        let csv = ReportingEngine::generate_csv("Users", csv_data);
        assert_eq!(csv.format, "csv");
        assert!(csv.content.contains("Alice,30"));
    }
}
