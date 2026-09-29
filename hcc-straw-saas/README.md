# HCC STRAW SaaS Generator

A local-first SaaS starter generator that assembles template bundles from reusable component folders under `components/`.

## What it does

- lists available SaaS templates
- lists available generator components
- generates one template at a time
- generates all configured templates when explicitly requested
- creates placeholder READMEs for components that have not been implemented yet

## Quick start

From `c:\hcc-straw\hcc-straw-saas`:

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
