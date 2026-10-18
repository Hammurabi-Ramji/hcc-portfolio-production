use straw_inference::{protocol::*, supervisor::Supervisor};
#[test]
fn bounded_frames_reject_oversize_and_accept_eof_frame() {
    let mut reader = std::io::Cursor::new(vec![b'x'; MAX_FRAME + 1]);
    assert!(read_frame(&mut reader).is_err());
    let mut reader = std::io::Cursor::new(b"{\"command\":\"status\"}");
    let frame = read_frame(&mut reader).unwrap().unwrap();
    assert!(matches!(
        serde_json::from_slice::<Request>(&frame).unwrap(),
        Request::Status
    ));
    assert!(read_frame(&mut reader).unwrap().is_none());
}
#[test]
fn real_worker_stays_cold_after_missing_pack_and_stops_cleanly() {
    let directory = tempfile::tempdir().unwrap();
    let worker = Supervisor::new(
        env!("CARGO_BIN_EXE_straw-infer").into(),
        directory.path().into(),
    );
    assert!(matches!(
        worker.request(Request::Status).unwrap(),
        Response::Status(EngineStatus {
            phase: EnginePhase::Cold,
            ..
        })
    ));
    assert!(worker
        .generate("data", "system", 0.)
        .unwrap_err()
        .contains("not_warmed"));
    assert!(worker.request(Request::Load).is_err());
    assert!(matches!(
        worker.request(Request::Status).unwrap(),
        Response::Status(EngineStatus {
            phase: EnginePhase::Cold,
            ..
        })
    ));
    worker.stop().unwrap();
    worker.stop().unwrap();
}
