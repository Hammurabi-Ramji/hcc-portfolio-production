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
mod error;
mod validation;
mod archive;
mod credentials;
mod recovery;
#[cfg(test)]
mod command_tests;
#[cfg(test)]
mod credential_tests;
use error::ApiError;
use straw_inference::{
    discovery::{LocalModel, LocalProvider},
    protocol::{EngineStatus, Request as InferRequest, Response as InferResponse},
    supervisor::Supervisor,
};
use straw_accordion::{Accordion, Autarch, EntitySchema, EntitySummary, Json};
use straw_security::{Grant, Permission, Security, Status as VaultStatus};
use straw_storage::{Revision, VectorHit};
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons};

#[derive(Clone, serde::Serialize, serde::Deserialize, specta::Type)]
#[serde(
    tag = "kind",
    rename_all = "snake_case",
    rename_all_fields = "camelCase",
    deny_unknown_fields
)]
enum Operation {
    CoreBackup { output_dir: String },
    ImportCredentials { source_path: String, owner_id: String, digest: String },
    RevealCredential { digest: String, credential_id: String },
    ImportEduba { source_path: String, digest: String },
    ExportEduba { digest: String, output_path: String },
    Chat {
        request: ChatRequest,
    },
    Generate {
        request: CreationRequest,
    },
    Refine {
        request: RefinementRequest,
    },
    Save {
        output_dir: String,
        file: CodeFile,
    },
    Execute {
        id: FlowId,
        graph: Graph,
    },
    Fabricate {
        template: String,
        output_dir: String,
    },
    Unseal {
        id: String,
    },
    Carve {
        title: String,
        body: String,
        rationale: String,
    },
    Validate {
        project: String,
    },
}
impl Operation {
    fn permissions(&self) -> Vec<Permission> {
        match self {
            Self::CoreBackup { .. } => vec![Permission::Export],
            Self::ImportCredentials { .. } => vec![Permission::Import, Permission::Unseal],
            Self::RevealCredential { .. } => vec![Permission::Unseal],
            Self::ImportEduba { .. } => vec![Permission::Import],
            Self::ExportEduba { .. } => vec![Permission::Export],
            Self::Chat { .. } | Self::Refine { .. } => vec![Permission::Assist],
            Self::Generate { .. } => vec![Permission::Assist, Permission::Export],
            Self::Execute { graph, .. } if graph.nodes.iter().any(|n| n.kind == "llm_prompt") => {
                vec![Permission::Assist, Permission::Export]
            }
            Self::Save { .. } | Self::Execute { .. } | Self::Fabricate { .. } => {
                vec![Permission::Export]
            }
            Self::Unseal { .. } => vec![Permission::Unseal],
            Self::Carve { .. } => vec![Permission::Carve],
            Self::Validate { .. } => vec![Permission::Validate, Permission::Carve],
        }
    }
    fn summary(&self) -> String {
        match self {
            Self::CoreBackup { output_dir } => format!("Create a core recovery copy in new folder {output_dir}. Workflows, documents, archives and encrypted vault data are copied. Ordinary documents and metadata remain readable. Records, models and generated projects are excluded. Existing folders are not overwritten."),
            Self::ImportCredentials { source_path, owner_id, digest } => format!("Decrypt Digital Hands credentials for owner {owner_id} from {source_path} and re-encrypt them into this vault as one immutable import. Source SHA-256: {digest}. The installation key is used only in memory; no source records are changed."),
            Self::RevealCredential { digest, credential_id } => format!("Reveal Digital Hands credential {credential_id} from import {digest} in the desktop. Its username, password and notes will be visible until cleared."),
            Self::ImportEduba { source_path, digest } => format!("Import the reviewed Eduba records from {source_path} into an immutable plaintext archive. Content SHA-256: {digest}. No source tables are changed; credential tables are excluded and record text is copied as written."),
            Self::ExportEduba { digest, output_path } => format!("Export Eduba archive {digest} as plaintext JSON to {output_path}. Existing files will not be overwritten."),
            Self::Validate { project } => format!("Validate {project}. Build, test and lint tools may execute this project's code. If all nine checks pass, record a permanent certificate in your ledger."),
            Self::Chat { request } => format!(
                "Send {} messages to local model {}",
                request.messages.len(),
                request.settings.model
            ),
            Self::Generate { request } => format!(
                "Generate with local model {} and write new files in {}",
                request.settings.model, request.output_dir
            ),
            Self::Refine { request } => format!(
                "Refine {} with local model {}",
                request.file.path, request.settings.model
            ),
            Self::Save { output_dir, file } => format!("Save {} in {}", file.path, output_dir),
            Self::Execute { id, .. } => format!(
                "Execute workflow {id}; configured nodes may write files or call local services"
            ),
            Self::Fabricate {
                template,
                output_dir,
            } => format!("Fabricate {template} in {output_dir}"),
            Self::Unseal { id } => format!("Reveal vault item {id} in the desktop"),
            Self::Carve {
                title,
                body,
                rationale,
            } => format!(
                "Carve a permanent precedent into the signed ledger; it can never be edited or removed. Title: {title} | Rationale: {rationale} | Body: {} characters, covered by the request digest",
                body.chars().count()
            ),
        }
        .chars()
        .filter(|c| !c.is_control())
        .take(1000)
        .collect()
    }
}
fn consume(security: &Security, id: String, operation: &Operation) -> Result<(), String> {
    security.consume(
        id,
        operation.permissions(),
        straw_security::digest(operation)?,
    )
}
fn writable(security: &Security) -> Result<(), String> {
    if security.status()?.quarantined {
        Err("ledger_quarantined".into())
    } else {
        Ok(())
    }
}

