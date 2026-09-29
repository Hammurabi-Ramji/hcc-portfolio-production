"""Filesystem helpers for scrivfactory."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import re
import shutil


@dataclass(slots=True)
class ProjectPaths:
    project_dir: Path
    scrivx_file: Path
    files_dir: Path
    data_dir: Path
    settings_dir: Path
    backups_dir: Path


def safe_project_name(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "_", value.strip())
    return cleaned.strip("._") or "Scrivener_Project"


def resolve_project_dir(output_path: Path, project_name: str) -> Path:
    if output_path.suffix.lower() == ".scriv":
        return output_path
    return output_path / f"{safe_project_name(project_name)}.scriv"


def prepare_project_paths(
    output_path: Path,
    project_name: str,
    *,
    force: bool = False,
) -> ProjectPaths:
    project_dir = resolve_project_dir(output_path, project_name)

    if project_dir.exists():
        if not force:
            raise FileExistsError(
                (
                    f"Output already exists: {project_dir}. "
                    "Use --force to overwrite."
                )
            )
        shutil.rmtree(project_dir)

    files_dir = project_dir / "Files"
    data_dir = files_dir / "Data"
    settings_dir = project_dir / "Settings"
    backups_dir = project_dir / "Backups"

    for directory in (
        project_dir,
        files_dir,
        data_dir,
        settings_dir,
        backups_dir,
    ):
        directory.mkdir(parents=True, exist_ok=True)

    scrivx_name = f"{project_dir.stem}.scrivx"
    return ProjectPaths(
        project_dir=project_dir,
        scrivx_file=project_dir / scrivx_name,
        files_dir=files_dir,
        data_dir=data_dir,
        settings_dir=settings_dir,
        backups_dir=backups_dir,
    )


def write_text(path: Path, content: str, *, encoding: str = "utf-8") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding=encoding, newline="\n")
