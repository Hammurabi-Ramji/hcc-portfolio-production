use crate::{
    store::{db_error, load_user, now, random_id, timestamp},
    success, ApiError, ApiResult, AppState, UserDto,
};
use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use axum::{
    extract::{rejection::JsonRejection, State},
    http::{header, HeaderMap, HeaderValue, StatusCode},
    response::Response,
    routing::{get, post},
    Json, Router,
};
use rand::{rngs::OsRng, RngCore};
use rusqlite::{params, OptionalExtension};
use serde::Deserialize;
use sha2::{Digest, Sha256};

pub const COOKIE_NAME: &str = "straw_session";
pub const SESSION_SECONDS: i64 = 8 * 60 * 60;
pub const REMEMBER_SECONDS: i64 = 30 * 24 * 60 * 60;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RegisterRequest {
    email: String,
    password: String,
    username: Option<String>,
    first_name: Option<String>,
    last_name: Option<String>,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct LoginRequest {
    email: String,
    password: String,
    #[serde(default)]
    remember_me: bool,
}
struct ValidatedRegistration(RegisterRequest);
impl RegisterRequest {
    fn validate(mut self) -> ApiResult<ValidatedRegistration> {
        self.email = validate_email(&self.email)?;
        validate_password(&self.password)?;
        if let Some(username) = &self.username {
            if !(3..=64).contains(&username.len())
                || !username
                    .bytes()
                    .all(|b| b.is_ascii_alphanumeric() || b == b'_' || b == b'-')
            {
                return Err(ApiError::invalid());
            }
        }
        validate_name(self.first_name.as_deref())?;
        validate_name(self.last_name.as_deref())?;
        Ok(ValidatedRegistration(self))
    }
}
pub fn validate_email(raw: &str) -> ApiResult<String> {
    let email = raw.trim().to_ascii_lowercase();
    if email.len() > 254
        || !email.is_ascii()
        || email
            .bytes()
            .any(|b| b.is_ascii_whitespace() || b.is_ascii_control())
    {
        return Err(ApiError::invalid());
    }
    let parts: Vec<_> = email.split('@').collect();
    if parts.len() != 2
        || parts[0].is_empty()
        || parts[0].len() > 64
        || parts[1].starts_with('.')
        || parts[1].ends_with('.')
        || !parts[1].contains('.')
        || parts[1].contains("..")
    {
        return Err(ApiError::invalid());
    }
    if !parts[0]
        .bytes()
        .all(|b| b.is_ascii_alphanumeric() || b".!#$%&'*+-/=?^_`{|}~".contains(&b))
        || !parts[1]
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'.' || b == b'-')
    {
        return Err(ApiError::invalid());
    }
    Ok(email)
}
pub fn validate_password(password: &str) -> ApiResult<()> {
    if !(8..=128).contains(&password.len()) || password.chars().any(char::is_control) {
        Err(ApiError::invalid())
    } else {
        Ok(())
    }
}
fn validate_name(name: Option<&str>) -> ApiResult<()> {
    if name.is_some_and(|value| value.len() > 100 || value.chars().any(char::is_control)) {
        Err(ApiError::invalid())
    } else {
        Ok(())
    }
}
pub fn hash_password(password: &str) -> ApiResult<String> {
    validate_password(password)?;
    let mut salt = [0u8; 16];
    OsRng
        .try_fill_bytes(&mut salt)
        .map_err(|_| ApiError::internal())?;
    let salt = SaltString::encode_b64(&salt).map_err(|_| ApiError::internal())?;
    Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map(|v| v.to_string())
        .map_err(|_| ApiError::internal())
}
pub fn verify_password(password: &str, hash: &str) -> ApiResult<()> {
    let parsed = PasswordHash::new(hash).map_err(|_| ApiError::internal())?;
    Argon2::default()
        .verify_password(password.as_bytes(), &parsed)
        .map_err(|_| {
            ApiError::new(
                StatusCode::UNAUTHORIZED,
                "INVALID_CREDENTIALS",
                "Email or password is incorrect.",
            )
        })
}
fn token_hash(token: &str) -> String {
    Sha256::digest(token.as_bytes())
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect()
}
/// Untrusted cookie becomes a validated session only through persisted session/user checks.
struct Credential(String);
impl Credential {
    fn from_headers(headers: &HeaderMap) -> ApiResult<Self> {
        let mut found = None;
        for line in headers.get_all(header::COOKIE) {
            let line = line.to_str().map_err(|_| ApiError::unauthorized())?;
            for pair in line.split(';') {
                if let Some((key, value)) = pair.trim().split_once('=') {
                    if key == COOKIE_NAME {
                        if found.is_some()
                            || value.len() != 64
                            || !value
                                .bytes()
                                .all(|b| b.is_ascii_hexdigit() && !b.is_ascii_uppercase())
                        {
                            return Err(ApiError::unauthorized());
                        }
                        found = Some(value.to_owned());
                    }
                }
            }
        }
        found.map(Self).ok_or_else(ApiError::unauthorized)
    }
    fn validate(self, state: &AppState) -> ApiResult<ValidSession> {
        let hash = token_hash(&self.0);
        state.store.with_conn(|conn| {
            let data: Option<(String,bool)> = conn.query_row("SELECT s.user_id,s.remember_me FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?1 AND s.revoked=0 AND s.expires_at>?2 AND u.is_active=1",params![hash,now()],|row| Ok((row.get(0)?,row.get(1)?))).optional().map_err(db_error)?;
            let (id,remember_me) = data.ok_or_else(ApiError::unauthorized)?;
            Ok(ValidSession { user:load_user(conn,&id)?, hash, remember_me })
        })
    }
}
pub struct ValidSession {
    pub user: UserDto,
    hash: String,
    remember_me: bool,
}
pub fn authenticate(state: &AppState, headers: &HeaderMap) -> ApiResult<ValidSession> {
    Credential::from_headers(headers)?.validate(state)
}
impl ValidSession {
    /// Recheck the credential in the caller's transaction without reacquiring Store's mutex.
    /// Returns current persisted identity/role, never the session credential.
    pub fn revalidate(&self, conn: &rusqlite::Connection) -> ApiResult<UserDto> {
        let id: Option<String> = conn.query_row(
            "SELECT s.user_id FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?1 AND s.revoked=0 AND s.expires_at>?2 AND u.is_active=1",
            params![self.hash, now()], |row| row.get(0)
        ).optional().map_err(db_error)?;
        load_user(conn, &id.ok_or_else(ApiError::unauthorized)?)
    }
    pub fn require_roles(&self, roles: &[&str]) -> ApiResult<()> {
        if roles.contains(&self.user.role.as_str()) {
            Ok(())
        } else {
            Err(ApiError::forbidden())
        }
    }
    pub fn require_owner_or_admin(&self, owner: &str) -> ApiResult<()> {
        if self.user.id == owner || self.user.role == "admin" {
            Ok(())
        } else {
            Err(ApiError::forbidden())
        }
    }
    fn revoke(self, state: &AppState) -> ApiResult<RevokedSession> {
        state.store.with_conn(|conn| {
            let count = conn.execute("UPDATE sessions SET revoked=1 WHERE token_hash=?1 AND revoked=0 AND expires_at>?2",params![self.hash,now()]).map_err(db_error)?;
            if count != 1 { return Err(ApiError::unauthorized()); }
            Ok(RevokedSession)
        })
    }
    fn rotate(self, state: &AppState) -> ApiResult<IssuedSession> {
        state.store.with_conn(|conn| {
            let tx = conn.transaction().map_err(db_error)?;
            let count = tx.execute("UPDATE sessions SET revoked=1 WHERE token_hash=?1 AND revoked=0 AND expires_at>?2 AND EXISTS(SELECT 1 FROM users WHERE id=user_id AND is_active=1)",params![self.hash,now()]).map_err(db_error)?;
            if count != 1 { return Err(ApiError::unauthorized()); }
            let user = load_user(&tx,&self.user.id)?;
            let issued = issue(&tx,user,self.remember_me)?;
            tx.commit().map_err(db_error)?;
            Ok(issued)
        })
    }
}
struct RevokedSession;
struct IssuedSession {
    user: UserDto,
    token: String,
    seconds: i64,
    persistent: bool,
}
fn issue(conn: &rusqlite::Connection, user: UserDto, persistent: bool) -> ApiResult<IssuedSession> {
    if !user.is_active {
        return Err(ApiError::unauthorized());
    }
    let token = random_id()?;
    let seconds = if persistent {
        REMEMBER_SECONDS
    } else {
        SESSION_SECONDS
    };
    conn.execute("INSERT INTO sessions(token_hash,user_id,expires_at,remember_me,created_at) VALUES (?1,?2,?3,?4,?5)",params![token_hash(&token),user.id,now()+seconds,persistent,timestamp()]).map_err(db_error)?;
    Ok(IssuedSession {
        user,
        token,
        seconds,
        persistent,
    })
}
fn cookie(state: &AppState, value: &str, max_age: Option<i64>) -> ApiResult<HeaderValue> {
    let mut raw = format!("{COOKIE_NAME}={value}; HttpOnly; SameSite=Strict; Path=/");
    if let Some(age) = max_age {
        raw.push_str(&format!("; Max-Age={age}"));
    }
    if state.config.secure_cookie {
        raw.push_str("; Secure");
    }
    HeaderValue::from_str(&raw).map_err(|_| ApiError::internal())
}
impl IssuedSession {
    fn response(self, state: &AppState, status: StatusCode) -> ApiResult<Response> {
        let header = cookie(
            state,
            &self.token,
            if self.persistent {
                Some(self.seconds)
            } else {
                None
            },
        )?;
        let mut response = success(serde_json::json!({"user":self.user}));
        *response.status_mut() = status;
        response.headers_mut().insert(header::SET_COOKIE, header);
        Ok(response)
    }
}
fn parse<T>(input: Result<Json<T>, JsonRejection>) -> ApiResult<T> {
    input.map(|Json(v)| v).map_err(|_| ApiError::invalid())
}
async fn blocking<T: Send + 'static>(
    f: impl FnOnce() -> ApiResult<T> + Send + 'static,
) -> ApiResult<T> {
    tokio::task::spawn_blocking(f)
        .await
        .map_err(|_| ApiError::internal())?
}
async fn register(
    State(state): State<AppState>,
    input: Result<Json<RegisterRequest>, JsonRejection>,
) -> ApiResult<Response> {
    let validated = parse(input)?.validate()?;
    let worker = state.clone();
    let issued = blocking(move || {
        let ValidatedRegistration(input) = validated;
        let password_hash = hash_password(&input.password)?;
        worker.store.with_conn(|conn| {
            let tx = conn.transaction().map_err(db_error)?;
            let id = random_id()?; let profile_id=random_id()?; let time=timestamp();
            tx.execute("INSERT INTO users(id,email,username,password_hash,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?5)",params![id,input.email,input.username,password_hash,time]).map_err(db_error)?;
            tx.execute("INSERT INTO profiles(id,user_id,first_name,last_name,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?5)",params![profile_id,id,input.first_name,input.last_name,time]).map_err(db_error)?;
            let issued=issue(&tx,load_user(&tx,&id)?,false)?;
            tx.commit().map_err(db_error)?; Ok(issued)
        })
    }).await?;
    issued.response(&state, StatusCode::CREATED)
}
async fn login(
    State(state): State<AppState>,
    input: Result<Json<LoginRequest>, JsonRejection>,
) -> ApiResult<Response> {
    let input = parse(input)?;
    let email = validate_email(&input.email)?;
    validate_password(&input.password)?;
    let worker = state.clone();
    let issued = blocking(move || {
        let record: Option<(String, String)> = worker.store.with_conn(|conn| {
            conn.query_row(
                "SELECT id,password_hash FROM users WHERE email=?1",
                [email],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .optional()
            .map_err(db_error)
        })?;
        // Use an Argon2 hash even for unknown accounts to avoid an inexpensive enumeration path.
        let (id, hash) = match record {
            Some(v) => v,
            None => {
                let hash = hash_password("missing-account-password")?;
                let _ = verify_password(&input.password, &hash);
                return Err(ApiError::new(
                    StatusCode::UNAUTHORIZED,
                    "INVALID_CREDENTIALS",
                    "Email or password is incorrect.",
                ));
            }
        };
        verify_password(&input.password, &hash)?;
        worker
            .store
            .with_conn(|conn| issue(conn, load_user(conn, &id)?, input.remember_me))
    })
    .await?;
    issued.response(&state, StatusCode::OK)
}
async fn me(State(state): State<AppState>, headers: HeaderMap) -> ApiResult<Response> {
    let user = blocking(move || Ok(authenticate(&state, &headers)?.user)).await?;
    Ok(success(user))
}
async fn refresh(State(state): State<AppState>, headers: HeaderMap) -> ApiResult<Response> {
    let worker = state.clone();
    let issued = blocking(move || authenticate(&worker, &headers)?.rotate(&worker)).await?;
    issued.response(&state, StatusCode::OK)
}
async fn logout(State(state): State<AppState>, headers: HeaderMap) -> ApiResult<Response> {
    let worker = state.clone();
    let _revoked = blocking(move || authenticate(&worker, &headers)?.revoke(&worker)).await?;
    let mut response = success(serde_json::Value::Null);
    response
        .headers_mut()
        .insert(header::SET_COOKIE, cookie(&state, "", Some(0))?);
    Ok(response)
}
async fn unsupported() -> ApiError {
    ApiError::new(StatusCode::NOT_IMPLEMENTED,"UNSUPPORTED","Email verification and password recovery require an email transport and are unavailable in this local service.")
}
pub fn router() -> Router<AppState> {
    Router::new()
        .route("/api/auth/register", post(register))
        .route("/api/auth/login", post(login))
        .route("/api/auth/logout", post(logout))
        .route("/api/auth/me", get(me))
        .route("/api/auth/refresh-token", post(refresh))
        .route("/api/auth/verify-email", get(unsupported).post(unsupported))
        .route("/api/auth/forgot-password", post(unsupported))
        .route("/api/auth/reset-password", post(unsupported))
}
/// Local operator action only; no HTTP route accepts a role or calls this function.
pub fn bootstrap_admin(state: &AppState, email: &str, password: &str) -> ApiResult<()> {
    let email = validate_email(email)?;
    let hash = hash_password(password)?;
    state.store.with_conn(|conn| {
        let tx=conn.transaction().map_err(db_error)?; let id=random_id()?; let time=timestamp();
        tx.execute("INSERT INTO users(id,email,password_hash,role,created_at,updated_at) VALUES (?1,?2,?3,'admin',?4,?4)",params![id,email,hash,time]).map_err(db_error)?;
        tx.execute("INSERT INTO profiles(id,user_id,created_at,updated_at) VALUES (?1,?2,?3,?3)",params![random_id()?,id,time]).map_err(db_error)?;
        tx.commit().map_err(db_error)
    })
}
