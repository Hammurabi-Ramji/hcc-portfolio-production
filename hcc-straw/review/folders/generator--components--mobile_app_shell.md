# mobile_app_shell direct-folder review

Scope: `C:\IEDB\STRAW SaaS Generator\components\mobile_app_shell`. Inspected its only direct file, `App.js` (40 lines); there are no child folders or local manifests. No applicable ancestor AGENTS.md was found.

## Current behavior and specification

`App.js` exports a React Native functional component with a safe-area container, header, static dashboard card, report button, and footer labels. Styling is local through `StyleSheet.create`. The generator copies this folder unchanged (`core/controller.py:90-96`), and selects it for e-commerce, education, and real estate (`:184`, `:202`, `:211`). The root README describes starter bundles rather than runnable applications. `docs/EXPANDED_SAAS_FRAMEWORK.md:35` allows customizable UI shells, but `docs/FINAL_VERIFICATION_REPORT.md:7-11` claims production-grade implementation and mobile navigation. This source supports the shell claim only. Stack's desktop and web guides describe Svelte/Tauri and Next.js respectively; they do not supply a React Native runtime for this component.

## Findings and patch targets

- **P2, proven inert controls / navigation requirement gap:** `App.js:15-17` renders “View Reports” without `onPress`; `:19-23` renders Home/Profile/Settings as plain `Text`. No state, screen switching, or navigation integration exists anywhere in the file. Patch `App.js` to accept explicit report/navigation callbacks and implement accessible pressable tabs with selected state, or add a minimal screen navigator. Preserve its reusable-shell contract and document what the host must provide. Update the verification document's navigation claim until implemented.
- **P2, packaging requirement gap:** `App.js:1-2` requires React and React Native, while the folder provides no dependency manifest, entry registration, or host instructions. The controller copies files without establishing a mobile build target. Add a component README identifying supported host/runtime and a minimal runnable host template or documented integration path; do not imply copying this component creates a deployable mobile application.

Dependencies: React, React Native, and a mobile host; a navigation package is needed only if that implementation is chosen. Backend data/auth integration remains a future host responsibility, not a defect in a presentation shell.

## Acceptance and remaining tasks

- [ ] Wire Reports and all footer destinations; verify press behavior and selected destination in a mobile host.
- [ ] Document/installable-host requirements and prove one generated bundle imports and renders the shell.
- [ ] Reconcile production/navigation claims with the implemented behavior.

Confidence: high for static findings and copy integration. No installs, network, source edits, builds, tests, or emulator runs performed; Android/iOS rendering and accessibility remain unverified.
