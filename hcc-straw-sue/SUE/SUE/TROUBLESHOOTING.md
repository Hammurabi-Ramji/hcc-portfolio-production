# SUE Troubleshooting Guide

## Current baseline

The main repo gates are green:

- `pnpm run validate`
- `pnpm test`
- `pnpm run check:wasm`
- `pnpm run verify:local`

## Local API not reachable

Start it manually:

```powershell
Set-Location 'C:\SUE\SUE'
pnpm run api
```

Check:

```powershell
curl http://127.0.0.1:8080/api/v1/status
```

## AI chat not responding

- Confirm Ollama is running:

```powershell
ollama serve
```

- Confirm the extension can reach `http://localhost:11434`.

## Which commands are green right now?

```powershell
pnpm run validate
pnpm test
pnpm run check:wasm
pnpm run verify:local
```
