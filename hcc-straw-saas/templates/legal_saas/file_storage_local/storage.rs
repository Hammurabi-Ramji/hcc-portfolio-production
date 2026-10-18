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

    pub fn delete_file(&self, name: &str) -> std::io::Result<()> {
        let path = Path::new(&self.root_dir).join(name);
        fs::remove_file(path)
    }
}
