"""Custom exceptions for scrivfactory."""

from __future__ import annotations

from pathlib import Path


class ScrivFactoryError(Exception):
    """Base error for scrivfactory."""


class TemplateNotFoundError(ScrivFactoryError):
    """Raised when a referenced template cannot be found."""


class ValidationError(ScrivFactoryError):
    """Raised when template validation fails."""

    def __init__(
        self,
        message: str,
        *,
        line_number: int | None = None,
        suggestion: str | None = None,
        issues: list[str] | None = None,
    ) -> None:
        details: list[str] = [message]
        if line_number is not None:
            details.append(f"line {line_number}")
        if suggestion:
            details.append(f"suggestion: {suggestion}")
        super().__init__(" | ".join(details))
        self.line_number = line_number
        self.suggestion = suggestion
        self.issues = issues or []


class ContentFileNotFoundError(ScrivFactoryError):
    """Raised when a `content_file` reference does not exist."""

    def __init__(self, path: Path) -> None:
        super().__init__(f"Content file not found: {path}")
        self.path = path


class RTFGenerationError(ScrivFactoryError):
    """Raised when RTF content cannot be generated."""
