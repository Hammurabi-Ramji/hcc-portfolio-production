# Folder review: generator components/no_code_workflow_builder/ui (index 22)

## Inventory and requirements

Reviewed all 23 direct files: App/main, dashboard/editor/canvas, node configuration, execution/search/settings pages, error/modal/notification components, types/Drizzle schema/sample workflows, IPC/validation/history/keyboard/health utilities, Vite/Vitest configs and workflow tests. No child directories, package manifest, HTML entry, index.css, or applicable ancestor AGENTS.md exist. This is substantial React source supplied as component material.

Generator README:3,26–29 promises copied starter bundles; docs/README.md:3 describes Svelte/Tauri/Rust. EXPANDED_SAAS_FRAMEWORK.md:35 allows customizable UI shells, while FINAL_VERIFICATION_REPORT.md:7 claims no placeholders. Stack output/ENGINES_IMPLEMENTATION_GUIDE.md:123–143 specifies configurable executable DAGs; its separate Next.js web guide does not wire this React component. The component needs an explicit host, editable connected graphs, valid persistence, current-definition execution, and truthful errors/history before being considered operational. core/controller.py:90–95 copies this folder unchanged; copying preserves its defects.

## Evidence-backed findings and patch targets

1. **P1 — Unbuildable copied frontend.** App.tsx:4–7 imports nonexistent hooks/components directories; Dashboard.tsx:4–5 and useWorkflow.ts:13 target nonexistent parent paths. main.tsx:6 imports absent index.css and :8 requires an absent HTML root. vite.config.ts:10–15 and workflow.test.ts:4–5,129 target nonexistent src directories. health-check.ts:246–317 contains JSX in a .ts file. No generator package.json declares React/ReactDOM/React Flow/Drizzle/Vite/Vitest dependencies. Patch the folder layout/imports, JSX extension, and an actual package/entry/build contract; select React hosting or port features into the documented Svelte shell.

2. **P1 — Incompatible graph representations and stale operations.** types.ts:22–55 uses flat node fields, snake-case ports, status/version; WorkflowCanvas.tsx:24–50 uses React Flow data wrappers, and :420–428 resets description and drops status/version. WorkflowEditor.tsx:136–139 passes these incompatible models directly. Canvas updates reach editor state only through inner Save; outer Save/Deploy (:32–36,57) therefore uses stale edits. App.tsx:108 sends only the ID; sibling src/main.rs:73–75 reloads persisted data, discarding unsaved edits. Patch typed round-trip adapters and one controlled definition, with explicit save-before-execute or snapshot execution.

3. **P1 — Graph editing cannot reliably connect/select/add.** Custom renderer WorkflowCanvas.tsx:57–111 contains no React Flow Handles. :338 reads selection.nodeId instead of id; :534 stores only node data, leaving Inspector's node.id (:146,241) undefined. :330,369 restarts IDs at node-0 after loading. Patch real port Handles, selection by ID/full node, collision-free IDs and workflow-change synchronization.

4. **P1 — Creation and failure feedback are broken.** App.tsx:22–25 clears the definition and enters an editor that only displays Loading (:115–118). useWorkflow.ts:33–37 converts save rejection into null; App.tsx:100–106 resolves anyway, so WorkflowEditor.tsx:37 announces success. Canvas :429–445 announces save/deploy even with missing callbacks; editor supplies no deploy handler. Patch draft initialization, awaited required callbacks, and explicit failure propagation; render hook errors rather than empty-success states. Validate before save/execute using validation.ts, currently unconnected.

5. **P2 — IPC depends on unresolved host/version contracts.** useWorkflow.ts:3 imports Tauri's older api/tauri path; the available Stack host declares API v2 (straw-app/package.json:19). Parameter objects (:51,91–94,138–139,267–269) use snake-case keys despite sibling commands having no rename_all override. Patch imports and argument casing against the chosen actual Tauri host; coordinate with sibling Rust integration and verify every command.

6. **P2 — Demonstration helpers masquerade as capabilities.** ExecutionDetailsPage.tsx:27–40 fabricates success; health-check.ts:100–101,157–159 only sleeps. SettingsPage.tsx:22–38 never hydrates/applies saved settings; NodeConfigDialog.tsx:100–114,126 controls never update config. App/main do not mount search/settings/history/error/notification helpers; schema.ts and workflows.ts have no callers. Patch real history/health, settings hydration/application and bound configuration; explicitly integrate or label remaining shells.

## Patch tasks and acceptance

- [ ] Repair package/layout/entry/JSX; dependency: chosen frontend host. Acceptance: generated UI compiles and repaired Vitest suite runs.
- [ ] Add adapters, controlled state, Handles/selection/unique IDs and drafts; dependency: shared Rust DTO. Acceptance: create/connect/edit/save/reload preserves metadata and ports; execution uses current edits.
- [ ] Fix IPC/outcomes and wire validation; dependency: runnable Rust command host. Acceptance: rejected saves show errors without success; malformed/cyclic graphs are blocked.
- [ ] Replace mock history/health and apply settings/config; dependency: real backend/settings store. Acceptance: failed/missing runs and unavailable backend display truthfully; settings survive restart.

High confidence in static evidence. No source edits, installs, network, builds or tests performed; root owns broad validation. Runtime repairs remain unverified.
