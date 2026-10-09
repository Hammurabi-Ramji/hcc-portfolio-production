# Applications

This folder holds the web product. It does not build or launch the desktop application.

## Desktop

The desktop product is `straw-app/`, outside this folder. It uses Svelte 5, Tauri, Rust, Axum, SQLite, and WebAssembly. Its read-only loopback API is `127.0.0.1:8741`. Setup and commands are in `straw-app/README.md`. Recorded results are in `straw-app/STRAW-001-VERIFICATION.md`.

## Web

`apps/web` is the Next.js application. `apps/api` is a separate local Rust/Axum service with SQLite. The browser calls same-origin `/api`. Next proxies those requests to literal `127.0.0.1` on `STRAW_API_PORT` (default 3001). Session credentials stay in the `straw_session` cookie.

There is no Express service, PostgreSQL, Redis, Docker Compose, Nginx, or GitHub Actions workflow in this tree. Email delivery and file storage are not implemented; those routes return HTTP 501.

Start the web app from `apps/web` with that package's scripts. Start the API from `apps/api` with `cargo run --offline --locked`. Details are in `apps/web/README.md` and `apps/api/README.md`.
