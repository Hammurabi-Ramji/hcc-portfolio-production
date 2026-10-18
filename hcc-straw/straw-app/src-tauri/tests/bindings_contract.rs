use std::{fs, path::Path, process::Command};

#[test]
fn native_binding_generator_exports_the_real_desktop_commands() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../target/coverage-bindings");
    fs::create_dir_all(&root).unwrap();
    let dir = tempfile::tempdir_in(root).unwrap();
    let result = Command::new(env!("CARGO_BIN_EXE_bindings"))
        .arg(dir.path())
        .output()
        .unwrap();
    assert!(
        result.status.success(),
        "{}",
        String::from_utf8_lossy(&result.stderr)
    );
    for name in ["bindings.js", "bindings.ts"] {
        let text = fs::read_to_string(dir.path().join(name)).unwrap();
        for command in [
            "vault_status",
            "precedent_carve",
            "validation_run",
            "entity_save",
            "eduba_import",
        ] {
            assert!(text.contains(command), "missing {command} in {name}");
        }
    }
}
