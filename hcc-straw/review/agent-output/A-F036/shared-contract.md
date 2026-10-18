# A-F036 node data and skip contract

Preserves A-F035 NodeSchema input_specs/output_types/validated_config and the existing serialized schema fields. Conditional selected output preserves its condition value; inactive output is NodeValue::Skipped. DAG records all skipped downstream outputs without execution. Existing join_text has one list input; it propagates skip and is not a multi-branch merge.

CSV accepts comma, semicolon or tab only; empty and multibyte delimiters return errors. Headerless records use one-based column_1, column_2, ... keys and retain the first row. Headered records retain header keys.

Template vars is optional Text containing a JSON object whose values are strings, such as {"name":"Ada"}. Missing vars means an empty map; unknown placeholders remain literal. Substitution scans the original template once, so replacement strings never recursively expand.

Read File latin1 maps each byte to its same-number Unicode code point (ISO-8859-1, not Windows-1252). UTF-8 remains strict. Join defaults to newline. LLM schema/default execution use llama3.2 and the advertised helpful-assistant system prompt. Explicit empty supplied values remain supplied and undergo schema validation.

Writer requires Text before any filesystem operation. Filter and join reject every non-text list member with its index. Existing transform Number/TextList metadata and DAG whole-graph preflight remain authoritative. Actual UI acceptance is F051/W4; whole-tree release hold remains.
