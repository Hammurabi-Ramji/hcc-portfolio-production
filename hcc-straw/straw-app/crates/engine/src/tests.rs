use crate::{codegen::*, contract::*, dag::*, db::DbState, flow::*};

fn node(kind: &str, config: &[(&str, &str)]) -> FlowNode {
    FlowNode {
        id: NodeId::mint(),
        kind: kind.into(),
        config: config
            .iter()
            .map(|(k, v)| (k.to_string(), v.to_string()))
            .collect(),
        x: 0.0,
        y: 0.0,
    }
}
fn edge(a: &FlowNode, output: &str, b: &FlowNode, input: &str) -> FlowEdge {
    FlowEdge {
        source: a.id,
        source_handle: output.into(),
        target: b.id,
        target_handle: input.into(),
    }
}

#[test]
fn identities_cannot_be_empty_or_nil_and_are_distinct() {
    assert_ne!(FlowId::mint(), FlowId::mint());
    for invalid in ["", "not-a-uuid", "00000000-0000-0000-0000-000000000000"] {
        assert!(serde_json::from_value::<FlowId>(serde_json::json!(invalid)).is_err());
    }
}

#[test]
fn actual_wire_contract_roundtrips_camel_case() {
    let attachment: Attachment = serde_json::from_value(
        serde_json::json!({"name":"notes.txt","mimeType":"text/plain","sizeBytes":3,"data":"abc"}),
    )
    .unwrap();
    let encoded = serde_json::to_value(&attachment).unwrap();
    assert_eq!(encoded["mimeType"], "text/plain");
    assert!(encoded.get("mime_type").is_none());
    assert_eq!(
        serde_json::from_value::<Attachment>(encoded).unwrap(),
        attachment
    );
    let file = CodeFile {
        id: "stable-id".into(),
        path: "src/main.rs".into(),
        content: "fn main() {}".into(),
        is_dirty: true,
    };
    let json = serde_json::to_value(&file).unwrap();
    assert_eq!(json["isDirty"], true);
    assert_eq!(serde_json::from_value::<CodeFile>(json).unwrap(), file);
    let schema = serde_json::to_value(crate::nodes::all_schemas()).unwrap();
    assert!(schema[0].get("configFields").is_some());
}

#[test]
fn graph_rejects_empty_duplicates_unknown_ports_and_cycles() {
    assert!(Graph::default().validate().is_err());
    let a = node("transform", &[("operation", "uppercase")]);
    assert!(Graph {
        nodes: vec![a.clone(), a.clone()],
        edges: vec![]
    }
    .validate()
    .is_err());
    let cycle = Graph {
        nodes: vec![a.clone()],
        edges: vec![edge(&a, "result", &a, "text")],
    };
    assert!(cycle.validate().unwrap_err().to_string().contains("cycle"));
    let b = node("text_input", &[("text", "hello")]);
    assert!(Graph {
        nodes: vec![a.clone()],
        edges: vec![edge(&b, "text", &a, "text")]
    }
    .validate()
    .is_err());
    assert!(Graph {
        nodes: vec![a.clone(), b.clone()],
        edges: vec![edge(&b, "missing", &a, "text")]
    }
    .validate()
    .is_err());
}

#[test]
fn two_flows_survive_restart_without_overwrite() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("desk.db");
    let db = DbState::open(&path).unwrap();
    let a = db.save(FlowRecord::new("one".into())).unwrap();
    let b = db.save(FlowRecord::new("two".into())).unwrap();
    assert_ne!(a.id, b.id);
    drop(db);
    let reopened = DbState::open(path).unwrap();
    assert_eq!(reopened.list().unwrap().len(), 2);
    assert_eq!(reopened.load(a.id).unwrap().unwrap().name, "one");
}

#[test]
fn cycle_failure_is_persisted_with_real_distinct_times() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("desk.db");
    let db = DbState::open(&path).unwrap();
    let a = node("transform", &[("operation", "uppercase")]);
    let graph = Graph {
        nodes: vec![a.clone()],
        edges: vec![edge(&a, "result", &a, "text")],
    };
    let mut flow = FlowRecord::new("cycle".into());
    flow.definition = graph.clone();
    let flow = db.save(flow).unwrap();
    let result = db.execute_workflow(flow.id, graph).unwrap();
    assert!(matches!(result.status, RunStatus::Failed { .. }));
    let start = chrono::DateTime::parse_from_rfc3339(&result.started_at).unwrap();
    let finish =
        chrono::DateTime::parse_from_rfc3339(result.finished_at.as_ref().unwrap()).unwrap();
    assert!(finish > start);
    drop(db);
    let db = DbState::open(path).unwrap();
    assert!(matches!(
        db.executions(flow.id).unwrap()[0].status,
        RunStatus::Failed { .. }
    ));
}

