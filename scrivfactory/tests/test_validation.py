import unittest

from scrivfactory.models import TemplateDefinition
from scrivfactory.utils.validators import validate_template_definition


class ValidationTests(unittest.TestCase):
    def test_detects_unknown_template_reference(self) -> None:
        template = TemplateDefinition.from_dict(
            {
                "template_name": "Broken",
                "template_version": "1.0.0",
                "author": "Test",
                "binder_structure": [
                    {
                        "title": "Doc",
                        "type": "document",
                        "template": "Missing Template",
                    }
                ],
            }
        )
        issues = validate_template_definition(template)
        self.assertTrue(any("unknown template" in issue for issue in issues))


if __name__ == "__main__":
    unittest.main()
