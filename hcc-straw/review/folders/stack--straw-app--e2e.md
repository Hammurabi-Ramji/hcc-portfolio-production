# Folder review: straw-app/e2e (index 107)

Reviewed 2026-10-09 against the live tree after a concurrent application replacement. **The assigned folder is now absent.** This supersedes any inference that its original tests describe the current application.

## Inventory and scope

The frozen inventory (`review/inventory.json:111-120`) lists six direct files: `01-app-shell.spec.js`, `02-flow-management.spec.js`, `03-nlp-chat.spec.js`, `04-code-gen.spec.js`, `05-flow-and-toast.spec.js`, and `tauri-mock.js`. None remains at `C:\IEDB\STRAW Stack\straw-app\e2e`; therefore their contents could not be inspected in this live snapshot. The old package manifest and both Playwright configurations are also absent. No applicable ancestor/folder AGENTS.md was found. Child reports and the separate `tests/e2e` ownership are outside this review.

The Stack root is a junction to `C:\IEDB\external\BSM-C\hcc-straw\hcc-straw`; checking that target confirmed the same replacement rather than a second available test copy. Git could not resolve its recorded parent path, so no historical source was recovered. These are provenance limitations, not assertions about deleted test correctness.

## Current versus specified behavior

The current `straw-app/README.md:21-31` changes verification to Cargo tests and a Trunk frontend on 127.0.0.1:8080. Its promises cover serialization, SQLite persistence, failure propagation, file validation, and an actual Axum server. `README.md:46-58` describes newly minted flow UUIDs, camelCase attachments/generated files, and persisted refinement. `ui/App.svelte:23-35` now directly invokes `window.__TAURI__.core.invoke`; a normal browser lacks that bridge. Accordingly, a future browser mock can test rendering but cannot demonstrate real native deserialization, persistence or model/file execution.

Historical `output/TESTING_GUIDE.md:93,191` still gives npm/Tauri commands, while the current tree has Cargo/Trunk instead. Generator verification claims (`docs/FINAL_VERIFICATION_REPORT.md:7,36-41`) are broader than this folder's available evidence and do not establish current desktop UI coverage.

## Findings and concrete patch targets

1. **P1 verification gap, proven coverage removal:** the six frozen e2e sources and their execution configuration have disappeared during replacement. Cargo backend tests may be suitable replacements for engine behavior, but their presence alone cannot prove app-shell navigation, graph editing, toast/error rendering, startup bridge handling or frontend-to-native contracts. This is not proof of a runtime defect. Add the selected replacement UI/native smoke suite under a documented, versioned test directory; connect it to the current build/test command. Use the actual Trunk port from `Trunk.toml:7-9` if a browser harness is chosen.
2. **P2 stale evidence/documentation:** `review/playwright-discovery.log` records 168 cases in nine historical `tests/` files, not execution and not these six `e2e/` files. Those paths no longer exist. Update the acceptance/verification document referenced at `README.md:64` and `output/TESTING_GUIDE.md` to identify the migration, exact current test commands, results and pending native checks. Do not carry forward discovery counts as current passing tests.

## Dependencies, acceptance and tasks

Dependencies: current UI, engine contracts, Tauri command registry, workspace test owner, Trunk build and a provisioned native runtime. No source changes, installs, network or tests were performed here; prior direct-check results are invalidated for the replaced files. Confidence is high in absence/configuration observations, limited for current runtime behavior.

- [ ] Record intentional retirement of all six original e2e files and their replacement coverage.
- [ ] Verify app navigation, two distinct new-flow identities, save/reload/delete, graph failure reporting and visible error toasts against the current UI.
- [ ] Exercise real Tauri attachment/generated-file serialization and persisted refinement; identify mocked checks separately.
- [ ] Run current workspace tests plus native smoke checks and save new evidence tied to this source snapshot.
- [ ] Replace obsolete npm/Playwright instructions and historical passing/discovery implications.
