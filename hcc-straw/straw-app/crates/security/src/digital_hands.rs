//! Read-only Digital Hands credential migration. Legacy keys and decrypted
//! fields stay native until approved reveal; one owner is imported atomically.
use super::*;
use aes_gcm::{aead::AeadInPlace, Aes256Gcm, Nonce};
use serde::{Deserialize, Serialize};
use std::{collections::BTreeMap, path::Path};
use zeroize::Zeroize;

pub(crate) const KIND: &str = "digital_hands_import";
pub const MAX_ROWS: usize = 1000;
pub const MAX_RAW_BYTES: usize = 256 * 1024;
const MAX_JSON: usize = 1024 * 1024;
const ERROR: &str = "invalid Digital Hands source";

#[derive(Clone, Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct CredentialOwner {
    pub id: String,
    pub count: u32,
}
#[derive(Clone, Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct CredentialPreview {
    pub source_path: String,
    pub owner_id: String,
    pub digest: String,
    pub credential_ids: Vec<String>,
}
#[derive(Clone, Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct CredentialImportReceipt {
    pub source_path: String,
    pub owner_id: String,
    pub digest: String,
    pub credential_ids: Vec<String>,
    pub imported_at: String,
    pub sequence: u32,
}
// Preserve SQLite timestamp storage classes, including integer values beyond
// JavaScript's safe range. No date parsing, trimming or timezone conversion.
#[derive(Clone, Serialize, Deserialize)]
#[serde(tag = "kind", content = "value", rename_all = "snake_case")]
enum Timestamp {
    Null,
    Text(String),
    Integer(String),
    Real(String),
}
#[derive(Serialize)]
struct Legacy {
    id: String,
    owner_id: String,
    service: String,
    username: Vec<u8>,
    password: Vec<u8>,
    notes: Option<Vec<u8>>,
    url: Option<String>,
    created_at: Timestamp,
    updated_at: Timestamp,
}
#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct Credential {
    id: String,
    owner_id: String,
    service: String,
    username: String,
    password: String,
    notes: Option<String>,
    url: Option<String>,
    created_at: Timestamp,
    updated_at: Timestamp,
}
impl Drop for Credential {
    fn drop(&mut self) {
        self.username.zeroize();
        self.password.zeroize();
        self.notes.zeroize();
        self.service.zeroize();
        self.url.zeroize();
    }
}
pub struct Prepared {
    preview: CredentialPreview,
    rows: Vec<Legacy>,
}
impl Prepared {
    pub fn preview(&self) -> CredentialPreview {
        self.preview.clone()
    }
}

