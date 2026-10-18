use axum::{routing::get, Router};
use std::net::SocketAddr;

pub struct ApiServer;

impl ApiServer {
    pub async fn start(port: u16) {
        let app = Router::new()
            .route("/", get(|| async { "SaaS API v1.0" }))
            .route("/health", get(|| async { "OK" }));

        let addr = SocketAddr::from(([127, 0, 0, 1], port));
        println!("API Server listening on {}", addr);
        // axum::Server::bind(&addr).serve(app.into_make_service()).await.unwrap();
    }
}
