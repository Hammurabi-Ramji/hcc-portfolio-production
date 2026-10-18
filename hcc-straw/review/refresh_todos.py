"""Render consolidated folder task lists from the separate review agents."""
from pathlib import Path
import json
import re

STACK = Path(r'C:\IEDB\STRAW Stack')
GEN = Path(r'C:\IEDB\STRAW SaaS Generator')
REVIEW = STACK / 'review'
registry_all = json.loads((REVIEW / 'agent-registry.json').read_text(encoding='utf-8-sig'))
registry = [r for r in registry_all if r.get('scope_status', 'active') == 'active']
inventory = json.loads((REVIEW / 'current-inventory.json').read_text(encoding='utf-8-sig'))
copies = json.loads((REVIEW / 'copy-comparison.json').read_text())
entries = registry + [{'folder': str(STACK / 'apps'), 'relative': 'apps', 'task_name': '/root/stack_apps',
                       'report': str(REVIEW / 'folders/stack--apps.md'), 'completed': True},
                      {'folder': str(STACK), 'relative': '.', 'task_name': '/root',
                       'report': str(REVIEW / 'stack-root-review.md'), 'completed': True}]
completed = sum(Path(e['report']).exists() and e.get('completed') for e in entries)
total = len(entries)
final = completed == total

def link(path, root):
    try:
        value = Path(path).relative_to(root).as_posix()
    except ValueError:
        value = Path(path).as_posix()
    return '<' + value + '>' if ' ' in value else value

def section(title, body):
    return '\n## ' + title + '\n\n' + body.strip() + '\n'

stack_plan = '''
- [ ] **S01 · P1 · Make desktop Cargo ownership explicit.** Current: package discovery stops at the ancestor workspace. Patch `straw-app/src-tauri/Cargo.toml` with an agreed local workspace boundary including WASM, or have the parent owner register it. Done when package-local `cargo check` reaches actual compilation; then resolve resulting source/platform errors. Evidence: `review/desktop-cargo-check.log`.
- [ ] **S02 · P1 · Restore frontend checks.** Current: 247 Svelte/TypeScript errors and 1 warning across 18 files. Patch the supported package split for `src/no-code`, JSX file extensions, dependencies/imports, Svelte `CodeGenPanel` typing/style/null handling and test types. Do not hide errors by indiscriminately excluding supported code. Done when `npm run check` passes. Evidence: `review/svelte-check.log`; depends on deciding the active no-code frontend.
- [ ] **S03 · P1 · Restore web type/build contracts.** Current: 19 TypeScript diagnostics. Patch `apps/web/package.json` (missing resolver dependency), context/service imports, hook/middleware types, App Router exports, client response types and user role typing. Done when `npm run type-check` and the subsequent production build pass. Evidence: `review/web-type-check.log`.
- [ ] **S04 · P1 · Implement one web session/API boundary.** Current: missing auth endpoints, cookie/local-storage mismatch, unvalidated cookie checks and demonstration CRUD state. Patch client/context/services, actual auth routes and server-side role/resource ownership checks. Done when login, reload, logout, expired/forged-session and wrong-owner tests pass; durable writes survive restart if promised. Depends on S03 and the chosen backend/store. See patch 2.
- [ ] **S05 · P1 · Align real desktop IPC DTOs.** Current: attachment `mimeType` versus Rust `mime_type`, file IDs/state omitted and incompatible workflow contracts. Patch TypeScript/Rust DTOs and explicit adapters together. Done when frontend-shaped attachment/generation/workflow JSON round-trips through real IPC, not only mock handlers. See patch 3 and individual source reports.
- [ ] **S06 · P1 · Protect generated/refined files.** Current: fence parsing invents duplicate paths and writing lacks confinement. Patch Rust `codegen.rs`, frontend requests and persistence: validate named files, reject duplicate/rooted/escaping paths and reparse escapes, stage writes, provide current refinement content and save it explicitly. Done when same-language multifile generation preserves both files and malicious/malformed output writes nothing. Depends on S05.
- [ ] **S07 · P1 · Validate graphs before side effects.** Current: cyclic/dangling/duplicate graphs can execute incompletely and upstream failures do not reliably stop dependents. Patch `dag.rs`, node/workflow execution and canvas feedback. Done when invalid graphs fail clearly and downstream file/network actions are skipped after upstream failure. Depends on shared graph/schema contracts.
- [ ] **S08 · P2 · Complete bounded multimodal/compute behavior.** Current: some image/refinement data is discarded and network/compute operations lack adequate bounds. Patch NLP requests, streaming/progress claims, body/time/input limits and WASM command guards according to folder reports. Done when supported modalities are exercised with failure/cancellation paths; unsupported modalities are explicitly described.
- [ ] **S09 · P2 · Make execution persistence truthful.** Patch `lib.rs`, `db.rs` and no-code database/executor to surface storage errors, record true failure/status/timing and delete transactionally. Done when failed runs and restarts produce accurate history, including persistence failures.
- [ ] **S10 · P2 · Consolidate the supported test entrypoints.** Patch Playwright configs, duplicate test directories/mocks and relevant package scripts. Keep offline UI checks distinct from real Tauri/SQLite/Ollama integration. Done when test discovery matches documented suites and relevant behavior checks run; historical HTML reports are not current evidence.
- [ ] **S11 · P2 · Reconcile documentation and packaging.** Expand root/apps/desktop READMEs, correct obsolete paths/env commands, label historical completion claims, document intended desktop/web/generator integration and artifact/secret policy. Validate installer/startup separately. Depends on current checks and architecture decisions; source existence alone is not proof of release readiness.
'''
stack_plan += '''
- [ ] **S12 · P1 · Prevent new-flow overwrite and stale editor state.** Patch straw-app/src/routes/+page.svelte, src/lib/FlowCanvas.svelte and Rust save validation to normalize blank IDs, allocate distinct UUIDs, track edits after save, subscribe to execution stores and surface node failures. Done when two new flows retain distinct IDs/content across edit-save-reopen and running/results update live. Evidence: the dedicated src/lib report; depends on S05/S07.
- [ ] **S13 · P1 · Restore web root UI wiring.** Patch apps/web/app/layout.tsx to import globals.css and mount the repaired AuthProvider; define missing semantic color tokens in globals.css/tailwind.config.js and include hook JSX in Tailwind scanning. Done when auth-consuming pages render without provider exceptions and built light/dark CTA/toast styles have readable computed colors. Depends on S03/S04 and the PostCSS pipeline; see app/package reports.
'''

