pub enum NotificationType {
    Email,
    SMS,
    Push,
}

pub struct NotificationManager;

impl NotificationManager {
    pub fn send(target: &str, message: &str, n_type: NotificationType) {
        match n_type {
            NotificationType::Email => println!("Sending Email to {}: {}", target, message),
            NotificationType::SMS => println!("Sending SMS to {}: {}", target, message),
            NotificationType::Push => println!("Sending Push to {}: {}", target, message),
        }
    }
}
