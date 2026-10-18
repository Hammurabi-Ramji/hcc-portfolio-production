#[derive(Debug, serde::Serialize, specta::Type)]
#[serde(rename_all = "snake_case")]
pub enum ErrorCode {
    VaultLocked,
    GrantRequired,
    GrantInvalid,
    LedgerQuarantined,
    InvalidRequest,
    EngineNotWarmed,
    EngineBusy,
    PackTampered,
    PackPathEscape,
    BudgetExhausted,
    RevisionConflict,
    LocalServiceUnavailable,
    Internal,
}
#[derive(Debug, serde::Serialize, specta::Type)]
pub struct ApiError {
    pub code: ErrorCode,
    pub message: String,
}
impl From<String> for ApiError {
    fn from(message: String) -> Self {
        let code = if message.contains("vault_locked") {
            ErrorCode::VaultLocked
        } else if message.contains("grant_required") {
            ErrorCode::GrantRequired
        } else if message.contains("grant_invalid") {
            ErrorCode::GrantInvalid
        } else if message.contains("ledger_quarantined") {
            ErrorCode::LedgerQuarantined
        } else if message.contains("engine_not_warmed") {
            ErrorCode::EngineNotWarmed
        } else if message.contains("engine_busy") {
            ErrorCode::EngineBusy
        } else if message.contains("pack_tampered") {
            ErrorCode::PackTampered
        } else if message.contains("pack_path_escape") {
            ErrorCode::PackPathEscape
        } else if message.contains("budget_exhausted") {
            ErrorCode::BudgetExhausted
        } else if message.contains("revision conflict") {
            ErrorCode::RevisionConflict
        } else if message.contains("Connection Failed") {
            ErrorCode::LocalServiceUnavailable
        } else if message.contains("invalid")
            || message.contains("required")
            || message.contains("must")
        {
            ErrorCode::InvalidRequest
        } else {
            ErrorCode::Internal
        };
        Self { code, message }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn stable_error_codes_preserve_the_message_and_prioritize_specific_failures() {
        for (message, expected) in [
            ("vault_locked: unlock required", "vault_locked"),
            ("grant_required", "grant_required"),
            ("grant_invalid", "grant_invalid"),
            ("ledger_quarantined", "ledger_quarantined"),
            ("engine_not_warmed", "engine_not_warmed"),
            ("engine_busy", "engine_busy"),
            ("pack_tampered", "pack_tampered"),
            ("pack_path_escape", "pack_path_escape"),
            ("budget_exhausted", "budget_exhausted"),
            ("revision conflict", "revision_conflict"),
            ("Connection Failed", "local_service_unavailable"),
            ("invalid input", "invalid_request"),
            ("name required", "invalid_request"),
            ("must be positive", "invalid_request"),
            ("unexpected store failure", "internal"),
        ] {
            let error = ApiError::from(message.to_owned());
            let value = serde_json::to_value(&error).unwrap();
            assert_eq!(value["code"], expected);
            assert_eq!(value["message"], message);
        }
    }
}