#[test]
fn successful_pipeline_executes_total_order_and_records_completion() {
    let dir = tempfile::tempdir().unwrap();
    let db = DbState::open(dir.path().join("desk.db")).unwrap();
    let a = node("text_input", &[("text", "hello")]);
    let b = node("transform", &[("operation", "uppercase")]);
    let graph = Graph {
        nodes: vec![b.clone(), a.clone()],
        edges: vec![edge(&a, "text", &b, "text")],
    };
    assert_eq!(
        graph.clone().validate().unwrap().topological(),
        vec![a.id, b.id]
    );
    let flow = db.save(FlowRecord::new("works".into())).unwrap();
    let result = db.execute_workflow(flow.id, graph).unwrap();
    assert_eq!(result.status, RunStatus::Completed);
    assert_eq!(result.results.len(), 2);
    assert_eq!(
        result.results[1].outputs["result"],
        crate::nodes::NodeValue::Text("HELLO".into())
    );
}

#[test]
fn failed_upstream_never_writes_downstream_file() {
    let dir = tempfile::tempdir().unwrap();
    let missing = dir.path().join("missing.txt");
    let destination = dir.path().join("must-not-exist.txt");
    let a = node("read_file", &[("path", missing.to_str().unwrap())]);
    let b = node("write_file", &[("path", destination.to_str().unwrap())]);
    let graph = Graph {
        nodes: vec![a.clone(), b.clone()],
        edges: vec![edge(&a, "content", &b, "content")],
    };
    let db = DbState::open(dir.path().join("desk.db")).unwrap();
    let flow = db.save(FlowRecord::new("fails".into())).unwrap();
    let result = db.execute_workflow(flow.id, graph).unwrap();
    assert!(matches!(result.status,RunStatus::Failed{failed_node:Some(id),..} if id==a.id));
    assert!(!destination.exists());
}

#[test]
fn named_same_language_blocks_preserve_both_files_and_close_correctly() {
    let files = parse_code_blocks(
        "```rust\npath: src/a.rs\npub fn a() {}\n```\n```rust\npath: src/b.rs\npub fn b() {}\n```",
    )
    .unwrap();
    assert_eq!(files.len(), 2);
    assert_eq!(files[0].path, "src/a.rs");
    assert_eq!(files[1].content, "pub fn b() {}");
    for invalid in [
        "```rust\nfn main() {}\n```",
        "```rust\npath: a.rs\ncode",
        "```rust\npath: a.rs\na\n```\n```rust\npath: A.rs\nb\n```",
        "```rust\npath: ../escape.rs\ncode\n```",
        "plain response",
    ] {
        assert!(parse_code_blocks(invalid).is_err());
    }
}

#[test]
fn path_guard_rejects_traversal_roots_and_platform_aliases() {
    let dir = tempfile::tempdir().unwrap();
    for path in [
        "../outside",
        "a/../../outside",
        "/absolute",
        "C:/outside",
        "a\\..\\outside",
        "a:stream",
        "CON",
        "a/./b",
        "a//b",
        "a. ",
        "",
    ] {
        assert!(safe_join(dir.path(), path).is_err(), "{path}");
    }
    assert!(safe_join(dir.path(), "src/deep/main.rs")
        .unwrap()
        .starts_with(dir.path().canonicalize().unwrap()));
}

#[test]
fn generation_batch_validation_happens_before_writes() {
    let dir = tempfile::tempdir().unwrap();
    let a = CodeFile {
        id: "1".into(),
        path: "src/a.rs".into(),
        content: "first".into(),
        is_dirty: true,
    };
    let b = CodeFile {
        id: "2".into(),
        path: "../escape.rs".into(),
        content: "bad".into(),
        is_dirty: true,
    };
    assert!(save_files(dir.path(), &[a.clone(), b], false).is_err());
    assert!(!dir.path().join("src/a.rs").exists());
    let saved = save_files(dir.path(), &[a.clone()], false).unwrap();
    assert!(!saved[0].is_dirty);
    assert!(save_files(dir.path(), &[a.clone()], false).is_err());
    let updated = CodeFile {
        content: "refined current content".into(),
        ..a
    };
    let saved = save_files(dir.path(), &[updated], true).unwrap();
    assert_eq!(saved[0].id, "1");
    assert_eq!(
        std::fs::read_to_string(dir.path().join("src/a.rs")).unwrap(),
        "refined current content"
    );
}

