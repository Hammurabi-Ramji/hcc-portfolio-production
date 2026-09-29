"""Variable and placeholder rendering."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from datetime import datetime
import re
from typing import Any

from scrivfactory.models import TemplateDefinition

EACH_PATTERN = re.compile(
    r"{{#each\s+([\w.-]+)}}(.*?){{/each}}",
    re.DOTALL,
)
IF_PATTERN = re.compile(r"{{#if\s+(.+?)}}(.*?){{/if}}", re.DOTALL)
VARIABLE_PATTERN = re.compile(r"{{\s*([\w.-]+)\s*}}")
PLACEHOLDER_PATTERN = re.compile(r"\[(\w+)(?::(\d+))?\]")


class VariableEngine:
    def __init__(
        self,
        variables: TemplateDefinition | Mapping[str, Any] | None = None,
        placeholders: Mapping[str, str] | None = None,
        *,
        project_name: str,
        now: datetime | None = None,
    ) -> None:
        if isinstance(variables, TemplateDefinition):
            template = variables
            variable_values: Mapping[str, Any] | None = template.variables
            if placeholders is None:
                placeholders = template.placeholders
        else:
            variable_values = variables

        self.variables = dict(variable_values or {})
        self.placeholders = {
            str(key): str(value)
            for key, value in dict(placeholders or {}).items()
        }
        self.project_name = project_name
        self.now = now or datetime.now()
        self._counter_state: dict[str, int] = {}

    def render_text(
        self,
        text: str | None,
        *,
        local_context: Mapping[str, Any] | None = None,
    ) -> str:
        if text is None:
            return ""
        context = self.base_context()
        if local_context:
            context.update(dict(local_context))
        document_cache: dict[str, Any] = {}
        return self._render_fragment(str(text), context, document_cache)

    def base_context(self) -> dict[str, Any]:
        return {
            **self.variables,
            "date": self.now.strftime("%Y-%m-%d"),
            "year": self.now.strftime("%Y"),
            "fulldate": self.now.strftime("%B %d, %Y"),
            "datetime": self.now.isoformat(timespec="seconds"),
            "project_name": self.project_name,
            "page_number": "1",
        }

    def _render_fragment(
        self,
        text: str,
        context: dict[str, Any],
        document_cache: dict[str, Any],
    ) -> str:
        rendered = self._render_each_blocks(text, context, document_cache)
        rendered = self._render_if_blocks(rendered, context, document_cache)
        rendered = self._render_placeholders(rendered, context, document_cache)
        rendered = self._render_variables(rendered, context)
        return rendered

    def _render_each_blocks(
        self,
        text: str,
        context: dict[str, Any],
        document_cache: dict[str, Any],
    ) -> str:
        def replace(match: re.Match[str]) -> str:
            items = self._resolve_value(match.group(1), context)
            if items is None:
                return ""
            if isinstance(items, Mapping):
                iterable = list(items.values())
            elif isinstance(items, Sequence) and not isinstance(
                items,
                (str, bytes, bytearray),
            ):
                iterable = list(items)
            else:
                return ""

            rendered_items: list[str] = []
            for item in iterable:
                item_context = dict(context)
                if isinstance(item, Mapping):
                    item_context.update(item)
                item_context["this"] = item
                rendered_items.append(
                    self._render_fragment(
                        match.group(2),
                        item_context,
                        document_cache,
                    )
                )
            return "".join(rendered_items)

        return EACH_PATTERN.sub(replace, text)

    def _render_if_blocks(
        self,
        text: str,
        context: dict[str, Any],
        document_cache: dict[str, Any],
    ) -> str:
        def replace(match: re.Match[str]) -> str:
            condition = match.group(1).strip()
            if self._evaluate_condition(condition, context):
                return self._render_fragment(
                    match.group(2),
                    context,
                    document_cache,
                )
            return ""

        return IF_PATTERN.sub(replace, text)

    def _render_placeholders(
        self,
        text: str,
        context: dict[str, Any],
        document_cache: dict[str, Any],
    ) -> str:
        def replace(match: re.Match[str]) -> str:
            name = match.group(1)
            inline_format = match.group(2)
            configured = self.placeholders.get(name)

            if configured and configured.startswith("auto_increment:"):
                start_spec = configured.split(":", 1)[1]
                return self._next_counter(
                    name,
                    start_spec,
                    inline_format,
                    document_cache,
                )

            if not configured and inline_format is not None:
                return self._next_counter(
                    name,
                    inline_format,
                    inline_format,
                    document_cache,
                )

            if configured is not None:
                return self._render_variables(configured, context)

            if name in context:
                return str(context[name])

            return match.group(0)

        return PLACEHOLDER_PATTERN.sub(replace, text)

    def _render_variables(self, text: str, context: dict[str, Any]) -> str:
        def replace(match: re.Match[str]) -> str:
            value = self._resolve_value(match.group(1), context)
            if value is None:
                return match.group(0)
            return str(value)

        return VARIABLE_PATTERN.sub(replace, text)

    def _resolve_value(self, path: str, context: Mapping[str, Any]) -> Any:
        current: Any = context
        for part in path.split("."):
            if isinstance(current, Mapping):
                current = current.get(part)
            elif isinstance(current, Sequence) and not isinstance(
                current,
                (str, bytes, bytearray),
            ):
                if not part.isdigit():
                    return None
                index = int(part)
                if index >= len(current):
                    return None
                current = current[index]
            else:
                current = getattr(current, part, None)
            if current is None:
                return None
        return current

    def _evaluate_condition(
        self,
        expression: str,
        context: Mapping[str, Any],
    ) -> bool:
        if "==" in expression:
            left, right = (part.strip() for part in expression.split("==", 1))
            return (
                str(self._resolve_value(left, context))
                == self._strip_quotes(right)
            )
        if "!=" in expression:
            left, right = (part.strip() for part in expression.split("!=", 1))
            return (
                str(self._resolve_value(left, context))
                != self._strip_quotes(right)
            )
        return bool(self._resolve_value(expression, context))

    def _next_counter(
        self,
        name: str,
        start_spec: str,
        inline_format: str | None,
        document_cache: dict[str, Any],
    ) -> str:
        width = len(inline_format or start_spec)
        if name not in document_cache:
            start_value = int(start_spec)
            if name not in self._counter_state:
                self._counter_state[name] = start_value
            else:
                self._counter_state[name] += 1
            document_cache[name] = self._counter_state[name]
        return str(document_cache[name]).zfill(width)

    @staticmethod
    def _strip_quotes(value: str) -> str:
        if (value.startswith("\"") and value.endswith("\"")) or (
            value.startswith("'") and value.endswith("'")
        ):
            return value[1:-1]
        return value
