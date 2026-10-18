//! Exercise the real Tauri IPC deserialization, command wrappers, managed state,
//! and local stores. Native approval dialogs remain an operator interaction;
//! test-only grants represent a prior approval and still use the real signer.
use super::*;
use serde_json::{json, Value};
use tauri::test::{mock_builder, mock_context, noop_assets, MockRuntime};

const PASS: &str = "an isolated command test passphrase";

#[test]
fn blocking_panics_and_listener_failures_surface_without_leaving_background_work() {
    tauri::async_runtime::block_on(async {
        let error = blocking::<()>(|| panic!("synthetic blocking failure"))
            .await
            .err()
            .unwrap();
        assert!(error.message.contains("synthetic blocking failure"));
        for panic_task in [false, true] {
            let (shutdown, signal) = tokio::sync::oneshot::channel();
            let handle = tauri::async_runtime::spawn(async move {
                let _ = signal.await;
                if panic_task {
                    panic!("synthetic listener panic");
                }
                Err(std::io::Error::other("synthetic listener failure"))
            });
            let error = RunningLoop { shutdown, handle }.stop().await.err().unwrap();
            assert!(error.contains(if panic_task {
                "synthetic listener panic"
            } else {
                "synthetic listener failure"
            }));
        }
        let (shutdown, signal) = tokio::sync::oneshot::channel();
        let handle = tauri::async_runtime::spawn(async move {
            let _ = signal.await;
            std::future::pending::<std::io::Result<()>>().await
        });
        let start = std::time::Instant::now();
        let error = RunningLoop { shutdown, handle }.stop().await.err().unwrap();
        assert!(error.contains("task aborted"));
        assert!(start.elapsed() < Duration::from_secs(5));
    });
}

#[test]
fn approval_summaries_and_permission_sets_cover_the_actual_operation_scope() {
    use straw_engine::{
        contract::ModelSettings,
        dag::{FlowNode, NodeId},
    };
    let settings = ModelSettings {
        model: "local-model".into(),
        api_url: "http://127.0.0.1:1".into(),
        temperature: 0.,
    };
    let file = CodeFile {
        id: "file".into(),
        path: "message.txt".into(),
        content: "reviewed".into(),
        is_dirty: true,
    };
    let operations = [
        (
            Operation::ImportCredentials {
                source_path: "source.json".into(),
                owner_id: "owner".into(),
                digest: "digest".into(),
            },
            vec![Permission::Import, Permission::Unseal],
        ),
        (
            Operation::RevealCredential {
                digest: "digest".into(),
                credential_id: "credential".into(),
            },
            vec![Permission::Unseal],
        ),
        (
            Operation::ImportEduba {
                source_path: "source.json".into(),
                digest: "digest".into(),
            },
            vec![Permission::Import],
        ),
        (
            Operation::ExportEduba {
                digest: "digest".into(),
                output_path: "out.json".into(),
            },
            vec![Permission::Export],
        ),
        (
            Operation::Chat {
                request: ChatRequest {
                    messages: vec![],
                    settings: settings.clone(),
                },
            },
            vec![Permission::Assist],
        ),
        (
            Operation::Generate {
                request: CreationRequest {
                    prompt: "Generate".into(),
                    output_dir: "reviewed".into(),
                    settings: settings.clone(),
                },
            },
            vec![Permission::Assist, Permission::Export],
        ),
        (
            Operation::Refine {
                request: RefinementRequest {
                    file: file.clone(),
                    instruction: "Refine".into(),
                    settings,
                },
            },
            vec![Permission::Assist],
        ),
        (
            Operation::Save {
                output_dir: "reviewed".into(),
                file,
            },
            vec![Permission::Export],
        ),
        (
            Operation::Execute {
                id: FlowId::mint(),
                graph: Graph::default(),
            },
            vec![Permission::Export],
        ),
        (
            Operation::Execute {
                id: FlowId::mint(),
                graph: Graph {
                    nodes: vec![FlowNode {
                        id: NodeId::mint(),
                        kind: "llm_prompt".into(),
                        config: Default::default(),
                        x: 0.,
                        y: 0.,
                    }],
                    edges: vec![],
                },
            },
            vec![Permission::Assist, Permission::Export],
        ),
        (
            Operation::Fabricate {
                template: "education_saas".into(),
                output_dir: "reviewed".into(),
            },
            vec![Permission::Export],
        ),
        (
            Operation::Unseal {
                id: "secret-id".into(),
            },
            vec![Permission::Unseal],
        ),
        (
            Operation::Carve {
                title: "Decision".into(),
                body: "Body".into(),
                rationale: "Reason".into(),
            },
            vec![Permission::Carve],
        ),
        (
            Operation::Validate {
                project: "reviewed-project".into(),
            },
            vec![Permission::Validate, Permission::Carve],
        ),
    ];
    for (operation, expected) in operations {
        assert_eq!(operation.permissions(), expected);
        let summary = operation.summary();
        assert!(!summary.is_empty());
        assert!(!summary.chars().any(char::is_control));
        assert!(summary.chars().count() <= 1000);
        let encoded = serde_json::to_value(&operation).unwrap();
        let decoded: Operation = serde_json::from_value(encoded).unwrap();
        assert_eq!(
            straw_security::digest(&operation).unwrap(),
            straw_security::digest(&decoded).unwrap()
        );
    }
    let operation = Operation::Validate {
        project: format!("{}\n\t", "界".repeat(1100)),
    };
    assert_eq!(operation.summary().chars().count(), 1000);
    assert!(!operation.summary().contains('\n'));
}

