# STRAW SaaS Generator — to-do

Latest checkpoint: 2026-10-18. `cargo test --workspace --offline --locked` passed all 35 unit tests across 32 crates. Source/templates and the lockfile are versioned; G01/G02/G03/G12 and the other unchecked acceptance tasks remain open. See the shared [closeout record](<C:/IEDB/STRAW Stack/review/closeout-2026-10-18/README.md>); the older evidence below retains its original snapshot date.

Reviewed: 2026-10-09. **Folder review complete.** 84/84 assigned folder reports saved here; 136/136 across both roots.

The review assigns a distinct agent to each current nested source folder; Stack root is reviewed by the main agent. Generated/copied folders are compared to source rather than assigned duplicate agents, as requested. The review excludes dependencies, Git internals and caches. The desktop was replaced during the audit; the user selected the current replacement tree. Original evidence is retained separately and removed folders are excluded from active tasks. Implementation tasks remain unchecked; completing an audit does not mean its proposed patches are implemented.

[Concrete diff and patch map](<C:/IEDB/STRAW Stack/review/patch-plan.md>) · [Folder agent registry](<C:/IEDB/STRAW Stack/review/agent-registry.json>) · [Current source/copy inventory](<C:/IEDB/STRAW Stack/review/current-inventory.json>) · [Snapshot transition](<C:/IEDB/STRAW Stack/review/tree-transition.json>)

## Current validation evidence

- Historical desktop frontend: `npm run check` **failed**, 247 errors and 1 warning; the npm package was subsequently replaced, so this is not a current build result.
- Web: `npm run type-check` **failed**, 19 diagnostics.
- Current desktop: `cargo test --workspace --offline --locked` **passed**, 15 tests (12 engine, 2 Axum, 1 WASM). Earlier lock/sandbox failures were superseded by this successful source-workspace check.
- Generator Rust: `cargo test --workspace --offline` **passed**, 35 tests across 32 crates; no doc tests.
- Current native frontend: isolated clean compiler build **passed**; all 150 generated browser files match saved copies, with no extras. Static graph validates 107 modules; live UI behavior remains unverified.
- Generator CLI/fixture: help/list/no-argument output preservation and flag validation verified; placeholder readiness defect reproduced.
- Runtime, installers, live provider/Ollama behavior and generated-application builds remain unverified.

[Check logs and fixture evidence](<C:/IEDB/STRAW Stack/review/README.md>)

## Patch order and cross-folder tasks

- [ ] **G01 · P1 · Correct manifest readiness and availability.** Current: a known empty component gets a placeholder, counts as included and receives `ready_to_build`; only unknown names are reported missing. Patch `core/controller.py` and component metadata to distinguish runnable, shell/mock, unavailable and unknown selections. Done when manifests/counts/status match actual implementation and validation. Evidence: controller fixture in shared `review/controller-checks.json`.
- [ ] **G02 · P1 · Make output generation confined and failure-safe.** Patch controller and template bundler to validate paths before replacement, stage output, abort clearly on replacement failure, and exclude nested repositories, caches/dependencies and secret files. Done when unsafe paths cannot escape the configured root, failures preserve prior output and no obsolete component survives regeneration. Depends on G01.
- [ ] **G03 · P1 · Decide and implement runnable application assembly.** Current: all 18 saved bundles lack root Cargo/npm entrypoints. The current README promises starter bundles; broader docs promise full applications. Either accurately support manual-integration bundles or add a shared application skeleton, generated manifests/registration, frontend/backend/Tauri wiring and configuration. Done when every supported template has verified build/start commands or explicit incomplete/source-bundle status. Depends on G01/G02, source components and supported Stack contracts.
- [ ] **G04 · P1 · Make Axum start an actual server.** Current: `components/api_layer_axum/src/lib.rs` prints a listening address and returns without binding/serving. Patch it to bind loopback, serve the router, return startup errors and support shutdown; reconcile legacy `api.rs`. Done when real HTTP, occupied-port and bounded-shutdown checks pass. Existing in-process router unit test already passes but does not test startup.
- [ ] **G05 · P1 · Integrate authentication and authorization.** Current: JWT primitive exists, but account verification/session/permission integration is absent. Patch signing configuration validation, actual account/store/API boundaries and negative policy tests. Done when invalid/disabled identities, malformed/expired/wrong-key tokens and wrong permissions are rejected. Define revocation and tenant/issuer requirements before claiming them implemented.
- [ ] **G06 · P1 · Separate provider demos from implemented integrations.** Review each named provider's task block below. Console messages, fabricated checkout URLs, in-memory caching and constant statuses are demonstrations. Implement chosen adapter protocols/configuration/errors/retries and meaningful behavior tests, or label them demo/unsupported. Done when component metadata and docs reflect exercised capabilities; no paid/live provider actions are required by this review.
- [ ] **G07 · P1 · Wire no-code workflow packaging and execution.** Patch its missing package ownership/dependencies, DTO/database/executor/UI integration and selection metadata. Resolve copied desktop versus generator implementations deliberately. Done when the selected component builds, loads a workflow, executes/persists it and reports validation/failure accurately. Depends on G03 and Stack workflow contracts.
- [ ] **G08 · P2 · Consolidate template definitions and configuration paths.** Patch `core/config.json`, controller and `templates/bundle_templates.py` with shared declarative selections and predictable root resolution. Four configured components are never selected by defaults: warehouse, IaC, no-code, ZAP; make their optional selection/documentation explicit. Done when both generation interfaces resolve the intended checkout and agree on supported template composition.
- [ ] **G09 · P2 · Refresh all copied bundles after source repair.** Current: 236 copied components, 11 drifted Axum `src/lib.rs` copies (3 templates, 8 outputs); the current difference is cosmetic (`app` renamed `_app`). Preserve intentional customizations, generate separately, compare manifests/content, validate, then replace. Done when each copy matches its intended source version or a documented override. Do not patch copies before canonical source. Evidence: shared `review/copy-comparison.json`.
- [ ] **G10 · P2 · Replace unsupported completion claims with current evidence.** Patch README and documentation reports to identify 43 configured components, 32 tested Rust crates, implementation levels, missing assembly and unverified integrations. Existing 35 unit tests pass; they do not establish production readiness or 100% coverage. Done when each readiness claim names reproducible checks and remaining gates.
- [ ] **G11 · P2 · Complete UI/infrastructure/ZAP requirements or mark them pending.** Follow separate folder reports for Svelte/mobile/admin/support/Tauri shells, CI/IaC and documentation-only ZAP tooling. Add only selected documented runtime dependencies and callable entrypoints. Done when these capabilities are buildable/exercised or explicitly optional/unimplemented; written deployment commands alone are not implementation evidence.

