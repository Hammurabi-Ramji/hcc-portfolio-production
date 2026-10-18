//! SQLx owns SQLite on a dedicated Tokio thread. Synchronous domain APIs never
//! enter a caller's runtime, and async IPC can dispatch them with spawn_blocking.
#![forbid(unsafe_code)]
pub mod eduba;
use sqlx::{
    sqlite::{SqliteConnectOptions, SqliteJournalMode},
    Connection, Row, SqliteConnection,
};
use std::{
    future::Future,
    path::Path,
    pin::Pin,
    sync::{mpsc, Arc, Mutex},
    thread,
    time::Duration,
};
type FutureResult<'a, T> = Pin<Box<dyn Future<Output = Result<T, sqlx::Error>> + Send + 'a>>;
type Job = Box<dyn FnOnce(&mut SqliteConnection, &tokio::runtime::Runtime) + Send>;
struct Actor {
    sender: Option<mpsc::Sender<Job>>,
    thread: Mutex<Option<thread::JoinHandle<()>>>,
}
impl Drop for Actor {
    fn drop(&mut self) {
        self.sender.take();
        if let Ok(slot) = self.thread.get_mut() {
            if let Some(thread) = slot.take() {
                let _ = thread.join();
            }
        }
    }
}
#[derive(Clone)]
pub struct Store(Arc<Actor>);
impl Store {
    pub fn open(path: impl AsRef<Path>, schema: &'static str) -> Result<Self, String> {
        let path = path.as_ref().to_path_buf();
        if let Some(parent) = path.parent().filter(|p| !p.as_os_str().is_empty()) {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        let (sender, receiver) = mpsc::channel::<Job>();
        let (ready, started) = mpsc::sync_channel(1);
        let thread = thread::Builder::new()
            .name("straw-sqlx".into())
            .spawn(move || {
                let run = || -> Result<(tokio::runtime::Runtime, SqliteConnection), String> {
                    let runtime = tokio::runtime::Builder::new_current_thread()
                        .enable_all()
                        .build()
                        .map_err(|e| e.to_string())?;
                    let options = SqliteConnectOptions::new()
                        .filename(path)
                        .create_if_missing(true)
                        .foreign_keys(true)
                        .journal_mode(SqliteJournalMode::Wal)
                        .busy_timeout(Duration::from_secs(5));
                    let mut connection = runtime
                        .block_on(SqliteConnection::connect_with(&options))
                        .map_err(|e| e.to_string())?;
                    runtime
                        .block_on(sqlx::raw_sql(schema).execute(&mut connection))
                        .map_err(|e| e.to_string())?;
                    runtime
                        .block_on(
                            sqlx::raw_sql(include_str!("schema.sql")).execute(&mut connection),
                        )
                        .map_err(|e| e.to_string())?;
                    Ok((runtime, connection))
                };
                match run() {
                    Ok((runtime, mut connection)) => {
                        let _ = ready.send(Ok(()));
                        for job in receiver {
                            job(&mut connection, &runtime);
                        }
                        let _ = runtime.block_on(connection.close());
                    }
                    Err(error) => {
                        let _ = ready.send(Err(error));
                    }
                }
            })
            .map_err(|e| e.to_string())?;
        started.recv().map_err(|e| e.to_string())??;
        Ok(Self(Arc::new(Actor {
            sender: Some(sender),
            thread: Mutex::new(Some(thread)),
        })))
    }
    pub fn call<T: Send + 'static>(
        &self,
        f: impl for<'a> FnOnce(&'a mut SqliteConnection) -> FutureResult<'a, T> + Send + 'static,
    ) -> Result<T, String> {
        let (send, receive) = mpsc::sync_channel(1);
        self.0
            .sender
            .as_ref()
            .ok_or("storage closed")?
            .send(Box::new(move |connection, runtime| {
                let _ = send.send(runtime.block_on(f(connection)).map_err(|e| e.to_string()));
            }))
            .map_err(|e| e.to_string())?;
        receive.recv().map_err(|e| e.to_string())?
    }
    /// Application-level copy-on-write: revisions are immutable; only a head
    /// pointer changes. A stale editor cannot overwrite a newer revision.
    pub fn revise(
        &self,
        id: String,
        expected: Option<String>,
        text: String,
    ) -> Result<Revision, String> {
        if text.len() > 4 * 1024 * 1024 {
            return Err("document exceeds 4 MiB".into());
        }
        use sha2::{Digest, Sha256};
        let revision = Revision {
            id: uuid::Uuid::new_v4().to_string(),
            document_id: id.clone(),
            parent: expected.clone(),
            digest: format!("{:x}", Sha256::digest(text.as_bytes())),
            text,
        };
        let value = revision.clone();
        self.call(move |c| Box::pin(async move {
            let mut tx = c.begin().await?;
            let current: Option<String> = sqlx::query_scalar("SELECT revision FROM document_heads WHERE id=?").bind(&id).fetch_optional(&mut *tx).await?;
            if current != expected { return Err(sqlx::Error::Protocol("revision conflict: reload before saving".into())); }
            sqlx::query("INSERT INTO document_revisions(id,document_id,parent,digest,text) VALUES(?,?,?,?,?)").bind(&value.id).bind(&value.document_id).bind(&value.parent).bind(&value.digest).bind(&value.text).execute(&mut *tx).await?;
            sqlx::query("INSERT INTO document_heads(id,revision) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET revision=excluded.revision").bind(&id).bind(&value.id).execute(&mut *tx).await?;
            tx.commit().await
        }))?;
        Ok(revision)
    }
    pub fn documents(&self) -> Result<Vec<Revision>, String> {
        self.call(|c| Box::pin(async move { let rows = sqlx::query("SELECT r.id,r.document_id,r.parent,r.digest,r.text FROM document_heads h JOIN document_revisions r ON r.id=h.revision ORDER BY h.rowid DESC").fetch_all(c).await?; Ok(rows.into_iter().map(|r| Revision { id:r.get(0), document_id:r.get(1), parent:r.get(2), digest:r.get(3), text:r.get(4) }).collect()) }))
    }
    pub fn put_vector(&self, id: String, model: String, vector: Vec<f32>) -> Result<(), String> {
        validate_vector(&vector)?;
        let dim = vector.len() as i64;
        let bytes: Vec<u8> = vector.iter().flat_map(|v| v.to_le_bytes()).collect();
        self.call(move |c| Box::pin(async move { sqlx::query("INSERT INTO vectors(id,model,dimension,embedding) VALUES(?,?,?,?) ON CONFLICT(id,model) DO UPDATE SET dimension=excluded.dimension,embedding=excluded.embedding").bind(id).bind(model).bind(dim).bind(bytes).execute(c).await?; Ok(()) }))
    }
    /// Exact cosine search, deliberately no native SQLite extension or ANN claim.
    pub fn search(
        &self,
        model: String,
        vector: Vec<f32>,
        limit: u32,
    ) -> Result<Vec<VectorHit>, String> {
        validate_vector(&vector)?;
        if limit == 0 || limit > 100 {
            return Err("vector limit must be 1..100".into());
        }
        let dim = vector.len() as i64;
        let rows: Vec<(String, Vec<u8>)> = self.call(move |c| {
            Box::pin(async move {
                Ok(
                    sqlx::query("SELECT id,embedding FROM vectors WHERE model=? AND dimension=?")
                        .bind(model)
                        .bind(dim)
                        .fetch_all(c)
                        .await?
                        .into_iter()
                        .map(|r| (r.get(0), r.get(1)))
                        .collect(),
                )
            })
        })?;
        let norm = vector
            .iter()
            .map(|v| (*v as f64).powi(2))
            .sum::<f64>()
            .sqrt();
        let mut hits = Vec::new();
        for (id, bytes) in rows {
            if bytes.len() != vector.len() * 4 {
                return Err("corrupt vector length".into());
            }
            let other: Vec<f32> = bytes
                .as_chunks::<4>().0.iter()
                .map(|b| f32::from_le_bytes(*b))
                .collect();
            validate_vector(&other)?;
            let denominator = norm
                * other
                    .iter()
                    .map(|v| (*v as f64).powi(2))
                    .sum::<f64>()
                    .sqrt();
            let dot = vector
                .iter()
                .zip(other)
                .map(|(a, b)| *a as f64 * b as f64)
                .sum::<f64>();
            hits.push(VectorHit {
                id,
                score: (dot / denominator).clamp(-1., 1.),
            });
        }
        hits.sort_by(|a, b| b.score.total_cmp(&a.score).then(a.id.cmp(&b.id)));
        hits.truncate(limit as usize);
        Ok(hits)
    }
}
fn validate_vector(vector: &[f32]) -> Result<(), String> {
    if vector.is_empty()
        || vector.len() > 8192
        || vector.iter().any(|v| !v.is_finite())
        || vector.iter().all(|v| *v == 0.)
    {
        return Err("vector must contain 1..8192 finite values with nonzero norm".into());
    }
    Ok(())
}
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize, specta::Type)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Revision {
    pub id: String,
    pub document_id: String,
    pub parent: Option<String>,
    pub digest: String,
    pub text: String,
}
#[derive(Debug, serde::Serialize, specta::Type)]
pub struct VectorHit {
    pub id: String,
    pub score: f64,
}