#[tauri::command]
#[specta::specta]
async fn grant_request(
    app: tauri::AppHandle,
    security: State<'_, Arc<Security>>,
    operation: Operation,
) -> Result<Grant, ApiError> {
    let security = security.inner().clone();
    blocking(move|| {
        let status = security.status()?;
        if status.quarantined { return Err("ledger_quarantined".into()); }
        if !status.unlocked { return Err("vault_locked: initialize or unlock Vault first".into()); }
        let digest=straw_security::digest(&operation)?;
        let approved=app.dialog().message(format!("{}\n\nPermissions: {:?}\nRequest SHA-256: {}\n\nThis grant is single-use and expires after five minutes.",operation.summary(),operation.permissions(),digest)).title("STRAW operation grant").buttons(MessageDialogButtons::OkCancelCustom("Approve once".into(),"Cancel".into())).blocking_show();
        if !approved{return Err("grant_required: operation cancelled".into());}security.issue(operation.permissions(),digest)
    }).await
}
#[tauri::command]
#[specta::specta]
async fn vault_status(security: State<'_, Arc<Security>>) -> Result<VaultStatus, ApiError> {
    let security = security.inner().clone();
    blocking(move || security.status()).await
}
#[tauri::command]
#[specta::specta]
async fn vault_initialize(
    security: State<'_, Arc<Security>>,
    password: String,
) -> Result<VaultStatus, ApiError> {
    let security = security.inner().clone();
    blocking(move || security.initialize(zeroize::Zeroizing::new(password))).await
}
#[tauri::command]
#[specta::specta]
async fn vault_unlock(
    security: State<'_, Arc<Security>>,
    password: String,
) -> Result<VaultStatus, ApiError> {
    let security = security.inner().clone();
    blocking(move || security.unlock(zeroize::Zeroizing::new(password))).await
}
#[tauri::command]
#[specta::specta]
async fn vault_lock(security: State<'_, Arc<Security>>) -> Result<(), ApiError> {
    let security = security.inner().clone();
    blocking(move || security.lock()).await
}
#[tauri::command]
#[specta::specta]
async fn vault_put(
    security: State<'_, Arc<Security>>,
    id: String,
    value: String,
) -> Result<(), ApiError> {
    let security = security.inner().clone();
    blocking(move || security.put(id, zeroize::Zeroizing::new(value))).await
}
#[tauri::command]
#[specta::specta]
async fn vault_get(
    security: State<'_, Arc<Security>>,
    id: String,
    grant: String,
) -> Result<String, ApiError> {
    let security = security.inner().clone();
    blocking(move || {
        consume(&security, grant, &Operation::Unseal { id: id.clone() })?;
        security.get(id)
    })
    .await
}

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
) -> Result<T, ApiError> {
    tauri::async_runtime::spawn_blocking(f)
        .await
        .map_err(|e| ApiError::from(e.to_string()))?
        .map_err(Into::into)
}

#[tauri::command]
#[specta::specta]
fn flow_new(registry: State<'_, FlowRegistry>) -> Result<FlowRecord, ApiError> {
    registry.mint().map_err(Into::into)
}

#[tauri::command]
#[specta::specta]
async fn flow_save(
    security: State<'_, Arc<Security>>,
    db: State<'_, DbState>,
    registry: State<'_, FlowRegistry>,
    flow: FlowRecord,
) -> Result<FlowRecord, ApiError> {
    let registry = registry.inner().clone();
    let database = db.inner().clone();
    let security = security.inner().clone();
    blocking(move || {
        writable(&security)?;
        registry.save(&database, flow)
    })
    .await
}

#[tauri::command]
#[specta::specta]
async fn flow_list(db: State<'_, DbState>) -> Result<Vec<FlowRecord>, ApiError> {
    let db = db.inner().clone();
    blocking(move || db.list()).await
}

#[tauri::command]
#[specta::specta]
async fn flow_delete(
    security: State<'_, Arc<Security>>,
    db: State<'_, DbState>,
    registry: State<'_, FlowRegistry>,
    id: FlowId,
) -> Result<(), ApiError> {
    let registry = registry.inner().clone();
    let db = db.inner().clone();
    let security = security.inner().clone();
    blocking(move || {
        writable(&security)?;
        registry.delete(&db, id)
    })
    .await
}

