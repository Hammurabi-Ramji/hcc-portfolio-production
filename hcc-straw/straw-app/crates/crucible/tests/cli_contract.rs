use std::{
    fs,
    path::Path,
    process::{Command, Output},
};

fn fixture() -> tempfile::TempDir {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../target/coverage-cli");
    fs::create_dir_all(&root).unwrap();
    tempfile::tempdir_in(root).unwrap()
}

fn invoke(args: &[&str]) -> Output {
    Command::new(env!("CARGO_BIN_EXE_crucible"))
        .args(args)
        .output()
        .unwrap()
}

#[test]
fn actual_cli_preserves_exit_codes_and_both_output_formats() {
    let dir = fixture();
    let path = dir.path().to_str().unwrap();
    fs::write(dir.path().join(".autarch.yaml"), "files: [missing.rs]\n").unwrap();
    let failed = invoke(&["gate", "1", path, "--format", "json"]);
    assert_eq!(failed.status.code(), Some(1));
    let report: serde_json::Value = serde_json::from_slice(&failed.stdout).unwrap();
    assert_eq!(report["gates"][0]["status"], "fail");
    assert_eq!(report["gates"][0]["violations"][0]["file"], "missing.rs");
    fs::write(dir.path().join("missing.rs"), "pub fn ready() {}\n").unwrap();
    let passed = invoke(&["gate", "structure", path]);
    assert!(passed.status.success());
    let text = String::from_utf8(passed.stdout).unwrap();
    assert!(text.contains("1/1 files present") && text.contains("INCOMPLETE"));
    let blocked = invoke(&["validate", path, "--format", "json", "--allow-incomplete"]);
    assert_eq!(blocked.status.code(), Some(1));
    let report: serde_json::Value = serde_json::from_slice(&blocked.stdout).unwrap();
    assert_eq!(report["gates"].as_array().unwrap().len(), 9);
    assert_eq!(report["result"], "blocked");
    let internal = invoke(&["validate", dir.path().join("absent").to_str().unwrap()]);
    assert_eq!(internal.status.code(), Some(2));
    assert!(String::from_utf8(internal.stderr)
        .unwrap()
        .contains("absent"));
    let invalid = invoke(&["gate", "10", path]);
    assert_eq!(invalid.status.code(), Some(2));
    assert!(String::from_utf8(invalid.stderr)
        .unwrap()
        .contains("unknown gate"));
}

#[cfg(feature = "stele")]
#[test]
fn actual_cli_verifies_the_shared_chain_and_refuses_quarantined_history() {
    use straw_security::Security;
    let dir = fixture();
    let db = dir.path().join("vault.db");
    let anchor = dir.path().join("checkpoint.json");
    let security =
        Security::open(straw_storage::Store::open(&db, "").unwrap(), anchor.clone()).unwrap();
    security
        .initialize(zeroize::Zeroizing::new(
            "synthetic CLI fixture passphrase".into(),
        ))
        .unwrap();
    let verified = invoke(&[
        "stele-verify",
        "--vault-db",
        db.to_str().unwrap(),
        "--anchor",
        anchor.to_str().unwrap(),
    ]);
    assert!(
        verified.status.success(),
        "{}",
        String::from_utf8_lossy(&verified.stderr)
    );
    assert!(String::from_utf8(verified.stdout)
        .unwrap()
        .contains("0 precedent(s)"));
    fs::write(&anchor, "invalid checkpoint").unwrap();
    let refused = invoke(&[
        "stele-verify",
        "--vault-db",
        db.to_str().unwrap(),
        "--anchor",
        anchor.to_str().unwrap(),
    ]);
    assert_eq!(refused.status.code(), Some(2));
    assert!(!refused.stderr.is_empty());
}

#[cfg(feature = "stele")]
#[test]
fn actual_cli_certifies_a_real_project_and_carves_with_the_existing_vault_signer() {
    use straw_security::Security;
    let dir = fixture();
    let project = dir.path().join("project");
    fs::create_dir_all(project.join("src")).unwrap();
    for (name,text) in [
        ("Cargo.toml","[package]\nname=\"cli-certification-fixture\"\nversion=\"0.1.0\"\nedition=\"2021\"\n[workspace]\n"),
        ("Cargo.lock","version=4\n[[package]]\nname=\"cli-certification-fixture\"\nversion=\"0.1.0\"\n"),
        (".gitignore",".env\n/target/\n"),
        ("README.md","Keep the faith, the good exists.\n"),
        (".autarch.yaml","files: [Cargo.toml, Cargo.lock, src/lib.rs, README.md]\n"),
        ("src/lib.rs","pub fn twice(n: u32) -> u32 { n * 2 }\n#[cfg(test)] mod tests { #[test] fn doubles() { assert_eq!(super::twice(4),8); } }\n"),
    ] { fs::write(project.join(name),text).unwrap(); }
    let db = dir.path().join("vault.db");
    let anchor = dir.path().join("checkpoint.json");
    let password = "synthetic certification fixture passphrase";
    let security =
        Security::open(straw_storage::Store::open(&db, "").unwrap(), anchor.clone()).unwrap();
    security
        .initialize(zeroize::Zeroizing::new(password.into()))
        .unwrap();
    let signer = security.status().unwrap().checkpoint.unwrap().public_key;
    let passfile = dir.path().join("passphrase.txt");
    fs::write(&passfile, password).unwrap();
    let result = Command::new(env!("CARGO_BIN_EXE_crucible"))
        .args([
            "validate",
            project.to_str().unwrap(),
            "--format",
            "json",
            "--vault-db",
            db.to_str().unwrap(),
            "--anchor",
            anchor.to_str().unwrap(),
            "--passphrase-file",
            passfile.to_str().unwrap(),
        ])
        .env("CARGO_TARGET_DIR", dir.path().join("target"))
        .output()
        .unwrap();
    assert!(
        result.status.success(),
        "{} {}",
        String::from_utf8_lossy(&result.stdout),
        String::from_utf8_lossy(&result.stderr)
    );
    let report: serde_json::Value = serde_json::from_slice(&result.stdout).unwrap();
    assert_eq!(report["result"], "sovereign_certified");
    assert!(String::from_utf8(result.stderr)
        .unwrap()
        .contains("STELE: carved precedent"));
    let precedents = security.precedents().unwrap();
    assert_eq!(precedents.len(), 1);
    assert_eq!(precedents[0].receipt.public_key, signer);
    // A blocked run never touches a requested signing destination or reads its passphrase.
    fs::remove_file(project.join("src/lib.rs")).unwrap();
    let blocked = Command::new(env!("CARGO_BIN_EXE_crucible"))
        .args([
            "validate",
            project.to_str().unwrap(),
            "--format",
            "json",
            "--vault-db",
            db.to_str().unwrap(),
            "--anchor",
            anchor.to_str().unwrap(),
            "--passphrase-file",
            "absent-passphrase-file",
        ])
        .env("CARGO_TARGET_DIR", dir.path().join("target"))
        .output()
        .unwrap();
    assert_eq!(blocked.status.code(), Some(1));
    assert!(String::from_utf8(blocked.stderr)
        .unwrap()
        .contains("no precedent carved"));
    assert_eq!(security.precedents().unwrap().len(), 1);
}
