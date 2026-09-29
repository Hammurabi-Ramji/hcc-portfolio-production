import unittest

from scrivfactory.core.rtf_generator import generate_rtf


class RTFGeneratorTests(unittest.TestCase):
    def test_generates_rtf_with_basic_markup(self) -> None:
        rtf = generate_rtf("# Title\n\n**Bold** and *italic* with {braces}")
        self.assertTrue(rtf.startswith(r"{\rtf1"))
        self.assertIn(r"\fonttbl", rtf)
        self.assertIn(r"\b ", rtf)
        self.assertIn(r"\i ", rtf)
        self.assertIn(r"\{braces\}", rtf)


if __name__ == "__main__":
    unittest.main()
