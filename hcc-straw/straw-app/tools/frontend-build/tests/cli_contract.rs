use std::{path::Path, process::Command};

#[test]
fn actual_native_frontend_build_compiles_the_workspace_and_checks_hook_arguments() {
    let binary = env!("CARGO_BIN_EXE_frontend-build");
    let built = Command::new(binary).output().unwrap();
    assert!(
        built.status.success(),
        "{}",
        String::from_utf8_lossy(&built.stderr)
    );
    assert!(String::from_utf8(built.stdout)
        .unwrap()
        .contains("Svelte 5 runes components compiled"));
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
    assert!(root.join("public/ui/main.js").is_file());
    assert!(root
        .join("public/ui/vendor/licenses/svelte-LICENSE.md")
        .is_file());
    for argument in ["unknown", "site-cache"] {
        let refused = Command::new(binary)
            .arg(argument)
            .env_remove("TRUNK_STAGING_DIR")
            .output()
            .unwrap();
        assert!(!refused.status.success());
        let message = String::from_utf8(refused.stderr).unwrap();
        assert!(message.contains(if argument == "site-cache" {
            "post-build hook"
        } else {
            "supported commands"
        }));
    }
    let escaped = Command::new(binary)
        .arg("site-cache")
        .env("TRUNK_STAGING_DIR", std::env::temp_dir())
        .output()
        .unwrap();
    assert!(!escaped.status.success());
    assert!(String::from_utf8(escaped.stderr)
        .unwrap()
        .contains("outside the workspace"));
}
