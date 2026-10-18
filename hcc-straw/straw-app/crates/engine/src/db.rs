use crate::{
    dag::{ExecutionResult, Graph, RunStatus},
    flow::{FlowId, FlowRecord},
};
use sqlx::{Connection, Row};
use std::{
    fs::{self, File, OpenOptions, TryLockError},
    path::{Path, PathBuf},
    sync::Arc,
};
use straw_storage::Store;

/// Documented shutdown-only SQL for ownerless pre-upgrade Running rows.
/// Embedded for the controlled upgrade path; never applied by [`DbState::open`].
pub const OWNERLESS_LEGACY_RUNNING_MIGRATION_SQL: &str =
    include_str!("offline-legacy-migration.sql");

#[derive(Clone)]
pub struct DbState(Arc<DbSession>);
struct DbSession {
    connection: Store,
    session: String,
    lock: File,
    lock_path: PathBuf,
}
impl Drop for DbSession {
    fn drop(&mut self) {
        let _ = self.lock.unlock();
        let _ = fs::remove_file(&self.lock_path);
    }
}

// Only these transitions can start/finish a newly executing run. SQLite records
// Running before execution and Terminal after execution; no replay transition exists.
struct PendingExecution(ExecutionResult);
struct RunningExecution(ExecutionResult);
struct TerminalExecution(ExecutionResult);
impl PendingExecution {
    fn start(self, db: &DbState) -> Result<RunningExecution, String> {
        db.record_run(&self.0)?;
        Ok(RunningExecution(self.0))
    }
}
impl RunningExecution {
    fn finish_with(
        mut self,
        graph: Graph,
        generate: &dyn Fn(&crate::contract::ModelSettings, &str, &str) -> Result<String, String>,
    ) -> TerminalExecution {
        match graph.validate() {
            Ok(valid) => {
                self.0.order = valid.topological();
                (self.0.status, self.0.results) = valid.execute_with(generate);
            }
            Err(error) => {
                self.0.status = RunStatus::Failed {
                    failed_node: None,
                    error: error.to_string(),
                }
            }
        }
        let started = chrono::DateTime::parse_from_rfc3339(&self.0.started_at).ok();
        let now = chrono::Utc::now();
        let finished = started
            .map(|s| now.max(s.with_timezone(&chrono::Utc) + chrono::Duration::nanoseconds(1)))
            .unwrap_or(now);
        self.0.finished_at = Some(finished.to_rfc3339());
        TerminalExecution(self.0)
    }
}
impl TerminalExecution {
    fn record(self, db: &DbState) -> Result<ExecutionResult, String> {
        db.record_run(&self.0)?;
        Ok(self.0)
    }
}

fn recover_abandoned(conn: &Store, directory: &Path) -> Result<(), String> {
    let rows: Vec<(String, String, String)> = conn.call(|c| Box::pin(async move {
        Ok(sqlx::query("SELECT r.id,r.result,o.session FROM desk_runs r JOIN desk_run_owners o ON r.id=o.run_id").fetch_all(c).await?.into_iter().map(|r| (r.get(0),r.get(1),r.get(2))).collect())
    }))?;
    for (id, original, session) in rows {
        // A stored owner is an opaque UUID, never a user-controlled filesystem path.
        let session = uuid::Uuid::parse_str(&session).map_err(|_| "invalid execution session")?;
        let path = directory.join(format!("{session}.lock"));
        let lock = OpenOptions::new()
            .read(true)
            .write(true)
            .create(true)
            .truncate(false)
            .open(path)
            .map_err(|e| e.to_string())?;
        match lock.try_lock() {
            Ok(()) => {}
            Err(TryLockError::WouldBlock) => continue, // another live DbState owns it
            Err(TryLockError::Error(e)) => return Err(e.to_string()),
        }
        let mut result: ExecutionResult =
            serde_json::from_str(&original).map_err(|e| e.to_string())?;
        if matches!(result.status, RunStatus::Running) {
            result.status = RunStatus::Failed { failed_node: None, error: "interrupted: execution session ended before completion; side effects were not replayed".into() };
            let started = chrono::DateTime::parse_from_rfc3339(&result.started_at)
                .map_err(|e| e.to_string())?;
            result.finished_at = Some(
                chrono::Utc::now()
                    .max(started.with_timezone(&chrono::Utc) + chrono::Duration::nanoseconds(1))
                    .to_rfc3339(),
            );
            let json = serde_json::to_string(&result).map_err(|e| e.to_string())?;
            let update_id = id.clone();
            conn.call(move |c| {
                Box::pin(async move {
                    sqlx::query("UPDATE desk_runs SET result=? WHERE id=? AND result=?")
                        .bind(json)
                        .bind(update_id)
                        .bind(original)
                        .execute(c)
                        .await?;
                    Ok(())
                })
            })?;
        }
        // Lock is held through reconciliation. Terminal runs need no owner.
        conn.call(move |c| {
            Box::pin(async move {
                sqlx::query("DELETE FROM desk_run_owners WHERE run_id=?")
                    .bind(id)
                    .execute(c)
                    .await?;
                Ok(())
            })
        })?;
    }
    Ok(())
}

