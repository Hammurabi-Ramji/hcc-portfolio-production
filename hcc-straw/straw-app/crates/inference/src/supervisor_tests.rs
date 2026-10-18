use super::*;
use std::{fs, path::Path, sync::OnceLock, time::Instant};

fn executable() -> PathBuf {
    static FIXTURE: OnceLock<tempfile::TempDir> = OnceLock::new();
    let dir = FIXTURE.get_or_init(|| {
        let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../target/coverage-supervisor");
        fs::create_dir_all(&root).unwrap();
        let dir = tempfile::tempdir_in(root).unwrap();
        let binary = dir
            .path()
            .join(format!("protocol-worker{}", std::env::consts::EXE_SUFFIX));
        let result = Command::new("rustc")
            .arg(Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/protocol_worker.rs"))
            .args([
                "--edition",
                "2021",
                "--crate-name",
                "supervisor_protocol_fixture",
                "-o",
            ])
            .arg(&binary)
            .env_remove("LLVM_PROFILE_FILE")
            .env_remove("RUSTC_WRAPPER")
            .env_remove("RUSTFLAGS")
            .output()
            .unwrap();
        assert!(
            result.status.success(),
            "{}",
            String::from_utf8_lossy(&result.stderr)
        );
        dir
    });
    dir.path()
        .join(format!("protocol-worker{}", std::env::consts::EXE_SUFFIX))
}

fn worker(mode: &str) -> Supervisor {
    Supervisor::new(executable(), mode.into())
}
fn phase(response: Response) -> EnginePhase {
    match response {
        Response::Status(status) => status.phase,
        other => panic!("unexpected {other:?}"),
    }
}

#[test]
fn child_lifecycle_transitions_and_generation_use_the_real_framing_path() {
    let worker = worker("normal");
    assert_eq!(
        phase(worker.request(Request::Status).unwrap()),
        EnginePhase::Cold
    );
    assert!(worker
        .request(Request::Warm)
        .unwrap_err()
        .contains("not_warmed"));
    assert_eq!(
        phase(worker.request(Request::Load).unwrap()),
        EnginePhase::Loaded
    );
    assert_eq!(
        phase(worker.request(Request::Warm).unwrap()),
        EnginePhase::Warmed
    );
    assert_eq!(
        phase(worker.request(Request::Status).unwrap()),
        EnginePhase::Warmed
    );
    assert_eq!(
        worker.generate("test prompt", "test system", 0.2).unwrap(),
        "synthetic response"
    );
    assert_eq!(
        phase(worker.request(Request::Unload).unwrap()),
        EnginePhase::Cold
    );
    assert_eq!(
        phase(worker.request(Request::Load).unwrap()),
        EnginePhase::Loaded
    );
    worker.stop().unwrap();
    worker.stop().unwrap();
    assert!(worker
        .request(Request::Load)
        .unwrap_err()
        .contains("stopped"));
}

#[test]
fn invalid_frames_and_unexpected_exits_discard_the_worker_and_allow_clean_recovery() {
    for mode in ["malformed", "oversize", "exit"] {
        let worker = worker(mode);
        let error = worker.request(Request::Load).unwrap_err();
        assert!(!error.is_empty(), "{mode}");
        assert!(worker.worker.lock().unwrap().is_none());
        assert_eq!(
            phase(worker.request(Request::Status).unwrap()),
            EnginePhase::Cold
        );
        worker.stop().unwrap();
    }
}

#[test]
fn model_refusal_wrong_response_and_oversized_requests_do_not_succeed() {
    for (mode, expected) in [
        ("error", "fixture refusal"),
        ("wrong", "unexpected sidecar response"),
    ] {
        let worker = worker(mode);
        worker.request(Request::Load).unwrap();
        assert!(worker
            .generate("prompt", "system", 0.)
            .unwrap_err()
            .contains(expected));
        worker.stop().unwrap();
    }
    let worker = worker("normal");
    worker.request(Request::Load).unwrap();
    assert!(worker
        .generate(&"x".repeat(MAX_FRAME), "s", 0.)
        .unwrap_err()
        .contains("frame exceeds bound"));
    // An oversized request is rejected before writing, leaving a usable child.
    assert_eq!(
        worker.generate("small", "s", 0.).unwrap(),
        "synthetic response"
    );
    worker.stop().unwrap();
}

#[test]
fn deadlines_busy_requests_and_shutdown_remain_bounded() {
    let worker = worker("slow");
    let started = Instant::now();
    assert!(worker
        .request_with_timeout(Request::Load, Duration::from_millis(50))
        .unwrap_err()
        .contains("deadline or exit"));
    assert!(started.elapsed() < Duration::from_secs(5));
    assert!(worker.worker.lock().unwrap().is_none());
    let guard = worker.worker.lock().unwrap();
    assert_eq!(worker.request(Request::Status).unwrap_err(), "engine_busy");
    drop(guard);
    worker.stop().unwrap();
}

#[test]
fn stop_interrupts_a_blocked_request_and_poisoned_locks_fail_closed() {
    let worker = Arc::new(worker("slow"));
    let caller = worker.clone();
    let request =
        thread::spawn(move || caller.request_with_timeout(Request::Load, Duration::from_secs(5)));
    let deadline = Instant::now() + Duration::from_secs(5);
    while worker.process.lock().unwrap().is_none() {
        assert!(Instant::now() < deadline, "child did not launch");
        thread::sleep(Duration::from_millis(5));
    }
    worker.stop().unwrap();
    assert!(request.join().unwrap().is_err());
    let poisoned = Supervisor::new("absent".into(), "pack".into());
    let _ = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        let _guard = poisoned.process.lock().unwrap();
        panic!("synthetic lock poisoning");
    }));
    assert!(poisoned.stop().is_err());
}