- [ ] **G12 · P1 · Confine local storage operations.** Patch components/file_storage_local/src/lib.rs and its legacy copy with a shared checked path resolver, rejecting parent/rooted paths and checking link containment before save/read/delete; return constructor errors instead of panic. Done when escaping paths cannot disclose, overwrite or delete external files and normal round trips still work. Depends on the chosen flat/nested storage contract and must precede generated app use.
- [ ] **G13 · P2 · Establish one supported Rust source per component.** Current: Cargo generally compiles src/lib.rs, while adjacent legacy Rust files are also bundled and some expose different APIs. Patch the compiled source first; check consumers before removing duplicates or replacing them with compatibility facades. Document supported entrypoints. Done when component edits affect the intended build and bundles no longer present conflicting implementation contracts. Depends on source ownership and G06/G09.
- [ ] **G14 · P1 · Repair ZAP backup and deployment runbooks.** Current: documented retention deletes old database files under live data; restore feeds a binary SQLite backup as SQL; startup targets an artifact without a repository producer. Patch components/zap_hosting_management/docs to confine retention to a dedicated backup directory/pattern, use a consistent SQLite backup/restore pair, and name a real supported build/start artifact. Correct TLS bootstrap, runtime tools and health checks. Done when isolated seeded backup/restore and retention checks preserve live/unrelated databases and a fresh host can start the selected application. Depends on G03 and the deployment/persistence contract.

Use the named patch map for before/after behavior, file targets, dependencies and acceptance. Below, each folder has its own report with direct-file inventory, documentation comparison and specific patch details. Related tasks may share a patch; avoid fixing duplicate implementations independently.

## Individual folder review and tasks

### GENERATOR-F001 · `.`

Reviewed by `/root/review_133`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--root.md>).

- [ ] Correct portable setup/configuration guidance and document replacement semantics.
- [ ] Align output/readiness documentation with G01/G02/G03 and publish evidence-scoped capabilities under G10.
- [ ] Refresh this root's to-do report link/count through the aggregator; retain unchecked implementation tasks and snapshot provenance.
- [ ] Verify documented commands in disposable relocated fixtures, including an existing legacy base path, placeholder selection and failed replacement; check supported generated builds only after assembly is implemented.

### GENERATOR-F002 · `components`

Reviewed by `/root/review_122`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components.md>).

- [ ] Preserve directory/registry parity when adding components.
- [ ] Keep Rust manifests and workspace members aligned.
- [ ] Resolve implementation findings through child reports.

### GENERATOR-F003 · `components/admin_dashboard_ui`

Reviewed by `/root/review_042`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--admin_dashboard_ui.md>).

- [ ] Align documentation and integration instructions.
- [ ] For functional mode, verify deactivate/delete persist, failures leave displayed state consistent, and unauthorized operations fail.

### GENERATOR-F004 · `components/ai_engine_ollama`

Reviewed by `/root/review_043`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--ai_engine_ollama.md>).

- [ ] Resolve legacy-source ownership; document endpoint/model/service prerequisites.
- [ ] Exclude repository/build metadata from bundles.

### GENERATOR-F005 · `components/ai_engine_ollama/src`

Reviewed by `/root/folder_review_dispatcher/review_003`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--ai_engine_ollama--src.md>).

- [ ] Check HTTP status and preserve useful server diagnostics.
- [ ] Configure request bounds and normalize endpoint construction.
- [ ] Add HTTP behavior tests and update verification claims.
- [ ] Have the root reviewer run crate/workspace checks and assess generated bundle consumers.

### GENERATOR-F006 · `components/api_gateway_proxy`

Reviewed by `/root/review_044`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--api_gateway_proxy.md>).

- [ ] Resolve legacy-file ownership and verify generated logistics bundles use canonical source.
- [ ] Align completion claims with implemented routing; coordinate required manifest dependencies with the source owner.
- [ ] Verify `cargo test -p api_gateway_proxy` after changes.