#[cfg(test)]
mod tests {
    use super::*;
    #[tokio::test]
    async fn revisions_survive_restart_and_reject_stale_write_inside_runtime() {
        let d = tempfile::tempdir().unwrap();
        let path = d.path().join("store.db");
        let db = Store::open(&path, "").unwrap();
        let first = db.revise("doc".into(), None, "one".into()).unwrap();
        let second = db
            .revise("doc".into(), Some(first.id.clone()), "two".into())
            .unwrap();
        assert!(db
            .revise("doc".into(), Some(first.id.clone()), "stale".into())
            .is_err());
        assert_eq!(
            db.call(move |c| Box::pin(async move {
                sqlx::query_scalar::<_, String>("SELECT text FROM document_revisions WHERE id=?")
                    .bind(first.id)
                    .fetch_one(c)
                    .await
            }))
            .unwrap(),
            "one"
        );
        drop(db);
        let db = Store::open(path, "").unwrap();
        assert_eq!(db.documents().unwrap()[0].id, second.id);
    }
    #[test]
    fn vector_search_filters_model_dimension_and_invalid_values() {
        let d = tempfile::tempdir().unwrap();
        let db = Store::open(d.path().join("v.db"), "").unwrap();
        db.put_vector("same".into(), "m".into(), vec![1., 0.])
            .unwrap();
        db.put_vector("opposite".into(), "m".into(), vec![-1., 0.])
            .unwrap();
        db.put_vector("foreign".into(), "other".into(), vec![1., 0.])
            .unwrap();
        assert!(db
            .put_vector("bad".into(), "m".into(), vec![f32::NAN])
            .is_err());
        assert_eq!(
            db.search("m".into(), vec![1., 0.], 1).unwrap()[0].id,
            "same"
        );
        assert!(db.search("m".into(), vec![0., 0.], 1).is_err());
    }
}
