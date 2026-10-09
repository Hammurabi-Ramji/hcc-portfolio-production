//! Notes / Quick-Jot, Clipboard Manager, Tab Manager, Settings

use leptos::prelude::*;
use crate::components::primitives::{
    Accordion, Badge, EmptyState, SearchBar, Toast, ToastContainer, ToastKind, Toggle, Tooltip,
};

// ══════════════════════════════════════════════════════════════
// NOTES / QUICK JOT
// ══════════════════════════════════════════════════════════════

#[derive(Clone, Debug)]
pub struct Note {
    pub id:      u32,
    pub title:   String,
    pub body:    String,
    pub pinned:  bool,
    pub tag:     Option<String>,
}

#[component]
pub fn NotesView() -> impl IntoView {
    let notes   = RwSignal::new(vec![
        Note { id: 1, title: "Welcome".into(), body: "Start jotting your ideas here.".into(), pinned: true,  tag: Some("info".into()) },
        Note { id: 2, title: "Todo".into(),    body: "Connect HCC API endpoints.".into(),       pinned: false, tag: Some("work".into()) },
    ]);
    let next_id  = RwSignal::new(3_u32);
    let query    = RwSignal::new(String::new());
    let selected = RwSignal::<Option<u32>>::new(None);
    let edit_body = RwSignal::new(String::new());

    let filtered = move || {
        let q = query.get().to_lowercase();
        notes.get().into_iter().filter(move |n| {
            q.is_empty() || n.title.to_lowercase().contains(&q) || n.body.to_lowercase().contains(&q)
        }).collect::<Vec<_>>()
    };

    let open_note = move |id: u32| {
        if let Some(n) = notes.get().into_iter().find(|n| n.id == id) {
            edit_body.set(n.body.clone());
            selected.set(Some(id));
        }
    };

    let save_note = move |_| {
        if let Some(id) = selected.get() {
            notes.update(|ns| {
                if let Some(n) = ns.iter_mut().find(|n| n.id == id) {
                    n.body = edit_body.get_untracked();
                }
            });
            selected.set(None);
        }
    };

    let add_note = move |_| {
        let id = next_id.get_untracked();
        notes.update(|ns| ns.insert(0, Note {
            id, title: format!("Note {}", id), body: String::new(), pinned: false, tag: None,
        }));
        next_id.update(|n| *n += 1);
        open_note(id);
    };

    let pin_note = move |id: u32| {
        notes.update(|ns| {
            if let Some(n) = ns.iter_mut().find(|n| n.id == id) { n.pinned = !n.pinned; }
        });
    };

    let delete_note = move |id: u32| {
        notes.update(|ns| ns.retain(|n| n.id != id));
        if selected.get() == Some(id) { selected.set(None); }
    };

    view! {
        <section class="notes-view">
            <div class="view-header">
                <h2>"Quick Notes"</h2>
                <button class="btn-primary" on:click=add_note>"+ Note"</button>
            </div>

            <SearchBar query=query />

            {move || selected.get().map(|_| view! {
                <div class="note-editor">
                    <textarea
                        class="note-textarea"
                        prop:value=move || edit_body.get()
                        on:input=move |ev| edit_body.set(event_target_value(&ev))
                        placeholder="Write your note…"
                    />
                    <div class="note-editor-actions">
                        <button class="btn-primary" on:click=save_note>"Save"</button>
                        <button class="btn-ghost" on:click=move |_| selected.set(None)>"Cancel"</button>
                    </div>
                </div>
            })}

            <div class="notes-list">
                {move || {
                    let list = filtered();
                    if list.is_empty() {
                        view! { <EmptyState message="No notes found.".into() /> }.into_any()
                    } else {
                        view! {
                            <For
                                each=filtered
                                key=|n| n.id
                                children=move |n| {
                                    let id = n.id;
                                    view! {
                                        <div class="note-card" class:pinned=n.pinned>
                                            <div class="note-card-header">
                                                <span class="note-title">{n.title.clone()}</span>
                                                <div class="note-actions">
                                                    {n.tag.clone().map(|t| view! {
                                                        <Badge label=t color="purple".into() />
                                                    })}
                                                    <button class="icon-btn" title="Pin"
                                                        on:click=move |_| pin_note(id)>
                                                        {if n.pinned { "★" } else { "☆" }}
                                                    </button>
                                                    <button class="icon-btn" title="Edit"
                                                        on:click=move |_| open_note(id)>
                                                        "✎"
                                                    </button>
                                                    <button class="icon-btn danger" title="Delete"
                                                        on:click=move |_| delete_note(id)>
                                                        "✕"
                                                    </button>
                                                </div>
                                            </div>
                                            <p class="note-preview">{n.body.clone()}</p>
                                        </div>
                                    }
                                }
                            />
                        }.into_any()
                    }
                }}
            </div>
        </section>
    }
}

// ══════════════════════════════════════════════════════════════
// TAB MANAGER
// ══════════════════════════════════════════════════════════════

#[derive(Clone, Debug)]
pub struct TabEntry {
    pub id:     u32,
    pub title:  String,
    pub url:    String,
    pub active: bool,
    pub pinned: bool,
}