### GENERATOR-F007 · `components/api_gateway_proxy/src`

Reviewed by `/root/folder_review_dispatcher/review_004`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--api_gateway_proxy--src.md>).

- [ ] Define the public route/discovery/proxy contract and align documentation.
- [ ] Implement resolver/host integration and typed registration behavior.
- [ ] Verify lookup edge cases and real local forwarding.
- [ ] Run `cargo test -p api_gateway_proxy` and logistics bundle acceptance checks.

### GENERATOR-F008 · `components/api_layer_axum`

Reviewed by `/root/review_045`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--api_layer_axum.md>).

- [ ] Resolve legacy-source ownership and generated-bundle duplication.
- [ ] Complete child startup repair and reconcile capability claims.

### GENERATOR-F009 · `components/api_layer_axum/src`

Reviewed by `/root/folder_review_dispatcher/review_005`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--api_layer_axum--src.md>).

- [ ] Implement binding, serving, startup errors, and shutdown ownership.
- [ ] Verify startup through loopback HTTP and a conflicting port.
- [ ] Define router state and bundled-service API contracts.
- [ ] Reconcile implementation-status claims with the scaffold's actual capabilities.

### GENERATOR-F010 · `components/auth_system`

Reviewed by `/root/review_046`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--auth_system.md>).

- [ ] Consolidate source and document ownership.
- [ ] Exclude repository/build metadata from generation.
- [ ] Verify generated crate builds, retains canonical tests, and excludes metadata.

### GENERATOR-F011 · `components/auth_system/src`

Reviewed by `/root/folder_review_dispatcher/review_006`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--auth_system--src.md>).

- [ ] Reject unsafe signing-key configuration and validate provisioning guidance.
- [ ] Connect verified credentials/accounts to issuance and exercise a protected route.
- [ ] Add negative JWT tests, explicit lifetime/isolation policy, and session invalidation checks if required.
- [ ] Update readiness claims and reconcile duplicated source.

### GENERATOR-F012 · `components/background_job_processor`

Reviewed by `/root/review_047`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--background_job_processor.md>).

- [ ] Consolidate sources and exclude repository/build metadata from bundles.
- [ ] Resolve execution/status contract and update readiness claims with child reviewer targets.

### GENERATOR-F013 · `components/background_job_processor/src`

Reviewed by `/root/folder_review_dispatcher/review_007`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--background_job_processor--src.md>).

- [ ] Replace unconditional completion with execution/acknowledgement semantics.
- [ ] Define and implement status lookup ownership.
- [ ] Specify worker lifecycle and persistence requirements.
- [ ] Add meaningful success/failure integration checks and correct readiness claims.

### GENERATOR-F014 · `components/billing_stripe`

Reviewed by `/root/review_048`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--billing_stripe.md>).

- [ ] Retire/archive legacy source and correct readiness documentation.
- [ ] Exclude repository/build metadata from generated bundles.
- [ ] Accept when generated billing contains one canonical source, no `.git`/`target`, and Cargo resolves its library to `src/lib.rs`; apply child-review provider acceptance checks separately.

### GENERATOR-F015 · `components/billing_stripe/src`

Reviewed by `/root/folder_review_dispatcher/review_008`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--billing_stripe--src.md>).

- [ ] Define explicit mock versus live billing capability and truthful readiness metadata.
- [ ] Implement provider-backed checkout with typed errors and configured price mapping.
- [ ] Add durable subscription/event reconciliation and verified backend ingress.
- [ ] Verify mock HTTP request payloads, failures, unknown plans, duplicate events, and cross-user customer access; later perform a provider test-mode checkout lifecycle.

### GENERATOR-F016 · `components/caching_layer_redis`

Reviewed by `/root/review_049`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--caching_layer_redis.md>).

- [ ] Document canonical ownership and remove/prevent legacy divergence.
- [ ] Resolve backend contract alongside child-source fixes.
- [ ] Verify generated bundles retain manifest/source while excluding `.git` and `target`; `.gitignore:1` alone cannot filter copytree.

### GENERATOR-F017 · `components/caching_layer_redis/src`

Reviewed by `/root/folder_review_dispatcher/review_009`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--caching_layer_redis--src.md>).

- [ ] Verify expired distinct keys are physically removed while live keys remain.
- [ ] Verify overwrite refreshes the TTL, missing keys return `None`, and zero TTL expires immediately.
- [ ] Verify the largest accepted TTL succeeds and unsupported TTLs return an error without panicking or partially writing.
- [ ] Decide the backend contract and align component naming/documentation; if Redis is required, test sharing across two clients and connection failure behavior.

### GENERATOR-F018 · `components/cicd_github_actions`

Reviewed by `/root/review_050`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--cicd_github_actions.md>).

- [ ] Generate a selected-component fixture; verify workflow placement and runnable workspace.
- [ ] Verify failing tests block deployment and frontend checks use real scripts.
- [ ] Validate configured deployment against an actual target before claiming delivery.

### GENERATOR-F019 · `components/component_library_ui`

Reviewed by `/root/review_051`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--component_library_ui.md>).

- [ ] Separate semantic type and variant; verify form behavior.
- [ ] Reconcile documented component inventory.

### GENERATOR-F020 · `components/crm_integration_hub`

Reviewed by `/root/review_052`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--crm_integration_hub.md>).

