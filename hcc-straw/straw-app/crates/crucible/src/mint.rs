//! Sovereign Stele minting. BSM-CODE: gate.stele.mint()
//!
//! A run that earns SOVEREIGN CERTIFIED is carved into the vault ledger as a
//! precedent: the full gate report as the body, the verdict as the rationale.
//! It lands in the same signed chain as the application's grants and vault
//! events, signed by the one vault signer, so carving needs the vault
//! passphrase. Do not mint while the desktop app has the same database open.

use std::path::Path;
use std::sync::Arc;

use chrono::Utc;
use sha2::{Digest, Sha256};
use straw_security::Security;
use straw_stele::{Judgment, Precedent, PrecedentCore, Scribe, SteleError};
use straw_storage::Store;
use uuid::Uuid;
use zeroize::Zeroizing;

use crate::report::{render_json, result_line};
use crate::{composite_status, CompositeStatus, GateResult};

/// Version of the legal code Crucible verdicts are judged under.
pub const RULES_VERSION: u32 = 1;

/// Environment variable consulted when no passphrase file is given.
pub const PASSPHRASE_ENV: &str = "CRUCIBLE_VAULT_PASSPHRASE";

#[derive(Debug, thiserror::Error)]
pub enum MintError {
    #[error("{0}")]
    Vault(String),
    #[error("stele: {0}")]
    Stele(#[from] SteleError),
}

#[derive(Debug)]
pub struct Minted {
    /// Position in the shared ledger.
    pub seq: u32,
    pub digest: String,
    pub entry_hash: String,
    pub public_key: String,
}

/// Passphrase from a file (trailing newline trimmed) or the environment.
pub fn read_passphrase(file: Option<&Path>) -> Result<Zeroizing<String>, MintError> {
    let raw = match file {
        Some(path) => std::fs::read_to_string(path)
            .map_err(|e| MintError::Vault(format!("cannot read passphrase file {}: {e}", path.display())))?,
        None => std::env::var(PASSPHRASE_ENV)
            .map_err(|_| MintError::Vault(format!("no passphrase: pass --passphrase-file or set {PASSPHRASE_ENV}")))?,
    };
    Ok(Zeroizing::new(raw.trim_end_matches(['\r', '\n']).to_owned()))
}

/// Opens the application's vault database and verifies its ledger. The vault
/// must already exist; Crucible never creates the identity that signs for the app.
pub fn open_vault(db: &Path, anchor: &Path) -> Result<Arc<Security>, MintError> {
    if !db.is_file() {
        return Err(MintError::Vault(format!("vault database not found: {}", db.display())));
    }
    let store = Store::open(db, "").map_err(MintError::Vault)?;
    let security = Security::open(store, anchor.to_path_buf()).map_err(MintError::Vault)?;
    let status = security.status().map_err(MintError::Vault)?;
    if !status.created {
        return Err(MintError::Vault("vault is not initialized: create it in the app first".into()));
    }
    if status.quarantined {
        return Err(MintError::Vault("ledger quarantined: refusing to write to an unverified chain".into()));
    }
    Ok(Arc::new(security))
}

/// Carve a sealed verdict for `root` into the vault ledger.
pub fn mint(
    db: &Path,
    anchor: &Path,
    passphrase: Zeroizing<String>,
    root: &Path,
    results: &[GateResult],
) -> Result<Minted, MintError> {
    if composite_status(results) != CompositeStatus::SovereignCertified {
        return Err(MintError::Vault("all nine distinct gates must pass before certification".into()));
    }
    let security = open_vault(db, anchor)?;
    security
        .unlock(passphrase)
        .map_err(|e| MintError::Vault(format!("cannot unlock the vault: {e}")))?;
    let result = mint_unlocked(security.clone(), root, results);
    let _ = security.lock();
    result
}

/// Desktop path: reuse the already-unlocked vault and its single signer.
pub fn mint_unlocked(security: Arc<Security>, root: &Path, results: &[GateResult]) -> Result<Minted, MintError> {
    if composite_status(results) != CompositeStatus::SovereignCertified {
        return Err(MintError::Vault("all nine distinct gates must pass before certification".into()));
    }
    let source = crate::evidence::snapshot(root).map_err(|e| MintError::Vault(e.to_string()))?;
    let scribe = Scribe::new(security);

    let name = root
        .canonicalize()
        .ok()
        .and_then(|p| p.file_name().map(|n| n.to_string_lossy().into_owned()))
        .unwrap_or_else(|| ".".into());
    // Bind the verdict to the schema it certified.
    let manifest = std::fs::read(root.join(crate::gates::structure::MANIFEST))
        .ok()
        .map(|bytes| format!("{:x}", Sha256::digest(bytes)));
    let body = serde_json::json!({
        "project": name,
        "manifest_sha256": manifest,
        "source": source,
        "scope": "source/configuration inputs excluding generated and vendored directories; no binary or semantic-safety certification",
        "report": serde_json::from_str::<serde_json::Value>(&render_json(results)).unwrap_or_default(),
    });

    let now = Utc::now();
    let sealed = scribe.carve(
        Precedent::draft(PrecedentCore {
            id: Uuid::new_v4(),
            title: format!("Crucible verdict: {name}"),
            body: serde_json::to_string_pretty(&body).unwrap_or_default(),
            author: "crucible".into(),
            created_at: now,
            rules_version: RULES_VERSION,
        })
        .judge(Judgment { judge: "crucible".into(), rationale: result_line(results), judged_at: now }),
    )?;
    let receipt = sealed.receipt();
    Ok(Minted {
        seq: receipt.seq,
        digest: receipt.digest.clone(),
        entry_hash: receipt.entry_hash.clone(),
        public_key: receipt.public_key.clone(),
    })
}

/// Verifies the whole vault ledger and counts its precedents. Needs no passphrase.
/// Returns (precedent count, newest precedent's entry hash).
pub fn verify_stele(db: &Path, anchor: &Path) -> Result<(usize, Option<String>), MintError> {
    let scribe = Scribe::new(open_vault(db, anchor)?);
    Ok((scribe.count()?, scribe.tip()?))
}