#[tauri::command]
#[specta::specta]
async fn execute_workflow(
    worker: State<'_, Arc<Supervisor>>,
    security: State<'_, Arc<Security>>,
    grant: String,
    db: State<'_, DbState>,
    id: FlowId,
    graph: Graph,
) -> Result<ExecutionResult, ApiError> {
    let db = db.inner().clone();
    let worker = worker.inner().clone();
    let security = security.inner().clone();
    blocking(move || {
        consume(
            &security,
            grant,
            &Operation::Execute {
                id,
                graph: graph.clone(),
            },
        )?;
        db.execute_workflow_with(id, graph, &|settings, prompt, system| {
            infer(&worker, settings, prompt, system)
        })
    })
    .await
}

#[tauri::command]
#[specta::specta]
async fn execution_list(
    db: State<'_, DbState>,
    id: FlowId,
) -> Result<Vec<ExecutionResult>, ApiError> {
    let db = db.inner().clone();
    blocking(move || db.executions(id)).await
}

#[tauri::command]
#[specta::specta]
async fn initialize_db(db: State<'_, DbState>) -> Result<(), ApiError> {
    let db = db.inner().clone();
    blocking(move || db.health()).await
}

#[tauri::command]
#[specta::specta]
fn node_schemas() -> Vec<straw_engine::nodes::NodeSchema> {
    straw_engine::nodes::all_schemas()
}

#[tauri::command]
#[specta::specta]
async fn nlp_send(
    security: State<'_, Arc<Security>>,
    grant: String,
    worker: State<'_, Arc<Supervisor>>,
    request: ChatRequest,
) -> Result<String, ApiError> {
    let worker = worker.inner().clone();
    let security = security.inner().clone();
    blocking(move || {
        consume(
            &security,
            grant,
            &Operation::Chat {
                request: request.clone(),
            },
        )?;
        straw_engine::nlp::send_with(request, |settings, prompt, system| {
            infer(&worker, settings, prompt, system)
        })
    })
    .await
}

#[tauri::command]
#[specta::specta]
async fn generate_code(
    security: State<'_, Arc<Security>>,
    grant: String,
    worker: State<'_, Arc<Supervisor>>,
    request: CreationRequest,
) -> Result<CreationResult, ApiError> {
    let worker = worker.inner().clone();
    let security = security.inner().clone();
    blocking(move || {
        consume(
            &security,
            grant,
            &Operation::Generate {
                request: request.clone(),
            },
        )?;
        straw_engine::codegen::generate_with(request, |settings, prompt, system| {
            infer(&worker, settings, prompt, system)
        })
    })
    .await
}

#[tauri::command]
#[specta::specta]
async fn refine_code(
    security: State<'_, Arc<Security>>,
    grant: String,
    worker: State<'_, Arc<Supervisor>>,
    request: RefinementRequest,
) -> Result<CodeFile, ApiError> {
    let worker = worker.inner().clone();
    let security = security.inner().clone();
    blocking(move || {
        consume(
            &security,
            grant,
            &Operation::Refine {
                request: request.clone(),
            },
        )?;
        straw_engine::codegen::refine_with(request, |settings, prompt, system| {
            infer(&worker, settings, prompt, system)
        })
    })
    .await
}

#[tauri::command]
#[specta::specta]
async fn file_save(
    security: State<'_, Arc<Security>>,
    grant: String,
    output_dir: String,
    file: CodeFile,
) -> Result<CodeFile, ApiError> {
    let security = security.inner().clone();
    blocking(move || {
        consume(
            &security,
            grant,
            &Operation::Save {
                output_dir: output_dir.clone(),
                file: file.clone(),
            },
        )?;
        straw_engine::codegen::save_files(std::path::Path::new(&output_dir), &[file], true)?
            .into_iter()
            .next()
            .ok_or("file was not saved".into())
    })
    .await
}

#[tauri::command]
#[specta::specta]
fn wasm_fibonacci(n: u32) -> Result<u32, ApiError> {
    wasm_frontend::fibonacci(n).map_err(Into::into)
}

