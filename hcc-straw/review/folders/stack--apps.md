# Folder review: apps

Reviewed 2026-10-09 by `/root/stack_apps`. Direct scope: application container and child integration boundaries. Nested `web` implementation has its own agents.

## What exists and what should exist

The container has only the `web` child and no direct files. Root README identifies a Svelte/Tauri/Rust/Axum/WASM desktop stack; the child describes an AUTARCH Next.js platform. The ownership and relationship need documentation. Web documentation describes an Express/PostgreSQL/Redis/Docker boundary that is absent locally. This is an architectural decision, not proof that all those technologies must be added.

## Findings and patch map

- **P1 — Setup references nonexistent files/scripts.** `apps/web/README.md:20` copies `../.env.example`, but that file is absent. Lines 24–28 run root npm scripts with no root `package.json`. Patch to an existing local env template and package-local commands. Accept when every documented command resolves to an existing script or file.
- **P1 — Deployment claims outrun implementation.** `apps/web/README.md:70–82,164–176` and `ARCHITECTURE.md:48,79,88,169` describe services with no `apps/api`, compose or workflow files. `SETUP_GUIDE.md:351–353` still calls for a real API/database/deployment. Choose the API boundary, then label planned services and create dependency-ordered implementation tasks. Accept when every diagram service has a source owner and runnable command, or a clearly pending task.
- **P2 — Product relationship undocumented.** Root `README.md:1–2` and web `README.md:1–3` describe different stacks. Add `apps/README.md` and root links defining whether web is independent, companion, or example. This is a design clarification.

## To-do

- [ ] [P1] Repair setup commands and environment-template locations in web README/quick start/setup guide; verify from a clean terminal.
- [ ] [P1] Decide the server/deployment boundary and reconcile architecture/completion claims with implemented services; depends on root product scope decision.
- [ ] [P2] Add application-container documentation and explain desktop/web ownership.

## Validation

Read root README and all five web Markdown docs. Filesystem absence verified; no executable checks exist at container level. No source edits, installs or runtime claims.
