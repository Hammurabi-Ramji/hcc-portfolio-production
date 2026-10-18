# HCC STRAW SaaS Generator

A local-first SaaS starter generator that assembles template bundles from reusable component folders under `components/`.

Closeout review, 2026-10-18: this is a source-bundle checkpoint. The Rust workspace's 35 unit tests pass with `cargo test --workspace --offline --locked`; they do not establish runnable generated applications or working external integrations. Read [to-do.md](to-do.md) for open acceptance work, especially G01/G02/G03 and G12. The controller currently overstates placeholder readiness, replaces output without transactional staging, and local storage does not yet confine caller-supplied paths. Keep these gates open before using generated bundles with real data.

## What it does

- lists available SaaS templates
- lists available generator components
- generates one template at a time
- generates all configured templates when explicitly requested
- creates placeholder READMEs for components that have not been implemented yet

## Quick start

From the generator checkout (on this machine, `C:\IEDB\STRAW SaaS Generator`):

- `python .\core\controller.py --help`
- `python .\core\controller.py --list-templates`
- `python .\core\controller.py --list-components`
- `python .\core\controller.py --template healthcare_saas`
- `python .\core\controller.py --template healthcare_saas --components auth_system database_sqlite api_layer_axum`
- `python .\core\controller.py --all`

## Output

Generated bundles are written to `output/<template_name>/` with:

- `src/` containing copied component folders
- `manifest.json` describing included and missing components

## Notes

- The generator no longer auto-builds every template when you ask for help.
- If a requested component has no implementation folder content yet, a placeholder `README.md` is created so the output stays structurally complete.
- The controller resolves its config from `core/config.json` by default and falls back to the repository root when the configured base path is unavailable.