fn infer(
    worker: &Supervisor,
    settings: &straw_engine::contract::ModelSettings,
    prompt: &str,
    system: &str,
) -> Result<String, String> {
    if settings.api_url == "candle://bundled" {
        if settings.model != "rockypod/svelte-coder-4b" {
            return Err("bundled model identity mismatch".into());
        }
        worker.generate(prompt, system, settings.temperature)
    } else {
        if let Some(base) = settings.api_url.strip_suffix("/api/generate") {
            straw_inference::discovery::verify_ollama_local(base, &settings.model)?;
        }
        straw_engine::network::generate(settings, prompt, system)
    }
}
#[derive(serde::Deserialize, specta::Type)]
#[serde(rename_all = "snake_case")]
enum ModelAction {
    Status,
    Load,
    Warm,
    Unload,
}
#[tauri::command]
#[specta::specta]
async fn model_control(
    worker: State<'_, Arc<Supervisor>>,
    action: ModelAction,
) -> Result<EngineStatus, ApiError> {
    let worker = worker.inner().clone();
    blocking(move || {
        let request = match action {
            ModelAction::Status => InferRequest::Status,
            ModelAction::Load => InferRequest::Load,
            ModelAction::Warm => InferRequest::Warm,
            ModelAction::Unload => InferRequest::Unload,
        };
        match worker.request(request)? {
            InferResponse::Status(status) => Ok(status),
            _ => Err("unexpected model status response".into()),
        }
    })
    .await
}
#[tauri::command]
#[specta::specta]
async fn model_scan(provider: LocalProvider, base: String) -> Result<Vec<LocalModel>, ApiError> {
    blocking(move || straw_inference::discovery::scan(provider, &base)).await
}
#[tauri::command]
#[specta::specta]
async fn model_select(provider: LocalProvider, base: String, id: String) -> Result<(), ApiError> {
    blocking(move || straw_inference::discovery::load(provider, &base, &id)).await
}
#[tauri::command]
#[specta::specta]
async fn document_list(db: State<'_, DbState>) -> Result<Vec<Revision>, ApiError> {
    let db = db.inner().clone();
    blocking(move || db.storage().documents()).await
}
#[tauri::command]
#[specta::specta]
async fn document_save(
    security: State<'_, Arc<Security>>,
    db: State<'_, DbState>,
    id: String,
    expected: Option<String>,
    text: String,
) -> Result<Revision, ApiError> {
    let db = db.inner().clone();
    let security = security.inner().clone();
    blocking(move || {
        writable(&security)?;
        db.storage().revise(id, expected, text)
    })
    .await
}
#[tauri::command]
#[specta::specta]
async fn vector_put(
    security: State<'_, Arc<Security>>,
    db: State<'_, DbState>,
    id: String,
    model: String,
    vector: Vec<f32>,
) -> Result<(), ApiError> {
    let db = db.inner().clone();
    let security = security.inner().clone();
    blocking(move || {
        writable(&security)?;
        db.storage().put_vector(id, model, vector)
    })
    .await
}
#[tauri::command]
#[specta::specta]
async fn vector_search(
    db: State<'_, DbState>,
    model: String,
    vector: Vec<f32>,
    limit: u32,
) -> Result<Vec<VectorHit>, ApiError> {
    let db = db.inner().clone();
    blocking(move || db.storage().search(model, vector, limit)).await
}
#[tauri::command]
#[specta::specta]
fn loopback_set(
    service: State<'_, LoopService>,
    db: State<'_, DbState>,
    enabled: bool,
) -> Result<(), ApiError> {
    let mut slot = service.0.lock().map_err(|e| e.to_string())?;
    if enabled && slot.is_none() {
        let listener =
            tauri::async_runtime::block_on(axum_loop::bind()).map_err(|e| e.to_string())?;
        let (shutdown, signal) = tokio::sync::oneshot::channel();
        let handle =
            tauri::async_runtime::spawn(axum_loop::serve(listener, db.inner().clone(), signal));
        *slot = Some(RunningLoop { shutdown, handle });
    } else if !enabled {
        if let Some(running) = slot.take() {
            tauri::async_runtime::block_on(running.stop())?;
        }
    }
    Ok(())
}

// A precedent from the vault ledger, as the UI sees it. Reading needs no grant
// and no unlocked vault; the ledger is fully re-verified first. Plain comments:
// doc comments on exported fields break the generated JSDoc bindings.
#[derive(Debug, serde::Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
struct PrecedentView {
    seq: u32,
    id: String,
    title: String,
    body: String,
    author: String,
    created_at: String,
    judge: String,
    rationale: String,
    judged_at: String,
    rules_version: u32,
    digest: String,
    entry_hash: String,
    signer: String,
}

#[tauri::command]
#[specta::specta]
async fn precedent_list(security: State<'_, Arc<Security>>) -> Result<Vec<PrecedentView>, ApiError> {
    let security = security.inner().clone();
    blocking(move || {
        Ok(security
            .precedents()?
            .into_iter()
            .map(|p| PrecedentView {
                seq: p.receipt.seq,
                id: p.record.id,
                title: p.record.title,
                body: p.record.body,
                author: p.record.author,
                created_at: p.record.created_at,
                judge: p.record.judge,
                rationale: p.record.rationale,
                judged_at: p.record.judged_at,
                rules_version: p.record.rules_version,
                digest: p.receipt.digest,
                entry_hash: p.receipt.entry_hash,
                signer: p.receipt.public_key,
            })
            .collect())
    })
    .await
}

// Plain comments: doc comments on exported fields break the generated JSDoc bindings.
#[derive(Debug, serde::Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
struct CarveReceipt {
    seq: u32,
    digest: String,
    entry_hash: String,
}

