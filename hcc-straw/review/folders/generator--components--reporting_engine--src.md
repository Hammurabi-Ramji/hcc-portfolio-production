# Folder review: reporting_engine/src

Scope: `C:\IEDB\STRAW SaaS Generator\components\reporting_engine\src`. Its sole direct file, `lib.rs` (52 lines), defines serializable report metadata, two static generators, and one unit test. No applicable ancestor AGENTS.md was found. The crate manifest supplies only serde; the generator workspace includes it (`Cargo.toml:12`). Controller copying (`core/controller.py:90–96`) and template bundling (`templates/bundle_templates.py:29–33,47–53`) distribute the component; the symbol search found definitions/tests and copied variants, not application callers.

Specified versus actual: `docs/README.md:26,55` promises PDF/CSV generation; the expanded framework describes reporting for Finance/Legal (`docs/EXPANDED_SAAS_FRAMEWORK.md:23,28`). CSV is actual text output for uncomplicated cells. PDF is explicitly mock output, consistent with `docs/TEST_REPORT.md:19`, and contradicts the blanket “No placeholders remain” claim (`docs/FINAL_VERIFICATION_REPORT.md:7`). No Excel or other format implementation was found or specifically required.

Prioritized findings:

- **P1 — PDF requirement gap:** `lib.rs:13–18` returns `PDF content for: ...`, not PDF bytes, structure, or a usable document. `Report.content:6` is a String, unsuitable as the raw binary export contract. Patch the payload representation and PDF method to return real document bytes and a fallible result; add a maintained Rust PDF renderer in the parent manifest. Define how callers export/serialize binary payloads. If mocks remain intentional, identify the API/documentation as mock rather than claiming PDF support.
- **P1 — CSV data corruption:** `lib.rs:24–25` joins unescaped fields. A cell `Smith, Jane` becomes two columns; embedded quotes/newlines cannot round-trip. Replace joining with a CSV writer (manifest dependency) or correct escaping. Preserve intended empty-cell/row behavior.
- **P2 — Acceptance gap:** `lib.rs:41–50` checks the PDF label and one uncomplicated CSV substring. Add PDF parser validation/content extraction and CSV round-trip cases for commas, quotes, CR/LF, Unicode, empty fields, and zero rows.

Dependencies: update the component API/manifest first, then regenerate distributed templates/output and any future export adapters. Confidence is high from complete direct-file inspection. No commands tested generation or parsed documents; the root’s reported 35 passing tests do not resolve these format gaps.

- [ ] Implement or explicitly mark mock PDF behavior.
- [ ] Correct CSV serialization and validate round-trips.
- [ ] Add format-validity acceptance checks; regenerate component copies.
