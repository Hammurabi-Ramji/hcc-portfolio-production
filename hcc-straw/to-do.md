# STRAW Stack — to-do

Reviewed: 2026-10-09. **Audit baseline complete.** 52/52 assigned Stack folder reports and136/136 across both roots were saved for the captured audit tree. Current remediation/concurrent additions require the separate evidence listed below.

The review assigns a distinct agent to each current nested source folder; Stack root is reviewed by the main agent. Generated/copied folders are compared to source rather than assigned duplicate agents, as requested. The review excludes dependencies, Git internals and caches. The desktop was replaced during the audit; the user selected the current replacement tree. Original evidence is retained separately and removed folders are excluded from active tasks. Remediation is now running under the supplied 61-assignment dispatcher. Checkboxes change only when current implementation evidence satisfies the stated task; an audit alone does not satisfy them.

[Concrete diff and patch map](review/patch-plan.md) · [Folder agent registry](review/agent-registry.json) · [Current source/copy inventory](review/current-inventory.json) · [Snapshot transition](review/tree-transition.json)

## Remediation execution

<!-- remediation-status:start -->

Current assignments: **DONE: 14**, **EXECUTING: 2**, **PLANNED: 45**. 61 total. Only DONE dependencies release subsequent assignments.

[Execution registry](review/remediation-registry.json) · [Settlement ledger](review/settlement-ledger.jsonl) · [Arbitration and decisions](review/arbitration.md) · [Local service contract](review/web-backend-contract.md)

User choices: separate local Rust/Axum service with SQLite; optimized release WASM; whole-tree source scan blocks release. Runtime/package acceptance remains pending until its own evidence is recorded.

<!-- remediation-status:end -->

## Concurrent source additions

- [x] Review the newly added straw-app/site folder separately and compare its generated site-dist copies; this folder was absent from the initial61-assignment roster. Evidence: `review/site-folder-comparison.md`.
- [x] Rebase staging verification on the latest site/compiler/UI inputs and record a stable snapshot; preserve the concurrent site's commands and both import maps.
- [x] Resolve the unintended formatter change to site_cache.rs without overwriting newer edits.

[Transition evidence](review/concurrent-site-transition.json). Earlier compiler counts/results apply to their captured snapshot; they do not certify the newly added site.

## Audit baseline validation evidence

- Historical desktop frontend: an `npm run check` **failed**, 247 errors and 1 warning; that package was removed. It is not a current build result and it is not the sovereign desktop or Eduba path. Sovereign checks are `trunk build`, `cargo tauri build`, `cargo test --workspace --offline --locked`, and `cargo tree` from `straw-app/`. Eduba is the append-only SQLite archival ledger (`eduba-ledger`, `eduba-server`), sqlx `query!` macros, Axum on `127.0.0.1`. No Node.js, npm, Python, Playwright, or Vite for that path.
- Legacy `apps/web` only, outside the sovereign desktop and Eduba path: `npm run type-check` **failed**, 19 diagnostics. That check is not how Eduba or the desktop is built.
- Current desktop: `cargo test --workspace --offline --locked` **passed**, 15 tests (12 engine, 2 Axum, 1 WASM). Earlier lock/sandbox failures were superseded by this successful source-workspace check.
- Generator Rust: `cargo test --workspace --offline` **passed**, 35 tests across 32 crates; no doc tests.
- Current native frontend: isolated clean compiler build **passed**; all 150 generated browser files match saved copies, with no extras. Static graph validates 107 modules; live UI behavior remains unverified.
- Generator CLI/fixture: help/list/no-argument output preservation and flag validation verified; placeholder readiness defect reproduced.
- Runtime, installers, live provider/Ollama behavior and generated-application builds remain unverified.

[Check logs and fixture evidence](review/README.md)

## Patch order and cross-folder tasks

