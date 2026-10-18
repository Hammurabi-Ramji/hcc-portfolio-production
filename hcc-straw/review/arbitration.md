# Remediation arbitration and decisions

User decisions2026-10-09:
- Separate local Rust/Axum web API service with SQLite. No external service or deployment.
- Optimized release WASM for packaged desktop: Trunk --release.
- Whole-tree literal source-scan gate remains release-blocking. No vendor exception was approved. Source identifiers/license notices must not be disguised to produce a pass.

## Schedule corrections
- The supplied W0–W4 list defines five scheduling groups. It is retained as five groups despite the introductory four-wave count.
- A-S13 is scheduled at W2 before A-F004; its original W3 placement created a layout/provider dependency cycle. A-S03 follows contract owners in W1 so its acceptance can pass before W2.
- A-F035 engine/DAG and A-F036 node source are serialized; Rust schema/interface coordination is explicit.
- A-F047 holds the first lease on frontend-build/src/main.rs for license copying; A-F050 runs afterward and preserves this behavior while staging output.
- A-F031 owns straw-app/Cargo.toml. A-F029 owns remaining direct desktop package files.
- A-S03 owns web manifests/config/middleware; A-S13 owns layout/global tokens. Folder agents are consumers of those shared files.
- A-F007 creates apps/api auth/store/base service; A-F009 then A-F008 have serialized leases for their modules and router registration. This is the minimum extra source boundary required by the user's Rust service decision.
- G3's release hold is recorded now. Remediation and evidence collection may proceed; release promotion remains blocked. W4 may report pending gates but cannot certify release.

Every collision or blocked task receives an additional entry below with its owner and evidence.

## Agreed downstream contracts
- A-F026: DTO timestamps are strings; ApiResponse is discriminated; void success data:null; AuthResponse {user}; Project.createdBy required; rememberMe optional on login. See apps/web/types/index.ts and review/web-backend-contract.md.
- A-F020: ToastProvider exported by hooks/useToast.tsx owns the sole shared container. A-S13 wraps provider/page children with ToastProvider; consumers keep useToast API and never mount a second container.
- Dispatcher lifecycle is recorded in dispatch-events.jsonl with SPAWNED→EXECUTING→REPORTED→ARBITRATED→SETTLED transitions. Root advances state after checking returned evidence.

- A-F035 has the first serialized lease on nodes/mod.rs for schema-required input/type metadata and explicit skipped values shared with DAG preflight. A-F036 follows its DONE and preserves the published contract while updating child implementations; other node files remain F036-owned. This avoids a core/schema acceptance cycle.

- Offline cache inspection: @hookform/resolvers is absent, while installed TypeScript5.9.3 and Next15.1.8 are available. A-S03 receives a narrow serialized lease on login/page.tsx and signup/page.tsx solely to replace missing resolver imports with equivalent existing-Zod/RHF validation so its required type/build gate can pass without fetching. A-F013/A-F017 run afterward for full page remediation. No other page behavior or UI changes are assigned to S03.
- A-F021 proxy contract: proxyBackend(Request,BackendPath):Promise<Response> in lib/backend-proxy.ts. Backend paths use /api prefix; route handlers use Node runtime. STRAW_API_PORT fixes literal127.0.0.1 default3001; STRAW_WEB_ORIGIN literal local origin default http://localhost:3000. Unsafe requests require matching Origin; restricted forwarded headers; preserve backend HTTP status/envelope and all Set-Cookie headers. See owner report for validation tests.

- Further build dependency correction: current login calls useAuth during render, whose missing-provider branch throws; production prerender therefore requires S13 before S03. A-S13 moves to W1, depends on F019/F020, and A-S03 depends on S13. F004 and other pages still follow S03. This replaces the prior W2 S13 placement and removes the build/provider cycle without relaxing acceptance.
- A-F019 receives a narrow post-F026 lease on types/index.ts only to extend AuthState.login(email,password,rememberMe?:boolean), matching LoginRequest.rememberMe and allowing the chosen persistent/session-cookie behavior. It must preserve all other canonical DTO definitions and rerun the type contract check.

