"""UUID helpers."""

from __future__ import annotations

import uuid
from typing import Iterable


def generate_uuid() -> str:
    return str(uuid.uuid4()).upper()


def assign_uuids(items: Iterable) -> None:
    for item in items:
        if getattr(item, "uuid", None) is None:
            item.uuid = generate_uuid()
        children = getattr(item, "children", [])
        if children:
            assign_uuids(children)
