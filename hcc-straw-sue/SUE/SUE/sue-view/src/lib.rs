mod components;

use components::primitives::{
  Accordion,
  Badge,
  EmptyState,
  ProgressBar,
  SearchBar,
  Spinner,
  Toggle,
};
use components::memory_view::MemoryView;
use components::swarm_panel::SwarmPanel;
use components::learn_view::LearnView;
use components::header::{SueHeader, SueFooter};
use js_sys::Promise;
use leptos::prelude::*;
use serde::{ de::DeserializeOwned, Deserialize, Serialize };
use serde_json::{ json, Map, Value };
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::{ spawn_local, JsFuture };
use web_sys::RequestInit;

#[wasm_bindgen]
extern "C" {
  #[wasm_bindgen(js_namespace = globalThis, js_name = sueRequestJson, catch)]
  fn sue_request_json(message_json: &str) -> Result<Promise, JsValue>;
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Section {
  Dashboard,
  Ai,
  Projects,
  Notes,
  Tabs,
  Cloud,
  Memory,
  Settings,
  Login,
  Agents,
  Page,
  Swarm,
  Learn,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct Envelope<T> {
  success: bool,
  data: Option<T>,
  error: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct DashboardData {
  api: Option<ApiStatus>,
  audit: AuditData,
  cloud: Vec<CloudProvider>,
  ollama: OllamaStatus,
  session: Option<SessionInfo>,
  health: RuntimeHealth,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct AuditData {
  generated_at: String,
  project_count: usize,
  note_count: usize,
  active_session_count: usize,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct ApiStatus {
  api: String,
  version: String,
  generated_at: String,
  data_file: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct OllamaStatus {
  available: bool,
  status: String,
  models: usize,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct CloudProvider {
  id: String,
  name: String,
  login_url: String,
  integration_mode: String,
  capabilities: Vec<String>,
  limitations: Vec<String>,
  connected: bool,
  status: String,
  cookie_count: usize,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct SessionInfo {
  session_id: String,
  username: Option<String>,
  email: Option<String>,
  token: Option<String>,
  expires_at: i64,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Default)]
struct ApiSettings {
  #[serde(default)]
  venice_api_key: String,
  #[serde(default)]
  hf_token: String,
  #[serde(default)]
  hf_model: String,
  #[serde(default)]
  ollama_url: String,
  #[serde(default)]
  venice_model: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct OtpVerifyPayload {
  session: Option<SessionInfo>,
  api_settings: Option<ApiSettings>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct RuntimeHealth {
  overall_status: String,
  api: ServiceHealth,
  ollama: OllamaStatus,
  cloud: CloudHealth,
  session: SessionHealth,
  checked_at: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct ServiceHealth {
  available: bool,
  status: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct CloudHealth {
  connected_providers: usize,
  total_providers: usize,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct SessionHealth {
  active: bool,
  expires_at: Option<i64>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct ChatReply {
  content: String,
  model: String,
  #[serde(default)]
  memory_context_count: Option<usize>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct ChatMsg {
  role: String,
  content: String,
  #[serde(default)]
  model: Option<String>,
  #[serde(default)]
  memory_used: Option<usize>,
}

// SUEWARM agent result types
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct SuewarmTaskData {
  #[serde(rename = "type", default)]
  task_type: String,
  #[serde(rename = "taskId", default)]
  task_id: String,
  #[serde(default)]
  message: String,
  #[serde(default)]
  task: Option<Value>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct SuewarmRunPayload {
  #[serde(default)]
  success: bool,
  data: Option<SuewarmTaskData>,
  #[serde(default)]
  error: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct Project {
  id: String,
  name: String,
  description: String,
  status: String,
  tag: Option<String>,
  created_at: i64,
  updated_at: i64,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct Note {
  id: String,
  title: String,
  body: String,
  pinned: bool,
  created_at: i64,
  updated_at: i64,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct TabEntry {
  id: u32,
  title: String,
  url: String,
  active: bool,
  pinned: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct StoreValue {
  value: Option<Value>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct VectorCompactSnapshot {
  before: usize,
  after: usize,
  removed: usize,
  compacted_at: i64,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct VectorMemoryStats {
  total_count: usize,
  last_compact: Option<VectorCompactSnapshot>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Default)]
struct IntegrationSetup {
  ollama_url: String,
  ollama_api_key: String,
  embedding_model: String,
  venice_api_key: String,
  venice_mode: String,
  venice_model: String,
  hugging_face_token: String,
  hf_model: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Default)]
struct ValidateProviderResult {
  valid: bool,
  error: Option<String>,
  models: Option<Vec<String>>,
  username: Option<String>,
}

impl IntegrationSetup {
  fn ollama_configured(&self) -> bool {
    !self.ollama_url.trim().is_empty()
  }

  fn venice_configured(&self) -> bool {
    !self.venice_api_key.trim().is_empty()
  }

  fn hugging_face_configured(&self) -> bool {
    !self.hugging_face_token.trim().is_empty()
  }

  fn configured_count(&self) -> usize {
    [self.ollama_configured(), self.venice_configured(), self.hugging_face_configured()]
      .into_iter()
      .filter(|configured| *configured)
      .count()
  }

  fn minimum_ready(&self) -> bool {
    self.configured_count() >= 1
  }
}

#[derive(Clone)]
struct SectionButton {
  label: &'static str,
  section: Section,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Default)]
struct StoredSettings {
  compact_layout: bool,
  notifications: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct AgentTask {
  id: String,
  task_type: String,
  content: String,
  status: String,
  priority: u32,
  created_at: f64,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct AgentTasksPayload {
  tasks: Vec<AgentTask>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct AgentTaskPayload {
  task: AgentTask,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct SessionPayload {
  session: Option<SessionInfo>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct PageContextData {
  url: String,
  title: String,
  domain: String,
  #[serde(default)]
  path: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct PageContextPayload {
  context: PageContextData,
}

fn section_buttons() -> [SectionButton; 13] {
  [
    SectionButton { label: "⬡ Home", section: Section::Dashboard },
    SectionButton { label: "◈ AI", section: Section::Ai },
    SectionButton { label: "◧ Work", section: Section::Projects },
    SectionButton { label: "✎ Notes", section: Section::Notes },
    SectionButton { label: "⊞ Tabs", section: Section::Tabs },
    SectionButton { label: "◎ Cloud", section: Section::Cloud },
    SectionButton { label: "🧠 Mem", section: Section::Memory },
    SectionButton { label: "⚙ Set", section: Section::Settings },
    SectionButton { label: "🔐 Auth", section: Section::Login },
    SectionButton { label: "🤖 Tasks", section: Section::Agents },
    SectionButton { label: "◉ Page", section: Section::Page },
    SectionButton { label: "🐝 Swarm", section: Section::Swarm },
    SectionButton { label: "📖 Learn", section: Section::Learn },
  ]
}

#[component]
pub fn App() -> impl IntoView {
  let section = RwSignal::new(Section::Dashboard);
  let startup_health = RwSignal::new(None::<RuntimeHealth>);
  let stored_settings = load_settings();
  let compact_layout = RwSignal::new(stored_settings.compact_layout);
  let notifications = RwSignal::new(stored_settings.notifications);

  Effect::new(move |_| {
    save_settings(
      &(StoredSettings {
        compact_layout: compact_layout.get(),
        notifications: notifications.get(),
      })
    );
  });

  // Initial health fetch
  spawn_local(async move {
    if let Ok(health) = request_data::<RuntimeHealth>("STARTUP_HEALTH", Map::new()).await {
      startup_health.set(Some(health));
    }
  });

  // Poll health every 30 seconds to keep the status badge live
  {
    let hs = startup_health;
    let poll = Closure::wrap(Box::new(move || {
      let hs = hs;
      spawn_local(async move {
        if let Ok(health) = request_data::<RuntimeHealth>("STARTUP_HEALTH", Map::new()).await {
          hs.set(Some(health));
        }
      });
    }) as Box<dyn Fn()>);
    if let Some(window) = web_sys::window() {
      let _ = window.set_interval_with_callback_and_timeout_and_arguments_0(
        poll.as_ref().unchecked_ref(),
        30_000,
      );
    }
    poll.forget();
  }

  view! {
        <div
            class="sue"
            class:compact-layout=move || compact_layout.get()
            style="width: 400px; height: 100vh; display: flex; flex-direction: column; overflow: hidden;"
        >
            <SueHeader />

            <nav class="sue-nav">
                {section_buttons()
                    .into_iter()
                    .map(|button| {
                        let current = section;
                        view! {
                            <button
                                class="nav-button"
                                class:active=move || current.get() == button.section
                                on:click=move |_| section.set(button.section)
                            >
                                {button.label}
                            </button>
                        }
                    })
                    .collect::<Vec<_>>()}
            </nav>

            <main class="sue-content">
                {move || match section.get() {
                    Section::Dashboard => view! { <DashboardView /> }.into_any(),
                    Section::Ai => view! { <AIChatView /> }.into_any(),
                    Section::Projects => view! { <ProjectsView /> }.into_any(),
                    Section::Notes => view! { <NotesView /> }.into_any(),
                    Section::Tabs => view! { <TabsView /> }.into_any(),
                    Section::Cloud => view! { <CloudView /> }.into_any(),
                    Section::Memory => view! { <MemoryView /> }.into_any(),
                    Section::Settings => view! { <SettingsView compact_layout notifications /> }.into_any(),
                    Section::Login => view! { <LoginView /> }.into_any(),
                    Section::Agents => view! { <AgentView /> }.into_any(),
                    Section::Page => view! { <PageView /> }.into_any(),
                    Section::Swarm => view! { <SwarmPanel /> }.into_any(),
                    Section::Learn => view! { <LearnView /> }.into_any(),
                }}
            </main>

            <SueFooter />
        </div>
    }
}

#[component]
fn DashboardSetupWizard() -> impl IntoView {
  let setup = RwSignal::new(IntegrationSetup::default());
  let loading = RwSignal::new(true);
  let error = RwSignal::new(None::<String>);
  let save_feedback = RwSignal::new(None::<String>);
  let validation_feedback = RwSignal::new(None::<String>);
  let saving = RwSignal::new(false);
  let validating = RwSignal::new(false);

  let ollama_input = RwSignal::new(String::new());
  let ollama_auto_detected = RwSignal::new(false);
  let ollama_api_key_input = RwSignal::new(String::new());
  let embedding_model_input = RwSignal::new(String::new());
  let venice_mode_input = RwSignal::new("api".to_string());
  let venice_key_input = RwSignal::new(String::new());
  let venice_model_input = RwSignal::new("llama-3.3-70b".to_string());
  let hugging_face_input = RwSignal::new(String::new());
  let hf_model_input = RwSignal::new("mistralai/Mistral-7B-Instruct-v0.3".to_string());

  let load_setup = move || {
    loading.set(true);
    error.set(None);
    save_feedback.set(None);
    validation_feedback.set(None);
    spawn_local(async move {
      match load_integration_setup().await {
        Ok(data) => {
          ollama_input.set(data.ollama_url.clone());
          // Auto-detect Ollama if the user hasn't configured a URL yet
          if data.ollama_url.trim().is_empty() {
            if let Ok(true) = validate_ollama_reachability("http://localhost:11434", "").await {
              ollama_input.set("http://localhost:11434".to_string());
              ollama_auto_detected.set(true);
            }
          }
          ollama_api_key_input.set(data.ollama_api_key.clone());
          embedding_model_input.set(data.embedding_model.clone());
          venice_mode_input.set(
            if data.venice_mode.is_empty() {
              "api".into()
            } else {
              data.venice_mode.clone()
            }
          );
          venice_key_input.set(data.venice_api_key.clone());
          if !data.venice_model.is_empty() {
            venice_model_input.set(data.venice_model.clone());
          }
          hugging_face_input.set(data.hugging_face_token.clone());
          if !data.hf_model.is_empty() {
            hf_model_input.set(data.hf_model.clone());
          }
          setup.set(data);
        }
        Err(message) => error.set(Some(message)),
      }
      loading.set(false);
    });
  };

  let save_setup = move |_| {
    let mode = match venice_mode_input.get().as_str() {
      "x402" => "x402".to_string(),
      _ => "api".to_string(),
    };
    let next_setup = IntegrationSetup {
      ollama_url: ollama_input.get().trim().to_string(),
      ollama_api_key: ollama_api_key_input.get().trim().to_string(),
      embedding_model: embedding_model_input.get().trim().to_string(),
      venice_mode: mode,
      venice_api_key: venice_key_input.get().trim().to_string(),
      venice_model: venice_model_input.get().trim().to_string(),
      hugging_face_token: hugging_face_input.get().trim().to_string(),
      hf_model: hf_model_input.get().trim().to_string(),
    };

    saving.set(true);
    save_feedback.set(None);
    validation_feedback.set(None);
    error.set(None);

    spawn_local(async move {
      let result = (async {
        store_set_value("sue_setup_ollama_url", json!(next_setup.ollama_url)).await?;
        store_set_value("sue_setup_ollama_api_key", json!(next_setup.ollama_api_key)).await?;
        store_set_value("sue_setup_embedding_model", json!(next_setup.embedding_model)).await?;
        store_set_value("sue_setup_venice_mode", json!(next_setup.venice_mode)).await?;
        store_set_value("sue_setup_venice_api_key", json!(next_setup.venice_api_key)).await?;
        store_set_value("sue_setup_venice_model", json!(next_setup.venice_model)).await?;
        store_set_value(
          "sue_setup_hugging_face_token",
          json!(next_setup.hugging_face_token)
        ).await?;
        store_set_value("sue_setup_hf_model", json!(next_setup.hf_model)).await?;
        Ok::<(), String>(())
      }).await;

      match result {
        Ok(_) => {
          setup.set(next_setup.clone());
          save_feedback.set(
            Some(
              if next_setup.minimum_ready() {
                format!("Saved. {} integration(s) configured.", next_setup.configured_count())
              } else {
                "Saved. Configure at least one integration to enable AI workflows.".into()
              }
            )
          );
        }
        Err(message) => error.set(Some(message)),
      }

      saving.set(false);
    });
  };

  let validate_setup = move |_| {
    let ollama_url = ollama_input.get().trim().to_string();
    let ollama_api_key = ollama_api_key_input.get().trim().to_string();
    let venice_mode = match venice_mode_input.get().as_str() {
      "x402" => "x402".to_string(),
      _ => "api".to_string(),
    };
    let venice_key = venice_key_input.get().trim().to_string();
    let hugging_face_token = hugging_face_input.get().trim().to_string();

    validating.set(true);
    error.set(None);
    validation_feedback.set(None);

    spawn_local(async move {
      let mut results = Vec::<String>::new();

      // Ollama — direct fetch from WASM
      let ollama_result = validate_ollama_reachability(&ollama_url, &ollama_api_key).await;
      results.push(match ollama_result {
        Ok(true) => format!("✅ Ollama reachable at {}", ollama_url),
        Ok(false) => format!("❌ Ollama not reachable at {}", ollama_url),
        Err(message) => format!("❌ Ollama error: {}", message),
      });

      // Venice — live API test via background service worker
      if venice_key.is_empty() {
        results.push(format!("⚠️ Venice ({}) key not entered", venice_mode));
      } else {
        match request_data::<ValidateProviderResult>(
          "VALIDATE_PROVIDER",
          message_fields([("provider", json!("venice")), ("key", json!(venice_key.clone()))])
        ).await {
          Ok(r) if r.valid => {
            let model_list = r.models
              .as_ref()
              .map(|m| m.join(", "))
              .unwrap_or_default();
            results.push(format!("✅ Venice ({}) authenticated — models: {}", venice_mode, model_list));
          }
          Ok(r) => results.push(format!(
            "❌ Venice ({}) rejected: {}",
            venice_mode,
            r.error.unwrap_or_else(|| "unknown error".into())
          )),
          Err(message) => results.push(format!("❌ Venice test failed: {}", message)),
        }
      }

      // Hugging Face — live whoami test via background service worker
      if hugging_face_token.is_empty() {
        results.push("⚠️ Hugging Face token not entered".to_string());
      } else {
        match request_data::<ValidateProviderResult>(
          "VALIDATE_PROVIDER",
          message_fields([
            ("provider", json!("huggingface")),
            ("key", json!(hugging_face_token.clone()))
          ])
        ).await {
          Ok(r) if r.valid => {
            let user = r.username.clone().unwrap_or_default();
            let suffix = if user.is_empty() {
              String::new()
            } else {
              format!(" as @{}", user)
            };
            results.push(format!("✅ Hugging Face authenticated{}", suffix));
          }
          Ok(r) => results.push(format!(
            "❌ Hugging Face rejected: {}",
            r.error.unwrap_or_else(|| "unknown error".into())
          )),
          Err(message) => results.push(format!("❌ Hugging Face test failed: {}", message)),
        }
      }

      validation_feedback.set(Some(results.join("\n")));
      validating.set(false);
    });
  };

  load_setup();

  view! {
    <div class="health-card onboarding-card" style="margin-bottom: 12px;">
      <div class="view-header" style="padding: 0; margin-bottom: 8px;">
        <h4>"AI Integration Setup"</h4>
        <button class="btn-ghost" on:click=move |_| load_setup()>"Reload setup"</button>
      </div>
      <p class="description">
        "Set up at least one provider to unlock AI actions. You can configure all three: Ollama Local, Venice (API or x402), and Hugging Face."
      </p>

      {move || {
        let configured = setup.get().configured_count();
        let label = if configured == 0 {
          "Not configured"
        } else if configured == 1 {
          "Minimum ready"
        } else {
          "Fully configured"
        };
        view! {
          <div class="cloud-capabilities" style="margin: 10px 0;">
            <span class="cloud-chip">{format!("Configured: {}/3", configured)}</span>
            <span class="cloud-chip">{label}</span>
          </div>
        }
      }}

      {move || if loading.get() {
        view! { <div class="loading-view" style="min-height: 80px;"><Spinner size="sm".into() /></div> }.into_any()
      } else {
        view! {
          <div class="inline-form-card" style="margin-bottom: 0;">
            <label class="description">"Ollama Local API URL"</label>
            <input
              class="search-input inline-input"
              prop:value=move || ollama_input.get()
              on:input=move |ev| {
                ollama_auto_detected.set(false);
                ollama_input.set(event_target_value(&ev));
              }
              placeholder="http://localhost:11434"
            />
            {move || ollama_auto_detected.get().then(|| view! {
              <span style="color: #22c55e; font-size: 11px; margin-top: 4px; display: block;">
                "⚡ Ollama detected and filled in automatically"
              </span>
            })}

            <label class="description" style="margin-top: 10px; display: block;">"Ollama API key (optional)"</label>
            <input
              class="search-input inline-input"
              prop:value=move || ollama_api_key_input.get()
              on:input=move |ev| ollama_api_key_input.set(event_target_value(&ev))
              type="password"
              placeholder="Enter Ollama key if your endpoint requires auth"
            />

            <label class="description" style="margin-top: 10px; display: block;">"Embedding model"</label>
            <input
              class="search-input inline-input"
              prop:value=move || embedding_model_input.get()
              on:input=move |ev| embedding_model_input.set(event_target_value(&ev))
              placeholder="nomic-embed-text"
            />

            <div class="inline-form-grid" style="margin-top: 10px;">
              <div>
                <label class="description">"Venice mode"</label>
                <select
                  class="search-input inline-input"
                  prop:value=move || venice_mode_input.get()
                  on:change=move |ev| venice_mode_input.set(event_target_value(&ev))
                >
                  <option value="api">"API Key"</option>
                  <option value="x402">"x402"</option>
                </select>
              </div>
              <div>
                <label class="description">"Venice credential"</label>
                <input
                  class="search-input inline-input"
                  prop:value=move || venice_key_input.get()
                  on:input=move |ev| venice_key_input.set(event_target_value(&ev))
                  type="password"
                  placeholder="Enter Venice API key or x402 token"
                />
              </div>
            </div>

            <label class="description" style="margin-top: 10px; display: block;">"Venice model"</label>
            <select
              class="search-input inline-input"
              prop:value=move || venice_model_input.get()
              on:change=move |ev| venice_model_input.set(event_target_value(&ev))
            >
              <optgroup label="Llama (Meta)">
                <option value="llama-3.3-70b">"Llama 3.3 70B ★ Default"</option>
                <option value="llama-3.1-405b">"Llama 3.1 405B"</option>
                <option value="llama-3.1-70b">"Llama 3.1 70B"</option>
                <option value="llama-3.1-8b">"Llama 3.1 8B"</option>
                <option value="llama-3.2-3b">"Llama 3.2 3B"</option>
                <option value="llama-3.2-90b-vision">"Llama 3.2 90B Vision ★"</option>
              </optgroup>
              <optgroup label="Mistral">
                <option value="mistral-31-24b">"Mistral 3.1 24B"</option>
                <option value="mistral-7b-v0.3">"Mistral 7B v0.3"</option>
              </optgroup>
              <optgroup label="DeepSeek">
                <option value="deepseek-r1-671b">"DeepSeek R1 671B (Thinking)"</option>
                <option value="deepseek-r1-distill-llama-70b">"DeepSeek R1 Distill Llama 70B"</option>
                <option value="deepseek-r1-distill-qwen-32b">"DeepSeek R1 Distill Qwen 32B"</option>
              </optgroup>
              <optgroup label="Qwen (Alibaba)">
                <option value="qwen-2.5-vl-72b">"Qwen 2.5 VL 72B Vision ★"</option>
                <option value="qwen-2.5-72b">"Qwen 2.5 72B"</option>
              </optgroup>
              <optgroup label="Google">
                <option value="gemma-3-27b">"Gemma 3 27B"</option>
                <option value="gemma-3-12b">"Gemma 3 12B"</option>
              </optgroup>
              <optgroup label="Microsoft">
                <option value="phi-4">"Phi-4 14B"</option>
              </optgroup>
              <optgroup label="NousResearch / Community">
                <option value="nous-hermes-3-llama-3.1-70b">"Nous Hermes 3 70B"</option>
                <option value="dolphin-2.9.2-qwen2-72b">"Dolphin 2.9 Qwen2 72B"</option>
              </optgroup>
            </select>

            <label class="description" style="margin-top: 10px; display: block;">"Hugging Face token"</label>
            <input
              class="search-input inline-input"
              prop:value=move || hugging_face_input.get()
              on:input=move |ev| hugging_face_input.set(event_target_value(&ev))
              type="password"
              placeholder="hf_..."
            />

            <label class="description" style="margin-top: 8px; display: block;">"Hugging Face model (for chat)"</label>
            <select
              class="search-input inline-input"
              prop:value=move || hf_model_input.get()
              on:change=move |ev| hf_model_input.set(event_target_value(&ev))
            >
              <optgroup label="Mistral AI">
                <option value="mistralai/Mistral-7B-Instruct-v0.3">"Mistral 7B Instruct v0.3 ★ Default"</option>
                <option value="mistralai/Mistral-Nemo-Instruct-2407">"Mistral Nemo 12B"</option>
                <option value="mistralai/Mixtral-8x7B-Instruct-v0.1">"Mixtral 8×7B Instruct"</option>
                <option value="mistralai/Mixtral-8x22B-Instruct-v0.1">"Mixtral 8×22B Instruct"</option>
                <option value="mistralai/Mistral-Small-3.1-24B-Instruct-2503">"Mistral Small 3.1 24B"</option>
              </optgroup>
              <optgroup label="Meta Llama">
                <option value="meta-llama/Llama-3.2-3B-Instruct">"Llama 3.2 3B Instruct"</option>
                <option value="meta-llama/Llama-3.1-8B-Instruct">"Llama 3.1 8B Instruct"</option>
                <option value="meta-llama/Llama-3.2-11B-Vision-Instruct">"Llama 3.2 11B Vision ★"</option>
                <option value="meta-llama/Llama-3.1-70B-Instruct">"Llama 3.1 70B Instruct"</option>
                <option value="meta-llama/Llama-3.3-70B-Instruct">"Llama 3.3 70B Instruct"</option>
                <option value="meta-llama/Llama-3.2-90B-Vision-Instruct">"Llama 3.2 90B Vision ★"</option>
              </optgroup>
              <optgroup label="Qwen (Alibaba)">
                <option value="Qwen/Qwen2.5-7B-Instruct">"Qwen 2.5 7B Instruct"</option>
                <option value="Qwen/Qwen2.5-72B-Instruct">"Qwen 2.5 72B Instruct"</option>
                <option value="Qwen/Qwen2.5-Coder-32B-Instruct">"Qwen 2.5 Coder 32B"</option>
                <option value="Qwen/QwQ-32B">"QwQ 32B (Thinking)"</option>
              </optgroup>
              <optgroup label="Microsoft">
                <option value="microsoft/Phi-4">"Phi-4 14B"</option>
                <option value="microsoft/phi-3.5-mini-instruct">"Phi-3.5 Mini"</option>
                <option value="microsoft/Phi-3-medium-128k-instruct">"Phi-3 Medium 14B"</option>
              </optgroup>
              <optgroup label="Google">
                <option value="google/gemma-2-2b-it">"Gemma 2 2B"</option>
                <option value="google/gemma-2-9b-it">"Gemma 2 9B"</option>
                <option value="google/gemma-2-27b-it">"Gemma 2 27B"</option>
                <option value="google/gemma-3-12b-it">"Gemma 3 12B"</option>
              </optgroup>
              <optgroup label="DeepSeek">
                <option value="deepseek-ai/DeepSeek-R1-Distill-Qwen-7B">"DeepSeek R1 Distill 7B (Thinking)"</option>
                <option value="deepseek-ai/DeepSeek-R1-Distill-Llama-8B">"DeepSeek R1 Distill Llama 8B"</option>
                <option value="deepseek-ai/DeepSeek-R1-Distill-Qwen-32B">"DeepSeek R1 Distill 32B"</option>
                <option value="deepseek-ai/DeepSeek-Coder-V2-Instruct">"DeepSeek Coder V2"</option>
              </optgroup>
              <optgroup label="NousResearch / Community">
                <option value="NousResearch/Hermes-3-Llama-3.1-8B">"Hermes 3 Llama 3.1 8B"</option>
                <option value="HuggingFaceH4/zephyr-7b-beta">"Zephyr 7B Beta"</option>
                <option value="openchat/openchat-3.5-0106">"OpenChat 3.5"</option>
                <option value="tiiuae/falcon-7b-instruct">"Falcon 7B Instruct"</option>
              </optgroup>
            </select>

            <div class="inline-form-actions">
              <button class="btn-ghost" on:click=validate_setup prop:disabled=move || validating.get() || saving.get()>
                {move || if validating.get() { "Validating..." } else { "Validate connections" }}
              </button>
              <button class="btn-primary" on:click=save_setup prop:disabled=move || saving.get()>
                {move || if saving.get() { "Saving..." } else { "Save setup" }}
              </button>
            </div>
          </div>
        }.into_any()
      }}

      {move || error.get().map(|message| view! {
        <p class="form-error" style="margin-top: 10px;">{message}</p>
      })}

      {move || save_feedback.get().map(|message| view! {
        <p class="description" style="margin-top: 10px; color: var(--green);">{message}</p>
      })}

      {move || validation_feedback.get().map(|message| view! {
        <div class="description" style="margin-top: 10px; white-space: pre-line; line-height: 1.8;">
          {message}
        </div>
      })}
    </div>
  }
}

#[component]
fn DashboardView() -> impl IntoView {
  let data = RwSignal::new(None::<DashboardData>);
  let vector_stats = RwSignal::new(None::<VectorMemoryStats>);
  let compacting_memory = RwSignal::new(false);
  let memory_action_feedback = RwSignal::new(None::<String>);
  let capture_feedback = RwSignal::new(None::<(bool, String)>);
  let loading = RwSignal::new(true);
  let error = RwSignal::new(None::<String>);

  let refresh = move || {
    loading.set(true);
    error.set(None);
    memory_action_feedback.set(None);
    spawn_local(async move {
      match request_data::<DashboardData>("DASHBOARD_GET", Map::new()).await {
        Ok(payload) => data.set(Some(payload)),
        Err(message) => error.set(Some(message)),
      }

      if let Ok(stats) = request_data::<VectorMemoryStats>("MEMORY_VECTOR_STATS", Map::new()).await {
        vector_stats.set(Some(stats));
      }

      loading.set(false);
    });
  };

  refresh();

  view! {
        <section class="dashboard-view">
            <div class="view-header-banner">
                <div class="banner-image">
                    <img src="icons/sue_psa_banner.png" alt="SUE Banner" />
                </div>
                <div class="banner-overlay">
                    <h2>"Dashboard"</h2>
                    <button class="btn-ghost" on:click=move |_| refresh()>"Refresh"</button>
                </div>
            </div>

          <DashboardSetupWizard />

            {move || match (loading.get(), error.get(), data.get()) {
                (true, _, _) => view! { <div class="loading-view"><Spinner size="lg".into() /></div> }.into_any(),
                (_, Some(message), _) => view! {
                    <div class="empty-state">
                        <div class="empty-icon">"◌"</div>
                        <p class="empty-message">{format!("Dashboard unavailable: {}", message)}</p>
                        <p class="description">"Make sure the local API is running, then retry. Cloud status and local data will reconnect automatically."</p>
                        <button class="btn-ghost" on:click=move |_| refresh()>"Retry dashboard"</button>
                    </div>
                }.into_any(),
                (_, _, Some(payload)) => {
                    let connected_cloud = payload.cloud.iter().filter(|entry| entry.connected).count();
                    let api_status = payload.health.api.status.clone();
                    let api_color = if payload.health.api.available { "green" } else { "red" };
                    let ollama_color = if payload.ollama.available { "green" } else { "orange" };
                    let session_status = if payload.health.session.active { "Signed in" } else { "Guest" };
                    let capture_memory = move |_| {
                        capture_feedback.set(None);
                        spawn_local(async move {
                            match request_action("CAPTURE_PAGE", Map::new()).await {
                                Ok(()) => {
                                    capture_feedback.set(Some((true, "Page captured to RAMemory.".into())));
                                    if let Ok(stats) = request_data::<VectorMemoryStats>("MEMORY_VECTOR_STATS", Map::new()).await {
                                        vector_stats.set(Some(stats));
                                    }
                                }
                                Err(message) => capture_feedback.set(Some((false, format!("Capture failed: {}", message)))),
                            }
                        });
                    };
                    let compact_memory_now = move |_| {
                      compacting_memory.set(true);
                      memory_action_feedback.set(None);
                      spawn_local(async move {
                        let compact_result = request_action("MEMORY_VECTOR_COMPACT", Map::new()).await;
                        match compact_result {
                          Ok(_) => {
                            memory_action_feedback.set(Some("Memory compact completed.".to_string()));
                            if let Ok(stats) = request_data::<VectorMemoryStats>("MEMORY_VECTOR_STATS", Map::new()).await {
                              vector_stats.set(Some(stats));
                            }
                          }
                          Err(message) => {
                            memory_action_feedback.set(Some(format!("Compact failed: {}", message)));
                          }
                        }
                        compacting_memory.set(false);
                      });
                    };

                    view! {
                        <>
                            <div class="quick-stats">
                                <div class="stat-card">
                                    <h4>"Projects"</h4>
                                    <p class="value">{payload.audit.project_count}</p>
                                </div>
                                <div class="stat-card">
                                    <h4>"Notes"</h4>
                                    <p class="value">{payload.audit.note_count}</p>
                                </div>
                                <div class="stat-card">
                                    <h4>"Cloud"</h4>
                                    <p class="value">{connected_cloud}</p>
                                </div>
                            </div>

                            <div style="margin: 12px 0;">
                                <button class="btn-primary" style="width: 100%;" on:click=capture_memory>
                                    "Capture Current Page to RAMemory"
                                </button>
                                {move || capture_feedback.get().map(|(ok, msg)| view! {
                                    <p class="description" style=move || format!("margin-top:6px;color:var(--{});", if ok { "green" } else { "red" })>{msg}</p>
                                })}
                            </div>

                            <div class="health-card" style="margin-bottom: 12px;">
                              <h4>"Memory Health"</h4>
                              <p class="description">
                                {move || {
                                  if let Some(stats) = vector_stats.get() {
                                    format!("{} vector memory record(s) available.", stats.total_count)
                                  } else {
                                    "Vector memory stats unavailable yet.".to_string()
                                  }
                                }}
                              </p>
                              <p class="description">
                                {move || {
                                  if let Some(stats) = vector_stats.get() {
                                    if let Some(last) = stats.last_compact {
                                      format!(
                                        "Last compact removed {} record(s) ({} -> {}).",
                                        last.removed,
                                        last.before,
                                        last.after
                                      )
                                    } else {
                                      "No compact operation recorded yet.".to_string()
                                    }
                                  } else {
                                    "Refresh to load memory stats.".to_string()
                                  }
                                }}
                              </p>
                              <div class="inline-form-actions">
                                <button class="btn-ghost" on:click=compact_memory_now prop:disabled=move || compacting_memory.get()>
                                  {move || if compacting_memory.get() { "Compacting..." } else { "Compact now" }}
                                </button>
                              </div>
                              {move || memory_action_feedback.get().map(|message| view! {
                                <p class="description" style="margin-top: 8px; color: var(--green);">{message}</p>
                              })}
                            </div>

                            {((payload.audit.project_count == 0 && !payload.health.session.active) || !payload.health.api.available).then(|| view! {
                                <div class="health-card onboarding-card">
                                    <h4>"Start here"</h4>
                                    <p class="description">
                                        {if payload.health.api.available {
                                            "Create your first project, keep quick notes in the sidebar, and optionally sign in to a cloud provider for browser-session awareness.".to_string()
                                        } else {
                                            "The sidebar loaded, but the local API is offline. Start the API, refresh this dashboard, then continue with projects and notes.".to_string()
                                        }}
                                    </p>
                                    <div class="onboarding-steps">
                                        <span class="cloud-chip">"1. Keep the local API running"</span>
                                        <span class="cloud-chip">"2. Create a project in Work"</span>
                                        <span class="cloud-chip">"3. Save a note in Notes"</span>
                                        <span class="cloud-chip">"4. Open cloud login only if needed"</span>
                                    </div>
                                </div>
                            })}

                            <div class="health-grid">
                                <div class="health-card">
                                    <h4>"Local API"</h4>
                                    <Badge label=api_status color=api_color.into() />
                                    <p class="description">
                                        {payload.api.as_ref().map(|api| api.generated_at.clone()).unwrap_or_else(|| "Unavailable".into())}
                                    </p>
                                </div>
                                <div class="health-card">
                                    <h4>"Ollama"</h4>
                                    <Badge label=payload.ollama.status.clone() color=ollama_color.into() />
                                    <p class="description">{format!("{} model(s) visible", payload.ollama.models)}</p>
                                </div>
                                <div class="health-card">
                                    <h4>"Session"</h4>
                                    <Badge label=session_status.into() color=if payload.health.session.active { "blue".into() } else { "gray".into() } />
                                    <p class="description">
                                        {payload.session.as_ref().and_then(|session| session.username.clone()).unwrap_or_else(|| "No active local session".into())}
                                    </p>
                                </div>
                            </div>

                            <div class="usage-section">
                                <h3>"Cloud Sessions"</h3>
                                {payload.cloud
                                    .iter()
                                    .map(|provider| {
                                        let color = if provider.connected { "green" } else { "orange" };
                                        view! {
                                            <div class="usage-row">
                                                <span class="usage-label">{provider.name.clone()}</span>
                                                <ProgressBar
                                                    value=if provider.connected { 100.0 } else { 10.0 }
                                                    color=color.to_string()
                                                    show_label=true
                                                />
                                            </div>
                                        }
                                    })
                                    .collect::<Vec<_>>()}
                            </div>

                            <div class="timeline-section">
                                <h3>"Local Services"</h3>
                                <div class="timeline">
                                    <div class="timeline-item">
                                        <span class="timeline-dot green" />
                                        <div class="timeline-content">
                                            <span class="timeline-title">"Runtime health"</span>
                                            <span class="timeline-time">{payload.health.checked_at.clone()}</span>
                                        </div>
                                    </div>
                                    <div class="timeline-item">
                                        <span class="timeline-dot blue" />
                                        <div class="timeline-content">
                                            <span class="timeline-title">
                                                {if payload.ollama.available { "Ollama connected" } else { "Ollama unavailable" }}
                                            </span>
                                            <span class="timeline-time">{payload.ollama.status.clone()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    }
                    .into_any()
                }
                _ => view! { <EmptyState message="No dashboard data available.".into() /> }.into_any(),
            }}
        </section>
    }
}

#[component]
fn AIChatView() -> impl IntoView {
  let messages = RwSignal::new(vec![ChatMsg {
    role: "assistant".into(),
    content: "SUE is ready. Chat with your AI or switch to Agent mode to run multi-step ReAct tasks.".into(),
    model: None,
    memory_used: None,
  }]);
  let input = RwSignal::new(String::new());
  let loading = RwSignal::new(false);
  let error = RwSignal::new(None::<String>);
  let active_provider = RwSignal::new("AI".to_string());
  let agent_mode = RwSignal::new(false);
  let chat_ref = NodeRef::<leptos::html::Div>::new();

  // Resolve active provider from stored setup keys
  spawn_local(async move {
    let ollama_url = store_get_value("sue_setup_ollama_url").await
      .ok().flatten().and_then(|v| v.as_str().map(|s| s.to_string())).unwrap_or_default();
    let venice_key = store_get_value("sue_setup_venice_api_key").await
      .ok().flatten().and_then(|v| v.as_str().map(|s| s.to_string())).unwrap_or_default();
    let hf_token = store_get_value("sue_setup_hugging_face_token").await
      .ok().flatten().and_then(|v| v.as_str().map(|s| s.to_string())).unwrap_or_default();
    active_provider.set(if !ollama_url.trim().is_empty() { "Ollama" }
      else if !venice_key.trim().is_empty() { "Venice" }
      else if !hf_token.trim().is_empty() { "HuggingFace" }
      else { "Not configured" }.to_string());
  });

  // Auto-scroll on every new message
  Effect::new(move |_| {
    let _ = messages.get();
    if let Some(el) = chat_ref.get() {
      el.set_scroll_top(el.scroll_height());
    }
  });

  // Pick up context-menu triggered queries (Analyze/Summarize with SUE)
  spawn_local(async move {
    if let Ok(val) = request_data::<serde_json::Value>(
      "SESSION_STORE_GET",
      message_fields([("key", json!("sue_pending_chat"))]),
    ).await {
      let pending = val.get("value").and_then(|v| {
        let prompt = v.get("prompt")?.as_str()?.to_string();
        let ts = v.get("ts")?.as_i64()?;
        // Only act on queries less than 30 seconds old
        let age_ms = js_sys::Date::now() as i64 - ts;
        (age_ms < 30_000).then_some(prompt)
      });
      if let Some(prompt) = pending {
        // Clear the pending query so it doesn't re-fire on next open
        let _ = request_action(
          "SESSION_STORE_SET",
          message_fields([("key", json!("sue_pending_chat")), ("value", json!(null))]),
        ).await;
        // Auto-send the prompt as a user message
        let user_text = prompt.clone();
        messages.update(|items| items.push(ChatMsg {
          role: "user".into(),
          content: user_text.clone(),
          model: None,
          memory_used: None,
        }));
        loading.set(true);
        let history = messages.get_untracked();
        match request_data::<ChatReply>(
          "CHAT_SEND",
          message_fields([("messages", json!(history.iter().map(|m| json!({ "role": m.role, "content": m.content })).collect::<Vec<_>>()))])
        ).await {
          Ok(reply) => {
            messages.update(|items| items.push(ChatMsg {
              role: "assistant".into(),
              content: reply.content.clone(),
              model: Some(reply.model.clone()),
              memory_used: None,
            }));
          }
          Err(msg) => error.set(Some(msg)),
        }
        loading.set(false);
      }
    }
  });

  let send = move |ev: leptos::ev::SubmitEvent| {
    ev.prevent_default();
    let text = input.get();
    if text.trim().is_empty() || loading.get() { return; }

    let user_text = text.trim().to_string();
    messages.update(|items| items.push(ChatMsg {
      role: "user".into(),
      content: user_text.clone(),
      model: None,
      memory_used: None,
    }));
    input.set(String::new());
    loading.set(true);
    error.set(None);

    let is_agent = agent_mode.get();
    spawn_local(async move {
      if is_agent {
        // ── SUEWARM ReAct agent path ──────────────────────
        match request_data::<SuewarmRunPayload>(
          "SUEWARM_AGENT_RUN",
          message_fields([("payload", json!({ "intent": user_text }))])
        ).await {
          Ok(outer) => {
            let (content, action_count) = if outer.success {
              let inner = outer.data.as_ref();
              let msg = inner.map(|d| d.message.as_str()).unwrap_or("Agent task completed.");
              let actions = inner
                .and_then(|d| d.task.as_ref())
                .and_then(|t| t.get("actions"))
                .and_then(|a| a.as_array())
                .map(|a| a.len())
                .unwrap_or(0);
              (msg.to_string(), actions)
            } else {
              (outer.error.unwrap_or_else(|| "Agent task failed.".into()), 0)
            };
            let suffix = if action_count > 0 {
              format!(" ({} action(s) taken)", action_count)
            } else {
              String::new()
            };
            messages.update(|items| items.push(ChatMsg {
              role: "assistant".into(),
              content: format!("{}{}", content, suffix),
              model: Some("SUEWARM ReAct".into()),
              memory_used: None,
            }));
          }
          Err(msg) => {
            error.set(Some(msg.clone()));
            messages.update(|items| items.push(ChatMsg {
              role: "assistant".into(),
              content: format!("Agent error: {}", msg),
              model: Some("SUEWARM ReAct".into()),
              memory_used: None,
            }));
          }
        }
      } else {
        // ── Standard chat path ────────────────────────────
        let history = messages.get_untracked();
        match request_data::<ChatReply>(
          "CHAT_SEND",
          message_fields([("messages", json!(history))])
        ).await {
          Ok(reply) => messages.update(|items| items.push(ChatMsg {
            role: "assistant".into(),
            content: reply.content,
            model: Some(reply.model),
            memory_used: reply.memory_context_count,
          })),
          Err(msg) => {
            error.set(Some(msg.clone()));
            messages.update(|items| items.push(ChatMsg {
              role: "assistant".into(),
              content: format!("Unable to reach AI backend: {}", msg),
              model: None,
              memory_used: None,
            }));
          }
        }
      }
      loading.set(false);
    });
  };

  view! {
    <section class="ai-chat-view">
      <div class="view-header">
        <h2>"AI Chat"</h2>
        <div style="display:flex;align-items:center;gap:6px;">
          {move || view! { <Badge label=active_provider.get() color="purple".into() /> }}
          <button
            class="btn-ghost"
            style=move || format!(
              "font-size:11px;padding:3px 8px;{}",
              if agent_mode.get() { "color:var(--blue);border-color:var(--blue);" } else { "" }
            )
            on:click=move |_| agent_mode.update(|v| *v = !*v)
            title="Toggle ReAct agent mode"
          >
            {move || if agent_mode.get() { "🤖 Agent" } else { "💬 Chat" }}
          </button>
        </div>
      </div>

      {move || agent_mode.get().then(|| view! {
        <p class="description" style="margin-bottom:8px;color:var(--blue);font-size:11px;">
          "Agent mode: SUEWARM ReAct loop — plans and executes multi-step tasks autonomously."
        </p>
      })}

      {move || error.get().map(|msg| view! {
        <div class="empty-state" style="margin-bottom:12px;padding:8px 12px;">
          <p class="empty-message" style="font-size:12px;">{msg}</p>
          <button class="btn-ghost" on:click=move |_| error.set(None)>"Dismiss"</button>
        </div>
      })}

      <div class="chat-messages" node_ref=chat_ref>
        <For
          each=move || messages.get()
          key=|msg| format!("{}{}", msg.role, &msg.content[..msg.content.len().min(40)])
          children=|msg| {
            let is_user = msg.role == "user";
            let model_label = msg.model.clone();
            let mem_count = msg.memory_used;
            view! {
              <div class=if is_user { "message user" } else { "message assistant" }>
                <p class="message-content">{msg.content.clone()}</p>
                {model_label.map(|m| view! {
                  <span class="message-model">{format!("via {}", m)}</span>
                })}
                {mem_count.filter(|&n| n > 0).map(|n| view! {
                  <span class="message-memory-badge">
                    {format!("🧠 {} memor{} used as context", n, if n == 1 { "y" } else { "ies" })}
                  </span>
                })}
              </div>
            }
          }
        />
        {move || loading.get().then(|| view! {
          <div class="message assistant" style="opacity:0.6;">
            <Spinner size="sm".into() />
            <span style="margin-left:6px;font-size:12px;">
              {move || if agent_mode.get() { "Agent planning…" } else { "Thinking…" }}
            </span>
          </div>
        })}
      </div>

      <form class="chat-input" on:submit=send>
        <input
          type="text"
          placeholder=move || if agent_mode.get() { "Describe the task for the agent…" } else { "Ask SUE anything…" }
          prop:value=move || input.get()
          on:input=move |ev| input.set(event_target_value(&ev))
          prop:disabled=move || loading.get()
        />
        <button type="submit" prop:disabled=move || loading.get() || input.get().trim().is_empty()>
          {move || if loading.get() { "●●●" } else if agent_mode.get() { "Run" } else { "Send" }}
        </button>
      </form>
    </section>
  }
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct SessionValuePayload {
  value: Option<Value>,
}

#[component]
fn ProjectsView() -> impl IntoView {
  let projects = RwSignal::new(Vec::<Project>::new());
  let query = RwSignal::new(String::new());
  let composer_open = RwSignal::new(false);

  // Restore filter query from session storage (clears on browser close)
  spawn_local(async move {
    if let Ok(p) = request_data::<SessionValuePayload>(
      "SESSION_STORE_GET",
      message_fields([("key", json!("kanban_query"))])
    ).await {
      if let Some(Value::String(saved_q)) = p.value {
        if !saved_q.is_empty() {
          query.set(saved_q);
        }
      }
    }
  });

  // Persist query to session storage on every change
  Effect::new(move |_| {
    let q = query.get();
    spawn_local(async move {
      let _ = request_action(
        "SESSION_STORE_SET",
        message_fields([("key", json!("kanban_query")), ("value", json!(q))])
      ).await;
    });
  });
  let name_input = RwSignal::new(String::new());
  let description_input = RwSignal::new(String::new());
  let tag_input = RwSignal::new(String::new());
  let loading = RwSignal::new(true);
  let saving = RwSignal::new(false);
  let error = RwSignal::new(None::<String>);
  let create_error = RwSignal::new(None::<String>);

  let load_projects = move || {
    loading.set(true);
    error.set(None);
    spawn_local(async move {
      match request_data::<Vec<Project>>("PROJECT_LIST", Map::new()).await {
        Ok(data) => projects.set(data),
        Err(message) => error.set(Some(message)),
      }
      loading.set(false);
    });
  };

  let create_project = move |_| {
    composer_open.set(true);
    create_error.set(None);
  };

  let cancel_create = move |_| {
    composer_open.set(false);
    name_input.set(String::new());
    description_input.set(String::new());
    tag_input.set(String::new());
    create_error.set(None);
  };

  let submit_create = move |_| {
    let name = name_input.get().trim().to_string();
    if name.is_empty() {
      create_error.set(Some("Project name is required.".into()));
      return;
    }

    let description = description_input.get().trim().to_string();
    let raw_tag = tag_input.get().trim().to_string();
    let tag = (!raw_tag.is_empty()).then_some(raw_tag);

    saving.set(true);
    create_error.set(None);

    spawn_local(async move {
      let result = request_data::<Project>(
        "PROJECT_CREATE",
        message_fields([
          (
            "project",
            json!({
            "name": name,
            "description": description,
            "status": "todo",
            "tag": tag,
          }),
          ),
        ])
      ).await;

      match result {
        Ok(_) => {
          composer_open.set(false);
          name_input.set(String::new());
          description_input.set(String::new());
          tag_input.set(String::new());
          load_projects();
        }
        Err(message) => create_error.set(Some(message)),
      }

      saving.set(false);
    });
  };

  let update_status = move |project_id: String, status: &'static str| {
    spawn_local(async move {
      let _ = request_data::<Project>(
        "PROJECT_UPDATE",
        message_fields([
          ("projectId", json!(project_id)),
          ("project", json!({ "status": status })),
        ])
      ).await;
      load_projects();
    });
  };

  let delete_project = move |project_id: String| {
    spawn_local(async move {
      let _ = request_action(
        "PROJECT_DELETE",
        message_fields([("projectId", json!(project_id))])
      ).await;
      load_projects();
    });
  };

  load_projects();

  let columns = [
    ("todo", "To Do"),
    ("doing", "Doing"),
    ("done", "Done"),
  ];

  view! {
        <section class="projects-view">
            <div class="view-header">
          <h2>"Work Dashboard"</h2>
                <button class="btn-primary" on:click=create_project>"+ New"</button>
            </div>

            <SearchBar query=query />

        <div class="quick-stats" style="margin-top: 12px;">
          <div class="stat-card">
            <h4>"To Do"</h4>
            <p class="value">{move || projects.get().iter().filter(|project| project.status == "todo").count()}</p>
          </div>
          <div class="stat-card">
            <h4>"Doing"</h4>
            <p class="value">{move || projects.get().iter().filter(|project| project.status == "doing").count()}</p>
          </div>
          <div class="stat-card">
            <h4>"Done"</h4>
            <p class="value">{move || projects.get().iter().filter(|project| project.status == "done").count()}</p>
          </div>
        </div>

        <div class="health-card" style="margin: 12px 0;">
          <h4>"Work Throughput"</h4>
          <p class="description">
            {move || {
              let total = projects.get().len();
              let done = projects.get().iter().filter(|project| project.status == "done").count();
              if total == 0 {
                "No projects yet. Create your first work item to start tracking progress.".to_string()
              } else {
                format!("{} of {} projects are done.", done, total)
              }
            }}
          </p>
          {move || {
            let total = projects.get().len() as f32;
            let value = if total == 0.0 {
              0.0
            } else {
              let done = projects.get().iter().filter(|project| project.status == "done").count() as f32;
              (done / total) * 100.0
            };
            view! {
              <ProgressBar
                value=value
                color="blue".into()
                show_label=true
              />
            }
          }}
        </div>

            {move || composer_open.get().then(|| view! {
                <div class="inline-form-card">
                    <div class="inline-form-grid">
                        <input
                            class="search-input inline-input"
                            prop:value=move || name_input.get()
                            on:input=move |ev| name_input.set(event_target_value(&ev))
                            placeholder="Project name"
                        />
                        <input
                            class="search-input inline-input"
                            prop:value=move || tag_input.get()
                            on:input=move |ev| tag_input.set(event_target_value(&ev))
                            placeholder="Tag (optional)"
                        />
                    </div>
                    <textarea
                        class="note-textarea inline-textarea"
                        prop:value=move || description_input.get()
                        on:input=move |ev| description_input.set(event_target_value(&ev))
                        placeholder="What should this project capture?"
                    />
                    {move || create_error.get().map(|message| view! {
                        <p class="form-error">{message}</p>
                    })}
                    <div class="inline-form-actions">
                        <button class="btn-primary" on:click=submit_create prop:disabled=move || saving.get()>
                            {move || if saving.get() { "Saving…" } else { "Create project" }}
                        </button>
                        <button class="btn-ghost" on:click=cancel_create prop:disabled=move || saving.get()>"Cancel"</button>
                    </div>
                </div>
            })}

            {move || {
                if loading.get() {
                    view! { <div class="loading-view"><Spinner size="lg".into() /></div> }.into_any()
                } else if let Some(message) = error.get() {
                    view! {
                        <div class="empty-state">
                            <div class="empty-icon">"◌"</div>
                            <p class="empty-message">{format!("Projects unavailable: {}", message)}</p>
                            <button class="btn-ghost" on:click=move |_| load_projects()>"Retry projects"</button>
                        </div>
                    }.into_any()
                } else {
                    view! {
                        <div class="kanban">
                            {columns
                                .iter()
                                .map(|(status, label)| {
                                    let column_status = status.to_string();
                                    let filter_status = column_status.clone();
                                    let query_signal = query;
                                    let project_signal = projects;
                                    view! {
                                        <div class="kanban-col">
                                            <div class="kanban-col-header">
                                                <span>{label.to_string()}</span>
                                                <span class="badge badge-gray">
                                                    {move || {
                                                        project_signal
                                                            .get()
                                                            .iter()
                                                            .filter(|project| project.status == column_status)
                                                            .count()
                                                            .to_string()
                                                    }}
                                                </span>
                                            </div>
                                            <div class="kanban-cards">
                                                {move || {
                                                    let current_query = query_signal.get().to_lowercase();
                                                    let filtered_projects = project_signal
                                                         .get()
                                                         .into_iter()
                                                         .filter(|project| {
                                                             project.status == filter_status &&
                                                                 (current_query.is_empty() ||
                                                                     project.name.to_lowercase().contains(&current_query) ||
                                                                     project.description.to_lowercase().contains(&current_query))
                                                         })
                                                         .collect::<Vec<_>>();

                                                    if filtered_projects.is_empty() {
                                                        view! { <p class="column-empty">"No matching projects."</p> }.into_any()
                                                    } else {
                                                        view! {
                                                            <>
                                                                {filtered_projects
                                                                .into_iter()
                                                                .map(|project| {
                                                             let project_id_back = project.id.clone();
                                                             let project_id_forward = project.id.clone();
                                                             let project_id_delete = project.id.clone();
                                                            let project_status = project.status.clone();
                                                            let project_status_forward = project.status.clone();
                                                            view! {
                                                                <div class="kanban-card">
                                                                    <span class="kanban-name">{project.name.clone()}</span>
                                                                    {project.tag.clone().map(|tag| view! {
                                                                        <Badge label=tag color="blue".into() />
                                                                    })}
                                                                     <p class="note-preview">{project.description.clone()}</p>
                                                                     <div class="kanban-card-actions">
                                                                         {(project_status != "todo").then(|| view! {
                                                                             <button class="icon-btn" aria-label="Move project back" title="Move project back" on:click=move |_| {
                                                                                 let next = if project_status == "doing" { "todo" } else { "doing" };
                                                                                 update_status(project_id_back.clone(), next);
                                                                             }>
                                                                                "◀"
                                                                            </button>
                                                                         })}
                                                                         {(project_status_forward != "done").then(|| view! {
                                                                             <button class="icon-btn" aria-label="Move project forward" title="Move project forward" on:click=move |_| {
                                                                                 let next = if project_status_forward == "todo" { "doing" } else { "done" };
                                                                                 update_status(project_id_forward.clone(), next);
                                                                             }>
                                                                                "▶"
                                                                            </button>
                                                                         })}
                                                                         <button class="icon-btn danger" aria-label="Delete project" title="Delete project" on:click=move |_| delete_project(project_id_delete.clone())>
                                                                             "✕"
                                                                         </button>
                                                                     </div>
                                                                 </div>
                                                             }
                                                          })
                                                         .collect::<Vec<_>>() }
                                                            </>
                                                        }.into_any()
                                                    }
                                                 }}
                                            </div>
                                        </div>
                                    }
                                })
                                .collect::<Vec<_>>()}
                        </div>
                    }
                    .into_any()
                }
            }}
        </section>
    }
}

#[component]
fn NotesView() -> impl IntoView {
  let notes = RwSignal::new(Vec::<Note>::new());
  let query = RwSignal::new(String::new());
  let selected_id = RwSignal::new(None::<String>);
  let title_input = RwSignal::new(String::new());
  let body_input = RwSignal::new(String::new());
  let loading = RwSignal::new(true);
  let error = RwSignal::new(None::<String>);

  let load_notes = move || {
    loading.set(true);
    error.set(None);
    spawn_local(async move {
      match request_data::<Vec<Note>>("NOTE_LIST", Map::new()).await {
        Ok(data) => notes.set(data),
        Err(message) => error.set(Some(message)),
      }
      loading.set(false);
    });
  };

  let open_note = move |note: Note| {
    selected_id.set(Some(note.id));
    title_input.set(note.title);
    body_input.set(note.body);
  };

  let add_note = move |_| {
    spawn_local(async move {
      let created = request_data::<Note>(
        "NOTE_CREATE",
        message_fields([("note", json!({ "title": "New note", "body": "", "pinned": false }))])
      ).await;

      if let Ok(note) = created {
        open_note(note);
        load_notes();
      }
    });
  };

  let save_note = move |_| {
    if let Some(note_id) = selected_id.get() {
      let title = title_input.get();
      let body = body_input.get();
      spawn_local(async move {
        let _ = request_data::<Note>(
          "NOTE_UPDATE",
          message_fields([
            ("noteId", json!(note_id)),
            ("note", json!({ "title": title, "body": body })),
          ])
        ).await;
        load_notes();
      });
    }
  };

  let toggle_pin = move |note: Note| {
    spawn_local(async move {
      let _ = request_data::<Note>(
        "NOTE_UPDATE",
        message_fields([
          ("noteId", json!(note.id)),
          ("note", json!({ "pinned": !note.pinned })),
        ])
      ).await;
      load_notes();
    });
  };

  let delete_note = move |note_id: String| {
    spawn_local(async move {
      let _ = request_action(
        "NOTE_DELETE",
        message_fields([("noteId", json!(note_id.clone()))])
      ).await;
      if selected_id.get_untracked() == Some(note_id) {
        selected_id.set(None);
        title_input.set(String::new());
        body_input.set(String::new());
      }
      load_notes();
    });
  };

  load_notes();

  view! {
        <section class="notes-view">
            <div class="view-header">
          <h2>"Notes Dashboard"</h2>
                <button class="btn-primary" on:click=add_note>"+ Note"</button>
            </div>

            <SearchBar query=query />

        <div class="quick-stats" style="margin-top: 12px;">
          <div class="stat-card">
            <h4>"Total"</h4>
            <p class="value">{move || notes.get().len()}</p>
          </div>
          <div class="stat-card">
            <h4>"Pinned"</h4>
            <p class="value">{move || notes.get().iter().filter(|note| note.pinned).count()}</p>
          </div>
          <div class="stat-card">
            <h4>"Draft"</h4>
            <p class="value">{move || notes.get().iter().filter(|note| note.body.trim().is_empty()).count()}</p>
          </div>
        </div>

        <div class="health-card" style="margin: 12px 0;">
          <h4>"Notes Health"</h4>
          <p class="description">
            {move || {
              let total = notes.get().len();
              let pinned = notes.get().iter().filter(|note| note.pinned).count();
              if total == 0 {
                "No notes yet. Start a note to capture tasks, prompts, or decisions.".to_string()
              } else {
                format!("{} notes saved, {} pinned for quick access.", total, pinned)
              }
            }}
          </p>
        </div>

            {move || {
                if loading.get() {
                    view! { <div class="loading-view"><Spinner size="lg".into() /></div> }.into_any()
                } else if let Some(message) = error.get() {
                    view! {
                        <div class="empty-state">
                            <div class="empty-icon">"◌"</div>
                            <p class="empty-message">{format!("Notes unavailable: {}", message)}</p>
                            <button class="btn-ghost" on:click=move |_| load_notes()>"Retry notes"</button>
                        </div>
                    }.into_any()
                } else {
                    view! {
                        <>
                            {move || selected_id.get().map(|_| view! {
                                <div class="note-editor">
                                    <input
                                        class="search-input"
                                        prop:value=move || title_input.get()
                                        on:input=move |ev| title_input.set(event_target_value(&ev))
                                        placeholder="Note title"
                                    />
                                    <textarea
                                        class="note-textarea"
                                        prop:value=move || body_input.get()
                                        on:input=move |ev| body_input.set(event_target_value(&ev))
                                        placeholder="Write your note…"
                                    />
                                    <div class="note-editor-actions">
                                        <button class="btn-primary" on:click=save_note>"Save"</button>
                                        <button class="btn-ghost" on:click=move |_| selected_id.set(None)>"Close"</button>
                                    </div>
                                </div>
                            })}

                            <div class="notes-list">
                                {move || {
                                    let current_query = query.get().to_lowercase();
                                    let filtered = notes
                                        .get()
                                        .into_iter()
                                        .filter(|note| {
                                            current_query.is_empty() ||
                                                note.title.to_lowercase().contains(&current_query) ||
                                                note.body.to_lowercase().contains(&current_query)
                                        })
                                        .collect::<Vec<_>>();

                                    if filtered.is_empty() {
                                        view! { <EmptyState message="No notes found.".into() /> }.into_any()
                                    } else {
                                        view! {
                                            <For
                                                each=move || filtered.clone()
                                                key=|note| note.id.clone()
                                                children=move |note| {
                                                    let note_for_open = note.clone();
                                                    let note_for_pin = note.clone();
                                                    let note_id = note.id.clone();
                                                    view! {
                                                        <div class="note-card" class:pinned=note.pinned>
                                                            <div class="note-card-header">
                                                                <span class="note-title">{note.title.clone()}</span>
                                                                <div class="note-actions">
                                                                    <button
                                                                        class="icon-btn"
                                                                        aria-label=if note.pinned { "Unpin note" } else { "Pin note" }
                                                                        title=if note.pinned { "Unpin note" } else { "Pin note" }
                                                                        on:click=move |_| toggle_pin(note_for_pin.clone())
                                                                    >
                                                                        {if note.pinned { "★" } else { "☆" }}
                                                                    </button>
                                                                    <button class="icon-btn" aria-label="Edit note" title="Edit note" on:click=move |_| open_note(note_for_open.clone())>
                                                                        "✎"
                                                                    </button>
                                                                    <button class="icon-btn danger" aria-label="Delete note" title="Delete note" on:click=move |_| delete_note(note_id.clone())>
                                                                        "✕"
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <p class="note-preview">{note.body.clone()}</p>
                                                        </div>
                                                    }
                                                }
                                            />
                                        }
                                        .into_any()
                                    }
                                }}
                            </div>
                        </>
                    }
                    .into_any()
                }
            }}
        </section>
    }
}

#[component]
fn TabsView() -> impl IntoView {
  let tabs = RwSignal::new(Vec::<TabEntry>::new());
  let query = RwSignal::new(String::new());
  let loading = RwSignal::new(true);
  let error = RwSignal::new(None::<String>);

  let load_tabs = move || {
    loading.set(true);
    error.set(None);
    spawn_local(async move {
      match request_data::<Vec<TabEntry>>("TAB_LIST", Map::new()).await {
        Ok(data) => tabs.set(data),
        Err(message) => error.set(Some(message)),
      }
      loading.set(false);
    });
  };

  let close_tab = move |tab_id: u32| {
    spawn_local(async move {
      let _ = request_action("TAB_CLOSE", message_fields([("targetTabId", json!(tab_id))])).await;
      load_tabs();
    });
  };

  let toggle_pin = move |tab: TabEntry| {
    spawn_local(async move {
      let _ = request_action(
        "TAB_PIN",
        message_fields([
          ("targetTabId", json!(tab.id)),
          ("pinned", json!(!tab.pinned)),
        ])
      ).await;
      load_tabs();
    });
  };

  load_tabs();

  view! {
        <section class="tab-manager-view">
            <div class="view-header">
                <h2>"Tab Manager"</h2>
                <span class="badge badge-blue">{move || format!("{} tabs", tabs.get().len())}</span>
            </div>

            <SearchBar query=query />

            {move || {
                if loading.get() {
                    view! { <div class="loading-view"><Spinner size="lg".into() /></div> }.into_any()
                } else if let Some(message) = error.get() {
                    view! {
                        <div class="empty-state">
                            <div class="empty-icon">"◌"</div>
                            <p class="empty-message">{format!("Tabs unavailable: {}", message)}</p>
                            <button class="btn-ghost" on:click=move |_| load_tabs()>"Retry tabs"</button>
                        </div>
                    }.into_any()
                } else {
                    view! {
                        <div class="tab-list">
                            {move || {
                                let current_query = query.get().to_lowercase();
                                let filtered = tabs
                                    .get()
                                    .into_iter()
                                    .filter(|tab| {
                                        current_query.is_empty() ||
                                            tab.title.to_lowercase().contains(&current_query) ||
                                            tab.url.to_lowercase().contains(&current_query)
                                    })
                                    .collect::<Vec<_>>();

                                if filtered.is_empty() {
                                    view! { <EmptyState message="No tabs match your search.".into() /> }.into_any()
                                } else {
                                    view! {
                                        <For
                                            each=move || filtered.clone()
                                            key=|tab| tab.id
                                            children=move |tab| {
                                                let pin_tab = tab.clone();
                                                view! {
                                                    <div class="tab-item" class:active=tab.active class:pinned=tab.pinned>
                                                        <div class="tab-info">
                                                            <span class="tab-title">{tab.title.clone()}</span>
                                                            <span class="tab-url">{tab.url.clone()}</span>
                                                        </div>
                                                        <div class="tab-actions">
                                                            <button class="icon-btn" aria-label="Toggle pin tab" title="Toggle pin tab" on:click=move |_| toggle_pin(pin_tab.clone())>
                                                                {if tab.pinned { "★" } else { "☆" }}
                                                            </button>
                                                            <button class="icon-btn danger" aria-label="Close tab" title="Close tab" on:click=move |_| close_tab(tab.id)>
                                                                "✕"
                                                            </button>
                                                        </div>
                                                    </div>
                                                }
                                            }
                                        />
                                    }
                                    .into_any()
                                }
                            }}
                        </div>
                    }
                    .into_any()
                }
            }}
        </section>
    }
}

#[component]
fn CloudView() -> impl IntoView {
  let providers = RwSignal::new(Vec::<CloudProvider>::new());
  let loading = RwSignal::new(true);
  let error = RwSignal::new(None::<String>);

  let load_status = move || {
    loading.set(true);
    error.set(None);
    spawn_local(async move {
      match request_data::<Vec<CloudProvider>>("CLOUD_STATUS_GET", Map::new()).await {
        Ok(data) => providers.set(data),
        Err(message) => error.set(Some(message)),
      }
      loading.set(false);
    });
  };

  let start_auth = move |provider_id: String| {
    spawn_local(async move {
      let _ = request_action(
        "CLOUD_AUTH_START",
        message_fields([("provider", json!(provider_id))])
      ).await;
    });
  };

  load_status();

  view! {
        <section class="cloud-status-view">
            <div class="view-header">
                <h2>"Cloud Storage"</h2>
                <button class="btn-ghost" on:click=move |_| load_status()>"Refresh"</button>
            </div>

            {move || {
                if loading.get() {
                    view! { <div class="loading-view"><Spinner size="lg".into() /></div> }.into_any()
                } else if let Some(message) = error.get() {
                    view! {
                        <div class="empty-state">
                            <div class="empty-icon">"◌"</div>
                            <p class="empty-message">{format!("Cloud status unavailable: {}", message)}</p>
                            <button class="btn-ghost" on:click=move |_| load_status()>"Retry cloud status"</button>
                        </div>
                    }.into_any()
                } else {
                    view! {
                        <div class="cloud-services">
                            <For
                                each=move || providers.get()
                                key=|provider| provider.id.clone()
                                children=move |provider| {
                                    let provider_id = provider.id.clone();
                                    let badge_color = if provider.connected { "green" } else { "orange" };
                                    let integration_mode = provider.integration_mode.clone();
                                    let capabilities = provider.capabilities.clone();
                                    let limitations = provider.limitations.clone();
                                    view! {
                                        <div class=format!("cloud-service {}", if provider.connected { "green" } else { "orange" })>
                                            <div class="cloud-service-top">
                                                <h4>{provider.name.clone()}</h4>
                                                <Badge label=provider.status.clone() color=badge_color.into() />
                                            </div>
                                            <p class="description">
                                                {if provider.connected {
                                                    format!("Detected {} browser session cookie(s).", provider.cookie_count)
                                                } else {
                                                    "Open the provider login in your browser, sign in, then refresh.".into()
                                                }}
                                            </p>
                                            <p class="cloud-mode">{integration_mode}</p>
                                            <div class="cloud-capabilities">
                                                <For
                                                    each=move || capabilities.clone().into_iter().enumerate()
                                                    key=|(index, capability)| format!("{index}-{capability}")
                                                    children=move |(_, capability)| view! {
                                                        <span class="cloud-chip">{capability}</span>
                                                    }
                                                />
                                            </div>
                                            <div class="cloud-limitations">
                                                <For
                                                    each=move || limitations.clone().into_iter().enumerate()
                                                    key=|(index, limitation)| format!("{index}-{limitation}")
                                                    children=move |(_, limitation)| view! {
                                                        <p class="description">{limitation}</p>
                                                    }
                                                />
                                            </div>
                                            <ProgressBar
                                                value=if provider.connected { 100.0 } else { 5.0 }
                                                color=badge_color.into()
                                                show_label=true
                                            />
                                            {(!provider.connected).then(|| view! {
                                                <button class="btn-primary" on:click=move |_| start_auth(provider_id.clone())>
                                                    "Open login"
                                                </button>
                                            })}
                                        </div>
                                    }
                                }
                            />
                        </div>
                    }
                    .into_any()
                }
            }}
        </section>
    }
}

#[component]
fn LoginView() -> impl IntoView {
  let session = RwSignal::new(None::<SessionInfo>);
  let email_input = RwSignal::new(String::new());
  let otp_input = RwSignal::new(String::new());
  let otp_code = RwSignal::new(None::<String>); // code returned by server to display
  let otp_sent = RwSignal::new(false);
  let loading = RwSignal::new(false);
  let error = RwSignal::new(None::<String>);
  let feedback = RwSignal::new(None::<String>);
  let save_loading = RwSignal::new(false);
  let save_feedback = RwSignal::new(None::<String>);

  let load_session = move || {
    spawn_local(async move {
      if let Ok(payload) = request_data::<SessionPayload>("SESSION_GET", Map::new()).await {
        session.set(payload.session);
      }
    });
  };

  let send_otp = move |_| {
    let email = email_input.get().trim().to_string();
    if email.is_empty() || !email.contains('@') {
      error.set(Some("Enter a valid email address.".into()));
      return;
    }
    loading.set(true);
    error.set(None);
    feedback.set(None);
    otp_sent.set(false);
    otp_code.set(None);
    spawn_local(async move {
      match request_data::<serde_json::Value>(
        "AUTH_OTP_REQUEST",
        message_fields([("email", json!(email))]),
      )
      .await
      {
        Ok(val) => {
          let code = val
            .get("data")
            .and_then(|d| d.get("otp"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());
          otp_code.set(code);
          otp_sent.set(true);
          feedback.set(Some("Code sent! Enter it below to sign in.".into()));
        }
        Err(msg) => error.set(Some(msg)),
      }
      loading.set(false);
    });
  };

  let verify_otp = move |_| {
    let email = email_input.get().trim().to_string();
    let code = otp_input.get().trim().to_string();
    if code.is_empty() {
      error.set(Some("Enter the 6-digit code.".into()));
      return;
    }
    loading.set(true);
    error.set(None);
    feedback.set(None);
    spawn_local(async move {
      match request_data::<OtpVerifyPayload>(
        "AUTH_OTP_VERIFY",
        message_fields([("email", json!(email)), ("code", json!(code))]),
      )
      .await
      {
        Ok(payload) => {
          session.set(payload.session);
          otp_input.set(String::new());
          otp_sent.set(false);
          otp_code.set(None);
          let settings_applied = payload.api_settings.as_ref().map(|s| {
            !s.venice_api_key.is_empty() || !s.hf_token.is_empty() || !s.ollama_url.is_empty()
          }).unwrap_or(false);
          if settings_applied {
            feedback.set(Some("Signed in — your saved API keys have been loaded.".into()));
          } else {
            feedback.set(Some("Signed in.".into()));
          }
        }
        Err(msg) => error.set(Some(msg)),
      }
      loading.set(false);
    });
  };

  let logout = move |_| {
    loading.set(true);
    feedback.set(None);
    error.set(None);
    spawn_local(async move {
      let _ = request_action("AUTH_LOGOUT", Map::new()).await;
      session.set(None);
      otp_sent.set(false);
      otp_code.set(None);
      feedback.set(Some("Signed out.".into()));
      loading.set(false);
    });
  };

  let save_settings = move |_| {
    save_loading.set(true);
    save_feedback.set(None);
    spawn_local(async move {
      let keys = [
        ("venice_api_key", "sue_setup_venice_api_key"),
        ("hf_token", "sue_setup_hugging_face_token"),
        ("hf_model", "sue_setup_hf_model"),
        ("ollama_url", "sue_setup_ollama_url"),
        ("venice_model", "sue_setup_venice_model"),
      ];
      let mut settings_map = serde_json::Map::new();
      for (setting_key, storage_key) in &keys {
        if let Ok(val) = request_data::<serde_json::Value>(
          "STORE_GET",
          message_fields([("key", json!(storage_key))]),
        ).await {
          let stored_val = val.get("data").and_then(|d| d.get("value"))
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
          settings_map.insert(setting_key.to_string(), json!(stored_val));
        }
      }
      match request_data::<serde_json::Value>(
        "USER_SETTINGS_SAVE",
        message_fields([("settings", serde_json::Value::Object(settings_map))]),
      ).await {
        Ok(_) => save_feedback.set(Some("Settings saved to your account.".into())),
        Err(msg) => save_feedback.set(Some(format!("Save failed: {msg}"))),
      }
      save_loading.set(false);
    });
  };

  let load_settings = move |_| {
    save_loading.set(true);
    save_feedback.set(None);
    spawn_local(async move {
      match request_data::<serde_json::Value>("USER_SETTINGS_LOAD", Map::new()).await {
        Ok(val) => {
          let data = val.get("data");
          let map_field = |field: &str, storage_key: &str| {
            if let Some(v) = data.and_then(|d| d.get(field)).and_then(|v| v.as_str()) {
              if !v.is_empty() {
                return Some((storage_key.to_string(), v.to_string()));
              }
            }
            None
          };
          let pairs: Vec<(String, String)> = [
            map_field("venice_api_key", "sue_setup_venice_api_key"),
            map_field("hf_token", "sue_setup_hugging_face_token"),
            map_field("hf_model", "sue_setup_hf_model"),
            map_field("ollama_url", "sue_setup_ollama_url"),
            map_field("venice_model", "sue_setup_venice_model"),
          ].into_iter().flatten().collect();

          let mut applied = 0usize;
          for (storage_key, value) in pairs {
            let _ = request_action(
              "STORE_SET",
              message_fields([("key", json!(storage_key)), ("value", json!(value))]),
            ).await;
            applied += 1;
          }
          save_feedback.set(Some(format!("Loaded {applied} settings from your account.")));
        }
        Err(msg) => save_feedback.set(Some(format!("Load failed: {msg}"))),
      }
      save_loading.set(false);
    });
  };

  load_session();

  view! {
    <section class="login-view">
      <div class="view-header">
        <h2>"Account"</h2>
        <Badge label="Email + OTP".into() color="blue".into() />
      </div>

      {move || error.get().map(|msg| view! {
        <p class="form-error" style="margin-bottom:10px;">{msg}</p>
      })}
      {move || feedback.get().map(|msg| view! {
        <p class="description" style="margin-bottom:10px;color:var(--green);">{msg}</p>
      })}

      {move || {
        if let Some(s) = session.get() {
          let display = s.email.clone()
            .or_else(|| s.username.clone())
            .unwrap_or_else(|| "—".into());
          view! {
            <div class="health-card" style="margin-bottom:12px;">
              <h4>"Signed in"</h4>
              <p class="description">{format!("Account: {}", display)}</p>

              {move || save_feedback.get().map(|msg| view! {
                <p class="description" style="margin-top:8px;color:var(--green);">{msg}</p>
              })}

              <div class="inline-form-actions" style="margin-top:12px;flex-wrap:wrap;gap:8px;">
                <button
                  class="btn-primary"
                  on:click=save_settings
                  prop:disabled=move || save_loading.get()
                >
                  {move || if save_loading.get() { "Working…" } else { "Save API keys to account" }}
                </button>
                <button
                  class="btn-ghost"
                  on:click=load_settings
                  prop:disabled=move || save_loading.get()
                >
                  {move || if save_loading.get() { "Working…" } else { "Load API keys from account" }}
                </button>
                <button
                  class="btn-ghost"
                  style="color:var(--red);"
                  on:click=logout
                  prop:disabled=move || loading.get()
                >
                  "Sign out"
                </button>
              </div>
              <p class="description" style="margin-top:10px;opacity:0.7;">
                "\"Save\" pushes your current extension API keys to your account. \"Load\" pulls them back in — useful after a fresh install."
              </p>
            </div>
          }.into_any()
        } else {
          view! {
            <div class="inline-form-card">
              <label class="description">"Email address"</label>
              <input
                class="search-input inline-input"
                type="email"
                prop:value=move || email_input.get()
                on:input=move |ev| email_input.set(event_target_value(&ev))
                placeholder="you@example.com"
                autocomplete="email"
              />

              {move || otp_sent.get().then(|| view! {
                <div>
                  {move || otp_code.get().map(|code| view! {
                    <div style="margin-top:12px;padding:10px 14px;background:var(--card);border:1px solid var(--accent);border-radius:8px;">
                      <p class="description" style="margin:0;opacity:0.7;font-size:0.75rem;">"Your one-time code (no email needed)"</p>
                      <p style="margin:4px 0 0;font-family:monospace;font-size:1.5rem;letter-spacing:0.3em;color:var(--accent);">{code}</p>
                    </div>
                  })}
                  <label class="description" style="margin-top:12px;display:block;">"Enter the 6-digit code"</label>
                  <input
                    class="search-input inline-input"
                    type="text"
                    inputmode="numeric"
                    maxlength="6"
                    prop:value=move || otp_input.get()
                    on:input=move |ev| otp_input.set(event_target_value(&ev))
                    placeholder="123456"
                    autocomplete="one-time-code"
                  />
                  <div class="inline-form-actions" style="margin-top:10px;">
                    <button class="btn-ghost" on:click=move |_| { otp_sent.set(false); otp_code.set(None); }>
                      "← Back"
                    </button>
                    <button class="btn-primary" on:click=verify_otp prop:disabled=move || loading.get()>
                      {move || if loading.get() { "Verifying…" } else { "Verify & sign in" }}
                    </button>
                  </div>
                </div>
              })}

              {move || (!otp_sent.get()).then(|| view! {
                <div class="inline-form-actions" style="margin-top:10px;">
                  <button class="btn-primary" on:click=send_otp prop:disabled=move || loading.get()>
                    {move || if loading.get() { "Sending…" } else { "Send code" }}
                  </button>
                </div>
              })}

              <p class="description" style="margin-top:10px;opacity:0.7;">
                "No password needed. Enter your email and we'll give you a code — sign in once to save your API keys so you never re-enter them."
              </p>
            </div>
          }.into_any()
        }
      }}
    </section>
  }
}

#[component]
fn AgentView() -> impl IntoView {
  let tasks = RwSignal::new(Vec::<AgentTask>::new());
  let task_type_input = RwSignal::new("analyze".to_string());
  let task_content_input = RwSignal::new(String::new());
  let task_priority_input = RwSignal::new(1u32);
  let loading = RwSignal::new(true);
  let creating = RwSignal::new(false);
  let error = RwSignal::new(None::<String>);

  let load_tasks = move || {
    loading.set(true);
    spawn_local(async move {
      match request_data::<AgentTasksPayload>("AGENT_GET_TASKS", Map::new()).await {
        Ok(payload) => tasks.set(payload.tasks),
        Err(msg) => error.set(Some(msg)),
      }
      loading.set(false);
    });
  };

  let create_task = move |_| {
    let content = task_content_input.get().trim().to_string();
    if content.is_empty() {
      return;
    }
    creating.set(true);
    error.set(None);
    spawn_local(async move {
      let _ = request_data::<AgentTaskPayload>(
        "AGENT_CREATE_TASK",
        message_fields([(
          "task",
          json!({
            "task_type": task_type_input.get(),
            "content": content,
            "priority": task_priority_input.get(),
          }),
        )])
      ).await;
      task_content_input.set(String::new());
      creating.set(false);
      load_tasks();
    });
  };

  let update_status = move |task_id: String, new_status: &'static str| {
    spawn_local(async move {
      let _ = request_action(
        "AGENT_UPDATE_STATUS",
        message_fields([("taskId", json!(task_id)), ("status", json!(new_status))])
      ).await;
      load_tasks();
    });
  };

  let delete_done = move |_| {
    spawn_local(async move {
      let current = tasks.get_untracked();
      for task in current.iter().filter(|t| t.status == "Completed" || t.status == "Failed") {
        let _ = request_action(
          "AGENT_UPDATE_STATUS",
          message_fields([("taskId", json!(task.id.clone())), ("status", json!("Archived"))])
        ).await;
      }
      load_tasks();
    });
  };

  load_tasks();

  let task_types = ["analyze", "summarize", "extract", "chat", "generic"];
  let status_color = |status: &str| match status {
    "Pending" => "gray",
    "Running" => "blue",
    "Completed" => "green",
    "Failed" => "red",
    _ => "gray",
  };

  view! {
    <section class="agent-view">
      <div class="view-header">
        <h2>"Agent Tasks"</h2>
        <button class="btn-ghost" on:click=move |_| load_tasks()>"Refresh"</button>
      </div>

      <div class="quick-stats" style="margin-bottom:12px;">
        <div class="stat-card">
          <h4>"Pending"</h4>
          <p class="value">{move || tasks.get().iter().filter(|t| t.status == "Pending").count()}</p>
        </div>
        <div class="stat-card">
          <h4>"Running"</h4>
          <p class="value">{move || tasks.get().iter().filter(|t| t.status == "Running").count()}</p>
        </div>
        <div class="stat-card">
          <h4>"Done"</h4>
          <p class="value">{move || tasks.get().iter().filter(|t| t.status == "Completed").count()}</p>
        </div>
      </div>

      <div class="inline-form-card" style="margin-bottom:12px;">
        <div class="inline-form-grid">
          <div>
            <label class="description">"Task type"</label>
            <select
              class="search-input inline-input"
              prop:value=move || task_type_input.get()
              on:change=move |ev| task_type_input.set(event_target_value(&ev))
            >
              {task_types.iter().map(|t| view! { <option value=*t>{*t}</option> }).collect::<Vec<_>>()}
            </select>
          </div>
          <div>
            <label class="description">"Priority (1-5)"</label>
            <input
              class="search-input inline-input"
              type="number"
              prop:min="1"
              prop:max="5"
              prop:value=move || task_priority_input.get().to_string()
              on:input=move |ev| {
                if let Ok(n) = event_target_value(&ev).parse::<u32>() {
                  task_priority_input.set(n.clamp(1, 5));
                }
              }
            />
          </div>
        </div>
        <textarea
          class="note-textarea inline-textarea"
          prop:value=move || task_content_input.get()
          on:input=move |ev| task_content_input.set(event_target_value(&ev))
          placeholder="Describe the task for the agent…"
        />
        <div class="inline-form-actions">
          <button class="btn-primary" on:click=create_task prop:disabled=move || creating.get() || task_content_input.get().trim().is_empty()>
            {move || if creating.get() { "Creating…" } else { "Create task" }}
          </button>
          <button class="btn-ghost" on:click=delete_done title="Archive completed and failed tasks">
            "Clear done"
          </button>
        </div>
      </div>

      {move || error.get().map(|msg| view! { <p class="form-error">{msg}</p> })}

      {move || if loading.get() {
        view! { <div class="loading-view"><Spinner size="lg".into() /></div> }.into_any()
      } else if tasks.get().is_empty() {
        view! { <EmptyState message="No tasks yet. Create one above.".into() /> }.into_any()
      } else {
        view! {
          <div class="notes-list">
            <For
              each=move || tasks.get()
              key=|t| t.id.clone()
              children=move |task| {
                let color = status_color(&task.status).to_string();
                let tid_run = task.id.clone();
                let tid_done = task.id.clone();
                let tid_fail = task.id.clone();
                let s = task.status.clone();
                let s_run = s.clone();
                let s_done = s.clone();
                view! {
                  <div class="note-card">
                    <div class="note-card-header">
                      <span class="note-title">{format!("[{}] P{}", task.task_type, task.priority)}</span>
                      <Badge label=task.status.clone() color=color />
                    </div>
                    <p class="note-preview">{task.content.clone()}</p>
                    <div class="kanban-card-actions" style="margin-top:6px;">
                      {(s_run != "Running" && s_run != "Completed").then(|| view! {
                        <button class="icon-btn" title="Mark Running"
                          on:click=move |_| update_status(tid_run.clone(), "Running")>"▶"</button>
                      })}
                      {(s_done != "Completed").then(|| view! {
                        <button class="icon-btn" title="Mark Completed"
                          on:click=move |_| update_status(tid_done.clone(), "Completed")>"✓"</button>
                      })}
                      <button class="icon-btn danger" title="Mark Failed"
                        on:click=move |_| update_status(tid_fail.clone(), "Failed")>"✕"</button>
                    </div>
                  </div>
                }
              }
            />
          </div>
        }.into_any()
      }}
    </section>
  }
}

#[component]
fn PageView() -> impl IntoView {
  let context = RwSignal::new(None::<PageContextData>);
  let loading = RwSignal::new(false);
  let injecting = RwSignal::new(false);
  let feedback = RwSignal::new(None::<(bool, String)>);
  let error = RwSignal::new(None::<String>);

  let load_context = move || {
    loading.set(true);
    error.set(None);
    feedback.set(None);
    spawn_local(async move {
      match request_data::<PageContextPayload>("PAGE_GET_CONTEXT", Map::new()).await {
        Ok(payload) => context.set(Some(payload.context)),
        Err(msg) => error.set(Some(msg)),
      }
      loading.set(false);
    });
  };

  let inject_sidebar = move |_| {
    injecting.set(true);
    feedback.set(None);
    spawn_local(async move {
      match request_action(
        "PAGE_INJECT_SIDEBAR",
        message_fields([("targetId", json!("body"))])
      ).await {
        Ok(_) => feedback.set(Some((true, "SUE sidebar injected into the active page.".into()))),
        Err(msg) => feedback.set(Some((false, msg))),
      }
      injecting.set(false);
    });
  };

  load_context();

  view! {
    <section class="page-view">
      <div class="view-header">
        <h2>"Page Integration"</h2>
        <button class="btn-ghost" on:click=move |_| load_context()>"Refresh"</button>
      </div>

      {move || error.get().map(|msg| view! {
        <p class="form-error" style="margin-bottom:10px;">{msg}</p>
      })}
      {move || feedback.get().map(|(ok, msg)| view! {
        <p class="description" style=move || format!("margin-bottom:10px;color:var(--{});", if ok { "green" } else { "red" })>{msg}</p>
      })}

      {move || if loading.get() {
        view! { <div class="loading-view"><Spinner size="lg".into() /></div> }.into_any()
      } else if let Some(ctx) = context.get() {
        view! {
          <>
            <div class="health-card" style="margin-bottom:12px;">
              <h4>"Active Tab"</h4>
              <p class="description" style="word-break:break-all;">{ctx.url.clone()}</p>
              <p class="description">{format!("Title: {}", ctx.title)}</p>
              <p class="description">{format!("Domain: {}", ctx.domain)}</p>
              {(!ctx.path.is_empty() && ctx.path != "/").then(|| view! {
                <p class="description">{format!("Path: {}", ctx.path)}</p>
              })}
            </div>

            <div style="margin-bottom:12px;">
              <button
                class="btn-primary"
                style="width:100%;"
                on:click=inject_sidebar
                prop:disabled=move || injecting.get()
              >
                {move || if injecting.get() { "Injecting…" } else { "Inject SUE into page" }}
              </button>
              <p class="description" style="margin-top:6px;opacity:0.7;">
                "Adds a fixed SUE panel to the right side of the current page without reloading it."
              </p>
            </div>
          </>
        }.into_any()
      } else {
        view! {
          <EmptyState message="No page context. Open a browser tab and refresh.".into() />
        }.into_any()
      }}
    </section>
  }
}

#[component]
fn SettingsView(compact_layout: RwSignal<bool>, notifications: RwSignal<bool>) -> impl IntoView {
  view! {
        <section class="settings-view">
            <h2>"Settings"</h2>

            <Accordion title="Appearance".into() open=true>
                <div class="settings-group">
                    <Toggle checked=compact_layout label="Compact layout".into() />
                    <div class="settings-note">
                        <p>"Compact layout reduces spacing so larger project, note, and tab lists stay easier to scan."</p>
                        <p>"The current SUE runtime ships with a fixed dark theme."</p>
                    </div>
                </div>
            </Accordion>

            <Accordion title="Preferences".into()>
                <div class="settings-group">
                    <Toggle checked=notifications label="Enable notifications".into() />
                    <div class="settings-note">
                        <p>"Preferences are saved in this browser profile and restored after reloads."</p>
                    </div>
                </div>
            </Accordion>

            <Accordion title="Backend".into()>
                <div class="settings-group about-info">
                    <p>"Local API is the source of truth for notes, projects, auth, and audit data."</p>
                    <p>"Ollama powers AI chat at http://localhost:11434."</p>
                    <p>"Cloud status uses browser-session cookies and login handoff."</p>
                </div>
            </Accordion>

            <Accordion title="AI Integrations".into()>
                <DashboardSetupWizard />
            </Accordion>

            <Accordion title="About".into()>
                <div class="settings-group about-info">
                    <p>"SUE — Sovereign Sidebar Extension v4.0.0"</p>
                    <p>"Built with Rust, Leptos, WASM, and Chrome MV3."</p>
                    <p>"Local-first. No telemetry. No mandatory cloud."</p>
                </div>
            </Accordion>
        </section>
    }
}

fn message_fields<const N: usize>(entries: [(&str, Value); N]) -> Map<String, Value> {
  entries
    .into_iter()
    .map(|(key, value)| (key.to_string(), value))
    .collect()
}

async fn store_get_value(key: &str) -> Result<Option<Value>, String> {
  let payload = request_data::<StoreValue>(
    "STORE_GET",
    message_fields([("key", json!(key))])
  ).await?;
  Ok(payload.value)
}

async fn store_set_value(key: &str, value: Value) -> Result<(), String> {
  request_action(
    "STORE_SET",
    message_fields([
      ("key", json!(key)),
      ("value", value),
    ])
  ).await
}

async fn load_integration_setup() -> Result<IntegrationSetup, String> {
  // Default to empty string — the UI input shows "http://localhost:11434" as placeholder.
  // An unsaved URL should not count as "configured".
  let ollama_url = store_get_value("sue_setup_ollama_url").await?
    .and_then(|value| value.as_str().map(|item| item.to_string()))
    .unwrap_or_default();
  let ollama_api_key = store_get_value("sue_setup_ollama_api_key").await?
    .and_then(|value| value.as_str().map(|item| item.to_string()))
    .unwrap_or_default();
  let venice_mode = store_get_value("sue_setup_venice_mode").await?
    .and_then(|value| value.as_str().map(|item| item.to_string()))
    .unwrap_or_else(|| "api".to_string());
  let venice_api_key = store_get_value("sue_setup_venice_api_key").await?
    .and_then(|value| value.as_str().map(|item| item.to_string()))
    .unwrap_or_default();
  let venice_model = store_get_value("sue_setup_venice_model").await?
    .and_then(|value| value.as_str().map(|item| item.to_string()))
    .unwrap_or_else(|| "llama-3.3-70b".to_string());
  let hugging_face_token = store_get_value("sue_setup_hugging_face_token").await?
    .and_then(|value| value.as_str().map(|item| item.to_string()))
    .unwrap_or_default();
  let hf_model = store_get_value("sue_setup_hf_model").await?
    .and_then(|value| value.as_str().map(|item| item.to_string()))
    .unwrap_or_else(|| "mistralai/Mistral-7B-Instruct-v0.3".to_string());
  let embedding_model = store_get_value("sue_setup_embedding_model").await?
    .and_then(|value| value.as_str().map(|item| item.to_string()))
    .or(
      store_get_value("sue_setup_ollama_model").await?.and_then(|value|
        value.as_str().map(|item| item.to_string())
      )
    )
    .unwrap_or_else(|| "mxbai-embed-small-v1".to_string());

  Ok(IntegrationSetup {
    ollama_url,
    ollama_api_key,
    embedding_model,
    venice_mode,
    venice_api_key,
    venice_model,
    hugging_face_token,
    hf_model,
  })
}

async fn validate_ollama_reachability(
  ollama_base_url: &str,
  ollama_api_key: &str
) -> Result<bool, String> {
  let base = if ollama_base_url.trim().is_empty() {
    "http://localhost:11434".to_string()
  } else {
    ollama_base_url.trim().trim_end_matches('/').to_string()
  };
  let endpoint = format!("{}/api/tags", base);

  let window = web_sys::window().ok_or_else(|| "Window unavailable".to_string())?;
  let options = RequestInit::new();
  options.set_method("GET");

  let request = web_sys::Request
    ::new_with_str_and_init(&endpoint, &options)
    .map_err(js_error)?;
  if !ollama_api_key.trim().is_empty() {
    request
      .headers()
      .set("Authorization", &format!("Bearer {}", ollama_api_key.trim()))
      .map_err(js_error)?;
  }

  let response_value = JsFuture::from(window.fetch_with_request(&request)).await.map_err(js_error)?;
  let response: web_sys::Response = response_value.dyn_into().map_err(js_error)?;

  Ok(response.ok())
}

async fn request_data<T>(message_type: &str, extra_fields: Map<String, Value>) -> Result<T, String>
  where T: DeserializeOwned
{
  let response: Envelope<T> = request(message_type, extra_fields).await?;
  if response.success {
    response.data.ok_or_else(|| "Missing data payload".to_string())
  } else {
    Err(response.error.unwrap_or_else(|| "Extension request failed".to_string()))
  }
}

async fn request_action(
  message_type: &str,
  extra_fields: Map<String, Value>
) -> Result<(), String> {
  let response: Envelope<Value> = request(message_type, extra_fields).await?;
  if response.success {
    Ok(())
  } else {
    Err(response.error.unwrap_or_else(|| "Extension request failed".to_string()))
  }
}

async fn request<T>(message_type: &str, mut extra_fields: Map<String, Value>) -> Result<T, String>
  where T: DeserializeOwned
{
  extra_fields.insert("type".into(), Value::String(message_type.to_string()));
  let request_json = Value::Object(extra_fields).to_string();
  let promise = sue_request_json(&request_json).map_err(js_error)?;
  let result = JsFuture::from(promise).await.map_err(js_error)?;
  serde_wasm_bindgen::from_value(result).map_err(|err| err.to_string())
}

fn js_error(value: JsValue) -> String {
  if let Some(message) = value.as_string() { message } else { format!("{:?}", value) }
}

fn load_settings() -> StoredSettings {
  web_sys
    ::window()
    .and_then(|window| window.local_storage().ok().flatten())
    .and_then(|storage| storage.get_item("sue_settings").ok().flatten())
    .and_then(|raw| serde_json::from_str::<StoredSettings>(&raw).ok())
    .unwrap_or_default()
}

fn save_settings(settings: &StoredSettings) {
  if let Some(storage) = web_sys::window().and_then(|window| window.local_storage().ok().flatten()) {
    if let Ok(raw) = serde_json::to_string(settings) {
      let _ = storage.set_item("sue_settings", &raw);
    }
  }
}

#[wasm_bindgen(start)]
pub fn main() {
  console_error_panic_hook::set_once();
  leptos::mount::mount_to_body(App);
  web_sys::console::log_1(&"SUE Leptos app mounted".into());
}
