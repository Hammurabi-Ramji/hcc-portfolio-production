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

    let db_path = std::env::var("ACCORDION_DB_PATH")
        .unwrap_or_else(|_| "sqlite://eduba.db?mode=rwc".into());
    let store = eduba_ledger::EdubaStore::open(&db_path).await?;

    let cors = CorsLayer::new()
        .allow_origin([
            HeaderValue::from_static("http://127.0.0.1:8000"),
            HeaderValue::from_static("http://127.0.0.1:8735"),
        ])
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
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
        .route("/learners", post(crud::create_learner).get(crud::list_learners))
        .route("/courses", post(crud::create_course).get(crud::list_courses))
        .route("/lessons", post(crud::create_lesson))
        .route("/courses/:course_id/lessons", get(crud::list_lessons))
        .route(
            "/enrollments",
            post(crud::create_enrollment).get(crud::list_enrollments),
        )
        .route("/submissions", post(crud::create_submission))
        .route(
            "/lessons/:lesson_id/submissions",
            get(crud::list_submissions),
        )
        .layer(cors)
        .layer(Extension(store));

    let listener = tokio::net::TcpListener::bind(addr).await?;
    require_ipv4_loopback(listener.local_addr()?)?;
    axum::serve(listener, app).await?;
    Ok(())
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
