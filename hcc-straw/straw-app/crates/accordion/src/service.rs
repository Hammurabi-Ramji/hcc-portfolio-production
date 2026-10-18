//! The six commands. BSM-CODE: accordion.api.create/read/update/delete/schema()

use std::sync::Arc;

use serde_json::{Map, Value};
use sqlx::{Connection, SqliteConnection};
use straw_storage::Store;

use crate::autarch::{Autarch, EntityDef, EntitySchema, EntitySummary, FieldType};
use crate::record::{clean_record, FieldErrors};
use crate::{AccordionError, SCHEMA};

#[derive(Clone)]
pub struct Accordion {
    store: Store,
    autarch: Arc<Autarch>,
}

type Outcome<T> = Result<T, AccordionError>;

fn storage(e: impl ToString) -> AccordionError {
    AccordionError::Storage(e.to_string())
}

fn with_id(id: &str, mut data: Map<String, Value>) -> Value {
    data.insert("id".to_owned(), Value::String(id.to_owned()));
    Value::Object(data)
}

fn parse_data(text: &str) -> Result<Map<String, Value>, sqlx::Error> {
    match serde_json::from_str(text) {
        Ok(Value::Object(m)) => Ok(m),
        _ => Err(sqlx::Error::Protocol("stored record is not a JSON object".into())),
    }
}

impl Accordion {
    /// Applies the Accordion tables to `store` and serves `autarch`'s entities.
    pub fn open(store: Store, autarch: Autarch) -> Outcome<Self> {
        store
            .call(|c| Box::pin(async move { sqlx::raw_sql(SCHEMA).execute(c).await.map(|_| ()) }))
            .map_err(AccordionError::Storage)?;
        Ok(Self { store, autarch: Arc::new(autarch) })
    }

    pub fn open_path(path: impl AsRef<std::path::Path>, autarch: Autarch) -> Outcome<Self> {
        Self::open(Store::open(path, "").map_err(AccordionError::Storage)?, autarch)
    }

    pub fn autarch(&self) -> &Autarch {
        &self.autarch
    }

    fn def(&self, entity: &str) -> Outcome<EntityDef> {
        self.autarch
            .entity(entity)
            .cloned()
            .ok_or_else(|| AccordionError::UnknownEntity(entity.to_owned()))
    }

    /// schema_entities()
    pub fn schema_entities(&self) -> Vec<EntitySummary> {
        self.autarch
            .entities()
            .iter()
            .map(|e| EntitySummary { name: e.name.clone(), label: e.label() })
            .collect()
    }

    /// schema_get({entity})
    pub fn schema_get(&self, entity: &str) -> Outcome<EntitySchema> {
        Ok(EntitySchema::from(&self.def(entity)?))
    }

    /// entity_list({entity})
    pub fn entity_list(&self, entity: &str) -> Outcome<Vec<Value>> {
        self.def(entity)?;
        let entity = entity.to_owned();
        let rows: Vec<(String, String)> = self
            .store
            .call(move |c| {
                Box::pin(async move {
                    let rows = sqlx::query_as(
                        "SELECT id,data FROM accordion_records WHERE entity=? AND deleted_at IS NULL ORDER BY created_at,rowid",
                    )
                    .bind(entity)
                    .fetch_all(c)
                    .await?;
                    Ok(rows)
                })
            })
            .map_err(storage)?;
        rows.into_iter()
            .map(|(id, data)| Ok(with_id(&id, serde_json::from_str(&data).map_err(storage)?)))
            .collect()
    }

