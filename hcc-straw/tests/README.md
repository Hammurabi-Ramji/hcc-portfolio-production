# Tests

This directory does not contain a current end-to-end suite.

The previous Playwright package advertised `playwright test` without test files, a config, or an application startup command. That manifest and lockfile were removed together. The May 2026 discovery log at `review/playwright-discovery.log` found 168 historical cases in a removed tree. That log is historical discovery evidence, not a current pass.

Current desktop verification:

```powershell
cd straw-app
cargo test --workspace --offline
```

Results and pending browser, model, and installer checks are recorded in `straw-app/STRAW-001-VERIFICATION.md`. Cargo test success is separate from live UI acceptance.

A browser suite belongs here only when it has its own test directory, starts the current Trunk surface, and asserts the real WebAssembly export. Desktop command checks need a Tauri harness. Do not restore the removed mocked service suite as current evidence.
