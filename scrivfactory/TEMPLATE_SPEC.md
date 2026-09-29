# Template specification

Scrivfactory accepts YAML and JSON templates with the following top-level keys.

## Top-level fields

- `template_name`: human-readable template name
- `template_version`: semantic version string
- `author`: template author
- `description`: freeform description
- `scrivener_version`: target Scrivener version string
- `project_settings`: output defaults such as font and paper size
- `metadata_fields`: list of custom metadata fields
- `collections`: list of search or manual collections
- `binder_structure`: ordered list of folders/documents in the draft binder
- `document_templates`: reusable document templates placed into research/templates
- `variables`: default variable values used during content rendering
- `placeholders`: placeholder directives such as `auto_increment:0001`

## Metadata field format

```yaml
metadata_fields:
  - name: "Approval_Status"
    type: "list"
    options: ["Draft", "Under Review", "Approved"]
    default: "Draft"
```

Supported field types:

- `text`
- `date`
- `list`

## Collection format

```yaml
collections:
  - name: "Pending Approval"
    type: "search"
    criteria: "Approval_Status equals 'Under Review'"
```

Supported collection types:

- `search`
- `manual`

## Binder item format

```yaml
binder_structure:
  - id: "01"
    title: "01 - Cover & Executive Documents"
    type: "folder"
    children:
      - title: "Cover Page Template"
        type: "document"
        content: "Cover content"
      - title: "Quality Manual Master"
        type: "document"
        template: "SOP Template"
```

Supported binder item types:

- `folder`
- `document`

Supported binder item content sources:

- `content`: inline text content
- `content_file`: relative or absolute path to a text file
- `template`: reference to a `document_templates[].name`

## Document template format

```yaml
document_templates:
  - name: "SOP Template"
    description: "Standard Operating Procedure"
    content: |
      STANDARD OPERATING PROCEDURE
      Document Number: SOP-[DOCNUM]
```

## Variable syntax

### Built-in variables

- `{{date}}` → current date in ISO format
- `{{year}}` → current year
- `{{fulldate}}` → long-form date such as `June 04, 2026`
- `{{template_name}}` → template name
- `{{project_name}}` → current output project name

### User variables

Any key in `variables` is accessible as `{{variable_name}}`.

### Placeholders and counters

Unknown square-bracket placeholders are preserved.

Configured placeholders can resolve counters:

```yaml
placeholders:
  DOCNUM: "auto_increment:0001"
```

Usage:

```text
SOP-[DOCNUM]
```

Direct inline counters also work:

```text
CAPA-[DOCNUM:0001]
```

## Conditionals

```text
{{#if company_name}}
Company: {{company_name}}
{{/if}}
```

## Loops

```text
{{#each reviewers}}
- {{name}}
{{/each}}
```

When iterating dictionaries, item keys are exposed directly. Primitive values are exposed as `{{this}}`.