pub(super) struct Desk {
    window: tauri::WebviewWindow<MockRuntime>,
    app: tauri::App<MockRuntime>,
    pub(super) dir: tempfile::TempDir,
}

impl Desk {
    pub(super) fn new() -> Self {
        // Keep every test write within the workspace, including the vault's
        // atomic checkpoint replacement and generated source bundles.
        let test_root =
            std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../target/command-tests");
        std::fs::create_dir_all(&test_root).unwrap();
        Self::open(tempfile::tempdir_in(test_root).unwrap())
    }

    pub(super) fn open(dir: tempfile::TempDir) -> Self {
        let db = DbState::open(dir.path().join("desk.db")).unwrap();
        let security =
            Arc::new(Security::open(db.storage().clone(), dir.path().join("head.json")).unwrap());
        let accordion = Accordion::open_path(
            dir.path().join("records.db"),
            Autarch::from_yaml(AUTARCH_YAML).unwrap(),
        )
        .unwrap();
        let worker = Arc::new(Supervisor::new(
            dir.path().join("absent-worker.exe"),
            dir.path().join("absent-pack"),
        ));
        let app = mock_builder()
            .manage(db)
            .manage(security)
            .manage(accordion)
            .manage(worker)
            .manage(FlowRegistry::default())
            .manage(LoopService::default())
            .invoke_handler(tauri::generate_handler![
                vault_status,
                vault_initialize,
                vault_unlock,
                vault_lock,
                vault_put,
                vault_get,
                recovery::recovery_create,
                recovery::recovery_verify,
                credentials::credentials_owners,
                credentials::credentials_preview,
                credentials::credentials_list,
                credentials::credentials_import,
                credentials::credentials_reveal,
                flow_new,
                flow_save,
                flow_list,
                flow_delete,
                execute_workflow,
                execution_list,
                initialize_db,
                node_schemas,
                nlp_send,
                generate_code,
                refine_code,
                file_save,
                wasm_fibonacci,
                model_control,
                model_scan,
                model_select,
                document_list,
                document_save,
                vector_put,
                vector_search,
                precedent_list,
                precedent_carve,
                schema_entities,
                schema_get,
                entity_list,
                entity_read,
                entity_save,
                entity_delete,
                fabricator_templates,
                fabricator_generate,
                execution_archive,
                archive::eduba_preview,
                archive::eduba_list,
                archive::eduba_import,
                archive::eduba_export,
                loopback_set
            ])
            .build(mock_context(noop_assets()))
            .unwrap();
        let window = tauri::WebviewWindowBuilder::new(&app, "main", Default::default())
            .build()
            .unwrap();
        Self { window, app, dir }
    }

    pub(super) fn into_dir(self) -> tempfile::TempDir {
        self.dir
    }

    fn invoke(&self, command: &str, body: Value) -> Result<Value, Value> {
        tauri::test::get_ipc_response(
            &self.window,
            tauri::webview::InvokeRequest {
                cmd: command.into(),
                callback: tauri::ipc::CallbackFn(0),
                error: tauri::ipc::CallbackFn(1),
                url: "http://tauri.localhost".parse().unwrap(),
                body: tauri::ipc::InvokeBody::Json(body),
                headers: Default::default(),
                invoke_key: tauri::test::INVOKE_KEY.into(),
            },
        )
        .map(|response| response.deserialize().unwrap())
    }

    pub(super) fn ok(&self, command: &str, body: Value) -> Value {
        self.invoke(command, body)
            .unwrap_or_else(|error| panic!("{command}: {error}"))
    }

    pub(super) fn refuses(&self, command: &str, body: Value, reason: &str) {
        let error = self.invoke(command, body).expect_err(command);
        assert!(
            error.to_string().contains(reason),
            "{command}: {error}, expected {reason}"
        );
    }

    pub(super) fn initialize(&self) {
        self.ok("vault_initialize", json!({"password": PASS}));
    }

    pub(super) fn grant(&self, operation: &Operation) -> String {
        self.app
            .state::<Arc<Security>>()
            .issue(
                operation.permissions(),
                straw_security::digest(operation).unwrap(),
            )
            .unwrap()
            .id
    }
}