#[test]
fn local_client_rejects_every_nonliteral_endpoint_before_connect() {
    use crate::network::LoopbackEndpoint;
    assert!(LoopbackEndpoint::parse("http://127.0.0.1:11434/api/generate").is_ok());
    for url in [
        "https://example.com",
        "http://example.com",
        "http://localhost:11434",
        "http://127.0.0.2",
        "http://127.0.0.1.evil.test",
        "http://127.0.0.1@evil.test",
        "http://127.0.0.1:0",
        "http://127.0.0.1:8741\\@evil.test",
    ] {
        assert!(LoopbackEndpoint::parse(url).is_err(), "{url}");
    }
}

#[test]
fn images_are_explicitly_rejected_without_silent_degradation() {
    let request = crate::nlp::ChatRequest {
        settings: ModelSettings::default(),
        messages: vec![crate::nlp::ChatMessage {
            role: "user".into(),
            text: "image".into(),
            attachments: vec![Attachment {
                name: "photo.png".into(),
                mime_type: "image/png".into(),
                size_bytes: 3,
                data: "abc".into(),
            }],
        }],
    };
    assert!(crate::nlp::send(request)
        .unwrap_err()
        .contains("text-context-only"));
}

fn generated(path: &str, content: &str) -> CodeFile {
    CodeFile {
        id: uuid::Uuid::new_v4().to_string(),
        path: path.into(),
        content: content.into(),
        is_dirty: true,
    }
}
fn assert_no_staging(root: &std::path::Path) {
    assert!(std::fs::read_dir(root).unwrap().all(|e| !e
        .unwrap()
        .file_name()
        .to_string_lossy()
        .starts_with(".straw-")));
}
#[test]
fn prefix_conflicts_both_orders_and_directory_destinations_do_not_write() {
    let dir = tempfile::tempdir().unwrap();
    std::fs::write(dir.path().join("sentinel"), "original").unwrap();
    for paths in [["a/b.txt", "a"], ["a", "a/b.txt"], ["A/b.txt", "a"]] {
        let root = dir.path().join(uuid::Uuid::new_v4().to_string());
        assert!(
            save_files(&root, &paths.map(|p| generated(p, "new")), false)
                .unwrap_err()
                .contains("conflict")
        );
        assert!(!root.exists());
    }
    std::fs::create_dir(dir.path().join("directory")).unwrap();
    assert!(save_files(
        dir.path(),
        &[generated("other", "new"), generated("directory", "bad")],
        true
    )
    .is_err());
    assert!(!dir.path().join("other").exists());
    assert_eq!(
        std::fs::read_to_string(dir.path().join("sentinel")).unwrap(),
        "original"
    );
    assert_no_staging(dir.path());
}
#[test]
fn late_commit_failure_rolls_back_new_files_and_restores_overwrites() {
    let dir = tempfile::tempdir().unwrap();
    let files = [generated("nested/first", "new"), generated("second", "new")];
    assert!(save_files_with_failure(dir.path(), &files, false, 1).is_err());
    assert!(!dir.path().join("nested").exists());
    assert!(!dir.path().join("second").exists());
    assert_no_staging(dir.path());
    std::fs::create_dir(dir.path().join("nested")).unwrap();
    std::fs::write(dir.path().join("nested/first"), "original").unwrap();
    assert!(save_files_with_failure(dir.path(), &files, true, 1).is_err());
    assert_eq!(
        std::fs::read_to_string(dir.path().join("nested/first")).unwrap(),
        "original"
    );
    assert_no_staging(dir.path());
}
#[test]
fn concurrent_destination_is_not_clobbered_and_prior_commit_rolls_back() {
    let dir = tempfile::tempdir().unwrap();
    assert!(save_files_with_competitor(
        dir.path(),
        &[generated("first", "new"), generated("second", "new")]
    )
    .is_err());
    assert!(!dir.path().join("first").exists());
    assert_eq!(
        std::fs::read_to_string(dir.path().join("second")).unwrap(),
        "competitor"
    );
    assert_no_staging(dir.path());
}
fn execute_fixture(graph: Graph, dir: &std::path::Path) -> ExecutionResult {
    let db = DbState::open(dir.join("desk.db")).unwrap();
    let flow = db.save(FlowRecord::new("fixture".into())).unwrap();
    let result = db.execute_workflow(flow.id, graph).unwrap();
    assert_eq!(db.executions(flow.id).unwrap()[0].status, result.status);
    result
}
#[test]
fn disconnected_config_and_type_errors_prevent_all_side_effects() {
    let dir = tempfile::tempdir().unwrap();
    let sentinel = dir.path().join("sentinel");
    std::fs::write(&sentinel, "original").unwrap();
    let source = node("text_input", &[("text", "overwrite")]);
    let writer = node("write_file", &[("path", sentinel.to_str().unwrap())]);
    for invalid in [
        node("transform", &[]),
        node("transform", &[("operation", "invalid")]),
        node("csv_parse", &[("delimiter", "")]),
        node("csv_parse", &[("has_header", "yes")]),
        node("llm_prompt", &[("temperature", "NaN")]),
        node(
            "http_request",
            &[("url", "http://127.0.0.1:1"), ("headers", "[]")],
        ),
    ] {
        let result = execute_fixture(
            Graph {
                nodes: vec![source.clone(), writer.clone(), invalid],
                edges: vec![edge(&source, "text", &writer, "content")],
            },
            dir.path(),
        );
        assert!(matches!(
            result.status,
            RunStatus::Failed {
                failed_node: None,
                ..
            }
        ));
        assert!(result.results.is_empty());
        assert!(result.finished_at.is_some());
        assert_eq!(std::fs::read_to_string(&sentinel).unwrap(), "original");
    }
    let counter = node("transform", &[("operation", "word_count")]);
    assert!(Graph {
        nodes: vec![source.clone(), counter.clone(), writer.clone()],
        edges: vec![
            edge(&source, "text", &counter, "text"),
            edge(&counter, "result", &writer, "content")
        ]
    }
    .validate()
    .unwrap_err()
    .to_string()
    .contains("incompatible"));
    assert!(Graph {
        nodes: vec![node("http_request", &[("url", "http://127.0.0.1:1")])],
        edges: vec![]
    }
    .validate()
    .is_ok());
}
#[test]
fn conditional_skip_records_inactive_writer_without_executing_it() {
    for condition in ["true", "false"] {
        let dir = tempfile::tempdir().unwrap();
        let a_path = dir.path().join("true");
        let b_path = dir.path().join("false");
        std::fs::write(&a_path, "sentinel").unwrap();
        std::fs::write(&b_path, "sentinel").unwrap();
        let source = node("text_input", &[("text", condition)]);
        let branch = node("conditional", &[]);
        let a = node("write_file", &[("path", a_path.to_str().unwrap())]);
        let b = node("write_file", &[("path", b_path.to_str().unwrap())]);
        let result = execute_fixture(
            Graph {
                nodes: vec![source.clone(), branch.clone(), a.clone(), b.clone()],
                edges: vec![
                    edge(&source, "text", &branch, "condition"),
                    edge(&branch, "true_branch", &a, "content"),
                    edge(&branch, "false_branch", &b, "content"),
                ],
            },
            dir.path(),
        );
        assert_eq!(result.status, RunStatus::Completed);
        let (active, inactive, skipped) = if condition == "true" {
            (&a_path, &b_path, b.id)
        } else {
            (&b_path, &a_path, a.id)
        };
        assert_eq!(std::fs::read_to_string(active).unwrap(), condition);
        assert_eq!(std::fs::read_to_string(inactive).unwrap(), "sentinel");
        assert_eq!(
            result
                .results
                .iter()
                .find(|r| r.node_id == skipped)
                .unwrap()
                .outputs["path"],
            crate::nodes::NodeValue::Skipped
        );
    }
}
#[test]
fn restart_recovers_abandoned_run_without_replay_and_preserves_live_owner() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("desk.db");
    let sentinel = dir.path().join("sentinel");
    std::fs::write(&sentinel, "original").unwrap();
    let owner = DbState::open(&path).unwrap();
    let mut flow = FlowRecord::new("interrupted".into());
    flow.definition
        .nodes
        .push(node("write_file", &[("path", sentinel.to_str().unwrap())]));
    let flow = owner.save(flow).unwrap();
    let running = owner.simulate_interrupted(flow.id).unwrap();
    let observer = DbState::open(&path).unwrap();
    assert_eq!(
        observer.executions(flow.id).unwrap()[0].status,
        RunStatus::Running
    );
    let clone = owner.clone();
    drop(owner);
    assert_eq!(
        DbState::open(&path).unwrap().executions(flow.id).unwrap()[0].status,
        RunStatus::Running
    );
    drop(clone);
    let restarted = DbState::open(&path).unwrap();
    let result = restarted.executions(flow.id).unwrap().remove(0);
    assert_eq!(result.id, running.id);
    assert!(
        matches!(result.status,RunStatus::Failed {ref error,..} if error.contains("interrupted"))
    );
    assert!(result.finished_at.as_ref().unwrap() > &result.started_at);
    assert!(result.results.is_empty());
    assert_eq!(std::fs::read_to_string(sentinel).unwrap(), "original");
    assert_eq!(
        DbState::open(&path)
            .unwrap()
            .executions(flow.id)
            .unwrap()
            .len(),
        1
    );
}
#[test]
fn ownerless_legacy_running_is_not_falsely_recovered() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("desk.db");
    let db = DbState::open(&path).unwrap();
    let flow = db.save(FlowRecord::new("legacy".into())).unwrap();
    let result = db.simulate_interrupted(flow.id).unwrap();
    rusqlite::Connection::open(&path)
        .unwrap()
        .execute("DELETE FROM desk_run_owners WHERE run_id=?1", [&result.id])
        .unwrap();
    drop(db);
    assert_eq!(
        DbState::open(&path).unwrap().executions(flow.id).unwrap()[0].status,
        RunStatus::Running
    );
}

