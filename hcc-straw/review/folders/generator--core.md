# Review: generator/core

Scope: direct files `controller.py` (322 lines) and `config.json` (61 lines). No applicable root/ancestor/core `AGENTS.md` was found. Read generator root README, docs README, expanded framework and verification reports, plus Stack desktop/web output guides. Nested component files and template bundler were inspected only for integration evidence. No source edits, execution, builds, installs, or network calls were performed.

## Existing and required behavior

The Python standard-library controller exposes template/component listing, one-template generation, explicit all-template generation, deduplicated component overrides, and manifest creation. Its CLI correctly rejects `--all --template` and overrides without a template. Config declares 43 components and nine templates. Missing implementations receive README placeholders; this matches the current root README's starter-bundle positioning. The older documents promise production applications and complete implementations, which this controller does not establish. Reliable generation needs truthful output status, clean component copying, predictable paths, and failure-safe replacement. An actual buildable desktop/web generator also needs application entrypoints and coordinated manifests.

## Prioritized findings and patch targets

1. **P1, proven misleading readiness:** `controller.py:94-108` creates placeholders for absent/empty components, but `110-117` lists every configured selection as included, counts placeholders as features, records only unknown names as missing, and always writes `ready_to_build`. Even existing shell-only components pass the nonempty-directory check. Change the component loop to track copied, unavailable, and placeholder components separately; record incomplete status and reasons. Treat unknown requested names as explicit validation errors or a documented partial-result mode. Test empty selection and known unavailable component cases.

2. **P1, proven application-assembly gap:** `controller.py:87-122` emits only copied folders and a JSON manifest, without a root Cargo workspace, frontend package/build configuration, Tauri configuration, executable integration, or route/command wiring. A normal template therefore cannot be built as an application from its output root. The inspected desktop shell has commented-out Tauri initialization, confirming that copying alone supplies no running shell. Add an application skeleton and component registration/build-manifest generation if the documented full-stack application requirement remains; otherwise use an explicit source-bundle status and document manual integration. Root-level component Cargo tests are insufficient evidence of generated-application readiness.

3. **P2, proven repository metadata copying:** `controller.py:95` uses unrestricted `copytree`. The selected default `components/auth_system` contains a nested `.git` directory, so generation also copies repository internals into output. Add an ignore policy for `.git`, build output, dependency directories, local secrets, and caches; test that source and necessary manifests remain while excluded sentinel files do not. This is independent of the parent task's full-copy comparison.

4. **P2, proven stale-output risk:** `controller.py:81-85` swallows output cleanup failure, then `95` merges new files into existing directories. A locked previous file can leave removed components or obsolete source in a supposedly successful regenerated bundle. Generate into a sibling staging directory, validate it, then replace; abort clearly if replacement cannot complete. Preserve the previous output on failures and clean staging safely.

5. **P2, configuration portability:** `config.json:4` names an obsolete absolute checkout. `controller.py:27-33` silently uses that location whenever it exists and resolves relative paths against process working directory. It is absent on this machine, so the repository fallback currently works. Resolve relative configuration paths against the config location; validate the selected root's expected structure; expose the chosen root and fail on explicitly invalid roots instead of silently redirecting generation.

## Dependencies and acceptance

Template defaults at `controller.py:135-244` duplicate the older `templates/bundle_templates.py` mappings; consolidate into a shared declarative template definition as a proposed improvement. Component implementation quality, Cargo/npm toolchains, and desktop/web skeleton requirements belong to other folder reviews and parent build checks.

- [ ] Correct readiness, inclusion counts, and unavailable-component reporting.
- [ ] Establish runnable application output or accurately label source bundles.
- [ ] Exclude nested repositories, caches, and secret files from copying.
- [ ] Verify failed replacement preserves old output without mixed artifacts.
- [ ] Verify configuration works across checkout locations and working directories.

Confidence: high for static control-flow findings and observed filesystem metadata; medium for complete application requirements because current root README narrows scope. Acceptance checks above, controller CLI tests, generated builds, and end-to-end startup remain unrun by design; the parent owns execution and copy verification.