#[test]
fn archive_ipc_previews_imports_exports_and_refuses_invalid_or_replayed_requests() {
    let desk = Desk::new();
    desk.initialize();
    let source = desk.dir.path().join("reviewed.json");
    let text = r#"{"version":1,"learners":[{"id":"reader","name":"Reader","created_at":1}],"courses":[],"lessons":[],"enrollments":[],"submissions":[]}"#;
    std::fs::write(&source, text).unwrap();
    let source_path = source.to_string_lossy().into_owned();
    let preview = desk.ok("eduba_preview", json!({"sourcePath":source_path}));
    let digest = preview["digest"].as_str().unwrap().to_owned();
    assert_eq!(preview["counts"]["learners"], 1);
    assert!(desk
        .ok("eduba_list", json!({}))
        .as_array()
        .unwrap()
        .is_empty());
    let operation = Operation::ImportEduba {
        source_path: source_path.clone(),
        digest: digest.clone(),
    };
    let grant = desk.grant(&operation);
    let imported = desk.ok(
        "eduba_import",
        json!({"sourcePath":source_path,"digest":digest,"grant":grant}),
    );
    assert_eq!(imported["digest"], digest);
    assert_eq!(
        desk.ok("eduba_list", json!({})).as_array().unwrap().len(),
        1
    );
    desk.refuses(
        "eduba_import",
        json!({"sourcePath":source_path,"digest":digest,"grant":grant}),
        "grant_invalid",
    );
    let output = desk
        .dir
        .path()
        .join("export.json")
        .to_string_lossy()
        .into_owned();
    let operation = Operation::ExportEduba {
        digest: digest.clone(),
        output_path: output.clone(),
    };
    let grant = desk.grant(&operation);
    desk.ok(
        "eduba_export",
        json!({"digest":digest,"outputPath":output,"grant":grant}),
    );
    assert_eq!(
        desk.ok("eduba_preview", json!({"sourcePath":output}))["digest"],
        digest
    );
    desk.refuses(
        "eduba_export",
        json!({"digest":digest,"outputPath":output,"grant":grant}),
        "already exists",
    );
    for path in [
        "relative.json".into(),
        desk.dir
            .path()
            .join("bad.txt")
            .to_string_lossy()
            .into_owned(),
        desk.dir
            .path()
            .join("missing/fail.json")
            .to_string_lossy()
            .into_owned(),
    ] {
        assert!(desk
            .invoke(
                "eduba_export",
                json!({"digest":digest,"outputPath":path,"grant":"missing"})
            )
            .is_err());
    }
    assert!(desk.invoke("eduba_export",json!({"digest":"absent","outputPath":desk.dir.path().join("unknown.json"),"grant":"missing"})).is_err());
    assert!(desk
        .invoke(
            "eduba_preview",
            json!({"sourcePath":desk.dir.path().join("absent.json")})
        )
        .is_err());
    let changed = Operation::ImportEduba {
        source_path: source_path.clone(),
        digest: "different".into(),
    };
    desk.refuses(
        "eduba_import",
        json!({"sourcePath":source_path,"digest":"different","grant":desk.grant(&changed)}),
        "source changed",
    );
    desk.ok("vault_lock", json!({}));
    desk.refuses(
        "eduba_import",
        json!({"sourcePath":source_path,"digest":digest,"grant":"missing"}),
        "vault_locked",
    );
    assert_eq!(
        desk.ok("eduba_list", json!({})).as_array().unwrap().len(),
        1
    );
}

#[test]
fn records_ipc_uses_the_embedded_schema_and_enforces_validation_and_relations() {
    let desk = Desk::new();
    let entities = desk.ok("schema_entities", json!({}));
    assert_eq!(entities.as_array().unwrap().len(), 2);
    assert_eq!(
        desk.ok("schema_get", json!({"entity":"note"}))["entity"],
        "note"
    );
    desk.refuses("schema_get", json!({"entity":"unknown"}), "unknown");
    desk.refuses(
        "entity_save",
        json!({"entity":"topic","id":null,"record":{}}),
        "name",
    );
    let topic = desk.ok(
        "entity_save",
        json!({"entity":"topic","id":null,"record":{"name":"Architecture"}}),
    );
    let topic_id = topic["id"].as_str().unwrap();
    desk.refuses(
        "entity_save",
        json!({"entity":"topic","id":null,"record":{"name":"Architecture"}}),
        "unique",
    );
    desk.refuses(
        "entity_save",
        json!({"entity":"note","id":null,"record":{"title":"Invalid","priority":6}}),
        "priority",
    );
    desk.refuses(
        "entity_save",
        json!({"entity":"note","id":null,"record":{"title":"Invalid","topic":"missing"}}),
        "topic",
    );
    let note = desk.ok(
        "entity_save",
        json!({"entity":"note","id":null,"record":{"title":"First note","topic":topic_id}}),
    );
    let note_id = note["id"].as_str().unwrap();
    assert_eq!(note["status"], "draft");
    assert_eq!(note["priority"], 0);
    assert!(note["created"].is_string());
    let changed = desk.ok("entity_save", json!({"entity":"note","id":note_id,"record":{"title":"Reviewed","topic":topic_id,"status":"active","priority":3}}));
    assert_eq!(changed["id"], note_id);
    assert_eq!(
        desk.ok("entity_read", json!({"entity":"note","id":note_id}))["title"],
        "Reviewed"
    );
    assert_eq!(
        desk.ok("entity_list", json!({"entity":"note"}))
            .as_array()
            .unwrap()
            .len(),
        1
    );
    desk.refuses(
        "entity_delete",
        json!({"entity":"topic","id":topic_id}),
        "still referenced",
    );
    desk.ok("entity_delete", json!({"entity":"note","id":note_id}));
    desk.refuses(
        "entity_read",
        json!({"entity":"note","id":note_id}),
        "not found",
    );
    desk.ok("entity_delete", json!({"entity":"topic","id":topic_id}));
    assert!(desk
        .ok("entity_list", json!({"entity":"topic"}))
        .as_array()
        .unwrap()
        .is_empty());
}