impl DbState {
    pub fn open(path: impl AsRef<Path>) -> Result<Self, String> {
        if let Some(parent) = path.as_ref().parent().filter(|p| !p.as_os_str().is_empty()) {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        let conn = Store::open(path.as_ref(), include_str!("schema.sql"))?;
        let canonical = path.as_ref().canonicalize().map_err(|e| e.to_string())?;
        let mut directory = canonical.as_os_str().to_os_string();
        directory.push(".sessions");
        let directory = PathBuf::from(directory);
        fs::create_dir_all(&directory).map_err(|e| e.to_string())?;
        let session = uuid::Uuid::new_v4().to_string();
        let lock_path = directory.join(format!("{session}.lock"));
        let lock = OpenOptions::new()
            .read(true)
            .write(true)
            .create_new(true)
            .open(&lock_path)
            .map_err(|e| e.to_string())?;
        lock.try_lock().map_err(|e| e.to_string())?;
        // Ownerless pre-upgrade records are deliberately untouched: their liveness
        // cannot be proven. Operators apply OWNERLESS_LEGACY_RUNNING_MIGRATION_SQL
        // only via migrate_ownerless_legacy_running during a stopped-process upgrade.
        recover_abandoned(&conn, &directory)?;
        Ok(Self(Arc::new(DbSession {
            connection: conn,
            session,
            lock,
            lock_path,
        })))
    }

    /// Controlled upgrade only: terminate ownerless legacy Running rows.
    ///
    /// Does not run on ordinary open. Preconditions: every other process using
    /// this database is stopped, a SQLite backup exists, and the current schema
    /// is initialized. Owned Running and already-terminal rows are preserved.
    /// Side effects are never replayed. Safe to call again (idempotent).
    pub fn migrate_ownerless_legacy_running(&self) -> Result<u64, String> {
        let pending: i64 = self.0.connection.call(|c| {
            Box::pin(async move {
                Ok(sqlx::query_scalar(
                    "SELECT COUNT(*) FROM desk_runs \
                     WHERE json_extract(result,'$.status.kind')='running' \
                       AND NOT EXISTS (\
                         SELECT 1 FROM desk_run_owners WHERE run_id=desk_runs.id\
                       )",
                )
                .fetch_one(c)
                .await?)
            })
        })?;
        self.0.connection.call(|c| {
            Box::pin(async move {
                sqlx::raw_sql(OWNERLESS_LEGACY_RUNNING_MIGRATION_SQL)
                    .execute(c)
                    .await?;
                Ok(())
            })
        })?;
        Ok(pending as u64)
    }
    pub fn list(&self) -> Result<Vec<FlowRecord>, String> {
        let records: Vec<String> = self.0.connection.call(|c| {
            Box::pin(async move {
                sqlx::query_scalar("SELECT record FROM desk_flows ORDER BY updated_at DESC")
                    .fetch_all(c)
                    .await
            })
        })?;
        records
            .into_iter()
            .map(|r| serde_json::from_str(&r).map_err(|e| e.to_string()))
            .collect()
    }
    pub fn load(&self, id: FlowId) -> Result<Option<FlowRecord>, String> {
        let json: Option<String> = self.0.connection.call(move |c| {
            Box::pin(async move {
                sqlx::query_scalar("SELECT record FROM desk_flows WHERE id=?")
                    .bind(id.to_string())
                    .fetch_optional(c)
                    .await
            })
        })?;
        json.map(|s| serde_json::from_str(&s).map_err(|e| e.to_string()))
            .transpose()
    }
    pub fn save(&self, mut flow: FlowRecord) -> Result<FlowRecord, String> {
        if flow.name.trim().is_empty() {
            return Err("flow name is required".into());
        }
        flow.updated_at = chrono::Utc::now().to_rfc3339();
        if let Some(existing) = self.load(flow.id)? {
            flow.created_at = existing.created_at;
        }
        let json = serde_json::to_string(&flow).map_err(|e| e.to_string())?;
        let id = flow.id.to_string();
        let updated = flow.updated_at.clone();
        self.0.connection.call(move |c| Box::pin(async move { sqlx::query("INSERT INTO desk_flows(id,record,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET record=excluded.record,updated_at=excluded.updated_at").bind(id).bind(json).bind(updated).execute(c).await?; Ok(()) }))?;
        Ok(flow)
    }
    pub fn delete(&self, id: FlowId) -> Result<(), String> {
        self.0.connection.call(move |c| {
            Box::pin(async move {
                sqlx::query("DELETE FROM desk_flows WHERE id=?")
                    .bind(id.to_string())
                    .execute(c)
                    .await?;
                Ok(())
            })
        })?;
        Ok(())
    }
    pub fn health(&self) -> Result<(), String> {
        self.0.connection.call(|c| {
            Box::pin(async move {
                sqlx::query("SELECT 1").fetch_one(c).await?;
                Ok(())
            })
        })
    }
    fn record_run(&self, result: &ExecutionResult) -> Result<(), String> {
        let id = result.id.clone();
        let flow = result.flow_id.to_string();
        let json = serde_json::to_string(result).map_err(|e| e.to_string())?;
        let running = matches!(result.status, RunStatus::Running);
        let session = self.0.session.clone();
        self.0.connection.call(move |c| Box::pin(async move {
            let mut tx=c.begin().await?;
            sqlx::query("INSERT INTO desk_runs(id,flow_id,result) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET result=excluded.result").bind(&id).bind(flow).bind(json).execute(&mut *tx).await?;
            if running { sqlx::query("INSERT INTO desk_run_owners(run_id,session) VALUES(?,?)").bind(id).bind(session).execute(&mut *tx).await?; }
            else { sqlx::query("DELETE FROM desk_run_owners WHERE run_id=?").bind(id).execute(&mut *tx).await?; }
            tx.commit().await
        }))
    }

    #[cfg(test)]
    pub(crate) fn simulate_interrupted(&self, id: FlowId) -> Result<ExecutionResult, String> {
        let result = ExecutionResult {
            id: uuid::Uuid::new_v4().to_string(),
            flow_id: id,
            status: RunStatus::Running,
            started_at: chrono::Utc::now().to_rfc3339(),
            finished_at: None,
            results: vec![],
            order: vec![],
        };
        self.record_run(&result)?;
        Ok(result)
    }
    pub fn executions(&self, id: FlowId) -> Result<Vec<ExecutionResult>, String> {
        let rows: Vec<String> = self.0.connection.call(move |c| {
            Box::pin(async move {
                sqlx::query_scalar(
                    "SELECT result FROM desk_runs WHERE flow_id=? ORDER BY rowid DESC LIMIT 100",
                )
                .bind(id.to_string())
                .fetch_all(c)
                .await
            })
        })?;
        rows.into_iter()
            .map(|r| serde_json::from_str(&r).map_err(|e| e.to_string()))
            .collect()
    }
    pub fn storage(&self) -> &Store {
        &self.0.connection
    }
    pub fn execute_workflow(&self, id: FlowId, graph: Graph) -> Result<ExecutionResult, String> {
        self.execute_workflow_with(id, graph, &crate::network::generate)
    }
    pub fn execute_workflow_with(
        &self,
        id: FlowId,
        graph: Graph,
        generate: &dyn Fn(&crate::contract::ModelSettings, &str, &str) -> Result<String, String>,
    ) -> Result<ExecutionResult, String> {
        if self.load(id)?.is_none() {
            return Err("save flow before execution".into());
        }
        PendingExecution(ExecutionResult {
            id: uuid::Uuid::new_v4().to_string(),
            flow_id: id,
            status: RunStatus::Running,
            started_at: chrono::Utc::now().to_rfc3339(),
            finished_at: None,
            results: vec![],
            order: vec![],
        })
        .start(self)?
        .finish_with(graph, generate)
        .record(self)
    }
}