#[component]
pub fn TabManager() -> impl IntoView {
    let tabs = RwSignal::new(vec![
        TabEntry { id: 1, title: "HCC Dashboard".into(),  url: "https://hammurabicoding.com".into(), active: true,  pinned: true  },
        TabEntry { id: 2, title: "GitHub".into(),          url: "https://github.com".into(),          active: false, pinned: false },
        TabEntry { id: 3, title: "Koofr Storage".into(),   url: "https://app.koofr.net".into(),       active: false, pinned: false },
    ]);
    let query   = RwSignal::new(String::new());
    let toasts  = RwSignal::new(Vec::<Toast>::new());
    let toast_id = RwSignal::new(0_u32);

    let push_toast = move |msg: &str, kind: ToastKind| {
        let id = toast_id.get_untracked() + 1;
        toast_id.set(id);
        toasts.update(|v| v.push(Toast { id, message: msg.to_string(), kind }));
    };

    let filtered = move || {
        let q = query.get().to_lowercase();
        tabs.get().into_iter()
            .filter(move |t| q.is_empty() || t.title.to_lowercase().contains(&q) || t.url.to_lowercase().contains(&q))
            .collect::<Vec<_>>()
    };

    let close_tab = move |id: u32| {
        let removed = tabs.with_untracked(|ts| ts.iter().any(|t| t.id == id));
        tabs.update(|ts| ts.retain(|t| t.id != id));
        if removed {
            push_toast("Tab closed", ToastKind::Info);
        } else {
            push_toast("Tab unavailable", ToastKind::Error);
        }
    };

    let pin_tab = move |id: u32| {
        let mut now_pinned = false;
        tabs.update(|ts| {
            if let Some(t) = ts.iter_mut().find(|t| t.id == id) {
                t.pinned = !t.pinned;
                now_pinned = t.pinned;
            }
        });
        if now_pinned {
            push_toast("Tab pinned", ToastKind::Success);
        } else {
            push_toast("Tab unpinned", ToastKind::Warning);
        }
    };

    view! {
        <section class="tab-manager-view">
            <ToastContainer toasts=toasts />
            <div class="view-header">
                <h2>"Tab Manager"</h2>
                <span class="badge badge-blue">{move || format!("{} tabs", tabs.get().len())}</span>
            </div>

            <SearchBar query=query />

            <div class="tab-list">
                {move || {
                    let list = filtered();
                    if list.is_empty() {
                        view! { <EmptyState message="No tabs match your search.".into() /> }.into_any()
                    } else {
                        view! {
                            <For
                                each=filtered
                                key=|t| t.id
                                children=move |t| {
                                    let id  = t.id;
                                    view! {
                                        <div class="tab-item" class:active=t.active class:pinned=t.pinned>
                                            <div class="tab-info">
                                                <span class="tab-title">{t.title.clone()}</span>
                                                <span class="tab-url">{t.url.clone()}</span>
                                            </div>
                                            <div class="tab-actions">
                                                <Tooltip tip="Pin tab".into()>
                                                    <button class="icon-btn" title="Pin"
                                                        on:click=move |_| pin_tab(id)>
                                                        {if t.pinned { "★" } else { "☆" }}
                                                    </button>
                                                </Tooltip>
                                                <Tooltip tip="Close tab".into()>
                                                    <button class="icon-btn danger" title="Close"
                                                        on:click=move |_| close_tab(id)>
                                                        "✕"
                                                    </button>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    }
                                }
                            />
                        }.into_any()
                    }
                }}
            </div>
        </section>
    }
}

// ══════════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════════

#[component]
pub fn SettingsView() -> impl IntoView {
    let dark_mode      = RwSignal::new(true);
    let notifications  = RwSignal::new(true);
    let compact_layout = RwSignal::new(false);
    let font_size      = RwSignal::new(14_u32);
    let accent         = RwSignal::new("blue".to_string());

    let accents = [
        ("blue",   "#4a9eed"),
        ("green",  "#22c55e"),
        ("purple", "#8b5cf6"),
        ("orange", "#f59e0b"),
    ];

    view! {
        <section class="settings-view">
            <h2>"Settings"</h2>

            <Accordion title="Appearance".into() open=true>
                <div class="settings-group">
                    <Toggle checked=dark_mode label="Dark mode".into() />
                    <Toggle checked=compact_layout label="Compact layout".into() />

                    <div class="settings-row">
                        <span class="settings-label">"Font size: " {move || font_size.get()} "px"</span>
                        <input
                            type="range" min="11" max="20"
                            class="range-input"
                            prop:value=move || font_size.get().to_string()
                            on:input=move |ev| {
                                if let Ok(v) = event_target_value(&ev).parse::<u32>() {
                                    font_size.set(v);
                                }
                            }
                        />
                    </div>

                    <div class="settings-row">
                        <span class="settings-label">"Accent colour"</span>
                        <div class="accent-picker">
                            {accents.iter().map(|(name, hex)| {
                                let name = name.to_string();
                                let hex  = hex.to_string();
                                let name2 = name.clone();
                                view! {
                                    <button
                                        class="accent-swatch"
                                        class:selected=move || accent.get() == name2
                                        style=format!("background:{}", hex)
                                        title=name.clone()
                                        on:click=move |_| accent.set(name.clone())
                                    />
                                }
                            }).collect::<Vec<_>>()}
                        </div>
                    </div>
                </div>
            </Accordion>

            <Accordion title="Notifications".into()>
                <div class="settings-group">
                    <Toggle checked=notifications label="Enable notifications".into() />
                </div>
            </Accordion>

            <Accordion title="About".into()>
                <div class="settings-group about-info">
                    <p>"HCC Sidebar v4.0.0"</p>
                    <p>"Sovereign by Design"</p>
                    <p>"Built with Leptos + Rust + WASM"</p>
                </div>
            </Accordion>
        </section>
    }
}
