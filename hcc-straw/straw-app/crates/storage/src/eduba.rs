//! Lossless logical Eduba archive: only the five supported record tables.
//! Sources are opened read-only without migrations; neither credential tables nor
//! arbitrary SQLite tables are copied. Archives are ordinary plaintext data.
use crate::Store;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::{sqlite::SqliteConnectOptions, Connection, Row, SqliteConnection};
use std::{
    collections::HashSet,
    io::{Read, Write},
    path::Path,
    time::Duration,
};

pub const MAX_BYTES: usize = 16 * 1024 * 1024;
pub const MAX_ROWS: usize = 10_000;

macro_rules! record {
    ($name:ident { $($field:ident: $ty:ty),* $(,)? }) => {
        #[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, sqlx::FromRow)]
        #[serde(deny_unknown_fields)]
        pub struct $name { $(pub $field: $ty),* }
    };
}
record!(Learner {
    id: String,
    name: String,
    created_at: i64
});
record!(Course {
    id: String,
    title: String,
    created_at: i64
});
record!(Lesson {
    id: String,
    course_id: String,
    title: String,
    seq: i64
});
record!(Enrollment {
    id: String,
    learner_id: String,
    course_id: String,
    enrolled_at: i64
});
record!(Submission {
    id: String,
    lesson_id: String,
    learner_id: String,
    content: String,
    submitted_at: i64
});

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Snapshot {
    pub version: u32,
    pub learners: Vec<Learner>,
    pub courses: Vec<Course>,
    pub lessons: Vec<Lesson>,
    pub enrollments: Vec<Enrollment>,
    pub submissions: Vec<Submission>,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Counts {
    pub learners: u32,
    pub courses: u32,
    pub lessons: u32,
    pub enrollments: u32,
    pub submissions: u32,
}
#[derive(Clone, Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct Preview {
    pub source_path: String,
    pub digest: String,
    pub counts: Counts,
    pub bytes: u32,
}
#[derive(Clone, Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct Archive {
    pub digest: String,
    pub source_path: String,
    pub counts: Counts,
    pub bytes: u32,
    pub imported_at: String,
}

pub struct Prepared {
    preview: Preview,
    json: String,
}
impl Prepared {
    pub fn preview(&self) -> Preview {
        self.preview.clone()
    }
}

fn invalid(message: impl std::fmt::Display) -> String {
    format!("invalid Eduba archive: {message}")
}
fn normalize(mut data: Snapshot) -> Result<(String, Counts), String> {
    if data.version != 1 {
        return Err(invalid("unsupported format version"));
    }
    let lengths = [
        data.learners.len(),
        data.courses.len(),
        data.lessons.len(),
        data.enrollments.len(),
        data.submissions.len(),
    ];
    if lengths.iter().sum::<usize>() > MAX_ROWS {
        return Err(invalid("more than 10000 records"));
    }
    fn identities<'a>(ids: impl Iterator<Item = &'a String>) -> Result<HashSet<&'a str>, String> {
        let mut set = HashSet::new();
        for id in ids {
            if id.is_empty() || id.len() > 256 || !set.insert(id.as_str()) {
                return Err(invalid("empty, oversized or duplicate identity"));
            }
        }
        Ok(set)
    }
    let learners = identities(data.learners.iter().map(|r| &r.id))?;
    let courses = identities(data.courses.iter().map(|r| &r.id))?;
    let lessons = identities(data.lessons.iter().map(|r| &r.id))?;
    identities(data.enrollments.iter().map(|r| &r.id))?;
    identities(data.submissions.iter().map(|r| &r.id))?;
    if data
        .lessons
        .iter()
        .any(|r| !courses.contains(r.course_id.as_str()))
        || data.enrollments.iter().any(|r| {
            !learners.contains(r.learner_id.as_str()) || !courses.contains(r.course_id.as_str())
        })
        || data.submissions.iter().any(|r| {
            !learners.contains(r.learner_id.as_str()) || !lessons.contains(r.lesson_id.as_str())
        })
    {
        return Err(invalid("broken record relationship"));
    }
    data.learners.sort_by(|a, b| a.id.cmp(&b.id));
    data.courses.sort_by(|a, b| a.id.cmp(&b.id));
    data.lessons.sort_by(|a, b| a.id.cmp(&b.id));
    data.enrollments.sort_by(|a, b| a.id.cmp(&b.id));
    data.submissions.sort_by(|a, b| a.id.cmp(&b.id));
    let json = serde_json::to_string(&data).map_err(invalid)?;
    if json.len() > MAX_BYTES {
        return Err(invalid("snapshot exceeds 16 MiB"));
    }
    Ok((
        json,
        Counts {
            learners: lengths[0] as u32,
            courses: lengths[1] as u32,
            lessons: lengths[2] as u32,
            enrollments: lengths[3] as u32,
            submissions: lengths[4] as u32,
        },
    ))
}