    /// entity_read({entity, id})
    pub fn entity_read(&self, entity: &str, id: &str) -> Outcome<Value> {
        self.def(entity)?;
        let (e, i) = (entity.to_owned(), id.to_owned());
        let row: Option<String> = self
            .store
            .call(move |c| {
                Box::pin(async move {
                    sqlx::query_scalar("SELECT data FROM accordion_records WHERE entity=? AND id=? AND deleted_at IS NULL")
                        .bind(e)
                        .bind(i)
                        .fetch_optional(c)
                        .await
                })
            })
            .map_err(storage)?;
        match row {
            Some(data) => Ok(with_id(id, serde_json::from_str(&data).map_err(storage)?)),
            None => Err(AccordionError::NotFound { entity: entity.to_owned(), id: id.to_owned() }),
        }
    }

    /// entity_save({entity, id|null, record}): create when `id` is None, else replace.
    pub fn entity_save(&self, entity: &str, id: Option<String>, record: Value) -> Outcome<Value> {
        let def = self.def(entity)?;
        let now = chrono::Utc::now();
        self.store
            .call(move |c| Box::pin(save(c, def, id, record, now)))
            .map_err(storage)?
    }

    /// entity_delete({entity, id}): soft by default; refused while still referenced.
    pub fn entity_delete(&self, entity: &str, id: &str) -> Outcome<()> {
        let def = self.def(entity)?;
        let autarch = self.autarch.clone();
        let id = id.to_owned();
        let now = chrono::Utc::now().timestamp();
        self.store
            .call(move |c| Box::pin(delete(c, autarch, def, id, now)))
            .map_err(storage)?
    }
}

async fn save(
    c: &mut SqliteConnection,
    def: EntityDef,
    id: Option<String>,
    record: Value,
    now: chrono::DateTime<chrono::Utc>,
) -> Result<Outcome<Value>, sqlx::Error> {
    let stamp = now.format("%Y-%m-%dT%H:%M:%SZ").to_string();
    let at = now.timestamp();
    let mut tx = c.begin().await?;

    let existing = match &id {
        Some(id) => {
            let row: Option<String> = sqlx::query_scalar(
                "SELECT data FROM accordion_records WHERE entity=? AND id=? AND deleted_at IS NULL",
            )
            .bind(&def.name)
            .bind(id)
            .fetch_optional(&mut *tx)
            .await?;
            match row {
                Some(text) => Some(parse_data(&text)?),
                None => {
                    return Ok(Err(AccordionError::NotFound { entity: def.name.clone(), id: id.clone() }));
                }
            }
        }
        None => None,
    };

    let cleaned = match clean_record(&def, &record, existing.as_ref(), &stamp) {
        Ok(m) => m,
        Err(errors) => return Ok(Err(AccordionError::Validation(errors))),
    };

    let mut errors = FieldErrors::new();
    for field in &def.fields {
        let Some(value) = cleaned.get(&field.name).filter(|v| !v.is_null()) else { continue };
        if field.kind == FieldType::Relation {
            let target = field.to.as_deref().unwrap_or_default();
            let found: i64 = sqlx::query_scalar(
                "SELECT count(*) FROM accordion_records WHERE entity=? AND id=? AND deleted_at IS NULL",
            )
            .bind(target)
            .bind(value.as_str().unwrap_or_default())
            .fetch_one(&mut *tx)
            .await?;
            if found == 0 {
                errors.insert(field.name.clone(), format!("{} refers to a missing {target} record", field.label()));
            }
        }
        if field.unique {
            let path = format!("$.{}", field.name);
            let own = id.clone().unwrap_or_default();
            let clash: i64 = match value {
                Value::String(s) => {
                    sqlx::query_scalar("SELECT count(*) FROM accordion_records WHERE entity=? AND deleted_at IS NULL AND id<>? AND json_extract(data,?)=?")
                        .bind(&def.name).bind(&own).bind(&path).bind(s).fetch_one(&mut *tx).await?
                }
                Value::Number(n) => {
                    sqlx::query_scalar("SELECT count(*) FROM accordion_records WHERE entity=? AND deleted_at IS NULL AND id<>? AND json_extract(data,?)=?")
                        .bind(&def.name).bind(&own).bind(&path).bind(n.as_i64().unwrap_or_default()).fetch_one(&mut *tx).await?
                }
                _ => 0,
            };
            if clash > 0 {
                errors.insert(field.name.clone(), format!("{} must be unique", field.label()));
            }
        }
    }
    if !errors.is_empty() {
        return Ok(Err(AccordionError::Validation(errors)));
    }
    let text = serde_json::to_string(&cleaned).map_err(|e| sqlx::Error::Protocol(e.to_string()))?;
    let (record_id, action) = match id {
        Some(id) => {
            sqlx::query("UPDATE accordion_records SET data=?,updated_at=? WHERE entity=? AND id=?")
                .bind(&text)
                .bind(at)
                .bind(&def.name)
                .bind(&id)
                .execute(&mut *tx)
                .await?;
            (id, "update")
        }
        None => {
            let id = uuid::Uuid::new_v4().to_string();
            sqlx::query("INSERT INTO accordion_records(entity,id,data,created_at,updated_at) VALUES(?,?,?,?,?)")
                .bind(&def.name)
                .bind(&id)
                .bind(&text)
                .bind(at)
                .bind(at)
                .execute(&mut *tx)
                .await?;
            (id, "create")
        }
    };
    if def.audit {
        sqlx::query("INSERT INTO accordion_audit(entity,record_id,action,at,data) VALUES(?,?,?,?,?)")
            .bind(&def.name)
            .bind(&record_id)
            .bind(action)
            .bind(at)
            .bind(&text)
            .execute(&mut *tx)
            .await?;
    }
    tx.commit().await?;
    Ok(Ok(with_id(&record_id, cleaned)))
}

