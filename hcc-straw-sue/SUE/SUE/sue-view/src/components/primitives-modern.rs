//! Enhanced primitive components with modern AI-enhanced design system
//! Supports both legacy and modern CSS variants

use leptos::prelude::*;
#[allow(unused_imports)]
use leptos::children::ChildrenFn;

// ══════════════════════════════════════════════════════════════
// ACCORDION (Modern Enhanced)
// ══════════════════════════════════════════════════════════════

#[component]
pub fn Accordion(
    title: String,
    #[prop(default = false)] open: bool,
    #[prop(default = false)] modern: bool,
    children: ChildrenFn,
) -> impl IntoView {
    let is_open = RwSignal::new(open);
    let toggle  = move |_| is_open.update(|o| *o = !*o);

    view! {
        <div class="accordion" class:modern=modern>
            <button class="accordion-header" on:click=toggle>
                <span>{title}</span>
                <span class="accordion-chevron" class:open=move || is_open.get()>
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
// TOAST NOTIFICATION (Modern Enhanced)
// ══════════════════════════════════════════════════════════════

#[derive(Clone, Debug, PartialEq)]
pub enum ToastKind { Info, Success, Warning, Error, Ai }

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
                        ToastKind::Ai      => "toast toast-ai",
                    };
                    view! {
                        <div class=cls>
                            <span>{t.message.clone()}</span>
                            <button 
                                class="toast-close"
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
// PROGRESS BAR (Modern Enhanced)
// ══════════════════════════════════════════════════════════════

#[component]
pub fn ProgressBar(
    /// 0–100
    value: f32,
    #[prop(default = "blue".to_string())] color: String,
    #[prop(default = false)] show_label: bool,
    #[prop(default = false)] shimmer: bool,
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
                    class:shimmer=shimmer
                />
            </div>
        </div>
    }
}

// ══════════════════════════════════════════════════════════════
// BADGE / TAG (Modern Enhanced)
// ══════════════════════════════════════════════════════════════

#[component]
pub fn Badge(
    label: String,
    #[prop(default = "blue".to_string())] color: String,
    #[prop(default = false)] ai: bool,
) -> impl IntoView {
    let class_name = if ai {
        "badge badge-ai".to_string()
    } else {
        format!("badge badge-{}", color)
    };

    view! {
        <span class=class_name>{label}</span>
    }
}

// ══════════════════════════════════════════════════════════════
// CARD (NEW COMPONENT)
// ══════════════════════════════════════════════════════════════

#[component]
pub fn Card(
    children: Children,
    #[prop(default = false)] modern: bool,
) -> impl IntoView {
    view! {
        <div class="card" class:modern=modern>
            {children()}
        </div>
    }
}

// ══════════════════════════════════════════════════════════════
// BUTTONS (Modern Enhanced)
// ══════════════════════════════════════════════════════════════

#[component]
pub fn ButtonPrimary(
    children: Children,
    #[prop(default = false)] loading: bool,
    #[prop(default = None)] on_click: Option<Box<dyn Fn(Event) + 'static>>,
) -> impl IntoView {
    view! {
        <button 
            class="btn-primary"
            class:loading=loading
            disabled=loading
            {
                on_click.map(|cb| view! {
                    <on:click=cb />
                }).unwrap_or_else(|| view! {})
            }
        >
            {move || {
                if loading {
                    view! { <span class="spinner spinner-sm" /> }.into_view()
                } else {
                    view! { {children()} }.into_view()
                }
            }}
        </button>
    }
}

#[component]
pub fn ButtonGhost(
    children: Children,
    #[prop(default = None)] on_click: Option<Box<dyn Fn(Event) + 'static>>,
) -> impl IntoView {
    view! {
        <button 
            class="btn-ghost"
            {
                on_click.map(|cb| view! {
                    <on:click=cb />
                }).unwrap_or_else(|| view! {})
            }
        >
            {children()}
        </button>
    }
}

// ══════════════════════════════════════════════════════════════
// TOGGLE SWITCH (Modern Enhanced)
// ══════════════════════════════════════════════════════════════

#[component]
pub fn Toggle(
    checked: RwSignal<bool>,
    #[prop(default = "".to_string())] label: String,
    #[prop(default = false)] modern: bool,
) -> impl IntoView {
    view! {
        <label class="toggle-label" class:modern=modern>
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
// SEARCH BAR (Modern Enhanced)
// ══════════════════════════════════════════════════════════════

#[component]
pub fn SearchBar(
    query: RwSignal<String>,
    #[prop(default = "Search…".to_string())] placeholder: String,
    #[prop(default = false)] modern: bool,
) -> impl IntoView {
    view! {
        <div class="search-bar" class:modern=modern>
            <span class="search-icon">"⌕"</span>
            <input
                type="search"
                class="search-input"
                placeholder=placeholder
                prop:value=move || query.get()
                on:input=move |ev| query.set(event_target_value(&ev))
            />
            {move || (!query.get().is_empty()).then(|| view! {
                <button 
                    class="search-clear"
                    on:click=move |_| query.set(String::new())>
                    "×"
                </button>
            })}
        </div>
    }
}

// ══════════════════════════════════════════════════════════════
// TOOLTIP (Modern Enhanced)
// ══════════════════════════════════════════════════════════════

#[component]
pub fn Tooltip(
    tip: String,
    children: Children,
    #[prop(default = "top".to_string())] position: String,
) -> impl IntoView {
    view! {
        <span class="tooltip-wrap" data-position=position title=tip>
            {children()}
        </span>
    }
}

// ══════════════════════════════════════════════════════════════
// SPINNER (Modern Enhanced)
// ══════════════════════════════════════════════════════════════

#[component]
pub fn Spinner(
    #[prop(default = "sm".to_string())] size: String,
    #[prop(default = false)] modern: bool,
) -> impl IntoView {
    view! {
        <span 
            class=format!("spinner spinner-{}", size)
            class:modern=modern
        />
    }
}

// ══════════════════════════════════════════════════════════════
// EMPTY STATE (Modern Enhanced)
// ══════════════════════════════════════════════════════════════

#[component]
pub fn EmptyState(
    message: String,
    #[prop(default = None)] action_label: Option<String>,
    #[prop(default = None)] on_action: Option<Box<dyn Fn() + 'static>>,
    #[prop(default = "◌".to_string())] icon: String,
) -> impl IntoView {
    view! {
        <div class="empty-state">
            <div class="empty-icon">{icon.clone()}</div>
            <p class="empty-message">{message}</p>
            {action_label.zip(on_action).map(|(label, cb)| view! {
                <button class="btn-ghost" on:click=move |_| cb()>{label}</button>
            })}
        </div>
    }
}

// ══════════════════════════════════════════════════════════════
// STATUS BADGE (NEW COMPONENT)
// ══════════════════════════════════════════════════════════════

#[component]
pub fn StatusBadge(
    status: String,
    #[prop(default = "online".to_string())] state: String,
) -> impl IntoView {
    let cls = match state.as_str() {
        "online" => "status-badge",
        "offline" => "status-badge offline",
        "busy" => "status-badge busy",
        _ => "status-badge",
    };

    view! {
        <span class=cls>{status}</span>
    }
}

// ══════════════════════════════════════════════════════════════
// AI BADGE (NEW COMPONENT)
// ══════════════════════════════════════════════════════════════

#[component]
pub fn AIBadge(
    label: String,
) -> impl IntoView {
    view! {
        <span class="badge badge-ai ai-glow-text">{label}</span>
    }
}

// ══════════════════════════════════════════════════════════════
// SKLETON LOADING (NEW COMPONENT)
// ══════════════════════════════════════════════════════════════

#[component]
pub fn Skeleton(
    #[prop(default = "text".to_string())] variant: String,
    #[prop(default = 3)] lines: usize,
) -> impl IntoView {
    view! {
        <div class="skeleton-container">
            {move || {
                (0..lines).map(|_| view! {
                    <div class=format!("skeleton skeleton-{}", variant) />
                }).collect::<Vec<_>>()
            }}
        </div>
    }
}

// ══════════════════════════════════════════════════════════════
// RANGE INPUT (Modern Enhanced)
// ══════════════════════════════════════════════════════════════

#[component]
pub fn RangeInput(
    value: RwSignal<f32>,
    min: f32,
    max: f32,
    step: f32,
    #[prop(default = "".to_string())] label: String,
) -> impl IntoView {
    view! {
        <div class="range-wrap">
            {(!label.is_empty()).then(|| view! {
                <span class="range-label">{label}</span>
            })}
            <input
                type="range"
                class="range-input"
                prop:value=move || value.get().to_string()
                prop:min=min.to_string()
                prop:max=max.to_string()
                prop:step=step.to_string()
                on:input=move |ev| {
                    if let Ok(v) = event_target_value(&ev).parse::<f32>() {
                        value.set(v);
                    }
                }
            />
            <span class="range-value">{move || format!("{}", value.get())}</span>
        </div>
    }
}

// ══════════════════════════════════════════════════════════════
// EXPOSED SIGNALS & UTILS
// ══════════════════════════════════════════════════════════════

/// Helper to get event target value
fn event_target_value(event: &web_sys::Event) -> String {
    event
        .dyn_into::<web_sys::InputEvent>()
        .map(|ev| ev.target().unwrap().dyn_into::<web_sys::HtmlInputElement>().unwrap().value())
        .unwrap_or_default()
}