/// One SQLite read transaction captures committed rows, including live WAL data.
/// Size/type checks run before loading text; no source schema upgrade is run.
async fn read_sqlite(path: &Path) -> Result<Snapshot, String> {
    let options = SqliteConnectOptions::new()
        .filename(path)
        .read_only(true)
        .create_if_missing(false)
        .busy_timeout(Duration::from_secs(5));
    let mut connection = SqliteConnection::connect_with(&options)
        .await
        .map_err(invalid)?;
    let result = async {
        let mut tx = connection.begin().await.map_err(invalid)?;
        let mut total_rows = 0_i64;
        let mut total_bytes = 0_i64;
        for (table, names, integers, counts_sql) in [
            ("learner", &["id","name"][..], "created_at", "SELECT count(*) AS rows, coalesce(sum(length(CAST(id AS BLOB))+length(CAST(name AS BLOB))),0) AS bytes, coalesce(sum(CASE WHEN typeof(id) != 'text' OR typeof(name) != 'text' OR typeof(created_at) != 'integer' THEN 1 ELSE 0 END),0) AS bad FROM learner"),
            ("course", &["id","title"][..], "created_at", "SELECT count(*) AS rows, coalesce(sum(length(CAST(id AS BLOB))+length(CAST(title AS BLOB))),0) AS bytes, coalesce(sum(CASE WHEN typeof(id) != 'text' OR typeof(title) != 'text' OR typeof(created_at) != 'integer' THEN 1 ELSE 0 END),0) AS bad FROM course"),
            ("lesson", &["id","course_id","title"][..], "seq", "SELECT count(*) AS rows, coalesce(sum(length(CAST(id AS BLOB))+length(CAST(course_id AS BLOB))+length(CAST(title AS BLOB))),0) AS bytes, coalesce(sum(CASE WHEN typeof(id) != 'text' OR typeof(course_id) != 'text' OR typeof(title) != 'text' OR typeof(seq) != 'integer' THEN 1 ELSE 0 END),0) AS bad FROM lesson"),
            ("enrollment", &["id","learner_id","course_id"][..], "enrolled_at", "SELECT count(*) AS rows, coalesce(sum(length(CAST(id AS BLOB))+length(CAST(learner_id AS BLOB))+length(CAST(course_id AS BLOB))),0) AS bytes, coalesce(sum(CASE WHEN typeof(id) != 'text' OR typeof(learner_id) != 'text' OR typeof(course_id) != 'text' OR typeof(enrolled_at) != 'integer' THEN 1 ELSE 0 END),0) AS bad FROM enrollment"),
            ("submission", &["id","lesson_id","learner_id","content"][..], "submitted_at", "SELECT count(*) AS rows, coalesce(sum(length(CAST(id AS BLOB))+length(CAST(lesson_id AS BLOB))+length(CAST(learner_id AS BLOB))+length(CAST(content AS BLOB))),0) AS bytes, coalesce(sum(CASE WHEN typeof(id) != 'text' OR typeof(lesson_id) != 'text' OR typeof(learner_id) != 'text' OR typeof(content) != 'text' OR typeof(submitted_at) != 'integer' THEN 1 ELSE 0 END),0) AS bad FROM submission"),
        ] {
            let kind: Option<String> = sqlx::query_scalar("SELECT type FROM sqlite_master WHERE name=?").bind(table).fetch_optional(&mut *tx).await.map_err(invalid)?;
            if kind.as_deref() != Some("table") { return Err(invalid("missing supported record table")); }
            let fields = sqlx::query("SELECT name FROM pragma_table_xinfo(?)").bind(table).fetch_all(&mut *tx).await.map_err(invalid)?;
            let actual: HashSet<String> = fields.iter().map(|r| r.try_get("name")).collect::<Result<_,_>>().map_err(invalid)?;
            let expected: HashSet<String> = names.iter().chain(std::iter::once(&integers)).map(|s|s.to_string()).collect();
            if actual != expected { return Err(invalid("unsupported record columns; no fields will be discarded")); }
            // Static statements satisfy SQLx's SQL-safety contract; source
            // identifiers and archive contents never become executable SQL.
            let row = sqlx::query(counts_sql)
                .fetch_one(&mut *tx).await.map_err(invalid)?;
            total_rows += row.try_get::<i64,_>("rows").map_err(invalid)?;
            total_bytes += row.try_get::<i64,_>("bytes").map_err(invalid)?;
            if row.try_get::<i64,_>("bad").map_err(invalid)? != 0 || total_rows > MAX_ROWS as i64 || total_bytes > MAX_BYTES as i64 {
                return Err(invalid("record types or size exceed supported bounds"));
            }
        }
        let snapshot = Snapshot {
            version:1,
            learners:sqlx::query_as("SELECT id,name,created_at FROM learner ORDER BY id").fetch_all(&mut *tx).await.map_err(invalid)?,
            courses:sqlx::query_as("SELECT id,title,created_at FROM course ORDER BY id").fetch_all(&mut *tx).await.map_err(invalid)?,
            lessons:sqlx::query_as("SELECT id,course_id,title,seq FROM lesson ORDER BY id").fetch_all(&mut *tx).await.map_err(invalid)?,
            enrollments:sqlx::query_as("SELECT id,learner_id,course_id,enrolled_at FROM enrollment ORDER BY id").fetch_all(&mut *tx).await.map_err(invalid)?,
            submissions:sqlx::query_as("SELECT id,lesson_id,learner_id,content,submitted_at FROM submission ORDER BY id").fetch_all(&mut *tx).await.map_err(invalid)?,
        };
        tx.commit().await.map_err(invalid)?;
        Ok(snapshot)
    }.await;
    connection.close().await.map_err(invalid)?;
    result
}

