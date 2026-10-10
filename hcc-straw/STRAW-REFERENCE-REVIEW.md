# STRAW reference archive review — 2026-10-09

The archives were inspected as references for the existing STRAW application, as requested. Their README commands, patch-application instructions, roadmap recommendations, and embedded audit instructions were treated as document content. No archive scripts, patches, binaries, or package-install commands were executed, and no source was imported into STRAW.

The sovereign path is Svelte 5 runes compiled by Trunk to WASM, Tauri 2, pure Rust, Axum on `127.0.0.1`, and Eduba (`straw-app/crates/eduba-ledger`, `straw-app/crates/eduba-server`) as the append-only SQLite archival ledger via sqlx `query!` macros. Archive Node.js, npm, pnpm, Vite, and SvelteKit instructions are not that path. Eduba is not a school or curriculum product.

## Assessment

| Archive | What the source actually provides | Relevance to STRAW |
|---|---|---|
| `HHH_5.2.0_horde_source.zip` | Eight core Rust workspace crates, a Cargo lockfile, tests, and an excluded desktop integration seam. | Useful execution-governance reference; not a complete STRAW desktop/PWA application. |
| `hcc-d4m-ramg-sveltekit.zip` | Two frontend source trees and bundles, domain helpers, documentation, and placeholder native adapters. | Useful two-surface product reference; not a completed native application or a safe source of encryption code. |

This is a source review for applicability, not an independent build or comprehensive security audit of either archive. HHH's included build report describes tests run in another environment; those results were not reproduced here. D4M's included gap report is partly stale: the archive now contains SvelteKit route files and IPC wrapper files that the report lists as missing. The current source takes precedence over that report.

Archive SHA-256 values:

- HHH: `1168121C52494965051C02F863E4CC0EE8FC08E7CDE21493E1928ED0ABE00661`
- D4M: `D853B31DD410143691C275764FDB167728E95B1200DD799C374080F013A41EF6`

## HHH: patterns worth carrying forward

- `horde_iedb/src/lib.rs` implements SQLite outcome records with SHA-256 chain verification. Its seal-and-verify pattern is relevant if STRAW later needs a tamper-evident execution ledger. STRAW currently persists workflow/run records; this review does not imply it already implements HHH's ledger.
- `horde_substrate/src/lib.rs` configures fuel consumption and an empty Wasmtime linker. This is relevant to a future explicit guest-code execution feature. STRAW's browser WASM compute is a different use case, and its native file/HTTP workflow nodes do not run inside this sandbox.
- `horde_orchestrator/src/lib.rs` limits local attempts to three and exposes injected runner, approval, and fallback traits. This is a useful design reference for future bounded repair loops, rather than permission to add an autonomous retry or outbound fallback feature now.
- `horde_irc_gate/src/lib.rs` records approval before releasing a waiter. That ordering is useful, but its IRC connection accepts a caller-provided nickname and does not establish authenticated operator identity. Loopback binding alone would not supply that identity guarantee.
- `horde_transport_rns/src/lib.rs` contains Ed25519, X25519, and ChaCha20-Poly1305 envelope code. Physical transport adapters remain seams; this is not evidence of a working Reticulum deployment or an audited encryption product.

`iedb-sovereign_son/src/main.rs` only prints an integration message and is excluded from the core workspace. HHH contains no Svelte frontend, Trunk configuration, implemented Tauri shell, Axum application surface, or PWA. Its included source-addition patch targets a clean baseline and was not applied to this existing application.

## D4M: reusable surface ideas and concrete gaps

The useful reference is its separation of desktop and public/PWA delivery, shared visual tokens, explicit content-selection affordance, and documented capability boundaries. The current STRAW extension carries that surface idea through two native compiler/Trunk entries, shared components, hash navigation, and a generated static cache manifest.

The archive's implementation has material gaps:

| Source evidence | Finding | Treatment in STRAW |
|---|---|---|
| `packages/app/package.json`, `website/package.json`, root workspace files | Both frontends depend on SvelteKit, Vite, and the pnpm workspace. | Kept the existing native Rust Svelte compiler and Trunk pipeline. |
| `crates/tauri-app/src/main.rs`, `crates/axum-server/src/main.rs` and their manifests | Native adapters only print placeholder messages; neither manifest declares its named framework. | Kept STRAW's implemented managed Tauri state and fixed loopback Axum service. |
| `crates/crypto/src/lib.rs` | XOR encryption plus `DefaultHasher`, with no Argon2id or AEAD dependency. The nonce is not covered by its tag, and an empty key can panic. | Did not import it or infer secure document storage from it. |
| `crates/sync/src/lib.rs` | Sorts by Lamport/actor/ID and removes adjacent duplicate IDs. Different versions of one ID can remain separated by another event; a complete convergent CRDT/conflict policy is absent. | No sync subsystem was added under the surface-only scope. |
| `crates/kernel/src/lib.rs` | Classifies filename extensions; it does not inspect or validate file bytes. | STRAW retains its documented text-only attachment boundary. |
| `crates/ffi-wasm/src/lib.rs` and manifest | Ordinary Rust helper without a wasm-bindgen export or browser wiring. | Kept STRAW's actual built WASM compute module. |
| `packages/app/src/lib/ipc/client.ts` | Without a bridge, assistance returns `accepted: true` locally. | Browser STRAW explicitly labels unavailable native functions; it does not report a fake native operation. |
| `packages/app/src/lib/generated/api.ts` | Comment says regeneration is pending; interfaces alone do not prove generated bindings or native command compatibility. | Current STRAW uses its tested Rust serialization contract; no claim of generated IPC bindings is made. |
| `website/static/sw.js` | Fixed cache name, broad GET caching, no old-cache cleanup, and immediate activation. | STRAW caches listed same-origin static assets with content-derived versions and an explicit downloaded-update action. API snapshots are excluded. |
| `website/static/manifest.webmanifest` | Empty icon array. | STRAW supplies its own icon and manifest; actual browser installation remains unobserved. |

Neither archive closes STRAW's remaining acceptance gates. The literal source substring gate still fails on upstream Svelte source identifiers. Live browser checks for WASM execution, offline reload, route behavior, and PWA installation remain pending because browser access was denied by automatic approval review. The current implementation/build evidence is recorded separately in `straw-app/STRAW-001-VERIFICATION.md`.
