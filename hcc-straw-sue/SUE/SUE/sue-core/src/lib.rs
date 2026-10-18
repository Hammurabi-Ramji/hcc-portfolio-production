//! HCC Sidebar Core — Types, Errors, and Browser Extension APIs
//!
//! Enhanced with:
//! - Agentic-Agent coordination
//! - Inter-Tab communication
//! - Extension to Page integration
//! - Session-based authentication

use wasm_bindgen::prelude::*;
use web_sys::{ window, Element };
use serde::{ Deserialize, Serialize };
use thiserror::Error;
use chrono::Utc;

fn new_id(prefix: &str) -> String {
  let ts = Utc::now().timestamp_millis();
  let random = (js_sys::Math::random() * 1_000_000_000.0).floor() as u64;
  format!("{}-{}-{}", prefix, ts, random)
}

fn serialize_to_js_value<T: Serialize>(value: &T) -> Result<JsValue, ExtensionError> {
  let json = serde_json::to_string(value).map_err(|e| ExtensionError::Serialize(e.to_string()))?;
  js_sys::JSON
    ::parse(&json)
    .map_err(|_| ExtensionError::Serialize("Failed to convert payload to JsValue".into()))
}

// ──────────────────────────────────────────────────────────────
// SHARED TYPES — SAME STRUCTURES AS WEB/DESKTOP
// ──────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryObject {
  pub id: String,
  pub url: String,
  pub title: String,
  pub content_text: Option<String>,
  pub content_images: Vec<String>,
  pub content_videos: Vec<String>,
  pub captured_at: i64,
  pub tags: Vec<String>,
  pub metadata: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pattern {
  pub id: String,
  pub pattern_type: String, // e.g., "face", "voice", "environment"
  pub data: serde_json::Value,
  pub created_at: i64,
  pub associated_memories: Vec<String>, // IDs of MemoryObjects
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RamemoryExperience {
  pub id: String,
  pub title: String,
  pub description: String,
  pub base_memories: Vec<String>, // IDs of MemoryObjects
  pub generated_elements: serde_json::Value,
  pub created_at: i64,
  pub last_accessed: i64,
  pub experience_type: String, // e.g., "3D", "VR", "AR"
}

// ──────────────────────────────────────────────────────────────
// RAMEMORY INTEGRATION
// ────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RamemoryConfig {
  pub enabled: bool,
  pub local_embedding_model: Option<String>,
  pub default_experience_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RamemoryManager {
  pub config: RamemoryConfig,
  pub memory_objects: Vec<MemoryObject>,
  pub patterns: Vec<Pattern>,
  pub experiences: Vec<RamemoryExperience>,
}

// ──────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
  pub id: i64,
  pub name: String,
  pub schema_yaml: String,
  pub created_at: i64,
  pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiMessage {
  pub role: String, // "user", "assistant", "system"
  pub content: String,
  pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AiTier {
  Local,
  Premium,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatRequest {
  pub messages: Vec<AiMessage>,
  pub tier: AiTier,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloudStorageStatus {
  pub koofr_connected: bool,
  pub ice_drive_mounted: bool,
  pub degoo_archived: bool,
}

// ──────────────────────────────────────────────────────────────
// AGENTIC-AGENT COORDINATION
// ──────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentTask {
  pub id: String,
  pub task_type: String, // "analyze", "summarize", "extract", "chat"
  pub content: String,
  pub priority: u32,
  pub created_at: i64,
  pub status: TaskStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TaskStatus {
  Pending,
  Running,
  Completed,
  Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentCoordination {
  pub active_agents: Vec<String>,
  pub current_tasks: Vec<AgentTask>,
  pub context: AgentContext,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentContext {
  pub page_url: String,
  pub page_title: String,
  pub selected_text: Option<String>,
  pub session_id: String,
}

// ──────────────────────────────────────────────────────────────
// INTER-TAB COMMUNICATION
// ──────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabMessage {
  pub source: String, // "sidebar", "background", "content"
  pub target: String,
  pub message_type: String,
  pub payload: serde_json::Value,
  pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabSession {
  pub session_id: String,
  pub tabs: Vec<TabInfo>,
  pub created_at: i64,
  pub last_active: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabInfo {
  pub tab_id: i64,
  pub url: String,
  pub title: String,
  pub is_active: bool,
}

// ──────────────────────────────────────────────────────────────
// EXTENSION TO PAGE INTEGRATION
// ──────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageIntegrationConfig {
  pub inject_sidebar: bool,
  pub enable_selector: bool,
  pub highlight_mode: bool,
  pub css_injection: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageContext {
  pub url: String,
  pub title: String,
  pub domain: String,
  pub path: String,
  pub selected_text: Option<String>,
  pub selection_range: Option<SelectionRange>,
  pub page_elements: Vec<ElementInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelectionRange {
  pub start_offset: usize,
  pub end_offset: usize,
  pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ElementInfo {
  pub tag_name: String,
  pub id: Option<String>,
  pub class_name: Option<String>,
  pub role: Option<String>,
  pub accessible_name: Option<String>,
}

// ──────────────────────────────────────────────────────────────
// SESSION-BASED AUTHENTICATION
// ──────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
  pub session_id: String,
  pub user_id: Option<i64>,
  pub username: Option<String>,
  pub token: String,
  pub expires_at: i64,
  pub created_at: i64,
  pub last_activity: i64,
  pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthCredentials {
  pub username: String,
  pub password: String,
  pub remember_me: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthResponse {
  pub success: bool,
  pub session: Option<Session>,
  pub token: Option<String>,
  pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionManager {
  pub active_sessions: Vec<Session>,
  pub current_session: Option<Session>,
  pub storage_key: String,
}

// ──────────────────────────────────────────────────────────────
// BROWSER EXTENSION STORAGE API
// ──────────────────────────────────────────────────────────────

/// Extension storage wrapper — uses chrome.storage.local or localStorage
pub struct ExtensionStorage;

impl ExtensionStorage {
  pub async fn get<T: for<'de> Deserialize<'de>>(key: &str) -> Result<Option<T>, ExtensionError> {
    // Check if we're in a browser extension context
    let win = window().ok_or(ExtensionError::NoWindow)?;
    let local = win
      .local_storage()
      .map_err(|_| ExtensionError::StorageAccess)?
      .ok_or(ExtensionError::StorageAccess)?;

    let value = local.get_item(key).map_err(|_| ExtensionError::StorageAccess)?;

    match value {
      Some(json_str) => {
        let data: T = serde_json
          ::from_str(&json_str)
          .map_err(|e| ExtensionError::Parse(e.to_string()))?;
        Ok(Some(data))
      }
      None => Ok(None),
    }
  }

  pub async fn set<T: Serialize>(key: &str, value: &T) -> Result<(), ExtensionError> {
    let json_str = serde_json
      ::to_string(value)
      .map_err(|e| ExtensionError::Serialize(e.to_string()))?;

    let win = window().ok_or(ExtensionError::NoWindow)?;
    let local = win
      .local_storage()
      .map_err(|_| ExtensionError::StorageAccess)?
      .ok_or(ExtensionError::StorageAccess)?;

    local.set_item(key, &json_str).map_err(|_| ExtensionError::StorageAccess)?;

    Ok(())
  }

  /// Load vault key from extension storage
  pub async fn load_vault_key() -> Result<Vec<u8>, ExtensionError> {
    if let Some(key_data) = Self::get::<String>("vault_key").await? {
      hex::decode(&key_data).map_err(|_| ExtensionError::KeyCorruption)
    } else {
      Err(ExtensionError::KeyNotFound)
    }
  }

  /// Save vault key to extension storage
  pub async fn save_vault_key(key: &[u8]) -> Result<(), ExtensionError> {
    let hex_key = hex::encode(key);
    Self::set("vault_key", &hex_key).await
  }
}

// ──────────────────────────────────────────────────────────────
// AGENTIC-AGENT COORDINATION
// ──────────────────────────────────────────────────────────────

impl RamemoryManager {
  pub async fn capture_memory(page_context: PageContext) -> Result<MemoryObject, ExtensionError> {
    let memory_object = MemoryObject {
      id: new_id("mem"),
      url: page_context.url.clone(),
      title: page_context.title.clone(),
      content_text: None, // This would be extracted by a content script
      content_images: vec![], // This would be extracted by a content script
      content_videos: vec![], // This would be extracted by a content script
      captured_at: Utc::now().timestamp(),
      tags: vec!["captured_page".to_string()],
      metadata: serde_json
        ::to_value(page_context)
        .map_err(|e| ExtensionError::Serialize(e.to_string()))?,
    };
    // Store the memory object (placeholder for actual storage logic)
    // Self::add_memory_object(&memory_object).await?;
    Ok(memory_object)
  }

  // Placeholder for actual storage logic
  // async fn add_memory_object(memory_object: &MemoryObject) -> Result<(), ExtensionError> {
  //     // Implement actual storage here, e.g., to IndexedDB or a vector DB
  //     Ok(())
  // }
}

pub struct AgentCoordinator;

impl AgentCoordinator {
  pub async fn create_task(
    task_type: &str,
    content: &str,
    priority: u32
  ) -> Result<AgentTask, ExtensionError> {
    let task = AgentTask {
      id: new_id("task"),
      task_type: task_type.to_string(),
      content: content.to_string(),
      priority,
      created_at: Utc::now().timestamp(),
      status: TaskStatus::Pending,
    };
    Ok(task)
  }

  pub async fn update_task_status(
    task_id: &str,
    new_status: TaskStatus
  ) -> Result<(), ExtensionError> {
    // Update task status in storage
    ExtensionStorage::set(&format!("task_{}", task_id), &new_status).await
  }

  pub async fn get_active_tasks() -> Result<Vec<AgentTask>, ExtensionError> {
    ExtensionStorage::get("active_tasks").await.map(|opt| opt.unwrap_or_default())
  }
}

// ──────────────────────────────────────────────────────────────
// INTER-TAB COMMUNICATION
// ──────────────────────────────────────────────────────────────

pub struct TabCommunicator;

impl TabCommunicator {
  pub async fn send_message(
    source: &str,
    target: &str,
    message_type: &str,
    payload: &serde_json::Value
  ) -> Result<(), ExtensionError> {
    let message = TabMessage {
      source: source.to_string(),
      target: target.to_string(),
      message_type: message_type.to_string(),
      payload: payload.clone(),
      timestamp: Utc::now().timestamp(),
    };

    ExtensionStorage::set("last_tab_message", &message).await?;

    let win = window().ok_or(ExtensionError::NoWindow)?;
    let payload = serialize_to_js_value(&message)?;
    let target_origin = win
      .location()
      .origin()
      .unwrap_or_else(|_| "*".to_string());

    win.post_message(&payload, &target_origin).map_err(|_| ExtensionError::DOMError)?;
    Ok(())
  }

  pub async fn create_tab_session(tabs: Vec<TabInfo>) -> Result<TabSession, ExtensionError> {
    let session = TabSession {
      session_id: new_id("tab-session"),
      tabs,
      created_at: Utc::now().timestamp(),
      last_active: Utc::now().timestamp(),
    };
    ExtensionStorage::set("current_tab_session", &session).await?;
    Ok(session)
  }
}

// ──────────────────────────────────────────────────────────────
// EXTENSION TO PAGE INTEGRATION
// ──────────────────────────────────────────────────────────────

pub struct PageIntegrator;

impl PageIntegrator {
  pub async fn get_page_context() -> Result<PageContext, ExtensionError> {
    let win = window().ok_or(ExtensionError::NoWindow)?;
    let doc = win.document().ok_or(ExtensionError::NoDocument)?;
    let url = win
      .location()
      .href()
      .map_err(|_| ExtensionError::Network("Cannot access URL".into()))?;

    let domain = url::Url
      ::parse(&url)
      .ok()
      .and_then(|u| u.domain().map(|d| d.to_string()))
      .unwrap_or_default();

    let path = url::Url
      ::parse(&url)
      .ok()
      .map(|u| u.path().to_string())
      .unwrap_or_default();

    Ok(PageContext {
      url,
      title: doc.title(),
      domain,
      path,
      selected_text: None, // Would extract selected text here
      selection_range: None,
      page_elements: vec![], // Would extract page elements here
    })
  }

  pub async fn inject_sidebar_into_page(target_id: &str) -> Result<(), ExtensionError> {
    // Inject sidebar into web page
    let win = window().ok_or(ExtensionError::NoWindow)?;
    let doc = win.document().ok_or(ExtensionError::NoDocument)?;

    if doc.get_element_by_id("hcc-page-integration").is_some() {
      return Ok(());
    }

    let target = doc
      .query_selector(target_id)
      .map_err(|_| ExtensionError::DOMError)?
      .or_else(|| doc.body().map(Element::from))
      .ok_or(ExtensionError::NoDocument)?;

    let container = doc.create_element("div").map_err(|_| ExtensionError::DOMError)?;

    container.set_id("hcc-page-integration");
    container.set_inner_html(
      "<div style=\"padding:12px;color:#eaeaea;font:14px sans-serif\">SUE ready</div>"
    );
    container
      .set_attribute(
        "style",
        "position: fixed; right: 0; top: 0; height: 100%; width: 400px; z-index: 9999;"
      )
      .map_err(|_| ExtensionError::DOMError)?;

    target.append_child(&container).map_err(|_| ExtensionError::DOMError)?;

    Ok(())
  }
}

// ──────────────────────────────────────────────────────────────
// SESSION-BASED AUTHENTICATION
// ──────────────────────────────────────────────────────────────

pub struct SessionAuth;

impl SessionAuth {
  pub async fn login(credentials: &AuthCredentials) -> Result<AuthResponse, ExtensionError> {
    // Make API call to HCC API for authentication
    let url = "http://localhost:8080/api/v1/auth/login";

    let response = reqwest::Client
      ::new()
      .post(url)
      .json(&credentials)
      .send().await
      .map_err(|e| ExtensionError::Network(e.to_string()))?;

    if response.status().is_success() {
      let session: Session = response
        .json().await
        .map_err(|e| ExtensionError::Parse(e.to_string()))?;

      // Store session
      Self::set_current_session(&session).await?;

      Ok(AuthResponse {
        success: true,
        session: Some(session),
        token: None,
        error: None,
      })
    } else {
      Ok(AuthResponse {
        success: false,
        session: None,
        token: None,
        error: Some("Login failed".into()),
      })
    }
  }

  pub async fn logout() -> Result<(), ExtensionError> {
    ExtensionStorage::set("current_session", &None::<Session>).await?;
    Ok(())
  }

  pub async fn get_current_session() -> Result<Option<Session>, ExtensionError> {
    ExtensionStorage::get("current_session").await
  }

  pub async fn set_current_session(session: &Session) -> Result<(), ExtensionError> {
    ExtensionStorage::set("current_session", session).await
  }

  pub async fn is_session_valid() -> Result<bool, ExtensionError> {
    if let Some(session) = Self::get_current_session().await? {
      let now = Utc::now().timestamp();
      Ok(session.expires_at > now && session.is_active)
    } else {
      Ok(false)
    }
  }

  pub async fn refresh_session() -> Result<bool, ExtensionError> {
    // Refresh session token
    if let Some(session) = Self::get_current_session().await? {
      let url = "http://localhost:8080/api/v1/auth/refresh";
      let response = reqwest::Client
        ::new()
        .post(url)
        .header("Authorization", format!("Bearer {}", session.token))
        .send().await
        .map_err(|e| ExtensionError::Network(e.to_string()))?;

      if response.status().is_success() {
        let new_session: Session = response
          .json().await
          .map_err(|e| ExtensionError::Parse(e.to_string()))?;
        Self::set_current_session(&new_session).await?;
        Ok(true)
      } else {
        Self::logout().await?;
        Ok(false)
      }
    } else {
      Ok(false)
    }
  }
}

// ──────────────────────────────────────────────────────────────
// BROWSER MESSAGE PASSING API
// ──────────────────────────────────────────────────────────────

/// Send a message to the content script or background script
pub async fn send_message<T: Serialize + 'static>(
  port: &str,
  message: &T
) -> Result<JsValue, ExtensionError> {
  let win = window().ok_or(ExtensionError::NoWindow)?;
  let payload = serde_json::json!({
    "port": port,
    "payload": message,
  });
  let js_payload = serialize_to_js_value(&payload)?;
  let target_origin = win
    .location()
    .origin()
    .unwrap_or_else(|_| "*".to_string());

  win.post_message(&js_payload, &target_origin).map_err(|_| ExtensionError::DOMError)?;
  Ok(js_payload)
}

// ──────────────────────────────────────────────────────────────
// SIDEBAR INJECTION API
// ──────────────────────────────────────────────────────────────

/// Inject the Leptos sidebar into a target element
pub async fn inject_sidebar(target_id: &str) -> Result<(), ExtensionError> {
  let win = window().ok_or(ExtensionError::NoWindow)?;
  let doc = win.document().ok_or(ExtensionError::NoDocument)?;

  // Find the target element (usually the main chat container)
  let target = doc
    .get_element_by_id(target_id)
    .ok_or_else(|| ExtensionError::TargetNotFound(target_id.to_string()))?;

  // Create sidebar container
  let sidebar = doc.create_element("div").map_err(|_| ExtensionError::DOMError)?;

  sidebar.set_id("sue-container");
  sidebar.set_attribute("class", "sue-container").map_err(|_| ExtensionError::DOMError)?;
  sidebar
    .set_attribute(
      "style",
      "position: fixed; right: 0; top: 0; height: 100%; width: 400px; z-index: 9999;"
    )
    .map_err(|_| ExtensionError::DOMError)?;

  // Insert sidebar before the target
  target.insert_before(&sidebar, None).map_err(|_| ExtensionError::DOMError)?;

  // Load the WASM bundle
  load_wasm_bundle(&sidebar).await?;

  Ok(())
}

async fn load_wasm_bundle(_container: &Element) -> Result<(), ExtensionError> {
  _container.set_attribute("data-sue-mounted", "true").map_err(|_| ExtensionError::DOMError)?;
  Ok(())
}

// ──────────────────────────────────────────────────────────────
// ERROR TYPES
// ──────────────────────────────────────────────────────────────

#[derive(Error, Debug)]
pub enum ExtensionError {
  #[error("No window object available")]
  NoWindow,

  #[error("No document object available")]
  NoDocument,

  #[error("Storage access denied or unavailable")]
  StorageAccess,

  #[error("Target element not found: {0}")] TargetNotFound(String),

  #[error("DOM operation failed")]
  DOMError,

  #[error("Port name unknown: {0}")] UnknownPort(String),

  #[error("Serialization error: {0}")] Serialize(String),

  #[error("Parse error: {0}")] Parse(String),

  #[error("Vault key not found in storage")]
  KeyNotFound,

  #[error("Vault key data is corrupted")]
  KeyCorruption,

  #[error("Network error: {0}")] Network(String),

  #[error("API error: {0}")] Api(String),
}

// ──────────────────────────────────────────────────────────────
// INITIALIZATION
// ──────────────────────────────────────────────────────────────

/// Initialize the sidebar when the extension is loaded
#[wasm_bindgen(start)]
pub fn init() {
  console_error_panic_hook::set_once();

  // Set up logging in debug mode
  if cfg!(debug_assertions) {
    tracing::debug!("SUE Core debug mode enabled");
  }

  tracing::info!("SUE Core initialized");
}

/// Call this from the extension background script to activate the sidebar
#[wasm_bindgen]
pub fn activate_sidebar() -> String {
  format!(
    r#"
        // SUE activated
        // Inject into: #{{'{{target_id}}'}}
        // WASM bundle: sue-view.wasm
        "#
  )
}
