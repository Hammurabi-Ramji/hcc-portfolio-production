use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    time::Duration,
};
use straw_engine::{
    codegen::{CreationRequest, CreationResult, RefinementRequest},
    contract::CodeFile,
    dag::{ExecutionResult, Graph},
    db::DbState,
    flow::{FlowId, FlowRecord},
    nlp::ChatRequest,
};
use tauri::{Manager, State};

// Tombstones survive for this application session: a delayed save must never
// regain authorization after a successful delete, even for an unsaved minted ID.
#[derive(Clone, Copy)]
enum FlowIdentity {
    Active,
    Deleted,
}
#[derive(Clone, Default)]
struct FlowRegistry(Arc<Mutex<HashMap<FlowId, FlowIdentity>>>);
impl FlowRegistry {
    fn mint(&self) -> Result<FlowRecord, String> {
        let flow = FlowRecord::new("Untitled Flow".into());
        self.0
            .lock()
            .map_err(|e| e.to_string())?
            .insert(flow.id, FlowIdentity::Active);
        Ok(flow)
    }
    fn authorize(
        identities: &HashMap<FlowId, FlowIdentity>,
        db: &DbState,
        id: FlowId,
    ) -> Result<(), String> {
        match identities.get(&id) {
            Some(FlowIdentity::Active) => Ok(()),
            Some(FlowIdentity::Deleted) => Err("flow was deleted".into()),
            None if db.load(id)?.is_some() => Ok(()),
            None => Err("flow identity was not minted by this application".into()),
        }
    }
    fn save(&self, db: &DbState, flow: FlowRecord) -> Result<FlowRecord, String> {
        let mut identities = self.0.lock().map_err(|e| e.to_string())?;
        Self::authorize(&identities, db, flow.id)?;
        // Keep the authorization lock until persistence finishes, rather than
        // merely checking again before dispatching a separately scheduled write.
        let saved = db.save(flow)?;
        identities.insert(saved.id, FlowIdentity::Active);
        Ok(saved)
    }
    fn delete(&self, db: &DbState, id: FlowId) -> Result<(), String> {
        let mut identities = self.0.lock().map_err(|e| e.to_string())?;
        if matches!(identities.get(&id), Some(FlowIdentity::Deleted)) {
            return Ok(());
        }
        Self::authorize(&identities, db, id)?;
        db.delete(id)?;
        identities.insert(id, FlowIdentity::Deleted);
        Ok(())
    }
}

// Ownership makes shutdown a one-way RunningLoop -> StoppedLoop transition.
struct RunningLoop {
    shutdown: tokio::sync::oneshot::Sender<()>,
    handle: tauri::async_runtime::JoinHandle<std::io::Result<()>>,
}
struct StoppedLoop;
impl RunningLoop {
    async fn stop(mut self) -> Result<StoppedLoop, String> {
        let _ = self.shutdown.send(());
        match tokio::time::timeout(Duration::from_secs(3), &mut self.handle).await {
            Ok(result) => result
                .map_err(|e| e.to_string())?
                .map_err(|e| e.to_string())?,
            Err(_) => {
                self.handle.abort();
                let _ = self.handle.await;
                return Err(
                    "loopback listener shutdown exceeded three seconds; task aborted".into(),
                );
            }
        }
        Ok(StoppedLoop)
    }
}
#[derive(Default)]
struct LoopService(Mutex<Option<RunningLoop>>);
impl LoopService {
    fn stop(&self) -> Result<(), String> {
        let running = self.0.lock().map_err(|e| e.to_string())?.take();
        if let Some(running) = running {
            tauri::async_runtime::block_on(running.stop())?;
        }
        Ok(())
    }
}

