# Applications

This folder is outside the sovereign STRAW/Eduba path. It does not build or launch the desktop, and it does not build Eduba.

## Sovereign desktop and Eduba

The sovereign product is `straw-app/`, outside this folder. Svelte 5 runes are compiled by Trunk to WASM. The shell is Tauri 2. Services are pure Rust. Axum binds only to `127.0.0.1`. Eduba (`straw-app/crates/eduba-ledger`, `straw-app/crates/eduba-server`) is the append-only SQLite archival ledger via sqlx `query!` macros. It is not a school or curriculum product.

Supported commands, from `straw-app/`: `trunk build`, `cargo tauri build`, `cargo test --workspace --offline --locked`, and `cargo tree`. No Node.js, npm, pnpm, yarn, Python, pip, Playwright, Vite, or Webpack. Setup is in `straw-app/README.md`. Recorded desktop results are in `straw-app/STRAW-001-VERIFICATION.md`.

The desk read-only loopback API is `127.0.0.1:8741`. That listener is not Eduba. Eduba's server binds `127.0.0.1` on its own port (default 8080).

## Legacy web

`apps/web` is the quarantined legacy Next.js tree. It is not the sovereign STRAW or Eduba path. Do not use it to build or run the desktop or the archival ledger. `apps/api` is the separate local Rust/Axum service that this legacy tree calls. The browser calls same-origin `/api`. Next proxies those requests to literal `127.0.0.1` on `STRAW_API_PORT` (default 3001). Session credentials stay in the `straw_session` cookie.

There is no Express service, PostgreSQL, Redis, Docker Compose, Nginx, or GitHub Actions workflow in this tree. Email delivery and file storage are not implemented; those routes return HTTP 501.

The legacy API process starts from `apps/api` with `cargo run --offline --locked`. Details for that quarantined tree are in `apps/web/README.md` and `apps/api/README.md`.