- [x] **S03 · P1 · Restore web type/build contracts.** Current: 19 TypeScript diagnostics. Patch `apps/web/package.json` (missing resolver dependency), context/service imports, hook/middleware types, App Router exports, client response types and user role typing. Done when `npm run type-check` and the subsequent production build pass. Evidence: `review/web-type-check.log`.
- [x] **S04 · P1 · Implement one web session/API boundary.** Current: missing auth endpoints, cookie/local-storage mismatch, unvalidated cookie checks and demonstration CRUD state. Patch client/context/services, actual auth routes and server-side role/resource ownership checks. Done when login, reload, logout, expired/forged-session and wrong-owner tests pass; durable writes survive restart if promised. Depends on S03 and the chosen backend/store. See patch 2.
- [x] **S13 · P1 · Restore web root UI wiring.** Patch apps/web/app/layout.tsx to import globals.css and mount the repaired AuthProvider; define missing semantic color tokens in globals.css/tailwind.config.js and include hook JSX in Tailwind scanning. Done when auth-consuming pages render without provider exceptions and built light/dark CTA/toast styles have readable computed colors. Depends on S03/S04 and the PostCSS pipeline; see app/package reports.
- [x] **S14 · P2 · Clean and stage generated frontend assets.** The native compiler/source/dependencies now agree and the current workspace test command passes. A-F050 now generates and validates a fresh staging tree, publishes with guarded renames, and proves rejection/preservation cases. Integrated latest-snapshot rollout remains A-S14. Done when renamed/deleted components fail stale imports and failed builds preserve the previous complete output; compare isolated clean output with every saved module.
- [x] **S15 · P2 · Complete current native/UI acceptance.** Current source `cargo test --workspace --offline --locked` passed 15 tests. Earlier Svelte 247 errors, ancestor-workspace failure and Playwright 168 discovery are historical and are not the sovereign desktop or Eduba path. Verify real desktop IPC, save/run/history, generated/refined files, attachment ordering, WASM button behavior and installer execution after current source patches; record exact snapshot/results. Build/test success alone does not verify these interactions. Eduba checks stay on `cargo test --workspace --offline --locked`.
- [x] **S16 · P2 · Reconcile historical desktop instructions and release gates.** Current README/verification now describe rsvelte_core and text-only camelCase contracts; old output guides/demo still describe the removed package. Update current entry links and label archived instructions. Record disposition of the documented failed G3 literal source scan and pending G6 observed UI gate; retain upstream provenance and explicit old-flow incompatibility. Done when current setup, release claims and evidence agree. Include the local Svelte/clsx license texts and NOTICE in generated distributions and verify packaged paths.
- [x] **S17 · P1 · Prevent destructive node inputs and incorrect branching.** Patch current engine node/DAG contracts to reject absent or wrong-typed writer content before touching files, propagate inactive conditional branches as skipped, and reject empty CSV delimiters without panic. Also validate required input/config types before side effects. Done when sentinel files survive invalid graphs, only the selected branch writes, and every failure has a terminal run record. See current engine/node reports.
- [x] **S18 · P2 · Repair current generation and flow concurrency.** Reject output file/directory prefix conflicts before writing and define rollback/partial-outcome semantics. Serialize save/delete lifecycle operations; retain dirty edits/drafts and ignore obsolete async navigation completions. Resolve interrupted running records on restart. Done when failed batches leave no unexplained partial output, delayed saves cannot resurrect deleted flows, and visible dirty state matches persisted data. See current engine/Tauri/UI reports.

Use the named patch map for before/after behavior, file targets, dependencies and acceptance. Below, each folder has its own report with direct-file inventory, documentation comparison and specific patch details. Related tasks may share a patch; avoid fixing duplicate implementations independently.

## Individual folder review and tasks

### STACK-F001 · `.`

Reviewed by `/root`. [Evidence, expected behavior and patch details](review/stack-root-review.md).

- [x] Repair current web build/API/session contracts and current destructive node behavior through their owning folders.
- [x] Document desktop/web/generator boundaries, supported setup and current validation at the root.
- [x] Reconcile historical guides/demo with the replacement and current release gates.
- [x] Define artifact/cache/secret exclusions without treating authored documentation as disposable output.

### STACK-F002 · `apps`

Reviewed by `/root/stack_apps`. [Evidence, expected behavior and patch details](review/folders/stack--apps.md).

- [x] [P1] Repair setup commands and environment-template locations in web README/quick start/setup guide; verify from a clean terminal.
- [x] [P1] Decide the server/deployment boundary and reconcile architecture/completion claims with implemented services; depends on root product scope decision.
- [x] [P2] Add application-container documentation and explain desktop/web ownership.

### STACK-F003 · `apps/web`

Reviewed by `/root/review_085`. [Evidence, expected behavior and patch details](review/folders/stack--apps--web.md).

- [ ] Resolve child compiler errors plus manifest/import blockers; clean type-check and production build.
- [ ] Choose session/backend ownership; exercise login, refresh, logout, expired/forged cookie, protected page, and protected/public API requests.
- [ ] Repair lint dependency/configuration; run package lint successfully.
- [ ] Inspect built toast CSS for all four variants.
- [ ] Follow corrected quick start from a clean checkout; verify declared commands and URL configuration.

