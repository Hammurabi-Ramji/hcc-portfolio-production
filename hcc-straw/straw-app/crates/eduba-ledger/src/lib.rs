use std::str::FromStr;

use serde::{Deserialize, Serialize};
use sqlx::{sqlite::SqliteConnectOptions, sqlite::SqliteJournalMode, sqlite::SqlitePoolOptions, Pool, Sqlite};

#[derive(Clone)]
pub struct EdubaStore {
    pool: Pool<Sqlite>,
}

impl EdubaStore {
    pub async fn open(database_url: &str) -> Result<Self, sqlx::Error> {
        let database_url = normalize_sqlite_url(database_url);
        let options = SqliteConnectOptions::from_str(&database_url)?
            .create_if_missing(true)
            .foreign_keys(true)
            .journal_mode(SqliteJournalMode::Wal);
        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect_with(options)
            .await?;
        sqlx::migrate!("./migrations").run(&pool).await?;
        Ok(Self { pool })
    }

    pub async fn create_learner(&self, n: &NewLearner) -> Result<String, sqlx::Error> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();
        sqlx::query!(
            "INSERT INTO learner (id, name, created_at) VALUES (?1, ?2, ?3)",
            id,
            n.name,
            now
        )
        .execute(&self.pool)
        .await?;
        Ok(id)
    }

    pub async fn list_learners(&self) -> Result<Vec<Learner>, sqlx::Error> {
        sqlx::query_as!(
            Learner,
            "SELECT id, name, created_at FROM learner ORDER BY created_at ASC"
        )
        .fetch_all(&self.pool)
        .await
    }

    pub async fn create_course(&self, c: &NewCourse) -> Result<String, sqlx::Error> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();
        sqlx::query!(
            "INSERT INTO course (id, title, created_at) VALUES (?1, ?2, ?3)",
            id,
            c.title,
            now
        )
        .execute(&self.pool)
        .await?;
        Ok(id)
    }

    pub async fn list_courses(&self) -> Result<Vec<Course>, sqlx::Error> {
        sqlx::query_as!(
            Course,
            "SELECT id, title, created_at FROM course ORDER BY created_at ASC"
        )
        .fetch_all(&self.pool)
        .await
    }

    pub async fn create_lesson(&self, l: &NewLesson) -> Result<String, sqlx::Error> {
        let id = uuid::Uuid::new_v4().to_string();
        sqlx::query!(
            "INSERT INTO lesson (id, course_id, title, seq) VALUES (?1, ?2, ?3, ?4)",
            id,
            l.course_id,
            l.title,
            l.seq
        )
        .execute(&self.pool)
        .await?;
        Ok(id)
    }

    pub async fn list_lessons_by_course(&self, course_id: &str) -> Result<Vec<Lesson>, sqlx::Error> {
        sqlx::query_as!(
            Lesson,
            "SELECT id, course_id, title, seq FROM lesson WHERE course_id = ?1 ORDER BY seq ASC",
            course_id
        )
        .fetch_all(&self.pool)
        .await
    }

    pub async fn create_enrollment(&self, e: &NewEnrollment) -> Result<String, sqlx::Error> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();
        sqlx::query!(
            "INSERT INTO enrollment (id, learner_id, course_id, enrolled_at) VALUES (?1, ?2, ?3, ?4)",
            id,
            e.learner_id,
            e.course_id,
            now
        )
        .execute(&self.pool)
        .await?;
        Ok(id)
    }

    pub async fn list_enrollments(&self) -> Result<Vec<Enrollment>, sqlx::Error> {
        sqlx::query_as!(
            Enrollment,
            "SELECT id, learner_id, course_id, enrolled_at FROM enrollment ORDER BY enrolled_at DESC"
        )
        .fetch_all(&self.pool)
        .await
    }

    pub async fn create_submission(&self, s: &NewSubmission) -> Result<String, sqlx::Error> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();
        sqlx::query!(
            "INSERT INTO submission (id, lesson_id, learner_id, content, submitted_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            id,
            s.lesson_id,
            s.learner_id,
            s.content,
            now
        )
        .execute(&self.pool)
        .await?;
        Ok(id)
    }

    pub async fn list_submissions_by_lesson(
        &self,
        lesson_id: &str,
    ) -> Result<Vec<Submission>, sqlx::Error> {
        sqlx::query_as!(
            Submission,
            "SELECT id, lesson_id, learner_id, content, submitted_at FROM submission WHERE lesson_id = ?1 ORDER BY submitted_at DESC",
            lesson_id
        )
        .fetch_all(&self.pool)
        .await
    }
}

fn normalize_sqlite_url(database_url: &str) -> String {
    let Some(rest) = database_url.strip_prefix("sqlite://") else {
        return database_url.to_string();
    };
    let (path, query) = match rest.split_once('?') {
        Some((path, query)) => (path, Some(query)),
        None => (rest, None),
    };
    let path = path.replace('\\', "/");
    let windows_drive = path.len() >= 3
        && path.as_bytes()[0].is_ascii_alphabetic()
        && path.as_bytes()[1] == b':'
        && path.as_bytes()[2] == b'/';
    let path = if windows_drive {
        format!("file:{}", path.replace(' ', "%20"))
    } else {
        path
    };
    match query {
        Some(query) => format!("sqlite://{path}?{query}"),
        None => format!("sqlite://{path}"),
    }
}

#[derive(Serialize, Deserialize, sqlx::FromRow, Debug, Clone)]
pub struct Learner {
    pub id: String,
    pub name: String,
    pub created_at: i64,
}
#[derive(Deserialize, Debug)]
pub struct NewLearner {
    pub name: String,
}

#[derive(Serialize, Deserialize, sqlx::FromRow, Debug, Clone)]
pub struct Course {
    pub id: String,
    pub title: String,
    pub created_at: i64,
}
#[derive(Deserialize, Debug)]
pub struct NewCourse {
    pub title: String,
}

#[derive(Serialize, Deserialize, sqlx::FromRow, Debug, Clone)]
pub struct Lesson {
    pub id: String,
    pub course_id: String,
    pub title: String,
    pub seq: i64,
}
#[derive(Deserialize, Debug)]
pub struct NewLesson {
    pub course_id: String,
    pub title: String,
    pub seq: i64,
}

#[derive(Serialize, Deserialize, sqlx::FromRow, Debug, Clone)]
pub struct Enrollment {
    pub id: String,
    pub learner_id: String,
    pub course_id: String,
    pub enrolled_at: i64,
}
#[derive(Deserialize, Debug)]
pub struct NewEnrollment {
    pub learner_id: String,
    pub course_id: String,
}

#[derive(Serialize, Deserialize, sqlx::FromRow, Debug, Clone)]
pub struct Submission {
    pub id: String,
    pub lesson_id: String,
    pub learner_id: String,
    pub content: String,
    pub submitted_at: i64,
}
#[derive(Deserialize, Debug)]
pub struct NewSubmission {
    pub lesson_id: String,
    pub learner_id: String,
    pub content: String,
}