#[test]
fn vault_ipc_requires_unlock_and_exact_single_use_approval_for_unsealing() {
    let desk = Desk::new();
    assert_eq!(desk.ok("vault_status", json!({}))["created"], false);
    desk.refuses(
        "vault_put",
        json!({"id":"sample","value":"private test text"}),
        "vault_locked",
    );
    desk.initialize();
    let signer = desk.ok("vault_status", json!({}))["checkpoint"]["publicKey"].clone();
    desk.ok(
        "vault_put",
        json!({"id":"sample","value":"private test text"}),
    );
    let grant = desk.grant(&Operation::Unseal {
        id: "sample".into(),
    });
    desk.refuses(
        "vault_get",
        json!({"id":"other","grant":grant}),
        "grant_invalid",
    );
    assert_eq!(
        desk.ok("vault_get", json!({"id":"sample","grant":grant})),
        "private test text"
    );
    desk.refuses(
        "vault_get",
        json!({"id":"sample","grant":grant}),
        "grant_invalid",
    );
    desk.ok("vault_lock", json!({}));
    assert_eq!(desk.ok("vault_status", json!({}))["unlocked"], false);
    desk.refuses(
        "vault_unlock",
        json!({"password":"incorrect test phrase"}),
        "authentication",
    );
    assert_eq!(desk.ok("vault_status", json!({}))["unlocked"], false);
    desk.ok("vault_unlock", json!({"password":PASS}));
    assert_eq!(
        desk.ok("vault_status", json!({}))["checkpoint"]["publicKey"],
        signer
    );
}

#[test]
fn documents_and_vectors_preserve_revisions_and_reject_stale_or_invalid_writes() {
    let desk = Desk::new();
    desk.ok("initialize_db", json!({}));
    let first = desk.ok(
        "document_save",
        json!({"id":"proposal","expected":null,"text":"first version"}),
    );
    desk.refuses(
        "document_save",
        json!({"id":"proposal","expected":null,"text":"lost update"}),
        "revision conflict",
    );
    let second = desk.ok(
        "document_save",
        json!({"id":"proposal","expected":first["id"],"text":"reviewed version"}),
    );
    assert_ne!(first["id"], second["id"]);
    assert_eq!(
        desk.ok("document_list", json!({}))[0]["text"],
        "reviewed version"
    );
    desk.ok(
        "vector_put",
        json!({"id":"proposal","model":"test-embed","vector":[1.0,0.0]}),
    );
    let matches = desk.ok(
        "vector_search",
        json!({"model":"test-embed","vector":[1.0,0.0],"limit":5}),
    );
    assert_eq!(matches[0]["id"], "proposal");
    desk.refuses(
        "vector_put",
        json!({"id":"bad","model":"test-embed","vector":[]}),
        "vector",
    );
    assert!(desk
        .ok(
            "vector_search",
            json!({"model":"test-embed","vector":[1.0],"limit":5})
        )
        .as_array()
        .unwrap()
        .is_empty());
}

