"""RTF generation."""

from __future__ import annotations

import re

from scrivfactory.exceptions import RTFGenerationError
from scrivfactory.utils.rtf_escape import escape_rtf

INLINE_MARKUP_PATTERN = re.compile(r"(\*\*.+?\*\*|\*.+?\*)")
ORDERED_LIST_PATTERN = re.compile(r"^\s*(\d+)\.\s+(.*)$")
UNORDERED_LIST_PATTERN = re.compile(r"^\s*[-*]\s+(.*)$")
HEADING_PATTERN = re.compile(r"^(#{1,6})\s+(.*)$")


def generate_rtf(
    text: str,
    *,
    font_name: str = "Calibri",
    font_size: int = 11,
) -> str:
    try:
        base_half_points = font_size * 2
        body_lines: list[str] = []

        for raw_line in text.splitlines():
            if not raw_line.strip():
                body_lines.append(r"\par")
                continue

            heading_match = HEADING_PATTERN.match(raw_line)
            if heading_match:
                level = len(heading_match.group(1))
                title = _render_inline_markup(heading_match.group(2).strip())
                heading_size = (
                    max(
                        base_half_points + ((4 - min(level, 3)) * 4),
                        base_half_points
                    )
                )
                heading_fmt = (
                    rf"\pard\sa240\sl276\slmult1\b\f0\fs{heading_size}"
                    rf"\lang1033 {title}\b0\fs{base_half_points}\par"
                )
                body_lines.append(heading_fmt)
                continue

            unordered_match = UNORDERED_LIST_PATTERN.match(raw_line)
            if unordered_match:
                item = _render_inline_markup(unordered_match.group(1).strip())
                unordered_fmt = (
                    rf"\pard\li720\tx720\sa120\sl276\slmult1\f0"
                    rf"\fs{base_half_points}•\tab {item}\par"
                )
                body_lines.append(unordered_fmt)
                continue

            ordered_match = ORDERED_LIST_PATTERN.match(raw_line)
            if ordered_match:
                number = ordered_match.group(1)
                item = _render_inline_markup(ordered_match.group(2).strip())
                ordered_fmt = (
                    rf"\pard\li720\tx720\sa120\sl276\slmult1\f0"
                    rf"\fs{base_half_points}{number}.\tab {item}\par"
                )
                body_lines.append(ordered_fmt)
                continue

            paragraph = _render_inline_markup(raw_line.rstrip())
            paragraph_fmt = (
                rf"\pard\sa200\sl276\slmult1\f0\fs{base_half_points}"
                rf"\lang1033 {paragraph}\par"
            )
            body_lines.append(paragraph_fmt)

        return (
            "{\\rtf1\\ansi\\ansicpg1252\\deff0\\nouicompat\\deflang1033\n"
            f"{{\\fonttbl{{\\f0\\fnil\\fcharset0 {escape_rtf(font_name)};}}}}\n"
            "{\\*\\generator scrivfactory;}\n"
            "\\viewkind4\\uc1\n"
            + "\n".join(body_lines)
            + "\n}"
        )
    except Exception as exc:  # pragma: no cover - defensive wrapper
        raise RTFGenerationError(f"Failed to generate RTF: {exc}") from exc


def _render_inline_markup(text: str) -> str:
    parts: list[str] = []
    cursor = 0
    for match in INLINE_MARKUP_PATTERN.finditer(text):
        parts.append(escape_rtf(text[cursor:match.start()]))
        token = match.group(0)
        if token.startswith("**") and token.endswith("**"):
            parts.append(rf"\b {escape_rtf(token[2:-2])}\b0")
        else:
            parts.append(rf"\i {escape_rtf(token[1:-1])}\i0")
        cursor = match.end()
    parts.append(escape_rtf(text[cursor:]))
    return "".join(parts)
