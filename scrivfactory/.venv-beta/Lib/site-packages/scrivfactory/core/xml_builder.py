"""XML generation for `.scrivx` files."""

from __future__ import annotations

import xml.etree.ElementTree as ET

from scrivfactory.core.uuid_generator import generate_uuid
from scrivfactory.models import BinderItem, DocumentTemplateDefinition, TemplateDefinition


def build_scrivx(
    *,
    project_name: str,
    template: TemplateDefinition,
    draft_uuid: str,
    research_uuid: str,
    trash_uuid: str,
) -> str:
    root = ET.Element(
        "ScrivenerProject",
        {
            "Version": "3.0",
            "Build": "15043.0",
            "ScrivenerVersion": template.scrivener_version,
            "ProjectName": project_name,
        },
    )

    project_settings = ET.SubElement(root, "ProjectSettings")
    ET.SubElement(project_settings, "DefaultFont").text = template.project_settings.default_font
    ET.SubElement(project_settings, "DefaultFontSize").text = str(
        template.project_settings.default_font_size
    )
    ET.SubElement(project_settings, "PaperSize").text = template.project_settings.paper_size

    binder = ET.SubElement(root, "Binder")
    draft_item = ET.SubElement(
        binder,
        "BinderItem",
        {"UUID": draft_uuid, "Type": "DraftFolder"},
    )
    ET.SubElement(draft_item, "Title").text = "Draft"
    draft_children = ET.SubElement(draft_item, "Children")
    for item in template.binder_structure:
        _append_binder_item(draft_children, item)

    research_item = ET.SubElement(
        binder,
        "BinderItem",
        {"UUID": research_uuid, "Type": "ResearchFolder"},
    )
    ET.SubElement(research_item, "Title").text = "Research"
    research_children = ET.SubElement(research_item, "Children")

    templates_folder = ET.SubElement(
        research_children,
        "BinderItem",
        {"UUID": generate_uuid(), "Type": "Folder"},
    )
    ET.SubElement(templates_folder, "Title").text = "Document Templates"
    templates_children = ET.SubElement(templates_folder, "Children")
    for document_template in template.document_templates:
        _append_template_item(templates_children, document_template)

    references_folder = ET.SubElement(
        research_children,
        "BinderItem",
        {"UUID": generate_uuid(), "Type": "Folder"},
    )
    ET.SubElement(references_folder, "Title").text = "Reference Material"

    trash_item = ET.SubElement(
        binder,
        "BinderItem",
        {"UUID": trash_uuid, "Type": "TrashFolder"},
    )
    ET.SubElement(trash_item, "Title").text = "Trash"

    collections = ET.SubElement(root, "Collections")
    for collection in template.collections:
        collection_el = ET.SubElement(
            collections,
            "Collection",
            {"Name": collection.name, "Type": collection.type},
        )
        if collection.criteria:
            ET.SubElement(collection_el, "Criteria").text = collection.criteria
        if collection.description:
            ET.SubElement(collection_el, "Description").text = collection.description
        if collection.entries:
            entries_el = ET.SubElement(collection_el, "Entries")
            for entry in collection.entries:
                ET.SubElement(entries_el, "Entry").text = entry

    metadata_settings = ET.SubElement(root, "CustomMetaDataSettings")
    for field in template.metadata_fields:
        field_el = ET.SubElement(
            metadata_settings,
            "MetaDataField",
            {
                "Name": field.name,
                "Type": field.type,
                "Default": str(field.default),
            },
        )
        if field.options:
            options_el = ET.SubElement(field_el, "Options")
            for option in field.options:
                ET.SubElement(options_el, "Option").text = option

    templates_section = ET.SubElement(root, "DocumentTemplates")
    for document_template in template.document_templates:
        template_el = ET.SubElement(
            templates_section,
            "Template",
            {
                "Name": document_template.name,
                "UUID": document_template.uuid or generate_uuid(),
            },
        )
        ET.SubElement(template_el, "Description").text = document_template.description

    ET.indent(root, space="  ")
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        + ET.tostring(root, encoding="unicode")
    )


def _append_binder_item(parent: ET.Element, item: BinderItem) -> ET.Element:
    binder_type = "Folder" if item.is_folder else "Text"
    element = ET.SubElement(
        parent,
        "BinderItem",
        {"UUID": item.uuid or generate_uuid(), "Type": binder_type},
    )
    ET.SubElement(element, "Title").text = item.title
    if item.id:
        ET.SubElement(element, "TemplateID").text = item.id
    if item.metadata:
        metadata = ET.SubElement(element, "MetaData")
        for key, value in item.metadata.items():
            field = ET.SubElement(metadata, "Field", {"Name": key})
            field.text = str(value)
    if item.children:
        children = ET.SubElement(element, "Children")
        for child in item.children:
            _append_binder_item(children, child)
    return element


def _append_template_item(
    parent: ET.Element,
    document_template: DocumentTemplateDefinition,
) -> ET.Element:
    element = ET.SubElement(
        parent,
        "BinderItem",
        {
            "UUID": document_template.uuid or generate_uuid(),
            "Type": "Template",
        },
    )
    ET.SubElement(element, "Title").text = document_template.name
    return element