// Carving is permanent, so it takes a single-use grant bound to the exact
// title, body and rationale the operator approved in the native dialog. The
// vault must be unlocked: the vault signer signs the ledger entry.
#[tauri::command]
#[specta::specta]
async fn precedent_carve(
    security: State<'_, Arc<Security>>,
    title: String,
    body: String,
    rationale: String,
    grant: String,
) -> Result<CarveReceipt, ApiError> {
    let security = security.inner().clone();
    blocking(move || carve_with_grant(security, title, body, rationale, grant)).await
}

fn carve_with_grant(
    security: Arc<Security>,
    title: String,
    body: String,
    rationale: String,
    grant: String,
) -> Result<CarveReceipt, String> {
    // The grant binds the arguments exactly as the operator approved them.
    let approved = Operation::Carve {
        title: title.clone(),
        body: body.clone(),
        rationale: rationale.clone(),
    };
    let (title, rationale) = (title.trim().to_owned(), rationale.trim().to_owned());
    if title.is_empty() || title.chars().count() > 200 {
        return Err("invalid_request: title must be 1..200 characters".into());
    }
    if rationale.is_empty() || rationale.chars().count() > 1000 {
        return Err("invalid_request: rationale must be 1..1000 characters".into());
    }
    if body.len() > 100_000 {
        return Err("invalid_request: body exceeds 100000 bytes".into());
    }
    consume(&security, grant, &approved)?;
    let sealed = straw_stele::Scribe::new(security)
        .carve(
            straw_stele::Precedent::draft(straw_stele::PrecedentCore::new(title, body, "operator", 1))
                .judge(straw_stele::Judgment::now("operator", rationale)),
        )
        .map_err(|e| match e {
            straw_stele::SteleError::VaultLocked => "vault_locked: unlock the vault to carve".to_string(),
            other => other.to_string(),
        })?;
    let receipt = sealed.receipt();
    Ok(CarveReceipt {
        seq: receipt.seq,
        digest: receipt.digest.clone(),
        entry_hash: receipt.entry_hash.clone(),
    })
}

// Accordion.BE: the entity commands origami-fe calls. The schema is the
// `entities` section of .autarch.yaml, embedded at build time.
const AUTARCH_YAML: &str = include_str!("../../.autarch.yaml");

#[tauri::command]
#[specta::specta]
async fn schema_entities(accordion: State<'_, Accordion>) -> Result<Vec<EntitySummary>, ApiError> {
    Ok(accordion.schema_entities())
}
#[tauri::command]
#[specta::specta]
async fn schema_get(
    accordion: State<'_, Accordion>,
    entity: String,
) -> Result<EntitySchema, ApiError> {
    accordion.schema_get(&entity).map_err(|e| e.to_string().into())
}
#[tauri::command]
#[specta::specta]
async fn entity_list(
    accordion: State<'_, Accordion>,
    entity: String,
) -> Result<Vec<Json>, ApiError> {
    let accordion = accordion.inner().clone();
    blocking(move || {
        accordion
            .entity_list(&entity)
            .map(|rows| rows.into_iter().map(Json).collect())
            .map_err(|e| e.to_string())
    })
    .await
}
#[tauri::command]
#[specta::specta]
async fn entity_read(
    accordion: State<'_, Accordion>,
    entity: String,
    id: String,
) -> Result<Json, ApiError> {
    let accordion = accordion.inner().clone();
    blocking(move || {
        accordion
            .entity_read(&entity, &id)
            .map(Json)
            .map_err(|e| e.to_string())
    })
    .await
}
#[tauri::command]
#[specta::specta]
async fn entity_save(
    security: State<'_, Arc<Security>>,
    accordion: State<'_, Accordion>,
    entity: String,
    id: Option<String>,
    record: Json,
) -> Result<Json, ApiError> {
    let accordion = accordion.inner().clone();
    let security = security.inner().clone();
    blocking(move || {
        writable(&security)?;
        accordion
            .entity_save(&entity, id, record.0)
            .map(Json)
            .map_err(|e| e.to_string())
    })
    .await
}
#[tauri::command]
#[specta::specta]
async fn entity_delete(
    security: State<'_, Arc<Security>>,
    accordion: State<'_, Accordion>,
    entity: String,
    id: String,
) -> Result<(), ApiError> {
    let accordion = accordion.inner().clone();
    let security = security.inner().clone();
    blocking(move || {
        writable(&security)?;
        accordion.entity_delete(&entity, &id).map_err(|e| e.to_string())
    })
    .await
}