// A real ephemeral-port HTTP fixture. Callers join every worker. Accept and I/O
// deadlines prevent a failed client from leaving a fixture running indefinitely.
struct LocalFixture {
    url: String,
    worker: std::thread::JoinHandle<String>,
}
impl LocalFixture {
    fn start(status: u16, headers: &str, body: Vec<u8>) -> Self {
        use std::io::{Read, Write};
        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        listener.set_nonblocking(true).unwrap();
        let url = format!("http://{}/api/generate", listener.local_addr().unwrap());
        let headers = headers.to_string();
        let worker = std::thread::spawn(move || {
            let deadline = std::time::Instant::now() + std::time::Duration::from_secs(10);
            let mut stream = loop {
                match listener.accept() {
                    Ok((stream, _)) => break stream,
                    Err(e)
                        if e.kind() == std::io::ErrorKind::WouldBlock
                            && std::time::Instant::now() < deadline =>
                    {
                        std::thread::sleep(std::time::Duration::from_millis(2))
                    }
                    Err(e) => panic!("fixture accept failed: {e}"),
                }
            };
            // Accepted Windows sockets may inherit the listener's nonblocking
            // mode. The request body can arrive over many packets.
            stream.set_nonblocking(false).unwrap();
            stream
                .set_read_timeout(Some(std::time::Duration::from_secs(5)))
                .unwrap();
            stream
                .set_write_timeout(Some(std::time::Duration::from_secs(5)))
                .unwrap();
            let mut request = Vec::new();
            let mut chunk = [0; 4096];
            loop {
                let count = stream.read(&mut chunk).unwrap();
                if count == 0 {
                    break;
                }
                request.extend_from_slice(&chunk[..count]);
                if let Some(end) = request.windows(4).position(|v| v == b"\r\n\r\n") {
                    let header = String::from_utf8_lossy(&request[..end]);
                    let length = header
                        .lines()
                        .find_map(|line| {
                            line.to_ascii_lowercase()
                                .strip_prefix("content-length:")
                                .map(|v| v.trim().parse::<usize>().unwrap())
                        })
                        .unwrap_or(0);
                    if request.len() >= end + 4 + length {
                        break;
                    }
                }
            }
            stream.write_all(format!("HTTP/1.1 {status} Fixture\r\nContent-Length: {}\r\nConnection: close\r\n{headers}\r\n",body.len()).as_bytes()).unwrap();
            let _ = stream.write_all(&body);
            String::from_utf8(request).unwrap()
        });
        Self { url, worker }
    }
    fn model(response: &str) -> Self {
        Self::start(
            200,
            "Content-Type: application/json\r\n",
            serde_json::json!({"response":response})
                .to_string()
                .into_bytes(),
        )
    }
    fn settings(&self) -> ModelSettings {
        ModelSettings {
            api_url: self.url.clone(),
            ..Default::default()
        }
    }
    fn finish(self) -> String {
        self.worker.join().unwrap()
    }
}
fn captured_body(request: &str) -> serde_json::Value {
    serde_json::from_str(request.split_once("\r\n\r\n").unwrap().1).unwrap()
}
#[test]
fn model_fixture_status_json_and_request_response_body_bounds() {
    for (status, body, error) in [
        (500, b"oops".to_vec(), "HTTP 500"),
        (200, b"not JSON".to_vec(), "expected"),
        (200, b"{}".to_vec(), "missing text"),
        (200, br#"{"response":42}"#.to_vec(), "missing text"),
    ] {
        let fixture = LocalFixture::start(status, "", body);
        assert!(
            crate::network::generate(&fixture.settings(), "test", "system")
                .unwrap_err()
                .contains(error)
        );
        assert!(fixture.finish().starts_with("POST /api/generate"));
    }
    let fixture = LocalFixture::start(200, "", vec![b'x'; crate::network::MAX_BODY as usize + 1]);
    assert!(
        crate::network::request("GET", &fixture.url, &Default::default(), "")
            .unwrap_err()
            .contains("size limit")
    );
    fixture.finish();
    let fixture = LocalFixture::start(200, "", vec![0xff]);
    assert!(
        crate::network::request("GET", &fixture.url, &Default::default(), "")
            .unwrap_err()
            .contains("UTF-8")
    );
    fixture.finish();
    assert!(crate::network::request(
        "POST",
        "http://127.0.0.1:1",
        &Default::default(),
        &"x".repeat(crate::network::MAX_BODY as usize + 1)
    )
    .unwrap_err()
    .contains("size limit"));
    for temperature in [f64::NAN, f64::INFINITY, -0.1, 2.1] {
        assert!(crate::network::generate(
            &ModelSettings {
                temperature,
                ..Default::default()
            },
            "test",
            "system"
        )
        .unwrap_err()
        .contains("settings"));
    }
}
#[test]
fn redirect_fixture_is_not_followed() {
    let target = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
    target.set_nonblocking(true).unwrap();
    let fixture = LocalFixture::start(
        302,
        &format!(
            "Location: http://{}/secret\r\n",
            target.local_addr().unwrap()
        ),
        vec![],
    );
    assert!(
        crate::network::generate(&fixture.settings(), "test", "system")
            .unwrap_err()
            .contains("redirect")
    );
    fixture.finish();
    assert_eq!(
        target.accept().unwrap_err().kind(),
        std::io::ErrorKind::WouldBlock
    );
}
#[test]
fn proxy_environment_probe() {
    let Ok(endpoint) = std::env::var("STRAW_TEST_PROXY_TARGET") else {
        return;
    };
    assert_eq!(
        crate::network::generate(
            &ModelSettings {
                api_url: endpoint,
                ..Default::default()
            },
            "proxy",
            "system"
        )
        .unwrap(),
        "direct"
    );
}
#[test]
fn proxy_environment_is_disabled_in_isolated_process() {
    let proxy = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
    proxy.set_nonblocking(true).unwrap();
    let fixture = LocalFixture::model("direct");
    let proxy_url = format!("http://{}", proxy.local_addr().unwrap());
    let output = std::process::Command::new(std::env::current_exe().unwrap())
        .args(["--exact", "tests::proxy_environment_probe", "--nocapture"])
        .env("STRAW_TEST_PROXY_TARGET", &fixture.url)
        .env("HTTP_PROXY", &proxy_url)
        .env("http_proxy", &proxy_url)
        .env("ALL_PROXY", &proxy_url)
        .env("all_proxy", &proxy_url)
        .env_remove("NO_PROXY")
        .env_remove("no_proxy")
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    fixture.finish();
    assert_eq!(
        proxy.accept().unwrap_err().kind(),
        std::io::ErrorKind::WouldBlock
    );
}
#[test]
fn chat_preserves_attachment_bytes_and_validates_role_and_size() {
    let fixture = LocalFixture::model("chat answer");
    let text = "R\u{e9}sum\u{e9} \u{2603}";
    let message = crate::nlp::ChatMessage {
        role: "user".into(),
        text: "question".into(),
        attachments: vec![Attachment {
            name: "notes.txt".into(),
            mime_type: "text/plain".into(),
            size_bytes: text.len() as u64,
            data: text.into(),
        }],
    };
    assert_eq!(
        crate::nlp::send(crate::nlp::ChatRequest {
            settings: fixture.settings(),
            messages: vec![message.clone()]
        })
        .unwrap(),
        "chat answer"
    );
    let captured = captured_body(&fixture.finish());
    assert!(captured["prompt"].as_str().unwrap().contains(text));
    assert_eq!(captured["stream"], false);
    let mut invalid = message.clone();
    invalid.role = "system".into();
    assert!(crate::nlp::send(crate::nlp::ChatRequest {
        settings: Default::default(),
        messages: vec![invalid]
    })
    .unwrap_err()
    .contains("role"));
    let mut invalid = message;
    invalid.attachments[0].size_bytes = 1;
    assert!(crate::nlp::send(crate::nlp::ChatRequest {
        settings: Default::default(),
        messages: vec![invalid]
    })
    .unwrap_err()
    .contains("size"));
}
#[test]
fn generation_refinement_fixture_preserves_identity_current_content_and_disk() {
    let dir = tempfile::tempdir().unwrap();
    let root = dir.path().join("output");
    let fixture = LocalFixture::model(
        "```rust\npath: src/a.rs\nfirst\n```\n```text\npath: notes.txt\nsecond\n```",
    );
    let result = generate(CreationRequest {
        prompt: "build".into(),
        output_dir: root.to_str().unwrap().into(),
        settings: fixture.settings(),
    })
    .unwrap();
    assert_eq!(result.files.len(), 2);
    assert!(result.files.iter().all(|f| !f.is_dirty));
    assert_eq!(captured_body(&fixture.finish())["prompt"], "build");
    assert_eq!(
        std::fs::read_to_string(root.join("src/a.rs")).unwrap(),
        "first"
    );
    assert_no_staging(&root);
    let file = CodeFile {
        content: "unsaved current content".into(),
        is_dirty: true,
        ..result.files[0].clone()
    };
    let fixture = LocalFixture::model("refined");
    let refined = refine(RefinementRequest {
        file: file.clone(),
        instruction: "improve".into(),
        settings: fixture.settings(),
    })
    .unwrap();
    let request = captured_body(&fixture.finish());
    assert!(request["prompt"]
        .as_str()
        .unwrap()
        .contains("unsaved current content"));
    assert!(request["prompt"].as_str().unwrap().contains("improve"));
    assert_eq!(refined.id, file.id);
    assert_eq!(refined.path, file.path);
    assert!(refined.is_dirty);
    assert_eq!(refined.content, "refined");
    assert_eq!(
        std::fs::read_to_string(root.join("src/a.rs")).unwrap(),
        "first"
    );
    let fixture = LocalFixture::model("```text\npath: ../escape\nbad\n```");
    let rejected = dir.path().join("rejected");
    assert!(generate(CreationRequest {
        prompt: "bad".into(),
        output_dir: rejected.to_str().unwrap().into(),
        settings: fixture.settings()
    })
    .is_err());
    fixture.finish();
    assert!(!rejected.exists());
}

#[test]
fn crashed_process_owner_probe() {
    let Ok(path) = std::env::var("STRAW_TEST_CRASH_DB") else {
        return;
    };
    let id: FlowId = serde_json::from_value(serde_json::json!(std::env::var(
        "STRAW_TEST_CRASH_FLOW"
    )
    .unwrap()))
    .unwrap();
    let db = DbState::open(path).unwrap();
    let result = db.simulate_interrupted(id).unwrap();
    std::fs::write(std::env::var("STRAW_TEST_CRASH_READY").unwrap(), result.id).unwrap();
    // Parent kills this subprocess while the DB session lock is still held.
    std::thread::sleep(std::time::Duration::from_secs(15));
}

#[test]
fn killed_process_recovery_preserves_live_run_then_marks_interrupted_without_replay() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("desk.db");
    let marker = dir.path().join("ready");
    let db = DbState::open(&path).unwrap();
    let flow = db.save(FlowRecord::new("process crash".into())).unwrap();
    let mut child = std::process::Command::new(std::env::current_exe().unwrap())
        .args([
            "--exact",
            "tests::crashed_process_owner_probe",
            "--nocapture",
        ])
        .env("STRAW_TEST_CRASH_DB", &path)
        .env("STRAW_TEST_CRASH_FLOW", flow.id.to_string())
        .env("STRAW_TEST_CRASH_READY", &marker)
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .spawn()
        .unwrap();
    let deadline = std::time::Instant::now() + std::time::Duration::from_secs(10);
    while !marker.exists() && std::time::Instant::now() < deadline {
        std::thread::sleep(std::time::Duration::from_millis(5));
    }
    if !marker.exists() {
        let _ = child.kill();
        let _ = child.wait();
        panic!("child did not initialize session");
    }
    let id = std::fs::read_to_string(&marker).unwrap();
    let live = DbState::open(&path)
        .unwrap()
        .executions(flow.id)
        .unwrap()
        .remove(0);
    child.kill().unwrap();
    child.wait().unwrap();
    assert_eq!(live.status, RunStatus::Running);
    let recovered = DbState::open(&path)
        .unwrap()
        .executions(flow.id)
        .unwrap()
        .remove(0);
    assert_eq!(recovered.id, id);
    assert!(
        matches!(recovered.status, RunStatus::Failed { ref error,.. } if error.contains("interrupted"))
    );
    assert!(recovered.finished_at.is_some());
    assert!(recovered.results.is_empty());
}

