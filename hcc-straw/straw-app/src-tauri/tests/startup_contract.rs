//! Real native startup/shutdown with a disposable vault and no operator grants.
#[cfg(all(windows, debug_assertions))]
#[test]
fn desktop_bootstraps_isolated_stores_and_exits_its_own_runtime_cleanly() {
    use std::os::windows::process::CommandExt;
    use std::{
        fs,
        path::Path,
        process::{Command, Stdio},
        time::{Duration, Instant},
    };
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../target/coverage-startup");
    fs::create_dir_all(&root).unwrap();
    let dir = tempfile::tempdir_in(root).unwrap();
    let mut child = Command::new(env!("CARGO_BIN_EXE_straw-stack"))
        .env("STRAW_TEST_DATA_DIR", dir.path())
        .env("STRAW_TEST_EXIT_AFTER_MS", "300")
        // WebView2 owns a separate profile from the application's databases.
        // Never share its lock, cookies, or cache with an operator instance.
        .env("WEBVIEW2_USER_DATA_FOLDER", dir.path().join("webview"))
        .creation_flags(0x08000000)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();
    let deadline = Instant::now() + Duration::from_secs(30);
    loop {
        if child.try_wait().unwrap().is_some() {
            break;
        }
        if Instant::now() >= deadline {
            child.kill().unwrap();
            let output = child.wait_with_output().unwrap();
            panic!(
                "isolated desktop did not exit: {}",
                String::from_utf8_lossy(&output.stderr)
            );
        }
        std::thread::sleep(Duration::from_millis(20));
    }
    let output = child.wait_with_output().unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    assert!(dir.path().join("straw.db").is_file());
    assert!(dir.path().join("accordion.db").is_file());
    assert!(dir.path().join("webview").is_dir());
    // Startup must not initialize or unlock a signing identity on its own.
    let store = straw_storage::Store::open(dir.path().join("straw.db"), "").unwrap();
    let security =
        straw_security::Security::open(store, dir.path().join("straw-checkpoint.json")).unwrap();
    let status = security.status().unwrap();
    assert!(!status.created && !status.unlocked);
}