- [ ] Consolidate duplicate source and document the compiled entry point.
- [ ] Replace false-success CRM methods and raw contact logging.
- [ ] Add provider-boundary acceptance checks and correct completion claims.

### GENERATOR-F021 · `components/crm_integration_hub/src`

Reviewed by `/root/folder_review_dispatcher/review_010`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--crm_integration_hub--src.md>).

- [ ] Replace unconditional success with typed outcomes and provider adapters.
- [ ] Remove raw contact logging and validate request fields.
- [ ] Add meaningful adapter tests and qualify production documentation.

### GENERATOR-F022 · `components/dashboard_analytics`

Reviewed by `/root/review_053`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--dashboard_analytics.md>).

- [ ] Establish and document canonical source ownership.
- [ ] Remove or explicitly archive duplicate `analytics.rs` after consumer check.
- [ ] Verify package resolution and generated bundle contents following cleanup.

### GENERATOR-F023 · `components/dashboard_analytics/src`

Reviewed by `/root/folder_review_dispatcher/review_011`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--dashboard_analytics--src.md>).

- [ ] Define numeric and retention contracts.
- [ ] Add validation and bounded/incremental accumulation.
- [ ] Add contract-focused tests and document integration scope.

### GENERATOR-F024 · `components/data_pipeline_etl`

Reviewed by `/root/review_054`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--data_pipeline_etl.md>).

- [ ] Establish one canonical implementation and remove or label the root duplicate.
- [ ] Verify Cargo and generated marketing/legal bundles use that implementation.
- [ ] Complete persisted-output/error acceptance from the src report; qualify completion documentation meanwhile.

### GENERATOR-F025 · `components/data_pipeline_etl/src`

Reviewed by `/root/folder_review_dispatcher/review_012`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--data_pipeline_etl--src.md>).

- [ ] Import known fixture records and verify exact persisted values after reopening the target.
- [ ] Invalid source and failed target return stage-specific errors without reporting success.
- [ ] Verify empty input, Unicode/case preservation, and repeated runs under a documented duplicate policy.
- [ ] Run component tests and regenerate marketing/legal bundles after implementation.

### GENERATOR-F026 · `components/data_warehouse_connector`

Reviewed by `/root/review_055`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--data_warehouse_connector.md>).

- [ ] Resolve duplicate source ownership and document the canonical path.
- [ ] Filter repository/build metadata at both packaging entrypoints.
- [ ] Implement or explicitly disable adapters in canonical source; align manifest and claims.
- [ ] Verify generated-consumer compilation and provider transport/error acceptance.

### GENERATOR-F027 · `components/data_warehouse_connector/src`

Reviewed by `/root/folder_review_dispatcher/review_013`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--data_warehouse_connector--src.md>).

- [ ] Define configuration, result, and error contracts.
- [ ] Implement or explicitly disable provider adapters.
- [ ] Replace message-only tests with transport-level checks.
- [ ] Correct documentation and verify a generated consumer integration.

### GENERATOR-F028 · `components/database_sqlite`

Reviewed by `/root/review_056`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--database_sqlite.md>).

- [ ] Resolve the unused direct `db.rs` duplicate and document canonical source ownership.
- [ ] Coordinate persistence integration with child/consumer tasks before asserting application readiness.

### GENERATOR-F029 · `components/database_sqlite/src`

Reviewed by `/root/folder_review_dispatcher/review_014`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--database_sqlite--src.md>).

- [ ] Define and implement record retrieval and consumer integration.
- [ ] Add versioned migrations and compatibility handling.
- [ ] Cover disk persistence, constraints, and initialization lifecycle.

### GENERATOR-F030 · `components/desktop_shell_tauri`

Reviewed by `/root/review_057`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--desktop_shell_tauri.md>).

- [ ] Verify generated metadata identifies this shell as incomplete.
- [ ] For runnable scope, build an isolated generated bundle and verify its window loads frontend assets.

### GENERATOR-F031 · `components/email_template_system`

Reviewed by `/root/review_058`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--email_template_system.md>).

- [ ] Resolve canonical/legacy ownership while applying source-review injection fixes.
- [ ] Exclude `.git` from generated component copies.
- [ ] Verify hostile/Unicode names and malformed/quote-bearing/approved reset URLs with focused package tests.
- [ ] Generate a temporary selected bundle and verify canonical source is included, repository metadata is absent, and the copied package builds.

### GENERATOR-F032 · `components/email_template_system/src`

Reviewed by `/root/folder_review_dispatcher/review_015`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--email_template_system--src.md>).

- [ ] Escape welcome names and reset attributes.
- [ ] Validate reset URLs and propagate rendering errors.
- [ ] Add adversarial and valid-link regression tests.
- [ ] Coordinate duplicated source and caller integration.

### GENERATOR-F033 · `components/error_tracking_sentry`

Reviewed by `/root/review_059`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--error_tracking_sentry.md>).

- [ ] Establish one canonical tracker source and remove or justify the duplicate.
- [ ] Add manifest dependencies only alongside the child review's real transport implementation.
- [ ] Confirm Cargo resolves the intended canonical source and a generated selected-component bundle contains it without `.git`/`target`.
- [ ] Exercise fake-transport message/exception capture and host initialization after implementation.

### GENERATOR-F034 · `components/error_tracking_sentry/src`

