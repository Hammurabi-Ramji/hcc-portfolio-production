# SUE — Development Setup

## Required tools

| Tool | Required | Notes |
| --- | --- | --- |
| Node.js 18+ | Yes | JS tooling |
| pnpm | Yes | Canonical package manager in this repo |
| Rust toolchain | Yes | WASM build |
| `wasm-pack` | Yes | `pnpm run package` depends on it |
| Playwright browsers | For E2E | Needed for `pnpm run test:e2e` |
| Ollama | Optional | Required only for local AI chat |

## Initial setup

```powershell
Set-Location 'C:\SUE\SUE'
pnpm install
rustup target add wasm32-unknown-unknown
pnpm run package
```

## Local services

```powershell
pnpm run api
ollama serve
```

- The local API defaults to `http://127.0.0.1:8080`.
- Ollama defaults to `http://127.0.0.1:11434`.

## Current toolchain status from audit

| Check | Result |
| --- | --- |
| WASM/package build | ✅ |
| TypeScript typecheck | ✅ |
| Unit tests | ✅ |
| E2E tests | ✅ |
| ESLint | ✅ |
| Prettier check | ✅ |
| Rust clippy (`pnpm run check:wasm`) | ✅ |

## Notes

- Use `dist\` as the unpacked extension folder.
- `package.json` and `manifest.json` are on `5.0.0`.
- The Cargo workspace is not fully version-aligned yet.
