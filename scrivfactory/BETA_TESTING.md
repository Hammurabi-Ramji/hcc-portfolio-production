# Scrivfactory Beta Testing Guide

## Goal

Validate that the packaged `scrivfactory` beta can be installed and used outside the source tree for the most important CLI workflows.

## Prerequisites

- Python 3.11+
- Access to the repository root
- Ability to create a virtual environment

## Automated verification

From the repository root:

```bash
python -m unittest discover -s tests -v
```

Expected result: all tests pass.

## Package build verification

Build the source and wheel artifacts:

```bash
python -m build
```

Expected result:

- `dist/*.tar.gz` is created
- `dist/*.whl` is created

## Clean install verification

Create a clean virtual environment and install the built wheel:

> Important: make sure no inherited `PYTHONPATH` override points at `src/` during this step, or the verification may accidentally import the source tree instead of the installed wheel.

```bash
python -m venv .venv-beta
.venv-beta\Scripts\python -m pip install --upgrade pip
.venv-beta\Scripts\python -m pip install dist\scrivfactory-0.2.0b1-py3-none-any.whl
```

## CLI smoke checks

Run these commands from the clean environment:

```bash
.venv-beta\Scripts\python -m scrivfactory templates
.venv-beta\Scripts\python -m scrivfactory create fda_compliance --name "Beta FDA Example" --output output --force
```

Expected result:

- built-in templates are listed successfully
- a `.scriv` project is generated under `output/`

## Beta exit criteria

- automated test suite passes
- package artifacts build successfully
- wheel installs in a clean environment
- CLI smoke commands succeed from the installed package
- README and setup instructions match reality
