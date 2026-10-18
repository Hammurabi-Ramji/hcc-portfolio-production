# eduba-ledger

Append-only SQLite archival ledger for the sovereign STRAW path. Records are inserted through sqlx `query!` and `query_as!` macros. Migrations live in `migrations/`.

This crate is the record house. It is not a school, LMS, curriculum, or student product. Schema tables already named in code are `learner`, `course`, `lesson`, `enrollment`, and `submission`. Those names are the stored record types.

Loopback only. No Node.js, npm, Python, pip, Playwright, Vite, or Webpack. No `package.json`.

From `straw-app/`:

```powershell
cargo test --offline --locked -p eduba-ledger
cargo tree -p eduba-ledger
```
