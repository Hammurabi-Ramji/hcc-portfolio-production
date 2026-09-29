import unittest

from scrivfactory.core.variable_engine import VariableEngine
from scrivfactory.models import TemplateDefinition


class VariableEngineTests(unittest.TestCase):
    def setUp(self) -> None:
        self.template = TemplateDefinition.from_dict(
            {
                "template_name": "Demo",
                "template_version": "1.0.0",
                "author": "Test",
                "variables": {"company_name": "Acme Pharma"},
                "placeholders": {"DOCNUM": "auto_increment:0001"},
            }
        )

    def test_renders_variables_and_date_builtins(self) -> None:
        engine = VariableEngine(self.template, project_name="Demo Project")
        rendered = engine.render_text(
            "{{company_name}} | {{project_name}} | {{year}}"
        )
        self.assertIn("Acme Pharma", rendered)
        self.assertIn("Demo Project", rendered)
        self.assertIn(str(engine.now.year), rendered)

    def test_auto_increment_placeholder_is_document_scoped(self) -> None:
        engine = VariableEngine(self.template, project_name="Demo Project")
        first = engine.render_text("SOP-[DOCNUM] / [DOCNUM]")
        second = engine.render_text("SOP-[DOCNUM]")
        self.assertEqual(first, "SOP-0001 / 0001")
        self.assertEqual(second, "SOP-0002")

    def test_renders_if_and_each_blocks(self) -> None:
        engine = VariableEngine(self.template, project_name="Demo Project")
        rendered = engine.render_text(
            (
                "{{#if enabled}}Enabled{{/if}}\n"
                "{{#each items}}- {{name}}\n{{/each}}"
            ),
            local_context={
                "enabled": True,
                "items": [{"name": "One"}, {"name": "Two"}],
            },
        )
        self.assertIn("Enabled", rendered)
        self.assertIn("- One", rendered)
        self.assertIn("- Two", rendered)


if __name__ == "__main__":
    unittest.main()
