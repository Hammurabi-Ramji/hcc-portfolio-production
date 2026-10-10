//! Owner-scoped projects stored in the same SQLite database as sessions.
use crate::{
    auth,
    store::{db_error, random_id, timestamp},
    success, ApiError, ApiResult, AppState,
};
use axum::{
    extract::{rejection::JsonRejection, Path, Query, State},
    http::{HeaderMap, StatusCode},
    response::Response,
    routing::{get, patch},
    Json, Router,
};
use rusqlite::{params, OptionalExtension, Row, TransactionBehavior};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ProjectDto {
    id: String,
    name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    description: Option<String>,
    status: String,
    created_at: String,
    updated_at: String,
    created_by: String,
}

async fn blocking<T: Send + 'static>(
    f: impl FnOnce() -> ApiResult<T> + Send + 'static,
) -> ApiResult<T> {
    tokio::task::spawn_blocking(f)
        .await
        .map_err(|_| ApiError::internal())?
}

fn parse<T>(input: Result<Json<T>, JsonRejection>) -> ApiResult<T> {
    input.map(|Json(v)| v).map_err(|_| ApiError::invalid())
}

fn id_valid(id: &str) -> ApiResult<()> {
    if id.len() == 64 && id.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b)) {
        Ok(())
    } else {
        Err(ApiError::invalid())
    }
}

fn text(value: &str, max: usize) -> ApiResult<()> {
    if value.is_empty() || value.len() > max || value.chars().any(char::is_control) {
        Err(ApiError::invalid())
    } else {
        Ok(())
    }
}

fn status_valid(value: &str) -> ApiResult<()> {
    if matches!(value, "active" | "completed" | "archived" | "draft") {
        Ok(())
    } else {
        Err(ApiError::invalid())
    }
}

fn project_from_row(row: &Row<'_>) -> rusqlite::Result<ProjectDto> {
    Ok(ProjectDto {
        id: row.get(0)?,
        name: row.get(1)?,
        description: row.get(2)?,
        status: row.get(3)?,
        created_at: row.get(4)?,
        updated_at: row.get(5)?,
        created_by: row.get(6)?,
    })
}

const COLUMNS: &str = "id,name,description,status,created_at,updated_at,created_by";

fn load(conn: &rusqlite::Connection, id: &str) -> ApiResult<ProjectDto> {
    conn.query_row(
        &format!("SELECT {COLUMNS} FROM projects WHERE id=?1"),
        [id],
        project_from_row,
    )
    .optional()
    .map_err(db_error)?
    .ok_or_else(|| {
        ApiError::new(
            StatusCode::NOT_FOUND,
            "RESOURCE_NOT_FOUND",
            "Project not found.",
        )
    })
}

fn owned(user_id: &str, role: &str, owner: &str) -> ApiResult<()> {
    if user_id == owner || role == "admin" {
        Ok(())
    } else {
        Err(ApiError::forbidden())
    }
}

struct Page {
    page: u32,
    limit: u32,
    status: Option<String>,
    search: String,
}

fn positive(value: &str) -> ApiResult<u32> {
    if value.is_empty() || !value.bytes().all(|b| b.is_ascii_digit()) {
        return Err(ApiError::invalid());
    }
    value
        .parse::<u32>()
        .ok()
        .filter(|v| *v > 0)
        .ok_or_else(ApiError::invalid)
}

#[derive(Deserialize)]
struct ListQuery {
    page: Option<String>,
    limit: Option<String>,
    status: Option<String>,
    search: Option<String>,
}