### STACK-F004 · `apps/web/app`

Reviewed by `/root/review_086`. [Evidence, expected behavior and patch details](review/folders/stack--apps--web--app.md).

- [ ] Load CSS and mount the repaired provider in the root layout.
- [ ] Define/map semantic tokens; check computed CTA background and readable foreground in light/dark modes.
- [ ] Render home, login, signup, dashboard and settings without provider exceptions; confirm responsive spacing, gradient, and navigation.
- [ ] Connect homepage Navbar to hydrated user state and check anonymous/authenticated variants.

### STACK-F005 · `apps/web/app/about`

Reviewed by `/root/review_087`. [Evidence, expected behavior and patch details](review/folders/stack--apps--web--app--about.md).

- [ ] Coordinate provider/session work, then map the real user into About Navbar; remove the unused Link import.
- [ ] Reconcile technology/security/testing copy with implemented platform evidence.
- [ ] Verify `/about` anonymously and after login on desktop/mobile: content visible, correct auth actions, no provider exception; run the root's normal build/type checks after coordinated changes.

### STACK-F006 · `apps/web/app/api`

Reviewed by `/root/review_088`. [Evidence, expected behavior and patch details](review/folders/stack--apps--web--app--api.md).

- [x] Decide/document bare `/api` behavior and allowed-origin/credentials policy.
- [x] Replace the unsupported interface; verify intended methods and unsupported-method behavior over HTTP.
- [x] Verify allowed-origin OPTIONS and actual responses include consistent headers; disallowed origins receive no allow-origin authorization.
- [ ] Verify credentialed cross-origin calls to child endpoints in a real browser (HTTP handler matrix passed in A-F006).

Implementation settlement: **DONE** · [Current agent report](review/agent-output/A-F006.md). Checked tasks require their stated acceptance; downstream integration remains unchecked until verified.


### STACK-F007 · `apps/web/app/api/auth`

Reviewed by `/root/review_126`. [Evidence, expected behavior and patch details](review/folders/stack--apps--web--app--api--auth.md).

- [x] Implement eight endpoint contracts with validation and appropriate statuses; recovery/email contracts return explicit501 because no local transport is implemented.
- [x] Verify Rust HTTP register/login → me → refresh → logout, SQLite restart/revocation persistence and expired/forged-session rejection; recovery endpoints truthfully501.
- [ ] Observe the same lifecycle through Next/browser reload after provider/middleware integration; reset/verification features remain unsupported until separately implemented.

Implementation settlement: **DONE** · [Current agent report](review/agent-output/A-F007.md). Checked tasks require their stated acceptance; downstream integration remains unchecked until verified.


### STACK-F008 · `apps/web/app/api/projects`

Reviewed by `/root/folder_review_dispatcher/review_089`. [Evidence, expected behavior and patch details](review/folders/stack--apps--web--app--api--projects.md).

- [ ] Reject anonymous, forged and expired sessions; verify two users cannot list each other's projects.
- [ ] Create concurrently, restart and exercise two workers; all committed projects remain distinct and readable.
- [ ] Reject malformed bodies/types/statuses and invalid pagination with 400; verify valid search and finite metadata.
- [ ] Verify actual HTTP list/create responses through the repaired service/page; exercise detail/update/delete ownership checks.

### STACK-F009 · `apps/web/app/api/users`

Reviewed by `/root/folder_review_dispatcher/review_090`. [Evidence, expected behavior and patch details](review/folders/stack--apps--web--app--api--users.md).

- [x] Verify anonymous/forged/expired credentials receive 401; regular users receive 403; authorized admins succeed.
- [x] Create then authenticate an account; verify it survives restart and is visible across instances; verify duplicate and concurrent creation cannot overwrite records.
- [x] Reject malformed JSON, nonstring fields and invalid pagination with 400; search remains healthy afterward.
- [x] Confirm returned list/User DTOs match consumers with real JSON responses.

Implementation settlement: **DONE** · [Current agent report](review/agent-output/A-F009.md). Checked tasks require their stated acceptance; downstream integration remains unchecked until verified.


### STACK-F010 · `apps/web/app/dashboard`

Reviewed by `/root/review_091`. [Evidence, expected behavior and patch details](review/folders/stack--apps--web--app--dashboard.md).

- [ ] Repair shared provider/client/session dependencies, then apply loading-aware effect guard.
- [ ] Correct reachable sidebar destinations and wire supported quick actions.
- [ ] Replace or disclose sample metrics/activity; verify loading, failure, empty and real-data states.
- [ ] Verify named mobile controls, keyboard close and focus restoration.
- [ ] Check authenticated direct load/reload, unauthenticated redirect, logout, every exposed link/action and mobile layout.

