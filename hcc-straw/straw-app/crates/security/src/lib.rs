//! Native vault, digest-bound single-use grants and independently checkpointed
//! Ed25519 ledger. No plaintext is automatically offered to an inference client.
#![forbid(unsafe_code)]
pub mod digital_hands;
pub mod recovery;
use chacha20poly1305::{
    aead::{Aead, KeyInit, Payload},
    XChaCha20Poly1305, XNonce,
};
use ed25519_dalek::{Signature, Signer, SigningKey, VerifyingKey};
use sha2::{Digest, Sha256};
use sqlx::{Connection, Row, SqliteConnection};
use std::{
    path::PathBuf,
    sync::Mutex,
    time::{SystemTime, UNIX_EPOCH},
};
use straw_storage::Store;
use zeroize::Zeroizing;
const GENESIS: &str = "0000000000000000000000000000000000000000000000000000000000000000";
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize, specta::Type)]
#[serde(rename_all = "snake_case")]
pub enum Permission {
    Assist,
    Escalate,
    Egress,
    Export,
    Import,
    PackInstall,
    Unseal,
    Carve,
    Validate,
}
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Grant {
    pub id: String,
    pub permissions: Vec<Permission>,
    pub subject: String,
    pub expires: u32,
    pub signature: String,
}
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Checkpoint {
    pub sequence: u32,
    pub head: String,
    pub public_key: String,
    pub signature: String,
}
#[derive(Debug, serde::Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct Status {
    pub created: bool,
    pub unlocked: bool,
    pub quarantined: bool,
    pub checkpoint: Option<Checkpoint>,
}
/// Ledger entry kind for a carved precedent; its subject is the precedent digest.
pub const PRECEDENT_KIND: &str = "precedent";
const PRECEDENT_FIELD_MAX: usize = 8 * 1024;
const PRECEDENT_BODY_MAX: usize = 1024 * 1024;

/// A precedent as stored beside the ledger. The ledger entry that carries its
/// digest is signed by the vault signer, so the precedent shares the one chain
/// and the one signer with every grant and vault event.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PrecedentRecord {
    pub id: String,
    pub title: String,
    pub body: String,
    pub author: String,
    /// RFC 3339 with nanoseconds; part of the digest, stored verbatim.
    pub created_at: String,
    pub judge: String,
    pub rationale: String,
    pub judged_at: String,
    pub rules_version: u32,
}

impl PrecedentRecord {
    /// SHA-256 over a canonical, order-fixed encoding of every field.
    pub fn digest(&self) -> String {
        let bytes = serde_json::to_vec(&serde_json::json!([
            "STRAW-precedent-v1",
            self.id,
            self.title,
            self.body,
            self.author,
            self.created_at,
            self.rules_version,
            self.judge,
            self.rationale,
            self.judged_at
        ]))
        .expect("scalar serialization");
        hex(&Sha256::digest(bytes))
    }
    fn validate(&self) -> Result<(), String> {
        let small = [&self.id, &self.title, &self.author, &self.created_at, &self.judge, &self.rationale, &self.judged_at];
        if small.iter().any(|f| f.is_empty() || f.len() > PRECEDENT_FIELD_MAX) || self.body.len() > PRECEDENT_BODY_MAX {
            return Err("invalid precedent size".into());
        }
        Ok(())
    }
}

/// Proof that a precedent sits in the chain.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PrecedentReceipt {
    /// Position in the shared ledger (grants and vault events share the numbering).
    pub seq: u32,
    pub digest: String,
    /// Hash of the signed ledger entry that commits to the digest.
    pub entry_hash: String,
    pub public_key: String,
}

/// A precedent recovered from a ledger that has just passed full verification.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StoredPrecedent {
    pub record: PrecedentRecord,
    pub receipt: PrecedentReceipt,
}

