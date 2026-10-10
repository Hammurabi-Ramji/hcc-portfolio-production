# SUE Startup Checklist

## Prerequisites

- Node.js 18+
- pnpm
- Rust toolchain
- `wasm-pack`

## Bring the project up locally

```powershell
Set-Location 'C:\SUE\SUE'
pnpm install
pnpm run package
pnpm run api
```

Optional for AI chat:

```powershell
ollama serve
```

## Load the extension

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select `C:\SUE\SUE\dist`.

## Smoke checks

- Sidebar opens
- Dashboard renders
- Notes and projects load
- Settings persist
- API status is reachable at `http://127.0.0.1:8080/api/v1/status`
- `pnpm run verify:local` passes
