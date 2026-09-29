"""Interactive project creation."""

from __future__ import annotations

import argparse
from pathlib import Path

from scrivfactory.core.project_builder import ProjectBuilder
from scrivfactory.core.template_parser import list_builtin_templates, load_builtin_template


def register(subparsers: argparse._SubParsersAction) -> None:
    parser = subparsers.add_parser(
        "interactive",
        help="Create a project using interactive prompts",
    )
    parser.set_defaults(handler=handle)


def handle(args: argparse.Namespace) -> int:
    available = list_builtin_templates()
    print("Available templates:")
    for template_name in available:
        print(f"- {template_name}")

    selected = input("Template name [fda_compliance]: ").strip() or "fda_compliance"
    if selected not in available:
        print(f"Unknown template '{selected}'.")
        return 1

    project_name = input("Project name: ").strip()
    if not project_name:
        print("Project name is required.")
        return 1

    output_dir = input("Output directory [./output]: ").strip() or "./output"
    overwrite = input("Overwrite if it exists? [y/N]: ").strip().lower() == "y"

    template = load_builtin_template(selected)
    builder = ProjectBuilder()
    result = builder.build_from_template(
        template=template,
        output_path=Path(output_dir),
        project_name=project_name,
        force=overwrite,
    )
    print(f"Created project at {result.project_dir}")
    return 0
