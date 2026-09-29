"""Binder item model."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Iterator


@dataclass(slots=True)
class BinderItem:
    title: str
    type: str
    id: str | None = None
    content: str | None = None
    content_file: str | None = None
    template: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
    children: list["BinderItem"] = field(default_factory=list)
    uuid: str | None = None

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "BinderItem":
        return cls(
            id=(None if data.get("id") is None else str(data.get("id"))),
            title=str(data["title"]),
            type=str(data.get("type", "document")),
            content=(
                None if data.get("content") is None
                else str(data.get("content"))
            ),
            content_file=(
                None if data.get("content_file") is None
                else str(data.get("content_file"))
            ),
            template=(
                None if data.get("template") is None
                else str(data.get("template"))
            ),
            metadata={
                str(key): value
                for key, value in dict(data.get("metadata", {})).items()
            },
            children=[
                cls.from_dict(child) for child in data.get("children", [])
            ],
        )

    def walk(self) -> Iterator["BinderItem"]:
        yield self
        for child in self.children:
            yield from child.walk()

    @property
    def is_folder(self) -> bool:
        return self.type == "folder"

    @property
    def is_document(self) -> bool:
        return self.type == "document"
