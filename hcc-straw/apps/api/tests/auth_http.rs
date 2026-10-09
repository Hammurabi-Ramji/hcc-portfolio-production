use axum::http::StatusCode;
use reqwest::{Client, Response};
use serde_json::{json, Value};
use std::{error::Error, path::Path};
use straw_web_api::{
    auth::{self, COOKIE_NAME, REMEMBER_SECONDS, SESSION_SECONDS},
    router, AppState, Config, Store,
};
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
        Ok(Self {
            base,
            state,
            stop,
            task,
        })
    }
    async fn shutdown(self) -> TestResult {
        let _ = self.stop.send(());
        self.task.await??;
        Ok(())
    }
}
fn post(client: &Client, server: &Server, endpoint: &str) -> reqwest::RequestBuilder {
    client
        .post(format!("{}/api/auth/{endpoint}", server.base))
        .header("origin", &server.state.config.web_origin)
}
fn cookie(response: &Response) -> Result<String, Box<dyn Error>> {
    Ok(response
        .headers()
        .get("set-cookie")
        .ok_or("missing cookie")?
        .to_str()?
        .split(';')
        .next()
        .ok_or("empty cookie")?
        .to_owned())
}
async fn error(response: Response, status: u16, code: &str) -> TestResult {
    assert_eq!(response.status().as_u16(), status);
    assert_eq!(
        response
            .headers()
            .get("cache-control")
            .ok_or("missing no-store")?,
        "no-store"
    );
    let body: Value = response.json().await?;
    assert_eq!(body["success"], false);
    assert_eq!(body["error"]["code"], code);
    assert_eq!(body["error"]["status"], status);
    assert!(body.get("data").is_none());
    assert!(body["error"]["message"].is_string());
    Ok(())
}
#[tokio::test]
async fn durable_cookie_lifecycle_over_real_loopback_http() -> TestResult {
    let directory = tempfile::tempdir()?;
    let db = directory.path().join("sessions.sqlite3");
    let mut server = Server::start(&db, "http://localhost:3000").await?;
    let client = Client::builder().no_proxy().build()?;
    let registration = json!({"email":"Owner@Example.test","password":"long-enough-password","username":"owner","firstName":"First","lastName":"Last"});
    let response = post(&client, &server, "register")
        .json(&registration)
        .send()
        .await?;
    assert_eq!(response.status(), StatusCode::CREATED);
    let session_cookie = cookie(&response)?;
    let token = session_cookie
        .split('=')
        .nth(1)
        .ok_or("missing token")?
        .to_owned();
    let header = response
        .headers()
        .get("set-cookie")
        .ok_or("missing cookie")?
        .to_str()?
        .to_owned();
    for attr in ["HttpOnly", "SameSite=Strict", "Path=/"] {
        assert!(header.contains(attr));
    }
    assert!(!header.contains("Max-Age"));
    assert!(!header.contains("Secure"));
    let body: Value = response.json().await?;
    assert_eq!(body["success"], true);
    assert!(body["data"].get("accessToken").is_none());
    let user = &body["data"]["user"];
    let id = user["id"].as_str().ok_or("missing id")?.to_owned();
    assert_eq!(user["email"], "owner@example.test");
    assert_eq!(user["role"], "user");
    assert_eq!(user["emailVerified"], false);
    assert_eq!(user["isActive"], true);
    assert_eq!(user["profile"]["firstName"], "First");
    assert_eq!(user["profile"]["lastName"], "Last");
    for field in ["createdAt", "updatedAt"] {
        chrono::DateTime::parse_from_rfc3339(user[field].as_str().ok_or("timestamp not string")?)?;
    }
    server.state.store.with_conn(|conn| {
        let hash: String = conn
            .query_row("SELECT password_hash FROM users WHERE id=?1", [&id], |r| {
                r.get(0)
            })
            .map_err(straw_web_api::store::db_error)?;
        assert!(hash.starts_with("$argon2id$"));
        assert!(!hash.contains("long-enough-password"));
        let (stored, expiry, remember): (String, i64, bool) = conn
            .query_row(
                "SELECT token_hash,expires_at,remember_me FROM sessions WHERE user_id=?1",
                [&id],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
            )
            .map_err(straw_web_api::store::db_error)?;
        assert_ne!(stored, token);
        assert_eq!(stored.len(), 64);
        assert!(!remember);
        assert!((SESSION_SECONDS - 10..=SESSION_SECONDS)
            .contains(&(expiry - straw_web_api::store::now())));
        Ok(())
    })?;
    error(
        post(&client, &server, "register")
            .json(&registration)
            .send()
            .await?,
        409,
        "RESOURCE_CONFLICT",
    )
    .await?;
    error(
        client
            .get(format!("{}/api/auth/me", server.base))
            .send()
            .await?,
        401,
        "UNAUTHORIZED",
    )
    .await?;
    for credential in [
        "straw_session=forged".to_owned(),
        format!("straw_session={}", "a".repeat(64)),
        format!("{session_cookie}; {session_cookie}"),
    ] {
        error(
            client
                .get(format!("{}/api/auth/me", server.base))
                .header("cookie", credential)
                .send()
                .await?,
            401,
            "UNAUTHORIZED",
        )
        .await?;
    }
    let me: Value = client
        .get(format!("{}/api/auth/me", server.base))
        .header("cookie", &session_cookie)
        .send()
        .await?
        .json()
        .await?;
    assert_eq!(me["data"], *user);
    // Real service shutdown/reopen of the same SQLite file preserves users and credentials.
    server.shutdown().await?;
    server = Server::start(&db, "http://localhost:3000").await?;
    assert_eq!(
        client
            .get(format!("{}/api/auth/me", server.base))
            .header("cookie", &session_cookie)
            .send()
            .await?
            .status(),
        StatusCode::OK
    );
    let refreshed = post(&client, &server, "refresh-token")
        .header("cookie", &session_cookie)
        .send()
        .await?;
    assert_eq!(refreshed.status(), StatusCode::OK);
    let rotated_cookie = cookie(&refreshed)?;
    assert_ne!(session_cookie, rotated_cookie);
    error(
        client
            .get(format!("{}/api/auth/me", server.base))
            .header("cookie", &session_cookie)
            .send()
            .await?,
        401,
        "UNAUTHORIZED",
    )
    .await?;
    let logged_out = post(&client, &server, "logout")
        .header("cookie", &rotated_cookie)
        .send()
        .await?;
    assert_eq!(logged_out.status(), StatusCode::OK);
    assert!(logged_out
        .headers()
        .get("set-cookie")
        .ok_or("missing clear cookie")?
        .to_str()?
        .contains("Max-Age=0"));
    assert_eq!(
        logged_out.json::<Value>().await?,
        json!({"success":true,"data":null})
    );
    error(
        client
            .get(format!("{}/api/auth/me", server.base))
            .header("cookie", &rotated_cookie)
            .send()
            .await?,
        401,
        "UNAUTHORIZED",
    )
    .await?;
    error(
        post(&client, &server, "refresh-token")
            .header("cookie", &rotated_cookie)
            .send()
            .await?,
        401,
        "UNAUTHORIZED",
    )
    .await?;
    error(
        post(&client, &server, "logout").send().await?,
        401,
        "UNAUTHORIZED",
    )
    .await?;
    server.shutdown().await?;
    server = Server::start(&db, "http://localhost:3000").await?;
    for revoked_cookie in [&session_cookie, &rotated_cookie] {
        error(
            client
                .get(format!("{}/api/auth/me", server.base))
                .header("cookie", revoked_cookie)
                .send()
                .await?,
            401,
            "UNAUTHORIZED",
        )
        .await?;
    }

    error(
        post(&client, &server, "login")
            .json(&json!({"email":"owner@example.test","password":"wrong-password"}))
            .send()
            .await?,
        401,
        "INVALID_CREDENTIALS",
    )
    .await?;
    error(
        post(&client, &server, "login")
            .json(&json!({"email":"absent@example.test","password":"wrong-password"}))
            .send()
            .await?,
        401,
        "INVALID_CREDENTIALS",
    )
    .await?;
    let login=post(&client,&server,"login").json(&json!({"email":"owner@example.test","password":"long-enough-password","rememberMe":true})).send().await?;
    assert_eq!(login.status(), StatusCode::OK);
    let remembered = cookie(&login)?;
    assert!(login
        .headers()
        .get("set-cookie")
        .ok_or("missing cookie")?
        .to_str()?
        .contains(&format!("Max-Age={REMEMBER_SECONDS}")));
    server.state.store.with_conn(|conn| {
        let expiry: i64 = conn
            .query_row(
                "SELECT max(expires_at) FROM sessions WHERE user_id=?1",
                [&id],
                |r| r.get(0),
            )
            .map_err(straw_web_api::store::db_error)?;
        assert!((REMEMBER_SECONDS - 10..=REMEMBER_SECONDS)
            .contains(&(expiry - straw_web_api::store::now())));
        Ok(())
    })?;
    // Only one concurrent refresh can consume a persisted credential.
    let (a, b) = tokio::join!(
        post(&client, &server, "refresh-token")
            .header("cookie", &remembered)
            .send(),
        post(&client, &server, "refresh-token")
            .header("cookie", &remembered)
            .send()
    );
    let a = a?;
    let b = b?;
    let mut statuses = vec![a.status().as_u16(), b.status().as_u16()];
    statuses.sort();
    assert_eq!(statuses, vec![200, 401]);
    let winner = if a.status().is_success() { a } else { b };
    let latest = cookie(&winner)?;
    assert!(winner
        .headers()
        .get("set-cookie")
        .ok_or("missing rotated persistent cookie")?
        .to_str()?
        .contains(&format!("Max-Age={REMEMBER_SECONDS}")));
    server.state.store.with_conn(|conn| {
        conn.execute(
            "UPDATE sessions SET expires_at=?1 WHERE user_id=?2",
            rusqlite::params![straw_web_api::store::now() - 1, id],
        )
        .map_err(straw_web_api::store::db_error)?;
        Ok(())
    })?;
    error(
        client
            .get(format!("{}/api/auth/me", server.base))
            .header("cookie", &latest)
            .send()
            .await?,
        401,
        "UNAUTHORIZED",
    )
    .await?;
    error(
        post(&client, &server, "refresh-token")
            .header("cookie", &latest)
            .send()
            .await?,
        401,
        "UNAUTHORIZED",
    )
    .await?;
    let ordinary=post(&client,&server,"login").json(&json!({"email":"owner@example.test","password":"long-enough-password","rememberMe":false})).send().await?;
    let ordinary_cookie = cookie(&ordinary)?;
    assert!(!ordinary
        .headers()
        .get("set-cookie")
        .ok_or("missing cookie")?
        .to_str()?
        .contains("Max-Age"));
    server.state.store.with_conn(|conn| {
        conn.execute("UPDATE users SET is_active=0 WHERE id=?1", [&id])
            .map_err(straw_web_api::store::db_error)?;
        Ok(())
    })?;
    error(
        client
            .get(format!("{}/api/auth/me", server.base))
            .header("cookie", &ordinary_cookie)
            .send()
            .await?,
        401,
        "UNAUTHORIZED",
    )
    .await?;
    error(
        post(&client, &server, "login")
            .json(&json!({"email":"owner@example.test","password":"long-enough-password"}))
            .send()
            .await?,
        401,
        "UNAUTHORIZED",
    )
    .await?;
    server.shutdown().await?;
    println!("Observed real HTTP register/me/restart/rotation/logout/forgery/expiry/rememberMe/active-state/concurrent refresh and canonical envelopes.");
    Ok(())
}
#[tokio::test]
async fn input_origin_unsupported_roles_and_secure_cookie_contracts() -> TestResult {
    let directory = tempfile::tempdir()?;
    let db = directory.path().join("validation.sqlite3");
    let server = Server::start(&db, "https://127.0.0.1:3443").await?;
    let client = Client::builder().no_proxy().build()?;
    for origin in [
        None,
        Some("null"),
        Some("https://localhost:3443"),
        Some("https://127.0.0.1:3444"),
        Some("https://attacker.test"),
    ] {
        let mut request = client
            .post(format!("{}/api/auth/login", server.base))
            .json(&json!({}));
        if let Some(origin) = origin {
            request = request.header("origin", origin);
        }
        error(request.send().await?, 403, "FORBIDDEN_ORIGIN").await?;
    }
    for body in [
        json!({}),
        json!({"email":"bad","password":"long-enough-password"}),
        json!({"email":"ok@example.test","password":"short"}),
        json!({"email":"ok@example.test","password":"long-enough-password","role":"admin"}),
        json!({"email":"ok@example.test","password":"long-enough-password","username":"bad/name"}),
        json!({"email":"ok@example.test","password":"long-enough-password","firstName":"x".repeat(101)}),
    ] {
        error(
            post(&client, &server, "register")
                .json(&body)
                .send()
                .await?,
            400,
            "VALIDATION_ERROR",
        )
        .await?;
    }
    error(
        post(&client, &server, "register").send().await?,
        400,
        "VALIDATION_ERROR",
    )
    .await?;
    error(
        post(&client, &server, "login")
            .header("content-type", "application/json")
            .body("{")
            .send()
            .await?,
        400,
        "VALIDATION_ERROR",
    )
    .await?;
    error(post(&client,&server,"login").json(&json!({"email":"ok@example.test","password":"long-enough-password","rememberMe":"true"})).send().await?,400,"VALIDATION_ERROR").await?;
    error(
        post(&client, &server, "register")
            .json(&json!({"email":"ok@example.test","password":"x".repeat(20000)}))
            .send()
            .await?,
        400,
        "VALIDATION_ERROR",
    )
    .await?;
    for endpoint in ["verify-email", "forgot-password", "reset-password"] {
        error(
            post(&client, &server, endpoint)
                .json(&json!({"token":"untrusted"}))
                .send()
                .await?,
            501,
            "UNSUPPORTED",
        )
        .await?;
    }
    error(
        client
            .get(format!(
                "{}/api/auth/verify-email?token=untrusted",
                server.base
            ))
            .send()
            .await?,
        501,
        "UNSUPPORTED",
    )
    .await?;
    auth::bootstrap_admin(
        &server.state,
        "operator@example.test",
        "admin-local-password",
    )?;
    assert!(
        auth::bootstrap_admin(&server.state, "operator@example.test", "different-password")
            .is_err()
    );
    let admin = post(&client, &server, "login")
        .json(&json!({"email":"operator@example.test","password":"admin-local-password"}))
        .send()
        .await?;
    assert_eq!(admin.status(), StatusCode::OK);
    let admin_cookie = cookie(&admin)?;
    assert!(admin
        .headers()
        .get("set-cookie")
        .ok_or("missing cookie")?
        .to_str()?
        .contains("; Secure"));
    let body: Value = admin.json().await?;
    assert_eq!(body["data"]["user"]["role"], "admin");
    assert_eq!(body["data"]["user"]["emailVerified"], false);
    let mut headers = axum::http::HeaderMap::new();
    headers.insert("cookie", admin_cookie.parse()?);
    let session = auth::authenticate(&server.state, &headers)?;
    session.require_roles(&["admin"])?;
    session.require_owner_or_admin("another-user")?;
    let ordinary = post(&client, &server, "register")
        .json(&json!({"email":"ordinary@example.test","password":"ordinary-password"}))
        .send()
        .await?;
    let ordinary_cookie = cookie(&ordinary)?;
    headers.insert("cookie", ordinary_cookie.parse()?);
    let session = auth::authenticate(&server.state, &headers)?;
    assert_eq!(
        session
            .require_roles(&["admin"])
            .err()
            .ok_or("missing denial")?
            .status,
        StatusCode::FORBIDDEN
    );
    assert_eq!(
        session
            .require_owner_or_admin("another-user")
            .err()
            .ok_or("missing denial")?
            .status,
        StatusCode::FORBIDDEN
    );
    session.require_owner_or_admin(&session.user.id)?;
    error(
        client
            .get(format!("{}/api/auth/unknown", server.base))
            .send()
            .await?,
        404,
        "RESOURCE_NOT_FOUND",
    )
    .await?;
    error(
        client
            .get(format!("{}/api/auth/login", server.base))
            .send()
            .await?,
        405,
        "METHOD_NOT_ALLOWED",
    )
    .await?;
    server.shutdown().await?;
    println!("Observed exact Origin, validation, truthful unsupported endpoints, admin bootstrap/role checks and HTTPS Secure cookie.");
    Ok(())
}
#[test]
fn listener_configuration_is_literal_loopback() -> TestResult {
    for origin in [
        "https://remote.test",
        "http://localhost:3000/path",
        "http://user@localhost:3000",
        "ftp://localhost:3000",
        "http://localhost:3000?x=1",
        "http://localhost:3000/#fragment",
    ] {
        assert!(Config::new(origin, 3001, "test.sqlite3".into()).is_err());
    }
    assert!(Config::new("http://localhost:3000", 0, "test.sqlite3".into()).is_err());
    let configured = Config::new("http://localhost:3000", 3001, "test.sqlite3".into())?;
    assert_eq!(configured.address().to_string(), "127.0.0.1:3001");
    assert_eq!(COOKIE_NAME, "straw_session");
    Ok(())
}

