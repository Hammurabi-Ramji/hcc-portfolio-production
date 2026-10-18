use std::{fs, path::Path};
fn collect(root: &Path, path: &Path, files: &mut Vec<(String, String)>) -> std::io::Result<()> {
    for entry in fs::read_dir(path)? {
        let entry = entry?;
        let file = entry.path();
        if entry.file_type()?.is_dir() {
            if entry.file_name() == "src" {
                collect(root, &file, files)?;
            }
        } else if file
            .extension()
            .is_some_and(|e| e == "rs" || e == "sql" || e == "json")
            || entry.file_name() == "Cargo.toml"
        {
            println!("cargo:rerun-if-changed={}", file.display());
            files.push((
                file.strip_prefix(root)
                    .unwrap()
                    .to_string_lossy()
                    .replace('\\', "/"),
                fs::read_to_string(&file)?,
            ));
        }
    }
    Ok(())
}
fn main() -> std::io::Result<()> {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
    let mut files = Vec::new();
    for name in ["engine", "storage", "axum-loop", "security"] {
        collect(&root, &root.join("crates").join(name), &mut files)?;
    }
    // Descend nested module directories too; only authored source, never targets.
    fn nested(root: &Path, path: &Path, files: &mut Vec<(String, String)>) -> std::io::Result<()> {
        for entry in fs::read_dir(path)? {
            let entry = entry?;
            let file = entry.path();
            if entry.file_type()?.is_dir() {
                nested(root, &file, files)?;
            } else if file
                .extension()
                .is_some_and(|e| e == "rs" || e == "sql" || e == "json")
            {
                let name = file
                    .strip_prefix(root)
                    .unwrap()
                    .to_string_lossy()
                    .replace('\\', "/");
                if !files.iter().any(|(n, _)| *n == name) {
                    println!("cargo:rerun-if-changed={}", file.display());
                    files.push((name, fs::read_to_string(&file)?));
                }
            }
        }
        Ok(())
    }
    for name in ["engine", "storage", "axum-loop", "security"] {
        nested(
            &root,
            &root.join("crates").join(name).join("src"),
            &mut files,
        )?;
    }
    files.sort();
    let source = format!("const SOURCES: &[(&str,&str)] = &{:?};", files);
    fs::write(
        Path::new(&std::env::var_os("OUT_DIR").unwrap()).join("sources.rs"),
        source,
    )
}
