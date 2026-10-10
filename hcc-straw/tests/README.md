# Tests

This directory does not contain a current end-to-end suite.

The previous Playwright package advertised `playwright test` without test files, a config, or an application startup command. That manifest and lockfile were removed together. The May 2026 discovery log at `review/playwright-discovery.log` found 168 historical cases in a removed tree. That log is historical discovery evidence, not a current pass.

Sovereign desktop and Eduba verification uses Cargo only. Eduba is the append-only SQLite archival ledger (`straw-app/crates/eduba-ledger`, `straw-app/crates/eduba-server`), not a school or curriculum product. No Node.js, npm, pnpm, yarn, Python, pip, Playwright, Vite, or Webpack.

```powershell
cd straw-app
cargo test --workspace --offline --locked
trunk build
cargo tauri build
cargo tree
```

Results and pending model and installer checks are recorded in `straw-app/STRAW-001-VERIFICATION.md`. Cargo test success is separate from live UI acceptance.

A Tauri harness belongs with the desktop commands. Do not restore the removed mocked service suite, or a Playwright or Python suite, as current evidence.
