//! Learn Tab Component — Active learning from browser tabs
//! Scan mode: deep-scrapes the current tab and uses AI to assemble a logical document.
//! Listen mode: silently captures live video captions into a real-time transcript.
//! Both modes feed into skill card generation and session persistence.

use js_sys::Promise;
use leptos::prelude::*;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::{spawn_local, JsFuture};

// ── Data types ────────────────────────────────────────────────────────────────

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Default)]
pub struct LearnSkill {
    #[serde(rename = "type", default)]
    pub skill_type: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub steps: Vec<String>,
    #[serde(default)]
    pub tags: Vec<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Default)]
pub struct LearnSession {
    #[serde(default)]
    pub id: String,
    #[serde(default)]
    pub url: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub mode: String,
    #[serde(default)]
    pub document: String,
    #[serde(default)]
    pub raw_text: String,
    #[serde(default)]
    pub skills: Vec<LearnSkill>,
    #[serde(default)]
    pub created_at: i64,
}

/// Shared response shape for both LEARN_SCAN_PAGE and LEARN_DEEP_SCAN.
/// Deep scan populates the extra fields; regular scan leaves them at defaults.
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
struct LearnScanData {
    #[serde(default)]
    url: String,
    #[serde(default)]
    title: String,
    #[serde(default)]
    document: String,
    #[serde(default)]
    raw_text: String,
    #[serde(default)]
    has_video: bool,
    #[serde(default)]
    has_captions: bool,
    // Deep scan extras (zero/empty for regular scan)
    #[serde(default)]
    button_count: usize,
    #[serde(default)]
    form_count: usize,
    #[serde(default)]
    internal_link_count: usize,
    #[serde(default)]
    external_link_count: usize,
    #[serde(default)]
    url_report: Vec<UrlReportEntry>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
struct UrlReportEntry {
    #[serde(default)]
    url: String,
    #[serde(default)]
    status: u16,
    #[serde(default)]
    content_type: String,
    #[serde(default)]
    final_url: Option<String>,
    #[serde(default)]
    error: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct LearnSkillsData {
    #[serde(default)]
    skills: Vec<LearnSkill>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
struct LearnSessionsData {
    #[serde(default)]
    sessions: Vec<LearnSession>,
}

// ── Component ─────────────────────────────────────────────────────────────────

#[component]
pub fn LearnView() -> impl IntoView {
    // Sub-tab: "scan" | "listen" | "sessions"
    let subtab = RwSignal::new("scan".to_string());

    // Scan state
    let scanning = RwSignal::new(false);
    let deep_scanning = RwSignal::new(false);
    let url_report: RwSignal<Vec<UrlReportEntry>> = RwSignal::new(Vec::new());
    let deep_meta = RwSignal::new(String::new());

    // Listen state
    let listening = RwSignal::new(false);
    let listen_has_captions = RwSignal::new(false);
    let listen_video_count = RwSignal::new(0i32);
    let transcript = RwSignal::new(String::new());
    let cue_count = RwSignal::new(0usize);

    // Shared assembled content
    let current_document = RwSignal::new(String::new());
    let current_url = RwSignal::new(String::new());
    let current_title = RwSignal::new(String::new());
    let current_mode = RwSignal::new("scan".to_string());

    // Skills
    let skills: RwSignal<Vec<LearnSkill>> = RwSignal::new(Vec::new());
    let generating_skills = RwSignal::new(false);

    // Sessions history
    let sessions: RwSignal<Vec<LearnSession>> = RwSignal::new(Vec::new());
    let sessions_loading = RwSignal::new(false);

    // Shared UI
    let error: RwSignal<Option<String>> = RwSignal::new(None);
    let status = RwSignal::new(String::new());
    let saving = RwSignal::new(false);

    // ── Scan ──────────────────────────────────────────────────────────────────

    let handle_scan = move |_| {
        scanning.set(true);
        error.set(None);
        skills.set(vec![]);
        current_document.set(String::new());
        status.set("Scanning page and assembling document...".to_string());

        spawn_local(async move {
            let msg = serde_json::json!({ "type": "LEARN_SCAN_PAGE" });
            match send_message_to_background(msg).await {
                Ok(resp) => {
                    if resp.get("success").and_then(|v| v.as_bool()).unwrap_or(false) {
                        let data = resp.get("data").cloned().unwrap_or(serde_json::Value::Null);
                        match serde_json::from_value::<LearnScanData>(data) {
                            Ok(d) => {
                                current_document.set(d.document.clone());
                                current_url.set(d.url.clone());
                                current_title.set(d.title.clone());
                                current_mode.set("scan".to_string());
                                status.set("Document assembled.".to_string());
                            }
                            Err(e) => {
                                error.set(Some(format!("Parse error: {e}")));
                                status.set(String::new());
                            }
                        }
                    } else {
                        let e = resp
                            .get("error")
                            .and_then(|v| v.as_str())
                            .unwrap_or("Scan failed")
                            .to_string();
                        error.set(Some(e));
                        status.set(String::new());
                    }
                }
                Err(e) => {
                    error.set(Some(format!("Connection error: {e}")));
                    status.set(String::new());
                }
            }
            scanning.set(false);
        });
    };

    // ── Deep scan ─────────────────────────────────────────────────────────────

    let handle_deep_scan = move |_| {
        deep_scanning.set(true);
        error.set(None);
        skills.set(vec![]);
        current_document.set(String::new());
        url_report.set(vec![]);
        deep_meta.set(String::new());
        status.set("Deep scanning — buttons, forms, links, URL inspection...".to_string());

        spawn_local(async move {
            let msg = serde_json::json!({ "type": "LEARN_DEEP_SCAN" });
            match send_message_to_background(msg).await {
                Ok(resp) => {
                    if resp.get("success").and_then(|v| v.as_bool()).unwrap_or(false) {
                        let data = resp.get("data").cloned().unwrap_or(serde_json::Value::Null);
                        match serde_json::from_value::<LearnScanData>(data) {
                            Ok(d) => {
                                current_document.set(d.document.clone());
                                current_url.set(d.url.clone());
                                current_title.set(d.title.clone());
                                current_mode.set("scan".to_string());
                                url_report.set(d.url_report.clone());
                                let meta = format!(
                                    "{} buttons · {} forms · {} internal links · {} external · {} URLs checked",
                                    d.button_count,
                                    d.form_count,
                                    d.internal_link_count,
                                    d.external_link_count,
                                    d.url_report.len(),
                                );
                                deep_meta.set(meta.clone());
                                status.set(format!("Deep scan complete — {meta}"));
                            }
                            Err(e) => {
                                error.set(Some(format!("Parse error: {e}")));
                                status.set(String::new());
                            }
                        }
                    } else {
                        let e = resp
                            .get("error")
                            .and_then(|v| v.as_str())
                            .unwrap_or("Deep scan failed")
                            .to_string();
                        error.set(Some(e));
                        status.set(String::new());
                    }
                }
                Err(e) => {
                    error.set(Some(format!("Connection error: {e}")));
                    status.set(String::new());
                }
            }
            deep_scanning.set(false);
        });
    };

    // ── Listen start ─────────────────────────────────────────────────────────

    let handle_listen_start = move |_| {
        listening.set(true);
        error.set(None);
        transcript.set(String::new());
        cue_count.set(0);
        skills.set(vec![]);
        current_document.set(String::new());
        status.set("Connecting to video captions...".to_string());

        spawn_local(async move {
            let msg = serde_json::json!({ "type": "LEARN_LISTEN_START" });
            match send_message_to_background(msg).await {
                Ok(resp) => {
                    if resp.get("success").and_then(|v| v.as_bool()).unwrap_or(false) {
                        let data = resp.get("data").cloned().unwrap_or(serde_json::Value::Null);
                        let has_caps = data
                            .get("hasCaptions")
                            .and_then(|v| v.as_bool())
                            .unwrap_or(false);
                        let vc = data.get("videoCount").and_then(|v| v.as_i64()).unwrap_or(0)
                            as i32;
                        listen_has_captions.set(has_caps);
                        listen_video_count.set(vc);
                        current_mode.set("listen".to_string());
                        if has_caps {
                            status.set(format!("Listening — {vc} video(s) with captions active."));
                        } else if vc > 0 {
                            status.set(format!(
                                "{vc} video(s) found but no captions. Enable subtitles on the video first."
                            ));
                        } else {
                            status.set("No videos found on this page.".to_string());
                        }
                        start_transcript_poll(listening, transcript, cue_count);
                    } else {
                        let e = resp
                            .get("error")
                            .and_then(|v| v.as_str())
                            .unwrap_or("Could not start listener")
                            .to_string();
                        error.set(Some(e));
                        listening.set(false);
                        status.set(String::new());
                    }
                }
                Err(e) => {
                    error.set(Some(format!("Connection error: {e}")));
                    listening.set(false);
                    status.set(String::new());
                }
            }
        });
    };

    // ── Listen stop ──────────────────────────────────────────────────────────

    let handle_listen_stop = move |_| {
        listening.set(false);
        status.set("Stopping listener...".to_string());

        spawn_local(async move {
            let msg = serde_json::json!({ "type": "LEARN_LISTEN_STOP" });
            match send_message_to_background(msg).await {
                Ok(resp) => {
                    if resp.get("success").and_then(|v| v.as_bool()).unwrap_or(false) {
                        let data = resp.get("data").cloned().unwrap_or(serde_json::Value::Null);
                        let tx = data
                            .get("transcript")
                            .and_then(|v| v.as_str())
                            .unwrap_or("")
                            .to_string();
                        let cc = data
                            .get("cueCount")
                            .and_then(|v| v.as_u64())
                            .unwrap_or(0) as usize;
                        let tab_title = data
                            .get("tabTitle")
                            .and_then(|v| v.as_str())
                            .unwrap_or("")
                            .to_string();
                        let tab_url = data
                            .get("tabUrl")
                            .and_then(|v| v.as_str())
                            .unwrap_or("")
                            .to_string();
                        transcript.set(tx.clone());
                        cue_count.set(cc);
                        if !tab_title.is_empty() {
                            current_title.set(tab_title);
                        }
                        if !tab_url.is_empty() {
                            current_url.set(tab_url);
                        }
                        if !tx.is_empty() {
                            status.set(format!("Captured {cc} captions. Ready to assemble."));
                        } else {
                            status.set("No captions captured.".to_string());
                        }
                    } else {
                        let e = resp
                            .get("error")
                            .and_then(|v| v.as_str())
                            .unwrap_or("Stop failed")
                            .to_string();
                        error.set(Some(e));
                        status.set(String::new());
                    }
                }
                Err(e) => {
                    error.set(Some(format!("Connection error: {e}")));
                    status.set(String::new());
                }
            }
        });
    };

    // ── Assemble document from transcript ────────────────────────────────────

    let handle_assemble_doc = move |_| {
        let tx = transcript.get();
        if tx.trim().is_empty() {
            error.set(Some("No transcript to assemble — capture some captions first.".to_string()));
            return;
        }
        scanning.set(true);
        error.set(None);
        status.set("Assembling document from transcript...".to_string());

        let title = current_title.get();
        let url = current_url.get();
        spawn_local(async move {
            let combined = format!("Title: {title}\nURL: {url}\n\nVideo Transcript:\n\n{tx}");
            let msg = serde_json::json!({ "type": "LEARN_GENERATE_DOC", "content": combined });
            match send_message_to_background(msg).await {
                Ok(resp) => {
                    if resp.get("success").and_then(|v| v.as_bool()).unwrap_or(false) {
                        let content = resp
                            .get("data")
                            .and_then(|d| d.get("content"))
                            .and_then(|v| v.as_str())
                            .unwrap_or("")
                            .to_string();
                        current_document.set(content);
                        status.set("Document assembled.".to_string());
                    } else {
                        let e = resp
                            .get("error")
                            .and_then(|v| v.as_str())
                            .unwrap_or("Assembly failed")
                            .to_string();
                        error.set(Some(e));
                        status.set(String::new());
                    }
                }
                Err(e) => {
                    error.set(Some(format!("Connection error: {e}")));
                    status.set(String::new());
                }
            }
            scanning.set(false);
        });
    };

    // ── Generate skills ───────────────────────────────────────────────────────

    let handle_generate_skills = move |_| {
        let doc = current_document.get();
        if doc.trim().is_empty() {
            error.set(Some(
                "No document yet — scan a page or assemble a transcript first.".to_string(),
            ));
            return;
        }
        generating_skills.set(true);
        error.set(None);
        status.set("Generating skills from document...".to_string());

        spawn_local(async move {
            let msg = serde_json::json!({ "type": "LEARN_GENERATE_SKILLS", "content": doc });
            match send_message_to_background(msg).await {
                Ok(resp) => {
                    if resp.get("success").and_then(|v| v.as_bool()).unwrap_or(false) {
                        let data = resp.get("data").cloned().unwrap_or(serde_json::Value::Null);
                        match serde_json::from_value::<LearnSkillsData>(data) {
                            Ok(d) => {
                                skills.set(d.skills);
                                status.set("Skills generated.".to_string());
                            }
                            Err(e) => {
                                error.set(Some(format!("Parse error: {e}")));
                                status.set(String::new());
                            }
                        }
                    } else {
                        let e = resp
                            .get("error")
                            .and_then(|v| v.as_str())
                            .unwrap_or("Skills generation failed")
                            .to_string();
                        error.set(Some(e));
                        status.set(String::new());
                    }
                }
                Err(e) => {
                    error.set(Some(format!("Connection error: {e}")));
                    status.set(String::new());
                }
            }
            generating_skills.set(false);
        });
    };

    // ── Save session ──────────────────────────────────────────────────────────

    let handle_save = move |_| {
        let doc = current_document.get();
        if doc.is_empty() {
            error.set(Some("Nothing to save — scan or listen to a page first.".to_string()));
            return;
        }
        saving.set(true);
        let skill_values: Vec<serde_json::Value> = skills
            .get()
            .into_iter()
            .map(|sk| serde_json::to_value(sk).unwrap_or(serde_json::Value::Null))
            .collect();
        let session_payload = serde_json::json!({
            "url": current_url.get(),
            "title": current_title.get(),
            "mode": current_mode.get(),
            "document": doc,
            "rawText": transcript.get(),
            "skills": skill_values,
        });
        spawn_local(async move {
            let msg =
                serde_json::json!({ "type": "LEARN_SESSION_SAVE", "session": session_payload });
            match send_message_to_background(msg).await {
                Ok(resp) => {
                    if resp.get("success").and_then(|v| v.as_bool()).unwrap_or(false) {
                        status.set("Session saved.".to_string());
                    } else {
                        let e = resp
                            .get("error")
                            .and_then(|v| v.as_str())
                            .unwrap_or("Save failed")
                            .to_string();
                        error.set(Some(e));
                    }
                }
                Err(e) => error.set(Some(format!("Connection error: {e}"))),
            }
            saving.set(false);
        });
    };

    // ── Load sessions list ────────────────────────────────────────────────────

    let handle_sessions_tab = move |_| {
        subtab.set("sessions".to_string());
        sessions_loading.set(true);
        spawn_local(async move {
            let msg = serde_json::json!({ "type": "LEARN_SESSION_LIST" });
            match send_message_to_background(msg).await {
                Ok(resp) => {
                    if resp.get("success").and_then(|v| v.as_bool()).unwrap_or(false) {
                        let data = resp.get("data").cloned().unwrap_or(serde_json::Value::Null);
                        match serde_json::from_value::<LearnSessionsData>(data) {
                            Ok(d) => sessions.set(d.sessions),
                            Err(e) => error.set(Some(format!("Parse error: {e}"))),
                        }
                    }
                }
                Err(e) => error.set(Some(format!("Connection error: {e}"))),
            }
            sessions_loading.set(false);
        });
    };

    // ── View ─────────────────────────────────────────────────────────────────

    view! {
        <div class="learn-panel">
            <h2 class="learn-title">"📖 Learn"</h2>

            // Sub-tab bar
            <div class="learn-tabs">
                <button
                    class="learn-tab"
                    class:active=move || subtab.get() == "scan"
                    on:click=move |_| subtab.set("scan".to_string())
                >
                    "⊙ Scan"
                </button>
                <button
                    class="learn-tab"
                    class:active=move || subtab.get() == "listen"
                    on:click=move |_| subtab.set("listen".to_string())
                >
                    "◑ Listen"
                </button>
                <button
                    class="learn-tab"
                    class:active=move || subtab.get() == "sessions"
                    on:click=handle_sessions_tab
                >
                    "◧ Sessions"
                </button>
            </div>

            // Error banner
            {move || {
                error.get().map(|err| {
                    view! {
                        <div class="learn-error">
                            <span>{err}</span>
                            <button
                                class="learn-error-close"
                                on:click=move |_| error.set(None)
                            >
                                "×"
                            </button>
                        </div>
                    }
                })
            }}

            // Status line
            {move || {
                let s = status.get();
                if s.is_empty() {
                    None
                } else {
                    Some(view! { <div class="learn-status">{s}</div> })
                }
            }}

            // ── Scan sub-tab ─────────────────────────────────────────────────
            {move || {
                (subtab.get() == "scan").then(|| {
                    view! {
                        <div class="learn-section">
                            <div class="learn-scan-grid">
                                // Standard scan
                                <div class="learn-scan-option">
                                    <div class="learn-scan-option-header">
                                        <span class="learn-scan-icon">"⊙"</span>
                                        <span class="learn-scan-label">"Scan"</span>
                                    </div>
                                    <p class="learn-scan-desc">
                                        "Extracts page text and assembles a structured document."
                                    </p>
                                    <button
                                        class="learn-action-btn"
                                        on:click=handle_scan
                                        disabled=move || scanning.get() || deep_scanning.get()
                                    >
                                        {move || if scanning.get() { "Scanning..." } else { "Scan Page" }}
                                    </button>
                                </div>

                                // Deep scan
                                <div class="learn-scan-option learn-scan-option-deep">
                                    <div class="learn-scan-option-header">
                                        <span class="learn-scan-icon">"◎"</span>
                                        <span class="learn-scan-label">"Deep Scan"</span>
                                    </div>
                                    <p class="learn-scan-desc">
                                        "Drills into buttons, forms, links, and inspects every URL's status end-to-end."
                                    </p>
                                    <button
                                        class="learn-deep-scan-btn"
                                        on:click=handle_deep_scan
                                        disabled=move || scanning.get() || deep_scanning.get()
                                    >
                                        {move || {
                                            if deep_scanning.get() {
                                                "Scanning..."
                                            } else {
                                                "Deep Scan"
                                            }
                                        }}
                                    </button>
                                </div>
                            </div>

                            // Deep scan metadata bar
                            {move || {
                                let meta = deep_meta.get();
                                if meta.is_empty() {
                                    None
                                } else {
                                    Some(view! {
                                        <div class="learn-deep-meta">{meta}</div>
                                    })
                                }
                            }}

                            // URL report table
                            {move || {
                                let report = url_report.get();
                                if report.is_empty() {
                                    None
                                } else {
                                    Some(view! {
                                        <div class="learn-url-report">
                                            <div class="learn-url-report-header">
                                                <span class="learn-url-report-title">"URL Status Report"</span>
                                                <span class="learn-url-count">{report.len()} " checked"</span>
                                            </div>
                                            <div class="learn-url-list">
                                                <For
                                                    each=move || url_report.get()
                                                    key=|r| r.url.clone()
                                                    children=move |r| {
                                                        let status_class = if r.status == 0 || r.status >= 400 {
                                                            "url-status-err"
                                                        } else if r.status >= 300 {
                                                            "url-status-redirect"
                                                        } else {
                                                            "url-status-ok"
                                                        };
                                                        let icon = if r.status == 0 || r.status >= 400 { "✗" }
                                                            else if r.status >= 300 { "↪" }
                                                            else { "✓" };
                                                        let ct = if r.content_type.is_empty() {
                                                            String::new()
                                                        } else {
                                                            format!(" · {}", r.content_type)
                                                        };
                                                        let err_text = r.error.clone().unwrap_or_default();
                                                        let redirect_text = r.final_url.clone().map(|u| format!(" → {u}")).unwrap_or_default();
                                                        // Trim URL for display
                                                        let display_url = r.url.trim_start_matches("https://")
                                                            .trim_start_matches("http://")
                                                            .to_string();
                                                        let display_url = if display_url.len() > 55 {
                                                            format!("{}…", &display_url[..55])
                                                        } else {
                                                            display_url
                                                        };
                                                        view! {
                                                            <div class=format!("learn-url-row {status_class}")>
                                                                <span class="url-icon">{icon}</span>
                                                                <span class="url-code">{r.status}</span>
                                                                <span class="url-path">{display_url}</span>
                                                                <span class="url-ct">{ct}{redirect_text}{err_text}</span>
                                                            </div>
                                                        }
                                                    }
                                                />
                                            </div>
                                        </div>
                                    })
                                }
                            }}
                        </div>
                    }
                })
            }}

            // ── Listen sub-tab ───────────────────────────────────────────────
            {move || {
                (subtab.get() == "listen").then(|| {
                    view! {
                        <div class="learn-section">
                            <p class="learn-description">
                                "Silently capture live video captions in real-time. Works on any tab with subtitles enabled — YouTube, Vimeo, Coursera, and more."
                            </p>
                            <div class="learn-listen-controls">
                                {move || {
                                    if !listening.get() {
                                        view! {
                                            <button
                                                class="learn-action-btn"
                                                on:click=handle_listen_start
                                            >
                                                "◑ Start Listening"
                                            </button>
                                        }
                                        .into_any()
                                    } else {
                                        view! {
                                            <div class="learn-live-row">
                                                <div class="learn-live-indicator">
                                                    <span class="learn-live-dot"></span>
                                                    <span class="learn-live-label">"LIVE"</span>
                                                </div>
                                                <button
                                                    class="learn-stop-btn"
                                                    on:click=handle_listen_stop
                                                >
                                                    "⏹ Stop"
                                                </button>
                                            </div>
                                        }
                                        .into_any()
                                    }
                                }}
                            </div>

                            // Transcript box (visible once cues accumulate)
                            {move || {
                                (cue_count.get() > 0).then(|| {
                                    let tx = transcript.get();
                                    let cc = cue_count.get();
                                    view! {
                                        <div class="learn-transcript-box">
                                            <div class="learn-transcript-header">
                                                <span class="learn-transcript-label">
                                                    "Live Transcript"
                                                </span>
                                                <span class="learn-cue-badge">
                                                    {cc} " cues"
                                                </span>
                                            </div>
                                            <div class="learn-transcript-text">{tx}</div>
                                        </div>
                                        <button
                                            class="learn-secondary-btn"
                                            on:click=handle_assemble_doc
                                            disabled=move || scanning.get()
                                        >
                                            {move || {
                                                if scanning.get() {
                                                    "Assembling..."
                                                } else {
                                                    "◫ Assemble Document"
                                                }
                                            }}
                                        </button>
                                    }
                                })
                            }}

                            // No-captions hint
                            {move || {
                                (!listen_has_captions.get()
                                    && listen_video_count.get() > 0
                                    && !listening.get()
                                    && cue_count.get() == 0)
                                    .then(|| {
                                        view! {
                                            <div class="learn-hint">
                                                "⚠ No captions detected. Enable subtitles on the video, then try listening again."
                                            </div>
                                        }
                                    })
                            }}
                        </div>
                    }
                })
            }}

            // ── Sessions sub-tab ─────────────────────────────────────────────
            {move || {
                (subtab.get() == "sessions").then(|| {
                    view! {
                        <div class="learn-section">
                            {move || {
                                if sessions_loading.get() {
                                    view! { <div class="learn-loading">"Loading sessions..."</div> }
                                        .into_any()
                                } else if sessions.get().is_empty() {
                                    view! {
                                        <div class="learn-empty">
                                            "No saved sessions yet. Scan or listen to a page and save it."
                                        </div>
                                    }
                                    .into_any()
                                } else {
                                    view! {
                                        <div class="learn-sessions-list">
                                            <For
                                                each=move || sessions.get()
                                                key=|s| s.id.clone()
                                                children=move |s| {
                                                    let doc = s.document.clone();
                                                    let url = s.url.clone();
                                                    let title = s.title.clone();
                                                    let mode = s.mode.clone();
                                                    let raw = s.raw_text.clone();
                                                    let sk = s.skills.clone();
                                                    let s_id_del = s.id.clone();
                                                    let skill_count = s.skills.len();
                                                    let mode_badge = s.mode.clone();
                                                    let title_display = s.title.clone();
                                                    let url_display = s.url.clone();
                                                    let is_scan = mode_badge == "scan";
                                                    view! {
                                                        <div class="learn-session-card">
                                                            <div class="learn-session-header">
                                                                <span
                                                                    class="learn-session-badge"
                                                                    class:badge-blue=move || is_scan
                                                                    class:badge-purple=move || !is_scan
                                                                >
                                                                    {mode_badge.clone()}
                                                                </span>
                                                                <button
                                                                    class="learn-session-delete"
                                                                    on:click=move |_| {
                                                                        let id = s_id_del.clone();
                                                                        let sessions = sessions;
                                                                        let error = error;
                                                                        spawn_local(async move {
                                                                            let msg = serde_json::json!({
                                                                                "type": "LEARN_SESSION_DELETE",
                                                                                "sessionId": id
                                                                            });
                                                                            match send_message_to_background(
                                                                                msg,
                                                                            )
                                                                            .await
                                                                            {
                                                                                Ok(resp) => {
                                                                                    if resp
                                                                                        .get("success")
                                                                                        .and_then(|v| v.as_bool())
                                                                                        .unwrap_or(false)
                                                                                    {
                                                                                        sessions.update(|list| {
                                                                                            list.retain(|s| {
                                                                                                s.id != id
                                                                                            })
                                                                                        });
                                                                                    }
                                                                                }
                                                                                Err(e) => error.set(Some(
                                                                                    format!("Connection error: {e}"),
                                                                                )),
                                                                            }
                                                                        });
                                                                    }
                                                                >
                                                                    "×"
                                                                </button>
                                                            </div>
                                                            <div
                                                                class="learn-session-title"
                                                                on:click=move |_| {
                                                                    current_document.set(doc.clone());
                                                                    current_url.set(url.clone());
                                                                    current_title.set(title.clone());
                                                                    current_mode.set(mode.clone());
                                                                    transcript.set(raw.clone());
                                                                    skills.set(sk.clone());
                                                                    subtab.set("scan".to_string());
                                                                    status.set(format!(
                                                                        "Loaded: {}",
                                                                        title.clone()
                                                                    ));
                                                                }
                                                            >
                                                                {title_display}
                                                            </div>
                                                            <div class="learn-session-url">
                                                                {url_display}
                                                            </div>
                                                            <div class="learn-session-meta">
                                                                {format!("{skill_count} skills")}
                                                            </div>
                                                        </div>
                                                    }
                                                }
                                            />
                                        </div>
                                    }
                                    .into_any()
                                }
                            }}
                        </div>
                    }
                })
            }}

            // ── Assembled document ────────────────────────────────────────────
            {move || {
                let doc = current_document.get();
                let title = current_title.get();
                if doc.is_empty() {
                    None
                } else {
                    Some(view! {
                        <div class="learn-document-section">
                            <div class="learn-document-header">
                                {if !title.is_empty() {
                                    Some(view! {
                                        <div class="learn-document-title">{title}</div>
                                    })
                                } else {
                                    None
                                }}
                                <div class="learn-document-actions">
                                    <button
                                        class="learn-secondary-btn"
                                        on:click=handle_generate_skills
                                        disabled=move || generating_skills.get()
                                    >
                                        {move || {
                                            if generating_skills.get() {
                                                "Generating..."
                                            } else {
                                                "✦ Generate Skills"
                                            }
                                        }}
                                    </button>
                                    <button
                                        class="learn-secondary-btn"
                                        on:click=handle_save
                                        disabled=move || saving.get()
                                    >
                                        {move || if saving.get() { "Saving..." } else { "✦ Save" }}
                                    </button>
                                </div>
                            </div>
                            <div class="learn-document-body">
                                <pre class="learn-document-text">{doc}</pre>
                            </div>
                        </div>
                    })
                }
            }}

            // ── Skills panel ──────────────────────────────────────────────────
            {move || {
                let skill_list = skills.get();
                if skill_list.is_empty() {
                    None
                } else {
                    Some(view! {
                        <div class="learn-skills-section">
                            <h3 class="learn-skills-title">"✦ Generated Skills"</h3>
                            <div class="learn-skills-list">
                                <For
                                    each=move || skills.get()
                                    key=|s| s.title.clone()
                                    children=move |skill| {
                                        let type_class = match skill.skill_type.as_str() {
                                            "summary" => "skill-type-summary",
                                            "how-to" => "skill-type-howto",
                                            "concept" => "skill-type-concept",
                                            "application" => "skill-type-application",
                                            "practice" => "skill-type-practice",
                                            _ => "skill-type-generic",
                                        };
                                        let steps = skill.steps.clone();
                                        let tags = skill.tags.clone();
                                        view! {
                                            <div class=format!("learn-skill-card {type_class}")>
                                                <div class="skill-header">
                                                    <span class="skill-type-badge">
                                                        {skill.skill_type.clone()}
                                                    </span>
                                                    <span class="skill-title">
                                                        {skill.title.clone()}
                                                    </span>
                                                </div>
                                                <p class="skill-description">
                                                    {skill.description.clone()}
                                                </p>
                                                {if !steps.is_empty() {
                                                    Some(view! {
                                                        <ol class="skill-steps">
                                                            {steps
                                                                .into_iter()
                                                                .map(|step| {
                                                                    view! {
                                                                        <li class="skill-step">
                                                                            {step}
                                                                        </li>
                                                                    }
                                                                })
                                                                .collect::<Vec<_>>()}
                                                        </ol>
                                                    })
                                                } else {
                                                    None
                                                }}
                                                {if !tags.is_empty() {
                                                    Some(view! {
                                                        <div class="skill-tags">
                                                            {tags
                                                                .into_iter()
                                                                .map(|tag| {
                                                                    view! {
                                                                        <span class="skill-tag">
                                                                            {tag}
                                                                        </span>
                                                                    }
                                                                })
                                                                .collect::<Vec<_>>()}
                                                        </div>
                                                    })
                                                } else {
                                                    None
                                                }}
                                            </div>
                                        }
                                    }
                                />
                            </div>
                        </div>
                    })
                }
            }}
        </div>
    }
}

// ── Transcript polling ────────────────────────────────────────────────────────
// Polls the background every 2s while listening is active to update the transcript.

fn start_transcript_poll(
    listening: RwSignal<bool>,
    transcript: RwSignal<String>,
    cue_count: RwSignal<usize>,
) {
    spawn_local(async move {
        loop {
            if !listening.get_untracked() {
                break;
            }
            let msg = serde_json::json!({ "type": "LEARN_GET_CAPTION" });
            if let Ok(resp) = send_message_to_background(msg).await {
                if resp.get("success").and_then(|v| v.as_bool()).unwrap_or(false) {
                    if let Some(data) = resp.get("data") {
                        let tx = data
                            .get("transcript")
                            .and_then(|v| v.as_str())
                            .unwrap_or("")
                            .to_string();
                        let cc =
                            data.get("cueCount").and_then(|v| v.as_u64()).unwrap_or(0) as usize;
                        if cc > cue_count.get_untracked() {
                            transcript.set(tx);
                            cue_count.set(cc);
                        }
                    }
                }
            }
            sleep_ms(2000).await;
        }
    });
}

// ── Utilities ─────────────────────────────────────────────────────────────────

async fn sleep_ms(ms: u32) {
    let promise = Promise::new(&mut |resolve, _| {
        web_sys::window()
            .expect("no window")
            .set_timeout_with_callback_and_timeout_and_arguments_0(&resolve, ms as i32)
            .expect("set_timeout failed");
    });
    let _ = JsFuture::from(promise).await;
}

async fn send_message_to_background(
    message: serde_json::Value,
) -> Result<serde_json::Value, String> {
    #[wasm_bindgen]
    extern "C" {
        #[wasm_bindgen(js_namespace = globalThis, js_name = sueRequestJson, catch)]
        fn sue_request_json(message_json: &str) -> Result<js_sys::Promise, JsValue>;
    }

    let message_json = serde_json::to_string(&message).map_err(|e| e.to_string())?;
    let promise = sue_request_json(&message_json)
        .map_err(|e| format!("Failed to call background: {e:?}"))?;
    let js_val = JsFuture::from(promise)
        .await
        .map_err(|e| format!("Promise rejected: {e:?}"))?;
    serde_wasm_bindgen::from_value(js_val).map_err(|e| e.to_string())
}
