use std::fs;
use std::path::Path;

pub struct LocalStorage {
    root_dir: String,
}

impl LocalStorage {
    pub fn new(root_dir: &str) -> Self {
        if !Path::new(root_dir).exists() {
            fs::create_dir_all(root_dir).unwrap();
        }
        Self { root_dir: root_dir.to_string() }
    }

    pub fn save_file(&self, name: &str, content: &[u8]) -> std::io::Result<()> {
        let path = Path::new(&self.root_dir).join(name);
        fs::write(path, content)
    }

    pub fn read_file(&self, name: &str) -> std::io::Result<Vec<u8>> {
        let path = Path::new(&self.root_dir).join(name);
        fs::read(path)
    }

    pub fn delete_file(&self, name: &str) -> std::io::Result<()> {
        let path = Path::new(&self.root_dir).join(name);
        fs::remove_file(path)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn test_file_operations() {
        let mut dir = env::temp_dir();
        dir.push("hcc_test_storage");
        let storage = LocalStorage::new(dir.to_str().unwrap());
        
        let file_name = "test.txt";
        let content = b"hello world";
        
        storage.save_file(file_name, content).unwrap();
        let read_content = storage.read_file(file_name).unwrap();
        assert_eq!(read_content, content);
        
        storage.delete_file(file_name).unwrap();
        assert!(storage.read_file(file_name).is_err());
        
        fs::remove_dir(dir).unwrap();
    }
}
