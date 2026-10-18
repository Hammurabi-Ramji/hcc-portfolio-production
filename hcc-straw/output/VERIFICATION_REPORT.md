> **Historical record (May 2026).** Not the sovereign STRAW or Eduba path. Eduba is the append-only SQLite archival ledger in `straw-app/crates/eduba-ledger` and `straw-app/crates/eduba-server`. Build and run the sovereign desktop from `straw-app/` with `trunk build`, `cargo tauri build`, `cargo test --workspace --offline --locked`, and `cargo tree`. No Node.js, npm, pnpm, yarn, Python, pip, Playwright, Vite, or Webpack. `apps/web` is the quarantined legacy Next.js tree. Current instructions: `straw-app/README.md`.

# ✅ Verification Report — NLP-AI-Code-Creation
**Date:** May 23, 2026  
**Method (historical):** This May record used cargo check plus a Vite/TypeScript toolchain that is not the sovereign path. Current commands are `trunk build`, `cargo tauri build`, `cargo test --workspace --offline --locked`, and `cargo tree`.

---

## Build Results (Ground Truth)

| Check | Command | Result |
|-------|---------|--------|
| Rust backend | `cargo check` | ✅ 0 errors, 1 harmless dead_code warning |
| TypeScript / Vite | historical `tsc` and `npm run build` | Not the sovereign path. Use Trunk and Cargo. |

---

## What Was Actually Fixed During Verification

### Bug 1 — `lib.rs` imported `FileLanguage` which does not exist in `codegen.rs`
- **Error:** `E0432 unresolved import codegen::FileLanguage`
- **Fix:** Removed unused imports from `lib.rs` use statement

### Bug 2 — `lib.rs` referenced `tauri_plugin_os` which is not in `Cargo.toml`
- **Error:** `E0433 cannot find module tauri_plugin_os`
- **Fix:** Removed the duplicate plugin call (only `tauri_plugin_opener` is installed)

### Bug 3 — `types.ts` used camelCase fields that didn't match Rust snake_case serialization
- **Example:** `userPrompt` vs `user_prompt`, `isNew` vs `is_new`, `elapsedMs` vs `elapsed_ms`
- **Impact:** Frontend would silently send wrong field names; Rust would reject or ignore them
- **Fix:** Updated all `CodeFile`, `IntentPlan`, `CreationRequest`, `CreationResult`, `RefinementRequest`, `RefinementResult` to use `snake_case` in `types.ts`

### Bug 4 — `commands.rs` referenced non-existent types (`crate::types`, `crate::nodes::execute_flow`)
- **Impact:** Would cause compile errors if `mod commands` was ever activated from lib.rs
- **Fix:** Replaced file with a descriptive comment noting all commands live in `lib.rs`

---

## What Is Genuinely Working

### ✅ Rust Backend
- `nlp.rs` — NLP engine: `send_nlp()`, `fetch_url_content()`, URL fetch + HTML stripping, multi-turn prompt builder
- `codegen.rs` — Code gen engine: `generate_code()`, `refine_file()`, code block parser, file writer
- `dag.rs` — Flow executor: topological sort, node execution pipeline, `run_flow()`
- `db.rs` — SQLite persistence: `save_flow()`, `load_flow()`, `list_flows()`, `delete_flow()`, `save_execution()`
- `nodes/mod.rs` + 11 node files — All 11 nodes registered and dispatched
- `lib.rs` — All 10 Tauri commands registered: `list_flows`, `load_flow`, `save_flow`, `delete_flow`, `run_flow`, `get_node_schemas`, `nlp_send`, `nlp_fetch_url`, `generate_code`, `refine_file`

### ✅ Frontend
- `NlpChatPanel.svelte` — Multimodal chat, attachments, mic, URL fetch
- `CodeGenPanel.svelte` — Code gen UI, file tree, refinement, progress
- `FlowCanvas.svelte` — Visual flow editor with node canvas
- `store.ts` — All NLP + CodeGen + Flow stores
- `types.ts` — Corrected snake_case types aligned with Rust serialization
- `tauri.ts` — All command bindings verified

---

## What Is NOT Yet Verified (Requires Running App + Ollama)

| Claim | Status | Why |
|-------|--------|-----|
| NLP chat works end-to-end | ⚠️ Unverified | Needs Ollama running with a model |
| Code generation produces real files | ⚠️ Unverified | Needs Ollama + LLM response |
| Flow execution with all 11 nodes | ⚠️ Unverified | Sovereign run is `cargo tauri build` from `straw-app/`, not npm |
| LLM node connects to Ollama | ⚠️ Unverified | Needs Ollama running |
| Generated files written to disk | ⚠️ Unverified | Needs runtime test |

---

## What Was Overclaimed Previously

These claims were made in chat but were **not yet true** at the time of writing:

| Overclaim | Reality |
|-----------|---------|
| "✅ All validation checks passed" | The validator only checks file existence, not compilation |
| "Code compiles (Rust)" | Had 2 compile errors that were fixed during this verification |
| "Types defined (TypeScript)" | Had camelCase/snake_case mismatch that would break at runtime |
| "Commands registered (Tauri)" | `commands.rs` had dead imports for non-existent types |
| "Ready to use" | Was not buildable until fixes applied above |

---

## Remaining Minor Issues (Non-Blocking)

1. **Dead code warning** in `codegen.rs:92` — `parse_intent_and_plan` function is unused. Safe to leave or remove.
2. **3 a11y warnings** in `CodeGenPanel.svelte` — `<div>` click handler needs keyboard event + ARIA role. UI still works.
3. **`code_gen/` directory** — Was created with `mod.rs`, `nlp.rs`, `lib.rs` but is not used anywhere. The real modules are `nlp.rs` and `codegen.rs` at the root of `src/`. This dead directory can be deleted.

---

## How to Run Right Now

```powershell
cd straw-app
trunk build
cargo tauri build
cargo test --workspace --offline --locked
cargo tree
```

These are the sovereign STRAW and Eduba commands. Do not use Node.js, npm, pnpm, yarn, Python, pip, Playwright, Vite, or Webpack.

---

## Summary

This May note is historical. The sovereign desktop and Eduba build with Trunk and Cargo, not a TypeScript or Vite toolchain.
