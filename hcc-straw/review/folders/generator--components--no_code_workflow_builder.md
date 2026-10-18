# Folder 123 — Generator no-code workflow component boundary

## Inventory and current versus specified behavior

The folder has **no direct files**, including hidden files; it contains only `src/` and `ui/`. No ancestor AGENTS.md was found. Child implementation reviews are [backend](generator--components--no_code_workflow_builder--src.md) and [UI](generator--components--no_code_workflow_builder--ui.md); their defects are not duplicated here. This remains separate generator material after the Stack desktop replacement.

Generator README.md:3,26–29 describes copied starter bundles. That behavior exists: `core/config.json:47` advertises this component, and `core/controller.py:90–96` copies its nonempty directory. Copying alone satisfies the starter-material contract. However, `docs/README.md:3,40` describes modular desktop components, while `docs/FINAL_VERIFICATION_REPORT.md:7,36` claims complete implementations and Rust unit-test coverage. Neither establishes a runnable package here. Stack `output/ENGINES_IMPLEMENTATION_GUIDE.md:123–143` concerns a separate DAG engine and supplies no package integration for this component.

## Finding, patch targets and dependencies

**P1 requirement gap — no host/build contract.** There is no direct Cargo.toml, package.json, Tauri configuration, or integration README. Root `Cargo.toml:2–35` omits this component. The child backend is an application entry point using `tauri::generate_context!()` (`src/main.rs:214–230`); the UI expects React and an HTML root (`ui/main.tsx:3–8`). The unchanged copy operation cannot supply these missing contracts. This is a packaging gap, not evidence that copying itself fails.

- [ ] Add a component README defining canonical backend/UI layout, supported Tauri/frontend versions, embedding versus standalone operation, dependencies and generated-bundle commands. Coordinate the package/layout repairs already owned by the child reports.
- [ ] Add the chosen Cargo/frontend manifests, Tauri configuration and entry assets; include a runnable target in workspace validation or explicitly document a separate build boundary. Dependencies: repaired child sources, compatible IPC DTOs, frontend toolchain and Rust dependencies.
- [ ] Acceptance: select only this component into a temporary bundle, follow documented commands to build it, launch the chosen host, and complete create/save/reload/execute through its UI and registered commands.

High confidence from direct directory enumeration and numbered integration excerpts. No source edits, installs, network, compilation or tests performed; root owns broad checks. Existing workspace results do not cover this omitted package.
