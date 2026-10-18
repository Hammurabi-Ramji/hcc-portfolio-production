use reqwest::{Client, Response};
use serde_json::{json, Value};
use std::{error::Error, path::Path};
use straw_web_api::{auth, router, store::db_error, AppState, Config, Store};
use tokio::{sync::oneshot, task::JoinHandle};
type TestResult = Result<(), Box<dyn Error>>;
struct Server {
    base: String,
    state: AppState,
    stop: oneshot::Sender<()>,
    task: JoinHandle<Result<(), std::io::Error>>,
}
impl Server {
    async fn start(path: &Path) -> Result<Self, Box<dyn Error>> {
        let state = AppState::new(
            Store::open(path)?,
            Config::new("http://localhost:3000", 3001, path.into())?,
        );
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
fn request(
    c: &Client,
    s: &Server,
    method: &str,
    path: &str,
    cookie: Option<&str>,
) -> reqwest::RequestBuilder {
    let mut r = c
        .request(
            method.parse().expect("static test method"),
            format!("{}{path}", s.base),
        )
        .header("origin", "http://localhost:3000");
    if let Some(cookie) = cookie {
        r = r.header("cookie", cookie)
    }
    r
}
fn cookie(r: &Response) -> Result<String, Box<dyn Error>> {
    Ok(r.headers()
        .get("set-cookie")
        .ok_or("missing cookie")?
        .to_str()?
        .split(';')
        .next()
        .ok_or("empty cookie")?
        .to_owned())
}
async fn error(r: Response, status: u16) -> TestResult {
    assert_eq!(r.status().as_u16(), status);
    assert_eq!(
        r.headers()
            .get("cache-control")
            .ok_or("missing cache control")?,
        "no-store"
    );
    let v: Value = r.json().await?;
    assert_eq!(v["success"], false);
    assert_eq!(v["error"]["status"], status);
    assert!(v.get("data").is_none());
    Ok(())
}
async fn admin(c: &Client, s: &Server) -> Result<String, Box<dyn Error>> {
    auth::bootstrap_admin(&s.state, "admin@example.test", "admin-local-password")?;
    let r = request(c, s, "POST", "/api/auth/login", None)
        .json(&json!({"email":"admin@example.test","password":"admin-local-password"}))
        .send()
        .await?;
    assert_eq!(r.status().as_u16(), 200);
    cookie(&r)
}
async fn register(c: &Client, s: &Server, email: &str) -> Result<(String, String), Box<dyn Error>> {
    let r = request(c, s, "POST", "/api/auth/register", None)
        .json(&json!({"email":email,"password":"ordinary-password"}))
        .send()
        .await?;
    assert_eq!(r.status().as_u16(), 201);
    let cookie = cookie(&r)?;
    let v: Value = r.json().await?;
    Ok((
        cookie,
        v["data"]["user"]["id"]
            .as_str()
            .ok_or("missing id")?
            .to_owned(),
    ))
}
fn account() -> Value {
    json!({"email":"Created@Example.test","username":"Created_User","password":"created-password","role":"moderator","firstName":"Created","lastName":"Person"})
}
#[tokio::test]
async fn roles_durable_credentials_instances_and_concurrent_uniqueness() -> TestResult {
    let dir = tempfile::tempdir()?;
    let db = dir.path().join("users.sqlite3");
    let mut a = Server::start(&db).await?;
    let c = Client::builder().no_proxy().build()?;
    let admin = admin(&c, &a).await?;
    let (regular, regular_id) = register(&c, &a, "regular@example.test").await?;
    for credential in [
        None,
        Some("straw_session=forged"),
        Some("straw_session=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
    ] {
        error(
            request(&c, &a, "GET", "/api/users", credential)
                .send()
                .await?,
            401,
        )
        .await?;
        error(
            request(&c, &a, "POST", "/api/users", credential)
                .json(&account())
                .send()
                .await?,
            401,
        )
        .await?;
    }
    for method in ["GET", "POST"] {
        let mut r = request(&c, &a, method, "/api/users", Some(&regular));
        if method == "POST" {
            r = r.json(&account())
        }
        error(r.send().await?, 403).await?;
    }
    let r = request(&c, &a, "POST", "/api/users", Some(&admin))
        .json(&account())
        .send()
        .await?;
    assert_eq!(r.status().as_u16(), 201);
    let body: Value = r.json().await?;
    let user = &body["data"];
    let id = user["id"].as_str().ok_or("id")?.to_owned();
    assert_eq!(id.len(), 64);
    assert_ne!(id, regular_id);
    assert_eq!(user["email"], "created@example.test");
    assert_eq!(user["username"], "created_user");
    assert_eq!(user["role"], "moderator");
    assert_eq!(user["isActive"], true);
    assert_eq!(user["emailVerified"], false);
    assert!(user.get("password").is_none());
    assert!(user.get("passwordHash").is_none());
    for f in ["createdAt", "updatedAt"] {
        chrono::DateTime::parse_from_rfc3339(user[f].as_str().ok_or("timestamp")?)?;
    }
    a.state.store.with_conn(|conn| {
        let hash: String = conn
            .query_row("SELECT password_hash FROM users WHERE id=?1", [&id], |r| {
                r.get(0)
            })
            .map_err(db_error)?;
        assert!(hash.starts_with("$argon2id$"));
        assert!(!hash.contains("created-password"));
        Ok(())
    })?;
    let b = Server::start(&db).await?;
    let v: Value = request(
        &c,
        &b,
        "GET",
        "/api/users?search=CREATED&page=1&limit=1",
        Some(&admin),
    )
    .send()
    .await?
    .json()
    .await?;
    assert_eq!(v["data"]["data"][0], *user);
    assert_eq!(
        v["data"]["meta"],
        json!({"page":1,"limit":1,"total":1,"pages":1})
    );
    assert!(v["data"].get("users").is_none());
    let mut email_duplicate = account();
    email_duplicate["username"] = json!("different_user");
    error(
        request(&c, &b, "POST", "/api/users", Some(&admin))
            .json(&email_duplicate)
            .send()
            .await?,
        409,
    )
    .await?;
    let mut duplicate = account();
    duplicate["email"] = json!("unique@example.test");
    duplicate["username"] = json!("CREATED_USER");
    error(
        request(&c, &b, "POST", "/api/users", Some(&admin))
            .json(&duplicate)
            .send()
            .await?,
        409,
    )
    .await?;
    let mut race = account();
    race["email"] = json!("race@example.test");
    race["username"] = json!("race_user");
    let (x, y) = tokio::join!(
        request(&c, &a, "POST", "/api/users", Some(&admin))
            .json(&race)
            .send(),
        request(&c, &b, "POST", "/api/users", Some(&admin))
            .json(&race)
            .send()
    );
    let mut statuses = vec![x?.status().as_u16(), y?.status().as_u16()];
    statuses.sort();
    assert_eq!(statuses, vec![201, 409]);
    let v: Value = request(&c, &a, "GET", "/api/users?search=race", Some(&admin))
        .send()
        .await?
        .json()
        .await?;
    assert_eq!(v["data"]["meta"]["total"], 1);
    error(
        request(&c, &a, "GET", &format!("/api/users/{id}"), Some(&regular))
            .send()
            .await?,
        403,
    )
    .await?;
    assert_eq!(
        request(
            &c,
            &a,
            "GET",
            &format!("/api/users/{regular_id}"),
            Some(&regular)
        )
        .send()
        .await?
        .status()
        .as_u16(),
        200
    );
    b.shutdown().await?;
    a.shutdown().await?;
    a = Server::start(&db).await?;
    let r = request(&c, &a, "POST", "/api/auth/login", None)
        .json(&json!({"email":"CREATED@example.test","password":"created-password"}))
        .send()
        .await?;
    assert_eq!(r.status().as_u16(), 200);
    let created_cookie = cookie(&r)?;
    let v: Value = request(
        &c,
        &a,
        "GET",
        &format!("/api/users/{id}"),
        Some(&created_cookie),
    )
    .send()
    .await?
    .json()
    .await?;
    assert_eq!(v["data"], *user);
    // Persisted expiry and active state protect all users routes as well as /auth/me.
    a.state.store.with_conn(|conn| {
        conn.execute("UPDATE sessions SET expires_at=0 WHERE user_id=?1", [&id])
            .map_err(db_error)?;
        Ok(())
    })?;
    error(
        request(&c, &a, "GET", "/api/users/profile", Some(&created_cookie))
            .send()
            .await?,
        401,
    )
    .await?;
    a.shutdown().await?;
    println!("Observed admin-only roles, authenticated creation, normalized conflicts, two instances, concurrent one-winner creation, restart credentials and expiry over HTTP.");
    Ok(())
}
#[tokio::test]
async fn strict_body_pagination_search_and_identifier_matrix() -> TestResult {
    let dir = tempfile::tempdir()?;
    let s = Server::start(&dir.path().join("validation.sqlite3")).await?;
    let c = Client::builder().no_proxy().build()?;
    let admin = admin(&c, &s).await?;
    for body in [
        json!({}),
        json!({"email":{},"password":"valid-password"}),
        json!({"email":"bad","password":"valid-password"}),
        json!({"email":"ok@example.test","password":12}),
        json!({"email":"ok@example.test","password":"short"}),
        json!({"email":"ok@example.test","password":"valid-password","role":"owner"}),
        json!({"email":"ok@example.test","password":"valid-password","username":"a/b"}),
        json!({"email":"ok@example.test","password":"valid-password","isActive":true}),
        json!({"email":"ok@example.test","password":"valid-password","firstName":"x".repeat(101)}),
    ] {
        error(
            request(&c, &s, "POST", "/api/users", Some(&admin))
                .json(&body)
                .send()
                .await?,
            400,
        )
        .await?;
    }
    error(
        request(&c, &s, "POST", "/api/users", Some(&admin))
            .header("content-type", "application/json")
            .body("{")
            .send()
            .await?,
        400,
    )
    .await?;
    error(
        request(&c, &s, "POST", "/api/users", Some(&admin))
            .send()
            .await?,
        400,
    )
    .await?;
    let mut huge = account();
    huge["password"] = json!("x".repeat(20000));
    error(
        request(&c, &s, "POST", "/api/users", Some(&admin))
            .json(&huge)
            .send()
            .await?,
        400,
    )
    .await?;
    for query in [
        "page=0",
        "page=-1",
        "page=1x",
        "page=1.5",
        "page=+1",
        "page=NaN",
        "page=4294967296",
        "limit=0",
        "limit=-1",
        "limit=2x",
        "limit=",
        "limit=1&limit=2",
        "page=1&page=2",
        "offset=1",
        "search=x&search=y",
    ] {
        error(
            request(&c, &s, "GET", &format!("/api/users?{query}"), Some(&admin))
                .send()
                .await?,
            400,
        )
        .await?;
    }
    for query in [
        "limit=200",
        "page=4294967295&limit=100",
        "search=%25",
        "search=%5F",
        "search=%27%20OR%201%3D1--",
    ] {
        let r = request(&c, &s, "GET", &format!("/api/users?{query}"), Some(&admin))
            .send()
            .await?;
        assert_eq!(r.status().as_u16(), 200);
        let v: Value = r.json().await?;
        if query == "limit=200" {
            assert_eq!(v["data"]["meta"]["limit"], 100)
        } else {
            assert_eq!(v["data"]["data"], json!([]));
            assert_eq!(
                v["data"]["meta"]["total"],
                if query.starts_with("page=") { 1 } else { 0 }
            );
        }
    }
    error(
        request(&c, &s, "GET", "/api/users/not-an-id", Some(&admin))
            .send()
            .await?,
        400,
    )
    .await?;
    error(
        request(
            &c,
            &s,
            "GET",
            &format!("/api/users/{}", "f".repeat(64)),
            Some(&admin),
        )
        .send()
        .await?,
        404,
    )
    .await?;
    let r = request(&c, &s, "POST", "/api/users", Some(&admin))
        .json(&account())
        .send()
        .await?;
    assert_eq!(r.status().as_u16(), 201);
    let v: Value = request(&c, &s, "GET", "/api/users?search=created", Some(&admin))
        .send()
        .await?
        .json()
        .await?;
    assert_eq!(v["data"]["meta"]["total"], 1);
    error(
        c.post(format!("{}/api/users", s.base))
            .header("cookie", &admin)
            .json(&account())
            .send()
            .await?,
        403,
    )
    .await?;
    s.shutdown().await?;
    println!("Observed canonical400 malformed/oversize/type/role/query/ID matrix; literal wildcard search and healthy subsequent creation.");
    Ok(())
}
#[tokio::test]
async fn profile_fields_partial_updates_isolation_restart_and_unsupported_upload() -> TestResult {
    let dir = tempfile::tempdir()?;
    let db = dir.path().join("profiles.sqlite3");
    let mut s = Server::start(&db).await?;
    let c = Client::builder().no_proxy().build()?;
    let (alice, alice_id) = register(&c, &s, "alice@example.test").await?;
    let (bob, bob_id) = register(&c, &s, "bob@example.test").await?;
    let update = json!({"firstName":"Alice","lastName":"Owner","bio":"Local biography","website":"https://example.test/alice","location":"Chicago","avatarUrl":"https://example.test/alice.png"});
    let r = request(&c, &s, "PUT", "/api/users/profile", Some(&alice))
        .json(&update)
        .send()
        .await?;
    assert_eq!(r.status().as_u16(), 200);
    let v: Value = r.json().await?;
    assert_eq!(v["data"]["userId"], alice_id);
    for (k, value) in update.as_object().ok_or("object")? {
        assert_eq!(&v["data"][k], value)
    }
    let v: Value = request(&c, &s, "GET", "/api/users/profile", Some(&bob))
        .send()
        .await?
        .json()
        .await?;
    assert_eq!(v["data"]["userId"], bob_id);
    assert!(v["data"].get("bio").is_none());
    for body in [
        json!({"userId":bob_id,"bio":"stolen"}),
        json!({"bio":12}),
        json!({"website":"javascript:alert(1)"}),
        json!({"avatarUrl":"file:///private"}),
        json!({"website":"https://user:pass@example.test"}),
        json!({"location":"x".repeat(201)}),
        json!({"firstName":"bad\nname"}),
    ] {
        error(
            request(&c, &s, "PUT", "/api/users/profile", Some(&alice))
                .json(&body)
                .send()
                .await?,
            400,
        )
        .await?;
    }
    let r = request(&c, &s, "PUT", "/api/users/profile", Some(&alice))
        .json(&json!({"bio":"Revised","website":""}))
        .send()
        .await?;
    let expected: Value = r.json().await?;
    assert_eq!(expected["data"]["firstName"], "Alice");
    assert_eq!(expected["data"]["bio"], "Revised");
    assert_eq!(expected["data"]["website"], "");
    error(
        request(&c, &s, "POST", "/api/users/avatar", Some(&alice))
            .body("fake upload")
            .send()
            .await?,
        501,
    )
    .await?;
    error(
        request(&c, &s, "POST", "/api/users/avatar", None)
            .send()
            .await?,
        401,
    )
    .await?;
    error(
        request(&c, &s, "GET", "/api/users/profile", None)
            .send()
            .await?,
        401,
    )
    .await?;
    s.shutdown().await?;
    s = Server::start(&db).await?;
    let v: Value = request(&c, &s, "GET", "/api/users/profile", Some(&alice))
        .send()
        .await?
        .json()
        .await?;
    assert_eq!(v, expected);
    let v: Value = request(
        &c,
        &s,
        "GET",
        &format!("/api/users/{alice_id}"),
        Some(&alice),
    )
    .send()
    .await?
    .json()
    .await?;
    assert_eq!(v["data"]["profile"], expected["data"]);
    // Changing browser identity selects only that persisted user's own profile.
    let v: Value = request(&c, &s, "GET", "/api/users/profile", Some(&bob))
        .send()
        .await?
        .json()
        .await?;
    assert_eq!(v["data"]["userId"], bob_id);
    assert!(v["data"].get("firstName").is_none());
    s.shutdown().await?;
    println!("Observed five settings fields plus avatar reference, partial updates, clear strings, owner isolation, restart persistence and truthful upload501.");
    Ok(())
}
#[tokio::test]
async fn transactional_revalidation_uses_current_role_revocation_expiry_and_active_state(
) -> TestResult {
    let dir = tempfile::tempdir()?;
    let s = Server::start(&dir.path().join("revalidate.sqlite3")).await?;
    let c = Client::builder().no_proxy().build()?;
    let admin = admin(&c, &s).await?;
    let mut headers = axum::http::HeaderMap::new();
    headers.insert("cookie", admin.parse()?);
    let session = auth::authenticate(&s.state, &headers)?;
    let id = session.user.id.clone();
    s.state.store.with_conn(|conn| {
        let tx = conn
            .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)
            .map_err(db_error)?;
        tx.execute("UPDATE users SET role='user' WHERE id=?1", [&id])
            .map_err(db_error)?;
        assert_eq!(session.revalidate(&tx)?.role, "user");
        tx.commit().map_err(db_error)
    })?;
    error(
        request(&c, &s, "POST", "/api/users", Some(&admin))
            .json(&account())
            .send()
            .await?,
        403,
    )
    .await?;
    s.state.store.with_conn(|conn| {
        let tx = conn
            .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)
            .map_err(db_error)?;
        tx.execute("UPDATE sessions SET revoked=1 WHERE user_id=?1", [&id])
            .map_err(db_error)?;
        assert_eq!(
            session
                .revalidate(&tx)
                .err()
                .ok_or_else(straw_web_api::ApiError::internal)?
                .status
                .as_u16(),
            401
        );
        tx.rollback().map_err(db_error)
    })?;
    s.state.store.with_conn(|conn| {
        let tx = conn.transaction().map_err(db_error)?;
        tx.execute("UPDATE sessions SET expires_at=0 WHERE user_id=?1", [&id])
            .map_err(db_error)?;
        assert!(session.revalidate(&tx).is_err());
        tx.rollback().map_err(db_error)
    })?;
    s.state.store.with_conn(|conn| {
        conn.execute("UPDATE sessions SET expires_at=0 WHERE user_id=?1", [&id])
            .map_err(db_error)?;
        Ok(())
    })?;
    error(
        request(&c, &s, "GET", "/api/users", Some(&admin))
            .send()
            .await?,
        401,
    )
    .await?;
    error(
        request(&c, &s, "POST", "/api/users", Some(&admin))
            .json(&account())
            .send()
            .await?,
        401,
    )
    .await?;
    s.state.store.with_conn(|conn| {
        conn.execute(
            "UPDATE sessions SET expires_at=?1 WHERE user_id=?2",
            rusqlite::params![straw_web_api::store::now() + 3600, id],
        )
        .map_err(db_error)?;
        Ok(())
    })?;
    s.state.store.with_conn(|conn| {
        let tx = conn.transaction().map_err(db_error)?;
        tx.execute("UPDATE users SET is_active=0 WHERE id=?1", [&id])
            .map_err(db_error)?;
        assert!(session.revalidate(&tx).is_err());
        tx.commit().map_err(db_error)
    })?;
    error(
        request(&c, &s, "PUT", "/api/users/profile", Some(&admin))
            .json(&json!({"bio":"denied"}))
            .send()
            .await?,
        401,
    )
    .await?;
    s.shutdown().await?;
    println!("Observed transaction-local fresh role/revocation/expiry/active checks, with HTTP writes denied after demotion/inactivation.");
    Ok(())
}