# The desktop was replaced during review; never present removed-code defects as current tasks.
stack_plan = '\n'.join(line for line in stack_plan.splitlines()
                        if any(f'**S{n:02d} ' in line for n in (3, 4, 13))) + '''
- [ ] **S14 · P2 · Clean and stage generated frontend assets.** The native compiler/source/dependencies now agree and the current workspace test command passes. The compiler still overlays public/ui, allowing removed modules to remain and mask stale imports. Generate/validate in a fresh staging tree and replace only on success. Done when renamed/deleted components fail stale imports and failed builds preserve the previous complete output; compare isolated clean output with every saved module.
- [ ] **S15 · P2 · Complete current native/UI acceptance.** Current source `cargo test --workspace --offline --locked` passed 15 tests. Earlier Svelte 247 errors, ancestor-workspace failure and Playwright 168 discovery are historical. Verify real desktop IPC, save/run/history, generated/refined files, attachment ordering, WASM button behavior and installer execution after current source patches; record exact snapshot/results. Build/test success alone does not verify these interactions.
- [ ] **S16 · P2 · Reconcile historical desktop instructions and release gates.** Current README/verification now describe rsvelte_core and text-only camelCase contracts; old output guides/demo still describe the removed package. Update current entry links and label archived instructions. Record disposition of the documented failed G3 literal source scan and pending G6 observed UI gate; retain upstream provenance and explicit old-flow incompatibility. Done when current setup, release claims and evidence agree. Include the local Svelte/clsx license texts and NOTICE in generated distributions and verify packaged paths.
- [ ] **S17 · P1 · Prevent destructive node inputs and incorrect branching.** Patch current engine node/DAG contracts to reject absent or wrong-typed writer content before touching files, propagate inactive conditional branches as skipped, and reject empty CSV delimiters without panic. Also validate required input/config types before side effects. Done when sentinel files survive invalid graphs, only the selected branch writes, and every failure has a terminal run record. See current engine/node reports.
- [ ] **S18 · P2 · Repair current generation and flow concurrency.** Reject output file/directory prefix conflicts before writing and define rollback/partial-outcome semantics. Serialize save/delete lifecycle operations; retain dirty edits/drafts and ignore obsolete async navigation completions. Resolve interrupted running records on restart. Done when failed batches leave no unexplained partial output, delayed saves cannot resurrect deleted flows, and visible dirty state matches persisted data. See current engine/Tauri/UI reports.
'''

