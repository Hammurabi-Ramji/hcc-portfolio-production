//! Record validation. BSM-CODE: accordion.api.logic()
//!
//! Mirrors origami-fe's `validateRecord` so client and server agree, but the
//! server is authoritative: it rejects unknown fields, ignores client writes to
//! server-managed (`auto`) fields, and normalizes blanks.

use std::collections::BTreeMap;

use chrono::{DateTime, NaiveDateTime};
use serde_json::{json, Map, Value};

use crate::autarch::{EntityDef, FieldDef, FieldType};

pub type FieldErrors = BTreeMap<String, String>;

const MAX_STRING: usize = 64 * 1024;
const MAX_TEXT: usize = 1024 * 1024;
const MAX_JSON: usize = 256 * 1024;

fn is_blank(v: Option<&Value>) -> bool {
    match v {
        None | Some(Value::Null) => true,
        Some(Value::String(s)) => s.is_empty(),
        _ => false,
    }
}

fn valid_datetime(s: &str) -> bool {
    DateTime::parse_from_rfc3339(s).is_ok()
        || [
            "%Y-%m-%dT%H:%M",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%dT%H:%M:%S%.f",
        ]
        .iter()
        .any(|f| NaiveDateTime::parse_from_str(s, f).is_ok())
}

/// Validates and normalizes one field value. `None` means the key was absent.
pub fn validate_value(field: &FieldDef, input: Option<&Value>) -> Result<Value, String> {
    let label = field.label();
    if field.kind != FieldType::Boolean && is_blank(input) {
        return if field.required {
            Err(format!("{label} is required"))
        } else {
            Ok(match field.kind {
                FieldType::String | FieldType::Text => Value::String(String::new()),
                _ => Value::Null,
            })
        };
    }
    let v = input.unwrap_or(&Value::Null);
    match field.kind {
        FieldType::String | FieldType::Text => {
            let s = v.as_str().ok_or_else(|| format!("{label} must be text"))?;
            let cap = if field.kind == FieldType::Text {
                MAX_TEXT
            } else {
                MAX_STRING
            };
            if s.len() > cap {
                return Err(format!("{label} is too long"));
            }
            Ok(v.clone())
        }
        FieldType::Integer => {
            let n = v
                .as_i64()
                .ok_or_else(|| format!("{label} must be a whole number"))?;
            match (field.min, field.max) {
                (Some(min), _) if n < i64::from(min) => {
                    Err(format!("{label} must be at least {min}"))
                }
                (_, Some(max)) if n > i64::from(max) => {
                    Err(format!("{label} must be at most {max}"))
                }
                _ => Ok(json!(n)),
            }
        }
        FieldType::Datetime => match v.as_str() {
            Some(s) if valid_datetime(s) => Ok(v.clone()),
            _ => Err(format!("{label} must be a date and time")),
        },
        FieldType::Enum => match v.as_str() {
            Some(s) if field.values.iter().any(|x| x == s) => Ok(v.clone()),
            _ => Err(format!(
                "{label} must be one of: {}",
                field.values.join(", ")
            )),
        },
        FieldType::File => {
            let o = v.as_object();
            let name = o.and_then(|o| o.get("name")).and_then(Value::as_str);
            let size = o.and_then(|o| o.get("size")).and_then(Value::as_u64);
            let kind = o.and_then(|o| o.get("type")).and_then(Value::as_str);
            match (name, size, kind) {
                (Some(n), Some(s), Some(t))
                    if !n.is_empty() && n.len() <= 255 && t.len() <= 255 =>
                {
                    Ok(json!({ "name": n, "size": s, "type": t }))
                }
                _ => Err(format!("{label} must be file metadata (name, size, type)")),
            }
        }
        FieldType::Coordinates => {
            let o = v.as_object();
            let lat = o.and_then(|o| o.get("lat")).and_then(Value::as_f64);
            let lng = o.and_then(|o| o.get("lng")).and_then(Value::as_f64);
            match (lat, lng) {
                (Some(a), Some(b)) if a.abs() <= 90.0 && b.abs() <= 180.0 => {
                    Ok(json!({ "lat": a, "lng": b }))
                }
                _ => Err(format!(
                    "{label} needs a latitude (-90..90) and longitude (-180..180)"
                )),
            }
        }
        FieldType::Relation => match v.as_str() {
            Some(id) if id.len() <= 64 => Ok(v.clone()),
            _ => Err(format!("{label} must be a record id")),
        },
        FieldType::Json => match &field.fields {
            Some(nested) => {
                let obj = v
                    .as_object()
                    .ok_or_else(|| format!("{label} must be an object"))?;
                clean_fields(nested, obj, None, "")
                    .map(Value::Object)
                    .map_err(|errs| {
                        let parts: Vec<_> = errs.iter().map(|(k, m)| format!("{k}: {m}")).collect();
                        format!("{label}: {}", parts.join("; "))
                    })
            }
            None => {
                if v.to_string().len() > MAX_JSON {
                    Err(format!("{label} is too large"))
                } else {
                    Ok(v.clone())
                }
            }
        },
        FieldType::Boolean => match v {
            Value::Null => Ok(Value::Bool(false)),
            Value::Bool(b) => Ok(Value::Bool(*b)),
            _ => Err(format!("{label} must be true or false")),
        },
    }
}

/// `now` fills `auto` datetimes on first save; `existing` preserves them afterward.
pub fn clean_fields(
    fields: &[FieldDef],
    input: &Map<String, Value>,
    existing: Option<&Map<String, Value>>,
    now: &str,
) -> Result<Map<String, Value>, FieldErrors> {
    let mut errors = FieldErrors::new();
    let mut out = Map::new();
    for key in input.keys() {
        if !fields.iter().any(|f| &f.name == key) {
            errors.insert(key.clone(), "unknown field".to_owned());
        }
    }
    for field in fields {
        if field.auto {
            let kept = existing.and_then(|e| e.get(&field.name)).cloned();
            out.insert(
                field.name.clone(),
                kept.unwrap_or_else(|| Value::String(now.to_owned())),
            );
            continue;
        }
        // An absent key takes the declared default; an explicit null does not.
        let supplied = input.get(&field.name).or(field.default.as_ref());
        match validate_value(field, supplied) {
            Ok(v) => {
                out.insert(field.name.clone(), v);
            }
            Err(message) => {
                errors.insert(field.name.clone(), message);
            }
        }
    }
    if errors.is_empty() {
        Ok(out)
    } else {
        Err(errors)
    }
}

pub fn clean_record(
    entity: &EntityDef,
    input: &Value,
    existing: Option<&Map<String, Value>>,
    now: &str,
) -> Result<Map<String, Value>, FieldErrors> {
    let Some(object) = input.as_object() else {
        return Err(FieldErrors::from([(
            String::new(),
            "record must be an object".to_owned(),
        )]));
    };
    let mut object = object.clone();
    object.remove("id");
    clean_fields(&entity.fields, &object, existing, now)
}
