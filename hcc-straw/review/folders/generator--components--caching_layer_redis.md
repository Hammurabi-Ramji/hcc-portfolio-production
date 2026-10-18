# Review: caching_layer_redis

Reviewed all direct files: `Cargo.toml` (6 lines), `.gitignore` (1), and legacy `cache.rs` (50); nested `.git` exists. No applicable ancestor AGENTS.md was found. `Cargo.toml:1–6` defines a dependency-free edition-2024 library; with no explicit target override, `src/lib.rs` is canonical. The generator workspace includes it (`Cargo.toml:16`). SHA-256 comparison confirms `cache.rs` currently matches that canonical source exactly; it is not a second compiled target.

The bundle contract in `docs/README.md`, Redis requirement in `docs/EXPANDED_SAAS_FRAMEWORK.md:11`, and memory-cache description in `docs/FINAL_VERIFICATION_REPORT.md:22` leave the backend contract ambiguous. The web guide also names Redis (`output/WEB_PLATFORM_SUMMARY.md:148`); no Redis dependency exists here. The child-source report identifies expiration retention and unchecked TTL deadline defects, also present in `cache.rs:18–31`.

Patch plan: before, two implementation copies and ambiguous backend naming; after, one documented canonical source (remove the legacy copy or generate it), with backend claims aligned to the chosen implementation. Dependency-free memory fixes can stay in std; a real Redis backend needs client/runtime/configuration decisions. Packaging also copies this component's `.git` because `core/controller.py:90–95` has no exclusions; apply the shared controller exclusion fix already identified in the core review.

- [ ] Document canonical ownership and remove/prevent legacy divergence.
- [ ] Resolve backend contract alongside child-source fixes.
- [ ] Verify generated bundles retain manifest/source while excluding `.git` and `target`; `.gitignore:1` alone cannot filter copytree.

Confidence: high. Verification used direct reads and hashes; no source edits, builds, tests, installs, or network.

