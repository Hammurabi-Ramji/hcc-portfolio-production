"""Validate a template file."""

from __future__ import annotations

import argparse
from pathlib import Path

from scrivfactory.core.template_parser import load_template_file
from scrivfactory.utils.validators import validate_template_definition


def register(subparsers: argparse._SubParsersAction) -> None:
    parser = subparsers.add_parser("validate", help="Validate a template file")
    parser.add_argument("template_path", help="Template file path")
    parser.set_defaults(handler=handle)


def handle(args: argparse.Namespace) -> int:
    template = load_template_file(Path(args.template_path))
    issues = validate_template_definition(template)
    if issues:
        for issue in issues:
            print(f"- {issue}")
        return 1
    print("Template is valid.")
    return 0
