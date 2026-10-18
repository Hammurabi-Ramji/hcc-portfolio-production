# Folder review: straw-app/src/no-code (index 41)

## Inventory and intended behavior

Reviewed all 24 direct files: React entry/App/dashboard/editor/canvas, node dialog, search/settings/execution pages, notification/modal/error components, types/schema/samples, workflow/validation/history/keyboard/health utilities, CSS, Vite/Vitest configs and tests. No child directories or applicable ancestor AGENTS.md were found. This is substantial unintegrated application material, not an empty placeholder.

Root README specifies Svelte/Tauri/Rust; generator docs describe desktop-first modular SaaS, and output engine guides promise executable visual DAGs. Required behavior is reachable graph editing, validated persistence, current-definition execution and truthful history/errors. Generator final-verification and Stack codebase-verification claims of no placeholders/resolved imports are contradicted here. The separate Next.js web summary does not establish desktop React integration.

## Prioritized findings and concrete patch targets

1. **P1 — Disconnected, unbuildable frontend.** `App.tsx:4–7` imports nonexistent hooks/components directories; `useWorkflow.ts:13`, other components and helpers reference `../types` instead of the adjacent file. `workflow.test.ts:4–5,129` targets nonexistent `../src/...`. `main.tsx:8` expects an HTML root, but the active route uses Svelte (`../routes/+page.svelte:3–9`) and never mounts this entry. Parent `package.json:18–36` lacks React, ReactDOM, React Flow, Drizzle, React Vite plugin and Vitest; nested aliases target another nonexistent src tree (`vite.config.ts:10–15`). `health-check.ts:246–317` contains JSX in a `.ts` file, independently evidenced by saved `review/svelte-check.log`. Patch: choose a supported integration explicitly (port usable features into Svelte or create a separately wired React package), repair local imports/test paths, move JSX to `.tsx`, and provide matching dependency/config/entry declarations.

2. **P1 — Wrong IPC contract.** `useWorkflow.ts:3` uses Tauri v1's API path despite installed v2; save/load/list/template/statistics commands are absent from active `src-tauri/src/lib.rs:104–119`. Those commands exist only in unreferenced `no_code/main.rs` (`no_code/mod.rs:1–5`). `useWorkflow.ts:91–94` sends workflow_id/input_data, while registered `workflow_executor.rs:541–545` requires definition/input. Patch the hook to `@tauri-apps/api/core`, agree on one CRUD/execution service and argument casing, and register/manage its state in the actual entry.

3. **P1 — Incompatible graph models and stale edits.** `types.ts:22–55` specifies flat nodes/status/version, whereas `WorkflowCanvas.tsx:24–50,420–428` emits React Flow data-wrapped nodes and dates, drops description/status/version, and is passed that incompatible definition by `WorkflowEditor.tsx:136–139`. Canvas changes reach the parent only on its inner Save; outer Save/Deploy can use stale graph state (`WorkflowEditor.tsx:32–36,57`). Patch typed bidirectional adapters and one controlled workflow state; preserve metadata and execute the current snapshot.

4. **P1 — Node editing/connection failures.** `WorkflowCanvas.tsx:338` reads selection.nodeId rather than id; `:534` stores node data instead of a node, causing Inspector's `node.data` accesses to fail. Custom nodes contain no connection Handles (`:57–111`). IDs restart at node-0 after loading (`:330,369`). Patch selection by id, stable Handle/port definitions, and collision-free IDs; synchronize loaded definitions.

5. **P1 — False success and broken creation.** `App.tsx:22–25,115–118` makes New Workflow an endless loading state. `useWorkflow.ts:33–37` swallows save failures, yet `WorkflowEditor.tsx:36–37` announces success; canvas Save/Deploy alerts also run with optional/missing callbacks (`:429–445`). Patch draft initialization, explicit rejected/result outcomes, awaited persistence and visible errors. Wire or remove unsupported Deploy actions.

6. **P2 — Demonstration behavior presented as operational.** Execution details fabricate success (`ExecutionDetailsPage.tsx:27–40`); health checks only sleep (`health-check.ts:100–101,157–159`). Settings write but never load/apply preferences (`SettingsPage.tsx:22–38`). Node-specific selectors are uncontrolled (`NodeConfigDialog.tsx:100–114,126`). Patch real history/health calls, shared settings hydration/application and config bindings. Schema/samples/history/keyboard/validation need explicit integration, not assumed functionality.

## Acceptance and confidence

- [ ] Resolve frontend ownership, imports/dependencies/JSX; compile the chosen entry and run repaired tests.
- [ ] Create, edit, connect, save/reload and execute a graph; verify metadata, ports and unique IDs.
- [ ] Denied/failed IPC yields errors without success; unsaved execution uses current edits.
- [ ] Real failed/missing executions and unavailable backend produce truthful displays; settings survive restart.

High confidence in static findings. No source edits, installs, network or builds/tests performed; root owns broad validation. Runtime usability and repaired integration remain unverified.