/// Reject Windows network/device namespaces before accessing the path.
pub fn require_local(path: &Path) -> Result<(), String> {
    #[cfg(windows)]
    if path.components().any(|c| matches!(c, std::path::Component::Prefix(p) if matches!(p.kind(),std::path::Prefix::UNC(..)|std::path::Prefix::VerbatimUNC(..)|std::path::Prefix::DeviceNS(..)|std::path::Prefix::Verbatim(..)))) {
        return Err(invalid("choose a local file, not a network share or device"));
    }
    #[cfg(not(windows))]
    let _ = path;
    Ok(())
}

/// Preview is also the importer: every import prepares a fresh snapshot again.
pub fn prepare(path: &Path) -> Result<Prepared, String> {
    require_local(path)?;
    let path = path.canonicalize().map_err(invalid)?;
    if !path.is_file() {
        return Err(invalid("choose an existing file"));
    }
    require_local(&path)?;
    let data = if path
        .extension()
        .and_then(|e| e.to_str())
        .is_some_and(|e| e.eq_ignore_ascii_case("json"))
    {
        let mut bytes = Vec::new();
        std::fs::File::open(&path)
            .map_err(invalid)?
            .take(MAX_BYTES as u64 + 1)
            .read_to_end(&mut bytes)
            .map_err(invalid)?;
        if bytes.len() > MAX_BYTES {
            return Err(invalid("JSON exceeds 16 MiB"));
        }
        serde_json::from_slice(&bytes).map_err(invalid)?
    } else {
        tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .map_err(invalid)?
            .block_on(read_sqlite(&path))?
    };
    let (json, counts) = normalize(data)?;
    let preview = Preview {
        source_path: path.to_string_lossy().into_owned(),
        digest: format!("{:x}", Sha256::digest(json.as_bytes())),
        counts,
        bytes: json.len() as u32,
    };
    Ok(Prepared { preview, json })
}

