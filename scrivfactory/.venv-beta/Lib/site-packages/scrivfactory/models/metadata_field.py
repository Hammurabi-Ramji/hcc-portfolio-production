"""Metadata field model."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class MetadataField:
    name: str
    type: str = "text"
    default: Any = ""
    options: list[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "MetadataField":
        return cls(
            name=str(data["name"]),
            type=str(data.get("type", "text")),
            default=data.get("default", ""),
            options=[str(option) for option in data.get("options", [])],
        )