#[test]
fn workflow_ipc_persists_failed_runs_and_archives_them_without_reexecution() {
    let desk = Desk::new();
    desk.initialize();
    let mut flow: FlowRecord = serde_json::from_value(desk.ok("flow_new", json!({}))).unwrap();
    flow.name = "Command boundary review".into();
    desk.ok("flow_save", json!({"flow":flow}));
    assert_eq!(
        desk.ok("flow_list", json!({}))[0]["id"],
        flow.id.to_string()
    );
    let operation = Operation::Execute {
        id: flow.id,
        graph: Graph::default(),
    };
    let grant = desk.grant(&operation);
    let result = desk.ok(
        "execute_workflow",
        json!({"id":flow.id,"graph":Graph::default(),"grant":grant}),
    );
    assert_eq!(result["status"]["kind"], "failed");
    assert!(result["finishedAt"].is_string());
    desk.refuses(
        "execute_workflow",
        json!({"id":flow.id,"graph":Graph::default(),"grant":grant}),
        "grant_invalid",
    );
    let history = desk.ok("execution_list", json!({"id":flow.id}));
    assert_eq!(history.as_array().unwrap().len(), 1);
    let archive = desk.ok(
        "execution_archive",
        json!({"id":flow.id,"runId":result["id"]}),
    );
    assert!(archive["text"]
        .as_str()
        .unwrap()
        .contains(result["id"].as_str().unwrap()));
    desk.refuses(
        "execution_archive",
        json!({"id":flow.id,"runId":"missing"}),
        "execution not found",
    );
    desk.ok("flow_delete", json!({"id":flow.id}));
    desk.refuses("flow_save", json!({"flow":flow}), "deleted");
    assert!(desk
        .ok("flow_list", json!({}))
        .as_array()
        .unwrap()
        .is_empty());
}

#[test]
fn workflow_ipc_rejects_foreign_ids_and_retains_history_across_restart() {
    let desk = Desk::new();
    desk.initialize();
    let foreign = FlowRecord::new("foreign identity".into());
    desk.refuses(
        "flow_save",
        json!({"flow":foreign}),
        "not minted by this application",
    );
    desk.refuses(
        "flow_delete",
        json!({"id":foreign.id}),
        "not minted by this application",
    );
    assert!(desk
        .ok("flow_list", json!({}))
        .as_array()
        .unwrap()
        .is_empty());

    let mut flow: FlowRecord = serde_json::from_value(desk.ok("flow_new", json!({}))).unwrap();
    flow.name = "restart persistence".into();
    let saved = desk.ok("flow_save", json!({"flow":flow}));
    let operation = Operation::Execute {
        id: flow.id,
        graph: Graph::default(),
    };
    let result = desk.ok(
        "execute_workflow",
        json!({"id":flow.id,"graph":Graph::default(),"grant":desk.grant(&operation)}),
    );
    assert_eq!(result["status"]["kind"], "failed");
    let run_id = result["id"].clone();
    let dir = desk.into_dir();

    // A new shell session must keep the same SQLite rows without reminting.
    let restarted = Desk::open(dir);
    assert_eq!(
        restarted.ok("vault_status", json!({}))["unlocked"],
        false
    );
    restarted.ok("vault_unlock", json!({"password": PASS}));
    assert_eq!(
        restarted.ok("flow_list", json!({}))[0]["id"],
        saved["id"]
    );
    assert_eq!(
        restarted.ok("flow_list", json!({}))[0]["name"],
        "restart persistence"
    );
    assert_eq!(
        restarted.ok("execution_list", json!({"id":flow.id}))[0]["id"],
        run_id
    );
    let mut restored: FlowRecord =
        serde_json::from_value(restarted.ok("flow_list", json!({}))[0].clone()).unwrap();
    restored.name = "updated after restart".into();
    let updated = restarted.ok("flow_save", json!({"flow":restored}));
    assert_eq!(updated["createdAt"], saved["createdAt"]);
    assert_eq!(updated["name"], "updated after restart");
    restarted.ok("flow_delete", json!({"id":flow.id}));
    assert!(restarted
        .ok("flow_list", json!({}))
        .as_array()
        .unwrap()
        .is_empty());
}

#[test]
fn loopback_ipc_reports_bind_conflict_shares_shell_rows_and_shuts_down() {
    let desk = Desk::new();
    desk.initialize();
    let mut flow: FlowRecord = serde_json::from_value(desk.ok("flow_new", json!({}))).unwrap();
    flow.name = "shared shell row".into();
    desk.ok("flow_save", json!({"flow":flow}));

    fn looks_like_bind_conflict(text: &str) -> bool {
        let text = text.to_ascii_lowercase();
        text.contains("10048")
            || text.contains("10013")
            || text.contains("address")
            || text.contains("only one usage")
            || text.contains("addrinuse")
    }

    // Occupy the production address the way a colliding process would.
    let holder = std::net::TcpListener::bind(axum_loop::BIND_ADDRESS.to_string());
    match holder {
        Ok(holder) => {
            let error = desk
                .invoke("loopback_set", json!({"enabled":true}))
                .expect_err("occupied production bind");
            assert!(
                looks_like_bind_conflict(&error.to_string()),
                "bind conflict reporting: {error}"
            );
            drop(holder);
        }
        Err(error) => {
            // Already occupied by another process; enabling must still report failure.
            assert!(
                looks_like_bind_conflict(&error.to_string()),
                "unexpected occupy failure: {error}"
            );
            let enable_error = desk
                .invoke("loopback_set", json!({"enabled":true}))
                .expect_err("occupied production bind");
            assert!(
                looks_like_bind_conflict(&enable_error.to_string()),
                "bind conflict reporting: {enable_error}"
            );
        }
    }

    // With the port free, enable the real listener, prove shared rows, then stop.
    let enable = desk.invoke("loopback_set", json!({"enabled":true}));
    match enable {
        Ok(_) => {
            let flows = format!("http://{}/flows", axum_loop::BIND_ADDRESS);
            let body = tauri::async_runtime::block_on(tauri::async_runtime::spawn_blocking(
                move || straw_engine::network::request("GET", &flows, &Default::default(), ""),
            ))
            .unwrap()
            .expect("shared shell /flows");
            assert_eq!(body.0, 200);
            let rows: Vec<FlowRecord> = serde_json::from_str(&body.1).unwrap();
            assert_eq!(rows[0].id, flow.id);
            desk.ok("loopback_set", json!({"enabled":false}));
            desk.ok("loopback_set", json!({"enabled":false}));
            // Port must be free for rebind after LoopService joins.
            let rebound = std::net::TcpListener::bind(axum_loop::BIND_ADDRESS.to_string()).unwrap();
            drop(rebound);
        }
        Err(error) => {
            // Environment already blocks 8741; bind-error reporting is still covered above.
            assert!(
                looks_like_bind_conflict(&error.to_string()),
                "unexpected loopback enable error: {error}"
            );
        }
    }
}

