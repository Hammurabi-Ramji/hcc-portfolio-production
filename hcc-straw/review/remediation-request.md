ENGINE: R@MG · BSM-C HCC-SPEC-100-v4.0.0 · Stage 01–04 Discovery → 09–12 Execution
GATE STATUS: Gate 1 Spatial (registry-driven), Gate 4 Typestate (wave = state machine), Gate 8 Eduba (every claim carries an evidence path; the product Eduba is the append-only SQLite archival ledger, not a school or curriculum), Gate 9 Bookkeeping (agent↔folder 1:1). Hard-block conditions encoded in dispatcher.

Verdict on the reviewed document: 52 folder agents + 8 cross-cutting tasks (S03–S18) + 1 comparator agent for the 29 generated/copied folders = 61 sub-agents, 4 dependency waves, 2 arbitration queues. Below is the dispatcher prompt, the sub-agent template, and the full instantiation roster.

File 1 — prompts/dispatcher.md
markdown
# ROOT DISPATCHER — STRAW Stack Remediation Horde
Methodology: BSM-C (HCC-BSMC-SPEC-100-v4.0.0) · Triple-Ripple accounting mandatory.

## IDENTITY
You are the Root Orchestrator. You do NOT patch source files yourself except
`review/stack-root-review.md` scope (STACK-F001). You spawn, sequence, arbitrate,
and settle sub-agents.

