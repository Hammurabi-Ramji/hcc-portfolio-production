# API

Scrivfactory exposes a small Python API for parsing templates, validating them, and building Scrivener projects.

## Template parsing

```python
from pathlib import Path
from scrivfactory.core.template_parser import load_template

template = load_template(Path("fda_template.yaml"))
```

## Validation

```python
from scrivfactory.utils.validators import validate_template_definition

issues = validate_template_definition(template)
if issues:
    for issue in issues:
        print(issue)
```

## Project generation

```python
from pathlib import Path
from scrivfactory.core.project_builder import ProjectBuilder

builder = ProjectBuilder()
result = builder.build(
    template=template,
    output_path=Path("./FDA_Compliance_Dossier.scriv"),
    project_name="FDA_Compliance_Dossier",
    force=True,
)

print(result.project_dir)
print(result.scrivx_file)
```

## Built-in templates

```python
from scrivfactory.core.template_parser import list_builtin_templates, load_builtin_template

print(list_builtin_templates())
fda_template = load_builtin_template("fda_compliance")
```
