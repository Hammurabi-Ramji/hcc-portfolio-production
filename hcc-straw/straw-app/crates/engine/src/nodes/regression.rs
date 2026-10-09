use super::*;
use crate::{dag::*, db::DbState, flow::FlowRecord};
use std::{
    io::{Read, Write},
    net::TcpListener,
    time::{Duration, Instant},
};

fn config(items: &[(&str, &str)]) -> HashMap<String, String> {
    items
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect()
}
fn inputs(name: &str, value: NodeValue) -> NodeInputs {
    NodeInputs(HashMap::from([(name.into(), value)]))
}
fn text(s: &str) -> NodeValue {
    NodeValue::Text(s.into())
}
fn node(kind: &str, values: &[(&str, &str)]) -> FlowNode {
    FlowNode {
        id: NodeId::mint(),
        kind: kind.into(),
        config: config(values),
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
fn run(db: &DbState, graph: Graph, success: bool) -> ExecutionResult {
    let mut flow = FlowRecord::new("node acceptance".into());
    flow.definition = graph.clone();
    let flow = db.save(flow).unwrap();
    let result = db.execute_workflow(flow.id, graph).unwrap();
    assert_eq!(
        matches!(result.status, RunStatus::Completed),
        success,
        "{:?}",
        result.status
    );
    assert!(result.finished_at.is_some());
    let records = db.executions(flow.id).unwrap();
    assert_eq!(records[0].status, result.status);
    assert_eq!(records[0].results.len(), result.results.len());
    result
}
fn value<'a>(r: &'a ExecutionResult, n: &FlowNode, port: &str) -> &'a NodeValue {
    &r.results
        .iter()
        .find(|v| v.node_id == n.id)
        .unwrap()
        .outputs[port]
}

#[test]
fn writer_rejects_every_invalid_content_before_touch_and_preserves_valid_modes() {
    let dir = tempfile::tempdir().unwrap();
    let file = dir.path().join("sentinel");
    std::fs::write(&file, b"sentinel bytes").unwrap();
    let cfg = config(&[("path", file.to_str().unwrap())]);
    let invalid = [
        None,
        Some(NodeValue::Number(4.0)),
        Some(NodeValue::Bool(false)),
        Some(NodeValue::Null),
        Some(NodeValue::Skipped),
        Some(NodeValue::List(vec![])),
        Some(NodeValue::Table(vec![])),
    ];
    for item in invalid {
        let input = NodeInputs(
            item.map(|v| HashMap::from([("content".into(), v)]))
                .unwrap_or_default(),
        );
        assert!(write_file::execute(&cfg, input).is_err());
        assert_eq!(std::fs::read(&file).unwrap(), b"sentinel bytes");
        let absent = dir.path().join("absent").join("file");
        assert!(write_file::execute(
            &config(&[("path", absent.to_str().unwrap())]),
            NodeInputs(HashMap::new())
        )
        .is_err());
        assert!(!absent.parent().unwrap().exists());
    }
    write_file::execute(&cfg, inputs("content", text("replacement"))).unwrap();
    let mut append = cfg.clone();
    append.insert("mode".into(), "append".into());
    write_file::execute(&append, inputs("content", text("more"))).unwrap();
    assert_eq!(std::fs::read_to_string(&file).unwrap(), "replacementmore\n");
    append.insert("mode".into(), "invalid".into());
    assert!(write_file::execute(&append, inputs("content", text("bad"))).is_err());
    assert_eq!(std::fs::read_to_string(&file).unwrap(), "replacementmore\n");
}

