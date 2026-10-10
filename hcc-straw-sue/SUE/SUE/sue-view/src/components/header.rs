//! SUE Header Component — Sovereign, Unified, Emergent
//! "Digital Underground" aesthetic with glassmorphism and neon accents

use leptos::prelude::*;

#[component]
pub fn SueHeader() -> impl IntoView {
    view! {
        <header class="sue-header">
            <div class="header-container">
                <div class="header-logo">
                    <div class="logo-icon">
                        <svg viewBox="0 0 64 64" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style="stop-color:#00d9ff;stop-opacity:1" />
                                    <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
                                </linearGradient>
                            </defs>
                            <circle cx="32" cy="32" r="30" fill="none" stroke="url(#logoGradient)" stroke-width="2"/>
                            <path d="M 20 32 L 32 44 L 44 32" fill="none" stroke="url(#logoGradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="32" cy="20" r="3" fill="url(#logoGradient)"/>
                        </svg>
                    </div>
                    <div class="logo-text">
                        <h1>"[SUE]"</h1>
                        <span class="tagline">"Sovereign • Unified • Emergent"</span>
                    </div>
                </div>

                <div class="header-status">
                    <div class="status-badge">
                        <span class="status-dot"></span>
                        <span class="status-text">"Ready"</span>
                    </div>
                </div>
            </div>

            <div class="header-divider"></div>
        </header>
    }
}

#[component]
pub fn SueFooter() -> impl IntoView {
    let version = "v8.0.0";
    let tagline = "Built for freedom. Designed to evolve. Here to stay.";

    view! {
        <footer class="sue-footer">
            <div class="footer-divider"></div>

            <div class="footer-container">
                <div class="footer-left">
                    <span class="footer-brand">"SUE"</span>
                    <span class="footer-version">{version}</span>
                </div>

                <div class="footer-center">
                    <span class="footer-tagline">{tagline}</span>
                </div>

                <div class="footer-right">
                    <a href="#" class="footer-link" title="Documentation">
                        "Docs"
                    </a>
                    <span class="footer-separator">"|"</span>
                    <a href="#" class="footer-link" title="GitHub">
                        "GitHub"
                    </a>
                    <span class="footer-separator">"|"</span>
                    <a href="#" class="footer-link" title="Community">
                        "Community"
                    </a>
                </div>
            </div>
        </footer>
    }
}