#[test]
fn exact_http_body_limit_is_accepted() {
    let fixture = LocalFixture::start(200, "", vec![b'x'; crate::network::MAX_BODY as usize]);
    let (_, body) = crate::network::request(
        "POST",
        &fixture.url,
        &Default::default(),
        &"y".repeat(crate::network::MAX_BODY as usize),
    )
    .unwrap();
    assert_eq!(body.len() as u64, crate::network::MAX_BODY);
    let request = fixture.finish();
    assert_eq!(
        request.split_once("\r\n\r\n").unwrap().1.len() as u64,
        crate::network::MAX_BODY
    );
}

#[test]
fn graph_preflight_prevents_http_side_effect_and_optional_http_body_executes() {
    let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
    listener.set_nonblocking(true).unwrap();
    let url = format!("http://{}/must-not-run", listener.local_addr().unwrap());
    let dir = tempfile::tempdir().unwrap();
    let result = execute_fixture(
        Graph {
            nodes: vec![
                node("http_request", &[("url", &url)]),
                node("transform", &[]),
            ],
            edges: vec![],
        },
        dir.path(),
    );
    assert!(matches!(
        result.status,
        RunStatus::Failed {
            failed_node: None,
            ..
        }
    ));
    assert!(result.results.is_empty());
    assert_eq!(
        listener.accept().unwrap_err().kind(),
        std::io::ErrorKind::WouldBlock
    );
    let fixture = LocalFixture::start(200, "", b"optional body works".to_vec());
    let result = execute_fixture(
        Graph {
            nodes: vec![node("http_request", &[("url", &fixture.url)])],
            edges: vec![],
        },
        dir.path(),
    );
    assert_eq!(result.status, RunStatus::Completed);
    assert_eq!(
        result.results[0].outputs["response"],
        crate::nodes::NodeValue::Text("optional body works".into())
    );
    assert!(fixture.finish().starts_with("GET /api/generate"));
}

