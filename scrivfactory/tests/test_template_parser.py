import unittest

from scrivfactory.core.template_parser import load_builtin_template, list_builtin_templates


class TemplateParserTests(unittest.TestCase):
    def test_lists_builtin_templates(self) -> None:
        templates = list_builtin_templates()
        self.assertIn("fda_compliance", templates)
        self.assertIn("blank", templates)

    def test_loads_fda_template_with_expected_shape(self) -> None:
        template = load_builtin_template("fda_compliance")
        self.assertEqual(template.template_name, "FDA Compliance Dossier")
        self.assertEqual(len(template.binder_structure), 12)
        self.assertEqual(len(template.metadata_fields), 6)
        self.assertEqual(len(template.collections), 4)
        self.assertEqual(len(template.document_templates), 3)


if __name__ == "__main__":
    unittest.main()
