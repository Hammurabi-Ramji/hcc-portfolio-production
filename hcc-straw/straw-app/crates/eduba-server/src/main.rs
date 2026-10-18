use axum::{
    extract::{Extension, Path},
    http::{HeaderValue, StatusCode},
    routing::{get, post},
    Json, Router,
};
use std::net::{IpAddr, Ipv4Addr, SocketAddr};
use tower_http::cors::{Any, CorsLayer};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let raw = std::env::var("AUTARCH_BE_ADDR").unwrap_or_else(|_| "127.0.0.1:8080".into());
    let addr = resolve_bind_addr(&raw)?;

    let db_path =
        std::env::var("ACCORDION_DB_PATH").unwrap_or_else(|_| "sqlite://eduba.db?mode=rwc".into());
    let store = eduba_ledger::EdubaStore::open(&db_path).await?;

    let app = router(store);
    let listener = tokio::net::TcpListener::bind(addr).await?;
    require_ipv4_loopback(listener.local_addr()?)?;
    axum::serve(listener, app).await?;
    Ok(())
}

fn router(store: eduba_ledger::EdubaStore) -> Router {
    let cors = CorsLayer::new()
        .allow_origin([
            HeaderValue::from_static("http://127.0.0.1:8000"),
            HeaderValue::from_static("http://127.0.0.1:8735"),
        ])
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route(
            "/health",
            get(|| async {
                Json(serde_json::json!({
                    "status": "operational",
                    "version": "7.0.0",
                    "zero_trace": true
                }))
            }),
        )
        .route(
            "/learners",
            post(crud::create_learner).get(crud::list_learners),
        )
        .route(
            "/courses",
            post(crud::create_course).get(crud::list_courses),
        )
        .route("/lessons", post(crud::create_lesson))
        .route("/courses/{course_id}/lessons", get(crud::list_lessons))
        .route(
            "/enrollments",
            post(crud::create_enrollment).get(crud::list_enrollments),
        )
        .route("/submissions", post(crud::create_submission))
        .route(
            "/lessons/{lesson_id}/submissions",
            get(crud::list_submissions),
        )
        .layer(cors)
        .layer(Extension(store))
}

fn resolve_bind_addr(raw: &str) -> anyhow::Result<SocketAddr> {
    let addr: SocketAddr = raw
        .parse()
        .map_err(|err| anyhow::anyhow!("invalid AUTARCH_BE_ADDR {raw:?}: {err}"))?;
    require_ipv4_loopback(addr)?;
    Ok(addr)
}

fn require_ipv4_loopback(addr: SocketAddr) -> anyhow::Result<()> {
    if addr.ip() != IpAddr::V4(Ipv4Addr::LOCALHOST) {
        anyhow::bail!("refusing bind {addr}: listener must be 127.0.0.1");
    }
    Ok(())
}

mod crud {
    use super::*;
    use eduba_ledger::*;

    pub async fn create_learner(
        Extension(store): Extension<EdubaStore>,
        Json(body): Json<NewLearner>,
    ) -> Result<(StatusCode, Json<serde_json::Value>), (StatusCode, String)> {
        store
            .create_learner(&body)
            .await
            .map(|id| (StatusCode::CREATED, Json(serde_json::json!({ "id": id }))))
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
    }

    pub async fn list_learners(
        Extension(store): Extension<EdubaStore>,
    ) -> Result<Json<Vec<Learner>>, (StatusCode, String)> {
        store
            .list_learners()
            .await
            .map(Json)
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
    }

    pub async fn create_course(
        Extension(store): Extension<EdubaStore>,
        Json(body): Json<NewCourse>,
    ) -> Result<(StatusCode, Json<serde_json::Value>), (StatusCode, String)> {
        store
            .create_course(&body)
            .await
            .map(|id| (StatusCode::CREATED, Json(serde_json::json!({ "id": id }))))
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
    }

    pub async fn list_courses(
        Extension(store): Extension<EdubaStore>,
    ) -> Result<Json<Vec<Course>>, (StatusCode, String)> {
        store
            .list_courses()
            .await
            .map(Json)
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
    }

    pub async fn create_lesson(
        Extension(store): Extension<EdubaStore>,
        Json(body): Json<NewLesson>,
    ) -> Result<(StatusCode, Json<serde_json::Value>), (StatusCode, String)> {
        store
            .create_lesson(&body)
            .await
            .map(|id| (StatusCode::CREATED, Json(serde_json::json!({ "id": id }))))
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
    }

    pub async fn list_lessons(
        Extension(store): Extension<EdubaStore>,
        Path(course_id): Path<String>,
    ) -> Result<Json<Vec<Lesson>>, (StatusCode, String)> {
        store
            .list_lessons_by_course(&course_id)
            .await
            .map(Json)
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
    }

