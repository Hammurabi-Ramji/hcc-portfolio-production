"""scrivfactory package."""

from scrivfactory.core.project_builder import BuildResult, ProjectBuilder
from scrivfactory.core.template_parser import (
    dump_builtin_template,
    list_builtin_templates,
    load_builtin_template,
    load_template_file,
)

__all__ = [
    "BuildResult",
    "ProjectBuilder",
    "dump_builtin_template",
    "list_builtin_templates",
    "load_builtin_template",
    "load_template_file",
]

__version__ = "0.1.0"