### STACK-F011 · `apps/web/app/docs`

Reviewed by `/root/review_092`. [Evidence, expected behavior and patch details](review/folders/stack--apps--web--app--docs.md).

- [x] Correct stack/layout/deployment claims and specify `cd apps/web` before commands.
- [x] Identify authentication capabilities as contracts or verified implementations.
- [x] Ensure every visible fragment link resolves and provide the same TOC on mobile.
- [x] From a clean checkout, follow revised instructions; confirm all advertised prerequisites exist and all cards navigate to real content.

### STACK-F012 · `apps/web/app/features`

Reviewed by `/root/review_093`. [Evidence, expected behavior and patch details](review/folders/stack--apps--web--app--features.md).

- [ ] Correct shared capability copy and document planned integrations.
- [ ] Wire session-aware Navbar after provider/session repairs.
- [ ] Verify route rendering, mobile navigation, and build/type checks.

### STACK-F013 · `apps/web/app/login`

Reviewed by `/root/review_094`. [Evidence, expected behavior and patch details](review/folders/stack--apps--web--app--login.md).

- [ ] Restore resolver dependency; rerun web type-check/build after coordinated shared fixes.
- [ ] With delayed success/failure, verify one request per submission, visible pending state, error recovery, and no premature redirect.
- [ ] Verify protected-route callback return, safe fallback for external callbacks, and explicit remember-me semantics.
- [ ] Exercise each retained social/recovery/signup action; keyboard/screen-reader checks cover toggle and errors.

### STACK-F014 · `apps/web/app/profile`

Reviewed by `/root/review_127`. [Evidence, expected behavior and patch details](review/folders/stack--apps--web--app--profile.md).

- [ ] Add the profile redirect and align documentation.
- [ ] Verify authenticated `/profile` reaches settings; anonymous `/profile` redirects to login with callback preserved.

### STACK-F015 · `apps/web/app/projects`

Reviewed by `/root/review_095`. [Evidence, expected behavior and patch details](review/folders/stack--apps--web--app--projects.md).

- [ ] Repair provider, service import, auth persistence and one typed response contract.
- [ ] Verify initial authenticated visit renders seeded cards; empty and failed requests produce distinct states with retry and visible notification.
- [ ] Verify create adds exactly one project, refreshes cards, and reports validation/network failures visibly.
- [ ] Resolve View/dashboard links and authenticated Navbar display; add pending-submit protection.

### STACK-F016 · `apps/web/app/settings`

Reviewed by `/root/review_096`. [Evidence, expected behavior and patch details](review/folders/stack--apps--web--app--settings.md).

- [ ] Repair provider/client/profile-endpoint dependencies; pass web type-check/build.
- [ ] Direct authenticated visit hydrates all five fields; delayed auth cannot submit blanks; anonymous visit redirects after loading.
- [ ] Edited values persist across reload and update context; user switches do not leak prior form data.
- [ ] Successful/failed save shows visible feedback; saving state clears; navigation displays the signed-in user and reaches `/settings`.

### STACK-F017 · `apps/web/app/signup`

Reviewed by `/root/review_097`. [Evidence, expected behavior and patch details](review/folders/stack--apps--web--app--signup.md).

- [ ] Restore resolver/client/provider dependencies; type-check and load `/signup` without import or provider errors.
- [ ] Reject invalid email, weak/mismatched passwords, and unchecked terms without sending requests.
- [ ] Hold a registration response pending; verify one submit request, pending text, and disabled submit; verify retry after rejection.
- [ ] Verify successful registration reaches dashboard and survives reload using the agreed session mechanism.
- [ ] Verify duplicate-account/network errors remain visible and keyboard/screen-reader controls and policy links work.

### STACK-F018 · `apps/web/components`

Reviewed by `/root/review_098`. [Evidence, expected behavior and patch details](review/folders/stack--apps--web--components.md).

- [ ] Correct and adopt the typed role predicate; verify loading, anonymous, allowed, denied, and empty-role cases, with denied children never mounted.
- [ ] Reconcile footer destinations and feature claims with route/deployment owners.
- [ ] Verify mobile toggle/social link names and expanded state using keyboard and accessibility tree.
- [ ] Verify provider-backed guard redirects and successful return navigation with the auth owners.

### STACK-F019 · `apps/web/context`

Reviewed by `/root/folder_review_dispatcher/review_099`. [Evidence, expected behavior and patch details](review/folders/stack--apps--web--context.md).

