use axum::{
    extract::{Request, State},
    http::{header, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::get,
    Json, Router,
};
use std::{
    io,
    net::{Ipv4Addr, SocketAddrV4},
};
use straw_engine::{db::DbState, flow::FlowRecord};

pub const BIND_ADDRESS: SocketAddrV4 = SocketAddrV4::new(Ipv4Addr::LOCALHOST, 8741);
pub const PWA_ORIGIN: &str = "http://127.0.0.1:8081";

pub fn router(db: DbState) -> Router {
    Router::new()
        .route("/health", get(|| async { "ok" }))
        .route("/flows", get(engine_flows_list))
        .layer(middleware::from_fn(local_browser_origin))
        .with_state(db)
}

// Browser access is restricted to the local PWA origin and existing read routes.
// Native callers without an Origin header retain the existing API behavior.
async fn local_browser_origin(request: Request, next: Next) -> Response {
    let browser = request.headers().contains_key(header::ORIGIN);
    if browser
        && request
            .headers()
            .get(header::ORIGIN)
            .and_then(|h| h.to_str().ok())
            != Some(PWA_ORIGIN)
    {
        return (StatusCode::FORBIDDEN, "browser origin is not allowed").into_response();
    }
    let mut response = next.run(request).await;
    if browser {
        response.headers_mut().insert(
            header::ACCESS_CONTROL_ALLOW_ORIGIN,
            PWA_ORIGIN.parse().unwrap(),
        );
        response
            .headers_mut()
            .insert(header::VARY, "Origin".parse().unwrap());
        response
            .headers_mut()
            .insert(header::CACHE_CONTROL, "no-store".parse().unwrap());
    }
    response
}

async fn engine_flows_list(
    State(db): State<DbState>,
) -> Result<Json<Vec<FlowRecord>>, (StatusCode, String)> {
    tokio::task::spawn_blocking(move || db.list())
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .map(Json)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

pub async fn bind() -> io::Result<tokio::net::TcpListener> {
    tokio::net::TcpListener::bind(BIND_ADDRESS).await
}

pub async fn serve(
    listener: tokio::net::TcpListener,
    db: DbState,
    shutdown: tokio::sync::oneshot::Receiver<()>,
) -> io::Result<()> {
    if listener.local_addr()?.ip() != Ipv4Addr::LOCALHOST {
        return Err(io::Error::other("listener must bind 127.0.0.1"));
    }
    axum::serve(listener, router(db))
        .with_graceful_shutdown(async {
            let _ = shutdown.await;
        })
        .await
}

#[cfg(test)]
mod tests {
    use super::*;
    use tower::ServiceExt;
    #[tokio::test]
    async fn browser_access_allows_only_the_fixed_local_origin_and_no_write_route() {
        let dir = tempfile::tempdir().unwrap();
        let app = router(DbState::open(dir.path().join("origin.db")).unwrap());
        for origin in [
            "https://example.com",
            "null",
            "http://localhost:8081",
            "http://127.0.0.1:8081.evil",
            "http://127.0.0.1:8080",
        ] {
            let response = app
                .clone()
                .oneshot(
                    Request::builder()
                        .uri("/flows")
                        .header(header::ORIGIN, origin)
                        .body(axum::body::Body::empty())
                        .unwrap(),
                )
                .await
                .unwrap();
            assert_eq!(response.status(), StatusCode::FORBIDDEN);
            assert!(!response
                .headers()
                .contains_key(header::ACCESS_CONTROL_ALLOW_ORIGIN));
        }
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/flows")
                    .header(header::ORIGIN, PWA_ORIGIN)
                    .body(axum::body::Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(
            response.headers()[header::ACCESS_CONTROL_ALLOW_ORIGIN],
            PWA_ORIGIN
        );
        assert_eq!(response.headers()[header::CACHE_CONTROL], "no-store");
        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/flows")
                    .header(header::ORIGIN, PWA_ORIGIN)
                    .body(axum::body::Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::METHOD_NOT_ALLOWED);
    }
    #[test]
    fn production_listener_is_exact_ipv4_loopback() {
        assert_eq!(BIND_ADDRESS.ip().octets(), [127, 0, 0, 1]);
        assert_eq!(BIND_ADDRESS.port(), 8741);
    }
    #[tokio::test]
    async fn real_server_lists_real_sqlite_rows() {
        let _production_port = tokio::net::TcpListener::bind(BIND_ADDRESS).await.ok();
        let dir = tempfile::tempdir().unwrap();
        let db = DbState::open(dir.path().join("flows.db")).unwrap();
        let flow = db.save(FlowRecord::new("server proof".into())).unwrap();
        let listener = tokio::net::TcpListener::bind((Ipv4Addr::LOCALHOST, 0))
            .await
            .unwrap();
        let address = listener.local_addr().unwrap();
        let (stop, signal) = tokio::sync::oneshot::channel();
        let task = tokio::spawn(serve(listener, db, signal));
        let flows_url = format!("http://{address}/flows");
        let health_url = format!("http://{address}/health");
        let body = tokio::task::spawn_blocking(move || {
            straw_engine::network::request("GET", &flows_url, &Default::default(), "").unwrap()
        })
        .await
        .unwrap();
        assert_eq!(body.0, 200);
        let rows: Vec<FlowRecord> = serde_json::from_str(&body.1).unwrap();
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].id, flow.id);
        assert_eq!(rows[0].name, flow.name);
        assert_eq!(rows[0].created_at, flow.created_at);
        assert_eq!(rows[0].updated_at, flow.updated_at);
        let health = tokio::task::spawn_blocking(move || {
            straw_engine::network::request("GET", &health_url, &Default::default(), "").unwrap()
        })
        .await
        .unwrap();
        assert_eq!(health, (200, "ok".into()));
        stop.send(()).unwrap();
        task.await.unwrap().unwrap();
        tokio::net::TcpListener::bind(address).await.unwrap();
    }

    #[tokio::test]
    async fn serve_rejects_non_loopback_listeners_and_releases_the_port() {
        let wildcard = tokio::net::TcpListener::bind((Ipv4Addr::UNSPECIFIED, 0))
            .await
            .unwrap();
        let wildcard_port = wildcard.local_addr().unwrap().port();
        let dir = tempfile::tempdir().unwrap();
        let db = DbState::open(dir.path().join("reject.db")).unwrap();
        let (_stop, signal) = tokio::sync::oneshot::channel();
        let error = serve(wildcard, db, signal).await.unwrap_err();
        assert!(error.to_string().contains("127.0.0.1"));
        tokio::net::TcpListener::bind((Ipv4Addr::UNSPECIFIED, wildcard_port))
            .await
            .unwrap();

        let ipv6 = tokio::net::TcpListener::bind((std::net::Ipv6Addr::LOCALHOST, 0)).await;
        if let Ok(ipv6) = ipv6 {
            let dir = tempfile::tempdir().unwrap();
            let db = DbState::open(dir.path().join("ipv6.db")).unwrap();
            let (_stop, signal) = tokio::sync::oneshot::channel();
            let error = serve(ipv6, db, signal).await.unwrap_err();
            assert!(error.to_string().contains("127.0.0.1"));
        }
    }
}
