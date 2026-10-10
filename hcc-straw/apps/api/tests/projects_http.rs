use axum::http::StatusCode;
use reqwest::{Client, Response};
use serde_json::{json, Value};
use std::{error::Error, path::Path};
use straw_web_api::{router, AppState, Config, Store};
use tokio::{sync::oneshot, task::JoinHandle};

type TestResult = Result<(), Box<dyn Error>>;

struct Server {
    base: String,
    state: AppState,
    stop: oneshot::Sender<()>,
    task: JoinHandle<Result<(), std::io::Error>>,
}

impl Server {
    async fn start(path: &Path, origin: &str) -> Result<Self, Box<dyn Error>> {
        let state = AppState::new(Store::open(path)?, Config::new(origin, 3001, path.into())?);
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await?;
        let base = format!("http://{}", listener.local_addr()?);
        let (stop, rx) = oneshot::channel();
        let app = router(state.clone());
        let task = tokio::spawn(async move {
            axum::serve(listener, app)
                .with_graceful_shutdown(async {
                    let _ = rx.await;
                })
                .await
        });
        Ok(Self { base, state, stop, task })
    }

    async fn shutdown(self) -> TestResult {
        let _ = self.stop.send(());
        self.task.await??;
        Ok(())
    }
}

fn origin_request(client: &Client, server: &Server, method: &str, path: &str) -> reqwest::RequestBuilder {
    client.request(method.parse().unwrap(), format!("{}{path}", server.base))
        .header("origin", &server.state.config.web_origin)
}

fn cookie(response: &Response) -> Result<String, Box<dyn Error>> {
    Ok(response.headers().get("set-cookie").ok_or("missing cookie")?.to_str()?
        .split(';').next().ok_or("empty cookie")?.to_owned())
}

async fn status_code(response: Response, status: u16, code: &str) -> TestResult {
    assert_eq!(response.status().as_u16(), status);
    let body: Value = response.json().await?;
    assert_eq!(body["success"], false);
    assert_eq!(body["error"]["code"], code);
    Ok(())
}

async fn register(client: &Client, server: &Server, email: &str, username: &str) -> Result<String, Box<dyn Error>> {
    let response = origin_request(client, server, "POST", "/api/auth/register")
        .json(&json!({"email": email, "password": "long-enough-password", "username": username}))
        .send().await?;
    assert_eq!(response.status(), StatusCode::CREATED);
    cookie(&response)
}

#[tokio::test]
async fn login_reload_logout_expired_forged_and_wrong_owner_survive_restart() -> TestResult {
    let directory = tempfile::tempdir()?;
    let db = directory.path().join("projects.sqlite3");
    let mut server = Server::start(&db, "http://127.0.0.1:3000").await?;
    let client = Client::builder().no_proxy().build()?;

    let owner_cookie = register(&client, &server, "owner@example.test", "owner").await?;
    let me = origin_request(&client, &server, "GET", "/api/auth/me")
        .header("cookie", &owner_cookie).send().await?;
    assert_eq!(me.status(), StatusCode::OK);
    let me_body: Value = me.json().await?;
    assert_eq!(me_body["data"]["email"], "owner@example.test");

    let created = origin_request(&client, &server, "POST", "/api/projects")
        .header("cookie", &owner_cookie)
        .json(&json!({"name": "Owned ledger", "description": "persisted", "status": "active"}))
        .send().await?;
    assert_eq!(created.status(), StatusCode::CREATED);
    let created_body: Value = created.json().await?;
    let project_id = created_body["data"]["id"].as_str().ok_or("missing project")?.to_owned();
    assert_eq!(created_body["data"]["createdBy"], me_body["data"]["id"]);
    assert!(created_body["data"]["createdAt"].as_str().unwrap().contains('T'));

    let other_cookie = register(&client, &server, "other@example.test", "other").await?;
    status_code(
        origin_request(&client, &server, "GET", &format!("/api/projects/{project_id}"))
            .header("cookie", &other_cookie).send().await?,
        403, "FORBIDDEN",
    ).await?;
    let other_list: Value = origin_request(&client, &server, "GET", "/api/projects")
        .header("cookie", &other_cookie).send().await?.json().await?;
    assert_eq!(other_list["data"]["meta"]["total"], 0);

    status_code(
        origin_request(&client, &server, "GET", "/api/projects").send().await?,
        401, "UNAUTHORIZED",
    ).await?;
    status_code(
        origin_request(&client, &server, "GET", "/api/auth/me")
            .header("cookie", "straw_session=forged").send().await?,
        401, "UNAUTHORIZED",
    ).await?;

    let logged_out = origin_request(&client, &server, "POST", "/api/auth/logout")
        .header("cookie", &owner_cookie).send().await?;
    assert_eq!(logged_out.status(), StatusCode::OK);
    status_code(
        origin_request(&client, &server, "GET", "/api/auth/me")
            .header("cookie", &owner_cookie).send().await?,
        401, "UNAUTHORIZED",
    ).await?;

    let relogin = origin_request(&client, &server, "POST", "/api/auth/login")
        .json(&json!({"email": "owner@example.test", "password": "long-enough-password"}))
        .send().await?;
    assert_eq!(relogin.status(), StatusCode::OK);
    let fresh = cookie(&relogin)?;
    server.state.store.with_conn(|conn| {
        conn.execute("UPDATE sessions SET expires_at=0 WHERE token_hash!=''", [])
            .map_err(straw_web_api::store::db_error)?;
        Ok(())
    })?;
    status_code(
        origin_request(&client, &server, "GET", "/api/auth/me").header("cookie", &fresh).send().await?,
        401, "UNAUTHORIZED",
    ).await?;
    status_code(
        origin_request(&client, &server, "GET", &format!("/api/projects/{project_id}"))
            .header("cookie", &fresh).send().await?,
        401, "UNAUTHORIZED",
    ).await?;

    let restored = origin_request(&client, &server, "POST", "/api/auth/login")
        .json(&json!({"email": "owner@example.test", "password": "long-enough-password"}))
        .send().await?;
    let restored_cookie = cookie(&restored)?;
    server.shutdown().await?;
    server = Server::start(&db, "http://127.0.0.1:3000").await?;
    let after: Value = origin_request(&client, &server, "GET", &format!("/api/projects/{project_id}"))
        .header("cookie", &restored_cookie).send().await?.json().await?;
    assert_eq!(after["success"], true);
    assert_eq!(after["data"]["name"], "Owned ledger");
    assert_eq!(after["data"]["description"], "persisted");
    server.shutdown().await?;
    Ok(())
}