- [ ] Fix import and shared client envelope contract; TypeScript check passes without auth casts masking errors.
- [ ] Mount provider; render each auth consumer without the missing-provider exception.
- [ ] Test login/register, protected navigation, reload restoration, invalid token, storage failure, refresh and logout against implemented backend endpoints.
- [ ] Assert middleware and client agree on session transport; logout invalidates the server session and refresh cannot retain an invalid user.

### STACK-F020 · `apps/web/hooks`

Reviewed by `/root/review_100`. [Evidence, expected behavior and patch details](review/folders/stack--apps--web--hooks.md).

- [ ] Fix theme import; controller reruns web type-check after coordinated repairs.
- [x] Verify loading/authenticated/logged-out transitions never authorize early.
- [x] Fake-timer check: rapid callback calls execute once with latest arguments; unmount cancels.
- [x] Verify batched storage increments, key switching, absent/corrupt values, removal, and hydration.
- [ ] Verify project/settings success/error messages appear, stack, dismiss accessibly, and expire.

Implementation settlement: **DONE** · [Current agent report](review/agent-output/A-F020.md). Checked tasks require their stated acceptance; downstream integration remains unchecked until verified.


### STACK-F021 · `apps/web/lib`

Reviewed by `/root/folder_review_dispatcher/review_101`. [Evidence, expected behavior and patch details](review/folders/stack--apps--web--lib.md).

- [ ] Repair one envelope contract and all consumer imports; rerun web type-check/build.
- [x] Verify login, empty response, pagination metadata, structured HTTP error, and network error retain the chosen contract.
- [x] Verify legacy token helpers preserve raw values and handle SSR/storage failures; supported cookie client never reads or sends stored credentials (approved architecture).
- [x] Verify upload preserves caller headers; test explicit date components and invalid utility inputs.
- [ ] Document API origin and supply implemented endpoints before claiming web authentication works.

Implementation settlement: **DONE** · [Current agent report](review/agent-output/A-F021.md). Checked tasks require their stated acceptance; downstream integration remains unchecked until verified.


### STACK-F022 · `apps/web/middleware`

Reviewed by `/root/review_128`. [Evidence, expected behavior and patch details](review/folders/stack--apps--web--middleware.md).

- [ ] Complete root middleware acceptance checks; retain or remove this unused directory as housekeeping.

### STACK-F023 · `apps/web/public`

Reviewed by `/root/review_129`. [Evidence, expected behavior and patch details](review/folders/stack--apps--web--public.md).

- [ ] When adding assets, verify their referenced paths and deployed availability.

### STACK-F024 · `apps/web/services`

Reviewed by `/root/review_102`. [Evidence, expected behavior and patch details](review/folders/stack--apps--web--services.md).

- [x] Type-check service imports without assertion-based envelope coercion.
- [x] Exercise singular/list/void success, HTTP errors, network errors, and resolved logical failures through the same client/service path.
- [ ] Verify every advertised route, profile persistence, authenticated ownership, pagination/search, and archive/activate effects.
- [x] Verify unsupported file/avatar/batch methods return typed501 without transport or partial writes; reusable multipart client preserves headers/payloads in offline adapter tests.
- [ ] Reconcile documentation with unsupported file/avatar storage; actual upload support is absent and must not be advertised.

Implementation settlement: **DONE** · [Current agent report](review/agent-output/A-F024.md). Checked tasks require their stated acceptance; downstream integration remains unchecked until verified.


### STACK-F025 · `apps/web/styles`

Reviewed by `/root/review_130`. [Evidence, expected behavior and patch details](review/folders/stack--apps--web--styles.md).

- [ ] Resolve the app report’s stylesheet wiring and verify generated Tailwind CSS visually.
- [ ] Retain this documented optional container unless styles are actually added.

### STACK-F026 · `apps/web/types`

Reviewed by `/root/review_103`. [Evidence, expected behavior and patch details](review/folders/stack--apps--web--types.md).

- [ ] Fix client imports and establish one shared response/pagination contract.
- [ ] Separate wire DTOs from Date domain types; reconcile required User flags with server output.
- [ ] Run web type-check/build through the root reviewer after integration repairs.
- [ ] Assert serialized user/project list responses match shared DTOs and reach service consumers with one envelope; verify timestamp representation explicitly.

Implementation settlement: **DONE** · [Current agent report](review/agent-output/A-F026.md). Checked tasks require their stated acceptance; downstream integration remains unchecked until verified.


### STACK-F027 · `apps/web/utils`

