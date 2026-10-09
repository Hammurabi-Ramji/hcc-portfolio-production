use crate::{ApiError, ApiResult};
use chrono::{SecondsFormat, Utc};
use rand::{rngs::OsRng, RngCore};
use rusqlite::{params, Connection, OptionalExtension, Row};
use serde::Serialize;
use std::{
    path::Path,
    sync::{Arc, Mutex},
    time::Duration,
};

#[derive(Clone)]
pub struct Store {
    connection: Arc<Mutex<Connection>>,
}
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserDto {
    pub id: String,
    pub email: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,
    pub role: String,
    pub email_verified: bool,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub profile: Option<ProfileDto>,
}
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileDto {
    pub id: String,
    pub user_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub first_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bio: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub website: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}
pub fn now() -> i64 {
    Utc::now().timestamp()
}
pub fn timestamp() -> String {
    Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true)
}
pub fn random_id() -> ApiResult<String> {
    let mut bytes = [0u8; 32];
    OsRng
        .try_fill_bytes(&mut bytes)
        .map_err(|_| ApiError::internal())?;
    Ok(bytes.iter().map(|b| format!("{b:02x}")).collect())
}
pub fn db_error(error: rusqlite::Error) -> ApiError {
    if matches!(&error, rusqlite::Error::SqliteFailure(e, _) if e.code == rusqlite::ErrorCode::ConstraintViolation)
    {
        ApiError::new(
            axum::http::StatusCode::CONFLICT,
            "RESOURCE_CONFLICT",
            "The record conflicts with existing data.",
        )
    } else {
        ApiError::internal()
    }
}
impl Store {
    pub fn open(path: impl AsRef<Path>) -> ApiResult<Self> {
        let conn = Connection::open(path).map_err(db_error)?;
        conn.busy_timeout(Duration::from_secs(5))
            .map_err(db_error)?;
        conn.execute_batch("PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                username TEXT UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin','moderator')),
                email_verified INTEGER NOT NULL DEFAULT 0 CHECK(email_verified IN (0,1)),
                is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
                created_at TEXT NOT NULL, updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS profiles (
                id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                first_name TEXT, last_name TEXT, avatar_url TEXT, bio TEXT, website TEXT, location TEXT,
                created_at TEXT NOT NULL, updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sessions (
                token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires_at INTEGER NOT NULL, remember_me INTEGER NOT NULL CHECK(remember_me IN (0,1)),
                revoked INTEGER NOT NULL DEFAULT 0 CHECK(revoked IN (0,1)), created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
        ").map_err(db_error)?;
        Ok(Self {
            connection: Arc::new(Mutex::new(conn)),
        })
    }
    /// Scoped connection access; downstream modules keep ownership/authorization checks inside transactions.
    pub fn with_conn<T>(&self, f: impl FnOnce(&mut Connection) -> ApiResult<T>) -> ApiResult<T> {
        let mut guard = self.connection.lock().map_err(|_| ApiError::internal())?;
        f(&mut guard)
    }
    pub fn user(&self, id: &str) -> ApiResult<UserDto> {
        self.with_conn(|conn| load_user(conn, id))
    }
}
pub fn user_from_row(row: &Row<'_>) -> rusqlite::Result<UserDto> {
    Ok(UserDto {
        id: row.get(0)?,
        email: row.get(1)?,
        username: row.get(2)?,
        role: row.get(3)?,
        email_verified: row.get(4)?,
        is_active: row.get(5)?,
        created_at: row.get(6)?,
        updated_at: row.get(7)?,
        profile: None,
    })
}
pub const USER_COLUMNS: &str =
    "id,email,username,role,email_verified,is_active,created_at,updated_at";
pub fn load_user(conn: &Connection, id: &str) -> ApiResult<UserDto> {
    let mut user = conn
        .query_row(
            &format!("SELECT {USER_COLUMNS} FROM users WHERE id=?1"),
            [id],
            user_from_row,
        )
        .optional()
        .map_err(db_error)?
        .ok_or_else(|| {
            ApiError::new(
                axum::http::StatusCode::NOT_FOUND,
                "USER_NOT_FOUND",
                "User not found.",
            )
        })?;
    user.profile = conn.query_row("SELECT id,user_id,first_name,last_name,avatar_url,bio,website,location,created_at,updated_at FROM profiles WHERE user_id=?1", params![id], |row| {
        Ok(ProfileDto {id:row.get(0)?,user_id:row.get(1)?,first_name:row.get(2)?,last_name:row.get(3)?,avatar_url:row.get(4)?,bio:row.get(5)?,website:row.get(6)?,location:row.get(7)?,created_at:row.get(8)?,updated_at:row.get(9)?})
    }).optional().map_err(db_error)?;
    Ok(user)
}
