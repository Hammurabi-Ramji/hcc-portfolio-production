# Folder review: Stack / tests (index 121)

## Inventory and current contract

Reviewed every direct file: `tests/package.json` (13 lines) and `tests/package-lock.json` (lockfile v3 metadata and complete package entries). The folder contains no specifications, configuration, fixtures, or child folders. No applicable root/ancestor `AGENTS.md` was present. The package advertises desktop E2E tests and exposes `playwright test` and `playwright show-report playwright-report` (`package.json:4,7-8`). Its manifest range `^1.41.1` legitimately resolves to Playwright 1.60.0 in the lockfile (`package-lock.json:16-31`); the lock requires Node >=18. That version difference is not a defect.

The current desktop is a Cargo workspace (`straw-app/Cargo.toml:1-4`), has no package.json, and explicitly names `cargo test` as its test framework (`straw-app/README.md:18-27`). Browser-only use supports compute while engine commands require Tauri (`README.md:31`). Generator documentation describes broader generated SaaS coverage; its completion claims are not evidence for this empty test package. Current desktop verification explicitly leaves live browser WASM and model/installer acceptance pending (`straw-app/STRAW-001-VERIFICATION.md:32,39`).

## Finding and concrete patch

**P2 — orphan E2E entry point cannot verify the current application.** `tests/package.json:7` invokes Playwright in a directory containing zero test files and no configuration linking another suite or starting an application. The report script at line 8 also points to an absent report. Installing dependencies would not supply application tests. This is a proven repository integration gap, not proof of a desktop runtime defect. The old discovery artifact lists 168 tests from `external/BSM-C/hcc-straw/hcc-straw/straw-app/tests` (`review/playwright-discovery.log:4` onward); those locations and old service ports cannot establish coverage for the replaced desktop.

Concrete patch target: retire the unused `tests/package.json` and `tests/package-lock.json` together, and add a short `tests/README.md` directing desktop verification to `cd straw-app; cargo test --workspace --offline` and its verification document. Retain an E2E package only if there is an explicitly owned current browser suite with a confined testDir, Trunk startup, and real WASM assertions; desktop command verification needs a real Tauri harness. Do not revive the historical mocked service/UI suite as current evidence. Documentation owner should also replace `output/CODEBASE_VERIFICATION_REPORT.md:182` (`pnpm test:e2e` in a package-free directory) with the current command or mark that report historical.

## Dependencies and acceptance

Depends on current desktop verification owner and output-guide owner; no production-code dependency is introduced by retirement. Acceptance: no advertised command targets a removed package; current desktop Cargo test results are recorded separately from browser/manual acceptance; historical Playwright discovery is clearly labeled historical. If retained instead, discovery must find current local specifications and a clean run must exercise the actual WASM export and report the desktop-shell boundary accurately.

Static-review confidence: high. No test commands, installs, network calls, or broad checks were run. Saved controller logs show environment/lock limitations (`desktop-current-cargo-test.log`, `desktop-current-unit-tests.log`) and a separately passing Axum fixture run; they are not an all-green current workspace result.

- [ ] Retire or explicitly reconnect the orphan E2E package, updating both manifest and lock together.
- [ ] Publish current verification commands and distinguish historical E2E artifacts from current acceptance.

