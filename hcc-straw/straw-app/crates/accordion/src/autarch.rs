//! `.autarch.yaml` model. BSM-CODE: accordion.fold.init()
//!
//! Only the `entities` section drives Accordion; other top-level keys (`project`,
//! `infrastructure`, `files`, ...) belong to other tools and are ignored here.
//! Definitions are strict: unknown keys inside an entity or field are errors so
//! typos fail at load instead of silently dropping a constraint.

use std::collections::HashSet;

use serde::{Deserialize, Serialize};
use serde_json::Value;
use specta::Type;

use crate::record::validate_value;
use crate::AccordionError;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum FieldType {
    String,
    Text,
    Integer,
    Boolean,
    Datetime,
    Enum,
    File,
    Coordinates,
    Relation,
    Json,
}

fn yes() -> bool {
    true
}
fn is_false(b: &bool) -> bool {
    !*b
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(deny_unknown_fields)]
pub struct FieldDef {
    pub name: String,
    #[serde(rename = "type")]
    pub kind: FieldType,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
    #[serde(default, skip_serializing_if = "is_false")]
    pub required: bool,
    // Enforced across live records of the entity (string and integer fields).
    #[serde(default, skip_serializing_if = "is_false")]
    pub unique: bool,
    // Accepted for compatibility with BSM-C schemas; storage is one JSON table.
    #[serde(default, skip_serializing)]
    pub indexed: bool,
    // Accepted for compatibility; coordinates are optional unless `required`.
    #[serde(default, skip_serializing)]
    pub optional: bool,
    #[serde(default, skip_serializing_if = "is_false")]
    pub searchable: bool,
    // Server-managed datetime: set at creation, never writable by clients.
    #[serde(default, skip_serializing_if = "is_false")]
    pub auto: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub min: Option<i32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub max: Option<i32>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub values: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub to: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub display_field: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[specta(type = Option<crate::Json>)]
    pub default: Option<Value>,
    // Nested field list for structured `json` fields.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[specta(type = Option<crate::Json>)]
    pub fields: Option<Vec<FieldDef>>,
}

