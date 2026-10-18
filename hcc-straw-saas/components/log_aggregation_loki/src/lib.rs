pub enum LogLevel {
    Info,
    Warn,
    Error,
}

pub struct LokiLogger;

impl LokiLogger {
    pub fn log(level: LogLevel, message: &str) {
        let level_str = match level {
            LogLevel::Info => "INFO",
            LogLevel::Warn => "WARN",
            LogLevel::Error => "ERROR",
        };
        println!("[LOKI {}] {}", level_str, message);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_logging() {
        LokiLogger::log(LogLevel::Info, "System started");
        LokiLogger::log(LogLevel::Error, "Database connection failed");
    }
}