async fn delete(
    c: &mut SqliteConnection,
    autarch: Arc<Autarch>,
    def: EntityDef,
    id: String,
    at: i64,
) -> Result<Outcome<()>, sqlx::Error> {
    let mut tx = c.begin().await?;
    let row: Option<String> = sqlx::query_scalar(
        "SELECT data FROM accordion_records WHERE entity=? AND id=? AND deleted_at IS NULL",
    )
    .bind(&def.name)
    .bind(&id)
    .fetch_optional(&mut *tx)
    .await?;
    let Some(data) = row else {
        return Ok(Err(AccordionError::NotFound { entity: def.name.clone(), id }));
    };

    for other in autarch.entities() {
        for field in other
            .fields
            .iter()
            .filter(|f| f.kind == FieldType::Relation && f.to.as_deref() == Some(def.name.as_str()))
        {
            let refs: i64 = sqlx::query_scalar(
                "SELECT count(*) FROM accordion_records WHERE entity=? AND deleted_at IS NULL AND json_extract(data,?)=?",
            )
            .bind(&other.name)
            .bind(format!("$.{}", field.name))
            .bind(&id)
            .fetch_one(&mut *tx)
            .await?;
            if refs > 0 {
                return Ok(Err(AccordionError::Conflict(format!(
                    "{} {id} is still referenced by {} record(s) via {}.{}",
                    def.name, refs, other.name, field.name
                ))));
            }
        }
    }

    if def.soft_delete {
        sqlx::query("UPDATE accordion_records SET deleted_at=? WHERE entity=? AND id=?")
            .bind(at)
            .bind(&def.name)
            .bind(&id)
            .execute(&mut *tx)
            .await?;
    } else {
        sqlx::query("DELETE FROM accordion_records WHERE entity=? AND id=?")
            .bind(&def.name)
            .bind(&id)
            .execute(&mut *tx)
            .await?;
    }
    if def.audit {
        sqlx::query("INSERT INTO accordion_audit(entity,record_id,action,at,data) VALUES(?,?,'delete',?,?)")
            .bind(&def.name)
            .bind(&id)
            .bind(at)
            .bind(&data)
            .execute(&mut *tx)
            .await?;
    }
    tx.commit().await?;
    Ok(Ok(()))
}