async fn blocking<T: Send + 'static>(
    f: impl FnOnce() -> Result<T, String> + Send + 'static,
) -> Result<T, String> {
    tauri::async_runtime::spawn_blocking(f)
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
fn flow_new(registry: State<'_, FlowRegistry>) -> Result<FlowRecord, String> {
    registry.mint()
}

#[tauri::command]
async fn flow_save(
    db: State<'_, DbState>,
    registry: State<'_, FlowRegistry>,
    flow: FlowRecord,
) -> Result<FlowRecord, String> {
    let registry = registry.inner().clone();
    let database = db.inner().clone();
    blocking(move || registry.save(&database, flow)).await
}

#[tauri::command]
async fn flow_list(db: State<'_, DbState>) -> Result<Vec<FlowRecord>, String> {
    let db = db.inner().clone();
    blocking(move || db.list()).await
}

#[tauri::command]
async fn flow_delete(
    db: State<'_, DbState>,
    registry: State<'_, FlowRegistry>,
    id: FlowId,
) -> Result<(), String> {
    let registry = registry.inner().clone();
    let db = db.inner().clone();
    blocking(move || registry.delete(&db, id)).await
}

#[tauri::command]
async fn execute_workflow(
    db: State<'_, DbState>,
    id: FlowId,
    graph: Graph,
) -> Result<ExecutionResult, String> {
    let db = db.inner().clone();
    blocking(move || db.execute_workflow(id, graph)).await
}

#[tauri::command]
async fn execution_list(
    db: State<'_, DbState>,
    id: FlowId,
) -> Result<Vec<ExecutionResult>, String> {
    let db = db.inner().clone();
    blocking(move || db.executions(id)).await
}

#[tauri::command]
async fn initialize_db(db: State<'_, DbState>) -> Result<(), String> {
    let db = db.inner().clone();
    blocking(move || db.health()).await
}

#[tauri::command]
fn node_schemas() -> Vec<straw_engine::nodes::NodeSchema> {
    straw_engine::nodes::all_schemas()
}

#[tauri::command]
async fn nlp_send(request: ChatRequest) -> Result<String, String> {
    blocking(move || straw_engine::nlp::send(request)).await
}

#[tauri::command]
async fn generate_code(request: CreationRequest) -> Result<CreationResult, String> {
    blocking(move || straw_engine::codegen::generate(request)).await
}

#[tauri::command]
async fn refine_code(request: RefinementRequest) -> Result<CodeFile, String> {
    blocking(move || straw_engine::codegen::refine(request)).await
}

#[tauri::command]
async fn file_save(output_dir: String, file: CodeFile) -> Result<CodeFile, String> {
    blocking(move || {
        straw_engine::codegen::save_files(std::path::Path::new(&output_dir), &[file], true)?
            .into_iter()
            .next()
            .ok_or("file was not saved".into())
    })
    .await
}

#[tauri::command]
fn wasm_fibonacci(n: u32) -> Result<u32, String> {
    wasm_frontend::fibonacci(n)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .manage(FlowRegistry::default())
        .invoke_handler(tauri::generate_handler![
            flow_new,
            flow_save,
            flow_list,
            flow_delete,
            execute_workflow,
            execution_list,
            node_schemas,
            nlp_send,
            generate_code,
            refine_code,
            file_save,
            initialize_db,
            wasm_fibonacci
        ])
        .setup(|app| {
            let db = DbState::open(app.path().app_data_dir()?.join("straw.db"))
                .map_err(std::io::Error::other)?;
            let listener = tauri::async_runtime::block_on(axum_loop::bind())?;
            let (shutdown, signal) = tokio::sync::oneshot::channel();
            let handle =
                tauri::async_runtime::spawn(axum_loop::serve(listener, db.clone(), signal));
            app.manage(db);
            app.manage(LoopService(Mutex::new(Some(RunningLoop {
                shutdown,
                handle,
            }))));
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("unable to initialize STRAW Desk");
    app.run(|handle, event| {
        if matches!(event, tauri::RunEvent::Exit) {
            if let Some(service) = handle.try_state::<LoopService>() {
                if let Err(error) = service.stop() {
                    eprintln!("STRAW Desk loopback shutdown: {error}");
                }
            }
        }
    });
}

#[cfg(test)]
mod lifecycle_tests {
    use super::*;
    use std::{
        path::PathBuf,
        sync::{mpsc, Barrier},
        thread,
    };
    use straw_engine::dag::RunStatus;

    struct Fixture(PathBuf);
    impl Fixture {
        fn new() -> Self {
            let path = std::env::temp_dir().join(format!("straw-lifecycle-{}", FlowId::mint()));
            std::fs::create_dir_all(&path).unwrap();
            Self(path)
        }
        fn open(&self) -> DbState {
            DbState::open(self.0.join("flows.db")).unwrap()
        }
    }
    impl Drop for Fixture {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.0);
        }
    }

    #[test]
    fn delayed_owned_save_cannot_recreate_deleted_minted_or_persisted_flow() {
        for persisted in [false, true] {
            let fixture = Fixture::new();
            let db = fixture.open();
            let registry = FlowRegistry::default();
            let flow = registry.mint().unwrap();
            if persisted {
                registry.save(&db, flow.clone()).unwrap();
            }
            let id = flow.id;
            let resume = Arc::new(Barrier::new(2));
            let (ready, captured) = mpsc::channel();
            let worker = {
                let registry = registry.clone();
                let database = db.clone();
                let resume = resume.clone();
                thread::spawn(move || {
                    // The dispatched operation owns both states before deletion.
                    ready.send(()).unwrap();
                    resume.wait();
                    registry.save(&database, flow)
                })
            };
            captured.recv_timeout(Duration::from_secs(5)).unwrap();
            registry.delete(&db, id).unwrap();
            registry.delete(&db, id).unwrap(); // successful delete is idempotent
            drop(registry); // the worker's registry clone retains the tombstone
            resume.wait();
            assert!(worker.join().unwrap().unwrap_err().contains("deleted"));
            assert!(db.load(id).unwrap().is_none());
            drop(db);
            assert!(fixture.open().load(id).unwrap().is_none());
        }
    }

    #[test]
    fn identity_persistence_restart_failures_and_history_use_same_database() {
        let fixture = Fixture::new();
        let db = fixture.open();
        let registry = FlowRegistry::default();
        let foreign = FlowRecord::new("foreign".into());
        assert!(registry.save(&db, foreign.clone()).is_err());
        assert!(registry.delete(&db, foreign.id).is_err());
        assert!(db.list().unwrap().is_empty());
        let mut flow = registry.mint().unwrap();
        flow.name = "  ".into();
        assert!(registry.save(&db, flow.clone()).is_err());
        flow.name = "persisted refinement".into();
        let saved = registry.save(&db, flow).unwrap();
        assert_eq!(db.list().unwrap()[0].name, saved.name);
        let result = db.execute_workflow(saved.id, Graph::default()).unwrap();
        assert!(matches!(result.status, RunStatus::Failed { .. }));
        assert!(result.finished_at.is_some());
        assert_eq!(db.executions(saved.id).unwrap()[0].id, result.id);
        drop(db);
        let reopened = fixture.open();
        let restarted_registry = FlowRegistry::default();
        let mut restored = reopened.load(saved.id).unwrap().unwrap();
        restored.name = "updated after restart".into();
        let updated = restarted_registry.save(&reopened, restored).unwrap();
        assert_eq!(updated.created_at, saved.created_at);
        assert_eq!(reopened.executions(saved.id).unwrap()[0].id, result.id);
        restarted_registry.delete(&reopened, saved.id).unwrap();
        assert!(reopened.list().unwrap().is_empty());
        drop(reopened);
        assert!(fixture.open().load(saved.id).unwrap().is_none());
    }

    #[test]
    fn blocking_work_owns_database_session_after_managed_state_is_dropped() {
        let fixture = Fixture::new();
        let db = fixture.open();
        let registry = FlowRegistry::default();
        let flow = registry.mint().unwrap();
        let id = flow.id;
        let task = tauri::async_runtime::spawn_blocking({
            let db = db.clone();
            let registry = registry.clone();
            move || registry.save(&db, flow)
        });
        drop(db);
        drop(registry);
        tauri::async_runtime::block_on(task).unwrap().unwrap();
        assert!(fixture.open().load(id).unwrap().is_some());
    }

    #[test]
    fn real_listener_shares_rows_reports_bind_conflict_and_joins_before_rebind() {
        let fixture = Fixture::new();
        let db = fixture.open();
        let flow = FlowRegistry::default().mint().unwrap();
        db.save(flow.clone()).unwrap();
        let (running, address) = tauri::async_runtime::block_on(async {
            let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
            let address = listener.local_addr().unwrap();
            assert!(tokio::net::TcpListener::bind(address).await.is_err());
            let (shutdown, signal) = tokio::sync::oneshot::channel();
            let handle =
                tauri::async_runtime::spawn(axum_loop::serve(listener, db.clone(), signal));
            (RunningLoop { shutdown, handle }, address)
        });
        let response = straw_engine::network::request(
            "GET",
            &format!("http://{address}/flows"),
            &Default::default(),
            "",
        )
        .unwrap();
        assert_eq!(response.0, 200);
        let rows: Vec<FlowRecord> = serde_json::from_str(&response.1).unwrap();
        assert_eq!(rows[0].id, flow.id);
        let service = LoopService(Mutex::new(Some(running)));
        service.stop().unwrap();
        service.stop().unwrap(); // no second signal or task join
        tauri::async_runtime::block_on(async {
            let rebound = tokio::net::TcpListener::bind(address).await.unwrap();
            drop(rebound);
        });
    }
}
