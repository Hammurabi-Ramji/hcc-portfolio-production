use std::{fs, path::Path, process::Command};

#[test]
fn cli_lists_generates_and_refuses_invalid_or_overwriting_requests() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../target/coverage-fabricator");
    fs::create_dir_all(&root).unwrap();
    let dir = tempfile::tempdir_in(root).unwrap();
    let binary = env!("CARGO_BIN_EXE_straw-fabricator");
    let listed = Command::new(binary).arg("list").output().unwrap();
    assert!(listed.status.success());
    let names = String::from_utf8(listed.stdout).unwrap();
    for name in straw_fabricator::TEMPLATES {
        assert!(names.lines().any(|line| line == *name));
    }
    let destination = dir.path().join("bundle");
    let generated = Command::new(binary)
        .args([
            "generate",
            straw_fabricator::TEMPLATES[0],
            destination.to_str().unwrap(),
        ])
        .output()
        .unwrap();
    assert!(
        generated.status.success(),
        "{}",
        String::from_utf8_lossy(&generated.stderr)
    );
    let _: serde_json::Value = serde_json::from_slice(&generated.stdout).unwrap();
    assert!(destination.join("Cargo.toml").is_file());
    let before = fs::read(destination.join("Cargo.toml")).unwrap();
    let duplicate = Command::new(binary)
        .args([
            "generate",
            straw_fabricator::TEMPLATES[0],
            destination.to_str().unwrap(),
        ])
        .output()
        .unwrap();
    assert!(!duplicate.status.success());
    assert_eq!(before, fs::read(destination.join("Cargo.toml")).unwrap());
    for args in [
        vec![],
        vec!["unknown"],
        vec!["generate"],
        vec!["generate", "missing"],
        vec!["generate", "missing", "ignored", "extra"],
        vec!["generate", "missing", destination.to_str().unwrap()],
    ] {
        let refused = Command::new(binary).args(&args).output().unwrap();
        assert!(!refused.status.success(), "{args:?}");
        assert!(!refused.stderr.is_empty());
    }
}
