"""Build a project from a template file."""

from __future__ import annotations

import argparse
from pathlib import Path

from scrivfactory.core.project_builder import ProjectBuilder


def register(subparsers: argparse._SubParsersAction) -> None:
    parser = subparsers.add_parser(
        "build",
        help="Build a Scrivener project from a JSON/YAML template file",
    )
    parser.add_argument("template_path", help="Template file path")
    parser.add_argument(
        "--output",
        required=True,
        help="Output directory or final .scriv path",
    )
    parser.add_argument(
        "--name",
        help="Override the generated project name",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite an existing output project",
    )
    parser.set_defaults(handler=handle)


def handle(args: argparse.Namespace) -> int:
    builder = ProjectBuilder()
    result = builder.build_from_file(
        template_path=Path(args.template_path),
        output_path=Path(args.output),
        project_name=args.name,
        force=args.force,
    )
    print(f"Built project at {result.project_dir}")
    print(
        f"Documents: {result.document_count} | Folders: {result.folder_count}"
    )
    return 0