generator_plan = '''
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
'''

generator_plan += '''
- [ ] **G12 · P1 · Confine local storage operations.** Patch components/file_storage_local/src/lib.rs and its legacy copy with a shared checked path resolver, rejecting parent/rooted paths and checking link containment before save/read/delete; return constructor errors instead of panic. Done when escaping paths cannot disclose, overwrite or delete external files and normal round trips still work. Depends on the chosen flat/nested storage contract and must precede generated app use.
- [ ] **G13 · P2 · Establish one supported Rust source per component.** Current: Cargo generally compiles src/lib.rs, while adjacent legacy Rust files are also bundled and some expose different APIs. Patch the compiled source first; check consumers before removing duplicates or replacing them with compatibility facades. Document supported entrypoints. Done when component edits affect the intended build and bundles no longer present conflicting implementation contracts. Depends on source ownership and G06/G09.
- [ ] **G14 · P1 · Repair ZAP backup and deployment runbooks.** Current: documented retention deletes old database files under live data; restore feeds a binary SQLite backup as SQL; startup targets an artifact without a repository producer. Patch components/zap_hosting_management/docs to confine retention to a dedicated backup directory/pattern, use a consistent SQLite backup/restore pair, and name a real supported build/start artifact. Correct TLS bootstrap, runtime tools and health checks. Done when isolated seeded backup/restore and retention checks preserve live/unrelated databases and a fresh host can start the selected application. Depends on G03 and the deployment/persistence contract.
'''

for root, key, plan in ((STACK, 'stack', stack_plan), (GEN, 'generator', generator_plan)):
    assigned = sorted((e for e in entries if Path(e['folder']) == root or root in Path(e['folder']).parents),
                      key=lambda e: e['folder'].lower())
    done = sum(Path(e['report']).exists() and e.get('completed') for e in assigned)
    text = f'# {root.name} — to-do\n\nReviewed: 2026-10-09. '
    text += ('**Folder review complete.**' if final else '**Folder review in progress.**')
    text += f' {done}/{len(assigned)} assigned folder reports saved here; {completed}/{total} across both roots.\n\n'
    text += ('The review assigns a distinct agent to each current nested source folder; Stack root is reviewed by the main agent. '
             'Generated/copied folders are compared to source rather than assigned duplicate agents, as requested. '
             'The review excludes dependencies, Git internals and caches. The desktop was replaced during the audit; the user selected the current replacement tree. Original evidence is retained separately and removed folders are excluded from active tasks. '
             'Implementation tasks remain unchecked; completing an audit does not mean its proposed patches are implemented.\n')
    patch_link = link(REVIEW / 'patch-plan.md', root)
    text += f'\n[Concrete diff and patch map]({patch_link}) · [Folder agent registry]({link(REVIEW / "agent-registry.json", root)}) · '
    text += f'[Current source/copy inventory]({link(REVIEW / "current-inventory.json", root)}) · [Snapshot transition]({link(REVIEW / "tree-transition.json", root)})\n'
    checks = ('- Historical desktop frontend: `npm run check` **failed**, 247 errors and 1 warning; the npm package was subsequently replaced, so this is not a current build result.\n'
              '- Web: `npm run type-check` **failed**, 19 diagnostics.\n'
              '- Current desktop: `cargo test --workspace --offline --locked` **passed**, 15 tests (12 engine, 2 Axum, 1 WASM). Earlier lock/sandbox failures were superseded by this successful source-workspace check.\n'
              '- Generator Rust: `cargo test --workspace --offline` **passed**, 35 tests across 32 crates; no doc tests.\n'
              '- Current native frontend: isolated clean compiler build **passed**; all 150 generated browser files match saved copies, with no extras. Static graph validates 107 modules; live UI behavior remains unverified.\n'
              '- Generator CLI/fixture: help/list/no-argument output preservation and flag validation verified; placeholder readiness defect reproduced.\n'
              '- Runtime, installers, live provider/Ollama behavior and generated-application builds remain unverified.\n')
    text += section('Current validation evidence', checks)
    text += f'\n[Check logs and fixture evidence]({link(REVIEW / "README.md", root)})\n'
    text += section('Patch order and cross-folder tasks', plan)
    text += ('\nUse the named patch map for before/after behavior, file targets, dependencies and acceptance. '
             'Below, each folder has its own report with direct-file inventory, documentation comparison and specific patch details. '
             'Related tasks may share a patch; avoid fixing duplicate implementations independently.\n')
    text += '\n## Individual folder review and tasks\n'
    for i, e in enumerate(assigned, 1):
        report = Path(e['report'])
        rel = Path(e['folder']).relative_to(root).as_posix()
        text += f'\n### {key.upper()}-F{i:03d} · `{rel}`\n\n'
        if not report.exists() or not e.get('completed'):
            text += f'- [ ] Complete dedicated agent `{e["task_name"]}` review; report is pending.\n'
            continue
        body = report.read_text(encoding='utf-8-sig')
        text += f'Reviewed by `{e.get("agent_id", e["task_name"])}`. [Evidence, expected behavior and patch details]({link(report, root)}).\n\n'
        tasks = re.findall(r'^\s*- \[ \].*$', body, re.MULTILINE)
        if tasks:
            text += '\n'.join(t.strip() for t in tasks) + '\n'
        else:
            text += 'No unchecked implementation task was listed; review optional recommendations in the linked report without assuming a patch is required.\n'
    relevant = [r for r in copies['folder_coverage'] if root in Path(r['folder']).parents]
    text += section('Generated/copied folder comparison',
                    f'{len(relevant)} nested generated/copied folders in this root were classified and compared. '
                    'Across the generator, 18 bundles contain 236 component copies: 225 match source and 11 drift. '
                    'None has a root application build entrypoint. Matching copies inherit source defects. '
                    f'[Every folder comparison and exact changed/missing/extra files]({link(REVIEW / "copy-comparison.json", root)}). '
                    'Stack build/test folders have artifact inventories. Generated public/ui was separately reproduced by a clean native compiler build:150files match, no extras; see frontend-copy-comparison.json.')
    (root / 'to-do.md').write_text(text, encoding='utf-8')
    print(f'{root / "to-do.md"}: {done}/{len(assigned)} folder reviews; {len(text.splitlines())} lines')

