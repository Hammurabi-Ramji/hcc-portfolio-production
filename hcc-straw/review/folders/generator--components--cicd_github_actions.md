# Review 050 — cicd_github_actions

Reviewed the sole direct file, `components/cicd_github_actions/main.yml` (25 lines), plus generator packaging, manifests, and relevant documentation. No applicable ancestor AGENTS.md was present.

Existing behavior: push/PR triggers for `main`, Ubuntu Rust setup, `cargo test --all`, and a dependent deployment job. `docs/EXPANDED_SAAS_FRAMEWORK.md:12,35` promises CI/CD but describes infrastructure as customizable shells; `docs/FINAL_VERIFICATION_REPORT.md:7,41` instead claims no placeholders and production readiness.

- **P1 — Workflow is never installed for discovery.** `core/controller.py:87-95` copies this file to `output/<template>/src/cicd_github_actions/main.yml`; it does not create `.github/workflows/main.yml`. Neither repository currently has `.github/workflows`. Selecting this default component (`core/controller.py:146`) therefore supplies inert YAML. Patch the generator with an explicit workflow destination and document which generated directory becomes the repository root.
- **P1 — Generated working directory lacks a build manifest.** `main.yml:17` assumes a root Cargo workspace. The generator creates component directories and `manifest.json` only (`core/controller.py:87-125`); the source repository's `Cargo.toml:1-36` is not copied. Merely relocating the workflow still leaves `cargo test --all` unusable at a generated repository root. Generate a workspace listing selected Rust crates or render explicit manifest paths. The source workspace covers backend components only: this job cannot validate desktop frontend/WASM/Tauri or web builds. If those are intended coverage, add jobs using actual scripts (`STRAW Stack/straw-app/package.json:8-15`; `apps/web/package.json:7-10`) and appropriate working directories/dependencies.
- **P2 — Deployment reports success without deploying.** `main.yml:24-25` only echoes text. Remove/label this placeholder until a target, artifact, credentials, and failure-propagating deployment command exist; correct completion claims.

- [ ] Generate a selected-component fixture; verify workflow placement and runnable workspace.
- [ ] Verify failing tests block deployment and frontend checks use real scripts.
- [ ] Validate configured deployment against an actual target before claiming delivery.

Confidence: high for static findings. No installs, network, source edits, workflow execution, or build/tests performed.
