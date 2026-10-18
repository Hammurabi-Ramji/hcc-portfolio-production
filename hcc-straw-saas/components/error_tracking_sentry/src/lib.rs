pub struct SentryTracker;

impl SentryTracker {
    pub fn capture_exception(error: &str) {
        println!("[SENTRY] Captured error: {}", error);
    }

    pub fn capture_message(msg: &str) {
        println!("[SENTRY] Logged message: {}", msg);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_tracking() {
        SentryTracker::capture_exception("NullPointerException");
    }
}