impl FieldDef {
    pub fn label(&self) -> String {
        self.label.clone().unwrap_or_else(|| humanize(&self.name))
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct EntityDef {
    pub name: String,
    #[serde(default)]
    pub label: Option<String>,
    pub fields: Vec<FieldDef>,
    #[serde(default)]
    pub audit: bool,
    // Deletes hide the record instead of removing it. Defaults to true.
    #[serde(default = "yes")]
    pub soft_delete: bool,
    // Reserved: restricted roles require an identity layer and must fail closed.
    #[serde(default)]
    pub permissions: Option<Value>,
}

impl EntityDef {
    pub fn label(&self) -> String {
        self.label.clone().unwrap_or_else(|| humanize(&self.name))
    }

    pub fn field(&self, name: &str) -> Option<&FieldDef> {
        self.fields.iter().find(|f| f.name == name)
    }
}

// Wire shape of `schema_get`; matches what origami-fe's `normalizeSchema` reads.
#[derive(Debug, Clone, Serialize, Type)]
pub struct EntitySchema {
    pub entity: String,
    pub label: String,
    pub fields: Vec<FieldDef>,
    #[specta(type = Option<crate::Json>)]
    pub permissions: Option<Value>,
    pub audit: bool,
    pub soft_delete: bool,
}

#[derive(Debug, Clone, Serialize, Type)]
pub struct EntitySummary {
    pub name: String,
    pub label: String,
}

#[derive(Debug, Deserialize)]
struct Document {
    #[serde(default)]
    entities: Vec<EntityDef>,
}

#[derive(Debug, Clone)]
pub struct Autarch {
    entities: Vec<EntityDef>,
}

pub fn humanize(name: &str) -> String {
    let mut out = String::with_capacity(name.len());
    let mut start = true;
    for c in name.chars() {
        if c == '_' || c == '-' {
            if !out.ends_with(' ') && !out.is_empty() {
                out.push(' ');
            }
            start = true;
        } else if start {
            out.extend(c.to_uppercase());
            start = false;
        } else {
            out.push(c);
        }
    }
    out.trim_end().to_owned()
}

pub fn valid_entity_name(s: &str) -> bool {
    let mut chars = s.chars();
    s.len() <= 64
        && chars.next().is_some_and(|c| c.is_ascii_alphabetic())
        && chars.all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-')
}

pub fn valid_field_name(s: &str) -> bool {
    let mut chars = s.chars();
    s.len() <= 64
        && chars.next().is_some_and(|c| c.is_ascii_alphabetic() || c == '_')
        && chars.all(|c| c.is_ascii_alphanumeric() || c == '_')
}

fn bad(message: String) -> AccordionError {
    AccordionError::Schema(message)
}

impl Autarch {
    pub fn from_yaml(text: &str) -> Result<Self, AccordionError> {
        let document: Document = serde_yaml::from_str(text).map_err(|e| bad(e.to_string()))?;
        let autarch = Autarch { entities: document.entities };
        autarch.validate()?;
        Ok(autarch)
    }

    pub fn entities(&self) -> &[EntityDef] {
        &self.entities
    }

    pub fn entity(&self, name: &str) -> Option<&EntityDef> {
        self.entities.iter().find(|e| e.name == name)
    }

    fn validate(&self) -> Result<(), AccordionError> {
        let mut names = HashSet::new();
        for entity in &self.entities {
            if entity.permissions.as_ref().is_some_and(|policy| !policy.is_null()) {
                return Err(bad(format!("{}: role permissions require an authenticated identity layer; this desktop serves one local operator", entity.name)));
            }
            if !valid_entity_name(&entity.name) {
                return Err(bad(format!("invalid entity name '{}'", entity.name)));
            }
            if !names.insert(entity.name.as_str()) {
                return Err(bad(format!("duplicate entity '{}'", entity.name)));
            }
            self.validate_fields(&entity.name, &entity.fields, true)?;
        }
        Ok(())
    }

    fn validate_fields(&self, owner: &str, fields: &[FieldDef], top: bool) -> Result<(), AccordionError> {
        let mut seen = HashSet::new();
        for f in fields {
            let at = format!("{owner}.{}", f.name);
            if !valid_field_name(&f.name) {
                return Err(bad(format!("invalid field name '{at}'")));
            }
            if !seen.insert(f.name.as_str()) {
                return Err(bad(format!("duplicate field '{at}'")));
            }
            if f.auto && f.kind != FieldType::Datetime {
                return Err(bad(format!("{at}: `auto` is only valid on datetime fields")));
            }
            if f.unique && !matches!(f.kind, FieldType::String | FieldType::Integer) {
                return Err(bad(format!("{at}: `unique` is only valid on string and integer fields")));
            }
            if f.kind == FieldType::Enum && f.values.is_empty() {
                return Err(bad(format!("{at}: enum declares no values")));
            }
            if f.kind != FieldType::Enum && !f.values.is_empty() {
                return Err(bad(format!("{at}: `values` is only valid on enum fields")));
            }
            if let (Some(min), Some(max)) = (f.min, f.max) {
                if min > max {
                    return Err(bad(format!("{at}: min exceeds max")));
                }
            }
            if f.kind == FieldType::Relation {
                if !top {
                    return Err(bad(format!("{at}: relations are not allowed inside json fields")));
                }
                let target = f.to.as_deref().ok_or_else(|| bad(format!("{at}: relation needs `to`")))?;
                if self.entity(target).is_none() {
                    return Err(bad(format!("{at}: relation target '{target}' is not an entity")));
                }
            } else if f.to.is_some() || f.display_field.is_some() {
                return Err(bad(format!("{at}: `to`/`display_field` are only valid on relations")));
            }
            match (&f.fields, f.kind) {
                (Some(nested), FieldType::Json) => {
                    if nested.iter().any(|n| n.unique || n.auto) {
                        return Err(bad(format!("{at}: nested fields cannot be unique or auto")));
                    }
                    self.validate_fields(&at, nested, false)?;
                }
                (Some(_), _) => return Err(bad(format!("{at}: nested `fields` are only valid on json"))),
                _ => {}
            }
            if let Some(default) = &f.default {
                validate_value(f, Some(default)).map_err(|m| bad(format!("{at}: invalid default: {m}")))?;
            }
        }
        // display_field must exist on the related entity when named.
        if top {
            for f in fields.iter().filter(|f| f.kind == FieldType::Relation) {
                if let (Some(display), Some(target)) = (&f.display_field, f.to.as_deref().and_then(|t| self.entity(t))) {
                    if target.field(display).is_none() {
                        return Err(bad(format!("{owner}.{}: display_field '{display}' not on '{}'", f.name, target.name)));
                    }
                }
            }
        }
        Ok(())
    }
}

impl From<&EntityDef> for EntitySchema {
    fn from(def: &EntityDef) -> Self {
        fn fill(fields: &[FieldDef]) -> Vec<FieldDef> {
            fields
                .iter()
                .map(|f| FieldDef {
                    label: Some(f.label()),
                    fields: f.fields.as_deref().map(fill),
                    ..f.clone()
                })
                .collect()
        }
        EntitySchema {
            entity: def.name.clone(),
            label: def.label(),
            fields: fill(&def.fields),
            permissions: def.permissions.clone(),
            audit: def.audit,
            soft_delete: def.soft_delete,
        }
    }
}

#[cfg(test)]
mod authorization_tests {
    use super::*;
    #[test]
    fn reserved_role_policies_cannot_silently_claim_enforcement() {
        let schema = "entities:\n  - name: note\n    permissions: {read: [admin]}\n    fields: [{name: title, type: string}]\n";
        assert!(Autarch::from_yaml(schema).unwrap_err().to_string().contains("authenticated identity"));
    }
}
