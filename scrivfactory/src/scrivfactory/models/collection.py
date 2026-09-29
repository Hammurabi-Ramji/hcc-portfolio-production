"""Collection model."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class CollectionDefinition:
    name: str
    type: str = "search"
    criteria: str | None = None
    description: str | None = None
    entries: list[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "CollectionDefinition":
        return cls(
            name=str(data["name"]),
            type=str(data.get("type", "search")),
            criteria=(None if data.get("criteria") is None else str(data.get("criteria"))),
            description=(None if data.get("description") is None else str(data.get("description"))),
            entries=[str(entry) for entry in data.get("entries", [])],
        )
