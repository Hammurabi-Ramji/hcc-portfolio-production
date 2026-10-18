# Review: components/ai_engine_ollama (direct files)

Reviewed `.gitignore`, `Cargo.toml`, and `engine.rs` completely; inspected Git metadata without history/object dumps. No applicable AGENTS.md was found. Cargo.toml has no `[lib]` override: Cargo compiles `src/lib.rs`, not `engine.rs`. Workspace `Cargo.toml:6` includes this crate; dependencies are serde, reqwest JSON, and Tokio. The generator-root `Cargo.lock` owns resolution (package entry line 18); no component lock/runtime configuration exists.

Docs/README.md:47 requires local Ollama inference. Root README describes starter bundles; expanded/final reports' production/testing claims exceed implementation evidence. Stack desktop/web guides establish no additional component requirements.

**P2, ownership gap:** `engine.rs:1-46` duplicates canonical source, omitting Debug derives and its initialization test. Status/timeout issues are covered in `generator--components--ai_engine_ollama--src.md`. Editing this direct file changes no compiled behavior. Remove it after confirming consumers, or document its purpose and enforce synchronization; functional patches belong in canonical src.

**P2, packaging defect:** `.gitignore:1` ignores target but cannot constrain Python copying. `core/controller.py:95` and `templates/bundle_templates.py:33` copy the nested `.git` repository. Patch both copy operations to exclude `.git` and build/cache output; coordinate with their owners.

- [ ] Resolve legacy-source ownership; document endpoint/model/service prerequisites.
- [ ] Exclude repository/build metadata from bundles.

Acceptance: Cargo resolves canonical src; generated AI bundles contain neither `.git` nor target; child-report behavior checks pass. Confidence: high for static evidence. No builds, tests, installs, or network checks run.
