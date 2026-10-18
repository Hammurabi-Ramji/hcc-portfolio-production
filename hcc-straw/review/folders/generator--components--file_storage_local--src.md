# Folder review: components/file_storage_local/src

Reviewed direct file: `C:\IEDB\STRAW SaaS Generator\components\file_storage_local\src\lib.rs` (55 lines). This dependency-free Rust library exposes local save/read/delete operations and one CRUD unit test. No applicable ancestor AGENTS.md was found. The parent Cargo manifest selects this file by Cargo convention; sibling `storage.rs` is a divergent, unselected copy without reading support. The generator copies the entire component folder (`core/controller.py:90-95`); copying is not evidence that an application invokes its API.

The documented requirement is local filesystem storage and retrieval (`docs/README.md:54`). Basic happy-path behavior exists. Reviewed the generator root README, relevant expanded-framework and final-verification claims, and Stack desktop/web guide references. The final verification report's production-ready assertion is unsupported by the following concrete defects.

## Findings and patch targets

- **P1, proven containment defect — lib.rs:16-28.** Every operation directly joins caller-provided `name` to the root. `../outside.txt` escapes the storage folder; an absolute path replaces the root. Save can overwrite an outside file, read can disclose one, and delete can remove one under the process account. There is no input validation or link handling. Replace the repeated joins with a shared checked path resolver. For a flat storage contract, accept only a single normal filename, rejecting parent/root/prefix components, separators, empty names and Windows alternate-stream syntax; reject symlink/reparse-point targets. If nested paths are required, use a containment-safe directory-relative implementation accounting for symlink races, rather than lexical checks alone. Exposure through a user-facing API was not established; the unsafe public-library behavior is established.
- **P2, proven error-handling defect — lib.rs:9-13.** Constructor directory creation uses `unwrap`, so denied permissions or an invalid path panic instead of returning an actionable I/O error. An existing regular file also passes the existence check, producing a storage object that cannot work. Change initialization to `io::Result<Self>`, validate the root as a directory, use `PathBuf`, and update callers/test initialization to propagate errors. This changes the public constructor signature.
- **P2, test reliability gap — lib.rs:39-53.** The test shares the fixed `hcc_test_storage` temporary directory. Concurrent runs can overwrite/delete each other's file, and an assertion failure leaves stale artifacts. Use a unique temporary directory with automatic cleanup; add constructor failure and path-boundary cases. This is a reproducible collision mechanism, not an observed test failure.

## Dependencies and acceptance

Implementation uses only `std`; a dev-only temporary-directory crate or equivalent unique-directory helper would support isolation. Follow up with the parent component review to select one canonical implementation, since the generator copies both source variants. Proposed durability improvement: document overwrite semantics and consider atomic replacement for saves (`lib.rs:18`), which currently truncate the destination; no atomic-write requirement was found.

- [ ] Reject traversal/absolute paths for all three operations; outside sentinel files remain unchanged.
- [ ] Cover symlink/reparse-point escape behavior and platform-specific filename cases.
- [ ] Return errors for an unusable root without panic; CRUD still round-trips binary content.
- [ ] Run isolated tests concurrently and confirm cleanup after failures.

Confidence: high for the direct code defects, moderate for downstream exposure. Read-only inspection only; no builds, tests, runtime filesystem probes, installs, or network checks were run by this reviewer. Source was not modified.
