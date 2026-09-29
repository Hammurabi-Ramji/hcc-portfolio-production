# Scrivfactory

Scrivfactory is a CLI-first Scrivener 3 Template Factory that generates ready-to-open `.scriv` projects from JSON or YAML template definitions.

It ships with a built-in FDA compliance dossier template and supports custom binder structures, metadata fields, smart collections, document templates, variable substitution, and RTF generation.

## Beta status

`scrivfactory` is currently being prepared for **beta testing**. The core CLI and template-generation flows are already covered by the automated test suite, and the beta pass focuses on package build verification, installation smoke tests, and tester documentation.

## Features

- Parse JSON and YAML template definitions
- Generate Scrivener-like project structure with `.scrivx`, `Files/`, `Settings/`, and `Backups/`
- Create RTF documents from inline content or external content files
- Support template variables such as `{{date}}`, `{{year}}`, `{{fulldate}}`
- Support placeholder counters such as `[DOCNUM]` from `auto_increment:0001`
- Validate template structure before build
- Built-in templates:
  - `fda_compliance`
  - `novel`
  - `academic`
  - `project_management`
  - `blank`

## Installation

```bash
pip install -e .
```

To test the packaged beta artifact instead of an editable checkout, build the project and install the generated wheel:

```bash
python -m build
pip install dist/scrivfactory-0.2.0b1-py3-none-any.whl
```

## Quick start

```bash
scrivfactory templates
scrivfactory init --template fda_compliance --output ./fda_compliance_template.yaml
scrivfactory validate ./fda_compliance_template.yaml
scrivfactory build ./fda_compliance_template.yaml --output ./FDA_Compliance_Dossier.scriv
scrivfactory create fda_compliance --name "Q2_Compliance_Dossier" --output ./Projects
```

## CLI commands

### List built-in templates

```bash
scrivfactory templates
```

### Export a built-in template definition

```bash
scrivfactory init --template fda_compliance --output ./fda_template.yaml
```

### Validate a template file

```bash
scrivfactory validate ./fda_template.yaml
```

### Build a Scrivener project from a template file

```bash
scrivfactory build ./fda_template.yaml --output ./MyProject.scriv
```

### Create a project directly from a built-in template

```bash
scrivfactory create fda_compliance --name "Inspection_Dossier" --output ./Projects
```

### Interactive mode

```bash
scrivfactory interactive
```

## Project layout

```text
scrivfactory/
├── pyproject.toml
├── README.md
├── TEMPLATE_SPEC.md
├── API.md
├── src/
│   └── scrivfactory/
│       ├── cli/
│       ├── core/
│       ├── models/
│       ├── templates/
│       └── utils/
└── tests/
```

## Notes on Scrivener compatibility

Scrivfactory generates a Scrivener-like `.scriv` package structure with XML and RTF assets intended for Scrivener 3 workflows. The workspace references used here were based on the FDA compliance binder system already present in this repository.

## Development

Run tests:

```bash
python -m pytest
```

Or use the standard library test runner:

```bash
python -m unittest discover -s tests -p "test_*.py"
```

For the current beta checklist and manual verification steps, see [BETA_TESTING.md](BETA_TESTING.md).