Reviewed by `/root/review_104`. [Evidence, expected behavior and patch details](review/folders/stack--apps--web--utils.md).

- [x] Fix required-field iteration, false/zero semantics, and required custom-message handling; check missing, empty, false, zero, and ordinary valid fields.
- [x] Validate pagination boundaries including 0, NaN, Infinity, fractions, omitted values, and configured defaults.
- [x] Verify clipboard rejection/unavailability resolves false; establish server-safe URL behavior and canonical helper ownership.

Implementation settlement: **DONE** · [Current agent report](review/agent-output/A-F027.md). Checked tasks require their stated acceptance; downstream integration remains unchecked until verified.


### STACK-F028 · `output`

Reviewed by `/root/review_132`. [Evidence, expected behavior and patch details](review/folders/stack--output.md).

- [x] Supersede historical desktop guides and refresh supported quick-start/API examples.
- [x] Replace or explicitly archive the incompatible demo; validate any replacement fixture.
- [x] Scope readiness/compatibility claims to dated evidence and correct node counts.

### STACK-F029 · `straw-app`

Reviewed by `/root/review_105`. [Evidence, expected behavior and patch details](review/folders/stack--straw-app.md).

- [ ] Fix and regression-check stale generated component/vendor output through the compiler child owner.
- [ ] Align legacy output run instructions with the current package.
- [ ] Retain final-snapshot clean Trunk/native packaging evidence, including import-map assets and compiler/runtime alignment.
- [ ] Observe browser/Tauri UI, WASM button, IPC/persistence, and local model inference; execute and verify installers with documented prerequisites.
- [ ] Resolve or explicitly track the documented G3 source-scan failure before advancing its gated slice.

### STACK-F030 · `straw-app/.vscode`

Reviewed by `/root/review_106`. [Evidence, expected behavior and patch details](review/folders/stack--straw-app--.vscode.md).

- [ ] Optional developer smoke check: confirm installed Svelte/Tauri/Rust extensions activate in the desktop workspace.

### STACK-F031 · `straw-app/crates`

Reviewed by `/root/review_134`. [Evidence, expected behavior and patch details](review/folders/stack--straw-app--crates.md).

- [ ] Preserve workspace membership and shell dependency paths when relocating children.
- [ ] Reconcile child review findings before accepting desktop integration.

### STACK-F032 · `straw-app/crates/axum-loop`

Reviewed by `/root/review_135`. [Evidence, expected behavior and patch details](review/folders/stack--straw-app--crates--axum-loop.md).

- [x] Preserve workspace membership, sibling engine dependency, and test-only tempfile when changing the API crate.
- [ ] Coordinate the child source's ephemeral-port test patch and Tauri exit verification with their owners.

### STACK-F033 · `straw-app/crates/axum-loop/src`

Reviewed by `/root/review_136`. [Evidence, expected behavior and patch details](review/folders/stack--straw-app--crates--axum-loop--src.md).

- [x] Isolate the HTTP integration test on an ephemeral loopback port; pass beside an app occupying 8741 and in concurrent test processes.
- [ ] Add focused listener-rejection and shutdown/rebind checks; have the Tauri owner verify desktop exit completion.
- [ ] Root reruns current offline checks after resolving lockfile state.

### STACK-F034 · `straw-app/crates/engine`

Reviewed by `/root/review_137`. [Evidence, expected behavior and patch details](review/folders/stack--straw-app--crates--engine.md).

- [ ] Preserve engine independence from Tauri when fixing child-module findings.
- [ ] After those fixes, rerun focused engine tests and root workspace checks.
- [ ] Complete observed desktop command/model acceptance and clarify historical documentation ownership.

Implementation settlement: **DONE** · [Current agent report](review/agent-output/A-F034.md). Checked tasks require their stated acceptance; downstream integration remains unchecked until verified.


### STACK-F035 · `straw-app/crates/engine/src`

Reviewed by `/root/review_138`. [Evidence, expected behavior and patch details](review/folders/stack--straw-app--crates--engine--src.md).

- [x] Reject both prefix-collision orderings before any write; verify safe rollback/cleanup. If a competing writer changes an installed file, preserve it and retain/report recovery backups and exact paths.
- [x] Reject disconnected mandatory inputs/config choices before any file/network side effect; retain optional inputs and valid DAG ordering/failure persistence.
- [x] Recover abandoned owned runs after actual process termination to terminal interrupted status with no replay; preserve live owners.
- [ ] Apply the documented shutdown-only migration for ownerless legacy Running rows only during a separately controlled upgrade; no user database was migrated by this audit.
- [x] Add local fixture coverage for model response/status/body limits, redirects/proxy disabling, successful chat, generation and refinement.

