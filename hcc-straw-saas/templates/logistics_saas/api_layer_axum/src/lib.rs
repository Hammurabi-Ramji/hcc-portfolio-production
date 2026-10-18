use axum::{routing::get, Router};
use std::net::SocketAddr;

pub struct ApiServer;

impl ApiServer {
    pub fn create_router() -> Router {
        Router::new()
            .route("/", get(|| async { "SaaS API v1.0" }))
            .route("/health", get(|| async { "OK" }))
    }

    pub async fn start(port: u16) {
        let app = Self::create_router();
        let addr = SocketAddr::from(([127, 0, 0, 1], port));
        println!("API Server listening on {}", addr);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use tower::util::ServiceExt;

    #[tokio::test]
    async fn test_health_check() {
        let app = ApiServer::create_router();
        let response = app
            .oneshot(Request::builder().uri("/health").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
    }
}
