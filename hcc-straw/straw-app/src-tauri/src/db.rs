use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlowRecord {
    pub id: String,
    pub name: String,
    pub definition: String, // JSON
    pub created_at: String,
    pub updated_at: String,
}

pub fn open() -> Result<Connection> {
    let path = get_db_path();
    let conn = Connection::open(&path)?;
    // Enable foreign key enforcement (SQLite has it OFF by default)
    conn.execute_batch("PRAGMA foreign_keys = ON;")?;
    migrate(&conn)?;
    Ok(conn)
}

fn get_db_path() -> std::path::PathBuf {
    let mut path = dirs_next::data_dir().unwrap_or_else(|| std::path::PathBuf::from("."));
    path.push("straw");
    std::fs::create_dir_all(&path).ok();
    path.push("straw.db");
    path
}

fn migrate(conn: &Connection) -> Result<()> {
    conn.execute_batch("
        CREATE TABLE IF NOT EXISTS flows (
            id         TEXT PRIMARY KEY,
            name       TEXT NOT NULL,
            definition TEXT NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS executions (
            id         TEXT PRIMARY KEY,
            flow_id    TEXT NOT NULL,
            status     TEXT NOT NULL DEFAULT 'running',
            result     TEXT,
            started_at TEXT NOT NULL,
            finished_at TEXT,
            FOREIGN KEY (flow_id) REFERENCES flows(id)
        );
    ")
}

pub fn list_flows(conn: &Connection) -> Result<Vec<FlowRecord>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, definition, created_at, updated_at FROM flows ORDER BY updated_at DESC"
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(FlowRecord {
            id: row.get(0)?,
            name: row.get(1)?,
            definition: row.get(2)?,
            created_at: row.get(3)?,
            updated_at: row.get(4)?,
        })
    })?;
    rows.collect()
}

pub fn save_flow(conn: &Connection, id: &str, name: &str, definition: &str) -> Result<()> {
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO flows (id, name, definition, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?4)
         ON CONFLICT(id) DO UPDATE SET name=?2, definition=?3, updated_at=?4",
        params![id, name, definition, now],
    )?;
    Ok(())
}

pub fn load_flow(conn: &Connection, id: &str) -> Result<Option<FlowRecord>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, definition, created_at, updated_at FROM flows WHERE id = ?1"
    )?;
    let mut rows = stmt.query_map(params![id], |row| {
        Ok(FlowRecord {
            id: row.get(0)?,
            name: row.get(1)?,
            definition: row.get(2)?,
            created_at: row.get(3)?,
            updated_at: row.get(4)?,
        })
    })?;
    Ok(rows.next().transpose()?)
}

pub fn delete_flow(conn: &Connection, id: &str) -> Result<()> {
    // Delete child execution records first (cascade not auto-enforced by older SQLite)
    conn.execute("DELETE FROM executions WHERE flow_id = ?1", params![id])?;
    conn.execute("DELETE FROM flows WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn save_execution(conn: &Connection, id: &str, flow_id: &str, result_json: &str) -> Result<()> {
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO executions (id, flow_id, status, result, started_at, finished_at)
         VALUES (?1, ?2, 'completed', ?3, ?4, ?4)",
        params![id, flow_id, result_json, now],
    )?;
    Ok(())
}
