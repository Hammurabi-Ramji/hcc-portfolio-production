"""CLI bootstrap."""

from __future__ import annotations

import argparse
import sys

from scrivfactory.cli.commands import build, create, init, interactive, templates, validate
from scrivfactory.exceptions import ScrivFactoryError, ValidationError


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="scrivfactory",
        description="Generate Scrivener 3 projects from JSON/YAML templates.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    templates.register(subparsers)
    init.register(subparsers)
    validate.register(subparsers)
    build.register(subparsers)
    create.register(subparsers)
    interactive.register(subparsers)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    try:
        return int(args.handler(args) or 0)
    except ValidationError as exc:
        print(f"Validation error: {exc}", file=sys.stderr)
        return 2
    except (ScrivFactoryError, FileExistsError, OSError, ValueError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