Implementation settlement: **DONE** · [Current agent report](review/agent-output/A-F035.md). Checked tasks require their stated acceptance; downstream integration remains unchecked until verified.


### STACK-F036 · `straw-app/crates/engine/src/nodes`

Reviewed by `/root/review_139`. [Evidence, expected behavior and patch details](review/folders/stack--straw-app--crates--engine--src--nodes.md).

- [x] Reject missing/wrong-type writer content before touching an existing sentinel file.
- [x] Test both conditional outcomes: only the selected branch writes, with explicit skip/merge results.
- [x] Test empty/multibyte delimiters and headerless rows; persist terminal failure, never panic.
- [x] Exercise template variable substitution, latin1 decoding, schema/executor default parity and mixed-list rejection.
- [ ] After the proposed node fixes, run focused regression cases and one real UI-to-engine flow for every node kind.

Implementation settlement: **DONE** · [Current agent report](review/agent-output/A-F036.md). Checked tasks require their stated acceptance; downstream integration remains unchecked until verified.


### STACK-F037 · `straw-app/crates/wasm-frontend`

Reviewed by `/root/review_140`. [Evidence, expected behavior and patch details](review/folders/stack--straw-app--crates--wasm-frontend.md).

- [ ] In the provisioned build environment, verify Trunk emits the module URL referenced by the import map and the browser initializes it successfully.
- [ ] Exercise browser compute boundaries 0 and 46, rejection of invalid values, and native command agreement; verify initialization failure feedback.

### STACK-F038 · `straw-app/crates/wasm-frontend/src`

Reviewed by `/root/review_141`. [Evidence, expected behavior and patch details](review/folders/stack--straw-app--crates--wasm-frontend--src.md).

- [ ] In the provisioned build environment, run the existing crate test and verify browser results at 0, 1, 10 and 46 plus invalid input rejection and module initialization failure handling.
- [ ] Verify native `wasm_fibonacci` agrees with the browser result and rejects 47.

### STACK-F039 · `straw-app/public`

Reviewed by `/root/review_142`. [Evidence, expected behavior and patch details](review/folders/stack--straw-app--public.md).

- [ ] Confirm packaged Trunk assets resolve and the desktop UI mounts during root integration validation.

### STACK-F040 · `straw-app/src`

Reviewed by `/root/review_038_current`. [Evidence, expected behavior and patch details](review/folders/stack--straw-app--src.md).

- [ ] Root acceptance: confirm the replacement Trunk/Tauri build succeeds without recreating `src`.

### STACK-F041 · `straw-app/src-tauri`

Reviewed by `/root/review_108`. [Evidence, expected behavior and patch details](review/folders/stack--straw-app--src-tauri.md).

- [ ] Root runs current offline workspace checks and Trunk build; earlier Svelte/Cargo logs are historical.
- [ ] Build installer, launch with Trunk stopped, and confirm embedded UI, IPC and WASM under the CSP.
- [ ] Confirm loopback API startup/shutdown and WebView2 prerequisite handling on the supported Windows environment.
- [ ] Decide release-WASM profile and publish the missing current verification record.

### STACK-F042 · `straw-app/src-tauri/capabilities`

Reviewed by `/root/review_109`. [Evidence, expected behavior and patch details](review/folders/stack--straw-app--src-tauri--capabilities.md).

- [x] Correct the historical testing-guide capability explanation.
- [x] Consider an explicit main-window label.
- [ ] Complete live desktop command/ACL acceptance checks after the concurrent rewrite settles.

### STACK-F043 · `straw-app/src-tauri/gen`

Reviewed by `/root/review_131`. [Evidence, expected behavior and patch details](review/folders/stack--straw-app--src-tauri--gen.md).

- [ ] During the next normal desktop build, confirm referenced child schemas regenerate consistently; use the child report for detailed acceptance checks.

### STACK-F044 · `straw-app/src-tauri/gen/schemas`

Reviewed by `/root/review_110`. [Evidence, expected behavior and patch details](review/folders/stack--straw-app--src-tauri--gen--schemas.md).

- [ ] After the concurrent desktop rewrite stabilizes, root should regenerate through the normal Tauri build and confirm capabilities and schema identifiers still match source inputs; attribute any generated diff to its toolchain or permission change.

### STACK-F045 · `straw-app/src-tauri/icons`

Reviewed by `/root/review_111`. [Evidence, expected behavior and patch details](review/folders/stack--straw-app--src-tauri--icons.md).

