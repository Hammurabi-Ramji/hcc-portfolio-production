"""RTF escaping helpers."""

from __future__ import annotations


def escape_rtf(text: str) -> str:
    pieces: list[str] = []
    for char in text:
        codepoint = ord(char)
        if char == "\\":
            pieces.append(r"\\")
        elif char == "{":
            pieces.append(r"\{")
        elif char == "}":
            pieces.append(r"\}")
        elif char == "\t":
            pieces.append(r"\tab ")
        elif char == "\n":
            pieces.append("\n")
        elif codepoint > 127:
            signed_codepoint = codepoint if codepoint <= 32767 else codepoint - 65536
            pieces.append(f"\\u{signed_codepoint}?")
        else:
            pieces.append(char)
    return "".join(pieces)
