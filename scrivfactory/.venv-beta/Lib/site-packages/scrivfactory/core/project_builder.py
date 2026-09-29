"""Project assembly orchestration."""

from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from scrivfactory.core.rtf_generator import generate_rtf
from scrivfactory.core.template_parser import load_template_file
from scrivfactory.core.uuid_generator import assign_uuids, generate_uuid
from scrivfactory.core.variable_engine import VariableEngine
from scrivfactory.core.xml_builder import build_scrivx
from scrivfactory.exceptions import (
    ContentFileNotFoundError,
    RTFGenerationError,
    ValidationError,
)
from scrivfactory.models import (
    BinderItem,
    DocumentTemplateDefinition,
    TemplateDefinition,
)
from scrivfactory.utils.file_helpers import (
    ProjectPaths,
    prepare_project_paths,
    write_text,
)
from scrivfactory.utils.validators import (
    assert_valid_template,
    resolve_content_path,
    validate_rtf_content,
    validate_xml_content,
)


@dataclass(slots=True)
class BuildResult:
    project_dir: Path
    scrivx_file: Path
    documents_created: int
    folders_created: int
    generated_at: str

    @property
    def document_count(self) -> int:
        return self.documents_created

    @property
    def folder_count(self) -> int:
        return self.folders_created


class ProjectBuilder:
    def build(
        self,
        *,
        template: TemplateDefinition,
        output_path: Path,
        project_name: str | None = None,
        force: bool = False,
    ) -> BuildResult:
        return self.build_from_template(
            template=template,
            output_path=output_path,
            project_name=project_name,
            force=force,
        )

    def build_from_file(
        self,
        template_path: Path | str,
        *,
        output_path: Path | str,
        project_name: str | None = None,
        force: bool = False,
    ) -> BuildResult:
        template = load_template_file(template_path)
        return self.build_from_template(
            template=template,
            output_path=Path(output_path),
            project_name=project_name,
            force=force,
        )

    def build_from_template(
        self,
        *,
        template: TemplateDefinition,
        output_path: Path | str,
        project_name: str | None = None,
        force: bool = False,
    ) -> BuildResult:
        working_template = deepcopy(template)
        resolved_project_name = project_name or working_template.template_name

        assign_uuids(working_template.binder_structure)
        for document_template in working_template.document_templates:
            if document_template.uuid is None:
                document_template.uuid = generate_uuid()

        assert_valid_template(working_template)

        paths = prepare_project_paths(
            Path(output_path),
            resolved_project_name,
            force=force,
        )
        engine = VariableEngine(
            working_template.variables,
            working_template.placeholders,
            project_name=resolved_project_name,
        )
        template_lookup = {
            document_template.name: document_template
            for document_template in working_template.document_templates
        }

        documents_created = 0
        folders_created = 0
        for item in working_template.binder_structure:
            counts = self._write_binder_item(
                item,
                working_template,
                template_lookup,
                engine,
                paths,
            )
            documents_created += counts[0]
            folders_created += counts[1]

        for document_template in working_template.document_templates:
            self._write_document_template(
                document_template,
                working_template,
                engine,
                paths,
            )
            documents_created += 1

        self._write_support_files(paths, working_template)

        xml_text = build_scrivx(
            project_name=resolved_project_name,
            template=working_template,
            draft_uuid=generate_uuid(),
            research_uuid=generate_uuid(),
            trash_uuid=generate_uuid(),
        )
        xml_issues = validate_xml_content(xml_text)
        if xml_issues:
            raise ValidationError(
                "; ".join(xml_issues),
                suggestion="Inspect the generated XML and template structure.",
            )
        write_text(paths.scrivx_file, xml_text)

        return BuildResult(
            project_dir=paths.project_dir,
            scrivx_file=paths.scrivx_file,
            documents_created=documents_created,
            folders_created=folders_created,
            generated_at=datetime.now().isoformat(timespec="seconds"),
        )

    def _write_binder_item(
        self,
        item: BinderItem,
        template: TemplateDefinition,
        template_lookup: dict[str, DocumentTemplateDefinition],
        engine: VariableEngine,
        paths: ProjectPaths,
    ) -> tuple[int, int]:
        documents_created = 0
        folders_created = 0

        if item.is_folder:
            folders_created += 1
            for child in item.children:
                child_counts = self._write_binder_item(
                    child,
                    template,
                    template_lookup,
                    engine,
                    paths,
                )
                documents_created += child_counts[0]
                folders_created += child_counts[1]
            return documents_created, folders_created

        content = self._resolve_document_content(
            item,
            template,
            template_lookup,
        )
        rendered = engine.render_text(
            content,
            local_context={
                "title": item.title,
                **item.metadata,
            },
        )
        rtf_content = generate_rtf(
            rendered,
            font_name=template.project_settings.default_font,
            font_size=template.project_settings.default_font_size,
        )
        rtf_issues = validate_rtf_content(rtf_content)
        if rtf_issues:
            raise RTFGenerationError("; ".join(rtf_issues))

        write_text(paths.data_dir / item.uuid / "content.rtf", rtf_content)
        documents_created += 1
        return documents_created, folders_created

    def _write_document_template(
        self,
        document_template: DocumentTemplateDefinition,
        template: TemplateDefinition,
        engine: VariableEngine,
        paths: ProjectPaths,
    ) -> None:
        content = self._resolve_template_body(document_template, template)
        rendered = engine.render_text(
            content,
            local_context={
                "title": document_template.name,
                **document_template.metadata,
            },
        )
        rtf_content = generate_rtf(
            rendered,
            font_name=template.project_settings.default_font,
            font_size=template.project_settings.default_font_size,
        )
        rtf_issues = validate_rtf_content(rtf_content)
        if rtf_issues:
            raise RTFGenerationError("; ".join(rtf_issues))
        write_text(
            paths.data_dir / document_template.uuid / "content.rtf",
            rtf_content,
        )

    def _resolve_document_content(
        self,
        item: BinderItem,
        template: TemplateDefinition,
        template_lookup: dict[str, DocumentTemplateDefinition],
    ) -> str:
        if item.content is not None:
            return item.content
        if item.content_file is not None:
            content_path = resolve_content_path(template, item.content_file)
            if not content_path.exists():
                raise ContentFileNotFoundError(content_path)
            return content_path.read_text(encoding="utf-8")
        if item.template:
            template_definition = template_lookup[item.template]
            return self._resolve_template_body(template_definition, template)
        return ""

    def _resolve_template_body(
        self,
        document_template: DocumentTemplateDefinition,
        template: TemplateDefinition,
    ) -> str:
        if document_template.content is not None:
            return document_template.content
        if document_template.content_file is not None:
            content_path = resolve_content_path(
                template,
                document_template.content_file,
            )
            if not content_path.exists():
                raise ContentFileNotFoundError(content_path)
            return content_path.read_text(encoding="utf-8")
        return ""

    def _write_support_files(
        self,
        paths: ProjectPaths,
        template: TemplateDefinition,
    ) -> None:
        write_text(paths.files_dir / "version.txt", "3.0\n")
        write_text(paths.files_dir / "styles.xml", self._styles_xml(template))
        write_text(paths.files_dir / "docs.checksum", "")
        write_text(
            paths.files_dir / "writing.history",
            '<?xml version="1.0" encoding="UTF-8"?>\n<WritingHistory />\n',
        )
        write_text(paths.files_dir / "binder.autosave", "")
        write_text(paths.files_dir / "binder.backup", "")
        write_text(
            paths.files_dir / "search.indexes",
            '<?xml version="1.0" encoding="UTF-8"?>\n<SearchIndexes />\n',
        )
        write_text(
            paths.settings_dir / "ui-common.xml",
            self._ui_common_xml(template),
        )
        write_text(paths.settings_dir / "recents.txt", "")

    @staticmethod
    def _styles_xml(template: TemplateDefinition) -> str:
        return (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            "<Styles>\n"
            f'  <Style Name="Body" '
            f'Font="{template.project_settings.default_font}" '
            f'FontSize="{template.project_settings.default_font_size}" />\n'
            "</Styles>\n"
        )

    @staticmethod
    def _ui_common_xml(template: TemplateDefinition) -> str:
        return (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            "<UICommon>\n"
            f"  <DefaultFont>{template.project_settings.default_font}"
            "</DefaultFont>\n"
            "  <DefaultFontSize>"
            f"{template.project_settings.default_font_size}"
            "</DefaultFontSize>\n"
            f"  <PaperSize>{template.project_settings.paper_size}"
            "</PaperSize>\n"
            "</UICommon>\n"
        )