#[test]
fn invalid_writer_and_csv_graphs_persist_failures_before_side_effects() {
    let dir = tempfile::tempdir().unwrap();
    let db = DbState::open(dir.path().join("db.sqlite")).unwrap();
    let path = dir.path().join("sentinel");
    std::fs::write(&path, "keep").unwrap();
    let writer = node("write_file", &[("path", path.to_str().unwrap())]);
    let result = run(
        &db,
        Graph {
            nodes: vec![writer.clone()],
            edges: vec![],
        },
        false,
    );
    assert!(result.results.is_empty());
    for operation in ["word_count", "line_count"] {
        let source = node("text_input", &[("text", "hello\nworld")]);
        let transform = node("transform", &[("operation", operation)]);
        let result = run(
            &db,
            Graph {
                nodes: vec![source.clone(), transform.clone(), writer.clone()],
                edges: vec![
                    edge(&source, "text", &transform, "text"),
                    edge(&transform, "result", &writer, "content"),
                ],
            },
            false,
        );
        assert!(result.results.is_empty());
    }
    for delimiter in ["", "é", "||", "\n"] {
        let source = node("text_input", &[("text", "a,b\n1,2")]);
        let csv = node("csv_parse", &[("delimiter", delimiter)]);
        let result = run(
            &db,
            Graph {
                nodes: vec![source.clone(), writer.clone(), csv.clone()],
                edges: vec![
                    edge(&source, "text", &writer, "content"),
                    edge(&source, "text", &csv, "csv"),
                ],
            },
            false,
        );
        assert!(result.results.is_empty());
        assert!(csv_parse::execute(
            &config(&[("delimiter", delimiter)]),
            inputs("csv", text("a,b"))
        )
        .is_err());
    }
    assert_eq!(std::fs::read_to_string(path).unwrap(), "keep");
    let source = node("text_input", &[("text", "a,b\n1")]);
    let csv = node("csv_parse", &[]);
    let result = run(
        &db,
        Graph {
            nodes: vec![source.clone(), csv.clone()],
            edges: vec![edge(&source, "text", &csv, "csv")],
        },
        false,
    );
    assert!(matches!(result.status,RunStatus::Failed{failed_node:Some(id),..} if id==csv.id));
}

#[test]
fn both_branches_record_explicit_skips_through_filter_join_and_writer() {
    let dir = tempfile::tempdir().unwrap();
    let db = DbState::open(dir.path().join("db.sqlite")).unwrap();
    for condition in ["true", "false"] {
        let source = node("text_input", &[("text", condition)]);
        let branch = node("conditional", &[]);
        let mut graph = Graph {
            nodes: vec![source.clone(), branch.clone()],
            edges: vec![edge(&source, "text", &branch, "condition")],
        };
        let mut branches = Vec::new();
        for port in ["true_branch", "false_branch"] {
            let path = dir.path().join(format!("{condition}-{port}"));
            std::fs::write(&path, "sentinel").unwrap();
            let filter = node("filter", &[]);
            let join = node("join_text", &[]);
            let writer = node("write_file", &[("path", path.to_str().unwrap())]);
            graph.edges.extend([
                edge(&branch, port, &filter, "input"),
                edge(&filter, "passed", &join, "list"),
                edge(&join, "text", &writer, "content"),
            ]);
            graph
                .nodes
                .extend([filter.clone(), join.clone(), writer.clone()]);
            branches.push((port, path, filter, join, writer));
        }
        let result = run(&db, graph, true);
        for (port, path, filter, join, writer) in branches {
            let selected = (condition == "true") == (port == "true_branch");
            assert_eq!(
                std::fs::read_to_string(path).unwrap(),
                if selected { condition } else { "sentinel" }
            );
            assert_eq!(
                value(&result, &branch, port),
                &if selected {
                    text(condition)
                } else {
                    NodeValue::Skipped
                }
            );
            if !selected {
                for (n, p) in [
                    (&filter, "passed"),
                    (&filter, "rejected"),
                    (&join, "text"),
                    (&writer, "path"),
                ] {
                    assert_eq!(value(&result, n, p), &NodeValue::Skipped);
                }
            }
        }
    }
}

#[test]
fn conditional_rejects_unsupported_values_and_preserves_supported_values() {
    for (input, expected) in [
        (NodeValue::Bool(true), true),
        (NodeValue::Bool(false), false),
        (NodeValue::Number(2.0), true),
        (NodeValue::Number(0.0), false),
        (text("1"), true),
        (text("FALSE"), false),
    ] {
        let out =
            conditional::execute(&HashMap::new(), inputs("condition", input.clone())).unwrap();
        assert_eq!(
            out.0[if expected {
                "true_branch"
            } else {
                "false_branch"
            }],
            input
        );
        assert_eq!(
            out.0[if expected {
                "false_branch"
            } else {
                "true_branch"
            }],
            NodeValue::Skipped
        );
    }
    for input in [
        NodeValue::Null,
        NodeValue::Number(f64::NAN),
        NodeValue::List(vec![]),
        NodeValue::Skipped,
    ] {
        assert!(conditional::execute(&HashMap::new(), inputs("condition", input)).is_err());
    }
    assert_eq!(
        serde_json::to_string(&NodeValue::Skipped).unwrap(),
        r#"{"type":"Skipped"}"#
    );
}