    pub async fn create_enrollment(
        Extension(store): Extension<EdubaStore>,
        Json(body): Json<NewEnrollment>,
    ) -> Result<(StatusCode, Json<serde_json::Value>), (StatusCode, String)> {
        store
            .create_enrollment(&body)
            .await
            .map(|id| (StatusCode::CREATED, Json(serde_json::json!({ "id": id }))))
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
    }

    pub async fn list_enrollments(
        Extension(store): Extension<EdubaStore>,
    ) -> Result<Json<Vec<Enrollment>>, (StatusCode, String)> {
        store
            .list_enrollments()
            .await
            .map(Json)
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
    }

    pub async fn create_submission(
        Extension(store): Extension<EdubaStore>,
        Json(body): Json<NewSubmission>,
    ) -> Result<(StatusCode, Json<serde_json::Value>), (StatusCode, String)> {
        store
            .create_submission(&body)
            .await
            .map(|id| (StatusCode::CREATED, Json(serde_json::json!({ "id": id }))))
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
    }

    pub async fn list_submissions(
        Extension(store): Extension<EdubaStore>,
        Path(lesson_id): Path<String>,
    ) -> Result<Json<Vec<Submission>>, (StatusCode, String)> {
        store
            .list_submissions_by_lesson(&lesson_id)
            .await
            .map(Json)
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    async fn send(
        app: &Router,
        method: &str,
        path: &str,
        body: serde_json::Value,
    ) -> (StatusCode, serde_json::Value) {
        use tower::ServiceExt;
        let response = app
            .clone()
            .oneshot(
                axum::http::Request::builder()
                    .method(method)
                    .uri(path)
                    .header("content-type", "application/json")
                    .body(axum::body::Body::from(body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        let status = response.status();
        let bytes = axum::body::to_bytes(response.into_body(), 64 * 1024)
            .await
            .unwrap();
        (
            status,
            serde_json::from_slice(&bytes).unwrap_or_else(|_| {
                serde_json::Value::String(String::from_utf8_lossy(&bytes).into_owned())
            }),
        )
    }

    #[tokio::test]
    async fn http_roundtrip_preserves_ids_relationships_and_sql_shaped_content() {
        use serde_json::json;
        let store = eduba_ledger::EdubaStore::open("sqlite::memory:")
            .await
            .unwrap();
        let app = router(store);
        let (status, health) = send(&app, "GET", "/health", json!(null)).await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(health["status"], "operational");
        let (status, learner) = send(&app, "POST", "/learners", json!({"name":"Reader"})).await;
        assert_eq!(status, StatusCode::CREATED);
        let learner = learner["id"].as_str().unwrap();
        let (status, course) =
            send(&app, "POST", "/courses", json!({"title":"Local course"})).await;
        assert_eq!(status, StatusCode::CREATED);
        let course = course["id"].as_str().unwrap();
        let (status, lesson) = send(
            &app,
            "POST",
            "/lessons",
            json!({"course_id":course,"title":"Second","seq":2}),
        )
        .await;
        assert_eq!(status, StatusCode::CREATED);
        let lesson = lesson["id"].as_str().unwrap();
        assert_eq!(
            send(
                &app,
                "POST",
                "/lessons",
                json!({"course_id":course,"title":"First","seq":1})
            )
            .await
            .0,
            StatusCode::CREATED
        );
        let (status, enrollment) = send(
            &app,
            "POST",
            "/enrollments",
            json!({"course_id":course,"learner_id":learner}),
        )
        .await;
        assert_eq!(status, StatusCode::CREATED);
        assert!(!enrollment["id"].as_str().unwrap().is_empty());
        let text = "'); DROP TABLE course; --";
        let (status, submission) = send(
            &app,
            "POST",
            "/submissions",
            json!({"lesson_id":lesson,"learner_id":learner,"content":text}),
        )
        .await;
        assert_eq!(status, StatusCode::CREATED);
        let (_, learners) = send(&app, "GET", "/learners", json!(null)).await;
        assert_eq!(learners[0]["id"], learner);
        let (_, courses) = send(&app, "GET", "/courses", json!(null)).await;
        assert_eq!(courses[0]["id"], course);
        let (_, lessons) = send(
            &app,
            "GET",
            &format!("/courses/{course}/lessons"),
            json!(null),
        )
        .await;
        assert_eq!(lessons[0]["seq"], 1);
        assert_eq!(lessons[1]["id"], lesson);
        let (_, enrollments) = send(&app, "GET", "/enrollments", json!(null)).await;
        assert_eq!(enrollments[0]["learner_id"], learner);
        let (_, submissions) = send(
            &app,
            "GET",
            &format!("/lessons/{lesson}/submissions"),
            json!(null),
        )
        .await;
        assert_eq!(submissions[0]["id"], submission["id"]);
        assert_eq!(submissions[0]["content"], text);
        assert_eq!(
            send(&app, "GET", "/unknown", json!(null)).await.0,
            StatusCode::NOT_FOUND
        );
        assert_eq!(
            send(&app, "POST", "/learners", json!({})).await.0,
            StatusCode::UNPROCESSABLE_ENTITY
        );
        for (path, body) in [
            (
                "/lessons",
                json!({"course_id":"missing","title":"Bad relation","seq":1}),
            ),
            (
                "/enrollments",
                json!({"course_id":course,"learner_id":"missing"}),
            ),
            (
                "/submissions",
                json!({"lesson_id":"missing","learner_id":learner,"content":"rejected"}),
            ),
        ] {
            assert_eq!(
                send(&app, "POST", path, body).await.0,
                StatusCode::INTERNAL_SERVER_ERROR
            );
        }
    }

    #[tokio::test]
    async fn storage_failure_is_reported_on_every_http_surface() {
        use serde_json::json;
        let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../target/coverage-eduba-http");
        std::fs::create_dir_all(&root).unwrap();
        let dir = tempfile::tempdir_in(root).unwrap();
        let url = format!("sqlite://{}", dir.path().join("store.db").display());
        let store = eduba_ledger::EdubaStore::open(&url).await.unwrap();
        let app = router(store);
        let mut connection = <sqlx::SqliteConnection as sqlx::Connection>::connect(&url)
            .await
            .unwrap();
        sqlx::raw_sql("DROP TABLE submission; DROP TABLE enrollment; DROP TABLE lesson; DROP TABLE course; DROP TABLE learner;").execute(&mut connection).await.unwrap();
        for path in [
            "/learners",
            "/courses",
            "/courses/any/lessons",
            "/enrollments",
            "/lessons/any/submissions",
        ] {
            let (status, error) = send(&app, "GET", path, json!(null)).await;
            assert_eq!(status, StatusCode::INTERNAL_SERVER_ERROR, "{path}: {error}");
            assert!(error.as_str().unwrap().contains("no such table"));
        }
        for (path, body) in [
            ("/learners", json!({"name":"Reader"})),
            ("/courses", json!({"title":"Course"})),
            (
                "/lessons",
                json!({"course_id":"x","title":"Lesson","seq":1}),
            ),
            ("/enrollments", json!({"learner_id":"x","course_id":"y"})),
            (
                "/submissions",
                json!({"lesson_id":"x","learner_id":"y","content":"text"}),
            ),
        ] {
            assert_eq!(
                send(&app, "POST", path, body).await.0,
                StatusCode::INTERNAL_SERVER_ERROR
            );
        }
    }

    #[tokio::test]
    async fn cors_allows_only_the_two_reviewed_local_origins() {
        use tower::ServiceExt;
        let app = router(
            eduba_ledger::EdubaStore::open("sqlite::memory:")
                .await
                .unwrap(),
        );
        for (origin, allowed) in [
            ("http://127.0.0.1:8000", true),
            ("http://127.0.0.1:8735", true),
            ("https://remote.example", false),
        ] {
            let response = app
                .clone()
                .oneshot(
                    axum::http::Request::builder()
                        .method("OPTIONS")
                        .uri("/courses")
                        .header("origin", origin)
                        .header("access-control-request-method", "POST")
                        .body(axum::body::Body::empty())
                        .unwrap(),
                )
                .await
                .unwrap();
            assert_eq!(
                response
                    .headers()
                    .get("access-control-allow-origin")
                    .and_then(|v| v.to_str().ok()),
                allowed.then_some(origin)
            );
        }
        assert!(resolve_bind_addr("not an address")
            .unwrap_err()
            .to_string()
            .contains("invalid AUTARCH_BE_ADDR"));
    }

    #[tokio::test]
    async fn parameter_routes_work_with_the_shared_axum_version() {
        use tower::ServiceExt;
        let store = eduba_ledger::EdubaStore::open("sqlite::memory:")
            .await
            .unwrap();
        for path in ["/courses/missing/lessons", "/lessons/missing/submissions"] {
            let response = router(store.clone())
                .oneshot(
                    axum::http::Request::builder()
                        .uri(path)
                        .body(axum::body::Body::empty())
                        .unwrap(),
                )
                .await
                .unwrap();
            assert_eq!(response.status(), StatusCode::OK);
        }
    }

    #[test]
    fn rejects_unspecified_and_ipv6_bind_targets() {
        assert_eq!(
            resolve_bind_addr("127.0.0.1:8080").unwrap(),
            "127.0.0.1:8080".parse().unwrap()
        );
        for raw in ["0.0.0.0:8080", "[::]:8080", "[::1]:8080", "127.0.0.2:8080"] {
            let err = resolve_bind_addr(raw).unwrap_err().to_string();
            assert!(err.contains("127.0.0.1"), "{raw}: {err}");
        }
    }
}
