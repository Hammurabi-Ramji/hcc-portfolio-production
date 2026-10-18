pub struct SearchEngine {
    index: Vec<(String, String)>,
}

impl SearchEngine {
    pub fn new() -> Self {
        Self { index: Vec::new() }
    }

    pub fn index_document(&mut self, id: &str, content: &str) {
        self.index.push((id.to_string(), content.to_string().to_lowercase()));
    }

    pub fn search(&self, query: &str) -> Vec<String> {
        let q = query.to_lowercase();
        self.index.iter()
            .filter(|(_, content)| content.contains(&q))
            .map(|(id, _)| id.clone())
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_search_operations() {
        let mut engine = SearchEngine::new();
        engine.index_document("doc1", "The quick brown fox");
        engine.index_document("doc2", "Jumps over the lazy dog");
        
        let results = engine.search("fox");
        assert_eq!(results.len(), 1);
        assert_eq!(results[0], "doc1");
        
        let results = engine.search("the");
        assert_eq!(results.len(), 2);
    }
}
