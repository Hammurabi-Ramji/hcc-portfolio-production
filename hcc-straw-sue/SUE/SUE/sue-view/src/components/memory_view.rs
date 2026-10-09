use leptos::prelude::*;
use serde::{ Deserialize, Serialize };
use serde_json::{ json, Map };
use wasm_bindgen_futures::spawn_local;
use chrono::{ DateTime, Utc };

use super::primitives::Spinner;

// ── Data structures ───────────────────────────────────────────

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
pub struct MemoryObject {
  pub id: String,
  pub url: String,
  pub title: String,
  pub content_text: Option<String>,
  pub content_images: Vec<String>,
  pub content_videos: Vec<String>,
  pub captured_at: i64,
  pub tags: Vec<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
pub struct VectorMemoryObject {
  pub id: String,
  pub text: String,
  pub source: String,
  #[serde(rename = "sessionId")]
  pub session_id: String,
  pub timestamp: i64,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum MemoryTab {
  Pages,
  Vectors,
}

// ── Component ─────────────────────────────────────────────────

#[component]
pub fn MemoryView() -> impl IntoView {
  let memories = RwSignal::new(Vec::<MemoryObject>::new());
  let vector_memories = RwSignal::new(Vec::<VectorMemoryObject>::new());
  let loading = RwSignal::new(true);
  let error = RwSignal::new(None::<String>);
  let feedback = RwSignal::new(None::<(bool, String)>);
  let active_tab = RwSignal::new(MemoryTab::Pages);
  let query = RwSignal::new(String::new());
  let compacting = RwSignal::new(false);

  let fetch_all = move || {
    loading.set(true);
    error.set(None);
    feedback.set(None);
    compacting.set(false);
    spawn_local(async move {
      match crate::request_data::<Vec<MemoryObject>>("MEMORY_LIST", Map::new()).await {
        Ok(loaded) => memories.set(loaded),
        Err(e) => error.set(Some(format!("Pages: {}", e))),
      }
      let mut fields = Map::new();
      fields.insert("limit".to_string(), json!(500));
      match crate::request_data::<Vec<VectorMemoryObject>>("MEMORY_VECTOR_LIST", fields).await {
        Ok(loaded) => vector_memories.set(loaded),
        Err(e) => {
          let prev = error.get_untracked().unwrap_or_default();
          error.set(Some(if prev.is_empty() {
            format!("Vectors: {}", e)
          } else {
            format!("{} | Vectors: {}", prev, e)
          }));
        }
      }
      loading.set(false);
    });
  };

  let delete_memory = move |id: String| {
    spawn_local(async move {
      let mut fields = Map::new();
      fields.insert("memoryId".into(), json!(id));
      let _ = crate::request_action("MEMORY_DELETE", fields).await;
      fetch_all();
    });
  };

  let compact = move |_| {
    compacting.set(true);
    feedback.set(None);
    spawn_local(async move {
      match crate::request_action("MEMORY_VECTOR_COMPACT", Map::new()).await {
        Ok(_) => { feedback.set(Some((true, "Vector memory compacted.".into()))); fetch_all(); }
        Err(e) => { feedback.set(Some((false, format!("Compact failed: {}", e)))); compacting.set(false); }
      }
    });
  };

  let clear_vectors = move |_| {
    compacting.set(true);
    feedback.set(None);
    spawn_local(async move {
      match crate::request_action("MEMORY_VECTOR_CLEAR", Map::new()).await {
        Ok(_) => { feedback.set(Some((true, "Vector memory cleared.".into()))); fetch_all(); }
        Err(e) => { feedback.set(Some((false, format!("Clear failed: {}", e)))); compacting.set(false); }
      }
    });
  };

  fetch_all();

  view! {
    <section class="memory-view">

      <div class="view-header">
        <h2>"RAMemory"</h2>
        <button class="btn-ghost" on:click=move |_| fetch_all()>"Refresh"</button>
      </div>

      <div class="quick-stats" style="margin-bottom:12px;">
        <div class="stat-card">
          <h4>"Pages"</h4>
          <p class="value">{move || memories.get().len()}</p>
        </div>
        <div class="stat-card">
          <h4>"Vectors"</h4>
          <p class="value">{move || vector_memories.get().len()}</p>
        </div>
        <div class="stat-card">
          <h4>"Matches"</h4>
          <p class="value">{move || {
            let q = query.get().to_lowercase();
            if q.is_empty() { memories.get().len() }
            else { memories.get().into_iter().filter(|m| memory_matches(m, &q)).count() }
          }}</p>
        </div>
      </div>

      <div style="position:relative;margin-bottom:10px;">
        <input
          class="search-input"
          style="width:100%;"
          prop:value=move || query.get()
          on:input=move |ev| query.set(event_target_value(&ev))
          placeholder="Search title, URL, domain, tag, or content…"
        />
      </div>

      <div class="kanban-col-header" style="margin-bottom:10px;gap:8px;">
        <button class="btn-ghost" class:active=move || active_tab.get() == MemoryTab::Pages
          style="flex:1;" on:click=move |_| active_tab.set(MemoryTab::Pages)>
          "Captured Pages"
        </button>
        <button class="btn-ghost" class:active=move || active_tab.get() == MemoryTab::Vectors
          style="flex:1;" on:click=move |_| active_tab.set(MemoryTab::Vectors)>
          "Semantic Vectors"
        </button>
      </div>

      {move || feedback.get().map(|(ok, msg)| view! {
        <p class="description"
          style=move || format!("margin-bottom:8px;color:var(--{});", if ok {"green"} else {"red"})>
          {msg}
        </p>
      })}
      {move || error.get().map(|msg| view! {
        <p class="form-error" style="margin-bottom:8px;">{msg}</p>
      })}

      {move || if loading.get() {
        view! { <div class="loading-view"><Spinner size="lg".into() /></div> }.into_any()
      } else if active_tab.get() == MemoryTab::Pages {
        let q = query.get().to_lowercase();
        let filtered: Vec<MemoryObject> = memories.get()
          .into_iter().filter(|m| q.is_empty() || memory_matches(m, &q)).collect();

        if filtered.is_empty() {
          view! {
            <div class="empty-state">
              <div class="empty-icon">"🧠"</div>
              <p class="empty-message">{if query.get().is_empty() { "No pages captured yet." } else { "No pages match your search." }}</p>
              <p class="description">"Capture pages from the ⬡ Home tab."</p>
            </div>
          }.into_any()
        } else {
          view! {
            <div class="memory-list">
              {filtered.into_iter().map(|memory| {
                let domain = extract_domain(&memory.url);
                let preview = content_preview(&memory.content_text, 140);
                let date = format_ts(memory.captured_at);
                let img_count = memory.content_images.len();
                let vid_count = memory.content_videos.len();
                let mem_id = memory.id.clone();
                view! {
                  <div class="memory-card">
                    <div class="memory-card-header">
                      <span class="memory-domain">{domain}</span>
                      <div style="display:flex;align-items:center;gap:6px;">
                        <span class="memory-date">{date}</span>
                        <button class="icon-btn danger" style="font-size:10px;padding:1px 5px;"
                          title="Delete memory"
                          on:click=move |_| delete_memory(mem_id.clone())
                        >"✕"</button>
                      </div>
                    </div>
                    <p class="memory-title">{memory.title.clone()}</p>
                    {(!preview.is_empty()).then(|| view! {
                      <p class="memory-preview">{preview}</p>
                    })}
                    <div class="memory-meta">
                      {memory.tags.iter().map(|tag| view! {
                        <span class="cloud-chip">{tag.clone()}</span>
                      }).collect::<Vec<_>>()}
                      {((img_count + vid_count) > 0).then(|| view! {
                        <span class="cloud-chip">{format!("{}🖼 {}▶", img_count, vid_count)}</span>
                      })}
                    </div>
                  </div>
                }
              }).collect::<Vec<_>>()}
            </div>
          }.into_any()
        }
      } else {
        let vq = query.get().to_lowercase();
        let filtered_v: Vec<VectorMemoryObject> = vector_memories.get()
          .into_iter()
          .filter(|v| vq.is_empty()
            || v.text.to_lowercase().contains(&vq)
            || v.source.to_lowercase().contains(&vq))
          .collect();

        view! {
          <>
            <div class="health-card" style="margin-bottom:10px;">
              <h4>"Vector Store"</h4>
              <p class="description">
                {format!("{} semantic records — used as AI context when you chat.", vector_memories.get().len())}
              </p>
              <div class="inline-form-actions" style="margin-top:8px;">
                <button class="btn-ghost" on:click=compact prop:disabled=move || compacting.get()>
                  {move || if compacting.get() { "Working…" } else { "Compact" }}
                </button>
                <button class="btn-ghost" style="color:var(--red);" on:click=clear_vectors prop:disabled=move || compacting.get()>
                  "Clear all"
                </button>
              </div>
            </div>

            {if filtered_v.is_empty() {
              view! {
                <div class="empty-state">
                  <p class="empty-message">{if vq.is_empty() { "No vector records yet." } else { "No vectors match." }}</p>
                </div>
              }.into_any()
            } else {
              view! {
                <div class="memory-list">
                  {filtered_v.into_iter().map(|v| {
                    let src = extract_domain(&v.source);
                    let date = format_ts(v.timestamp);
                    let snippet = if v.text.len() > 120 { format!("{}…", &v.text[..120]) } else { v.text.clone() };
                    view! {
                      <div class="memory-card" style="opacity:0.9;">
                        <div class="memory-card-header">
                          <span class="memory-domain">{src}</span>
                          <span class="memory-date">{date}</span>
                        </div>
                        <p class="memory-preview">{snippet}</p>
                      </div>
                    }
                  }).collect::<Vec<_>>()}
                </div>
              }.into_any()
            }}
          </>
        }.into_any()
      }}
    </section>
  }
}

// ── Helpers ───────────────────────────────────────────────────

fn memory_matches(m: &MemoryObject, q: &str) -> bool {
  m.title.to_lowercase().contains(q)
    || m.url.to_lowercase().contains(q)
    || extract_domain(&m.url).to_lowercase().contains(q)
    || m.tags.iter().any(|t| t.to_lowercase().contains(q))
    || m.content_text.as_deref().map(|t| t.to_lowercase().contains(q)).unwrap_or(false)
}

fn extract_domain(url: &str) -> String {
  url.split("://")
    .nth(1)
    .and_then(|s| s.split('/').next())
    .map(|h| {
      let h = h.split(':').next().unwrap_or(h);
      if let Some(stripped) = h.strip_prefix("www.") { stripped } else { h }
    })
    .unwrap_or(url)
    .to_string()
}

fn content_preview(text: &Option<String>, max_len: usize) -> String {
  text.as_deref().map(|t| {
    let clean: String = t.split_whitespace().collect::<Vec<_>>().join(" ");
    if clean.len() > max_len {
      let end = clean.char_indices().map(|(i, _)| i).take_while(|&i| i <= max_len).last().unwrap_or(max_len);
      format!("{}…", &clean[..end])
    } else {
      clean
    }
  }).unwrap_or_default()
}

fn format_ts(raw: i64) -> String {
  let seconds = if raw > 10_000_000_000 { raw / 1000 } else { raw };
  DateTime::<Utc>::from_timestamp(seconds, 0)
    .map(|dt| dt.format("%b %d, %H:%M").to_string())
    .unwrap_or_else(|| "Unknown".into())
}