Reviewed by `/root/folder_review_dispatcher/review_016`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--error_tracking_sentry--src.md>).

- [ ] Replace stdout-only capture or label the feature unavailable.
- [ ] Verify one exception and one message produce inspectable events using a local fake transport.
- [ ] Verify missing configuration, redaction, and shutdown handling without external network calls.
- [ ] Verify a generated host initializes and retains the tracker when selected.

### GENERATOR-F035 · `components/file_storage_local`

Reviewed by `/root/review_060`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--file_storage_local.md>).

- [ ] Establish one canonical implementation and document its public import/API.
- [ ] Apply containment and initialization fixes to src/lib.rs per child report.
- [ ] Exclude embedded Git metadata and build artifacts during generation.
- [ ] Confirm Cargo metadata selects src/lib.rs; generated bundle CRUD compiles and passes boundary tests.
- [ ] Confirm generated components contain neither divergent legacy source nor copied `.git/` metadata.

### GENERATOR-F036 · `components/file_storage_local/src`

Reviewed by `/root/folder_review_dispatcher/review_017`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--file_storage_local--src.md>).

- [ ] Reject traversal/absolute paths for all three operations; outside sentinel files remain unchanged.
- [ ] Cover symlink/reparse-point escape behavior and platform-specific filename cases.
- [ ] Return errors for an unusable root without panic; CRUD still round-trips binary content.
- [ ] Run isolated tests concurrently and confirm cleanup after failures.

### GENERATOR-F037 · `components/frontend_svelte`

Reviewed by `/root/review_061`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--frontend_svelte.md>).

- [ ] Correct unconditional ONLINE wording or introduce evidence-backed status data.
- [ ] Define and implement manifest-to-prop mounting in the generator/consumer boundary.
- [ ] Verify rendered generated-name/module behavior and align completeness documentation.

### GENERATOR-F038 · `components/iac_terraform_scripts`

Reviewed by `/root/review_062`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--iac_terraform_scripts.md>).

- [ ] Decide private/public topology and implement matching resources/output.
- [ ] Document shell scope or implement application bootstrap and health contract.
- [ ] Add validated deployment inputs and Terraform/provider constraints.
- [ ] Add usage guidance and evidence-based readiness/acceptance documentation.

### GENERATOR-F039 · `components/landing_page_marketing`

Reviewed by `/root/review_063`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--landing_page_marketing.md>).

- [ ] Replace the hero element and verify its bounding box/background contains all hero content.
- [ ] Supply working navigation and CTA contracts; verify mouse and keyboard activation reaches the intended destination.
- [ ] Check 320/375/768px and desktop layouts with long feature text and an empty features array; require no horizontal overflow.

### GENERATOR-F040 · `components/log_aggregation_loki`

Reviewed by `/root/review_064`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--log_aggregation_loki.md>).

- [ ] Consolidate or explicitly document the legacy direct source and canonical Cargo entry point.
- [ ] Coordinate manifest dependencies with the child Loki integration patch.
- [ ] Verify generated-bundle source ownership and correct unsupported integration claims.

### GENERATOR-F041 · `components/log_aggregation_loki/src`

Reviewed by `/root/folder_review_dispatcher/review_018`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--log_aggregation_loki--src.md>).

- [ ] Define collector/client integration contract and implement aggregation.
- [ ] Add delivery/format assertions and failure-path coverage.
- [ ] Correct production-readiness claims and document configuration.

### GENERATOR-F042 · `components/microservices_orchestrator`

Reviewed by `/root/review_065`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--microservices_orchestrator.md>).

- [ ] Resolve canonical versus legacy source ownership.
- [ ] Apply the child report's health-state remediation to canonical code and reconcile the parent source.
- [ ] Correct health-monitoring documentation and verify packaged integration.

### GENERATOR-F043 · `components/microservices_orchestrator/src`

Reviewed by `/root/review_019`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--microservices_orchestrator--src.md>).

- [ ] Define the health-check contract and runtime ownership.
- [ ] Implement unknown initial state and bounded health updates; reconcile the parent duplicate source when changing the compiled module.
- [ ] Verify successful, refused, timed-out, and recovery probes using local test services; assert registration alone never establishes health.
- [ ] Correct capability documentation and add integration usage if monitoring is retained as a requirement.

### GENERATOR-F044 · `components/mobile_app_shell`

Reviewed by `/root/review_066`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--mobile_app_shell.md>).

- [ ] Wire Reports and all footer destinations; verify press behavior and selected destination in a mobile host.
- [ ] Document/installable-host requirements and prove one generated bundle imports and renders the shell.
- [ ] Reconcile production/navigation claims with the implemented behavior.

### GENERATOR-F045 · `components/monitoring_prometheus`

Reviewed by `/root/review_067`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--monitoring_prometheus.md>).

- [ ] Fix canonical exporter name validation and test rejection cases.
- [ ] Decide/remove or document the legacy source copy; verify generated consumers.

### GENERATOR-F046 · `components/monitoring_prometheus/src`

Reviewed by `/root/review_020`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--monitoring_prometheus--src.md>).

- [ ] Validate metric names and strengthen exporter tests.
- [ ] Wire registry, instrumentation, and scrape route into generated runtime.
- [ ] Define/test overflow behavior and correct readiness claims.

