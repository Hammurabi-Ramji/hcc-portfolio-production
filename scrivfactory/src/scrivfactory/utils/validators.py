"""Validation helpers for scrivfactory."""

from __future__ import annotations

from pathlib import Path
import xml.etree.ElementTree as ET

from scrivfactory.exceptions import ValidationError
from scrivfactory.models import TemplateDefinition

VALID_BINDER_TYPES = {"folder", "document"}
VALID_METADATA_TYPES = {"text", "date", "list"}
VALID_COLLECTION_TYPES = {"search", "manual"}


def validate_template_definition(template: TemplateDefinition) -> list[str]:
    issues: list[str] = []

    if not template.template_name.strip():
        issues.append("template_name is required")
    if not template.template_version.strip():
        issues.append("template_version is required")
    if not template.author.strip():
        issues.append("author is required")

    template_names = [item.name for item in template.document_templates]
    if len(template_names) != len(set(template_names)):
        issues.append("document_templates contain duplicate names")

    for field in template.metadata_fields:
        if field.type not in VALID_METADATA_TYPES:
            issues.append(
                (
                    f"metadata field '{field.name}' "
                    f"has invalid type '{field.type}'"
                )
            )
        if field.type == "list" and not field.options:
            issues.append(
                (
                    f"metadata field '{field.name}' "
                    "of type 'list' requires options"
                )
            )

    for collection in template.collections:
        if collection.type not in VALID_COLLECTION_TYPES:
            issues.append(
                (
                    f"collection '{collection.name}' "
                    f"has invalid type '{collection.type}'"
                )
            )

    for item in template.binder_structure:
        issues.extend(_validate_binder_item(template, item))

    return issues


def assert_valid_template(template: TemplateDefinition) -> None:
    issues = validate_template_definition(template)
    if issues:
        raise ValidationError(
            "Template validation failed",
            suggestion="Run `scrivfactory validate <template>`",
            issues=issues,
        )


def validate_xml_content(xml_text: str) -> list[str]:
    try:
        ET.fromstring(xml_text)
        return []
    except ET.ParseError as exc:
        return [f"XML is not well-formed: {exc}"]


def validate_rtf_content(rtf_text: str) -> list[str]:
    issues: list[str] = []
    if not rtf_text.startswith(r"{\rtf1"):
        issues.append("RTF output must start with '{\\rtf1'")
    if rtf_text.count("{") != rtf_text.count("}"):
        issues.append("RTF brace count is unbalanced")
    if "\\fonttbl" not in rtf_text:
        issues.append("RTF output is missing a font table")
    return issues


def _validate_binder_item(template: TemplateDefinition, item) -> list[str]:
    issues: list[str] = []

    if item.type not in VALID_BINDER_TYPES:
        issues.append(
            f"binder item '{item.title}' has invalid type '{item.type}'"
        )

    if item.content_file:
        content_path = resolve_content_path(template, item.content_file)
        if not content_path.exists():
            issues.append(
                (
                    f"binder item '{item.title}' content_file "
                    f"does not exist: {content_path}"
                )
            )

    if item.template:
        names = {entry.name for entry in template.document_templates}
        if item.template not in names:
            issues.append(
                (
                    f"binder item '{item.title}' references "
                    f"unknown template '{item.template}'"
                )
            )

    for child in item.children:
        issues.extend(_validate_binder_item(template, child))

    return issues


def resolve_content_path(
    template: TemplateDefinition,
    content_file: str,
) -> Path:
    file_path = Path(content_file)
    if file_path.is_absolute():
        return file_path
    base_path = (
        template.source_path.parent if template.source_path else Path.cwd()
    )
    return base_path / file_path
