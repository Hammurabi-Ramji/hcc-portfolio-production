// src-tauri/src/main.rs

#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod executor;
mod database;
mod types;

use executor::WorkflowExecutor;
use database::Database;
use types::*;
use std::sync::{Arc, Mutex};
use tauri::State;

// Application state
pub struct AppState {
    db: Arc<Mutex<Database>>,
}

// ============================================================================
// WORKFLOW COMMANDS
// ============================================================================

/// Save a workflow to the database
#[tauri::command]
async fn save_workflow(
    workflow: WorkflowDefinition,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    db.save_workflow(&workflow)
        .map_err(|e| format!("Failed to save workflow: {}", e))?;
    
    Ok(workflow.id)
}

/// Load a workflow from the database
#[tauri::command]
async fn load_workflow(
    workflow_id: String,
    state: State<'_, AppState>,
) -> Result<WorkflowDefinition, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    db.load_workflow(&workflow_id)
        .map_err(|e| format!("Failed to load workflow: {}", e))
}

/// List all workflows
#[tauri::command]
async fn list_workflows(
    state: State<'_, AppState>,
) -> Result<Vec<WorkflowSummary>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    db.list_workflows()
        .map_err(|e| format!("Failed to list workflows: {}", e))
}

/// Execute a workflow with given input
#[tauri::command]
async fn execute_workflow(
    workflow_id: String,
    input_data: serde_json::Value,
    state: State<'_, AppState>,
) -> Result<ExecutionResult, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    // Load workflow
    let workflow = db.load_workflow(&workflow_id)
        .map_err(|e| format!("Failed to load workflow: {}", e))?;
    
    drop(db); // Release lock before async operation
    
    // Execute workflow
    let executor = WorkflowExecutor::new(workflow.clone());
    let mut input = std::collections::HashMap::new();
    input.insert("value".to_string(), WorkflowValue::from(input_data));
    
    let result = executor.execute(input).await
        .map_err(|e| format!("Execution failed: {}", e))?;
    
    // Save execution to database
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.save_execution(&workflow_id, &result)
        .map_err(|e| format!("Failed to save execution: {}", e))?;
    
    Ok(result)
}

/// Get execution history for a workflow
#[tauri::command]
async fn get_executions(
    workflow_id: String,
    limit: i32,
    state: State<'_, AppState>,
) -> Result<Vec<ExecutionSummary>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    db.get_executions(&workflow_id, limit)
        .map_err(|e| format!("Failed to get executions: {}", e))
}

/// Get detailed execution log
#[tauri::command]
async fn get_execution_details(
    execution_id: String,
    state: State<'_, AppState>,
) -> Result<ExecutionDetails, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    db.get_execution_details(&execution_id)
        .map_err(|e| format!("Failed to get execution details: {}", e))
}

/// Delete a workflow
#[tauri::command]
async fn delete_workflow(
    workflow_id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    db.delete_workflow(&workflow_id)
        .map_err(|e| format!("Failed to delete workflow: {}", e))
}

/// Create a workflow from template
#[tauri::command]
async fn create_from_template(
    template_id: String,
    name: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    db.create_from_template(&template_id, &name)
        .map_err(|e| format!("Failed to create from template: {}", e))
}

/// Get all templates
#[tauri::command]
async fn get_templates(
    state: State<'_, AppState>,
) -> Result<Vec<WorkflowTemplate>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    db.get_templates()
        .map_err(|e| format!("Failed to get templates: {}", e))
}

/// Get database statistics
#[tauri::command]
async fn get_statistics(
    state: State<'_, AppState>,
) -> Result<DatabaseStatistics, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    db.get_statistics()
        .map_err(|e| format!("Failed to get statistics: {}", e))
}

/// Export workflow as JSON
#[tauri::command]
async fn export_workflow(
    workflow_id: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let workflow = db.load_workflow(&workflow_id)
        .map_err(|e| format!("Failed to load workflow: {}", e))?;
    
    serde_json::to_string_pretty(&workflow)
        .map_err(|e| format!("Failed to serialize: {}", e))
}

/// Import workflow from JSON
#[tauri::command]
async fn import_workflow(
    json_data: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let workflow: WorkflowDefinition = serde_json::from_str(&json_data)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;
    
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.save_workflow(&workflow)
        .map_err(|e| format!("Failed to save workflow: {}", e))
}

// ============================================================================
// MAIN APPLICATION
// ============================================================================

fn main() {
    // Initialize database
    let db = match Database::new("workflows.db") {
        Ok(db) => db,
        Err(e) => {
            eprintln!("Failed to initialize database: {}", e);
            return;
        }
    };

    // Create app state
    let app_state = AppState {
        db: Arc::new(Mutex::new(db)),
    };

    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            save_workflow,
            load_workflow,
            list_workflows,
            execute_workflow,
            get_executions,
            get_execution_details,
            delete_workflow,
            create_from_template,
            get_templates,
            get_statistics,
            export_workflow,
            import_workflow,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