fn page(query: ListQuery) -> ApiResult<Page> {
    let page = query.page.as_deref().map(positive).transpose()?.unwrap_or(1);
    let limit = query
        .limit
        .as_deref()
        .map(positive)
        .transpose()?
        .unwrap_or(10)
        .min(100);
    let status = match query.status {
        Some(value) if !value.is_empty() => {
            status_valid(&value)?;
            Some(value)
        }
        _ => None,
    };
    let search = query.search.unwrap_or_default();
    if search.chars().any(char::is_control) {
        return Err(ApiError::invalid());
    }
    Ok(Page {
        page,
        limit,
        status,
        search,
    })
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct CreateProject {
    name: String,
    description: Option<String>,
    status: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct UpdateProject {
    name: Option<String>,
    description: Option<String>,
    status: Option<String>,
}

fn optional_text(value: &Option<String>, max: usize) -> ApiResult<Option<String>> {
    match value {
        Some(text_value) => {
            text(text_value, max)?;
            Ok(Some(text_value.clone()))
        }
        None => Ok(None),
    }
}

async fn list(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(raw): Query<ListQuery>,
) -> ApiResult<Response> {
    let data = blocking(move || {
        let session = auth::authenticate(&state, &headers)?;
        let query = page(raw)?;
        state.store.with_conn(|conn| {
            let tx = conn.transaction().map_err(db_error)?;
            let user = session.revalidate(&tx)?;
            let escaped = query
                .search
                .replace('\\', "\\\\")
                .replace('%', "\\%")
                .replace('_', "\\_");
            let pattern = format!("%{escaped}%");
            let mut filter = String::from("name LIKE ?1 ESCAPE '\\'");
            let mut values: Vec<rusqlite::types::Value> = vec![pattern.into()];
            if user.role != "admin" {
                filter.push_str(" AND created_by=?2");
                values.push(user.id.clone().into());
            }
            let status_index = values.len() + 1;
            if let Some(status) = &query.status {
                filter.push_str(&format!(" AND status=?{status_index}"));
                values.push(status.clone().into());
            }
            let total: u64 = tx
                .query_row(
                    &format!("SELECT count(*) FROM projects WHERE {filter}"),
                    rusqlite::params_from_iter(values.iter()),
                    |row| row.get(0),
                )
                .map_err(db_error)?;
            let limit_index = values.len() + 1;
            let offset_index = values.len() + 2;
            let mut stmt = tx
                .prepare(&format!(
                    "SELECT {COLUMNS} FROM projects WHERE {filter} ORDER BY created_at,id LIMIT ?{limit_index} OFFSET ?{offset_index}"
                ))
                .map_err(db_error)?;
            let offset = (u64::from(query.page) - 1) * u64::from(query.limit);
            values.push((query.limit as i64).into());
            values.push((offset as i64).into());
            let rows = stmt
                .query_map(rusqlite::params_from_iter(values.iter()), project_from_row)
                .map_err(db_error)?;
            let mut projects = Vec::new();
            for row in rows {
                projects.push(row.map_err(db_error)?);
            }
            let pages = if query.limit == 0 {
                0
            } else {
                total.div_ceil(u64::from(query.limit))
            };
            Ok(serde_json::json!({
                "data": projects,
                "meta": {"page": query.page, "limit": query.limit, "total": total, "pages": pages}
            }))
        })
    })
    .await?;
    Ok(success(data))
}

async fn create(
    State(state): State<AppState>,
    headers: HeaderMap,
    input: Result<Json<CreateProject>, JsonRejection>,
) -> ApiResult<Response> {
    let input = parse(input)?;
    text(input.name.trim(), 200)?;
    let description = match &input.description {
        Some(value) if value.is_empty() => None,
        other => optional_text(other, 4000)?,
    };
    let status = input.status.unwrap_or_else(|| "active".to_owned());
    status_valid(&status)?;
    let name = input.name.trim().to_owned();
    let project = blocking(move || {
        let session = auth::authenticate(&state, &headers)?;
        state.store.with_conn(|conn| {
            let tx = conn
                .transaction_with_behavior(TransactionBehavior::Immediate)
                .map_err(db_error)?;
            let user = session.revalidate(&tx)?;
            let id = random_id()?;
            let time = timestamp();
            tx.execute(
                "INSERT INTO projects(id,name,description,status,created_by,created_at,updated_at) VALUES(?1,?2,?3,?4,?5,?6,?6)",
                params![id, name, description, status, user.id, time],
            )
            .map_err(db_error)?;
            let project = load(&tx, &id)?;
            tx.commit().map_err(db_error)?;
            Ok(project)
        })
    })
    .await?;
    let mut response = success(project);
    *response.status_mut() = StatusCode::CREATED;
    Ok(response)
}

async fn item(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> ApiResult<Response> {
    let project = blocking(move || {
        let session = auth::authenticate(&state, &headers)?;
        id_valid(&id)?;
        state.store.with_conn(|conn| {
            let tx = conn.transaction().map_err(db_error)?;
            let user = session.revalidate(&tx)?;
            let project = load(&tx, &id)?;
            owned(&user.id, &user.role, &project.created_by)?;
            Ok(project)
        })
    })
    .await?;
    Ok(success(project))
}

async fn update(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
    input: Result<Json<UpdateProject>, JsonRejection>,
) -> ApiResult<Response> {
    let input = parse(input)?;
    if input.name.is_none() && input.description.is_none() && input.status.is_none() {
        return Err(ApiError::invalid());
    }
    if let Some(name) = &input.name {
        text(name.trim(), 200)?;
    }
    let description = optional_text(&input.description, 4000)?;
    if let Some(status) = &input.status {
        status_valid(status)?;
    }
    let name = input.name.map(|value| value.trim().to_owned());
    let status = input.status;
    let project = blocking(move || {
        let session = auth::authenticate(&state, &headers)?;
        id_valid(&id)?;
        state.store.with_conn(|conn| {
            let tx = conn
                .transaction_with_behavior(TransactionBehavior::Immediate)
                .map_err(db_error)?;
            let user = session.revalidate(&tx)?;
            let current = load(&tx, &id)?;
            owned(&user.id, &user.role, &current.created_by)?;
            let time = timestamp();
            tx.execute(
                "UPDATE projects SET name=coalesce(?1,name), description=coalesce(?2,description), status=coalesce(?3,status), updated_at=?4 WHERE id=?5",
                params![name, description, status, time, id],
            )
            .map_err(db_error)?;
            let project = load(&tx, &id)?;
            tx.commit().map_err(db_error)?;
            Ok(project)
        })
    })
    .await?;
    Ok(success(project))
}

async fn remove(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> ApiResult<Response> {
    blocking(move || {
        let session = auth::authenticate(&state, &headers)?;
        id_valid(&id)?;
        state.store.with_conn(|conn| {
            let tx = conn
                .transaction_with_behavior(TransactionBehavior::Immediate)
                .map_err(db_error)?;
            let user = session.revalidate(&tx)?;
            let current = load(&tx, &id)?;
            owned(&user.id, &user.role, &current.created_by)?;
            tx.execute("DELETE FROM projects WHERE id=?1", [&id])
                .map_err(db_error)?;
            tx.commit().map_err(db_error)?;
            Ok(())
        })
    })
    .await?;
    Ok(success(None::<()>))
}

async fn set_status(
    state: AppState,
    headers: HeaderMap,
    id: String,
    status: &'static str,
) -> ApiResult<Response> {
    blocking(move || {
        let session = auth::authenticate(&state, &headers)?;
        id_valid(&id)?;
        state.store.with_conn(|conn| {
            let tx = conn
                .transaction_with_behavior(TransactionBehavior::Immediate)
                .map_err(db_error)?;
            let user = session.revalidate(&tx)?;
            let current = load(&tx, &id)?;
            owned(&user.id, &user.role, &current.created_by)?;
            tx.execute(
                "UPDATE projects SET status=?1, updated_at=?2 WHERE id=?3",
                params![status, timestamp(), id],
            )
            .map_err(db_error)?;
            tx.commit().map_err(db_error)?;
            Ok(())
        })
    })
    .await?;
    Ok(success(None::<()>))
}

async fn archive(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> ApiResult<Response> {
    set_status(state, headers, id, "archived").await
}

async fn activate(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> ApiResult<Response> {
    set_status(state, headers, id, "active").await
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/projects", get(list).post(create))
        .route("/api/projects/:id/archive", patch(archive))
        .route("/api/projects/:id/activate", patch(activate))
        .route("/api/projects/:id", get(item).put(update).delete(remove))
}
