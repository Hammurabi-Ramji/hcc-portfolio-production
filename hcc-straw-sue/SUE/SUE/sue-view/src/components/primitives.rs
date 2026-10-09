//! Shared primitive components used across all views

use leptos::prelude::*;
#[allow(unused_imports)]
use leptos::children::ChildrenFn;

// ══════════════════════════════════════════════════════════════
// ACCORDION
// ══════════════════════════════════════════════════════════════

#[component]
pub fn Accordion(
    title: String,
    #[prop(default = false)] open: bool,
    // ChildrenFn = Fn() -> AnyView, can be called multiple times
    children: ChildrenFn,
) -> impl IntoView {
    let is_open = RwSignal::new(open);
    let toggle  = move |_| is_open.update(|o| *o = !*o);

    view! {
        <div class="accordion">
            <button class="accordion-header" on:click=toggle>
                <span>{title}</span>
                <span class="accordion-chevron"
                    class:open=move || is_open.get()>
                    "›"
                </span>
            </button>
            {move || is_open.get().then(|| view! {
                <div class="accordion-body">{children()}</div>
            })}
        </div>
    }
}

// ══════════════════════════════════════════════════════════════
// TOAST NOTIFICATION
// ══════════════════════════════════════════════════════════════

#[derive(Clone, Debug, PartialEq)]
pub enum ToastKind { Info, Success, Warning, Error }

#[derive(Clone, Debug)]
pub struct Toast {
    pub id:      u32,
    pub message: String,
    pub kind:    ToastKind,
}

#[component]
pub fn ToastContainer(toasts: RwSignal<Vec<Toast>>) -> impl IntoView {
    view! {
        <div class="toast-container">
            <For
                each=move || toasts.get()
                key=|t| t.id
                children=move |t| {
                    let id  = t.id;
                    let cls = match t.kind {
                        ToastKind::Info    => "toast toast-info",
                        ToastKind::Success => "toast toast-success",
                        ToastKind::Warning => "toast toast-warning",
                        ToastKind::Error   => "toast toast-error",
                    };
                    view! {
                        <div class=cls>
                            <span>{t.message.clone()}</span>
                            <button class="toast-close"
                                on:click=move |_| {
                                    toasts.update(|v| v.retain(|x| x.id != id));
                                }>
                                "×"
                            </button>
                        </div>
                    }
                }
            />
        </div>
    }
}

// ══════════════════════════════════════════════════════════════
// PROGRESS BAR
// ══════════════════════════════════════════════════════════════

#[component]
pub fn ProgressBar(
    /// 0–100
    value: f32,
    #[prop(default = "blue".to_string())] color: String,
    #[prop(default = false)] show_label: bool,
) -> impl IntoView {
    let pct = value.clamp(0.0, 100.0);
    view! {
        <div class="progress-wrap">
            {show_label.then(|| view! {
                <span class="progress-label">{format!("{:.0}%", pct)}</span>
            })}
            <div class="progress-track">
                <div
                    class=format!("progress-fill {}", color)
                    style=format!("width: {:.1}%", pct)
                />
            </div>
        </div>
    }
}

// ══════════════════════════════════════════════════════════════
// BADGE / TAG
// ══════════════════════════════════════════════════════════════

#[component]
pub fn Badge(
    label: String,
    #[prop(default = "blue".to_string())] color: String,
) -> impl IntoView {
    view! {
        <span class=format!("badge badge-{}", color)>{label}</span>
    }
}

// ══════════════════════════════════════════════════════════════
// TOOLTIP WRAPPER
// ══════════════════════════════════════════════════════════════

#[component]
pub fn Tooltip(tip: String, children: Children) -> impl IntoView {
    view! {
        <span class="tooltip-wrap" title=tip>
            {children()}
        </span>
    }
}

// ══════════════════════════════════════════════════════════════
// SPINNER
// ══════════════════════════════════════════════════════════════

#[component]
pub fn Spinner(#[prop(default = "sm".to_string())] size: String) -> impl IntoView {
    view! {
        <span class=format!("spinner spinner-{}", size) />
    }
}

// ══════════════════════════════════════════════════════════════
// EMPTY STATE
// ══════════════════════════════════════════════════════════════

#[component]
pub fn EmptyState(
    message: String,
    #[prop(default = None)] action_label: Option<String>,
    #[prop(default = None)] on_action: Option<Box<dyn Fn() + 'static>>,
) -> impl IntoView {
    view! {
        <div class="empty-state">
            <div class="empty-icon">"◌"</div>
            <p class="empty-message">{message}</p>
            {action_label.zip(on_action).map(|(label, cb)| view! {
                <button class="btn-ghost" on:click=move |_| cb()>{label}</button>
            })}
        </div>
    }
}

// ══════════════════════════════════════════════════════════════
// TOGGLE SWITCH
// ══════════════════════════════════════════════════════════════

#[component]
pub fn Toggle(
    checked: RwSignal<bool>,
    #[prop(default = "".to_string())] label: String,
) -> impl IntoView {
    view! {
        <label class="toggle-label">
            <input
                type="checkbox"
                class="toggle-input"
                prop:checked=move || checked.get()
                on:change=move |_| checked.update(|v| *v = !*v)
            />
            <span class="toggle-track">
                <span class="toggle-thumb" />
            </span>
            {(!label.is_empty()).then(|| view! {
                <span class="toggle-text">{label}</span>
            })}
        </label>
    }
}

// ══════════════════════════════════════════════════════════════
// SEARCH BAR
// ══════════════════════════════════════════════════════════════

#[component]
pub fn SearchBar(
    query: RwSignal<String>,
    #[prop(default = "Search…".to_string())] placeholder: String,
) -> impl IntoView {
    view! {
        <div class="search-bar">
            <span class="search-icon">"⌕"</span>
            <input
                type="search"
                class="search-input"
                placeholder=placeholder
                prop:value=move || query.get()
                on:input=move |ev| query.set(event_target_value(&ev))
            />
            {move || (!query.get().is_empty()).then(|| view! {
                <button class="search-clear"
                    on:click=move |_| query.set(String::new())>
                    "×"
                </button>
            })}
        </div>
    }
}
