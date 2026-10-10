# eduba-server

Axum process for the Eduba archival ledger. It serves `eduba-ledger` and binds only `127.0.0.1`. The default listen address is `127.0.0.1:8080` (`AUTARCH_BE_ADDR`). Any other address is refused. The database URL defaults to `sqlite://eduba.db?mode=rwc` (`ACCORDION_DB_PATH`).

Eduba is the append-only SQLite record house, not a school, LMS, curriculum, or student product. Persistence is sqlx `query!` macros in `eduba-ledger`.

No Node.js, npm, Python, pip, Playwright, Vite, or Webpack. No `package.json`.

From `straw-app/`:

```powershell
cargo test --offline --locked -p eduba-server
cargo run --offline --locked -p eduba-server
cargo tree -p eduba-server
```