fn invalid() -> String {
    format!("{ERROR}: unsupported schema, values or size")
}
fn local(path: &Path) -> Result<PathBuf, String> {
    straw_storage::eduba::require_local(path).map_err(|_| invalid())?;
    let path = path.canonicalize().map_err(|_| invalid())?;
    straw_storage::eduba::require_local(&path).map_err(|_| invalid())?;
    if !path.is_file() {
        return Err(invalid());
    }
    Ok(path)
}
fn run<T>(future: impl std::future::Future<Output = Result<T, String>>) -> Result<T, String> {
    tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .map_err(|_| invalid())?
        .block_on(future)
}
async fn source(path: &Path) -> Result<SqliteConnection, String> {
    let options = sqlx::sqlite::SqliteConnectOptions::new()
        .filename(path)
        .read_only(true)
        .create_if_missing(false)
        .busy_timeout(Duration::from_secs(5));
    let mut c = SqliteConnection::connect_with(&options)
        .await
        .map_err(|_| invalid())?;
    sqlx::raw_sql("PRAGMA trusted_schema=OFF; PRAGMA query_only=ON;")
        .execute(&mut c)
        .await
        .map_err(|_| invalid())?;
    Ok(c)
}
use std::time::Duration;
async fn schema(c: &mut SqliteConnection) -> Result<(), String> {
    for table in ["users", "credentials"] {
        let row = sqlx::query("SELECT type,sql FROM sqlite_master WHERE name=?")
            .bind(table)
            .fetch_optional(&mut *c)
            .await
            .map_err(|_| invalid())?
            .ok_or_else(invalid)?;
        let sql: String = row.try_get(1).map_err(|_| invalid())?;
        if row.try_get::<String, _>(0).map_err(|_| invalid())? != "table"
            || sql.to_uppercase().contains("VIRTUAL TABLE")
        {
            return Err(invalid());
        }
    }
    let actual = sqlx::query("SELECT name FROM pragma_table_xinfo('credentials')")
        .fetch_all(c)
        .await
        .map_err(|_| invalid())?;
    let mut fields: Vec<String> = actual
        .iter()
        .map(|r| r.try_get(0))
        .collect::<Result<_, _>>()
        .map_err(|_| invalid())?;
    fields.sort();
    let mut expected = [
        "id",
        "user_id",
        "service",
        "username_encrypted",
        "password_encrypted",
        "notes_encrypted",
        "url",
        "created_at",
        "updated_at",
    ];
    expected.sort();
    if fields != expected {
        return Err(invalid());
    }
    Ok(())
}
pub fn owners(path: &Path) -> Result<Vec<CredentialOwner>, String> {
    let path = local(path)?;
    run(async {
        let mut c = source(&path).await?;
        let result = async {
            let mut tx = c.begin().await.map_err(|_| invalid())?;
            schema(&mut tx).await?;
            let rows = sqlx::query("SELECT user_id,count(*) AS n,typeof(user_id) AS t,(SELECT count(*) FROM users WHERE users.id=credentials.user_id AND typeof(users.id)='integer') AS owners FROM credentials GROUP BY user_id LIMIT 1001")
                .fetch_all(&mut *tx).await.map_err(|_| invalid())?;
            if rows.len() > MAX_ROWS { return Err(invalid()); }
            let mut result = Vec::new();
            for row in rows {
                let id: i64 = row.try_get(0).map_err(|_| invalid())?;
                if row.try_get::<String,_>(2).map_err(|_| invalid())? != "integer" || row.try_get::<i64,_>(3).map_err(|_| invalid())? != 1 || id <= 0 { return Err(invalid()); }
                result.push(CredentialOwner { id: id.to_string(), count: u32::try_from(row.try_get::<i64,_>(1).map_err(|_| invalid())?).map_err(|_| invalid())? });
            }
            tx.commit().await.map_err(|_| invalid())?;
            Ok(result)
        }.await;
        c.close().await.map_err(|_| invalid())?;
        result
    })
}
fn timestamp(row: &sqlx::sqlite::SqliteRow, field: &str, kind: &str) -> Result<Timestamp, String> {
    Ok(
        match row
            .try_get::<String, _>(kind)
            .map_err(|_| invalid())?
            .as_str()
        {
            "null" => Timestamp::Null,
            "text" => Timestamp::Text(row.try_get(field).map_err(|_| invalid())?),
            "integer" => Timestamp::Integer(
                row.try_get::<i64, _>(field)
                    .map_err(|_| invalid())?
                    .to_string(),
            ),
            "real" => {
                let value: f64 = row.try_get(field).map_err(|_| invalid())?;
                if !value.is_finite() {
                    return Err(invalid());
                }
                Timestamp::Real(value.to_string())
            }
            _ => return Err(invalid()),
        },
    )
}
pub fn prepare(path: &Path, owner_id: &str) -> Result<Prepared, String> {
    let owner: i64 = owner_id.parse().map_err(|_| invalid())?;
    if owner <= 0 || owner.to_string() != owner_id {
        return Err(invalid());
    }
    let path = local(path)?;
    let rows = run(async {
        let mut c = source(&path).await?;
        let result = async {
            let mut tx = c.begin().await.map_err(|_| invalid())?;
            schema(&mut tx).await?;
            let owners: i64 = sqlx::query_scalar("SELECT count(*) FROM users WHERE id=? AND typeof(id)='integer'").bind(owner).fetch_one(&mut *tx).await.map_err(|_| invalid())?;
            if owners != 1 { return Err(invalid()); }
            // Check sizes and storage classes BEFORE materializing any blobs.
            let row = sqlx::query("SELECT count(*) AS n,coalesce(sum(length(username_encrypted)+length(password_encrypted)+coalesce(length(notes_encrypted),0)+length(CAST(service AS BLOB))+coalesce(length(CAST(url AS BLOB)),0)+coalesce(length(CAST(created_at AS BLOB)),0)+coalesce(length(CAST(updated_at AS BLOB)),0)),0) AS bytes,coalesce(sum(CASE WHEN typeof(id)!='integer' OR id<=0 OR typeof(user_id)!='integer' OR typeof(service)!='text' OR typeof(username_encrypted)!='blob' OR length(username_encrypted)<28 OR typeof(password_encrypted)!='blob' OR length(password_encrypted)<28 OR (notes_encrypted IS NOT NULL AND (typeof(notes_encrypted)!='blob' OR length(notes_encrypted)<28)) OR (url IS NOT NULL AND typeof(url)!='text') OR typeof(created_at) NOT IN ('null','text','integer','real') OR typeof(updated_at) NOT IN ('null','text','integer','real') THEN 1 ELSE 0 END),0) AS bad FROM credentials WHERE user_id=?")
                .bind(owner).fetch_one(&mut *tx).await.map_err(|_| invalid())?;
            let n: i64 = row.try_get("n").map_err(|_| invalid())?;
            let bytes: i64 = row.try_get("bytes").map_err(|_| invalid())?;
            if n <= 0 || n > MAX_ROWS as i64 || bytes < 0 || bytes > MAX_RAW_BYTES as i64 || row.try_get::<i64,_>("bad").map_err(|_| invalid())? != 0 { return Err(invalid()); }
            let rows = sqlx::query("SELECT *,typeof(created_at) AS created_kind,typeof(updated_at) AS updated_kind FROM credentials WHERE user_id=? ORDER BY id").bind(owner).fetch_all(&mut *tx).await.map_err(|_| invalid())?;
            let mut result = Vec::new();
            let mut last = 0i64;
            for row in rows {
                let id: i64 = row.try_get("id").map_err(|_| invalid())?;
                if id <= last { return Err(invalid()); } last = id;
                result.push(Legacy {
                    id: id.to_string(), owner_id: owner_id.into(), service: row.try_get("service").map_err(|_| invalid())?,
                    username: row.try_get("username_encrypted").map_err(|_| invalid())?, password: row.try_get("password_encrypted").map_err(|_| invalid())?,
                    notes: row.try_get("notes_encrypted").map_err(|_| invalid())?, url: row.try_get("url").map_err(|_| invalid())?,
                    created_at: timestamp(&row,"created_at","created_kind")?, updated_at: timestamp(&row,"updated_at","updated_kind")?,
                });
            }
            tx.commit().await.map_err(|_| invalid())?;
            Ok(result)
        }.await;
        c.close().await.map_err(|_| invalid())?;
        result
    })?;
    let preview = CredentialPreview {
        source_path: path.to_string_lossy().into_owned(),
        owner_id: owner_id.into(),
        digest: digest(&("STRAW-digital-hands-v1", owner_id, &rows))?,
        credential_ids: rows.iter().map(|r| r.id.clone()).collect(),
    };
    Ok(Prepared { preview, rows })
}
fn decrypt(cipher: &Aes256Gcm, data: &[u8]) -> Result<Zeroizing<String>, String> {
    if data.len() < 28 {
        return Err("legacy credential authentication failed".into());
    }
    let mut buffer = Zeroizing::new(data[12..].to_vec());
    cipher
        .decrypt_in_place(Nonce::from_slice(&data[..12]), b"", &mut *buffer)
        .map_err(|_| "legacy credential authentication failed")?;
    let text = std::str::from_utf8(&buffer).map_err(|_| "legacy credential is not UTF-8")?;
    Ok(Zeroizing::new(text.to_owned()))
}
fn plain(prepared: &Prepared, root: &str) -> Result<Zeroizing<Vec<u8>>, String> {
    if root.is_empty() || root.len() > 4096 {
        return Err("legacy installation key must contain 1..4096 bytes".into());
    }
    let mut key = Zeroizing::new([0u8; 32]);
    hkdf::Hkdf::<Sha256>::new(Some(b"digital-hands-root"), root.as_bytes())
        .expand(b"credential-vault-v1", &mut *key)
        .map_err(|_| "legacy key derivation failed")?;
    let cipher = Aes256Gcm::new((&*key).into());
    let mut result = Vec::new();
    for row in &prepared.rows {
        // Each decrypted temporary zeroizes even if a later field fails.
        let username = decrypt(&cipher, &row.username)?;
        let password = decrypt(&cipher, &row.password)?;
        let notes = row
            .notes
            .as_ref()
            .map(|n| decrypt(&cipher, n))
            .transpose()?;
        result.push(Credential {
            id: row.id.clone(),
            owner_id: row.owner_id.clone(),
            service: row.service.clone(),
            username: username.to_string(),
            password: password.to_string(),
            notes: notes.as_ref().map(|n| n.to_string()),
            url: row.url.clone(),
            created_at: row.created_at.clone(),
            updated_at: row.updated_at.clone(),
        });
    }
    let json =
        Zeroizing::new(serde_json::to_vec(&result).map_err(|_| "credential encoding failed")?);
    if json.len() > MAX_JSON {
        return Err("credential archive exceeds 1 MiB encoded bound".into());
    }
    Ok(json)
}
fn receipt(row: &sqlx::sqlite::SqliteRow) -> Result<CredentialImportReceipt, sqlx::Error> {
    Ok(CredentialImportReceipt {
        sequence: u32::try_from(row.try_get::<i64, _>("seq")?)
            .map_err(|_| protocol("invalid import sequence".into()))?,
        digest: row.try_get("digest")?,
        source_path: row.try_get("source_path")?,
        owner_id: row.try_get("owner_id")?,
        credential_ids: serde_json::from_str(&row.try_get::<String, _>("credential_ids")?)
            .map_err(|_| protocol("invalid import identities".into()))?,
        imported_at: row.try_get::<i64, _>("imported_at")?.to_string(),
    })
}
fn attestation(receipt: &CredentialImportReceipt, ciphertext: &[u8]) -> Result<String, String> {
    digest(&(
        "STRAW-digital-hands-sealed-v1",
        receipt.source_path.as_str(),
        receipt.owner_id.as_str(),
        receipt.digest.as_str(),
        &receipt.credential_ids,
        receipt.imported_at.as_str(),
        hex(&Sha256::digest(ciphertext)),
    ))
}
pub(crate) async fn verify(
    c: &mut SqliteConnection,
    committed: &BTreeMap<i64, String>,
) -> Result<(), sqlx::Error> {
    let count: i64 = sqlx::query_scalar("SELECT count(*) FROM secure_digital_hands")
        .fetch_one(&mut *c)
        .await?;
    if count != committed.len() as i64 {
        return Err(protocol(
            "ledger_quarantined: credential import missing or unsigned".into(),
        ));
    }
    // Reject oversized stored payloads before loading them, including tampering.
    let bad: i64 = sqlx::query_scalar("SELECT count(*) FROM secure_digital_hands WHERE typeof(ciphertext)!='blob' OR length(ciphertext)<40 OR length(ciphertext)>1048616 OR length(credential_ids)>32768 OR length(CAST(source_path AS BLOB))>131072 OR length(owner_id)>19 OR length(digest)!=64").fetch_one(&mut *c).await?;
    if bad != 0 {
        return Err(protocol(
            "ledger_quarantined: credential import size".into(),
        ));
    }
    let rows = sqlx::query("SELECT * FROM secure_digital_hands ORDER BY seq")
        .fetch_all(c)
        .await?;
    if rows.len() != committed.len() {
        return Err(protocol(
            "ledger_quarantined: credential import missing or unsigned".into(),
        ));
    }
    for row in rows {
        let receipt = receipt(&row)?;
        let ciphertext: Vec<u8> = row.try_get("ciphertext")?;
        let subject = attestation(&receipt, &ciphertext).map_err(protocol)?;
        if committed.get(&i64::from(receipt.sequence)) != Some(&subject) {
            return Err(protocol(
                "ledger_quarantined: credential import altered".into(),
            ));
        }
    }
    Ok(())
}
impl Security {
    pub fn import_digital_hands(
        &self,
        prepared: Prepared,
        root: Zeroizing<String>,
    ) -> Result<CredentialImportReceipt, String> {
        let _operation = self.operations.lock().map_err(|e| e.to_string())?;
        self.check()?;
        let state = self.state.lock().map_err(|e| e.to_string())?;
        if state.quarantined {
            return Err("ledger_quarantined".into());
        }
        let session = state.session.as_ref().ok_or("vault_locked")?;
        // Authenticate EVERY field before writing anything, even on repeat import.
        let plain = plain(&prepared, &root)?;
        let cipher = seal(
            &session.key,
            &format!("STRAW-digital-hands:{}", prepared.preview.digest),
            &plain,
        )?;
        let saved = CredentialImportReceipt {
            source_path: prepared.preview.source_path,
            owner_id: prepared.preview.owner_id,
            digest: prepared.preview.digest,
            credential_ids: prepared.preview.credential_ids,
            imported_at: now()?.to_string(),
            sequence: 0,
        };
        let signer = session.signer.clone();
        let (receipt, checkpoint) = self.store.call(move|c|Box::pin(async move {
            let mut tx = c.begin().await?;
            if let Some(row) = sqlx::query("SELECT * FROM secure_digital_hands WHERE digest=?").bind(&saved.digest).fetch_optional(&mut *tx).await? {
                return Ok((receipt(&row)?,None));
            }
            let subject = attestation(&saved,&cipher).map_err(protocol)?;
            let checkpoint = append(&mut tx,&signer,KIND,&subject).await?;
            sqlx::query("INSERT INTO secure_digital_hands(seq,digest,source_path,owner_id,credential_ids,imported_at,ciphertext) VALUES(?,?,?,?,?,?,?)")
                .bind(i64::from(checkpoint.sequence)).bind(&saved.digest).bind(&saved.source_path).bind(&saved.owner_id)
                .bind(serde_json::to_string(&saved.credential_ids).map_err(|_|protocol("import encoding failed".into()))?)
                .bind(saved.imported_at.parse::<i64>().map_err(|_|protocol("import timestamp failed".into()))?).bind(cipher).execute(&mut *tx).await?;
            tx.commit().await?;
            Ok((CredentialImportReceipt { sequence: checkpoint.sequence, ..saved },Some(checkpoint)))
        }))?;
        drop(state);
        if let Some(checkpoint) = checkpoint {
            self.checkpoint(&checkpoint)?;
        }
        Ok(receipt)
    }
    pub fn digital_hands_imports(&self) -> Result<Vec<CredentialImportReceipt>, String> {
        let _operation = self.operations.lock().map_err(|e| e.to_string())?;
        self.check()?;
        if self.state.lock().map_err(|e| e.to_string())?.quarantined {
            return Err("ledger_quarantined".into());
        }
        self.store.call(|c| {
            Box::pin(async move {
                sqlx::query("SELECT * FROM secure_digital_hands ORDER BY seq DESC LIMIT 100")
                    .fetch_all(c)
                    .await?
                    .iter()
                    .map(receipt)
                    .collect()
            })
        })
    }
    pub fn reveal_digital_hands(&self, digest: String, id: String) -> Result<String, String> {
        let _operation = self.operations.lock().map_err(|e| e.to_string())?;
        self.check()?;
        let state = self.state.lock().map_err(|e| e.to_string())?;
        if state.quarantined {
            return Err("ledger_quarantined".into());
        }
        let key = &state.session.as_ref().ok_or("vault_locked")?.key;
        let identity = format!("STRAW-digital-hands:{digest}");
        let ciphertext: Vec<u8> = self.store.call(move |c| {
            Box::pin(async move {
                sqlx::query_scalar("SELECT ciphertext FROM secure_digital_hands WHERE digest=?")
                    .bind(digest)
                    .fetch_one(c)
                    .await
            })
        })?;
        let plain = unseal(key, &identity, &ciphertext)?;
        let credentials: Vec<Credential> =
            serde_json::from_slice(&plain).map_err(|_| "credential archive decoding failed")?;
        let credential = credentials
            .iter()
            .find(|c| c.id == id)
            .ok_or("credential not found in this import")?;
        serde_json::to_string_pretty(credential).map_err(|_| "credential encoding failed".into())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use aes_gcm::aead::Aead;
    const ROOT: &str = "fixture-installation-key";
    const PASS: &str = "credential migration test passphrase";
    // Independently generated with .NET HMAC-SHA256 HKDF and AES-GCM. The
    // migration decryptor must accept this exact legacy wire format.
    const KEY: &str = "d2406dfbe205e2621690ba28653737d9477d8572cb61dd32b87bb395c4a1b7e9";
    const USER: &str =
        "000102030405060708090a0b4ec2a10e34e6e7217d032b60ff68bd98c1e8277ae4723819d88a75";
    const PASSWORD: &str = "000102030405060708090a0b72f58f3916cb8f0b42231e517061e7c66783b43475f3d446815a6aea55ca700e1e1849ec6a5ecc6e9b400eb6";
    const NOTES: &str = "000102030405060708090a0b0287b61d3ee9ab206b46377f475dcbb6e879c7431273bce2cbc757de1a19e9629e5ca51d";
    fn source_fixture(dir: &Path) -> Store {
        let store = Store::open(dir.join("legacy.db"), "").unwrap();
        store.call(|c|Box::pin(async move {
            sqlx::raw_sql("CREATE TABLE users(id INTEGER PRIMARY KEY, password_hash TEXT); INSERT INTO users VALUES(1,'AUTH_HASH_EXCLUDED_5793'),(2,'other'); CREATE TABLE credentials(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL,service TEXT NOT NULL,username_encrypted BLOB NOT NULL,password_encrypted BLOB NOT NULL,notes_encrypted BLOB,url TEXT,created_at DATETIME,updated_at DATETIME); CREATE TABLE sessions(token TEXT); INSERT INTO sessions VALUES('SESSION_EXCLUDED_5793');").execute(&mut *c).await?;
            sqlx::query("INSERT INTO credentials VALUES(9007199254740993,1,?,?,?,?,?,?,?), (42,2,'other',?,?,NULL,NULL,1.2345678901234567,NULL)")
                .bind("SERVICE_PRIVATE_5793\0Ω").bind(unhex(USER).unwrap()).bind(unhex(PASSWORD).unwrap()).bind(unhex(NOTES).unwrap())
                .bind("https://example.invalid/ account ").bind(9007199254740993i64).bind(" 2026-10-14 01:02:03 ")
                .bind(unhex(USER).unwrap()).bind(unhex(PASSWORD).unwrap()).execute(c).await?;
            Ok(())
        })).unwrap();
        store
    }
    fn target(dir: &Path) -> (Store, Security) {
        let store = Store::open(dir.join("target.db"), "").unwrap();
        let security = Security::open(store.clone(), dir.join("head.json")).unwrap();
        security.initialize(Zeroizing::new(PASS.into())).unwrap();
        (store, security)
    }
    fn prepare_one(dir: &Path) -> Prepared {
        prepare(&dir.join("legacy.db"), "1").unwrap()
    }
    fn update(source: &Store, sql: &'static str) {
        source
            .call(move |c| {
                Box::pin(async move {
                    sqlx::raw_sql(sql).execute(c).await?;
                    Ok(())
                })
            })
            .unwrap();
    }
    fn fixture_encrypt(plain: &[u8]) -> Vec<u8> {
        let key = unhex(KEY).unwrap();
        let cipher = Aes256Gcm::new_from_slice(&key).unwrap();
        let nonce = [7u8; 12];
        [
            nonce.to_vec(),
            cipher.encrypt(Nonce::from_slice(&nonce), plain).unwrap(),
        ]
        .concat()
    }
    #[test]
    fn independent_legacy_fixture_round_trip_owner_isolation_restart_and_plaintext_exclusion() {
        let dir = tempfile::tempdir().unwrap();
        let source = source_fixture(dir.path()); // Live WAL writer stays open.
        let before = source
            .call(|c| {
                Box::pin(async move {
                    sqlx::query_scalar::<_, Vec<u8>>(
                        "SELECT password_encrypted FROM credentials WHERE user_id=1",
                    )
                    .fetch_one(c)
                    .await
                })
            })
            .unwrap();
        let owners = owners(&dir.path().join("legacy.db")).unwrap();
        assert_eq!(owners.len(), 2);
        assert!(owners.iter().all(|o| o.count == 1));
        let preview = prepare_one(dir.path()).preview();
        assert_eq!(preview.credential_ids, vec!["9007199254740993"]);
        let (store, security) = target(dir.path());
        let receipt = security
            .import_digital_hands(prepare_one(dir.path()), Zeroizing::new(ROOT.into()))
            .unwrap();
        let head = security.status().unwrap().checkpoint.unwrap();
        assert_eq!(
            security
                .import_digital_hands(prepare_one(dir.path()), Zeroizing::new(ROOT.into()))
                .unwrap()
                .sequence,
            receipt.sequence
        );
        assert_eq!(security.status().unwrap().checkpoint.unwrap(), head);
        let text = security
            .reveal_digital_hands(receipt.digest.clone(), "9007199254740993".into())
            .unwrap();
        let record: serde_json::Value = serde_json::from_str(&text).unwrap();
        assert_eq!(record["username"], "legacy-user");
        assert_eq!(record["password"], "PRIVATE_LEGACY_PASSWORD_5793");
        assert_eq!(record["notes"], "  private notes Ω  ");
        assert_eq!(record["service"], "SERVICE_PRIVATE_5793\0Ω");
        assert_eq!(
            record["created_at"],
            serde_json::json!({"kind":"integer","value":"9007199254740993"})
        );
        assert_eq!(record["updated_at"]["value"], " 2026-10-14 01:02:03 ");
        assert!(security
            .reveal_digital_hands(receipt.digest.clone(), "42".into())
            .is_err());
        security.lock().unwrap();
        assert!(security
            .reveal_digital_hands(receipt.digest.clone(), "9007199254740993".into())
            .is_err());
        assert!(security
            .import_digital_hands(prepare_one(dir.path()), Zeroizing::new(ROOT.into()))
            .is_err());
        assert_eq!(security.digital_hands_imports().unwrap().len(), 1);
        assert_eq!(
            source
                .call(|c| Box::pin(async move {
                    sqlx::query_scalar::<_, Vec<u8>>(
                        "SELECT password_encrypted FROM credentials WHERE user_id=1",
                    )
                    .fetch_one(c)
                    .await
                }))
                .unwrap(),
            before
        );
        drop(security);
        drop(store);
        for name in ["target.db", "target.db-wal", "head.json"] {
            if let Ok(bytes) = std::fs::read(dir.path().join(name)) {
                for secret in [
                    "PRIVATE_LEGACY_PASSWORD_5793",
                    "legacy-user",
                    "SERVICE_PRIVATE_5793",
                    "AUTH_HASH_EXCLUDED_5793",
                    "SESSION_EXCLUDED_5793",
                    ROOT,
                ] {
                    assert!(
                        !bytes.windows(secret.len()).any(|b| b == secret.as_bytes()),
                        "{name} contains excluded plaintext"
                    );
                }
            }
        }
        let store = Store::open(dir.path().join("target.db"), "").unwrap();
        let security = Security::open(store, dir.path().join("head.json")).unwrap();
        assert!(!security.status().unwrap().unlocked);
        security.unlock(Zeroizing::new(PASS.into())).unwrap();
        assert!(security
            .reveal_digital_hands(receipt.digest, "9007199254740993".into())
            .unwrap()
            .contains("PRIVATE_LEGACY_PASSWORD_5793"));
        let second = security
            .import_digital_hands(
                prepare(&dir.path().join("legacy.db"), "2").unwrap(),
                Zeroizing::new(ROOT.into()),
            )
            .unwrap();
        let record: serde_json::Value = serde_json::from_str(
            &security
                .reveal_digital_hands(second.digest, "42".into())
                .unwrap(),
        )
        .unwrap();
        assert!(record["notes"].is_null());
        assert_eq!(record["updated_at"]["kind"], "null");
        assert_eq!(record["created_at"]["kind"], "real");
        assert_eq!(
            record["created_at"]["value"]
                .as_str()
                .unwrap()
                .parse::<f64>()
                .unwrap()
                .to_bits(),
            1.2345678901234567f64.to_bits()
        );
    }
    #[test]
    fn wrong_key_and_corrupt_later_record_leave_no_partial_import() {
        let dir = tempfile::tempdir().unwrap();
        let source = source_fixture(dir.path());
        let (_store, security) = target(dir.path());
        let before = security.status().unwrap().checkpoint.unwrap();
        assert!(security
            .import_digital_hands(prepare_one(dir.path()), Zeroizing::new("wrong key".into()))
            .unwrap_err()
            .contains("authentication failed"));
        // A valid first credential followed by a corrupt second one.
        update(&source,"INSERT INTO credentials SELECT id+1,user_id,service,username_encrypted,zeroblob(32),notes_encrypted,url,created_at,updated_at FROM credentials WHERE user_id=1");
        assert!(security
            .import_digital_hands(prepare_one(dir.path()), Zeroizing::new(ROOT.into()))
            .is_err());
        assert!(security.digital_hands_imports().unwrap().is_empty());
        assert_eq!(security.status().unwrap().checkpoint.unwrap(), before);
    }
    #[test]
    fn captured_snapshot_stays_exact_and_changed_source_gets_a_new_digest() {
        let dir = tempfile::tempdir().unwrap();
        let source = source_fixture(dir.path());
        let (_store, security) = target(dir.path());
        let prepared = prepare_one(dir.path());
        let digest = prepared.preview().digest;
        update(
            &source,
            "UPDATE credentials SET service='later edit' WHERE user_id=1",
        );
        assert_ne!(prepare_one(dir.path()).preview().digest, digest);
        let receipt = security
            .import_digital_hands(prepared, Zeroizing::new(ROOT.into()))
            .unwrap();
        assert_eq!(receipt.digest, digest);
        assert!(security
            .reveal_digital_hands(digest, "9007199254740993".into())
            .unwrap()
            .contains("SERVICE_PRIVATE_5793"));
    }
    #[test]
    fn unsupported_schema_types_size_and_owner_are_rejected_before_decryption() {
        let dir = tempfile::tempdir().unwrap();
        let source = source_fixture(dir.path());
        for id in ["0", "01", "-1", "3", "1 OR 1=1"] {
            assert!(prepare(&dir.path().join("legacy.db"), id).is_err());
        }
        update(
            &source,
            "UPDATE credentials SET password_encrypted=zeroblob(262145) WHERE user_id=1",
        );
        assert!(prepare(&dir.path().join("legacy.db"), "1").is_err());
        update(
            &source,
            "UPDATE credentials SET password_encrypted='plaintext' WHERE user_id=1",
        );
        assert!(prepare(&dir.path().join("legacy.db"), "1").is_err());
        update(&source, "ALTER TABLE credentials ADD COLUMN extra TEXT");
        assert!(prepare(&dir.path().join("legacy.db"), "2").is_err());
        update(&source,"ALTER TABLE credentials RENAME TO real_credentials; CREATE VIEW credentials AS SELECT id,user_id,service,username_encrypted,password_encrypted,notes_encrypted,url,created_at,updated_at FROM real_credentials");
        assert!(owners(&dir.path().join("legacy.db")).is_err());
    }
    #[test]
    fn invalid_utf8_and_encoded_size_fail_without_leaking_secret_bytes() {
        let dir = tempfile::tempdir().unwrap();
        let source = source_fixture(dir.path());
        let (_store, security) = target(dir.path());
        let bad = fixture_encrypt(&[0xff, 0x80]);
        source
            .call(move |c| {
                Box::pin(async move {
                    sqlx::query("UPDATE credentials SET password_encrypted=? WHERE user_id=1")
                        .bind(bad)
                        .execute(c)
                        .await?;
                    Ok(())
                })
            })
            .unwrap();
        assert_eq!(
            security
                .import_digital_hands(prepare_one(dir.path()), Zeroizing::new(ROOT.into()))
                .unwrap_err(),
            "legacy credential is not UTF-8"
        );
        let big = fixture_encrypt(&vec![0u8; 180_000]);
        source
            .call(move |c| {
                Box::pin(async move {
                    sqlx::query("UPDATE credentials SET password_encrypted=? WHERE user_id=1")
                        .bind(big)
                        .execute(c)
                        .await?;
                    Ok(())
                })
            })
            .unwrap();
        assert!(security
            .import_digital_hands(prepare_one(dir.path()), Zeroizing::new(ROOT.into()))
            .unwrap_err()
            .contains("encoded bound"));
        assert!(security.digital_hands_imports().unwrap().is_empty());
    }
    #[test]
    fn immutable_import_and_signed_ciphertext_detect_offline_tampering() {
        let dir = tempfile::tempdir().unwrap();
        let _source = source_fixture(dir.path());
        let (store, security) = target(dir.path());
        security
            .import_digital_hands(prepare_one(dir.path()), Zeroizing::new(ROOT.into()))
            .unwrap();
        assert!(store
            .call(|c| Box::pin(async move {
                sqlx::query("DELETE FROM secure_digital_hands")
                    .execute(c)
                    .await?;
                Ok(())
            }))
            .is_err());
        assert!(store
            .call(|c| Box::pin(async move {
                sqlx::query("UPDATE secure_digital_hands SET owner_id='2'")
                    .execute(c)
                    .await?;
                Ok(())
            }))
            .is_err());
        update(&store,"DROP TRIGGER secure_digital_hands_no_update; UPDATE secure_digital_hands SET ciphertext=zeroblob(length(ciphertext))");
        assert!(security.status().unwrap().quarantined);
        assert!(security.digital_hands_imports().is_err());
    }
    #[test]
    fn missing_import_is_detected_even_after_its_delete_trigger_is_removed() {
        let dir = tempfile::tempdir().unwrap();
        let _source = source_fixture(dir.path());
        let (store, security) = target(dir.path());
        security
            .import_digital_hands(prepare_one(dir.path()), Zeroizing::new(ROOT.into()))
            .unwrap();
        update(
            &store,
            "DROP TRIGGER secure_digital_hands_no_delete; DELETE FROM secure_digital_hands",
        );
        assert!(security.status().unwrap().quarantined);
    }
    #[test]
    fn non_local_paths_are_refused_before_access() {
        #[cfg(windows)]
        for path in [
            r"\\server\share\legacy.db",
            r"\\?\UNC\server\share\legacy.db",
            r"\\.\pipe\legacy",
        ] {
            assert!(owners(Path::new(path)).is_err());
            assert!(prepare(Path::new(path), "1").is_err());
        }
    }
}
