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