#[test]
fn precedent_ipc_returns_verified_receipts_and_keeps_the_same_signer() {
    let desk = Desk::new();
    desk.initialize();
    let signer = desk.ok("vault_status", json!({}))["checkpoint"]["publicKey"].clone();
    let operation = Operation::Carve {
        title: "Law I".into(),
        body: "What is carved is carved.".into(),
        rationale: "Reviewed in isolation.".into(),
    };
    let grant = desk.grant(&operation);
    let receipt = desk.ok("precedent_carve", json!({"title":"Law I","body":"What is carved is carved.","rationale":"Reviewed in isolation.","grant":grant}));
    desk.refuses("precedent_carve", json!({"title":"Law I","body":"What is carved is carved.","rationale":"Reviewed in isolation.","grant":grant}), "grant_invalid");
    desk.ok("vault_lock", json!({}));
    let records = desk.ok("precedent_list", json!({}));
    assert_eq!(records.as_array().unwrap().len(), 1);
    assert_eq!(records[0]["digest"], receipt["digest"]);
    assert_eq!(records[0]["entryHash"], receipt["entryHash"]);
    assert_eq!(records[0]["signer"], signer);
    assert_eq!(records[0]["body"], "What is carved is carved.");
}

#[test]
fn export_ipc_binds_the_approved_bytes_and_path_and_fabrication_preserves_output() {
    let desk = Desk::new();
    desk.initialize();
    let root = desk.dir.path().join("export");
    std::fs::create_dir(&root).unwrap();
    let output_dir = root.to_string_lossy().into_owned();
    let file = CodeFile {
        id: "test-file".into(),
        path: "src/message.txt".into(),
        content: "approved text".into(),
        is_dirty: true,
    };
    let grant = desk.grant(&Operation::Save {
        output_dir: output_dir.clone(),
        file: file.clone(),
    });
    let mut changed = file.clone();
    changed.content = "unapproved text".into();
    desk.refuses(
        "file_save",
        json!({"outputDir":output_dir,"file":changed,"grant":grant}),
        "grant_invalid",
    );
    let saved = desk.ok(
        "file_save",
        json!({"outputDir":output_dir,"file":file,"grant":grant}),
    );
    assert_eq!(saved["isDirty"], false);
    assert_eq!(
        std::fs::read_to_string(root.join("src/message.txt")).unwrap(),
        "approved text"
    );
    desk.refuses(
        "file_save",
        json!({"outputDir":output_dir,"file":file,"grant":grant}),
        "grant_invalid",
    );
    let bundle_dir = desk.dir.path().join("bundle");
    std::fs::create_dir(&bundle_dir).unwrap();
    let output_dir = bundle_dir.to_string_lossy().into_owned();
    let templates = desk.ok("fabricator_templates", json!({}));
    assert!(templates
        .as_array()
        .unwrap()
        .contains(&json!("education_saas")));
    let operation = Operation::Fabricate {
        output_dir: output_dir.clone(),
        template: "education_saas".into(),
    };
    let bundle = desk.ok(
        "fabricator_generate",
        json!({"outputDir":output_dir,"template":"education_saas","grant":desk.grant(&operation)}),
    );
    assert!(bundle["files"].as_u64().unwrap() > 20);
    let manifest = std::fs::read(bundle_dir.join("manifest.json")).unwrap();
    desk.refuses(
        "fabricator_generate",
        json!({"outputDir":output_dir,"template":"education_saas","grant":desk.grant(&operation)}),
        "exists",
    );
    assert_eq!(
        std::fs::read(bundle_dir.join("manifest.json")).unwrap(),
        manifest
    );
}

