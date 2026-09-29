"""Template loading and built-in template access."""

from __future__ import annotations

import json
from importlib import resources
from pathlib import Path
from typing import Any

import yaml

from scrivfactory.exceptions import TemplateNotFoundError, ValidationError
from scrivfactory.models import TemplateDefinition

BUILTIN_TEMPLATE_PACKAGE = "scrivfactory.templates"


def list_builtin_templates() -> list[str]:
    names: list[str] = []
    for entry in resources.files(BUILTIN_TEMPLATE_PACKAGE).iterdir():
        if entry.name.startswith("__"):
            continue
        if entry.suffix.lower() in {".yaml", ".yml"}:
            names.append(entry.stem)
    return sorted(names)


def dump_builtin_template(template_name: str) -> str:
    resource = _get_builtin_template_resource(template_name)
    return resource.read_text(encoding="utf-8")


def load_builtin_template(template_name: str) -> TemplateDefinition:
    resource = _get_builtin_template_resource(template_name)
    with resources.as_file(resource) as resource_path:
        return parse_template_text(
            resource.read_text(encoding="utf-8"),
            source_path=resource_path,
            format_hint=resource_path.suffix,
        )


def load_template_file(path: Path | str) -> TemplateDefinition:
    template_path = Path(path)
    if not template_path.exists():
        raise TemplateNotFoundError(f"Template file not found: {template_path}")
    return parse_template_text(
        template_path.read_text(encoding="utf-8"),
        source_path=template_path,
        format_hint=template_path.suffix,
    )


def parse_template_text(
    text: str,
    *,
    source_path: Path | None = None,
    format_hint: str | None = None,
) -> TemplateDefinition:
    try:
        payload = _load_raw_template(text, format_hint=format_hint)
    except (json.JSONDecodeError, yaml.YAMLError) as exc:
        line_number = getattr(exc, "problem_mark", None)
        raise ValidationError(
            f"Unable to parse template: {exc}",
            line_number=(None if line_number is None else line_number.line + 1),
            suggestion="Check YAML indentation or JSON commas.",
        ) from exc

    if not isinstance(payload, dict):
        raise ValidationError(
            "Template root must be an object/mapping.",
            suggestion="Wrap the template in a top-level YAML or JSON object.",
        )

    try:
        return TemplateDefinition.from_dict(payload, source_path=source_path)
    except KeyError as exc:
        raise ValidationError(
            f"Missing required template field: {exc.args[0]}",
            suggestion="Add the missing field to the template definition.",
        ) from exc
    except (TypeError, ValueError) as exc:
        raise ValidationError(
            f"Invalid template value: {exc}",
            suggestion="Check field types in the template definition.",
        ) from exc


def _load_raw_template(text: str, *, format_hint: str | None = None) -> dict[str, Any]:
    hint = (format_hint or "").lower()
    if hint == ".json":
        return json.loads(text)
    return yaml.safe_load(text)


def _get_builtin_template_resource(template_name: str):
    normalized = template_name.removesuffix(".yaml").removesuffix(".yml")
    candidates = [f"{normalized}.yaml", f"{normalized}.yml"]
    package = resources.files(BUILTIN_TEMPLATE_PACKAGE)
    for candidate in candidates:
        resource = package / candidate
        if resource.is_file():
            return resource
    raise TemplateNotFoundError(
        f"Built-in template '{template_name}' was not found. "
        f"Available templates: {', '.join(list_builtin_templates())}"
    )
