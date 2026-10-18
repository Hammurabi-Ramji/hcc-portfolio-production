//! Bounded source/configuration evidence, excluding generated and vendored trees.
//! This identifies the reviewed inputs; it is not a proof of semantic correctness.
use std::{fs, path::Path};
use serde::Serialize;
use sha2::{Digest, Sha256};
use crate::{scan, CrucibleError};

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct SourceEvidence {
    pub sha256: String,
    pub files: usize,
}

pub fn snapshot(root: &Path) -> Result<SourceEvidence, CrucibleError> {
    let mut hash = Sha256::new();
    hash.update(b"STRAW-reviewed-source-v1\0");
    let mut files = 0;
    for path in scan::all_files(root)? {
        if !scan::has_extension(&path, &["rs", "svelte", "js", "ts", "tsx", "jsx", "toml", "yaml", "yml", "json", "sql", "html", "css", "md", "ps1", "sh", "lock", "xml"])
            && path.file_name().and_then(|n| n.to_str()) != Some(".gitignore") {
            continue;
        }
        let bytes = fs::read(&path).map_err(|source| CrucibleError::Io { path: path.clone(), source })?;
        let name = scan::rel_string(root, &path);
        hash.update((name.len() as u64).to_le_bytes());
        hash.update(name.as_bytes());
        hash.update((bytes.len() as u64).to_le_bytes());
        hash.update(Sha256::digest(&bytes));
        files += 1;
    }
    Ok(SourceEvidence { sha256: format!("{:x}", hash.finalize()), files })
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn windows_manifest_changes_are_reviewed_but_generated_xml_is_excluded() {
        let dir = tempfile::tempdir().unwrap();
        fs::create_dir(dir.path().join("src-tauri")).unwrap();
        let manifest = dir.path().join("src-tauri/windows-app-manifest.xml");
        fs::write(&manifest, "<assembly manifestVersion=\"1.0\" />").unwrap();
        let first = snapshot(dir.path()).unwrap();
        assert_eq!(first.files, 1);
        fs::create_dir(dir.path().join("target")).unwrap();
        fs::write(dir.path().join("target/generated.xml"), "<generated />").unwrap();
        assert_eq!(first, snapshot(dir.path()).unwrap());
        fs::write(&manifest, "<assembly manifestVersion=\"2.0\" />").unwrap();
        assert_ne!(first.sha256, snapshot(dir.path()).unwrap().sha256);
        fs::remove_file(manifest).unwrap();
        assert_eq!(snapshot(dir.path()).unwrap().files, 0);
    }

    #[test]
    fn edits_additions_and_deletions_change_evidence_but_build_output_does_not() {
        let dir = tempfile::tempdir().unwrap();
        fs::write(dir.path().join("main.rs"), "fn main() {}\n").unwrap();
        let first = snapshot(dir.path()).unwrap();
        fs::create_dir(dir.path().join("target")).unwrap();
        fs::write(dir.path().join("target/generated.rs"), "generated").unwrap();
        assert_eq!(first, snapshot(dir.path()).unwrap());
        fs::write(dir.path().join("main.rs"), "fn main() { println!(\"changed\"); }\n").unwrap();
        assert_ne!(first, snapshot(dir.path()).unwrap());
        fs::remove_file(dir.path().join("main.rs")).unwrap();
        assert_eq!(snapshot(dir.path()).unwrap().files, 0);
    }
}