### GENERATOR-F047 · `components/no_code_workflow_builder`

Reviewed by `/root/review_123`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--no_code_workflow_builder.md>).

- [ ] Add a component README defining canonical backend/UI layout, supported Tauri/frontend versions, embedding versus standalone operation, dependencies and generated-bundle commands. Coordinate the package/layout repairs already owned by the child reports.
- [ ] Add the chosen Cargo/frontend manifests, Tauri configuration and entry assets; include a runnable target in workspace validation or explicitly document a separate build boundary. Dependencies: repaired child sources, compatible IPC DTOs, frontend toolchain and Rust dependencies.
- [ ] Acceptance: select only this component into a temporary bundle, follow documented commands to build it, launch the chosen host, and complete create/save/reload/execute through its UI and registered commands.

### GENERATOR-F048 · `components/no_code_workflow_builder/src`

Reviewed by `/root/review_021`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--no_code_workflow_builder--src.md>).

- [ ] Compile the chosen package and consolidated executor.
- [ ] Round-trip import/save/load; preserve counters/created_at/history on resave.
- [ ] Test independent roots, fan-out/merge, both conditional ports, cycles and dangling edges.
- [ ] Verify effects independently; unsupported operations fail; templates execute.
- [ ] Verify original input, node errors/types/timing; rollback partial persistence and cascade deletion.

### GENERATOR-F049 · `components/no_code_workflow_builder/ui`

Reviewed by `/root/review_022`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--no_code_workflow_builder--ui.md>).

- [ ] Repair package/layout/entry/JSX; dependency: chosen frontend host. Acceptance: generated UI compiles and repaired Vitest suite runs.
- [ ] Add adapters, controlled state, Handles/selection/unique IDs and drafts; dependency: shared Rust DTO. Acceptance: create/connect/edit/save/reload preserves metadata and ports; execution uses current edits.
- [ ] Fix IPC/outcomes and wire validation; dependency: runnable Rust command host. Acceptance: rejected saves show errors without success; malformed/cyclic graphs are blocked.
- [ ] Replace mock history/health and apply settings/config; dependency: real backend/settings store. Acceptance: failed/missing runs and unavailable backend display truthfully; settings survive restart.

### GENERATOR-F050 · `components/notification_system`

Reviewed by `/root/review_068`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--notification_system.md>).

- [ ] Consolidate legacy `notify.rs` with canonical library ownership.
- [ ] Implement canonical transports/outcomes and required manifest dependencies per child report.
- [ ] Regenerate bundles and verify package/API and channel behavior; qualify documentation claims.

### GENERATOR-F051 · `components/notification_system/src`

Reviewed by `/root/review_023`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--notification_system--src.md>).

- [ ] Replace console dispatch and unconditional success with configured transports and typed outcomes.
- [ ] Adapt consumers/generation integration to the result contract.
- [ ] Add channel and failure coverage plus controlled delivery evidence; correct documentation claims.

### GENERATOR-F052 · `components/object_storage_s3`

Reviewed by `/root/review_069`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--object_storage_s3.md>).

- [ ] Implement canonical S3 operations and manifest dependencies; reconcile the legacy file.
- [ ] Verify generated consumer wiring and controlled provider round-trips.
- [ ] Update completion claims and replace format-only acceptance evidence.

### GENERATOR-F053 · `components/object_storage_s3/src`

Reviewed by `/root/review_024`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--object_storage_s3--src.md>).

- [ ] Implement configured put/delete and observable failure results.
- [ ] Verify bytes/key preservation and delete against a controlled S3-compatible fixture.
- [ ] Cover credential/provider errors and reserved-character keys.
- [ ] Verify generated consumer wiring and revise unsupported completion claims.

### GENERATOR-F054 · `components/read_replicas_manager`

Reviewed by `/root/review_070`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--read_replicas_manager.md>).

- [ ] Resolve canonical/legacy file ownership and ensure generated output contains the intended source.
- [ ] Implement explicit empty-list behavior; verify empty, single, and wraparound selections.
- [ ] Align scaling claims with a demonstrated database caller or document this as an endpoint selector.

### GENERATOR-F055 · `components/read_replicas_manager/src`

Reviewed by `/root/review_025`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--read_replicas_manager--src.md>).

- [ ] Implement explicit empty-list behavior and test empty/single/multiple endpoints.
- [ ] Scope capability documentation accurately or wire a database adapter with read routing and primary writes.
- [ ] If health gating is implemented, verify failed/stale replicas are skipped and recovery restores selection.

### GENERATOR-F056 · `components/reporting_engine`

Reviewed by `/root/review_071`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--reporting_engine.md>).

- [ ] Resolve canonical PDF/CSV gaps and manifest dependencies with child owner.
- [ ] Decide and document legacy-file ownership; remove or synchronize it.
- [ ] Verify valid formats and regenerate affected component bundles.

### GENERATOR-F057 · `components/reporting_engine/src`

Reviewed by `/root/review_026`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--reporting_engine--src.md>).

- [ ] Implement or explicitly mark mock PDF behavior.
- [ ] Correct CSV serialization and validate round-trips.
- [ ] Add format-validity acceptance checks; regenerate component copies.

### GENERATOR-F058 · `components/search_engine_local`

Reviewed by `/root/review_072`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--search_engine_local.md>).

