//! Swarm Panel Component — Multi-Agent Orchestrator UI
//! Provides interface for decomposing goals into tasks and monitoring agent execution

use leptos::prelude::*;
use serde::{Deserialize, Serialize};
use wasm_bindgen_futures::spawn_local;

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
pub struct SwarmTask {
    pub id: String,
    pub agent: String,
    pub description: String,
    pub status: String, // "pending" | "running" | "completed" | "failed"
    pub dependencies: Vec<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
pub struct SwarmStatus {
    pub goal: String,
    pub tech_stack: TechStack,
    pub tasks: Vec<SwarmTask>,
    pub active_agent: Option<String>,
    pub progress_percent: u32,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
pub struct TechStack {
    pub frontend: String,
    pub styling: String,
    pub backend: String,
    pub storage: String,
}

/// Swarm Panel Component
/// Displays goal input, task decomposition, and agent execution progress
#[component]
pub fn SwarmPanel() -> impl IntoView {
    let user_intent = RwSignal::new(String::new());
    let swarm_status: RwSignal<Option<SwarmStatus>> = RwSignal::new(None);
    let is_running = RwSignal::new(false);
    let error_message: RwSignal<Option<String>> = RwSignal::new(None);

    let handle_run_swarm = move |_| {
        let intent = user_intent.get();
        if intent.trim().is_empty() {
            error_message.set(Some("Please enter a goal".to_string()));
            return;
        }

        is_running.set(true);
        error_message.set(None);

        // Send message to background script
        spawn_local(async move {
            let message = serde_json::json!({
                "type": "SWARM_RUN",
                "payload": { "intent": intent.clone() }
            });

            match send_message_to_background(message).await {
                Ok(response) => {
                    let success = response.get("success").and_then(|v| v.as_bool()).unwrap_or(false);
                    if success {
                        // Response envelope: { success: true, data: SwarmStatus }
                        let data = response.get("data").cloned().unwrap_or(serde_json::Value::Null);
                        match serde_json::from_value::<SwarmStatus>(data) {
                            Ok(status) => swarm_status.set(Some(status)),
                            Err(_) => error_message.set(Some(
                                "Swarm returned an unrecognised result shape.".to_string()
                            )),
                        }
                    } else {
                        let err = response
                            .get("error")
                            .and_then(|v| v.as_str())
                            .unwrap_or("Swarm orchestration failed")
                            .to_string();
                        error_message.set(Some(err));
                    }
                }
                Err(e) => error_message.set(Some(format!("Connection error: {}", e))),
            }
            is_running.set(false);
        });
    };

    view! {
        <div class="swarm-panel">
            <h2 class="swarm-title">"🐝 Swarm Orchestrator"</h2>

            {move || {
                error_message.get().map(|err| {
                    view! {
                        <div class="swarm-error">
                            <span>{err}</span>
                            <button
                                class="swarm-error-close"
                                on:click=move |_| error_message.set(None)
                            >
                                "×"
                            </button>
                        </div>
                    }
                })
            }}

            <div class="swarm-input-section">
                <label class="swarm-label">"What would you like to build?"</label>
                <textarea
                    class="swarm-textarea"
                    placeholder="e.g., 'Build a React counter app with Tailwind CSS'"
                    prop:value=move || user_intent.get()
                    on:input=move |ev| {
                        user_intent.set(event_target_value(&ev));
                    }
                    disabled=move || is_running.get()
                />
                <button
                    class="swarm-button"
                    on:click=handle_run_swarm
                    disabled=move || is_running.get() || user_intent.get().trim().is_empty()
                >
                    {move || if is_running.get() { "Running..." } else { "Run Swarm" }}
                </button>
            </div>

            {move || {
                swarm_status.get().map(|status| {
                    view! {
                        <div class="swarm-status-section">
                            <h3 class="swarm-subtitle">"Goal"</h3>
                            <p class="swarm-goal">{status.goal.clone()}</p>

                            <h3 class="swarm-subtitle">"Tech Stack"</h3>
                            <div class="swarm-tech-stack">
                                <div class="tech-item">
                                    <span class="tech-label">"Frontend:"</span>
                                    <span class="tech-value">{status.tech_stack.frontend.clone()}</span>
                                </div>
                                <div class="tech-item">
                                    <span class="tech-label">"Styling:"</span>
                                    <span class="tech-value">{status.tech_stack.styling.clone()}</span>
                                </div>
                                <div class="tech-item">
                                    <span class="tech-label">"Backend:"</span>
                                    <span class="tech-value">{status.tech_stack.backend.clone()}</span>
                                </div>
                                <div class="tech-item">
                                    <span class="tech-label">"Storage:"</span>
                                    <span class="tech-value">{status.tech_stack.storage.clone()}</span>
                                </div>
                            </div>

                            <h3 class="swarm-subtitle">"Tasks"</h3>
                            <div class="swarm-progress">
                                <div class="progress-bar">
                                    <div
                                        class="progress-fill"
                                        style=move || {
                                            format!("width: {}%", status.progress_percent)
                                        }
                                    />
                                </div>
                                <span class="progress-text">
                                    {move || format!("{}%", status.progress_percent)}
                                </span>
                            </div>

                            <div class="swarm-tasks">
                                <For
                                    each=move || status.tasks.clone()
                                    key=|task| task.id.clone()
                                    children=move |task| {
                                        let status_class = match task.status.as_str() {
                                            "completed" => "task-completed",
                                            "running" => "task-running",
                                            "failed" => "task-failed",
                                            _ => "task-pending",
                                        };

                                        view! {
                                            <div class=format!("swarm-task {}", status_class)>
                                                <div class="task-header">
                                                    <span class="task-agent">{task.agent.clone()}</span>
                                                    <span class="task-status">{task.status.clone()}</span>
                                                </div>
                                                <p class="task-description">{task.description.clone()}</p>
                                            </div>
                                        }
                                    }
                                />
                            </div>
                        </div>
                    }
                })
            }}
        </div>
    }
}

/// Send a message to the background service worker and return the parsed response.
async fn send_message_to_background(
    message: serde_json::Value,
) -> Result<serde_json::Value, String> {
    use wasm_bindgen::prelude::*;
    use wasm_bindgen_futures::JsFuture;

    #[wasm_bindgen]
    extern "C" {
        #[wasm_bindgen(js_namespace = globalThis, js_name = sueRequestJson, catch)]
        fn sue_request_json(message_json: &str) -> Result<js_sys::Promise, JsValue>;
    }

    let message_json = serde_json::to_string(&message).map_err(|e| e.to_string())?;

    let promise = sue_request_json(&message_json)
        .map_err(|e| format!("Failed to call background: {:?}", e))?;

    let js_val = JsFuture::from(promise)
        .await
        .map_err(|e| format!("Promise rejected: {:?}", e))?;

    // The promise resolves to a JS object — use serde_wasm_bindgen to convert it.
    serde_wasm_bindgen::from_value(js_val).map_err(|e| e.to_string())
}