fn contract_builder() -> tauri_specta::Builder<tauri::Wry> {
    tauri_specta::Builder::new()
        .error_handling(tauri_specta::ErrorHandlingMode::Throw)
        .commands(tauri_specta::collect_commands![
            recovery::recovery_pick,
            recovery::recovery_create,
            recovery::recovery_verify,
            credentials::credentials_pick_source,
            credentials::credentials_owners,
            credentials::credentials_preview,
            credentials::credentials_list,
            credentials::credentials_import,
            credentials::credentials_reveal,
            archive::eduba_pick_source,
            archive::eduba_pick_export,
            archive::eduba_preview,
            archive::eduba_list,
            archive::eduba_import,
            archive::eduba_export,
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
            wasm_fibonacci,
            model_control,
            model_scan,
            model_select,
            document_list,
            document_save,
            schema_entities,
            schema_get,
            entity_list,
            entity_read,
            entity_save,
            entity_delete,
            precedent_list,
            precedent_carve,
            validation::validation_pick_project,
            validation::validation_run,
            vector_put,
            vector_search,
            loopback_set,
            fabricator_templates,
            fabricator_generate,
            execution_archive,
            grant_request,
            vault_status,
            vault_initialize,
            vault_unlock,
            vault_lock,
            vault_put,
            vault_get
        ])
}
#[tauri::command]
#[specta::specta]
fn fabricator_templates() -> Vec<String> {
    straw_fabricator::TEMPLATES
        .iter()
        .map(|s| s.to_string())
        .collect()
}
#[tauri::command]
#[specta::specta]
async fn fabricator_generate(
    security: State<'_, Arc<Security>>,
    grant: String,
    template: String,
    output_dir: String,
) -> Result<straw_fabricator::Bundle, ApiError> {
    let security = security.inner().clone();
    blocking(move || {
        consume(
            &security,
            grant,
            &Operation::Fabricate {
                template: template.clone(),
                output_dir: output_dir.clone(),
            },
        )?;
        straw_fabricator::generate(&template, std::path::Path::new(&output_dir))
    })
    .await
}
#[tauri::command]
#[specta::specta]
async fn execution_archive(
    security: State<'_, Arc<Security>>,
    db: State<'_, DbState>,
    id: FlowId,
    run_id: String,
) -> Result<Revision, ApiError> {
    let db = db.inner().clone();
    let security = security.inner().clone();
    blocking(move || {
        writable(&security)?;
        let run = db
            .executions(id)?
            .into_iter()
            .find(|r| r.id == run_id)
            .ok_or("execution not found")?;
        let text = serde_json::to_string_pretty(&run).map_err(|e| e.to_string())?;
        db.storage()
            .revise(format!("execution/{}", run.id), None, text)
    })
    .await
}
pub fn export_bindings(directory: &std::path::Path) -> Result<(), Box<dyn std::error::Error>> {
    let builder = contract_builder();
    builder.export(
        specta_typescript::Typescript::default(),
        directory.join("bindings.ts"),
    )?;
    builder.export(
        specta_typescript::JSDoc::default(),
        directory.join("bindings.js"),
    )?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Bounded debug-only acceptance runs use an isolated data directory and
    // close their own window. Release builds expose no timed-exit control.
    #[cfg(debug_assertions)]
    let acceptance_exit = std::env::var("STRAW_TEST_EXIT_AFTER_MS").ok()
        .and_then(|s| s.parse::<u64>().ok()).filter(|ms| (100..=10_000).contains(ms));
    let bindings = contract_builder();
    #[cfg(debug_assertions)]
    export_bindings(&std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../ui"))
        .expect("binding export failed");
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(FlowRegistry::default())
        .invoke_handler(bindings.invoke_handler())
        .setup(move |app| {
            bindings.mount_events(app);
            let data_dir = app.path().app_data_dir()?;
            // Development acceptance checks can isolate data from the operator's vault.
            // Release builds always use the platform application directory.
            #[cfg(debug_assertions)]
            let data_dir = std::env::var_os("STRAW_TEST_DATA_DIR")
                .map(std::path::PathBuf::from)
                .unwrap_or(data_dir);
            if !data_dir.is_absolute() { return Err("application data directory must be absolute".into()); }
            let db = DbState::open(data_dir.join("straw.db"))
                .map_err(std::io::Error::other)?;
            let security = Security::open(
                db.storage().clone(),
                data_dir.join("straw-checkpoint.json"),
            )
            .map_err(std::io::Error::other)?;
            app.manage(Arc::new(security));
            let accordion = Accordion::open_path(
                data_dir.join("accordion.db"),
                Autarch::from_yaml(AUTARCH_YAML).map_err(std::io::Error::other)?,
            )
            .map_err(std::io::Error::other)?;
            app.manage(accordion);
            let executable = std::env::current_exe()?
                .parent()
                .ok_or("missing executable directory")?
                .join(if cfg!(windows) {
                    "straw-infer.exe"
                } else {
                    "straw-infer"
                });
            let pack = if cfg!(debug_assertions) {
                std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
                    .join("resources/models/svelte-coder")
            } else {
                app.path().resource_dir()?.join("models/svelte-coder")
            };
            app.manage(Arc::new(Supervisor::new(executable, pack)));
            app.manage(db);
            app.manage(LoopService::default());
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("unable to initialize STRAW Desk");
    app.run(move |handle, event| {
        #[cfg(debug_assertions)]
        if matches!(event, tauri::RunEvent::Ready) {
            if let Some(ms) = acceptance_exit {
                if let Some(window) = handle.get_webview_window("main") { let _ = window.hide(); }
                let owned = handle.clone();
                std::thread::spawn(move || {
                    std::thread::sleep(Duration::from_millis(ms));
                    owned.exit(0);
                });
            }
        }
        if matches!(event, tauri::RunEvent::Exit) {
            if let Some(security) = handle.try_state::<Arc<Security>>() {
                let _ = security.lock();
            }
            if let Some(worker) = handle.try_state::<Arc<Supervisor>>() {
                let _ = worker.stop();
            }
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

    fn get_ok(url: &str) -> Result<(u16, String), String> {
        straw_engine::network::request("GET", url, &Default::default(), "")
    }

    // Windows Hyper-V excluded ranges can assign an ephemeral port that binds
    // but rejects client connect with WSAEACCES (10013). Retry until reachable.
    fn start_shared_listener(db: DbState) -> (RunningLoop, std::net::SocketAddr) {
        tauri::async_runtime::block_on(async {
            let _production = tokio::net::TcpListener::bind(axum_loop::BIND_ADDRESS)
                .await
                .ok();
            let mut last_error = String::from("no loopback candidate");
            for _ in 0..24 {
                let listener = tokio::net::TcpListener::bind((std::net::Ipv4Addr::LOCALHOST, 0))
                    .await
                    .unwrap();
                let address = listener.local_addr().unwrap();
                assert!(tokio::net::TcpListener::bind(address).await.is_err());
                let (shutdown, signal) = tokio::sync::oneshot::channel();
                let handle =
                    tauri::async_runtime::spawn(axum_loop::serve(listener, db.clone(), signal));
                let running = RunningLoop { shutdown, handle };
                let health = format!("http://{address}/health");
                let probe = thread::spawn(move || {
                    let mut err = String::from("health probe timed out");
                    for _ in 0..40 {
                        match get_ok(&health) {
                            Ok((200, body)) if body == "ok" => return Ok(()),
                            Ok(other) => err = format!("unexpected health {other:?}"),
                            Err(error) => {
                                err = error;
                                let transient = err.contains("10013")
                                    || err.contains("Connection Failed")
                                    || err.contains("connection refused")
                                    || err.to_ascii_lowercase().contains("actively refused");
                                if !transient {
                                    return Err(err);
                                }
                            }
                        }
                        thread::sleep(Duration::from_millis(25));
                    }
                    Err(err)
                })
                .join()
                .unwrap();
                match probe {
                    Ok(()) => return (running, address),
                    Err(error) => {
                        last_error = error;
                        let _ = running.stop().await;
                    }
                }
            }
            panic!("connectable loopback listener unavailable: {last_error}");
        })
    }

    #[test]
    fn real_listener_shares_rows_reports_bind_conflict_and_joins_before_rebind() {
        let fixture = Fixture::new();
        let db = fixture.open();
        let flow = FlowRegistry::default().mint().unwrap();
        db.save(flow.clone()).unwrap();
        let (running, address) = start_shared_listener(db.clone());
        let flows = format!("http://{address}/flows");
        let response = tauri::async_runtime::block_on(tauri::async_runtime::spawn_blocking(
            move || get_ok(&flows),
        ))
        .unwrap()
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

    #[test]
    fn production_bind_conflict_surfaces_and_loop_service_stop_is_idempotent() {
        tauri::async_runtime::block_on(async {
            let occupied = tokio::net::TcpListener::bind(axum_loop::BIND_ADDRESS).await;
            match occupied {
                Ok(holder) => {
                    let error = axum_loop::bind().await.expect_err("occupied 8741 must fail");
                    let text = error.to_string().to_ascii_lowercase();
                    assert!(
                        error.kind() == std::io::ErrorKind::AddrInUse
                            || text.contains("10048")
                            || text.contains("address")
                            || text.contains("10013"),
                        "bind conflict reporting: {error}"
                    );
                    drop(holder);
                    let rebound = axum_loop::bind().await.unwrap();
                    drop(rebound);
                }
                Err(error) => {
                    // Another process already holds 8741; the same failure path is reported.
                    let text = error.to_string().to_ascii_lowercase();
                    assert!(
                        error.kind() == std::io::ErrorKind::AddrInUse
                            || text.contains("10048")
                            || text.contains("address")
                            || text.contains("10013"),
                        "unexpected production bind error: {error}"
                    );
                }
            }
        });
        let service = LoopService::default();
        service.stop().unwrap();
        service.stop().unwrap();
    }
}

#[cfg(test)]
mod carve_tests {
    use super::*;
    use zeroize::Zeroizing;

    const PASS: &str = "a strong test passphrase";

    struct Fixture {
        dir: std::path::PathBuf,
        security: Arc<Security>,
    }
    impl Fixture {
        fn new() -> Self {
            let dir = std::env::temp_dir().join(format!("straw-carve-{}", FlowId::mint()));
            std::fs::create_dir_all(&dir).unwrap();
            let store = straw_storage::Store::open(dir.join("secure.db"), "").unwrap();
            let security = Arc::new(Security::open(store, dir.join("head.json")).unwrap());
            security.initialize(Zeroizing::new(PASS.into())).unwrap();
            Self { dir, security }
        }
        fn grant_for(&self, title: &str, body: &str, rationale: &str) -> String {
            let operation = op(title, body, rationale);
            self.security
                .issue(operation.permissions(), straw_security::digest(&operation).unwrap())
                .unwrap()
                .id
        }
        fn carve(&self, title: &str, body: &str, rationale: &str, grant: String) -> Result<CarveReceipt, String> {
            carve_with_grant(self.security.clone(), title.into(), body.into(), rationale.into(), grant)
        }
    }
    impl Drop for Fixture {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.dir);
        }
    }
    fn op(title: &str, body: &str, rationale: &str) -> Operation {
        Operation::Carve { title: title.into(), body: body.into(), rationale: rationale.into() }
    }

    #[test]
    fn an_approved_carve_lands_in_the_ledger_and_the_grant_is_single_use() {
        let f = Fixture::new();
        let grant = f.grant_for("Law I", "What is carved is carved.", "Weighed.");
        let receipt = f.carve("Law I", "What is carved is carved.", "Weighed.", grant.clone()).unwrap();
        assert_eq!(receipt.seq, 3, "initialize=0, grant issued=1, grant consumed=2, precedent=3");
        let stored = f.security.precedents().unwrap();
        assert_eq!(stored.len(), 1);
        assert_eq!(stored[0].record.title, "Law I");
        assert_eq!(stored[0].record.author, "operator");
        let replay = f.carve("Law I", "What is carved is carved.", "Weighed.", grant).unwrap_err();
        assert!(replay.contains("grant_invalid"), "{replay}");
        assert_eq!(f.security.precedents().unwrap().len(), 1);
    }

    #[test]
    fn a_grant_covers_exactly_what_the_operator_approved() {
        let f = Fixture::new();
        let grant = f.grant_for("Law I", "approved body", "Weighed.");
        let err = f.carve("Law I", "a different body", "Weighed.", grant).unwrap_err();
        assert!(err.contains("grant_invalid"), "{err}");
        assert!(f.security.precedents().unwrap().is_empty());
        let err = f.carve("Law I", "approved body", "Weighed.", "no-such-grant".into()).unwrap_err();
        assert!(err.contains("grant_invalid"), "{err}");
    }

    #[test]
    fn titles_and_rationales_are_trimmed_after_the_grant_is_checked() {
        let f = Fixture::new();
        let grant = f.grant_for("  Law I  ", "body", "  Weighed.  ");
        f.carve("  Law I  ", "body", "  Weighed.  ", grant).unwrap();
        let stored = f.security.precedents().unwrap();
        assert_eq!((stored[0].record.title.as_str(), stored[0].record.rationale.as_str()), ("Law I", "Weighed."));
    }

    #[test]
    fn invalid_requests_are_refused_without_spending_the_grant() {
        let f = Fixture::new();
        let grant = f.grant_for("   ", "body", "Weighed.");
        assert!(f.carve("   ", "body", "Weighed.", grant.clone()).unwrap_err().contains("invalid_request"));
        let long = "x".repeat(201);
        let grant_long = f.grant_for(&long, "body", "Weighed.");
        assert!(f.carve(&long, "body", "Weighed.", grant_long).unwrap_err().contains("invalid_request"));
        let grant_blank = f.grant_for("Law", "body", " ");
        assert!(f.carve("Law", "body", " ", grant_blank).unwrap_err().contains("invalid_request"));
        let big = "x".repeat(100_001);
        let grant_big = f.grant_for("Law", &big, "Weighed.");
        assert!(f.carve("Law", &big, "Weighed.", grant_big).unwrap_err().contains("invalid_request"));
        // The first grant was never consumed by the refusal.
        assert!(f.security.consume(grant, op("   ", "body", "Weighed.").permissions(), straw_security::digest(&op("   ", "body", "Weighed.")).unwrap()).is_ok());
        assert!(f.security.precedents().unwrap().is_empty());
    }

    #[test]
    fn a_locked_vault_cannot_carve() {
        let f = Fixture::new();
        let grant = f.grant_for("Law I", "body", "Weighed.");
        f.security.lock().unwrap();
        let err = f.carve("Law I", "body", "Weighed.", grant).unwrap_err();
        assert!(err.contains("vault_locked"), "{err}");
        f.security.unlock(Zeroizing::new(PASS.into())).unwrap();
        assert!(f.security.precedents().unwrap().is_empty());
    }

    #[test]
    fn the_dialog_text_names_the_permanence_and_the_scope() {
        let operation = op("Law I", &"x".repeat(1234), "Weighed.");
        assert_eq!(operation.permissions(), vec![Permission::Carve]);
        let summary = operation.summary();
        assert!(summary.contains("never be edited or removed"));
        assert!(summary.contains("Title: Law I") && summary.contains("1234 characters"));
    }
}
