# Folder 063 — landing_page_marketing

Reviewed every direct file: `components/landing_page_marketing/LandingPage.svelte` (48 lines); no nested files, manifest, or tests. No applicable ancestor AGENTS.md was found. The component exposes title and feature props and renders static branding, navigation, a hero, three feature cards, and a footer.

The generator deliberately ships reusable source bundles (root `README.md:26-29`); `core/config.json:22` registers this module, `core/controller.py:144` includes it in the shared base stack, and `controller.py:90-96` copies its folder. `docs/EXPANDED_SAAS_FRAMEWORK.md:35` calls UI-heavy components customizable shells, whereas `docs/FINAL_VERIFICATION_REPORT.md:7-12` describes production-grade implementation. The hero/grid template exists; operational marketing behavior is unfinished.

## Findings and patch targets

- **P2 — Hero layout uses an inline unknown element.** `LandingPage.svelte:20-24,43` uses `<hero>` and applies section padding/background without setting display. Unlike a semantic section/header, this element defaults to inline layout; block children and large vertical padding do not produce a conventional full-width hero box. Replace both tags with `<section class="hero">` (labelled by the heading), and retarget the CSS to `.hero`. Expected: one block containing the title, copy, and CTA with predictable padding/background.
- **P2 — Marketing actions are inert (shell completion gap).** `LandingPage.svelte:14-16` renders labels as list text, and `:23` renders a button with no handler; `:26` has no target ID and there are no pricing/contact sections. Clicking or keyboard-activating the CTA cannot start signup. Patch navigation to real anchors for implemented destinations, add a configurable CTA URL or callback, and remove unavailable destinations until supplied. Destination/auth ownership belongs to the consuming application; do not hard-code a route based on the separate Next.js web app.
- **P2 — Narrow-screen layout needs adaptation.** `LandingPage.svelte:45-46` fixes three columns with 2rem gaps and 2rem card padding regardless of viewport. Min-content card widths can exceed a phone viewport. Use responsive columns and reduced small-screen padding; allow the navigation to wrap. This is a usability gap, not evidence of a documented generator-specific breakpoint contract.

## Integration, acceptance, and limits

`components/frontend_svelte/App.svelte:1-18` does not mount this component; the controller copies files without wiring a route. This matches the source-bundle contract, so mounting is a consumer dependency rather than a proven controller regression. Requires a Svelte host and agreed navigation/onboarding destinations; no extra service dependency is inherent.

- [ ] Replace the hero element and verify its bounding box/background contains all hero content.
- [ ] Supply working navigation and CTA contracts; verify mouse and keyboard activation reaches the intended destination.
- [ ] Check 320/375/768px and desktop layouts with long feature text and an empty features array; require no horizontal overflow.

Confidence: high for static markup/action findings, medium for unrendered layout impact. No source changes, installs, network, builds, runtime rendering, or tests were performed; production-readiness claims remain unverified by this review.