readme = f'''# Review evidence — 2026-10-09

Status: {'complete' if final else 'in progress'}; {completed}/{total} current folder reports complete. Review/fixture folders are audit outputs, excluded from application-source review scope.

- [Stack to-do](../to-do.md)
- [Generator to-do](<{GEN.as_posix()}/to-do.md>)
- [Diff and patch map](patch-plan.md)
- [Separate folder agents](agent-registry.json)
- [Current inventory, including generated/copied folders](current-inventory.json)
- [Original inventory](inventory.json)
- [User-authorized snapshot transition](tree-transition.json)
- [Every copy comparison](copy-comparison.json)
- [Final scope and deliverable-link validation](review-validation.json)
- [Final source/copy stability](source-stability.json)
- [Desktop frontend check — failed](svelte-check.log)
- [Web type check — failed](web-type-check.log)
- [Current desktop workspace — 15 tests passed](desktop-current-full-tests.log)
- [Historical desktop Cargo check](desktop-cargo-check.log)
- [Isolated clean frontend build/copy comparison](frontend-copy-comparison.json)
- [Generator Rust tests — 35 passed](generator-cargo-test.log)
- [Playwright discovery — 168 tests found, not executed](playwright-discovery.log)
- [Isolated controller/CLI probes](controller-checks.json)
- [Stack root review](stack-root-review.md)

Reports under `folders/` were written by distinct agents reviewing direct folder contents, documentation and caller boundaries. The desktop was replaced by concurrent work during this audit; the user requested the current tree. Removed-folder reports and earlier desktop test logs are historical evidence, excluded from current implementation tasks. Current source/copy scope is in current-inventory.json. The review agent did not patch application source. Compilation/testing created normal local caches/artifacts; controller probes used an isolated fixture. Historical readiness reports are claims, not proof of the current checkout.
'''
(REVIEW / 'README.md').write_text(readme, encoding='utf-8')
print(f'Overall coverage {completed}/{total}; final={final}')






