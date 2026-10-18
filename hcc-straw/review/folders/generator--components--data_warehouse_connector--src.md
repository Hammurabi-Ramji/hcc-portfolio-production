# Folder review: data_warehouse_connector/src

Assigned scope: `C:\IEDB\STRAW SaaS Generator\components\data_warehouse_connector\src`; direct file inspected completely with numbered lines: `lib.rs` (36 lines). No applicable ancestor AGENTS.md was found. This folder exposes a warehouse enum, a connector holding only that enum, a string-returning query method, and one unit test. Parent Cargo.toml has no dependencies; the workspace includes this crate and core/config.json:29 lists it as selectable. A parent warehouse.rs duplicates the implementation, but belongs to the separate parent-folder review.

## Requirements and findings

The root README describes modular starter bundles. docs/EXPANDED_SAAS_FRAMEWORK.md:11 promises analytics warehouse support, and docs/FINAL_VERIFICATION_REPORT.md:7,26 explicitly claims fully implemented Snowflake, BigQuery, and Redshift connectors. Relevant Stack desktop/web output guidance provides no additional warehouse-specific runtime contract. Current source does not satisfy those connector claims.

- **P1 — Proven nonfunctional connector / requirement gap:** `lib.rs:12-22` accepts only a provider enum and returns a formatted message for every SQL string. It stores no endpoint, account/project, credentials, connection, or transport, never submits a query, never returns rows, and cannot report execution errors. Selecting any of the three advertised providers therefore produces a demonstration string rather than warehouse access. Patch `lib.rs:7-23` to introduce provider-specific validated configuration, a transport/client boundary, and an asynchronous `Result<QueryResult, WarehouseError>` API. Implement authenticated query submission, bounded polling where required, cancellation/timeouts, and typed rows. Until provider adapters exist, return an explicit Unsupported/NotImplemented error instead of an execution-looking response. Coordinate necessary dependencies in parent Cargo.toml and revise the verification claim.
- **P2 — Proven verification gap:** `lib.rs:31-34` merely asserts that the formatted string contains Snowflake. This passes without any connection or execution and covers neither other provider nor error behavior. Replace this assertion with injected-transport tests proving the submitted SQL/configuration, returned row decoding, remote failure propagation, and deadline behavior across provider variants; keep real service tests opt-in.

## Dependencies, acceptance, and confidence

Provider adapters require configuration/secret resolution, HTTP or database clients, async runtime support, and a defined consumer result contract. No runtime callers were found in the searched generator Rust files or Stack Tauri source beyond duplicate/test definitions; copying this crate into a generated bundle is not runtime integration evidence.

Acceptance: every provider either executes through a verified adapter or returns an explicit unavailable error; invalid configuration and remote failures never resemble success; fixture rows survive decoding; provider tests assert transport interactions. Confidence is high for the static findings. No builds, tests, installs, network calls, or source edits were performed; root-owned build results cannot establish live warehouse connectivity.

- [ ] Define configuration, result, and error contracts.
- [ ] Implement or explicitly disable provider adapters.
- [ ] Replace message-only tests with transport-level checks.
- [ ] Correct documentation and verify a generated consumer integration.
