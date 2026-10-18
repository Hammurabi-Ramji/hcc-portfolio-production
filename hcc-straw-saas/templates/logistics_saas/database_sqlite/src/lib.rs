use rusqlite::{Connection, Result};

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(path: &str) -> Result<Self> {
        let conn = Connection::open(path)?;
        Ok(Self { conn })
    }

    pub fn in_memory() -> Result<Self> {
        let conn = Connection::open_in_memory()?;
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

    pub fn get_user_count(&self) -> Result<i64> {
        let mut stmt = self.conn.prepare("SELECT COUNT(*) FROM users")?;
        let count: i64 = stmt.query_row([], |row| row.get(0))?;
        Ok(count)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_db_operations() {
        let db = Database::in_memory().unwrap();
        db.init_schema().unwrap();
        db.add_user("testuser", "test@example.com").unwrap();
        assert_eq!(db.get_user_count().unwrap(), 1);
    }
}