#[test]
fn inactive_branch_propagates_recorded_skips_through_filter_and_join() {
    let dir = tempfile::tempdir().unwrap();
    let sentinel = dir.path().join("sentinel");
    std::fs::write(&sentinel, "original").unwrap();
    let source = node("text_input", &[("text", "false")]);
    let branch = node("conditional", &[]);
    let filter = node("filter", &[]);
    let join = node("join_text", &[]);
    let writer = node("write_file", &[("path", sentinel.to_str().unwrap())]);
    let result = execute_fixture(
        Graph {
            nodes: vec![
                source.clone(),
                branch.clone(),
                filter.clone(),
                join.clone(),
                writer.clone(),
            ],
            edges: vec![
                edge(&source, "text", &branch, "condition"),
                edge(&branch, "true_branch", &filter, "input"),
                edge(&filter, "passed", &join, "list"),
                edge(&join, "text", &writer, "content"),
            ],
        },
        dir.path(),
    );
    assert_eq!(result.status, RunStatus::Completed);
    for id in [filter.id, join.id, writer.id] {
        assert!(result
            .results
            .iter()
            .find(|r| r.node_id == id)
            .unwrap()
            .outputs
            .values()
            .all(|v| matches!(v, crate::nodes::NodeValue::Skipped)));
    }
    assert_eq!(std::fs::read_to_string(sentinel).unwrap(), "original");
    assert_eq!(
        serde_json::to_value(crate::nodes::NodeValue::Skipped).unwrap(),
        serde_json::json!({"type":"Skipped"})
    );
}

