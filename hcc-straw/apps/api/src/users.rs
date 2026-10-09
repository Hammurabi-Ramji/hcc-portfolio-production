//! Persisted user management; no process-local account store.
use crate::{
    auth,
    store::{db_error, load_user, random_id, timestamp, user_from_row, USER_COLUMNS},
    success, ApiError, ApiResult, AppState, UserDto,
};
use axum::{
    extract::{rejection::JsonRejection, Path, RawQuery, State},
    http::{HeaderMap, StatusCode},
    response::Response,
    routing::get,
    Json, Router,
};
use rusqlite::{params, TransactionBehavior};
use serde::Deserialize;

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
fn admin(user: &UserDto) -> ApiResult<()> {
    if user.role == "admin" {
        Ok(())
    } else {
        Err(ApiError::forbidden())
    }
}
fn owner(user: &UserDto, id: &str) -> ApiResult<()> {
    if user.id == id || user.role == "admin" {
        Ok(())
    } else {
        Err(ApiError::forbidden())
    }
}
fn id_valid(id: &str) -> ApiResult<()> {
    if id.len() == 64
        && id
            .bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
    {
        Ok(())
    } else {
        Err(ApiError::invalid())
    }
}
fn bounded(value: Option<&str>, max: usize) -> ApiResult<()> {
    if value.is_some_and(|v| v.len() > max || v.chars().any(char::is_control)) {
        Err(ApiError::invalid())
    } else {
        Ok(())
    }
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct CreateUser {
    email: String,
    password: String,
    username: Option<String>,
    #[serde(default = "default_role")]
    role: String,
    first_name: Option<String>,
    last_name: Option<String>,
}
fn default_role() -> String {
    "user".into()
}
impl CreateUser {
    fn validate(mut self) -> ApiResult<Self> {
        self.email = auth::validate_email(&self.email)?;
        auth::validate_password(&self.password)?;
        if let Some(v) = self.username.as_mut() {
            *v = v.trim().to_ascii_lowercase();
            if !(3..=64).contains(&v.len())
                || !v
                    .bytes()
                    .all(|b| b.is_ascii_alphanumeric() || b == b'_' || b == b'-')
            {
                return Err(ApiError::invalid());
            }
        }
        if !["user", "admin", "moderator"].contains(&self.role.as_str()) {
            return Err(ApiError::invalid());
        }
        bounded(self.first_name.as_deref(), 100)?;
        bounded(self.last_name.as_deref(), 100)?;
        Ok(self)
    }
}
#[derive(Default, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct ProfileUpdate {
    first_name: Option<String>,
    last_name: Option<String>,
    bio: Option<String>,
    website: Option<String>,
    location: Option<String>,
    avatar_url: Option<String>,
}
impl ProfileUpdate {
    fn validate(self) -> ApiResult<Self> {
        bounded(self.first_name.as_deref(), 100)?;
        bounded(self.last_name.as_deref(), 100)?;
        bounded(self.bio.as_deref(), 2000)?;
        bounded(self.location.as_deref(), 200)?;
        for value in [&self.website, &self.avatar_url].into_iter().flatten() {
            bounded(Some(value), 2048)?;
            if !value.is_empty() {
                let url = url::Url::parse(value).map_err(|_| ApiError::invalid())?;
                if !["https", "http"].contains(&url.scheme())
                    || url.host_str().is_none()
                    || !url.username().is_empty()
                    || url.password().is_some()
                {
                    return Err(ApiError::invalid());
                }
            }
        }
        Ok(self)
    }
}
struct Pagination {
    page: u32,
    limit: u32,
    search: String,
}
impl Pagination {
    fn parse(raw: Option<String>) -> ApiResult<Self> {
        let mut page = None;
        let mut limit = None;
        let mut search = None;
        for (k, v) in url::form_urlencoded::parse(raw.as_deref().unwrap_or("").as_bytes()) {
            match k.as_ref() {
                "page" if page.is_none() => page = Some(positive(&v)?),
                "limit" if limit.is_none() => limit = Some(positive(&v)?),
                "search" if search.is_none() => {
                    bounded(Some(&v), 200)?;
                    search = Some(v.into_owned())
                }
                _ => return Err(ApiError::invalid()),
            }
        }
        Ok(Self {
            page: page.unwrap_or(1),
            limit: limit.unwrap_or(10).min(100),
            search: search.unwrap_or_default(),
        })
    }
}
fn positive(v: &str) -> ApiResult<u32> {
    if v.is_empty() || !v.bytes().all(|b| b.is_ascii_digit()) {
        return Err(ApiError::invalid());
    }
    v.parse::<u32>()
        .ok()
        .filter(|v| *v > 0)
        .ok_or_else(ApiError::invalid)
}
async fn list(
    State(state): State<AppState>,
    headers: HeaderMap,
    RawQuery(raw): RawQuery,
) -> ApiResult<Response> {
    let data = blocking(move || {
        let session = auth::authenticate(&state, &headers)?;
        session.require_roles(&["admin"])?;
        let p = Pagination::parse(raw)?;
        state.store.with_conn(|conn| {
            let tx = conn.transaction().map_err(db_error)?;
            admin(&session.revalidate(&tx)?)?;
            // User search is literal, not a SQL LIKE pattern language.
            let escaped = p.search.replace('\\', "\\\\").replace('%', "\\%").replace('_', "\\_");
            let pattern = format!("%{escaped}%");
            let filter = "email LIKE ?1 ESCAPE '\\' OR coalesce(username,'') LIKE ?1 ESCAPE '\\'";
            let total: u64 = tx.query_row(
                &format!("SELECT count(*) FROM users WHERE {filter}"),
                [&pattern], |row| row.get(0),
            ).map_err(db_error)?;
            let mut stmt = tx.prepare(&format!(
                "SELECT {USER_COLUMNS} FROM users WHERE {filter} ORDER BY created_at,id LIMIT ?2 OFFSET ?3"
            )).map_err(db_error)?;
            let offset = (u64::from(p.page) - 1) * u64::from(p.limit);
            let rows = stmt.query_map(params![pattern,p.limit,offset], user_from_row).map_err(db_error)?;
            let mut users = Vec::new();
            for row in rows {
                let user = row.map_err(db_error)?;
                users.push(load_user(&tx, &user.id)?);
            }
            Ok(serde_json::json!({
                "data": users,
                "meta": {"page":p.page,"limit":p.limit,"total":total,"pages":total.div_ceil(u64::from(p.limit))}
            }))
        })
    }).await?;
    Ok(success(data))
}
async fn create(
    State(state): State<AppState>,
    headers: HeaderMap,
    input: Result<Json<CreateUser>, JsonRejection>,
) -> ApiResult<Response> {
    let input = parse(input)?;
    let user = blocking(move || {
        let session = auth::authenticate(&state, &headers)?;
        session.require_roles(&["admin"])?;
        let input = input.validate()?;
        let hash = auth::hash_password(&input.password)?;
        state.store.with_conn(|conn| {
            let tx = conn.transaction_with_behavior(TransactionBehavior::Immediate).map_err(db_error)?;
            // Hashing can take time: do not authorize a write from a stale role/session snapshot.
            admin(&session.revalidate(&tx)?)?;
            let id = random_id()?;
            let time = timestamp();
            tx.execute(
                "INSERT INTO users(id,email,username,password_hash,role,created_at,updated_at) VALUES(?1,?2,?3,?4,?5,?6,?6)",
                params![id,input.email,input.username,hash,input.role,time],
            ).map_err(db_error)?;
            tx.execute(
                "INSERT INTO profiles(id,user_id,first_name,last_name,created_at,updated_at) VALUES(?1,?2,?3,?4,?5,?5)",
                params![random_id()?,id,input.first_name,input.last_name,time],
            ).map_err(db_error)?;
            let user = load_user(&tx, &id)?;
            tx.commit().map_err(db_error)?;
            Ok(user)
        })
    }).await?;
    let mut response = success(user);
    *response.status_mut() = StatusCode::CREATED;
    Ok(response)
}
async fn item(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> ApiResult<Response> {
    let user = blocking(move || {
        let session = auth::authenticate(&state, &headers)?;
        id_valid(&id)?;
        state.store.with_conn(|conn| {
            let tx = conn.transaction().map_err(db_error)?;
            owner(&session.revalidate(&tx)?, &id)?;
            load_user(&tx, &id)
        })
    })
    .await?;
    Ok(success(user))
}
async fn profile(State(state): State<AppState>, headers: HeaderMap) -> ApiResult<Response> {
    let profile = blocking(move || {
        let session = auth::authenticate(&state, &headers)?;
        state.store.with_conn(|conn| {
            let tx = conn.transaction().map_err(db_error)?;
            let user = session.revalidate(&tx)?;
            user.profile.ok_or_else(ApiError::internal)
        })
    })
    .await?;
    Ok(success(profile))
}
async fn update_profile(
    State(state): State<AppState>,
    headers: HeaderMap,
    input: Result<Json<ProfileUpdate>, JsonRejection>,
) -> ApiResult<Response> {
    let input = parse(input)?.validate()?;
    let profile = blocking(move || {
        let session = auth::authenticate(&state, &headers)?;
        state.store.with_conn(|conn| {
            let tx = conn.transaction_with_behavior(TransactionBehavior::Immediate).map_err(db_error)?;
            let user = session.revalidate(&tx)?;
            let time = timestamp();
            tx.execute(
                "UPDATE profiles SET first_name=coalesce(?1,first_name),last_name=coalesce(?2,last_name),bio=coalesce(?3,bio),website=coalesce(?4,website),location=coalesce(?5,location),avatar_url=coalesce(?6,avatar_url),updated_at=?7 WHERE user_id=?8",
                params![input.first_name,input.last_name,input.bio,input.website,input.location,input.avatar_url,time,user.id],
            ).map_err(db_error)?;
            let profile = load_user(&tx, &user.id)?.profile.ok_or_else(ApiError::internal)?;
            tx.commit().map_err(db_error)?;
            Ok(profile)
        })
    }).await?;
    Ok(success(profile))
}
async fn avatar(State(state): State<AppState>, headers: HeaderMap) -> ApiResult<Response> {
    blocking(move || {
        auth::authenticate(&state, &headers)?;
        Err(ApiError::new(
            StatusCode::NOT_IMPLEMENTED,
            "UNSUPPORTED",
            "Avatar upload storage is unavailable in this local service.",
        ))
    })
    .await
}
pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/users", get(list).post(create))
        .route("/api/users/profile", get(profile).put(update_profile))
        .route("/api/users/avatar", axum::routing::post(avatar))
        .route("/api/users/:id", get(item))
}
