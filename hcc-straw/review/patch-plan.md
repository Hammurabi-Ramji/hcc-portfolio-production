# Proposed diff and patch map

Date: 2026-10-09. This is a review plan; production implementation patches have not been applied. Folder reports provide the detailed file/line evidence and acceptance checks. Resolve behavior and package contracts before refreshing copied bundles.

## Patch 1 — Establish current build evidence and truthful status

**Snapshot transition:** The desktop was replaced during this audit. The user selected the current Rust workspace/Trunk tree. Original Svelte/npm/Playwright findings are historical, and the original patch map is preserved under `history/original-patch-plan.md`.

**Current:** Desktop has a local Cargo workspace. Initial lock/compiler mismatches were resolved during concurrent work. The current source workspace now passes `cargo test --workspace --offline --locked` with 15 tests. The compiler overlays generated modules, leaving a stale-output hazard; frontend copy/build evidence is recorded separately. Web type check still has 19 diagnostics.

**Desired:** Reproducible package-local checks and documentation naming the compiler, runtime, exact snapshot and remaining unverified integrations.

**Targets:** straw-app/Cargo.toml, Cargo.lock, Trunk.toml, tools/frontend-build source/manifest, desktop README, web package/config/type-check targets and historical output documentation.

**Patch:** Reconcile the chosen frontend compiler implementation, dependencies, lockfile and runtime documentation. Reproduce builds after explicit dependency provisioning. Repair web compiler/import/dependency failures. Label historical readiness reports by snapshot. Load web globals.css, declare semantic color tokens and scan hook JSX in Tailwind.

**Acceptance:** Current locked Cargo checks and supported frontend build; web type check/build; emitted readable light/dark CTA/toast styles; documentation naming unresolved installer/native/live-model gates. The prior ancestor-workspace failure is superseded by the new local workspace.

**Distribution metadata:** The frontend copier only copies JavaScript runtime files; local third-party license texts and NOTICE are absent from generated output. Include those files through the compiler asset copier/Trunk/Tauri packaging configuration and verify final distribution paths. This is a repository-backed packaging gap, not an assessment of upstream authenticity or legal certification. See the dedicated third-party report.


## Patch 2 — Repair the web API and session contract

**Current:** `AuthContext.tsx` imports executable `api` from a types module, services import absent `./api`, two clients disagree on response unwrapping, and middleware reads a cookie while UI persists only local storage. Auth routes are absent. The App Router `/api` file uses a Pages Router default export. User/project handlers use demonstration state without a complete authorization boundary.

**Desired:** One typed API client, one response envelope and a server-validated session used consistently by pages and routes. Authentication endpoints exist before protected features are described as functional.

**Targets:** `apps/web/lib/api-client.ts`, `lib/api.ts`, `services/*.ts`, `context/AuthContext.tsx`, `middleware.ts`, `app/api/route.ts`, new `app/api/auth/*/route.ts`, `app/api/users/route.ts`, `app/api/projects/route.ts`, and their consumers/types.

**Patch:** Preserve `AxiosResponse` in successful transport interceptors; use `client.get<ApiResponse<T>>` (and analogous methods), unwrapping exactly once in the wrapper. Import that wrapper from `@/lib/api-client` everywhere. Return its envelope directly from services rather than nesting envelopes. Implement and validate the auth/session mechanism, then hydrate the user with `/me`; enforce permissions and ownership server-side. Replace the default API export with named supported method handlers. Explicitly allow unauthenticated login/register requests; route-level authorization remains mandatory.

Align list DTOs as part of that change: routes currently return `{users|projects, meta}` while services and consumers promise `{data, meta}`. Specify JSON timestamp strings versus decoded domain `Date` values, and return required user flags truthfully. Compile-time casts alone do not validate a server payload. Inventory missing item/profile/file/auth/action routes before retaining their service methods as supported functionality.

**Acceptance:** Type check; login/signup/logout/refresh and reload; forged/expired session rejection; anonymous and wrong-owner mutation rejection; one envelope shape; HTTP method/preflight behavior; persistence across restart if promised.

Mount the repaired client `AuthProvider` from `apps/web/app/layout.tsx`; current auth-consuming pages otherwise throw before session behavior can be exercised. Hydrate navigation from the same user state rather than hardcoding guest controls on individual pages.

Consumers must wait for completed session/profile hydration. In particular, `app/settings/page.tsx` currently captures an initially null user into empty form fields and never synchronizes them; after shared auth repair, a direct visit could submit blanks over an existing profile. Initialize after identity/profile resolution, block premature submission, preserve dirty edits during refresh, and update shared user state from the saved response. Verify delayed hydration and user switching as well as ordinary save/reload.

