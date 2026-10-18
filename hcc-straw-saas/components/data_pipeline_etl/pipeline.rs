pub struct EtlPipeline;

impl EtlPipeline {
    pub fn extract(source: &str) -> Vec<String> {
        println!("Extracting data from {}", source);
        vec!["row1".to_string(), "row2".to_string()]
    }

    pub fn transform(data: Vec<String>) -> Vec<String> {
        data.into_iter().map(|r| r.to_uppercase()).collect()
    }

    pub fn load(data: Vec<String>, target: &str) {
        println!("Loading {} rows into {}", data.len(), target);
    }

    pub fn run(source: &str, target: &str) {
        let data = Self::extract(source);
        let transformed = Self::transform(data);
        Self::load(transformed, target);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_etl_flow() {
        let data = EtlPipeline::extract("db");
        let transformed = EtlPipeline::transform(data);
        assert_eq!(transformed[0], "ROW1");
        EtlPipeline::load(transformed, "warehouse");
    }
}
