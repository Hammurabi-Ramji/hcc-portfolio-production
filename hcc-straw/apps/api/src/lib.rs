use axum::{
    extract::{DefaultBodyLimit, Request, State},
    http::{header, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    Json, Router,
};
use serde::Serialize;
use std::sync::Arc;

pub mod auth;
pub mod config;
pub mod store;
pub mod users;
// Serialized owner F008 may add the projects module and merge its router here.

pub use config::Config;
pub use store::{ProfileDto, Store, UserDto};

#[derive(Clone)]
pub struct AppState {
    pub store: Store,
    pub config: Arc<Config>,
}
impl AppState {
    pub fn new(store: Store, config: Config) -> Self {
        Self {
            store,
            config: Arc::new(config),
        }
    }
}

#[derive(Debug)]
pub struct ApiError {
    pub status: StatusCode,
    pub code: &'static str,
    pub message: &'static str,
}
impl std::fmt::Display for ApiError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}: {}", self.code, self.message)
    }
}
impl std::error::Error for ApiError {}
pub type ApiResult<T> = Result<T, ApiError>;
impl ApiError {
    pub fn new(status: StatusCode, code: &'static str, message: &'static str) -> Self {
        Self {
            status,
            code,
            message,
        }
    }
    pub fn invalid() -> Self {
        Self::new(
            StatusCode::BAD_REQUEST,
            "VALIDATION_ERROR",
            "Invalid request fields.",
        )
    }
    pub fn unauthorized() -> Self {
        Self::new(
            StatusCode::UNAUTHORIZED,
            "UNAUTHORIZED",
            "A valid active session is required.",
        )
    }
    pub fn forbidden() -> Self {
        Self::new(
            StatusCode::FORBIDDEN,
            "FORBIDDEN",
            "This operation is not permitted.",
        )
    }
    pub fn internal() -> Self {
        Self::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            "INTERNAL_ERROR",
            "The local service could not complete the request.",
        )
    }
}
impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (self.status, Json(serde_json::json!({"success":false,"error":{"code":self.code,"message":self.message,"status":self.status.as_u16()}}))).into_response()
    }
}
pub fn success<T: Serialize>(data: T) -> Response {
    Json(serde_json::json!({"success":true,"data":data})).into_response()
}

async fn boundary(State(state): State<AppState>, request: Request, next: Next) -> Response {
    let unsafe_method = !matches!(request.method().as_str(), "GET" | "HEAD" | "OPTIONS");
    let mut response = if unsafe_method
        && request
            .headers()
            .get(header::ORIGIN)
            .and_then(|h| h.to_str().ok())
            != Some(state.config.web_origin.as_str())
    {
        ApiError::new(
            StatusCode::FORBIDDEN,
            "FORBIDDEN_ORIGIN",
            "This request requires the configured local web origin.",
        )
        .into_response()
    } else {
        next.run(request).await
    };
    response.headers_mut().insert(
        header::CACHE_CONTROL,
        header::HeaderValue::from_static("no-store"),
    );
    response
}
async fn missing() -> ApiError {
    ApiError::new(
        StatusCode::NOT_FOUND,
        "RESOURCE_NOT_FOUND",
        "API route not found.",
    )
}
async fn method_not_allowed() -> ApiError {
    ApiError::new(
        StatusCode::METHOD_NOT_ALLOWED,
        "METHOD_NOT_ALLOWED",
        "HTTP method is not supported.",
    )
}
pub fn router(state: AppState) -> Router {
    auth::router()
        .merge(users::router())
        .fallback(missing)
        .method_not_allowed_fallback(method_not_allowed)
        .layer(DefaultBodyLimit::max(16 * 1024))
        .layer(middleware::from_fn_with_state(state.clone(), boundary))
        .with_state(state)
}