#[test]
fn rollback_preserves_external_changes_and_retains_original_backup_with_exact_path() {
    let dir = tempfile::tempdir().unwrap();
    let destination = dir.path().join("first");
    std::fs::write(&destination, "original sentinel").unwrap();
    let error = save_files_with_changed_prior(
        dir.path(),
        &[generated("first", "generated"), generated("second", "new")],
    )
    .unwrap_err();
    assert!(error.contains("rollback incomplete"));
    assert!(error.contains("externally changed destination"));
    assert!(error.contains(&destination.canonicalize().unwrap().display().to_string()));
    assert_eq!(
        std::fs::read_to_string(&destination).unwrap(),
        "external writer changed this"
    );
    assert!(!dir.path().join("second").exists());
    let staging = std::fs::read_dir(dir.path())
        .unwrap()
        .map(|e| e.unwrap().path())
        .find(|p| {
            p.file_name()
                .unwrap()
                .to_string_lossy()
                .starts_with(".straw-")
        })
        .unwrap();
    assert!(
        error.contains(&staging.canonicalize().unwrap().display().to_string())
            || error.contains(&staging.display().to_string())
    );
    assert_eq!(
        std::fs::read_to_string(staging.join("0.backup")).unwrap(),
        "original sentinel"
    );
}

#[test]
fn current_output_graph_fixture_validates_and_historical_demo_does_not() {
    assert_eq!(crate::nodes::all_schemas().len(), 11);
    let current: Graph = serde_json::from_str(include_str!(
        "../../../../output/current-text-transform-graph.json"
    ))
    .unwrap();
    current.validate().unwrap();
    let historical = include_str!("../../../../output/historical/demo-nlp-to-code-flow.json");
    assert!(serde_json::from_str::<Graph>(historical).is_err());
}
