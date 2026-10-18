use std::collections::HashMap;
use std::time::{Duration, Instant};

pub struct CacheEntry {
    pub value: String,
    pub expiry: Instant,
}

pub struct RedisCache {
    store: HashMap<String, CacheEntry>,
}

impl RedisCache {
    pub fn new() -> Self {
        Self { store: HashMap::new() }
    }

    pub fn set(&mut self, key: &str, value: &str, ttl_secs: u64) {
        self.store.insert(key.to_string(), CacheEntry {
            value: value.to_string(),
            expiry: Instant::now() + Duration::from_secs(ttl_secs),
        });
    }

    pub fn get(&self, key: &str) -> Option<String> {
        if let Some(entry) = self.store.get(key) {
            if Instant::now() < entry.expiry {
                return Some(entry.value.clone());
            }
        }
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cache_operations() {
        let mut cache = RedisCache::new();
        cache.set("user_1", "data_here", 3600);
        assert_eq!(cache.get("user_1"), Some("data_here".to_string()));
        
        cache.set("expired", "gone", 0);
        // Wait 1ms for expiry
        std::thread::sleep(Duration::from_millis(1));
        assert_eq!(cache.get("expired"), None);
    }
}