#[test]
fn model_and_utility_ipc_report_unavailable_resources_and_reject_remote_providers() {
    let desk = Desk::new();
    assert_eq!(
        desk.ok("model_control", json!({"action":"status"}))["phase"],
        "cold"
    );
    desk.refuses(
        "model_control",
        json!({"action":"warm"}),
        "engine_not_warmed",
    );
    desk.refuses("model_control", json!({"action":"load"}), "sidecar launch");
    assert_eq!(
        desk.ok("model_control", json!({"action":"unload"}))["phase"],
        "cold"
    );
    desk.refuses(
        "model_scan",
        json!({"provider":"ollama","base":"https://example.com"}),
        "127.0.0.1",
    );
    desk.refuses(
        "model_select",
        json!({"provider":"ollama","base":"https://example.com","id":"test"}),
        "127.0.0.1",
    );
    assert_eq!(desk.ok("wasm_fibonacci", json!({"n":10})), 55);
    desk.refuses("wasm_fibonacci", json!({"n":100}), "0..46");
    assert!(!desk
        .ok("node_schemas", json!({}))
        .as_array()
        .unwrap()
        .is_empty());
    desk.refuses("flow_delete", json!({"id":"not-a-uuid"}), "UUID");
}

#[test]
fn quarantined_ledger_blocks_all_command_mutations_but_keeps_record_reads_available() {
    let desk = Desk::new();
    desk.initialize();
    std::fs::write(desk.dir.path().join("head.json"), b"invalid checkpoint").unwrap();
    assert_eq!(desk.ok("vault_status", json!({}))["quarantined"], true);
    desk.refuses(
        "document_save",
        json!({"id":"new","expected":null,"text":"blocked"}),
        "ledger_quarantined",
    );
    desk.refuses(
        "vector_put",
        json!({"id":"new","model":"test","vector":[1.0]}),
        "ledger_quarantined",
    );
    desk.refuses(
        "entity_save",
        json!({"entity":"topic","id":null,"record":{"name":"Blocked"}}),
        "ledger_quarantined",
    );
    assert!(desk
        .ok("entity_list", json!({"entity":"topic"}))
        .as_array()
        .unwrap()
        .is_empty());
    let error = desk.invoke("precedent_list", json!({})).unwrap_err();
    assert_eq!(error["code"], "ledger_quarantined");
}

#[test]
fn assistance_ipc_requires_exact_approval_and_reports_a_cold_engine_without_exporting() {
    let desk = Desk::new();
    desk.initialize();
    let settings = straw_engine::contract::ModelSettings {
        model: "rockypod/svelte-coder-4b".into(),
        api_url: "candle://bundled".into(),
        temperature: 0.0,
    };
    let request = ChatRequest {
        messages: vec![straw_engine::nlp::ChatMessage {
            role: "user".into(),
            text: "Explain the selected source".into(),
            attachments: vec![],
        }],
        settings: settings.clone(),
    };
    desk.refuses(
        "nlp_send",
        json!({"grant":"absent","request":request}),
        "grant_invalid",
    );
    let grant = desk.grant(&Operation::Chat {
        request: request.clone(),
    });
    let mut changed = request.clone();
    changed.messages[0].text = "Unapproved request".into();
    desk.refuses(
        "nlp_send",
        json!({"grant":grant,"request":changed}),
        "grant_invalid",
    );
    let error = desk
        .invoke("nlp_send", json!({"grant":grant,"request":request}))
        .unwrap_err();
    assert_eq!(error["code"], "engine_not_warmed");
    desk.refuses(
        "nlp_send",
        json!({"grant":grant,"request":request}),
        "grant_invalid",
    );

    let root = desk.dir.path().join("generation");
    std::fs::create_dir(&root).unwrap();
    let request = CreationRequest {
        prompt: "Write a complete message file".into(),
        output_dir: root.to_string_lossy().into_owned(),
        settings: settings.clone(),
    };
    desk.refuses("generate_code", json!({"request":request,"grant":desk.grant(&Operation::Generate { request:request.clone() })}), "engine_not_warmed");
    assert_eq!(std::fs::read_dir(&root).unwrap().count(), 0);
    let request = RefinementRequest {
        file: CodeFile {
            id: "existing-file".into(),
            path: "message.txt".into(),
            content: "Original text".into(),
            is_dirty: false,
        },
        instruction: "Clarify the wording".into(),
        settings: settings.clone(),
    };
    desk.refuses("refine_code", json!({"request":request,"grant":desk.grant(&Operation::Refine { request:request.clone() })}), "engine_not_warmed");

    let mut request = ChatRequest {
        messages: vec![],
        settings,
    };
    request.settings.model = "different-model".into();
    desk.refuses(
        "nlp_send",
        json!({"request":request,"grant":desk.grant(&Operation::Chat { request:request.clone() })}),
        "identity mismatch",
    );
}

