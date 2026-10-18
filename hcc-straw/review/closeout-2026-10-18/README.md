# STRAW closeout — 2026-10-18

Scope confirmed by the user: STRAW Stack and STRAW SaaS Generator. Both resolve through junctions into the same portfolio repository, on `feat/vps-sue-setup`. This closes the source checkpoint; it does not declare a release or complete unchecked remediation tasks.

## Verified in this closeout

- Desktop, `straw-app/`: `cargo test --workspace --offline --locked` exited 0, with 276 passing tests including doctests. Exact output: [desktop-tests.log](desktop-tests.log). The sandbox-only attempt failed on forbidden loopback sockets; the successful run used local socket access. Cargo reported incremental-cache hard-link warnings and fell back to copying.
- Legacy web, `apps/web/`: `npm run type-check`, `npm run lint`, and `npm run build` exited 0. The build compiled and generated 28 pages. Lint retains six warnings: two ref-cleanup warnings, two internal anchor warnings, and two image warnings. The successful build explicitly disabled telemetry and used npm offline mode. An earlier sandbox build failed creating output through the junction; that filesystem failure was superseded by the passing run.
- Local API, `apps/api/`: `cargo test --offline --locked` exited 0; all 10 HTTP integration tests passed with loopback access. The sandbox-only HTTP connection failures were superseded by this run.
- Generator: `cargo test --workspace --offline --locked` exited 0, with 35 unit tests across 32 component crates. These tests do not establish generated application builds or live external integrations.

## Source disposition

- `1b3cbb8`: local web session/project page remediation, supporting UI/contracts/docs, and API regression coverage.
- `c8e07ee`: generator source, templates, documentation and lockfile checkpoint. Embedded component Git metadata was preserved; source files were recorded as ordinary files in the portfolio repository.
- The accompanying desktop closeout commit records the native desktop modules, frontend source, build scripts, lockfile, folder reports, review registry and selected direct agent evidence.

Build products, model weights, local databases, secrets, generated generator output, and copied/isolated audit workspaces are excluded from the checkpoint. Additional raw evidence, copied fixtures, the legacy `straw-stack/` tree, and the accidental `straw-app/ %log%` artifact remain on disk. Curated reports can refer to those local artifacts; their presence is not a claim that every raw artifact was versioned. Unrelated portfolio changes were left intact. No push, merge, installation, deployment, or chat archival was performed.

## Gates still open

The documented G3 literal whole-source scan remains a release hold. Historical S15 desktop observations are retained as dated observations, not a new UI or installer acceptance run. No new installer or live-model acceptance was performed here.

Generator G01/G02/G03/G12 remain open: placeholder/readiness accounting, confined failure-safe output replacement, runnable assembly, and local storage path containment. The generator README now states those limitations. Other unchecked folder acceptance and the remediation registry remain open; passing these checks does not settle them automatically.

Use each project's existing `to-do.md` and the remediation ledger for the remaining implementation and runtime acceptance work.
