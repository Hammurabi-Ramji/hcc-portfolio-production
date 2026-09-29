"""List built-in templates."""

from __future__ import annotations

import argparse

from scrivfactory.core.template_parser import list_builtin_templates


def register(subparsers: argparse._SubParsersAction) -> None:
    parser = subparsers.add_parser("templates", help="List built-in templates")
    parser.set_defaults(handler=handle)


def handle(args: argparse.Namespace) -> int:
    for template_name in list_builtin_templates():
        print(template_name)
    return 0
