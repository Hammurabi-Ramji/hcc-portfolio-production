pub struct ReplicaManager {
    replicas: Vec<String>,
    next_index: usize,
}

impl ReplicaManager {
    pub fn new(replica_urls: Vec<String>) -> Self {
        Self { replicas: replica_urls, next_index: 0 }
    }

    pub fn get_read_replica(&mut self) -> String {
        if self.replicas.is_empty() {
            return "primary".to_string();
        }
        let url = self.replicas[self.next_index].clone();
        self.next_index = (self.next_index + 1) % self.replicas.len();
        url
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_load_balancing() {
        let mut manager = ReplicaManager::new(vec!["rep1".to_string(), "rep2".to_string()]);
        assert_eq!(manager.get_read_replica(), "rep1");
        assert_eq!(manager.get_read_replica(), "rep2");
        assert_eq!(manager.get_read_replica(), "rep1");
    }
}
