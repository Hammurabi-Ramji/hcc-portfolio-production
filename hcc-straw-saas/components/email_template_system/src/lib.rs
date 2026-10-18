pub struct EmailTemplate {
    pub subject: String,
    pub body_html: String,
}

pub struct TemplateEngine;

impl TemplateEngine {
    pub fn welcome_email(user_name: &str) -> EmailTemplate {
        EmailTemplate {
            subject: "Welcome to Our Platform!".to_string(),
            body_html: format!(
                "<html><body><h1>Hello, {}!</h1><p>Welcome to the most advanced SaaS platform.</p></body></html>",
                user_name
            ),
        }
    }

    pub fn password_reset(reset_link: &str) -> EmailTemplate {
        EmailTemplate {
            subject: "Password Reset Request".to_string(),
            body_html: format!(
                "<html><body><p>Click <a href='{}'>here</a> to reset your password.</p></body></html>",
                reset_link
            ),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_welcome_template() {
        let email = TemplateEngine::welcome_email("Alice");
        assert!(email.body_html.contains("Hello, Alice!"));
    }
}
