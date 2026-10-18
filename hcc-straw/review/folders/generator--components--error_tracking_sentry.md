# Folder review: components/error_tracking_sentry

Scope: direct files in `C:\IEDB\STRAW SaaS Generator\components\error_tracking_sentry`: `.gitignore` (one line), `Cargo.toml` (six lines), and `tracker.rs` (21 lines). The nested `src` implementation has its own report, `generator--components--error_tracking_sentry--src.md`. Checked ancestor folders contain no applicable AGENTS.md. The nested `.git` directory was excluded from content inspection.

Expected behavior: generator README:3,26-29 defines reusable component bundles; `docs/README.md:3` targets desktop-first STRAW applications. `docs/EXPANDED_SAAS_FRAMEWORK.md:13` promises Sentry tracking, and `docs/FINAL_VERIFICATION_REPORT.md:32` calls it integrated. Stack output guides describe separate Rust desktop engines and Next.js web hosting; neither establishes this component as an initialized host service.

## Findings / patch targets

- **P2 — Duplicate implementation outside the Cargo target.** `Cargo.toml:1-6` uses Cargo's default `src/lib.rs` target; there is no `[lib] path` selecting `tracker.rs`. The direct `tracker.rs:1-21` is byte-identical to `src/lib.rs` (SHA-256 compared). Editing or testing the named direct tracker therefore does not change the exported crate, while `core/controller.py:91-96` copies both versions into bundles. No targeted caller references `tracker.rs` or `SentryTracker` in core, templates, or desktop Rust. Patch: delete the redundant direct file and document `src/lib.rs` as canonical; if compatibility requires the direct file, make it an explicit re-export adapter with a demonstrated consumer. This is a source-ownership/maintenance defect, not a current behavioral difference.
- **P1 capability gap, already owned by the child review.** `tracker.rs:4-9` prints messages, and `Cargo.toml:6` declares no SDK/transport dependency. The direct copy supplies no alternate working Sentry implementation. Apply the child report's capture/configuration/lifecycle changes to the canonical source, add the chosen dependency here, and correct verification claims until transport-backed capture exists. Its print-only smoke test at `tracker.rs:18-19` cannot substantiate delivery.

Packaging: `.gitignore:1` correctly excludes Cargo `target` from Git, but does not filter Python copying. Because this folder contains `.git`, the unfiltered `copytree` also carries repository metadata into generated components. Coordinate a shared controller ignore policy rather than adding component-specific copy logic; this is an integration dependency outside this folder's patch ownership.

## Tasks / acceptance

- [ ] Establish one canonical tracker source and remove or justify the duplicate.
- [ ] Add manifest dependencies only alongside the child review's real transport implementation.
- [ ] Confirm Cargo resolves the intended canonical source and a generated selected-component bundle contains it without `.git`/`target`.
- [ ] Exercise fake-transport message/exception capture and host initialization after implementation.

Confidence: high for direct-file contents, matching hashes, default Cargo target, and copy behavior; integration search was targeted. No source edits, builds, tests, installations, or network requests were performed.
