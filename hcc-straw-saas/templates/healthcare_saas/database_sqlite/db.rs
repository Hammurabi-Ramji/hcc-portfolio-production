use rusqlite::{Connection, Result};

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(path: &str) -> Result<Self> {
        let conn = Connection::open(path)?;
        Ok(Self { conn })
    }

    pub fn init_schema(&self) -> Result<()> {
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                username TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE
            )",
            [],
        )?;
        Ok(())
    }

    pub fn add_user(&self, username: &str, email: &str) -> Result<()> {
        self.conn.execute(
            "INSERT INTO users (username, email) VALUES (?1, ?2)",
            [username, email],
        )?;
        Ok(())
    }
}
