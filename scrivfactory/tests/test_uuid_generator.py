import re
import unittest

from scrivfactory.core.uuid_generator import generate_uuid


class UUIDGeneratorTests(unittest.TestCase):
    def test_generate_uuid_is_uppercase_and_unique(self) -> None:
        values = {generate_uuid() for _ in range(50)}
        self.assertEqual(len(values), 50)
        for value in values:
            self.assertRegex(
                value,
                re.compile(
                    r"^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$"
                ),
            )
            self.assertEqual(value, value.upper())


if __name__ == "__main__":
    unittest.main()
