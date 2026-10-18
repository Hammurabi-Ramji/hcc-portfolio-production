//! Errors of the Stele. Every refusal is named; none are silent.

use thiserror::Error;

pub type Result<T> = std::result::Result<T, SteleError>;

#[derive(Debug, Clone, PartialEq, Eq, Error)]
pub enum SteleError {
    /// Carving needs the vault signer; unlock the vault first.
    #[error("the vault is locked: carving needs the vault signer")]
    VaultLocked,
    /// The ledger failed verification (link, hash, signature, anchor or precedent digest).
    #[error("ledger quarantined: {0}")]
    Quarantined(String),
    /// Any other refusal from the security layer.
    #[error("security: {0}")]
    Security(String),
    /// A stored precedent could not be rebuilt (bad uuid or timestamp).
    #[error("ledger state error: {0}")]
    LedgerState(String),
}

impl From<String> for SteleError {
    fn from(message: String) -> Self {
        if message.contains("vault_locked") {
            SteleError::VaultLocked
        } else if message.contains("ledger_quarantined") {
            SteleError::Quarantined(message)
        } else {
            SteleError::Security(message)
        }
    }
}
