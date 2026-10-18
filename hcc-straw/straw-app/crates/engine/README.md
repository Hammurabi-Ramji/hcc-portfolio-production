# straw-engine

Typed identities, contracts, validation/execution, persistence, node implementations, local model calls, generation/refinement, and file guards for STRAW Desk.

## Desktop-shell independence

This crate is a plain Rust library. It must not depend on Tauri or any other desktop shell. Consumers (`src-tauri`, `crates/axum-loop`) take a path dependency on the public API; the engine never imports those packages. Preserve that boundary when changing `Cargo.toml` or reviewing child-module work under `src/` and `src/nodes/` (owned by STACK-F035 / STACK-F036).

From `straw-app/`:

```powershell
cargo tree -p straw-engine --offline --locked --edges normal,build,dev
cargo test -p straw-engine --offline --locked
```

The resolved normal/build/dev tree must contain no `tauri` package.

## Networking boundary

`ureq` is configured without TLS defaults. Network helpers accept plain HTTP only; that matches the current desktop README, not historical async/TLS guidance.

## Documentation ownership

| Document | Role |
| --- | --- |
| [`straw-app/README.md`](../../README.md) | Current entry instructions and engine packaging claims |
| This README | Crate-local independence and ownership notes |
| `output/ENGINES_IMPLEMENTATION_GUIDE.md` and related May 2026 guides under `output/` | Historical records only; already labeled archived; not setup instructions |
| STACK-F028 / A-S16 | Historical-guide reconciliation and release-gate disposition |
| STACK-F051 / A-S15 | Observed desktop command, UI, and live-model acceptance |

Child implementation findings are fixed in `src/` (F035) and `src/nodes/` (F036) without adding Tauri features or shell-only dependencies here.