#[test]
fn csv_preserves_headers_first_headerless_row_and_quoted_fields() {
    for delimiter in [",", ";", "\t"] {
        let csv = format!("\"a{delimiter}b\"{delimiter}c\nx{delimiter}y");
        let out = csv_parse::execute(
            &config(&[("delimiter", delimiter), ("has_header", "false")]),
            inputs("csv", text(&csv)),
        )
        .unwrap();
        let NodeValue::Table(rows) = &out.0["table"] else {
            panic!("table required")
        };
        assert_eq!(rows.len(), 2);
        assert_eq!(rows[0]["column_1"], format!("a{delimiter}b"));
        assert_eq!(rows[0]["column_2"], "c");
        assert_eq!(rows[1]["column_1"], "x");
    }
    let out = csv_parse::execute(&HashMap::new(), inputs("csv", text("name,age\nAda,37"))).unwrap();
    let NodeValue::Table(rows) = &out.0["table"] else {
        panic!("table required")
    };
    assert_eq!(rows[0]["name"], "Ada");
    assert_eq!(rows[0]["age"], "37");
    assert!(csv_parse::execute(
        &config(&[("has_header", "invalid")]),
        inputs("csv", text("a,b"))
    )
    .is_err());
}

#[test]
fn template_json_vars_are_connectable_nonrecursive_and_fail_when_malformed() {
    let cfg = config(&[("template", "{{a}} {{b}} {{unknown}} {{a}}")]);
    for _ in 0..20 {
        let out =
            template::execute(&cfg, inputs("vars", text(r#"{"a":"{{b}}","b":"✓"}"#))).unwrap();
        assert_eq!(out.0["output"], text("{{b}} ✓ {{unknown}} {{b}}"));
    }
    for bad in ["no json", "[]", r#"{"name":3}"#] {
        assert!(template::execute(&HashMap::new(), inputs("vars", text(bad))).is_err());
    }
    assert!(template::execute(&HashMap::new(), inputs("vars", NodeValue::Null)).is_err());
    assert_eq!(
        template::execute(&HashMap::new(), NodeInputs(HashMap::new()))
            .unwrap()
            .0["output"],
        text("Hello, {{name}}!")
    );
    let dir = tempfile::tempdir().unwrap();
    let db = DbState::open(dir.path().join("db")).unwrap();
    let source = node("text_input", &[("text", r#"{"name":"Ada"}"#)]);
    let template = node("template", &[]);
    let output = dir.path().join("greeting");
    let writer = node("write_file", &[("path", output.to_str().unwrap())]);
    run(
        &db,
        Graph {
            nodes: vec![source.clone(), template.clone(), writer.clone()],
            edges: vec![
                edge(&source, "text", &template, "vars"),
                edge(&template, "output", &writer, "content"),
            ],
        },
        true,
    );
    assert_eq!(std::fs::read_to_string(output).unwrap(), "Hello, Ada!");
}

#[test]
fn latin1_read_transform_filter_join_writer_graph_and_mixed_list_errors() {
    let dir = tempfile::tempdir().unwrap();
    let db = DbState::open(dir.path().join("db")).unwrap();
    let input = dir.path().join("latin1");
    std::fs::write(&input, b"caf\xe9\nplain").unwrap();
    let read = node(
        "read_file",
        &[("path", input.to_str().unwrap()), ("encoding", "latin1")],
    );
    let transform = node("transform", &[("operation", "split_lines")]);
    let filter = node("filter", &[("condition", "not_empty")]);
    let join = node("join_text", &[]);
    let output = dir.path().join("out");
    let writer = node("write_file", &[("path", output.to_str().unwrap())]);
    let result = run(
        &db,
        Graph {
            nodes: vec![
                read.clone(),
                transform.clone(),
                filter.clone(),
                join.clone(),
                writer.clone(),
            ],
            edges: vec![
                edge(&read, "content", &transform, "text"),
                edge(&transform, "result", &filter, "input"),
                edge(&filter, "passed", &join, "list"),
                edge(&join, "text", &writer, "content"),
            ],
        },
        true,
    );
    assert_eq!(value(&result, &read, "content"), &text("café\nplain"));
    assert_eq!(std::fs::read_to_string(output).unwrap(), "café\nplain");
    assert!(read_file::execute(
        &config(&[("path", input.to_str().unwrap())]),
        NodeInputs(HashMap::new())
    )
    .is_err());
    for kind in ["filter", "join_text"] {
        let name = if kind == "filter" { "input" } else { "list" };
        for bad in [
            NodeValue::Number(1.0),
            NodeValue::Null,
            NodeValue::Bool(true),
            NodeValue::List(vec![]),
            NodeValue::Skipped,
        ] {
            let error = execute_node(
                kind,
                &HashMap::new(),
                inputs(name, NodeValue::List(vec![text("keep"), bad])),
            )
            .unwrap_err();
            assert!(error.to_string().contains("[1]"));
        }
        execute_node(kind, &HashMap::new(), inputs(name, NodeValue::List(vec![]))).unwrap();
    }
    for cfg in [
        config(&[("condition", "bad")]),
        config(&[("condition", "longer_than"), ("value", "oops")]),
        config(&[("condition", "shorter_than"), ("value", "-1")]),
    ] {
        assert!(filter::execute(&cfg, inputs("input", text("a"))).is_err());
    }
    let out = filter::execute(
        &config(&[("condition", "longer_than"), ("value", "2")]),
        inputs("input", text("a\nabc")),
    )
    .unwrap();
    assert_eq!(out.0["passed"], NodeValue::List(vec![text("abc")]));
}

// Real ephemeral IPv4 fixture. Bounded accept/read and joined worker; never uses external services.
fn fixture(response: &str, count: usize) -> (String, std::thread::JoinHandle<Vec<String>>) {
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    listener.set_nonblocking(true).unwrap();
    let url = format!("http://{}/api/generate", listener.local_addr().unwrap());
    let response = response.to_owned();
    let worker = std::thread::spawn(move || {
        let deadline = Instant::now() + Duration::from_secs(15);
        let mut requests = Vec::new();
        while requests.len() < count {
            let (mut stream, _) = match listener.accept() {
                Ok(v) => v,
                Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    assert!(Instant::now() < deadline, "fixture accept timed out");
                    std::thread::sleep(Duration::from_millis(5));
                    continue;
                }
                Err(e) => panic!("{e}"),
            };
            stream.set_nonblocking(false).unwrap();
            stream
                .set_read_timeout(Some(Duration::from_secs(5)))
                .unwrap();
            stream
                .set_write_timeout(Some(Duration::from_secs(5)))
                .unwrap();
            let mut bytes = Vec::new();
            let mut buf = [0u8; 4096];
            loop {
                let n = stream.read(&mut buf).unwrap();
                assert!(n > 0, "incomplete request");
                bytes.extend_from_slice(&buf[..n]);
                if let Some(end) = bytes.windows(4).position(|b| b == b"\r\n\r\n") {
                    let header = String::from_utf8_lossy(&bytes[..end]);
                    let length = header
                        .lines()
                        .find_map(|line| {
                            line.to_lowercase()
                                .strip_prefix("content-length:")
                                .map(|s| s.trim().parse::<usize>().unwrap())
                        })
                        .unwrap_or(0);
                    if bytes.len() >= end + 4 + length {
                        break;
                    }
                }
            }
            requests.push(String::from_utf8(bytes).unwrap());
            write!(
                stream,
                "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                response.len(),
                response
            )
            .unwrap();
        }
        requests
    });
    (url, worker)
}

#[test]
fn http_and_llm_nodes_execute_real_loopback_graphs_with_schema_default_parity() {
    let dir = tempfile::tempdir().unwrap();
    let db = DbState::open(dir.path().join("db")).unwrap();
    let (url, worker) = fixture("local response", 1);
    let source = node("text_input", &[("text", "payload")]);
    let http = node("http_request", &[("url", &url), ("method", "POST")]);
    let result = run(
        &db,
        Graph {
            nodes: vec![source.clone(), http.clone()],
            edges: vec![edge(&source, "text", &http, "body")],
        },
        true,
    );
    assert_eq!(value(&result, &http, "response"), &text("local response"));
    assert_eq!(value(&result, &http, "status"), &NodeValue::Number(200.0));
    assert!(worker.join().unwrap()[0].ends_with("payload"));
    let (url, worker) = fixture(r#"{"response":"model response"}"#, 3);
    let cfg = config(&[("api_url", &url)]);
    let effective = llm_prompt::schema().validated_config(&cfg).unwrap();
    for cfg in [&cfg, &effective] {
        assert_eq!(
            llm_prompt::execute(cfg, inputs("prompt", text("question")))
                .unwrap()
                .0["response"],
            text("model response")
        );
    }
    let source = node("text_input", &[("text", "question")]);
    let llm = node("llm_prompt", &[("api_url", &url)]);
    let result = run(
        &db,
        Graph {
            nodes: vec![source.clone(), llm.clone()],
            edges: vec![edge(&source, "text", &llm, "prompt")],
        },
        true,
    );
    assert_eq!(value(&result, &llm, "response"), &text("model response"));
    let requests = worker.join().unwrap();
    let bodies: Vec<serde_json::Value> = requests
        .iter()
        .map(|s| serde_json::from_str(s.split_once("\r\n\r\n").unwrap().1).unwrap())
        .collect();
    assert_eq!(bodies[0], bodies[1]);
    assert_eq!(bodies[1], bodies[2]);
    assert_eq!(bodies[0]["model"], "llama3.2");
    assert_eq!(bodies[0]["system"], "You are a helpful assistant.");
    for (kind, port, input) in [
        ("text_input", "text", NodeInputs(HashMap::new())),
        ("transform", "result", inputs("text", text("aBc"))),
        (
            "join_text",
            "text",
            inputs("list", NodeValue::List(vec![text("a"), text("b")])),
        ),
        (
            "template",
            "output",
            inputs("vars", text(r#"{"name":"Ada"}"#)),
        ),
        ("csv_parse", "table", inputs("csv", text("a\nvalue"))),
        ("filter", "passed", inputs("input", text("one\ntwo"))),
    ] {
        let schema = all_schemas().into_iter().find(|s| s.kind == kind).unwrap();
        let effective = schema.validated_config(&HashMap::new()).unwrap();
        assert_eq!(
            execute_node(kind, &HashMap::new(), input.clone())
                .unwrap()
                .0[port],
            execute_node(kind, &effective, input).unwrap().0[port]
        );
    }
}

#[test]
fn successful_csv_graph_records_headerless_rows_and_transform_outputs_match_metadata() {
    let dir = tempfile::tempdir().unwrap();
    let db = DbState::open(dir.path().join("db")).unwrap();
    let source = node("text_input", &[("text", "Ada;37\nGrace;40")]);
    let csv = node("csv_parse", &[("delimiter", ";"), ("has_header", "false")]);
    let result = run(
        &db,
        Graph {
            nodes: vec![source.clone(), csv.clone()],
            edges: vec![edge(&source, "text", &csv, "csv")],
        },
        true,
    );
    let NodeValue::Table(rows) = value(&result, &csv, "table") else {
        panic!("table required")
    };
    assert_eq!(rows.len(), 2);
    assert_eq!(rows[0]["column_1"], "Ada");
    assert_eq!(rows[1]["column_2"], "40");
    for (operation, expected) in [
        ("uppercase", text(" AB\nCD ")),
        ("lowercase", text(" ab\ncd ")),
        ("trim", text("Ab\ncD")),
        ("reverse", text(" Dc\nbA ")),
        ("word_count", NodeValue::Number(2.0)),
        ("line_count", NodeValue::Number(2.0)),
        ("replace", text(" XY\ncD ")),
        (
            "split_lines",
            NodeValue::List(vec![text(" Ab"), text("cD ")]),
        ),
    ] {
        let cfg = config(&[
            ("operation", operation),
            ("find", "Ab"),
            ("replace_with", "XY"),
        ]);
        let out = transform::execute(&cfg, inputs("text", text(" Ab\ncD "))).unwrap();
        assert_eq!(out.0["result"], expected, "{operation}");
        assert!(transform::schema()
            .output_types("result", &cfg)
            .iter()
            .any(|t| t.accepts(&out.0["result"])));
    }
    let bytes = dir.path().join("all-latin1");
    std::fs::write(&bytes, (0u8..=255).collect::<Vec<_>>()).unwrap();
    let out = read_file::execute(
        &config(&[("path", bytes.to_str().unwrap()), ("encoding", "latin1")]),
        NodeInputs(HashMap::new()),
    )
    .unwrap();
    let NodeValue::Text(decoded) = &out.0["content"] else {
        panic!("text required")
    };
    assert_eq!(
        decoded.chars().map(u32::from).collect::<Vec<_>>(),
        (0u32..=255).collect::<Vec<_>>()
    );
    assert_eq!(
        join_text::execute(
            &config(&[("separator", "")]),
            inputs("list", NodeValue::List(vec![text("a"), text("b")]))
        )
        .unwrap()
        .0["text"],
        text("ab")
    );
}
