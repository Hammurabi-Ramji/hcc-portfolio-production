#[derive(Debug, PartialEq)]
pub enum NotificationType {
    Email,
    SMS,
    Push,
}

pub struct NotificationManager;

impl NotificationManager {
    pub fn send(target: &str, message: &str, n_type: NotificationType) -> bool {
        match n_type {
            NotificationType::Email => println!("Sending Email to {}: {}", target, message),
            NotificationType::SMS => println!("Sending SMS to {}: {}", target, message),
            NotificationType::Push => println!("Sending Push to {}: {}", target, message),
        }
        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_notification_send() {
        assert!(NotificationManager::send("test@example.com", "Hello", NotificationType::Email));
        assert!(NotificationManager::send("123456789", "Hello", NotificationType::SMS));
    }
}