impl Store {
    pub fn import_eduba(&self, prepared: Prepared) -> Result<Archive, String> {
        let preview = prepared.preview;
        let imported_at = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(invalid)?
            .as_secs()
            .to_string();
        let counts = serde_json::to_string(&preview.counts).map_err(invalid)?;
        self.call(move |c| Box::pin(async move {
            let mut tx = c.begin().await?;
            sqlx::query("INSERT INTO eduba_archives(digest,source_path,counts,bytes,imported_at,snapshot) VALUES(?,?,?,?,?,?) ON CONFLICT(digest) DO NOTHING")
                .bind(&preview.digest).bind(&preview.source_path).bind(counts).bind(preview.bytes as i64).bind(imported_at).bind(&prepared.json).execute(&mut *tx).await?;
            let row = sqlx::query("SELECT digest,source_path,counts,bytes,imported_at,snapshot FROM eduba_archives WHERE digest=?").bind(&preview.digest).fetch_one(&mut *tx).await?;
            if row.try_get::<String,_>("snapshot")? != prepared.json { return Err(sqlx::Error::Protocol("invalid Eduba archive: stored content differs".into())); }
            let archive = row_archive(&row)?;
            tx.commit().await?;
            Ok(archive)
        }))
    }
    /// Most recent 100 archives; content is not sent into browser state or AI.
    pub fn eduba_archives(&self) -> Result<Vec<Archive>, String> {
        self.call(|c| Box::pin(async move {
            sqlx::query("SELECT digest,source_path,counts,bytes,imported_at FROM eduba_archives ORDER BY imported_at DESC,digest LIMIT 100")
                .fetch_all(c).await?.iter().map(row_archive).collect()
        }))
    }
    pub fn eduba_json(&self, digest: String) -> Result<String, String> {
        let expected = digest.clone();
        let json: String = self.call(move |c| Box::pin(async move {
            sqlx::query_scalar("SELECT snapshot FROM eduba_archives WHERE digest=? AND length(CAST(snapshot AS BLOB))<=?")
                .bind(digest).bind(MAX_BYTES as i64).fetch_one(c).await
        }))?;
        let data: Snapshot = serde_json::from_str(&json).map_err(invalid)?;
        let (normalized, _) = normalize(data)?;
        if json != normalized || format!("{:x}", Sha256::digest(json.as_bytes())) != expected {
            return Err(invalid("stored digest mismatch"));
        }
        Ok(json)
    }
}
fn row_archive(row: &sqlx::sqlite::SqliteRow) -> Result<Archive, sqlx::Error> {
    Ok(Archive {
        digest: row.try_get("digest")?,
        source_path: row.try_get("source_path")?,
        counts: serde_json::from_str(&row.try_get::<String, _>("counts")?)
            .map_err(|e| sqlx::Error::Protocol(e.to_string()))?,
        bytes: u32::try_from(row.try_get::<i64, _>("bytes")?)
            .map_err(|e| sqlx::Error::Protocol(e.to_string()))?,
        imported_at: row.try_get("imported_at")?,
    })
}
/// Export never overwrites an existing file, including a source database.
pub fn write_json(path: &Path, json: &str) -> Result<(), String> {
    let mut file = std::fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(path)
        .map_err(|e| e.to_string())?;
    file.write_all(json.as_bytes())
        .and_then(|_| file.sync_all())
        .map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    fn sample() -> Snapshot {
        Snapshot {
            version: 1,
            learners: vec![Learner {
                id: "learner-old".into(),
                name: "𒀭 Ada\n\0".into(),
                created_at: 9_007_199_254_740_993,
            }],
            courses: vec![Course {
                id: "course-old".into(),
                title: "Original course".into(),
                created_at: -123,
            }],
            lessons: vec![Lesson {
                id: "lesson-old".into(),
                course_id: "course-old".into(),
                title: "Lesson 🎓".into(),
                seq: 7,
            }],
            enrollments: vec![Enrollment {
                id: "enrollment-old".into(),
                learner_id: "learner-old".into(),
                course_id: "course-old".into(),
                enrolled_at: 456,
            }],
            submissions: vec![Submission {
                id: "submission-old".into(),
                lesson_id: "lesson-old".into(),
                learner_id: "learner-old".into(),
                content: "line one\nline two\0𒀭".into(),
                submitted_at: 789,
            }],
        }
    }
    fn source(dir: &Path) -> (Store, std::path::PathBuf) {
        let path = dir.join("eduba.db");
        // Inline fixture remains self-contained in generated Fabricator bundles.
        let store = Store::open(&path, "CREATE TABLE learner(id TEXT PRIMARY KEY,name TEXT NOT NULL,created_at INTEGER NOT NULL); CREATE TABLE course(id TEXT PRIMARY KEY,title TEXT NOT NULL,created_at INTEGER NOT NULL); CREATE TABLE lesson(id TEXT PRIMARY KEY,course_id TEXT NOT NULL REFERENCES course(id),title TEXT NOT NULL,seq INTEGER NOT NULL); CREATE TABLE enrollment(id TEXT PRIMARY KEY,learner_id TEXT NOT NULL REFERENCES learner(id),course_id TEXT NOT NULL REFERENCES course(id),enrolled_at INTEGER NOT NULL); CREATE TABLE submission(id TEXT PRIMARY KEY,lesson_id TEXT NOT NULL REFERENCES lesson(id),learner_id TEXT NOT NULL REFERENCES learner(id),content TEXT NOT NULL,submitted_at INTEGER NOT NULL);").unwrap();
        let data = sample();
        store
            .call(move |c| {
                Box::pin(async move {
                    let learner = &data.learners[0];
                    sqlx::query("INSERT INTO learner VALUES(?,?,?)")
                        .bind(&learner.id)
                        .bind(&learner.name)
                        .bind(learner.created_at)
                        .execute(&mut *c)
                        .await?;
                    let course = &data.courses[0];
                    sqlx::query("INSERT INTO course VALUES(?,?,?)")
                        .bind(&course.id)
                        .bind(&course.title)
                        .bind(course.created_at)
                        .execute(&mut *c)
                        .await?;
                    let lesson = &data.lessons[0];
                    sqlx::query("INSERT INTO lesson VALUES(?,?,?,?)")
                        .bind(&lesson.id)
                        .bind(&lesson.course_id)
                        .bind(&lesson.title)
                        .bind(lesson.seq)
                        .execute(&mut *c)
                        .await?;
                    let enrollment = &data.enrollments[0];
                    sqlx::query("INSERT INTO enrollment VALUES(?,?,?,?)")
                        .bind(&enrollment.id)
                        .bind(&enrollment.learner_id)
                        .bind(&enrollment.course_id)
                        .bind(enrollment.enrolled_at)
                        .execute(&mut *c)
                        .await?;
                    let submission = &data.submissions[0];
                    sqlx::query("INSERT INTO submission VALUES(?,?,?,?,?)")
                        .bind(&submission.id)
                        .bind(&submission.lesson_id)
                        .bind(&submission.learner_id)
                        .bind(&submission.content)
                        .bind(submission.submitted_at)
                        .execute(c)
                        .await?;
                    Ok(())
                })
            })
            .unwrap();
        (store, path)
    }
    fn execute(store: &Store, sql: &'static str) -> Result<(), String> {
        store.call(move |c| {
            Box::pin(async move {
                sqlx::raw_sql(sql).execute(c).await?;
                Ok(())
            })
        })
    }
    fn json_source(dir: &Path, data: &Snapshot) -> std::path::PathBuf {
        let path = dir.join("archive.json");
        std::fs::write(&path, serde_json::to_vec(data).unwrap()).unwrap();
        path
    }
    #[test]
    fn live_wal_source_roundtrips_exactly_and_survives_restart() {
        let dir = tempfile::tempdir().unwrap();
        let (source, path) = source(dir.path());
        let schema_before: String = source
            .call(|c| {
                Box::pin(async move {
                    sqlx::query_scalar("SELECT group_concat(sql) FROM sqlite_master")
                        .fetch_one(c)
                        .await
                })
            })
            .unwrap();
        let prepared = prepare(&path).unwrap();
        assert_eq!(
            serde_json::from_str::<Snapshot>(&prepared.json).unwrap(),
            sample()
        );
        let destination = dir.path().join("destination.db");
        let store = Store::open(&destination, "").unwrap();
        let archive = store.import_eduba(prepared).unwrap();
        let duplicate = store.import_eduba(prepare(&path).unwrap()).unwrap();
        assert_eq!(duplicate.imported_at, archive.imported_at);
        assert_eq!(store.eduba_archives().unwrap().len(), 1);
        drop(store);
        let store = Store::open(destination, "").unwrap();
        let json = store.eduba_json(archive.digest.clone()).unwrap();
        let output = dir.path().join("export.json");
        write_json(&output, &json).unwrap();
        let roundtrip = prepare(&output).unwrap();
        assert_eq!(roundtrip.preview.digest, archive.digest);
        assert_eq!(
            serde_json::from_str::<Snapshot>(&roundtrip.json).unwrap(),
            sample()
        );
        let second = Store::open(dir.path().join("second.db"), "").unwrap();
        let receipt = second.import_eduba(roundtrip).unwrap();
        assert_eq!(second.eduba_json(receipt.digest).unwrap(), json);
        let schema_after: String = source
            .call(|c| {
                Box::pin(async move {
                    sqlx::query_scalar("SELECT group_concat(sql) FROM sqlite_master")
                        .fetch_one(c)
                        .await
                })
            })
            .unwrap();
        assert_eq!(schema_before, schema_after);
        assert_eq!(
            serde_json::from_str::<Snapshot>(&prepare(&path).unwrap().json).unwrap(),
            sample()
        );
    }
    #[test]
    fn archives_are_immutable_and_corruption_is_detected_before_export() {
        let dir = tempfile::tempdir().unwrap();
        let path = json_source(dir.path(), &sample());
        let store = Store::open(dir.path().join("destination.db"), "").unwrap();
        let archive = store.import_eduba(prepare(&path).unwrap()).unwrap();
        assert!(execute(&store, "UPDATE eduba_archives SET snapshot='{}'").is_err());
        assert!(execute(&store, "DELETE FROM eduba_archives").is_err());
        execute(&store, "DROP TRIGGER immutable_eduba_update").unwrap();
        let mut changed = sample();
        changed.learners[0].name = "tampered".into();
        let (json, _) = normalize(changed).unwrap();
        store
            .call(move |c| {
                Box::pin(async move {
                    sqlx::query("UPDATE eduba_archives SET snapshot=?")
                        .bind(json)
                        .execute(c)
                        .await?;
                    Ok(())
                })
            })
            .unwrap();
        assert!(store
            .eduba_json(archive.digest)
            .unwrap_err()
            .contains("digest mismatch"));
    }
    #[test]
    fn canonical_order_deduplicates_same_records_from_different_sources() {
        let dir = tempfile::tempdir().unwrap();
        let mut first = sample();
        first.learners.push(Learner {
            id: "aaa".into(),
            name: "earlier".into(),
            created_at: 1,
        });
        let (a, _) = normalize(first.clone()).unwrap();
        first.learners.reverse();
        let path = json_source(dir.path(), &first);
        assert_eq!(prepare(&path).unwrap().json, a);
    }
    #[test]
    fn unsupported_columns_are_rejected_without_discarding_fields() {
        let dir = tempfile::tempdir().unwrap();
        let (store, path) = source(dir.path());
        execute(&store, "ALTER TABLE learner ADD COLUMN extra TEXT").unwrap();
        assert!(prepare(&path)
            .err()
            .unwrap()
            .contains("unsupported record columns"));
    }
    #[test]
    fn missing_tables_and_views_are_rejected() {
        let dir = tempfile::tempdir().unwrap();
        let (store, path) = source(dir.path());
        execute(&store, "ALTER TABLE submission RENAME TO old_submission; CREATE VIEW submission AS SELECT * FROM old_submission").unwrap();
        assert!(prepare(&path)
            .err()
            .unwrap()
            .contains("missing supported record table"));
    }
    #[test]
    fn sqlite_invalid_types_and_oversize_are_rejected_before_loading() {
        let dir = tempfile::tempdir().unwrap();
        let (store, path) = source(dir.path());
        execute(&store, "UPDATE learner SET created_at='bad'").unwrap();
        assert!(prepare(&path).err().unwrap().contains("types or size"));
        execute(
            &store,
            "UPDATE learner SET created_at=1,name=CAST(zeroblob(16777217) AS TEXT)",
        )
        .unwrap();
        assert!(prepare(&path).err().unwrap().contains("types or size"));
    }
    #[test]
    fn invalid_relationships_and_duplicate_ids_are_rejected() {
        let mut data = sample();
        data.lessons[0].course_id = "missing".into();
        assert!(normalize(data).unwrap_err().contains("relationship"));
        let mut data = sample();
        data.learners.push(data.learners[0].clone());
        assert!(normalize(data).unwrap_err().contains("duplicate"));
    }
    #[test]
    fn version_unknown_fields_row_and_json_limits_are_enforced() {
        let dir = tempfile::tempdir().unwrap();
        let mut data = sample();
        data.version = 2;
        assert!(prepare(&json_source(dir.path(), &data)).is_err());
        let path = json_source(dir.path(), &sample());
        let text = std::fs::read_to_string(&path).unwrap().replacen(
            "\"version\":1",
            "\"version\":1,\"secret\":true",
            1,
        );
        std::fs::write(&path, text).unwrap();
        assert!(prepare(&path).is_err());
        let mut data = sample();
        data.learners = (0..MAX_ROWS)
            .map(|i| Learner {
                id: format!("{i}"),
                name: "name".into(),
                created_at: 0,
            })
            .collect();
        assert!(normalize(data).unwrap_err().contains("10000"));
        std::fs::write(&path, vec![b' '; MAX_BYTES + 1]).unwrap();
        assert!(prepare(&path).err().unwrap().contains("16 MiB"));
    }
    #[test]
    fn export_never_overwrites_even_if_target_already_exists() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("exists.json");
        std::fs::write(&path, "keep").unwrap();
        assert!(write_json(&path, "replace").is_err());
        assert_eq!(std::fs::read_to_string(&path).unwrap(), "keep");
    }
    #[cfg(windows)]
    #[test]
    fn network_and_device_paths_are_rejected_before_opening() {
        for path in [
            r"\\server\share\source.db",
            r"\\?\UNC\server\share\source.db",
            r"\\.\pipe\source",
        ] {
            assert!(require_local(Path::new(path)).is_err());
        }
    }
}