#[test]
fn approved_assistance_ipc_uses_only_the_selected_local_service_and_preserves_export_review() {
    use std::io::{BufRead, Read, Write};
    let desk = Desk::new();
    desk.initialize();
    let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
    listener.set_nonblocking(true).unwrap();
    let endpoint = format!(
        "http://{}/v1/chat/completions",
        listener.local_addr().unwrap()
    );
    // This is a protocol fixture, not a model or an inference benchmark.
    let service = std::thread::spawn(move || -> Result<Vec<Value>, String> {
        let deadline = std::time::Instant::now() + Duration::from_secs(15);
        let mut requests = Vec::new();
        for text in [
            "Local test response",
            "```text\npath: message.txt\nGenerated context\n```",
            "Clarified context",
        ] {
            let mut stream = loop {
                match listener.accept() {
                    Ok((stream, _)) => break stream,
                    Err(error)
                        if error.kind() == std::io::ErrorKind::WouldBlock
                            && std::time::Instant::now() < deadline =>
                    {
                        std::thread::sleep(Duration::from_millis(5))
                    }
                    Err(error) => return Err(format!("local fixture accept: {error}")),
                }
            };
            stream
                .set_read_timeout(Some(Duration::from_secs(5)))
                .map_err(|e| e.to_string())?;
            let mut reader = std::io::BufReader::new(&mut stream);
            let mut first = String::new();
            reader.read_line(&mut first).map_err(|e| e.to_string())?;
            if !first.starts_with("POST /v1/chat/completions ") {
                return Err(format!("unexpected request {first}"));
            }
            let mut length = 0;
            loop {
                let mut header = String::new();
                reader.read_line(&mut header).map_err(|e| e.to_string())?;
                if header == "\r\n" {
                    break;
                }
                if header.is_empty() {
                    return Err("incomplete request headers".into());
                }
                if let Some((key, value)) = header.split_once(':') {
                    if key.eq_ignore_ascii_case("content-length") {
                        length = value.trim().parse::<usize>().map_err(|e| e.to_string())?;
                    }
                }
            }
            if length > 64 * 1024 {
                return Err("fixture request exceeds bound".into());
            }
            let mut bytes = vec![0; length];
            reader.read_exact(&mut bytes).map_err(|e| e.to_string())?;
            requests.push(serde_json::from_slice(&bytes).map_err(|e| e.to_string())?);
            let body = json!({"choices":[{"message":{"content":text}}]}).to_string();
            write!(stream, "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", body.len()).map_err(|e| e.to_string())?;
        }
        Ok(requests)
    });
    let settings = straw_engine::contract::ModelSettings {
        model: "isolated-protocol-fixture".into(),
        api_url: endpoint,
        temperature: 0.0,
    };
    let request = ChatRequest {
        messages: vec![straw_engine::nlp::ChatMessage {
            role: "user".into(),
            text: "Explain the source".into(),
            attachments: vec![],
        }],
        settings: settings.clone(),
    };
    assert_eq!(desk.ok("nlp_send", json!({"request":request,"grant":desk.grant(&Operation::Chat { request:request.clone() })})), "Local test response");
    let root = desk.dir.path().join("approved-generation");
    std::fs::create_dir(&root).unwrap();
    let request = CreationRequest {
        prompt: "Write the message file".into(),
        output_dir: root.to_string_lossy().into_owned(),
        settings: settings.clone(),
    };
    let generated = desk.ok("generate_code", json!({"request":request,"grant":desk.grant(&Operation::Generate { request:request.clone() })}));
    let file: CodeFile = serde_json::from_value(generated["files"][0].clone()).unwrap();
    assert!(!file.is_dirty);
    assert_eq!(
        std::fs::read_to_string(root.join("message.txt")).unwrap(),
        "Generated context"
    );
    let request = RefinementRequest {
        file: file.clone(),
        instruction: "Clarify the message".into(),
        settings,
    };
    let refined = desk.ok("refine_code", json!({"request":request,"grant":desk.grant(&Operation::Refine { request:request.clone() })}));
    assert_eq!(refined["id"], file.id);
    assert_eq!(refined["content"], "Clarified context");
    assert_eq!(refined["isDirty"], true);
    // Refine approval authorizes inference, not another filesystem write.
    assert_eq!(
        std::fs::read_to_string(root.join("message.txt")).unwrap(),
        "Generated context"
    );
    let requests = service.join().unwrap().unwrap();
    assert_eq!(requests.len(), 3);
    assert!(requests[0]["messages"][1]["content"]
        .as_str()
        .unwrap()
        .contains("Explain the source"));
    assert_eq!(
        requests[1]["messages"][1]["content"],
        "Write the message file"
    );
    assert!(requests[2]["messages"][1]["content"]
        .as_str()
        .unwrap()
        .contains("Clarify the message"));
    assert!(requests.iter().all(
        |request| request["model"] == "isolated-protocol-fixture" && request["stream"] == false
    ));
}