- W0/W1 foundation acceptance follows the roster's scoped executable gates. A-F020 direct-hook tests and focused compilation can settle DONE while provider wiring and actual project/settings UI acceptance remain assigned S13/F015/F016/F003; those tasks depend on F020, so requiring them beforehand is an acceptance cycle. Failed whole-application diagnostic checks are retained with acceptance:false and deferred_to the real integrated gate owner, never described as a successful full-web check. Diagnostic exclusions require a reason; failed true acceptance still downgrades DONE.

- Full web integration A-F003 depends on all web child owners F004–F027; S04 observed login/session/page boundary additionally waits for F013/F017/F015/F016/F018. This makes the stated integration acceptance run after its source owners rather than racing their unfinished work.

- Installer execution restriction clarified: the user explicitly requests installer execution/observation in W4 A-S15. Earlier generic agent instructions reserved installer execution too broadly; A-S15 may run the final reviewable installer in an isolated test destination while preserving existing application/user data. Other agents only build/inspect. Native/runtime evidence must be actual observed execution, never substituted with compiler success.

- A-F024 detected projects/page.tsx local Project timestamps still Date while canonical DTO/service timestamps are strings. A-S03 receives a narrow earlier serialized lease to replace that local type with the shared Project import, solely for its compile gate. Full project page behavior stays A-F015, which follows S03.

- A-F006 has a post-F007 serialized narrow lease on lib/backend-proxy.ts for one exact-local-Origin credentialed CORS/preflight policy and auth route OPTIONS exports only; preserve existing auth methods and proxy status/cookies/path limits. F009 follows F006 and F008 follows F009 so new child routes reuse the same preflight policy rather than duplicate it. Bare /api remains documented structured404 unless a specific service-info contract is needed; no invented backend endpoint required.
- A-F035 legacy recovery disposition: automatic recovery applies to newly owned runs; ownerless pre-upgrade Running rows require the documented stopped-process SQLite backup/migration. The migration has isolated fixture evidence only and was not run on a user database. Root/F046/S16 must retain this upgrade limitation. Batch rollback retains changed/unreadable/missing destinations and reports recovery paths; noncooperating external-write comparison/unlink race and no global crash transaction remain explicit.
- Concurrent tree transition observed08:38UTC: frontend-build/main.rs gained site-cache/verify-site, site_cache.rs and site/index-site.html after F049 snapshot. F050 preserves these current additions and validates both import maps; prior153-file fixture remains historical for its snapshot. Site source is an additional current folder needing separate coverage; it is outside the initial61-assignment inventory, and must not be silently claimed reviewed.

- Attribution clarification: the human selected Rust/Axum+SQLite, optimized release WASM and the source-scan hold. Explicit501 recovery/file/avatar behavior is the minimal local implementation and the report-permitted alternative to unsupported promises; it is not a separately answered human feature decision. Documentation must describe implemented/unsupported behavior without claiming a separate user approval.


### A-F009 transaction authorization helper lease
A-F009 may add only ValidSession.revalidate(&Connection) -> ApiResult<UserDto> and necessary imports in apps/api/src/auth.rs. It must recheck persisted session hash/revocation/expiry/active user within the caller transaction and return current user role. No token exposure, duplicate parser or nested Store mutex acquisition. Auth tests must remain passing; F008 consumes this helper afterward.


A-F036 settlement evidence normalization: root added explicit superseded_by/diagnostic fields for retained engine-01 socket-denial history, already described by agent note. No logs/source/test results changed.


### Expected-rejection verification evidence
A deliberately invalid-input subprocess may exit nonzero as its expected result. Settlement accepts it only with expected:nonzero and validated_by pointing to a separately recorded passing acceptance harness log that asserts the rejection and required postconditions. Unlinked nonzero acceptance still downgrades DONE; actual exit statuses remain unchanged. F050 tests negative build cases this way.
