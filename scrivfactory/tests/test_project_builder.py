from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from xml.etree import ElementTree as ET

from scrivfactory.core.project_builder import ProjectBuilder
from scrivfactory.core.template_parser import load_builtin_template


class ProjectBuilderTests(unittest.TestCase):
    def test_builds_blank_project(self) -> None:
        builder = ProjectBuilder()
        template = load_builtin_template("blank")

        with TemporaryDirectory() as temp_dir:
            output_path = Path(temp_dir) / "Demo.scriv"
            result = builder.build_from_template(
                template=template,
                output_path=output_path,
                project_name="Demo",
                force=True,
            )

            self.assertTrue(result.project_dir.exists())
            self.assertTrue(result.scrivx_file.exists())
            self.assertTrue((output_path / "Files" / "version.txt").exists())
            self.assertTrue(
                (output_path / "Settings" / "ui-common.xml").exists()
            )
            self.assertTrue((output_path / "Files" / "Data").exists())

    def test_builds_fda_project_with_expected_binder_titles(self) -> None:
        builder = ProjectBuilder()
        template = load_builtin_template("fda_compliance")

        with TemporaryDirectory() as temp_dir:
            output_path = Path(temp_dir) / "FDA.scriv"
            result = builder.build_from_template(
                template=template,
                output_path=output_path,
                project_name="FDA Compliance Dossier",
                force=True,
            )

            xml_root = ET.fromstring(
                result.scrivx_file.read_text(encoding="utf-8")
            )
            titles = [
                node.text
                for node in xml_root.findall(".//Title")
                if node.text
            ]

            self.assertIn("01 - Cover & Executive Documents", titles)
            self.assertIn("12 - Appendices & References", titles)
            self.assertGreater(result.document_count, 10)


if __name__ == "__main__":
    unittest.main()