- [ ] Consolidate duplicate source after confirming path-based consumers.
- [ ] Resolve/document full-text and document-lifecycle requirements with the child component review.
- [ ] Verify bundle propagation and actual application invocation.

### GENERATOR-F059 · `components/search_engine_local/src`

Reviewed by `/root/review_027`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--search_engine_local--src.md>).

- [ ] Specify token, empty-query, ordering, duplicate-ID, and persistence behavior.
- [ ] Verify mixed-case queries, repeated-ID updates, removal, and agreed multi-term semantics.
- [ ] Confirm generated consumers invoke the library and document realistic dataset limits.

### GENERATOR-F060 · `components/secrets_management_vault`

Reviewed by `/root/review_073`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--secrets_management_vault.md>).

- [ ] Define storage, authorization, lifecycle and backend requirements with the child implementation owner.
- [ ] Establish canonical-source/generation policy and verify bundled crates compile from the intended entry point.
- [ ] Verify synthetic-secret recovery, denied access, backend errors and secret-free logging before restoring production claims.

### GENERATOR-F061 · `components/secrets_management_vault/src`

Reviewed by `/root/review_028`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--secrets_management_vault--src.md>).

- [ ] Specify backend, key custody, authorization, retention and rotation.
- [ ] Implement backend and consumer; verify restart recovery and denied access/error behavior.
- [ ] Check missing keys, overwrite/deletion, secret-free errors/logs and backend integration using synthetic credentials.

### GENERATOR-F062 · `components/security_zero_trust`

Reviewed by `/root/review_074`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--security_zero_trust.md>).

- [ ] Consolidate or explicitly document the legacy root source.
- [ ] Verify generated bundle library selection and public API after consolidation.

### GENERATOR-F063 · `components/security_zero_trust/src`

Reviewed by `/root/review_029`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--security_zero_trust--src.md>).

- [ ] Define and implement duplicate-resource semantics.
- [ ] Add policy boundary and duplicate-policy tests.
- [ ] Wire verified session context into protected operations and test enforcement.
- [ ] Align documentation with predicate-only capability until integration is verified.

### GENERATOR-F064 · `components/support_portal_internal`

Reviewed by `/root/review_075`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--support_portal_internal.md>).

- [ ] Correct the CSS declaration and inspect multi-ticket rendering.
- [ ] Define ticket fields and resolution callback/service ownership; test successful resolution, rejection, and duplicate clicks.
- [ ] Mount the portal in a selected generated Svelte host and verify the supplied ticket list and resolved state agree after refresh.
- [ ] Reconcile completion claims with the remaining UI-shell behavior.

### GENERATOR-F065 · `components/tax_calculation_service`

Reviewed by `/root/review_076`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--tax_calculation_service.md>).

- [ ] Consolidate/document the canonical source and check standalone-file references.
- [ ] Run focused canonical crate tests after remediation; confirm generated finance/ecommerce bundles expose the same implementation.
- [ ] Address canonical child-review tasks and verify a checkout caller receives calculation errors.

### GENERATOR-F066 · `components/tax_calculation_service/src`

Reviewed by `/root/review_030`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--tax_calculation_service--src.md>).

- [ ] Extend `lib.rs:29–31` with unsupported/normalized identifier, nonfinite, overflow, refund, and rounding-boundary cases.
- [ ] Verify configured-zero versus unsupported behavior and deterministic minor-unit totals.
- [ ] Wire one generated checkout consumer; verify calculation errors reach its caller.

### GENERATOR-F067 · `components/timeseries_db_influx`

Reviewed by `/root/review_077`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--timeseries_db_influx.md>).

- [ ] Add provider dependencies with canonical client remediation.
- [ ] Remove or document/enforce the legacy source copy.
- [ ] Verify generated-component behavior and correct readiness documentation.

### GENERATOR-F068 · `components/timeseries_db_influx/src`

Reviewed by `/root/review_031`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--timeseries_db_influx--src.md>).

- [ ] Implement configured provider transport and error contract.
- [ ] Resolve duplicate source and document supported API/precision.
- [ ] Verify range filtering, round trip and failure paths.

### GENERATOR-F069 · `components/uptime_monitor`

Reviewed by `/root/review_078`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--uptime_monitor.md>).

- [ ] Implement real monitoring using the child review's acceptance cases.
- [ ] Resolve legacy `monitor.rs` ownership and update documentation.
- [ ] Regenerate and validate affected bundles.

### GENERATOR-F070 · `components/uptime_monitor/src`

Reviewed by `/root/review_032`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--uptime_monitor--src.md>).

- [ ] Implement actual checks and explicit failure semantics.
- [ ] Replace constant-only test with local transport/failure cases.
- [ ] Align documentation and regenerate affected bundles.

### GENERATOR-F071 · `components/user_analytics_posthog`

Reviewed by `/root/review_079`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--user_analytics_posthog.md>).

- [ ] Remove or explain the unused root duplicate and retain canonical source ownership.
- [ ] Complete child-report delivery/instrumentation work and reconcile completion claims.
- [ ] Verify Cargo target selection and generated bundle contents after changes.

### GENERATOR-F072 · `components/user_analytics_posthog/src`

Reviewed by `/root/review_033`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--user_analytics_posthog--src.md>).

- [ ] Implement/configure sink and caller wiring.
- [ ] Assert operations/failures; document logging policy.
- [ ] Correct capability claims; verify generated integration.

