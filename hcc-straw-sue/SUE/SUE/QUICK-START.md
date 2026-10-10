# SUE — Quick Start

## Fastest path

```powershell
Set-Location 'C:\SUE\SUE'
pnpm install
pnpm run package
pnpm run api
```

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select `C:\SUE\SUE\dist`.

Run Ollama separately if you want AI chat:

```powershell
ollama serve
```

## What should work

- Sidebar boot and WASM mount
- Dashboard, projects, notes, settings, tabs, cloud status
- Local auth/session flows through `http://127.0.0.1:8080`
- `pnpm run verify:local`

## Useful commands

```powershell
pnpm run package
pnpm run typecheck
pnpm run test:unit
pnpm run test:e2e
pnpm run api
```
