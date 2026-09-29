"""Create a project directly from a built-in template."""

from __future__ import annotations

import argparse
from pathlib import Path

from scrivfactory.core.project_builder import ProjectBuilder
from scrivfactory.core.template_parser import load_builtin_template


def register(subparsers: argparse._SubParsersAction) -> None:
    parser = subparsers.add_parser(
        "create",
        help="Create a project directly from a built-in template",
    )
    parser.add_argument("template_name", help="Built-in template name")
    parser.add_argument(
        "--name",
        required=True,
        help="New project name",
    )
    parser.add_argument(
        "--output",
        required=True,
        help="Parent output directory or explicit .scriv path",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite an existing output project",
    )
    parser.set_defaults(handler=handle)


def handle(args: argparse.Namespace) -> int:
    template = load_builtin_template(args.template_name)
    builder = ProjectBuilder()
    result = builder.build_from_template(
        template=template,
        output_path=Path(args.output),
        project_name=args.name,
        force=args.force,
    )
    print(f"Created project at {result.project_dir}")
    return 0