### GENERATOR-F073 · `components/user_management`

Reviewed by `/root/review_080`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--user_management.md>).

- [ ] Establish `src/lib.rs` as the sole maintained implementation and remove the divergent legacy API.
- [ ] Verify generated output and any custom consumers resolve the canonical crate; compile a representative generated consumer after cleanup.
- [ ] Complete review 034's persisted updates, unknown-user rejection, role behavior, and independent-user acceptance checks.

### GENERATOR-F074 · `components/user_management/src`

Reviewed by `/root/review_034`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--user_management--src.md>).

- [ ] Persist status changes and verify after reopening storage.
- [ ] Reject unknown/empty IDs and invalid statuses without creating users.
- [ ] Verify two users retain independent names, roles, and statuses; implement documented role changes.

### GENERATOR-F075 · `components/waf_security_layer`

Reviewed by `/root/review_081`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--waf_security_layer.md>).

- [ ] Establish and document one canonical WAF source; remove redundant implementation if unused.
- [ ] Complete child-report security behavior and middleware acceptance checks.
- [ ] Align WAF production/security claims with verified behavior.

### GENERATOR-F076 · `components/waf_security_layer/src`

Reviewed by `/root/review_035`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--waf_security_layer--src.md>).

- [ ] Canonicalize/deduplicate IPs and test equivalent IPv6 forms.
- [ ] Test benign names, encoded payloads, and body handling against documented policy.
- [ ] Verify middleware rejects blocked peers before handlers; revise unsupported security claims.

### GENERATOR-F077 · `components/webhook_system`

Reviewed by `/root/review_082`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--webhook_system.md>).

- [ ] Implement canonical delivery and update manifest dependencies (child report).
- [ ] Retire or clearly identify legacy `webhook.rs` and verify generated bundles.
- [ ] Reconcile production-ready documentation with verified delivery behavior.

### GENERATOR-F078 · `components/webhook_system/src`

Reviewed by `/root/review_036`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--webhook_system--src.md>).

- [ ] Implement delivery and error contract.
- [ ] Replace unconditional-success test with receiver/failure checks.
- [ ] Reconcile production claims and generated-copy ownership.

### GENERATOR-F079 · `components/zap_hosting_management`

Reviewed by `/root/review_124`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--zap_hosting_management.md>).

- [ ] Clarify documentation-only capability and reconcile advertised assets.
- [ ] Verify generated status against the declared capability.

### GENERATOR-F080 · `components/zap_hosting_management/docs`

Reviewed by `/root/review_083`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--zap_hosting_management--docs.md>).

- [ ] Reconcile all four documents with actual supported application/build paths and remove unsupported readiness claims.
- [ ] Validate runbooks in an isolated fresh Linux environment, including first certificate issuance and failed-backend health checks.
- [ ] Prove backup/restore preserves seeded records and retention never deletes live or unrelated databases.
- [ ] Verify runtime tools, executable monitoring scripts, renewal, and non-root service permissions.

### GENERATOR-F081 · `components/zap_hosting_management/scripts`

Reviewed by `/root/review_125`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--components--zap_hosting_management--scripts.md>).

- [ ] Reconcile included-script claims with delivered files.
- [ ] If scripts ship, require syntax checks, failure exit codes, a disposable backup/restore check, and generated-output presence verification.

### GENERATOR-F082 · `core`

Reviewed by `/root/folder_review_dispatcher/review_001`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--core.md>).

- [ ] Correct readiness, inclusion counts, and unavailable-component reporting.
- [ ] Establish runnable application output or accurately label source bundles.
- [ ] Exclude nested repositories, caches, and secret files from copying.
- [ ] Verify failed replacement preserves old output without mixed artifacts.
- [ ] Verify configuration works across checkout locations and working directories.

### GENERATOR-F083 · `docs`

Reviewed by `/root/review_037`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--docs.md>).

- [ ] Mark historical reports and replace unsupported current readiness/coverage promises.
- [ ] Align CLI examples, configured-name constraints, paths, and both bundle layouts.
- [ ] Publish capability/test scope tied to saved evidence and core readiness correction.
- [ ] Verify documented commands in isolated fixtures and require separate provider/generated-application acceptance before future completion claims.

### GENERATOR-F084 · `templates`

Reviewed by `/root/review_084`. [Evidence, expected behavior and patch details](<C:/IEDB/STRAW Stack/review/folders/generator--templates.md>).

- [ ] Verify default invocation from another working directory resolves this checkout.
- [ ] Compare selections for all nine names between controller and bundler against canonical requirements.
- [ ] In isolated temporary fixtures, reject unknown templates/missing components and preserve a sentinel prior bundle after injected copy failure.
- [ ] Verify successful manifests exactly match copied component directories and require explicit application build integration before a ready/production claim.

## Generated/copied folder comparison

443 nested generated/copied folders in this root were classified and compared. Across the generator, 18 bundles contain 236 component copies: 225 match source and 11 drift. None has a root application build entrypoint. Matching copies inherit source defects. [Every folder comparison and exact changed/missing/extra files](<C:/IEDB/STRAW Stack/review/copy-comparison.json>). Stack build/test folders have artifact inventories. Generated public/ui was separately reproduced by a clean native compiler build:150files match, no extras; see frontend-copy-comparison.json.
