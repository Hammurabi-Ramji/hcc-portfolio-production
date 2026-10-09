use crate::{
    dag::{ExecutionResult, Graph, RunStatus},
    flow::{FlowId, FlowRecord},
};
use rusqlite::{params, Connection, OptionalExtension};
use std::{
    fs::{self, File, OpenOptions, TryLockError},
    path::{Path, PathBuf},
    sync::{Arc, Mutex},
};

#[derive(Clone)]
pub struct DbState(Arc<DbSession>);
struct DbSession {
    connection: Mutex<Connection>,
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
    fn finish(mut self, graph: Graph) -> TerminalExecution {
        match graph.validate() {
            Ok(valid) => {
                self.0.order = valid.topological();
                (self.0.status, self.0.results) = valid.execute();
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

fn recover_abandoned(conn: &Connection, directory: &Path) -> Result<(), String> {
    let rows: Vec<(String, String, String)> = {
        let mut statement = conn.prepare("SELECT r.id,r.result,o.session FROM desk_runs r JOIN desk_run_owners o ON r.id=o.run_id").map_err(|e| e.to_string())?;
        let rows = statement
            .query_map([], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)))
            .map_err(|e| e.to_string())?;
        rows.collect::<Result<_, _>>().map_err(|e| e.to_string())?
    };
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
            conn.execute(
                "UPDATE desk_runs SET result=?1 WHERE id=?2 AND result=?3",
                params![
                    serde_json::to_string(&result).map_err(|e| e.to_string())?,
                    id,
                    original
                ],
            )
            .map_err(|e| e.to_string())?;
        }
        // Lock is held through reconciliation. Terminal runs need no owner.
        conn.execute("DELETE FROM desk_run_owners WHERE run_id=?1", [id])
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

impl DbState {
    pub fn open(path: impl AsRef<Path>) -> Result<Self, String> {
        if let Some(parent) = path.as_ref().parent().filter(|p| !p.as_os_str().is_empty()) {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        let conn = Connection::open(path.as_ref()).map_err(|e| e.to_string())?;
        conn.busy_timeout(std::time::Duration::from_secs(5))
            .map_err(|e| e.to_string())?;
        conn.execute_batch(include_str!("schema.sql"))
            .map_err(|e| e.to_string())?;
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
        // cannot be proven. See the migration disposition in A-F035's report.
        recover_abandoned(&conn, &directory)?;
        Ok(Self(Arc::new(DbSession {
            connection: Mutex::new(conn),
            session,
            lock,
            lock_path,
        })))
    }
    pub fn list(&self) -> Result<Vec<FlowRecord>, String> {
        let conn = self.0.connection.lock().map_err(|e| e.to_string())?;
        let mut statement = conn
            .prepare("SELECT record FROM desk_flows ORDER BY updated_at DESC")
            .map_err(|e| e.to_string())?;
        let records = statement
            .query_map([], |r| r.get::<_, String>(0))
            .map_err(|e| e.to_string())?;
        records
            .map(|r| {
                serde_json::from_str(&r.map_err(|e| e.to_string())?).map_err(|e| e.to_string())
            })
            .collect()
    }
    pub fn load(&self, id: FlowId) -> Result<Option<FlowRecord>, String> {
        let conn = self.0.connection.lock().map_err(|e| e.to_string())?;
        let json: Option<String> = conn
            .query_row(
                "SELECT record FROM desk_flows WHERE id=?1",
                [id.to_string()],
                |r| r.get(0),
            )
            .optional()
            .map_err(|e| e.to_string())?;
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
        let conn = self.0.connection.lock().map_err(|e| e.to_string())?;
        let json = serde_json::to_string(&flow).map_err(|e| e.to_string())?;
        conn.execute("INSERT INTO desk_flows(id, record, updated_at) VALUES (?1,?2,?3) ON CONFLICT(id) DO UPDATE SET record=excluded.record, updated_at=excluded.updated_at", params![flow.id.to_string(), json, flow.updated_at]).map_err(|e| e.to_string())?;
        Ok(flow)
    }
    pub fn delete(&self, id: FlowId) -> Result<(), String> {
        let conn = self.0.connection.lock().map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM desk_flows WHERE id=?1", [id.to_string()])
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    pub fn health(&self) -> Result<(), String> {
        self.0
            .connection
            .lock()
            .map_err(|e| e.to_string())?
            .query_row("SELECT 1", [], |_| Ok(()))
            .map_err(|e| e.to_string())
    }
    fn record_run(&self, result: &ExecutionResult) -> Result<(), String> {
        let mut conn = self.0.connection.lock().map_err(|e| e.to_string())?;
        let transaction = conn.transaction().map_err(|e| e.to_string())?;
        transaction.execute("INSERT INTO desk_runs(id,flow_id,result) VALUES (?1,?2,?3) ON CONFLICT(id) DO UPDATE SET result=excluded.result", params![result.id, result.flow_id.to_string(), serde_json::to_string(result).map_err(|e| e.to_string())?]).map_err(|e| e.to_string())?;
        if matches!(result.status, RunStatus::Running) {
            transaction
                .execute(
                    "INSERT INTO desk_run_owners(run_id,session) VALUES (?1,?2)",
                    params![result.id, self.0.session],
                )
                .map_err(|e| e.to_string())?;
        } else {
            transaction
                .execute("DELETE FROM desk_run_owners WHERE run_id=?1", [&result.id])
                .map_err(|e| e.to_string())?;
        }
        transaction.commit().map_err(|e| e.to_string())
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
        let conn = self.0.connection.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare("SELECT result FROM desk_runs WHERE flow_id=?1 ORDER BY rowid DESC LIMIT 100")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([id.to_string()], |r| r.get::<_, String>(0))
            .map_err(|e| e.to_string())?;
        rows.map(|r| {
            serde_json::from_str(&r.map_err(|e| e.to_string())?).map_err(|e| e.to_string())
        })
        .collect()
    }
    pub fn execute_workflow(&self, id: FlowId, graph: Graph) -> Result<ExecutionResult, String> {
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
        .finish(graph)
        .record(self)
    }
}