- [ ] At release validation, build the intended desktop bundles and inspect installed launcher/taskbar imagery.

### STACK-F046 · `straw-app/src-tauri/src`

Reviewed by `/root/review_002_current`. [Evidence, expected behavior and patch details](review/folders/stack--straw-app--src-tauri--src.md).

- [ ] Serialize lifecycle operations and use controlled barriers to verify a delayed save cannot recreate a flow after successful deletion.
- [ ] Verify real IPC new/save/list/delete/restart, foreign-ID rejection, execution failure/history, and refinement persistence in the desktop shell.
- [ ] Verify startup/bind-error reporting, API routes sharing the shell database, and listener shutdown; record results in the promised verification document.

### STACK-F047 · `straw-app/third-party`

Reviewed by `/root/review_143`. [Evidence, expected behavior and patch details](review/folders/stack--straw-app--third-party.md).

- [x] Copy Svelte and clsx licenses plus NOTICE through the build hook.
- [ ] In an isolated clean build, assert exact license-text preservation in public and Trunk dist; verify packaged frontend inclusion.
- [x] Clarify the distribution license path and optionally add immutable clsx provenance.

Implementation settlement: **DONE** · [Current agent report](review/agent-output/A-F047.md). Checked tasks require their stated acceptance; downstream integration remains unchecked until verified.


### STACK-F048 · `straw-app/tools`

Reviewed by `/root/review_144`. [Evidence, expected behavior and patch details](review/folders/stack--straw-app--tools.md).

- [ ] Root verification: confirm provisioned `trunk build` executes the hook successfully and produces frontend assets.

### STACK-F049 · `straw-app/tools/frontend-build`

Reviewed by `/root/review_145`. [Evidence, expected behavior and patch details](review/folders/stack--straw-app--tools--frontend-build.md).

- [ ] Preserve compiler/OXC/runtime alignment when dependencies change; rerun the isolated clean output comparison.
- [x] Complete the child-owned stale-output fix and deletion/rename acceptance case.
- [ ] Reconcile legacy desktop commands; complete Trunk/browser/desktop WASM smoke acceptance.

Implementation settlement: **DONE** · [Current agent report](review/agent-output/A-F049.md). Checked tasks require their stated acceptance; downstream integration remains unchecked until verified.


### STACK-F050 · `straw-app/tools/frontend-build/src`

Reviewed by `/root/review_146`. [Evidence, expected behavior and patch details](review/folders/stack--straw-app--tools--frontend-build--src.md).

- [x] Generate outputs in a fresh owned directory; delete a component without fixing its importer and require failure on both clean and incremental builds.
- [ ] Root reruns locked/offline package and Trunk builds against the final snapshot, then opens the browser/desktop UI and runs WASM compute.
- [x] Confirm missing vendor modules and unmapped imports fail with the originating path; retain compiler/runtime version alignment.

Implementation settlement: **DONE** · [Current agent report](review/agent-output/A-F050.md). Checked tasks require their stated acceptance; downstream integration remains unchecked until verified.


### STACK-F051 · `straw-app/ui`

Reviewed by `/root/review_147`. [Evidence, expected behavior and patch details](review/folders/stack--straw-app--ui.md).

- [x] Delay `flow_save`; attempt every editor mutation; ensure persisted data and dirty indicator agree.
- [x] Switch away from a dirty/new flow and resolve a prior save; verify draft retention and stable selection.
- [x] Defer `File.arrayBuffer()`, press Send, then resolve reading/model response; ensure the selected document is transmitted once and remains visible until captured.
- [ ] Smoke-test compiled UI in WebView2: startup, all schema editors, save/reopen/run/history, chat failure/retry, generation/edit/refine/save, and WASM bounds.

### STACK-F052 · `tests`

Reviewed by `/root/review_121`. [Evidence, expected behavior and patch details](review/folders/stack--tests.md).

- [x] Retire or explicitly reconnect the orphan E2E package, updating both manifest and lock together.
- [x] Publish current verification commands and distinguish historical E2E artifacts from current acceptance.

## Generated/copied folder comparison

29 nested generated/copied folders in this root were classified and compared. Across the generator, 18 bundles contain 236 component copies: 225 match source and 11 drift. None has a root application build entrypoint. Matching copies inherit source defects. [Every folder comparison and exact changed/missing/extra files](review/copy-comparison.json). Stack build/test folders have artifact inventories. Generated public/ui was separately reproduced by a clean native compiler build:150files match, no extras; see frontend-copy-comparison.json.
