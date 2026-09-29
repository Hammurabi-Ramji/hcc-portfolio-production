//! STRAW-stack Tauri Application
//! 
//! A desktop application built with Svelte, Tauri, and Rust for
//! flow-based automation, AI code generation, and multimodal AI interaction.

mod dag;
mod db;
mod nodes;
mod nlp;
mod codegen;
mod no_code;
mod wasm_commands;

use dag::{Flow, ExecutionResult};
use db::FlowRecord;
use nlp::{NlpRequest, NlpResponse};
use codegen::{CreationRequest, CreationResult, RefinementRequest, RefinementResult};
use uuid::Uuid;

// ── Flow CRUD ────────────────────────────────────────────────────────────────

#[tauri::command]
fn list_flows() -> Result<Vec<FlowRecord>, String> {
    let conn = db::open().map_err(|e| e.to_string())?;
    db::list_flows(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_flow(id: String) -> Result<Option<FlowRecord>, String> {
    let conn = db::open().map_err(|e| e.to_string())?;
    db::load_flow(&conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_flow(id: Option<String>, name: String, definition: String) -> Result<String, String> {
    let conn = db::open().map_err(|e| e.to_string())?;
    let flow_id = id.unwrap_or_else(|| Uuid::new_v4().to_string());
    db::save_flow(&conn, &flow_id, &name, &definition).map_err(|e| e.to_string())?;
    Ok(flow_id)
}

#[tauri::command]
fn delete_flow(id: String) -> Result<(), String> {
    let conn = db::open().map_err(|e| e.to_string())?;
    db::delete_flow(&conn, &id).map_err(|e| e.to_string())
}

// ── Execution ────────────────────────────────────────────────────────────────

#[tauri::command]
fn run_flow(flow_json: String, flow_id: Option<String>) -> Result<ExecutionResult, String> {
    let flow: Flow = serde_json::from_str(&flow_json).map_err(|e| e.to_string())?;
    let result = dag::run_flow(&flow);

    // Persist execution record if flow has an id
    if let Some(fid) = flow_id {
        if let Ok(conn) = db::open() {
            let exec_id = Uuid::new_v4().to_string();
            let result_json = serde_json::to_string(&result).unwrap_or_default();
            db::save_execution(&conn, &exec_id, &fid, &result_json).ok();
        }
    }

    Ok(result)
}

// ── Node registry ────────────────────────────────────────────────────────────

#[tauri::command]
fn get_node_schemas() -> serde_json::Value {
    serde_json::to_value(nodes::all_schemas()).unwrap_or(serde_json::Value::Array(vec![]))
}

// ── NLP / Multimodal AI ───────────────────────────────────────────────────────

#[tauri::command]
fn nlp_send(request: NlpRequest) -> Result<NlpResponse, String> {
    nlp::send_nlp(&request)
}

#[tauri::command]
fn nlp_fetch_url(url: String) -> Result<String, String> {
    nlp::fetch_url_content(&url)
}

// ── Code Generation Commands ─────────────────────────────────────────────────

#[tauri::command]
fn generate_code(request: CreationRequest) -> Result<CreationResult, String> {
    codegen::generate_code(&request)
}

#[tauri::command]
fn refine_file(request: RefinementRequest) -> Result<RefinementResult, String> {
    codegen::refine_file(&request)
}

// ── App entry ────────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            list_flows,
            load_flow,
            save_flow,
            delete_flow,
            run_flow,
            get_node_schemas,
            nlp_send,
            nlp_fetch_url,
            generate_code,
            refine_file,
            no_code::workflow_executor::execute_workflow,
            no_code::database::initialize_db,
            wasm_commands::wasm_greet,
            wasm_commands::wasm_fibonacci
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
