from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from scrivfactory.cli.main import main


class CLITests(unittest.TestCase):
    def test_templates_command_returns_success(self) -> None:
        buffer = StringIO()
        with redirect_stdout(buffer):
            exit_code = main(["templates"])
        self.assertEqual(exit_code, 0)
        self.assertIn("fda_compliance", buffer.getvalue())

    def test_create_command_builds_blank_project(self) -> None:
        with TemporaryDirectory() as temp_dir:
            exit_code = main(
                [
                    "create",
                    "blank",
                    "--name",
                    "CLI Demo",
                    "--output",
                    str(Path(temp_dir)),
                    "--force",
                ]
            )
            self.assertEqual(exit_code, 0)
            self.assertTrue((Path(temp_dir) / "CLI_Demo.scriv").exists())


if __name__ == "__main__":
    unittest.main()