## Patch 3 — Review and validate the replacement desktop contracts

**Current:** Old src/lib, no-code UI, node, code_gen and wasm-compute trees were removed. Authored code now lives in crates/engine, crates/axum-loop, crates/wasm-frontend, src-tauri/src, ui and tools/frontend-build. README specifies camelCase contracts, UUID identities, bounded loopback networking, validated named-file generation and text-only attachments. Earlier attachment, blank-ID, dirty-store and recursive-Fibonacci findings must not be reapplied without checking replacement code.

**Desired:** Current implementation/tests substantiate explicit contracts; old-flow compatibility/migration and supported UI capabilities are documented.

**Current actionable findings:** Missing/wrong-typed Write File content becomes an empty overwrite; inactive conditional branches still execute; empty CSV delimiters panic. DAG preflight does not reject all disconnected required inputs/config errors before side effects. Generated paths can conflict as file versus directory prefixes and partially commit. Pending saves can resurrect deleted flows, clear dirty state for later edits or override navigation; attachment reads can race Send. Interrupted runs remain Running. Detailed evidence and exact patch targets are in the current engine/node/Tauri/UI reports.

**Concrete changes:** Validate all required typed inputs/configuration before executing any node; reject invalid writer content before opening files; add inactive-edge/skipped-node semantics, including merges; use fallible delimiter validation/headerless CSV handling. Reject normalized path-prefix conflicts before staging and choose rollback or structured partial-result semantics. Serialize per-flow lifecycle operations, preserve edit revisions/drafts, guard obsolete async callbacks and attachment ingestion, and recover interrupted-run statuses on startup. Stage the frontend compiler output in a clean tree so stale modules cannot satisfy imports.