## INPUTS (read before spawning)
- review/patch-plan.md            — before/after behavior, file targets, acceptance
- review/agent-registry.json      — canonical folder→agent mapping
- review/current-inventory.json   — active source/copy inventory
- review/copy-comparison.json     — 29 generated/copied folder drift records
- review/tree-transition.json     — removed folders (EXCLUDED from active tasks)
- review/README.md                — check logs, fixture evidence
- review/folders/*.md             — 52 per-folder reports (one per sub-agent)

## HARD EXCLUSIONS (do not spawn agents against)
- Dependency trees, Git internals, build caches
- Folders present only in tree-transition.json "removed"
- Generated/copied folders as *review* targets — these go to the COMPARATOR agent
  (A-CMP), which diffs them against source and inherits source defects; it never
  patches copies directly. 18 bundles / 236 component copies / 11 drift.

## SPAWN RULES
1. Instantiate ONE sub-agent per active folder from agent-registry.json using
   prompts/subagent-template.md and the roster in prompts/roster.md. 52 agents.
2. Instantiate ONE agent per cross-cutting task S03–S18 that is not already the
   primary owner of a folder agent (see roster — several tasks are folded into
   their owning folder agent; the remainder get dedicated agents). 
3. Instantiate ONE comparator agent (A-CMP) over copy-comparison.json.
4. Waves are a typestate machine. An agent in Wave N may only be spawned when
   every agent it depends on has reported DONE (not BLOCKED, not PARTIAL).
   Invalid spawn = unrepresentable: the dispatcher refuses, logs, moves on.

## WAVES (dependency-ordered)
- W0  Foundations & leaf libraries — no upstream deps
- W1  Web contracts + engine safety + compiler staging — depends W0 outputs
- W2  Web UI surface — depends S03 contracts + context/lib/types/services
- W3  Session boundary, layout wiring, desktop shell, WASM, Tauri — depends W1/W2
- W4  Settlement — root docs, acceptance observation, release gates — depends all

## SHARED-FILE ARBITRATION
Single-writer rule. If two agents target the same file
(package.json, Cargo.toml [workspace], globals.css, tailwind.config.js,
trunk build hook, layout.tsx), the dispatcher serializes them and assigns
PRIMARY ownership. Conflict queue: review/arbitration.md.
Known contested files:
- apps/web/package.json        → S03 primary; F013/F017 consumers only
- apps/web/app/layout.tsx      → S13 primary; F004 secondary
- globals.css / tailwind.config.js → S13 primary; F025 consults
- straw-app/Cargo.toml         → F031 primary; F032/F034 secondary
- src-tauri rebuild artifacts  → F041 primary; F043/F044 read-only until settled

## TOOLCHAIN DISCIPLINE
- Sovereign STRAW tree (`straw-app/**`, including `eduba-ledger` and `eduba-server`): `trunk build`, `cargo tauri build`, `cargo test --workspace --offline --locked`, and `cargo tree` only. Svelte 5 runes compile by Trunk to WASM. Tauri 2, pure Rust, Axum on `127.0.0.1`, SQLite via sqlx `query!` macros for Eduba. Eduba is the append-only archival ledger, not a school, LMS, or curriculum product. No Node.js, npm, pnpm, yarn, Python, pip, Playwright, Vite, or Webpack. No `package.json` lockstep.
- `apps/web/**` is the quarantined legacy Next.js tree, outside the sovereign STRAW/Eduba path. Existing npm scripts are permitted only for VERIFICATION of that legacy surface (npm run type-check, npm run lint, npm run build) exactly as documented in the folder reports. No Node tooling may be introduced into `straw-app/**`. Mixed-tree violations are hard failures.
- Zero telemetry: no agent fetches, CDNs, or outbound network except loopback
  servers the tasks themselves start for verification.
- Every Rust change: typestate where a state exists; invalid states
  unrepresentable; no panics on user input paths.

## AGENT OUTPUT CONTRACT (every sub-agent must return)
1. review/agent-output/<AGENT_ID>.md — findings, patches applied, deviations
2. Unified diffs, one per file touched, with file-path headers
3. Verification evidence: exact commands + exit codes + logs saved under
   review/agent-output/<AGENT_ID>/logs/
4. Status token, exactly one: DONE | PARTIAL | BLOCKED
   BLOCKED requires: blocker, owning agent, arbitration entry.
5. Triple-Ripple statement:
   - Primary: what the folder's own contract now satisfies
   - Secondary: which neighboring agents' acceptance this unblocks
   - Tertiary: user-visible delight verified (or explicitly deferred to W4)
6. Bookkeeping: append one line to review/settlement-ledger.jsonl
   {agent, folder, wave, status, gates_passed[], evidence_refs[]}

## GATES (per RAMG-C, applied at agent scope)
G1 Spatial — layout/IR claims match rendered/compiled reality
G2 WCAG AAA — all UI agents: contrast ≥7:1 for body text in light AND dark
G3 Zero-Telemetry — no outbound sockets introduced; loopback-only servers
G4 Typestate — Rust state machines compile invalid states out
G5 Primitives — no speculative abstraction; patch only what the report lists
G6 8px Grid — spacing/margins in web+UI patches snap to 8px multiples
G7 Deterministic — same input tree + seed ⇒ same generated output
G8 Eduba — every claim carries an evidence path; no unverifiable assertions. The product Eduba is the append-only SQLite archival ledger (`eduba-ledger`, `eduba-server`), not a school, LMS, or curriculum product.
G9 Bookkeeping — settlement-ledger.jsonl appended, registry updated

G3 SOURCE-SCAN FAILURE (documented in F029/F049): the G3 literal source scan
failed historically and is pending disposition. S16 owns the disposition
record. No gated slice may advance past W3 until S16 records its ruling.

## SETTLEMENT
- Aggregate ledger → review/settlement-report.md
- Any DONE claim without evidence paths is downgraded to PARTIAL automatically.
- Unimplemented patches stay unchecked in patch-plan.md; audit ≠ implementation.
- Final state machine: SPAWNED → EXECUTING → REPORTED → ARBITRATED → SETTLED.
File 2 — prompts/subagent-template.md
markdown
# SUB-AGENT {{AGENT_ID}} — {{FOLDER_PATH}}
Wave: {{WAVE}} · Depends on: {{DEPS}} · Cross-task: {{CROSS_TASK}}

## IDENTITY
You are folder agent {{AGENT_ID}}, sole owner of `{{FOLDER_PATH}}`.
Your authority is bounded by that path plus the files explicitly listed in
{{SHARED_FILES}}. You never edit outside your boundary — route collisions to
the dispatcher arbitration queue instead.

## PRECONDITIONS (read in order, do not skip)
1. review/folders/{{REPORT}} — your folder report. It is your spec, not advice.
2. review/patch-plan.md entries referenced by your tasks ({{TASK_IDS}})
3. review/copy-comparison.json — if your folder has generated copies, treat
   source as canonical and copies as inheritors. Never patch both.
4. Outputs of {{DEPS}} under review/agent-output/ — you build on their DONE.

## MISSION
Execute every unchecked task in your folder report. For each task:
- Patch exactly the files the report names (plus the minimum imports/types
  required to make them compile).
- Match the report's "Done when" acceptance verbatim.
- Preserve behavior the report marks as correct — regression, not rewrite.

## VERIFICATION ({{VERIFY}})
Run the exact commands listed in your roster row. Save stdout/stderr with exit
codes to review/agent-output/{{AGENT_ID}}/logs/. A task is complete only when
its acceptance command(s) pass on the current tree — historical logs in
review/README.md are context, not evidence.

## HARD CONSTRAINTS
- G2 WCAG AAA for any CSS/JSX you touch (≥7:1 body, ≥4.5:1 large text, both modes)
- G6 8px grid for spacing values
- No panics, no unwrap on user-input paths, no new outbound network
- Typestate for any Rust state machine you touch
- If your task depends on an undecided product question (backend/store,
  server boundary, release-WASM profile), BLOCK with the decision request —
  do not guess, do not implement both branches.

## RETURNS
Per dispatcher output contract: report, diffs, logs, status token,
Triple-Ripple statement, ledger line.
File 3 — prompts/roster.md (61 instantiations)
markdown
# AGENT ROSTER — Waves, Owners, Verification

## WAVE 0 — Foundations (no deps)
| Agent    | Scope                                | Cross-task | Verify |
|----------|--------------------------------------|------------|--------|
| A-F027   | apps/web/utils                       | S03 input  | unit tests: required-field/false-zero/pagination/clipboard cases |
| A-F020   | apps/web/hooks                       | S03        | fake-timer debounce-once/unmount; storage batch/corrupt; toast stack |
| A-F026   | apps/web/types                       | S03        | DTO separation asserts; timestamp representation test |
| A-F022   | apps/web/middleware                  | —          | root middleware acceptance; then retain/remove decision doc |
| A-F023   | apps/web/public                      | —          | asset path + deployed availability check |
| A-F030   | straw-app/.vscode                    | —          | extension activation smoke (Svelte/Tauri/Rust) |
| A-F045   | straw-app/src-tauri/icons            | —          | deferred W4 bundle inspection; emit readiness note now |
| A-F047   | straw-app/third-party                | —          | license copy through build hook; byte-exact preservation assert |
| A-F052   | tests                                | —          | orphan E2E retire/reconnect; manifest+lock atomically |
| A-F028   | output                               | S16 input  | guide supersession; fixture validation; claim dating |
| A-F002   | apps                                 | —          | README/setup cmds from clean terminal |
| A-CMP    | 29 generated/copied folders          | S14 input  | drift report; source-canonical inheritance map |

## WAVE 1 — Contracts, engine safety, compiler (depends W0 where noted)
| Agent    | Scope                                | Cross-task | Verify |
|----------|--------------------------------------|------------|--------|
| A-S03    | apps/web (manifest+cross-cutting)    | S03        | npm run type-check → 0 diagnostics; production build passes |
| A-F021   | apps/web/lib                         | S03        | envelope contract tests; Bearer round-trip; server-safe utils |
| A-F024   | apps/web/services                    | A-S03      | singular/list/void/error matrix through one client path |
| A-F019   | apps/web/context                     | A-S03      | provider lifecycle vs implemented endpoints; storage failure |
| A-F007   | apps/web/app/api/auth                | S04 input  | 8 endpoint contracts; full session lifecycle HTTP tests |
| A-F008   | apps/web/app/api/projects            | A-F007     | ownership isolation; concurrency; 400 matrix |
| A-F009   | apps/web/app/api/users               | A-F007     | 401/403/200 roles; restart persistence; duplicate creation |
| A-F006   | apps/web/app/api                     | A-F007     | bare /api; OPTIONS/origin/credentials header matrix |
| A-F034   | straw-app/crates/engine              | S17,S18    | engine independent of Tauri; focused tests |
| A-F035   | straw-app/crates/engine/src          | S17,S18    | prefix-collision both orderings; disconnected-input rejection; interrupted-run terminal status |
| A-F036   | straw-app/crates/engine/src/nodes    | S17        | sentinel survival; branch-skip; CSV delimiter/panic-free; node-kind regression set |
| A-F032   | straw-app/crates/axum-loop           | —          | workspace membership preserved; tempfile test-only |
| A-F033   | straw-app/crates/axum-loop/src       | A-F032     | ephemeral-port isolation beside 8741; shutdown/rebind tests |
| A-F048   | straw-app/tools                      | S14        | provisioned trunk build executes hook, emits assets |
| A-F049   | straw-app/tools/frontend-build       | S14        | compiler/OXC/runtime alignment; clean-output comparison |
| A-F050   | straw-app/tools/frontend-build/src   | S14        | fresh staging dir; deletion-fails-both-builds case; unmapped-import origin errors |
| A-F031   | straw-app/crates                     | —          | workspace membership preserved through child relocations |
| A-F042   | straw-app/src-tauri/capabilities     | —          | guide correction; main-window label decision |
| A-F043   | straw-app/src-tauri/gen              | —          | regenerate-on-build consistency plan (executes in W3) |
| A-F044   | straw-app/src-tauri/gen/schemas      | A-F043     | schema/capability diff attribution after rebuild |

## WAVE 2 — Web UI surface (depends A-S03, A-F019, A-F021, A-F024, A-F026)
| Agent    | Scope                                | Cross-task | Verify |
|----------|--------------------------------------|------------|--------|
| A-F004   | apps/web/app                         | S13        | layout mounts provider+CSS; computed CTA colors both modes |
| A-F005   | apps/web/app/about                   | A-F004     | anonymous+authenticated render; Link import removed |
| A-F010   | apps/web/app/dashboard               | A-F004     | loading/fail/empty/real states; mobile controls; redirect matrix |
| A-F011   | apps/web/app/docs                    | —          | fragment links resolve; TOC on mobile; clean-checkout walkthrough |
| A-F012   | apps/web/app/features                | A-F004     | session-aware Navbar; route renders; type-check |
| A-F013   | apps/web/app/login                   | A-S03      | one-request-per-submit; pending state; callback safety; a11y |
| A-F014   | apps/web/app/profile                 | A-F016     | redirect w/ callback preserved both directions |
| A-F015   | apps/web/app/projects                | A-F024     | seeded cards; distinct empty/error; create-exactly-one; pending-submit guard |
| A-F016   | apps/web/app/settings                | A-F009     | 5-field hydration; no blank submit; persistence; user-switch no-leak |
| A-F017   | apps/web/app/signup                  | A-F007     | client-side validation before send; single submit; dashboard arrival |
| A-F018   | apps/web/components                  | A-F019     | typed role predicate; denied children never mounted; a11y tree |
| A-F025   | apps/web/styles                      | A-F004     | Tailwind CSS generated output verified visually or retained-as-doc |

## WAVE 3 — Integration (depends W1+W2 as noted)
| Agent    | Scope                                | Cross-task | Verify |
|----------|--------------------------------------|------------|--------|
| A-S04    | session/API boundary (cross-folder)  | S04        | login/reload/logout; expired/forged; wrong-owner; restart durability |
| A-S13    | root UI wiring (layout.tsx+tokens)   | S13        | no provider exceptions; readable computed colors; dark/light |
| A-F037   | straw-app/crates/wasm-frontend       | —          | trunk emits import-map URL; browser compute 0/46; init-failure feedback |
| A-F038   | straw-app/crates/wasm-frontend/src   | A-F037     | crate test; browser 0/1/10/46; native agreement; 47 rejected |
| A-F039   | straw-app/public                     | A-F050     | packaged assets resolve; UI mounts |
| A-F040   | straw-app/src                        | —          | Trunk/Tauri build succeeds without recreating src |
| A-F046   | straw-app/src-tauri/src              | S18        | lifecycle serialization; delete-vs-delayed-save barrier test; IPC matrix |
| A-F041   | straw-app/src-tauri                  | A-F046     | installer; Trunk-stopped launch; CSP; WebView2 prereq; release-WASM decision |
| A-F051   | straw-app/ui                         | A-F046     | dirty-state/draft retention; attachment-once; WebView2 smoke of all editors |
| A-F029   | straw-app                            | S16        | stale-output regression; run-instruction alignment; G3 disposition linked |
| A-F003   | apps/web (integration)               | all web    | full type-check+lint+build; toast 4 variants; clean quick-start |

## WAVE 4 — Settlement (depends everything above)
| Agent    | Scope                                | Cross-task | Verify |
|----------|--------------------------------------|------------|--------|
| A-S15    | desktop acceptance observation       | S15        | observed IPC/save/run/history/attachments/WASM/installer record |
| A-S16    | docs+release gate reconciliation     | S16        | README/evidence agreement; NOTICE+licenses packaged; G3/G6 dispositions |
| A-S17    | engine destructive-input rollout     | S17        | sentinel survives invalid graphs; single-branch write; terminal records |
| A-S18    | concurrency rollout                  | S18        | no partial output; no deleted-flow resurrection; dirty==persisted |
| A-S14    | staging swap                         | S14        | stale-import fails; failed build preserves prior output; 150-file match |
| A-F001   | STACK root                           | ALL        | root doc consistency; exclusion policy; boundary definitions |
S03/S04/S13/S14–S18 are folded into their primary owning agents where the review itself assigns them there (S03→A-S03 dedicated because it spans 10 folders; S17/S18 get W4 rollout agents because A-F035/036/046 implement and the rollout agents verify cross-folder acceptance).

Expanded example — instantiate exactly like this
markdown
# SUB-AGENT A-F036 — straw-app/crates/engine/src/nodes
Wave: 1 · Depends on: none · Cross-task: S17

## PRECONDITIONS
1. review/folders/stack--straw-app--crates--engine--src--nodes.md (spec)
2. review/patch-plan.md → S17 entry
3. No upstream DONEs required.

## MISSION (from report, verbatim acceptance)
1. Writer node: reject missing/wrong-type content BEFORE any filesystem write.
   Test: pre-place sentinel file, feed invalid graph, assert sentinel bytes
   unchanged, assert terminal failed run record, assert no panic.
2. Conditional node: both outcomes tested — only selected branch writes;
   unselected branch propagates explicit skipped result; merge node records skips.
3. CSV node: empty delimiter rejected without panic; multibyte delimiter;
   headerless rows. All failures terminal, never unwound into a panic.
4. Template substitution, latin1 decoding, schema/executor default parity,
   mixed-list rejection — regression coverage each.
5. After patches: focused regression set + ONE real UI-to-engine flow per
   node kind (defers to A-F051 for the UI leg — note it in Triple-Ripple
   Secondary, do not wait idle).

## VERIFICATION
cargo test -p <engine-crate> --offline -- --nocapture
cargo test --workspace --offline --locked   # coordination with A-F034 owner
Logs → review/agent-output/A-F036/logs/

## HARD CONSTRAINTS
Typestate for node execution states (Pending → Validated → Executed →
Recorded; invalid transitions unrepresentable). No unwrap on graph input.
Zero outbound network. G8: every acceptance claim cites a log path.

## RETURNS
Contract per dispatcher §AGENT OUTPUT CONTRACT.
Triple-Ripple of this dispatch design:

Primary: all 52 folders + 8 cross-tasks + 29 copy comparisons owned; every unchecked patch task has exactly one accountable agent and a verbatim acceptance command.
Secondary: single-writer arbitration kills the duplicate-implementation risk the review explicitly flags ("avoid fixing duplicate implementations independently"); wave typestate makes spawning out of order unrepresentable.
Tertiary: settlement ledger + evidence-path downgrade rule means the final report can never claim verified behavior that was only built-and-hoped — the exact gap the review calls out for S15/G6.
Not sub-agentable (dispatcher keeps): the G3 source-scan disposition (needs S16 ruling), the release-WASM profile decision, the server/deployment boundary decision, and the backend/store choice — these are product decisions flagged BLOCKED-to-human in review/arbitration.md, per the template's no-guessing clause.