struct Session {
    key: Zeroizing<[u8; 32]>,
    signer: SigningKey,
}
struct State {
    session: Option<Session>,
    quarantined: bool,
}
pub struct Security {
    store: Store,
    anchor: PathBuf,
    state: Mutex<State>,
    operations: Mutex<()>,
}
fn now() -> Result<u32, String> {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs()
        .try_into()
        .map_err(|_| "clock outside grant range".into())
}
fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}
fn unhex(value: &str) -> Result<Vec<u8>, String> {
    if !value.len().is_multiple_of(2) {
        return Err("invalid hex".into());
    }
    let (pairs, _) = value.as_bytes().as_chunks::<2>();
    pairs
        .iter()
        .map(|b| {
            std::str::from_utf8(b)
                .map_err(|e| e.to_string())
                .and_then(|s| u8::from_str_radix(s, 16).map_err(|e| e.to_string()))
        })
        .collect()
}
pub fn digest(value: &impl serde::Serialize) -> Result<String, String> {
    fn sorted(value: serde_json::Value) -> serde_json::Value {
        match value {
            serde_json::Value::Object(map) => {
                let mut items: Vec<_> = map.into_iter().collect();
                items.sort_by(|a, b| a.0.cmp(&b.0));
                serde_json::Value::Object(items.into_iter().map(|(k, v)| (k, sorted(v))).collect())
            }
            serde_json::Value::Array(a) => {
                serde_json::Value::Array(a.into_iter().map(sorted).collect())
            }
            v => v,
        }
    }
    let bytes = serde_json::to_vec(&sorted(
        serde_json::to_value(value).map_err(|e| e.to_string())?,
    ))
    .map_err(|e| e.to_string())?;
    if bytes.len() > 4 * 1024 * 1024 {
        return Err("operation exceeds size bound".into());
    }
    Ok(hex(&Sha256::digest(bytes)))
}
fn derive(password: &str, salt: &[u8]) -> Result<Zeroizing<[u8; 32]>, String> {
    if password.len() < 12 || password.len() > 1024 {
        return Err("passphrase must contain 12..1024 bytes".into());
    }
    let params = argon2::Params::new(65536, 3, 1, Some(32)).map_err(|e| e.to_string())?;
    let argon = argon2::Argon2::new(argon2::Algorithm::Argon2id, argon2::Version::V0x13, params);
    let mut key = Zeroizing::new([0u8; 32]);
    argon
        .hash_password_into(password.as_bytes(), salt, &mut *key)
        .map_err(|e| e.to_string())?;
    Ok(key)
}
fn seal(key: &[u8; 32], identity: &str, plain: &[u8]) -> Result<Vec<u8>, String> {
    let mut nonce = [0u8; 24];
    getrandom::fill(&mut nonce).map_err(|e| e.to_string())?;
    let cipher = XChaCha20Poly1305::new(key.into());
    let ciphertext = cipher
        .encrypt(
            XNonce::from_slice(&nonce),
            Payload {
                msg: plain,
                aad: identity.as_bytes(),
            },
        )
        .map_err(|_| "vault encryption failed")?;
    Ok([nonce.to_vec(), ciphertext].concat())
}
fn unseal(key: &[u8; 32], identity: &str, ciphertext: &[u8]) -> Result<Zeroizing<Vec<u8>>, String> {
    if ciphertext.len() < 40 || ciphertext.len() > 1024 * 1024 + 40 {
        return Err("invalid vault ciphertext".into());
    }
    XChaCha20Poly1305::new(key.into())
        .decrypt(
            XNonce::from_slice(&ciphertext[..24]),
            Payload {
                msg: &ciphertext[24..],
                aad: identity.as_bytes(),
            },
        )
        .map(Zeroizing::new)
        .map_err(|_| "vault authentication failed".into())
}
fn protocol(error: String) -> sqlx::Error {
    sqlx::Error::Protocol(error)
}
fn entry_bytes(seq: u32, kind: &str, subject: &str, at: u32, previous: &str) -> Vec<u8> {
    serde_json::to_vec(&serde_json::json!([
        "STRAW-ledger-v1",
        seq,
        kind,
        subject,
        at,
        previous
    ]))
    .expect("scalar serialization")
}
fn checkpoint_bytes(seq: u32, head: &str, public: &str) -> Vec<u8> {
    serde_json::to_vec(&serde_json::json!([
        "STRAW-checkpoint-v1",
        seq,
        head,
        public
    ]))
    .expect("scalar serialization")
}
fn precedent_from_row(row: &sqlx::sqlite::SqliteRow) -> Result<PrecedentRecord, sqlx::Error> {
    let rules: i64 = row.get(9);
    Ok(PrecedentRecord {
        id: row.get(1),
        title: row.get(2),
        body: row.get(3),
        author: row.get(4),
        created_at: row.get(5),
        judge: row.get(6),
        rationale: row.get(7),
        judged_at: row.get(8),
        rules_version: u32::try_from(rules).map_err(|_| protocol("ledger_quarantined: bad rules_version".into()))?,
    })
}
async fn verified(c: &mut SqliteConnection) -> Result<Option<Checkpoint>, sqlx::Error> {
    let public: Option<Vec<u8>> =
        sqlx::query_scalar("SELECT public FROM secure_identity WHERE slot=1")
            .fetch_optional(&mut *c)
            .await?;
    let Some(public) = public else {
        let count: i64 = sqlx::query_scalar("SELECT count(*) FROM secure_ledger")
            .fetch_one(&mut *c)
            .await?;
        if count != 0 {
            return Err(protocol("ledger_quarantined: identity missing".into()));
        }
        digital_hands::verify(c, &std::collections::BTreeMap::new()).await?;
        return Ok(None);
    };
    let array: [u8; 32] = public
        .as_slice()
        .try_into()
        .map_err(|_| protocol("invalid public key".into()))?;
    let key = VerifyingKey::from_bytes(&array).map_err(|e| protocol(e.to_string()))?;
    let mut previous = GENESIS.to_string();
    let mut sequence = 0u32;
    let mut signature = Vec::new();
    let rows = sqlx::query(
        "SELECT seq,kind,subject,at,previous,hash,signature FROM secure_ledger ORDER BY seq",
    )
    .fetch_all(&mut *c)
    .await?;
    if rows.is_empty() {
        return Err(protocol("ledger_quarantined: ledger missing".into()));
    }
    // seq -> digest committed by each signed "precedent" entry.
    let mut committed = std::collections::BTreeMap::new();
    let mut credential_imports = std::collections::BTreeMap::new();
    for row in rows {
        let seq: i64 = row.get(0);
        let kind: String = row.get(1);
        let subject: String = row.get(2);
        let at: i64 = row.get(3);
        let prev: String = row.get(4);
        let hash: String = row.get(5);
        let sig: Vec<u8> = row.get(6);
        if seq != sequence as i64 || prev != previous || at < 0 || at > u32::MAX as i64 {
            return Err(protocol(
                "ledger_quarantined: sequence or link mismatch".into(),
            ));
        }
        let bytes = entry_bytes(sequence, &kind, &subject, at as u32, &prev);
        if hash != hex(&Sha256::digest(&bytes)) {
            return Err(protocol("ledger_quarantined: hash mismatch".into()));
        }
        key.verify_strict(
            &bytes,
            &Signature::from_slice(&sig).map_err(|e| protocol(e.to_string()))?,
        )
        .map_err(|_| protocol("ledger_quarantined: invalid signature".into()))?;
        if kind == PRECEDENT_KIND {
            committed.insert(seq, subject.clone());
        }
        if kind == digital_hands::KIND { credential_imports.insert(seq, subject); }
        previous = hash;
        signature = sig;
        sequence = sequence
            .checked_add(1)
            .ok_or_else(|| protocol("ledger exhausted".into()))?;
    }
    // Every signed precedent entry must have exactly one stored precedent whose
    // recomputed digest equals the signed subject, and no stored precedent may
    // exist without a signed entry.
    let stored = sqlx::query(
        "SELECT seq,id,title,body,author,created_at,judge,rationale,judged_at,rules_version,digest FROM secure_precedent ORDER BY seq",
    )
    .fetch_all(&mut *c)
    .await?;
    if stored.len() != committed.len() {
        return Err(protocol("ledger_quarantined: precedent missing or unsigned".into()));
    }
    for row in stored {
        let seq: i64 = row.get(0);
        let record = precedent_from_row(&row)?;
        let recorded: String = row.get(10);
        let digest = record.digest();
        if digest != recorded || committed.get(&seq) != Some(&digest) {
            return Err(protocol("ledger_quarantined: precedent altered".into()));
        }
    }
    // The head signature is generated independently below; entry signatures
    digital_hands::verify(c, &credential_imports).await?;
    // prove the chain. External anchor comparison detects database rollback.
    Ok(Some(Checkpoint {
        sequence: sequence - 1,
        head: previous,
        public_key: hex(&public),
        signature: hex(&signature),
    }))
}
async fn append(
    c: &mut SqliteConnection,
    key: &SigningKey,
    kind: &str,
    subject: &str,
) -> Result<Checkpoint, sqlx::Error> {
    let last = sqlx::query("SELECT seq,hash FROM secure_ledger ORDER BY seq DESC LIMIT 1")
        .fetch_optional(&mut *c)
        .await?;
    let (sequence, previous) = if let Some(last) = last {
        (
            u32::try_from(last.get::<i64, _>(0))
                .map_err(|_| protocol("invalid sequence".into()))?
                .checked_add(1)
                .ok_or_else(|| protocol("ledger exhausted".into()))?,
            last.get::<String, _>(1),
        )
    } else {
        (0, GENESIS.into())
    };
    let at = now().map_err(protocol)?;
    let bytes = entry_bytes(sequence, kind, subject, at, &previous);
    let hash = hex(&Sha256::digest(&bytes));
    let signature = key.sign(&bytes).to_bytes().to_vec();
    sqlx::query("INSERT INTO secure_ledger(seq,kind,subject,at,previous,hash,signature) VALUES(?,?,?,?,?,?,?)").bind(sequence as i64).bind(kind).bind(subject).bind(at as i64).bind(previous).bind(&hash).bind(signature).execute(c).await?;
    let public = hex(key.verifying_key().as_bytes());
    let signature = hex(&key
        .sign(&checkpoint_bytes(sequence, &hash, &public))
        .to_bytes());
    Ok(Checkpoint {
        sequence,
        head: hash,
        public_key: public,
        signature,
    })
}
fn anchor_valid(anchor: &Checkpoint) -> Result<(), String> {
    let public = unhex(&anchor.public_key)?;
    let array: [u8; 32] = public
        .as_slice()
        .try_into()
        .map_err(|_| "invalid anchor key")?;
    VerifyingKey::from_bytes(&array)
        .map_err(|e| e.to_string())?
        .verify_strict(
            &checkpoint_bytes(anchor.sequence, &anchor.head, &anchor.public_key),
            &Signature::from_slice(&unhex(&anchor.signature)?).map_err(|e| e.to_string())?,
        )
        .map_err(|_| "ledger_quarantined: anchor signature invalid".into())
}
impl Security {
    pub fn open(store: Store, anchor: PathBuf) -> Result<Self, String> {
        store.call(|c| {
            Box::pin(async move {
                sqlx::raw_sql(include_str!("schema.sql")).execute(c).await?;
                Ok(())
            })
        })?;
        let security = Self {
            store,
            anchor,
            state: Mutex::new(State {
                session: None,
                quarantined: false,
            }),
            operations: Mutex::new(()),
        };
        if security.check().is_err() {
            security
                .state
                .lock()
                .map_err(|e| e.to_string())?
                .quarantined = true;
        }
        Ok(security)
    }
    fn check(&self) -> Result<Option<Checkpoint>, String> {
        let head = self.store.call(|c| Box::pin(verified(c))).map_err(|e|format!("ledger_quarantined: {e}"))?;
        match head {
            None => {
                if self.anchor.exists() {
                    return Err("ledger_quarantined: database identity removed".into());
                }
                Ok(None)
            }
            Some(head) => {
                let anchor: Checkpoint = serde_json::from_slice(
                    &std::fs::read(&self.anchor)
                        .map_err(|_| "ledger_quarantined: checkpoint missing")?,
                )
                .map_err(|e| e.to_string())?;
                anchor_valid(&anchor)?;
                if (head.sequence, &head.head, &head.public_key)
                    != (anchor.sequence, &anchor.head, &anchor.public_key)
                {
                    return Err("ledger_quarantined: checkpoint differs from database".into());
                }
                Ok(Some(anchor))
            }
        }
    }
    fn checkpoint(&self, checkpoint: &Checkpoint) -> Result<(), String> {
        let next = self
            .anchor
            .with_extension(format!("{}.pending", uuid::Uuid::new_v4()));
        let bytes = serde_json::to_vec(checkpoint).map_err(|e| e.to_string())?;
        use std::io::Write;
        let mut file = std::fs::OpenOptions::new()
            .create_new(true)
            .write(true)
            .open(&next)
            .map_err(|e| e.to_string())?;
        file.write_all(&bytes)
            .and_then(|_| file.sync_all())
            .map_err(|e| e.to_string())?;
        drop(file);
        // Replacement is atomic on Windows via MoveFileEx in std rename.
        if let Err(error) = std::fs::rename(&next, &self.anchor) {
            self.state.lock().map_err(|e| e.to_string())?.quarantined = true;
            return Err(format!(
                "ledger_quarantined: checkpoint write failed: {error}"
            ));
        }
        Ok(())
    }
    pub fn status(&self) -> Result<Status, String> {
        let _operation = self.operations.lock().map_err(|e| e.to_string())?;
        let checked = self.check();
        let mut state = self.state.lock().map_err(|e| e.to_string())?;
        if checked.is_err() {
            state.quarantined = true;
            state.session = None;
        }
        let created: bool = self.store.call(|c| {
            Box::pin(async move {
                Ok(
                    sqlx::query_scalar::<_, i64>("SELECT count(*) FROM secure_identity")
                        .fetch_one(c)
                        .await?
                        > 0,
                )
            })
        })?;
        Ok(Status {
            created,
            unlocked: state.session.is_some(),
            quarantined: state.quarantined,
            checkpoint: checked.ok().flatten(),
        })
    }
    pub fn initialize(&self, password: Zeroizing<String>) -> Result<Status, String> {
        let operation = self.operations.lock().map_err(|e| e.to_string())?;
        let state = self.state.lock().map_err(|e| e.to_string())?;
        if state.quarantined {
            return Err("ledger_quarantined".into());
        }
        if self.check()?.is_some() {
            return Err("vault already exists".into());
        }
        drop(state);
        let mut salt = [0u8; 16];
        getrandom::fill(&mut salt).map_err(|e| e.to_string())?;
        let key = derive(&password, &salt)?;
        let mut seed = Zeroizing::new([0u8; 32]);
        getrandom::fill(&mut *seed).map_err(|e| e.to_string())?;
        let signer = SigningKey::from_bytes(&seed);
        let verifier = seal(&key, "STRAW-vault-verifier-v1", b"STRAW vault verified")?;
        let sealed = seal(&key, "STRAW-signing-key-v1", signer.as_bytes())?;
        let public = signer.verifying_key().to_bytes();
        let signer_copy = signer.clone();
        let checkpoint=self.store.call(move|c|Box::pin(async move{let mut tx=c.begin().await?;
            sqlx::query("INSERT INTO secure_identity(slot,salt,verifier,signer,public) VALUES(1,?,?,?,?)").bind(salt.to_vec()).bind(verifier).bind(sealed).bind(public.to_vec()).execute(&mut *tx).await?;
            let checkpoint=append(&mut tx,&signer_copy,"vault_initialized",GENESIS).await?;tx.commit().await?;Ok(checkpoint)
        }))?;
        self.checkpoint(&checkpoint)?;
        self.state.lock().map_err(|e| e.to_string())?.session = Some(Session { key, signer });
        drop(operation);
        self.status()
    }
    pub fn unlock(&self, password: Zeroizing<String>) -> Result<Status, String> {
        let operation = self.operations.lock().map_err(|e| e.to_string())?;
        if self.state.lock().map_err(|e| e.to_string())?.quarantined {
            return Err("ledger_quarantined".into());
        }
        self.check()?;
        let (salt, verifier, secret, public): (Vec<u8>, Vec<u8>, Vec<u8>, Vec<u8>) =
            self.store.call(|c| {
                Box::pin(async move {
                    let row = sqlx::query(
                        "SELECT salt,verifier,signer,public FROM secure_identity WHERE slot=1",
                    )
                    .fetch_one(c)
                    .await?;
                    Ok((row.get(0), row.get(1), row.get(2), row.get(3)))
                })
            })?;
        let key = derive(&password, &salt)?;
        let value = unseal(&key, "STRAW-vault-verifier-v1", &verifier)?;
        if value.as_slice() != b"STRAW vault verified" {
            return Err("vault authentication failed".into());
        }
        let seed = unseal(&key, "STRAW-signing-key-v1", &secret)?;
        let bytes = Zeroizing::new(
            <[u8; 32]>::try_from(seed.as_slice()).map_err(|_| "invalid signing key")?,
        );
        let signer = SigningKey::from_bytes(&bytes);
        if signer.verifying_key().as_bytes().as_slice() != public {
            return Err("ledger_quarantined: signing identity mismatch".into());
        }
        self.state.lock().map_err(|e| e.to_string())?.session = Some(Session { key, signer });
        drop(operation);
        self.status()
    }
    pub fn lock(&self) -> Result<(), String> {
        let _operation = self.operations.lock().map_err(|e| e.to_string())?;
        self.state.lock().map_err(|e| e.to_string())?.session = None;
        Ok(())
    }
    pub fn put(&self, id: String, value: Zeroizing<String>) -> Result<(), String> {
        let _operation = self.operations.lock().map_err(|e| e.to_string())?;
        if id.is_empty() || id.len() > 200 || value.len() > 1024 * 1024 {
            return Err("invalid vault item size".into());
        }
        self.check()?;
        let state = self.state.lock().map_err(|e| e.to_string())?;
        if state.quarantined {
            return Err("ledger_quarantined".into());
        }
        let session = state.session.as_ref().ok_or("vault_locked")?;
        let ciphertext = seal(&session.key, &format!("STRAW-item:{id}"), value.as_bytes())?;
        let subject = digest(&id)?;
        let signer = session.signer.clone();
        let checkpoint=self.store.call(move|c|Box::pin(async move{let mut tx=c.begin().await?;sqlx::query("INSERT INTO secure_vault(id,ciphertext) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET ciphertext=excluded.ciphertext").bind(id).bind(ciphertext).execute(&mut *tx).await?;let checkpoint=append(&mut tx,&signer,"vault_stored",&subject).await?;tx.commit().await?;Ok(checkpoint)}))?;
        drop(state);
        self.checkpoint(&checkpoint)
    }
    pub fn get(&self, id: String) -> Result<String, String> {
        let _operation = self.operations.lock().map_err(|e| e.to_string())?;
        let state = self.state.lock().map_err(|e| e.to_string())?;
        if state.quarantined {
            return Err("ledger_quarantined".into());
        }
        let session = state.session.as_ref().ok_or("vault_locked")?;
        let key = Zeroizing::new(*session.key);
        drop(state);
        let aad = format!("STRAW-item:{id}");
        let ciphertext: Vec<u8> = self.store.call(move |c| {
            Box::pin(async move {
                sqlx::query_scalar("SELECT ciphertext FROM secure_vault WHERE id=?")
                    .bind(id)
                    .fetch_one(c)
                    .await
            })
        })?;
        let plain = unseal(&key, &aad, &ciphertext)?;
        String::from_utf8(plain.to_vec()).map_err(|e| e.to_string())
    }
    /// Carve a precedent into the one ledger. The entry that commits to its
    /// digest is signed by the vault signer, like every other ledger entry, so
    /// the vault must be unlocked. The record and the entry land in a single
    /// transaction; a precedent can be neither edited nor removed afterwards.
    pub fn carve_precedent(&self, record: PrecedentRecord) -> Result<PrecedentReceipt, String> {
        record.validate()?;
        let _operation = self.operations.lock().map_err(|e| e.to_string())?;
        self.check()?;
        let state = self.state.lock().map_err(|e| e.to_string())?;
        if state.quarantined {
            return Err("ledger_quarantined".into());
        }
        let signer = state.session.as_ref().ok_or("vault_locked")?.signer.clone();
        let digest = record.digest();
        let (saved, subject) = (record, digest.clone());
        let checkpoint = self.store.call(move |c| {
            Box::pin(async move {
                let mut tx = c.begin().await?;
                let checkpoint = append(&mut tx, &signer, PRECEDENT_KIND, &subject).await?;
                sqlx::query("INSERT INTO secure_precedent(seq,id,title,body,author,created_at,judge,rationale,judged_at,rules_version,digest) VALUES(?,?,?,?,?,?,?,?,?,?,?)")
                    .bind(checkpoint.sequence as i64)
                    .bind(&saved.id)
                    .bind(&saved.title)
                    .bind(&saved.body)
                    .bind(&saved.author)
                    .bind(&saved.created_at)
                    .bind(&saved.judge)
                    .bind(&saved.rationale)
                    .bind(&saved.judged_at)
                    .bind(i64::from(saved.rules_version))
                    .bind(&subject)
                    .execute(&mut *tx)
                    .await?;
                tx.commit().await?;
                Ok(checkpoint)
            })
        })?;
        drop(state);
        self.checkpoint(&checkpoint)?;
        Ok(PrecedentReceipt {
            seq: checkpoint.sequence,
            digest,
            entry_hash: checkpoint.head,
            public_key: checkpoint.public_key,
        })
    }
    /// Every precedent in chain order. The whole ledger is re-verified first
    /// (links, hashes, signatures, anchor, precedent digests), so what comes
    /// back is what was signed. Reading does not require an unlocked vault.
    pub fn precedents(&self) -> Result<Vec<StoredPrecedent>, String> {
        let _operation = self.operations.lock().map_err(|e| e.to_string())?;
        if self.state.lock().map_err(|e| e.to_string())?.quarantined {
            return Err("ledger_quarantined".into());
        }
        let Some(anchor) = self.check()? else {
            return Ok(Vec::new());
        };
        let public_key = anchor.public_key;
        self.store.call(move |c| {
            Box::pin(async move {
                let rows = sqlx::query(
                    "SELECT p.seq,p.id,p.title,p.body,p.author,p.created_at,p.judge,p.rationale,p.judged_at,p.rules_version,p.digest,l.hash FROM secure_precedent p JOIN secure_ledger l ON l.seq=p.seq ORDER BY p.seq",
                )
                .fetch_all(c)
                .await?;
                rows.iter()
                    .map(|row| {
                        let seq: i64 = row.get(0);
                        Ok(StoredPrecedent {
                            record: precedent_from_row(row)?,
                            receipt: PrecedentReceipt {
                                seq: u32::try_from(seq).map_err(|_| protocol("invalid sequence".into()))?,
                                digest: row.get(10),
                                entry_hash: row.get(11),
                                public_key: public_key.clone(),
                            },
                        })
                    })
                    .collect()
            })
        })
    }
    pub fn issue(&self, permissions: Vec<Permission>, subject: String) -> Result<Grant, String> {
        self.issue_expiry(
            permissions,
            subject,
            now()?.checked_add(300).ok_or("clock overflow")?,
        )
    }
    fn issue_expiry(
        &self,
        permissions: Vec<Permission>,
        subject: String,
        expires: u32,
    ) -> Result<Grant, String> {
        let _operation = self.operations.lock().map_err(|e| e.to_string())?;
        if permissions.is_empty() || subject.len() != 64 || unhex(&subject)?.len() != 32 {
            return Err("invalid grant scope".into());
        }
        if permissions.contains(&Permission::Egress) || permissions.contains(&Permission::Escalate)
        {
            return Err("egress and external escalation are disabled".into());
        }
        self.check()?;
        let state = self.state.lock().map_err(|e| e.to_string())?;
        if state.quarantined {
            return Err("ledger_quarantined".into());
        }
        let signer = state.session.as_ref().ok_or("vault_locked")?.signer.clone();
        let mut grant = Grant {
            id: uuid::Uuid::new_v4().to_string(),
            permissions,
            subject,
            expires,
            signature: String::new(),
        };
        grant.signature = hex(&signer.sign(&grant_bytes(&grant)?).to_bytes());
        let saved = grant.clone();
        let checkpoint=self.store.call(move|c|Box::pin(async move{let mut tx=c.begin().await?;
            sqlx::query("INSERT INTO secure_grants(id,permissions,subject,expires,signature) VALUES(?,?,?,?,?)").bind(&saved.id).bind(serde_json::to_string(&saved.permissions).map_err(|e|protocol(e.to_string()))?).bind(&saved.subject).bind(saved.expires as i64).bind(unhex(&saved.signature).map_err(protocol)?).execute(&mut *tx).await?;
            let checkpoint=append(&mut tx,&signer,"grant_issued",&digest(&saved).map_err(protocol)?).await?;tx.commit().await?;Ok(checkpoint)
        }))?;
        drop(state);
        self.checkpoint(&checkpoint)?;
        Ok(grant)
    }
    pub fn consume(
        &self,
        id: String,
        permissions: Vec<Permission>,
        subject: String,
    ) -> Result<(), String> {
        let _operation = self.operations.lock().map_err(|e| e.to_string())?;
        self.check()?;
        let state = self.state.lock().map_err(|e| e.to_string())?;
        if state.quarantined {
            return Err("ledger_quarantined".into());
        }
        let signer = state.session.as_ref().ok_or("vault_locked")?.signer.clone();
        let checkpoint=self.store.call(move|c|Box::pin(async move{let mut tx=c.begin().await?;
            let row=sqlx::query("SELECT permissions,subject,expires,signature,used FROM secure_grants WHERE id=?").bind(&id).fetch_optional(&mut *tx).await?.ok_or_else(||protocol("grant_invalid".into()))?;
            let saved_permissions:String=row.get(0);let saved_subject:String=row.get(1);let expires:i64=row.get(2);let signature:Vec<u8>=row.get(3);let used:i64=row.get(4);
            let grant=Grant{id:id.clone(),permissions:serde_json::from_str(&saved_permissions).map_err(|e|protocol(e.to_string()))?,subject:saved_subject,expires:u32::try_from(expires).map_err(|_|protocol("grant_invalid".into()))?,signature:hex(&signature)};
            if used!=0||grant.permissions!=permissions||grant.subject!=subject||grant.expires<now().map_err(protocol)?{return Err(protocol("grant_invalid: scope, expiry or replay".into()));}
            signer.verifying_key().verify_strict(&grant_bytes(&grant).map_err(protocol)?,&Signature::from_slice(&signature).map_err(|_|protocol("grant_invalid".into()))?).map_err(|_|protocol("grant_invalid: signature".into()))?;
            let affected=sqlx::query("UPDATE secure_grants SET used=1 WHERE id=? AND used=0").bind(&id).execute(&mut *tx).await?.rows_affected();if affected!=1{return Err(protocol("grant_invalid: already consumed".into()));}
            let checkpoint=append(&mut tx,&signer,"grant_consumed",&digest(&grant).map_err(protocol)?).await?;tx.commit().await?;Ok(checkpoint)
        }))?;
        drop(state);
        self.checkpoint(&checkpoint)
    }
}
fn grant_bytes(grant: &Grant) -> Result<Vec<u8>, String> {
    serde_json::to_vec(&serde_json::json!([
        "STRAW-grant-v1",
        grant.id,
        grant.permissions,
        grant.subject,
        grant.expires
    ]))
    .map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    fn fixture() -> (tempfile::TempDir, Store, Security) {
        let d = tempfile::tempdir().unwrap();
        let store = Store::open(d.path().join("secure.db"), "").unwrap();
        let security = Security::open(store.clone(), d.path().join("head.json")).unwrap();
        (d, store, security)
    }
    #[test]
    fn encrypted_vault_restart_grants_replay_scope_and_plaintext_exclusion() {
        let (d, store, security) = fixture();
        security
            .initialize(Zeroizing::new("a strong test passphrase".into()))
            .unwrap();
        security
            .put(
                "secret".into(),
                Zeroizing::new("PRIVATE_SENTINEL_9284".into()),
            )
            .unwrap();
        assert_eq!(
            security.get("secret".into()).unwrap(),
            "PRIVATE_SENTINEL_9284"
        );
        let subject = digest(&serde_json::json!({"prompt":"test","model":"bundled"})).unwrap();
        let grant = security
            .issue(vec![Permission::Assist], subject.clone())
            .unwrap();
        assert!(security
            .consume(grant.id.clone(), vec![Permission::Export], subject.clone())
            .is_err());
        security
            .consume(grant.id.clone(), vec![Permission::Assist], subject.clone())
            .unwrap();
        assert!(security
            .consume(grant.id, vec![Permission::Assist], subject)
            .is_err());
        security.lock().unwrap();
        assert!(security.get("secret".into()).is_err());
        assert!(security
            .unlock(Zeroizing::new("incorrect passphrase".into()))
            .is_err());
        security
            .unlock(Zeroizing::new("a strong test passphrase".into()))
            .unwrap();
        assert!(security
            .issue(vec![Permission::Egress], "0".repeat(64))
            .is_err());
        drop(security);
        drop(store);
        for file in std::fs::read_dir(d.path()).unwrap() {
            let file = file.unwrap();
            if file.file_type().unwrap().is_file() {
                assert!(!std::fs::read(file.path())
                    .unwrap()
                    .windows(21)
                    .any(|b| b == b"PRIVATE_SENTINEL_9284"));
            }
        }
        let store = Store::open(d.path().join("secure.db"), "").unwrap();
        let reopened = Security::open(store, d.path().join("head.json")).unwrap();
        assert!(!reopened.status().unwrap().unlocked);
        reopened
            .unlock(Zeroizing::new("a strong test passphrase".into()))
            .unwrap();
        assert_eq!(
            reopened.get("secret".into()).unwrap(),
            "PRIVATE_SENTINEL_9284"
        );
    }
    #[test]
    fn checkpoint_rollback_quarantines_and_triggers_reject_mutation() {
        let (d, store, security) = fixture();
        security
            .initialize(Zeroizing::new("test passphrase longer".into()))
            .unwrap();
        let old = std::fs::read(d.path().join("head.json")).unwrap();
        security
            .issue(vec![Permission::Assist], "0".repeat(64))
            .unwrap();
        assert!(store
            .call(|c| Box::pin(async move {
                sqlx::query("DELETE FROM secure_ledger").execute(c).await?;
                Ok(())
            }))
            .is_err());
        std::fs::write(d.path().join("head.json"), old).unwrap();
        assert!(security.status().unwrap().quarantined);
        assert!(security
            .issue(vec![Permission::Assist], "0".repeat(64))
            .is_err());
    }
    #[test]
    fn canonical_digest_ignores_object_insertion_order() {
        assert_eq!(
            digest(&serde_json::json!({"a":1,"b":2})).unwrap(),
            digest(&serde_json::json!({"b":2,"a":1})).unwrap()
        );
    }
    #[test]
    fn expired_signed_grant_and_concurrent_replay_are_rejected() {
        let (_d, _store, security) = fixture();
        security
            .initialize(Zeroizing::new("test passphrase longer".into()))
            .unwrap();
        let expired = security
            .issue_expiry(vec![Permission::Assist], "0".repeat(64), now().unwrap() - 1)
            .unwrap();
        assert!(security
            .consume(expired.id, vec![Permission::Assist], "0".repeat(64))
            .unwrap_err()
            .contains("expiry"));
        let grant = security
            .issue(vec![Permission::Assist], "0".repeat(64))
            .unwrap();
        let security = std::sync::Arc::new(security);
        let threads: Vec<_> = (0..2)
            .map(|_| {
                let security = security.clone();
                let id = grant.id.clone();
                std::thread::spawn(move || {
                    security.consume(id, vec![Permission::Assist], "0".repeat(64))
                })
            })
            .collect();
        let results: Vec<_> = threads
            .into_iter()
            .map(|thread| thread.join().unwrap())
            .collect();
        assert_eq!(results.iter().filter(|result| result.is_ok()).count(), 1);
    }
    fn record(id: &str, title: &str) -> PrecedentRecord {
        PrecedentRecord {
            id: id.into(),
            title: title.into(),
            body: format!("The text of {title}."),
            author: "R.K. Girdhari".into(),
            created_at: "2026-10-13T00:00:00.123456789Z".into(),
            judge: "Hammurabi".into(),
            rationale: "Weighed. Found just.".into(),
            judged_at: "2026-10-13T01:00:00.000000000Z".into(),
            rules_version: 1,
        }
    }
    const PASS: &str = "a strong test passphrase";
    #[test]
    fn precedents_share_the_one_chain_and_the_one_signer() {
        let (_d, _store, security) = fixture();
        security.initialize(Zeroizing::new(PASS.into())).unwrap();
        security.lock().unwrap();
        assert_eq!(
            security.carve_precedent(record("p1", "Law I")).unwrap_err(),
            "vault_locked"
        );
        security.unlock(Zeroizing::new(PASS.into())).unwrap();
        security.issue(vec![Permission::Assist], "0".repeat(64)).unwrap();
        let receipt = security.carve_precedent(record("p1", "Law I")).unwrap();
        security.put("k".into(), Zeroizing::new("v".into())).unwrap();
        // initialize=0, grant=1, precedent=2, vault item=3: one numbering.
        assert_eq!(receipt.seq, 2);
        assert_eq!(receipt.digest, record("p1", "Law I").digest());
        let head = security.status().unwrap().checkpoint.unwrap();
        assert_eq!(head.sequence, 3);
        assert_eq!(head.public_key, receipt.public_key, "one signer for everything");
        let stored = security.precedents().unwrap();
        assert_eq!(stored.len(), 1);
        assert_eq!(stored[0].record, record("p1", "Law I"));
        assert_eq!(stored[0].receipt, receipt);
    }
    #[test]
    fn precedents_survive_restart_and_reading_needs_no_unlock() {
        let (d, store, security) = fixture();
        security.initialize(Zeroizing::new(PASS.into())).unwrap();
        security.carve_precedent(record("p1", "Law I")).unwrap();
        security.carve_precedent(record("p2", "Law II")).unwrap();
        drop(security);
        drop(store);
        let store = Store::open(d.path().join("secure.db"), "").unwrap();
        let reopened = Security::open(store, d.path().join("head.json")).unwrap();
        assert!(!reopened.status().unwrap().unlocked);
        let titles: Vec<_> = reopened.precedents().unwrap().into_iter().map(|p| p.record.title).collect();
        assert_eq!(titles, vec!["Law I", "Law II"]);
    }
    #[test]
    fn a_rejected_precedent_leaves_no_ledger_entry() {
        let (_d, _store, security) = fixture();
        security.initialize(Zeroizing::new(PASS.into())).unwrap();
        security.carve_precedent(record("p1", "Law I")).unwrap();
        let before = security.status().unwrap().checkpoint.unwrap();
        // Same id: UNIQUE fires after the ledger append, inside the transaction.
        assert!(security.carve_precedent(record("p1", "Again")).is_err());
        let mut oversized = record("p2", "Big");
        oversized.body = "x".repeat(PRECEDENT_BODY_MAX + 1);
        assert!(security.carve_precedent(oversized).is_err());
        assert_eq!(security.status().unwrap().checkpoint.unwrap(), before);
        assert!(!security.status().unwrap().quarantined);
        security.carve_precedent(record("p3", "Law III")).unwrap();
    }
    #[test]
    fn dropping_a_trigger_cannot_hide_an_altered_precedent() {
        let (_d, store, security) = fixture();
        security.initialize(Zeroizing::new(PASS.into())).unwrap();
        security.carve_precedent(record("p1", "Law I")).unwrap();
        assert!(store
            .call(|c| Box::pin(async move {
                sqlx::query("UPDATE secure_precedent SET title='forgery'").execute(c).await?;
                Ok(())
            }))
            .is_err());
        store
            .call(|c| Box::pin(async move {
                sqlx::raw_sql("DROP TRIGGER secure_precedent_no_update; UPDATE secure_precedent SET title='forgery';")
                    .execute(c)
                    .await?;
                Ok(())
            }))
            .unwrap();
        assert!(security.status().unwrap().quarantined);
        assert!(security.precedents().is_err());
        assert!(security.carve_precedent(record("p2", "Law II")).is_err());
    }
    #[test]
    fn a_signed_entry_without_its_precedent_is_quarantined() {
        let (_d, store, security) = fixture();
        security.initialize(Zeroizing::new(PASS.into())).unwrap();
        security.carve_precedent(record("p1", "Law I")).unwrap();
        store
            .call(|c| Box::pin(async move {
                sqlx::raw_sql(
                    "DROP TRIGGER secure_precedent_no_delete; PRAGMA foreign_keys=OFF; DELETE FROM secure_precedent;",
                )
                .execute(c)
                .await?;
                Ok(())
            }))
            .unwrap();
        assert!(security.status().unwrap().quarantined);
    }
}