**Targets:** Current engine/src and nodes, axum-loop/src, wasm-frontend/src, src-tauri/src/lib.rs, ui/*.svelte and their dedicated reports.

**Patch:** Apply only current evidence-backed findings from replacement-folder reports. Recheck JSON round trips, path confinement/staging/refinement, graph validation/failure propagation, persistence/history, UI state and WASM bounds. Specify old database/graph migration or deliberate incompatibility. Separate real native IPC/SQLite/model checks from unit coverage and historical mocks.

**Acceptance:** Current unit/build logs, native command smoke checks, two independently saved/reopened flows, failed-node/history behavior, generated file path/refinement checks, text attachment fidelity, bounded WASM inputs. Live model inference and installers remain separate unverified gates unless exercised.

## Patch 4 — Make generator manifests and output replacement honest

**Current:** `core/controller.py` counts a known unavailable component as included and always emits `ready_to_build`. It copies nested repository metadata, merges after failed cleanup and chooses a historical configured root if that path happens to exist. The template bundler maintains a separate mapping.

**Desired:** Availability/implementation level is explicit; bundle status follows validation; generation is confined, failure-safe and portable; templates share a source of truth.

**Targets:** Generator `core/controller.py`, `core/config.json`, `templates/bundle_templates.py`, component metadata (new), controller regression checks (new), and generator README/docs.

**Patch:** Separate unknown requests, known unavailable implementations, shell/mock components and successful inclusions. Add metadata for implementation level and runtime dependencies; directory nonemptiness is insufficient. Emit `source_bundle`/`incomplete` until assembly/build validation warrants readiness. Validate resolved template/component paths before any replacement. Stage/validate output and abort on replacement failure. Ignore `.git`, dependencies, build caches and secret files. Resolve configured paths consistently. Share declarative template component mappings.

**Acceptance:** CLI help/list does not generate output (already verified); invalid options rejected (already verified); deduplication works (already verified); known unavailable components reported; no mixed output on failure; unsafe paths and nested metadata excluded; same template selection in both interfaces; configurable roots tested independently of current working directory.

## Patch 5 — Define and assemble a runnable generated application

**Current:** 18 saved bundles contain component copies and manifests; none has a root Cargo/npm application entrypoint. Component unit tests pass but many named providers are demonstrators rather than live integrations. No-code/ZAP components are not in default templates.

**Desired:** The current starter-bundle promise is explicit. If the broader documented application promise is retained, each generated app has bootstrapped frontend/backend/desktop wiring, component registration, configuration and tests. Optional integrations are selected deliberately.

**Targets:** Generator application skeletons (new), component manifests/entrypoints, `Cargo.toml`, controller/template schema, UI/Tauri/provider components, no-code package boundaries, ZAP docs/scripts and documentation claims.

**Patch:** First catalogue implemented, demo/mock, shell and documentation-only components. Avoid representing console output/constant returns as provider delivery. Implement selected provider adapters with errors/configuration and meaningful behavior tests, or explicitly label them unsupported/demo. Assemble the shared application skeleton and generate package manifests/module registration. Keep external services optional and configuration explicit. Do not infer legal/security certification from template names.

Canonical Rust implementation ownership also needs to be explicit: most component manifests compile `src/lib.rs`, while adjacent legacy `.rs` files are copied into bundles and may expose different APIs. Repair the compiled implementation, check external consumers before removing legacy files, and retain a compatibility facade only where needed. Document the supported entrypoint so editing a bundled legacy file cannot be mistaken for changing the compiled application.

**Acceptance:** Generate and smoke-test each supported template from its root; check startup, component invocation, persistence and failure paths. Real provider tests remain conditional and visibly separate from offline unit tests. Document unsupported integrations and manual assembly requirements.

## Patch 6 — Refresh and verify every saved copy

**Current:** 236 component copies across 18 bundles: 225 match their source; 11 Axum `src/lib.rs` copies differ. The current diff is an unused-variable rename (`app` to `_app`), so this drift is cosmetic rather than a demonstrated runtime difference. Three are under templates (logistics, marketing, real estate), eight are under output (every output except healthcare). A matching source copy still inherits any source defect.

**Desired:** Copies are reproducible derivatives of reviewed source, with documented intentional customization.

**Targets:** Source `components/api_layer_axum/src/lib.rs` and its legacy `api.rs`, both bundlers, all saved template/output manifests and component trees, generated build/test artifacts in Stack.

**Patch:** Fix canonical source and generation behavior first. Record any customization before regeneration. Generate into an isolated verification location, compare selected component trees/manifests, build/test supported applications, then replace saved bundles. Refresh Stack build/test artifacts only by their actual build/test commands. Avoid manually patching 236 copies independently.

**Acceptance:** All selected copied trees match the intended version except explicitly approved overrides; manifests match actual content and validation status; regeneration is repeatable; build/test reports describe the new snapshot. `copy-comparison.json` documents every generated/copied nested folder.

[Snapshot copy-alignment diff](copy-alignment.patch) contains the exact current source-to-copy changes for all 11 drifted Axum files. It has not been applied. It aligns copies with the current source snapshot; that source still needs the actual-server startup repair in patch 5 before refreshed bundles can claim backend functionality.

## Patch 7 — Repair hosting and backup instructions

**Current:** ZAP's Docker guide deletes old `.db` files from the live data directory, can include the configured active database, and restores a binary SQLite backup as SQL input. Runbooks start `dist/background.js` without a demonstrated repository producer, reference TLS certificates before creating them, and use health/backup tools absent from the runtime image.

**Desired:** Commands correspond to a supported deployable application, backups restore seeded data, retention touches only named backups, and fresh-host startup/HTTPS/health behavior is reproducible.

**Targets:** Generator `components/zap_hosting_management/docs/ZAP_HOSTING_DOCKER_DEPLOYMENT.md`, `ZAP_HOSTING_DEPLOYMENT_WORKFLOW_BUILDER.md`, `ZAP_HOSTING_QUICK_REFERENCE.md`, and `ZAP_HOSTING_INTEGRATION_SUMMARY.md`. See the dedicated docs report for exact lines.

**Patch:** Restrict retention to a dedicated backup directory and generated backup-name pattern. Use SQLite's backup API and matching restore procedure with integrity/ownership checks. Choose the actual web/backend artifact and consumed configuration before rewriting service and container commands. Bootstrap HTTP certificate issuance before enabling TLS, provide renewal/reload hooks, install required runtime tools or use available alternatives, and proxy a real readiness endpoint. Remove cron examples that overwrite existing jobs.

**Acceptance:** Isolated seeded backup/restore round trip; retention preserves live and unrelated databases; fresh-host build/start and first certificate issuance; backend failure produces failed readiness. No deployment was performed during this review; provider-specific plan and retention claims remain unverified.

## Patch ordering

1. Scope/status decisions and project-local build boundaries.
   Repair the dangerous backup-retention example before anyone uses the hosting runbook.
2. Direct frontend/build failures and API/IPC contracts.
3. Authorization, file containment and graph validation before feature expansion.
4. Generator truthfulness, confinement and replacement behavior.
5. Selected component implementations and runnable application assembly.
6. End-to-end acceptance, documentation reconciliation and copy refresh.

The per-folder reports expand these patches, including issues not summarized here. Unchecked tasks indicate proposed work; passed review checks do not mark implementation tasks complete.
