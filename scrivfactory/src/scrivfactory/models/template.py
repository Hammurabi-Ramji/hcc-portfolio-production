"""Template definition models."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from scrivfactory.models.binder_item import BinderItem
from scrivfactory.models.collection import CollectionDefinition
from scrivfactory.models.metadata_field import MetadataField


@dataclass(slots=True)
class ProjectSettings:
    default_font: str = "Calibri"
    default_font_size: int = 11
    paper_size: str = "Letter"

    @classmethod
    def from_dict(cls, data: dict[str, Any] | None) -> "ProjectSettings":
        payload = data or {}
        return cls(
            default_font=str(payload.get("default_font", "Calibri")),
            default_font_size=int(payload.get("default_font_size", 11)),
            paper_size=str(payload.get("paper_size", "Letter")),
        )


@dataclass(slots=True)
class DocumentTemplateDefinition:
    name: str
    description: str = ""
    content: str | None = None
    content_file: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
    uuid: str | None = None

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "DocumentTemplateDefinition":
        return cls(
            name=str(data["name"]),
            description=str(data.get("description", "")),
            content=(
                None if data.get("content") is None
                else str(data.get("content"))
            ),
            content_file=(
                None if data.get("content_file") is None
                else str(data.get("content_file"))
            ),
            metadata={
                str(key): value
                for key, value in dict(data.get("metadata", {})).items()
            },
        )


@dataclass(slots=True)
class TemplateDefinition:
    template_name: str
    template_version: str
    author: str
    description: str = ""
    scrivener_version: str = "3.1.1"
    project_settings: ProjectSettings = field(default_factory=ProjectSettings)
    metadata_fields: list[MetadataField] = field(default_factory=list)
    collections: list[CollectionDefinition] = field(default_factory=list)
    binder_structure: list[BinderItem] = field(default_factory=list)
    document_templates: list[DocumentTemplateDefinition] = field(default_factory=list)
    variables: dict[str, Any] = field(default_factory=dict)
    placeholders: dict[str, str] = field(default_factory=dict)
    source_path: Path | None = None

    @classmethod
    def from_dict(
        cls,
        data: dict[str, Any],
        *,
        source_path: Path | None = None,
    ) -> "TemplateDefinition":
        return cls(
            template_name=str(data["template_name"]),
            template_version=str(data["template_version"]),
            author=str(data["author"]),
            description=str(data.get("description", "")),
            scrivener_version=str(data.get("scrivener_version", "3.1.1")),
            project_settings=ProjectSettings.from_dict(
                data.get("project_settings")
            ),
            metadata_fields=[
                MetadataField.from_dict(item)
                for item in data.get("metadata_fields", [])
            ],
            collections=[
                CollectionDefinition.from_dict(item)
                for item in data.get("collections", [])
            ],
            binder_structure=[
                BinderItem.from_dict(item)
                for item in data.get("binder_structure", [])
            ],
            document_templates=[
                DocumentTemplateDefinition.from_dict(item)
                for item in data.get("document_templates", [])
            ],
            variables=dict(data.get("variables", {})),
            placeholders={
                str(key): str(value)
                for key, value in dict(data.get("placeholders", {})).items()
            },
            source_path=source_path,
        )