#[test]
fn local_operator_cli_creates_admin_from_stdin_without_http() -> TestResult {
    use std::{
        io::Write,
        process::{Command, Stdio},
    };
    let directory = tempfile::tempdir()?;
    let db = directory.path().join("operator.sqlite3");
    let mut command = Command::new(env!("CARGO_BIN_EXE_straw-web-api"));
    command
        .args(["bootstrap-admin", "operator@example.test"])
        .env("STRAW_API_DATABASE", &db)
        .env("STRAW_WEB_ORIGIN", "http://localhost:3000")
        .env("STRAW_API_PORT", "3001")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    let mut child = command.spawn()?;
    let mut input = child.stdin.take().ok_or("missing operator stdin")?;
    input.write_all(b"local-operator-password\n")?;
    drop(input);
    let output = child.wait_with_output()?;
    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout)?;
    let stderr = String::from_utf8(output.stderr)?;
    assert!(!stdout.contains("local-operator-password"));
    assert!(!stderr.contains("local-operator-password"));
    let store = Store::open(&db)?;
    store.with_conn(|conn| {
        let (role, verified): (String, bool) = conn
            .query_row(
                "SELECT role,email_verified FROM users WHERE email='operator@example.test'",
                [],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .map_err(straw_web_api::store::db_error)?;
        assert_eq!(role, "admin");
        assert!(!verified);
        Ok(())
    })?;
    Ok(())
}
