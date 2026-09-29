"""Export a built-in template to disk."""

from __future__ import annotations

import argparse
from pathlib import Path

from scrivfactory.core.template_parser import dump_builtin_template


def register(subparsers: argparse._SubParsersAction) -> None:
    parser = subparsers.add_parser(
        "init",
        help="Write a built-in template definition to disk",
    )
    parser.add_argument(
        "--template",
        default="fda_compliance",
        help="Built-in template name",
    )
    parser.add_argument(
        "--output",
        required=True,
        help="Output YAML or JSON file path",
    )
    parser.set_defaults(handler=handle)


def handle(args: argparse.Namespace) -> int:
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        dump_builtin_template(args.template),
        encoding="utf-8",
        newline="\n",
    )
    print(f"Wrote template '{args.template}' to {output_path}")
    return 0
