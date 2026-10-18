//! Accordion.BE for STRAW: the six entity commands origami-fe expects, served
//! from the `entities` section of `.autarch.yaml` over `straw-storage`.
//!
//! Records live in one JSON table (`accordion_records`), so adding or changing an
//! entity in `.autarch.yaml` needs no SQL migration and no dynamic identifiers
//! ever reach a query. Validation, relation integrity, uniqueness and audit are
//! enforced here, in one transaction per write.
#![forbid(unsafe_code)]

pub mod autarch;
pub mod record;
mod service;

pub use autarch::{Autarch, EntityDef, EntitySchema, EntitySummary, FieldDef, FieldType};
pub use record::FieldErrors;
pub use service::Accordion;

/// Tables Accordion needs; `Accordion::open` applies it idempotently.
pub const SCHEMA: &str = include_str!("schema.sql");

#[derive(Debug, Clone, thiserror::Error)]
pub enum AccordionError {
    #[error("invalid .autarch.yaml: {0}")]
    Schema(String),
    #[error("unknown entity: {0}")]
    UnknownEntity(String),
    #[error("{entity} {id} not found")]
    NotFound { entity: String, id: String },
    #[error("validation failed: {}", format_errors(.0))]
    Validation(FieldErrors),
    #[error("{0}")]
    Conflict(String),
    #[error("storage: {0}")]
    Storage(String),
}

fn format_errors(errors: &FieldErrors) -> String {
    errors
        .iter()
        .map(|(field, message)| if field.is_empty() { message.clone() } else { format!("{field}: {message}") })
        .collect::<Vec<_>>()
        .join("; ")
}

/// An arbitrary JSON value that exports to TypeScript as `unknown`.
///
/// specta's own `serde_json::Value` mapping inlines the recursive enum and
/// overflows the stack during binding export, so contract types use this.
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(transparent)]
pub struct Json(pub serde_json::Value);

impl specta::Type for Json {
    fn definition(types: &mut specta::Types) -> specta::datatype::DataType {
        <specta_typescript::Unknown>::definition(types)
    }
}
