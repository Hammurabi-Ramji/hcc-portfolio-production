//! Consistent core snapshots, signed manifests, and read-only offline checks.
//! No restore operation writes into the running application's data directory.
use super::*;
use std::{
    fs::{File, OpenOptions},
    io::{Read, Write},
    path::Path,
    time::Duration,
};
const MAX_DB: u64 = 256 * 1024 * 1024;
const MANIFEST: &str = "recovery.json";
const DATABASE: &str = "straw.db";
const ANCHOR: &str = "straw-checkpoint.json";

#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Manifest {
    version: u32,
    created_at: u32,
    database_sha256: String,
    checkpoint_sha256: String,
    checkpoint: Checkpoint,
    signature: String,
}
#[derive(Clone, Debug, serde::Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryReport {
    pub directory: String,
    pub sequence: u32,
    pub head: String,
    pub public_key: String,
    pub created_at: String,
    pub database_bytes: u32,
}
fn invalid() -> String {
    "invalid core recovery copy".into()
}
fn same_head(a: &Checkpoint, b: &Checkpoint) -> bool {
    (a.sequence, &a.head, &a.public_key) == (b.sequence, &b.head, &b.public_key)
}
fn signed_bytes(m: &Manifest) -> Result<Vec<u8>, String> {
    serde_json::to_vec(&(
        "STRAW-core-recovery-v1",
        m.version,
        m.created_at,
        &m.database_sha256,
        &m.checkpoint_sha256,
        &m.checkpoint,
    ))
    .map_err(|_| invalid())
}
fn locked_file(path: &Path, limit: u64) -> Result<File, String> {
    let mut options = OpenOptions::new();
    options.read(true);
    #[cfg(windows)]
    {
        use std::os::windows::fs::OpenOptionsExt;
        options.share_mode(1);
    }
    let file = options.open(path).map_err(|_| invalid())?;
    let meta = file.metadata().map_err(|_| invalid())?;
    if !meta.is_file() || meta.len() > limit {
        return Err(invalid());
    }
    Ok(file)
}
fn small(file: &mut File, limit: u64) -> Result<Vec<u8>, String> {
    let mut bytes = Vec::new();
    file.take(limit + 1)
        .read_to_end(&mut bytes)
        .map_err(|_| invalid())?;
    if bytes.len() as u64 > limit {
        return Err(invalid());
    }
    Ok(bytes)
}
fn hash(file: &mut File) -> Result<String, String> {
    let mut digest = Sha256::new();
    let mut buffer = [0u8; 65536];
    let mut total = 0u64;
    loop {
        let n = file.read(&mut buffer).map_err(|_| invalid())?;
        if n == 0 {
            break;
        }
        total += n as u64;
        if total > MAX_DB {
            return Err(invalid());
        }
        digest.update(&buffer[..n]);
    }
    Ok(hex(&digest.finalize()))
}
fn write_new(path: &Path, bytes: &[u8]) -> Result<(), String> {
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(path)
        .map_err(|_| invalid())?;
    file.write_all(bytes)
        .and_then(|_| file.sync_all())
        .map_err(|_| invalid())
}
/// Resolve the parent but never create or overwrite the destination here.
pub fn new_directory(path: &Path) -> Result<PathBuf, String> {
    straw_storage::eduba::require_local(path).map_err(|_| invalid())?;
    if !path.is_absolute()
        || path
            .components()
            .any(|c| matches!(c, std::path::Component::ParentDir))
    {
        return Err(invalid());
    }
    let name = path.file_name().ok_or_else(invalid)?;
    let parent = path
        .parent()
        .ok_or_else(invalid)?
        .canonicalize()
        .map_err(|_| invalid())?;
    straw_storage::eduba::require_local(&parent).map_err(|_| invalid())?;
    let output = parent.join(name);
    if std::fs::symlink_metadata(&output).is_ok() || output.to_str().is_none() {
        return Err(invalid());
    }
    Ok(output)
}
fn member(root: &Path, name: &str) -> Result<PathBuf, String> {
    let path = root.join(name).canonicalize().map_err(|_| invalid())?;
    if path.parent() != Some(root) {
        return Err(invalid());
    }
    Ok(path)
}
/// Verify hashes, the signing key/checkpoint, SQLite integrity and the full
/// signed ledger without migrations, vault unlock, or opening the live store.
pub fn verify_directory(path: &Path) -> Result<RecoveryReport, String> {
    straw_storage::eduba::require_local(path).map_err(|_| invalid())?;
    let root = path.canonicalize().map_err(|_| invalid())?;
    straw_storage::eduba::require_local(&root).map_err(|_| invalid())?;
    // A standalone copy must not acquire a later WAL/journal that could be
    // applied when restored. Immutable verification deliberately ignores WAL.
    for suffix in ["-wal", "-shm", "-journal"] {
        match std::fs::symlink_metadata(root.join(format!("{DATABASE}{suffix}"))) {
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => (),
            _ => return Err(invalid()),
        }
    }
    let database = member(&root, DATABASE)?;
    let mut db_file = locked_file(&database, MAX_DB)?;
    let mut manifest_file = locked_file(&member(&root, MANIFEST)?, 65536)?;
    let mut anchor_file = locked_file(&member(&root, ANCHOR)?, 4096)?;
    let manifest: Manifest =
        serde_json::from_slice(&small(&mut manifest_file, 65536)?).map_err(|_| invalid())?;
    let checkpoint_bytes = small(&mut anchor_file, 4096)?;
    let checkpoint: Checkpoint =
        serde_json::from_slice(&checkpoint_bytes).map_err(|_| invalid())?;
    if manifest.version != 1
        || checkpoint != manifest.checkpoint
        || manifest.database_sha256 != hash(&mut db_file)?
        || manifest.checkpoint_sha256 != hex(&Sha256::digest(&checkpoint_bytes))
    {
        return Err(invalid());
    }
    anchor_valid(&checkpoint).map_err(|_| invalid())?;
    let public: [u8; 32] = unhex(&checkpoint.public_key)?
        .try_into()
        .map_err(|_| invalid())?;
    VerifyingKey::from_bytes(&public)
        .map_err(|_| invalid())?
        .verify_strict(
            &signed_bytes(&manifest)?,
            &Signature::from_slice(&unhex(&manifest.signature)?).map_err(|_| invalid())?,
        )
        .map_err(|_| invalid())?;
    let expected = checkpoint.clone();
    tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .map_err(|_| invalid())?
        .block_on(async {
            let options = sqlx::sqlite::SqliteConnectOptions::new()
                .filename(&database)
                .read_only(true)
                .create_if_missing(false)
                .immutable(true)
                .busy_timeout(Duration::from_secs(5));
            let mut c = SqliteConnection::connect_with(&options)
                .await
                .map_err(|_| invalid())?;
            let result = async {
                sqlx::raw_sql("PRAGMA trusted_schema=OFF; PRAGMA query_only=ON;")
                    .execute(&mut c)
                    .await
                    .map_err(|_| invalid())?;
                // Reject substituted views, virtual tables and generated
                // columns before ledger reads against an external copy.
                for table in [
                    "secure_identity",
                    "secure_ledger",
                    "secure_grants",
                    "secure_vault",
                    "secure_precedent",
                    "secure_digital_hands",
                ] {
                    let row = sqlx::query("SELECT type,rootpage FROM sqlite_master WHERE name=?")
                        .bind(table)
                        .fetch_optional(&mut c)
                        .await
                        .map_err(|_| invalid())?
                        .ok_or_else(invalid)?;
                    if row.try_get::<String, _>(0).map_err(|_| invalid())? != "table"
                        || row.try_get::<i64, _>(1).map_err(|_| invalid())? <= 0
                    {
                        return Err(invalid());
                    }
                    let hidden: i64 = sqlx::query_scalar(
                        "SELECT count(*) FROM pragma_table_xinfo(?) WHERE hidden!=0",
                    )
                    .bind(table)
                    .fetch_one(&mut c)
                    .await
                    .map_err(|_| invalid())?;
                    if hidden != 0 {
                        return Err(invalid());
                    }
                }
                let check: String = sqlx::query_scalar("PRAGMA quick_check(1)")
                    .fetch_one(&mut c)
                    .await
                    .map_err(|_| invalid())?;
                if check != "ok"
                    || sqlx::query("PRAGMA foreign_key_check")
                        .fetch_optional(&mut c)
                        .await
                        .map_err(|_| invalid())?
                        .is_some()
                {
                    return Err(invalid());
                }
                let head = verified(&mut c)
                    .await
                    .map_err(|_| invalid())?
                    .ok_or_else(invalid)?;
                if !same_head(&head, &expected) {
                    return Err(invalid());
                }
                Ok(())
            }
            .await;
            c.close().await.map_err(|_| invalid())?;
            result
        })?;
    Ok(RecoveryReport {
        directory: root.to_str().ok_or_else(invalid)?.into(),
        sequence: checkpoint.sequence,
        head: checkpoint.head,
        public_key: checkpoint.public_key,
        created_at: manifest.created_at.to_string(),
        database_bytes: u32::try_from(db_file.metadata().map_err(|_| invalid())?.len())
            .map_err(|_| invalid())?,
    })
}
impl Security {
    /// Hold security operations across the snapshot; ordinary store writes are
    /// serialized by the same actor. VACUUM INTO folds committed WAL rows into
    /// a self-contained database. Write the signed completion manifest last.
    pub fn create_recovery_copy(&self, destination: PathBuf) -> Result<RecoveryReport, String> {
        let _operation = self.operations.lock().map_err(|e| e.to_string())?;
        let checkpoint = self
            .check()?
            .ok_or("initialize the vault before creating recovery copies")?;
        let state = self.state.lock().map_err(|e| e.to_string())?;
        if state.quarantined {
            return Err("ledger_quarantined".into());
        }
        let signer = state.session.as_ref().ok_or("vault_locked")?.signer.clone();
        let root = new_directory(&destination)?;
        std::fs::create_dir(&root).map_err(|e| e.to_string())?;
        let output = root.join(DATABASE).to_str().ok_or_else(invalid)?.to_owned();
        let expected = checkpoint.clone();
        self.store.call(move |c| {
            Box::pin(async move {
                let pages: i64 = sqlx::query_scalar("PRAGMA page_count")
                    .fetch_one(&mut *c)
                    .await?;
                let page_size: i64 = sqlx::query_scalar("PRAGMA page_size")
                    .fetch_one(&mut *c)
                    .await?;
                if pages
                    .checked_mul(page_size)
                    .is_none_or(|n| n < 0 || n as u64 > MAX_DB)
                {
                    return Err(protocol("core recovery database exceeds 256 MiB".into()));
                }
                let head = verified(&mut *c)
                    .await?
                    .ok_or_else(|| protocol(invalid()))?;
                if !same_head(&head, &expected) {
                    return Err(protocol("checkpoint changed before snapshot".into()));
                }
                sqlx::query("VACUUM INTO ?").bind(output).execute(c).await?;
                Ok(())
            })
        })?;
        let checkpoint_bytes = serde_json::to_vec(&checkpoint).map_err(|_| invalid())?;
        write_new(&root.join(ANCHOR), &checkpoint_bytes)?;
        OpenOptions::new()
            .write(true)
            .open(root.join(DATABASE))
            .and_then(|f| f.sync_all())
            .map_err(|_| invalid())?;
        let mut database = locked_file(&root.join(DATABASE), MAX_DB)?;
        let mut manifest = Manifest {
            version: 1,
            created_at: now()?,
            database_sha256: hash(&mut database)?,
            checkpoint_sha256: hex(&Sha256::digest(&checkpoint_bytes)),
            checkpoint,
            signature: String::new(),
        };
        manifest.signature = hex(&signer.sign(&signed_bytes(&manifest)?).to_bytes());
        write_new(
            &root.join(MANIFEST),
            &serde_json::to_vec_pretty(&manifest).map_err(|_| invalid())?,
        )?;
        drop(database);
        verify_directory(&root)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    const PASS: &str = "recovery test passphrase";
    fn fixture() -> (tempfile::TempDir, Store, Security) {
        let dir = tempfile::tempdir().unwrap();
        let store = Store::open(dir.path().join("live.db"), "").unwrap();
        let security = Security::open(store.clone(), dir.path().join("live-head.json")).unwrap();
        security.initialize(Zeroizing::new(PASS.into())).unwrap();
        (dir, store, security)
    }
    #[test]
    fn live_wal_copy_restores_vault_documents_and_spent_grants_without_changing_source() {
        let (dir, store, security) = fixture();
        security
            .put(
                "credential".into(),
                Zeroizing::new("PRIVATE_RECOVERY_8547".into()),
            )
            .unwrap();
        let revision = store
            .revise("doc".into(), None, "committed WAL document Ω".into())
            .unwrap();
        let grant = security
            .issue(vec![Permission::Export], "a".repeat(64))
            .unwrap();
        security
            .consume(grant.id.clone(), vec![Permission::Export], "a".repeat(64))
            .unwrap();
        let before = security.status().unwrap().checkpoint.unwrap();
        let output = dir.path().join("copy");
        let report = security.create_recovery_copy(output.clone()).unwrap();
        assert_eq!(report.sequence, before.sequence);
        assert_eq!(security.status().unwrap().checkpoint.unwrap(), before);
        assert_eq!(verify_directory(&output).unwrap().head, before.head);
        assert!(!output.join("straw.db-wal").exists());
        assert!(!output.join("straw.db-shm").exists());
        let restored_root = dir.path().join("isolated-restore");
        std::fs::create_dir(&restored_root).unwrap();
        for name in [DATABASE, ANCHOR] {
            std::fs::copy(output.join(name), restored_root.join(name)).unwrap();
        }
        let restored_store = Store::open(restored_root.join(DATABASE), "").unwrap();
        let restored = Security::open(restored_store.clone(), restored_root.join(ANCHOR)).unwrap();
        assert!(!restored.status().unwrap().unlocked);
        restored.unlock(Zeroizing::new(PASS.into())).unwrap();
        assert_eq!(
            restored.get("credential".into()).unwrap(),
            "PRIVATE_RECOVERY_8547"
        );
        assert!(restored
            .consume(grant.id, vec![Permission::Export], "a".repeat(64))
            .is_err());
        let text: String = restored_store
            .call(move |c| {
                Box::pin(async move {
                    sqlx::query_scalar("SELECT text FROM document_revisions WHERE id=?")
                        .bind(revision.id)
                        .fetch_one(c)
                        .await
                })
            })
            .unwrap();
        assert_eq!(text, "committed WAL document Ω");
        assert!(verify_directory(&output).is_ok());
        assert!(!std::fs::read(output.join(DATABASE))
            .unwrap()
            .windows(21)
            .any(|v| v == b"PRIVATE_RECOVERY_8547"));
    }
    #[test]
    fn even_resigned_copies_cannot_substitute_security_views_or_generated_columns() {
        let (dir, _store, security) = fixture();
        for (name,sql) in [
            ("view","ALTER TABLE secure_vault RENAME TO vault_rows; CREATE VIEW secure_vault AS SELECT * FROM vault_rows"),
            ("generated","ALTER TABLE secure_vault ADD COLUMN calculated TEXT GENERATED ALWAYS AS (id || id) VIRTUAL"),
        ] {
            let output=dir.path().join(name);security.create_recovery_copy(output.clone()).unwrap();
            let db=Store::open(output.join(DATABASE),"").unwrap();
            db.call(move|c|Box::pin(async move {sqlx::raw_sql(sql).execute(c).await?;Ok(())})).unwrap();drop(db);
            let mut manifest:Manifest=serde_json::from_slice(&std::fs::read(output.join(MANIFEST)).unwrap()).unwrap();
            manifest.database_sha256=hash(&mut locked_file(&output.join(DATABASE),MAX_DB).unwrap()).unwrap();
            manifest.signature=hex(&security.state.lock().unwrap().session.as_ref().unwrap().signer.sign(&signed_bytes(&manifest).unwrap()).to_bytes());
            std::fs::write(output.join(MANIFEST),serde_json::to_vec(&manifest).unwrap()).unwrap();
            assert!(verify_directory(&output).is_err());
        }
    }
    #[test]
    fn existing_destination_lock_and_quarantine_are_refused() {
        let (dir, _store, security) = fixture();
        let output = dir.path().join("existing");
        std::fs::create_dir(&output).unwrap();
        std::fs::write(output.join("keep"), "sentinel").unwrap();
        assert!(security.create_recovery_copy(output.clone()).is_err());
        assert_eq!(
            std::fs::read_to_string(output.join("keep")).unwrap(),
            "sentinel"
        );
        security.lock().unwrap();
        assert!(security
            .create_recovery_copy(dir.path().join("locked"))
            .is_err());
        assert!(!dir.path().join("locked").exists());
        security.unlock(Zeroizing::new(PASS.into())).unwrap();
        std::fs::write(dir.path().join("live-head.json"), "tampered").unwrap();
        assert!(security
            .create_recovery_copy(dir.path().join("quarantined"))
            .is_err());
        assert!(!dir.path().join("quarantined").exists());
    }
    #[test]
    fn signed_manifest_rejects_plain_document_tampering_even_with_recomputed_checksum() {
        let (dir, store, security) = fixture();
        store.revise("doc".into(), None, "original".into()).unwrap();
        let output = dir.path().join("copy");
        security.create_recovery_copy(output.clone()).unwrap();
        let db = Store::open(output.join(DATABASE), "").unwrap();
        db.call(|c| {
            Box::pin(async move {
                sqlx::query("CREATE TABLE attacker(value TEXT)")
                    .execute(c)
                    .await?;
                Ok(())
            })
        })
        .unwrap();
        drop(db);
        let mut manifest: Manifest =
            serde_json::from_slice(&std::fs::read(output.join(MANIFEST)).unwrap()).unwrap();
        manifest.database_sha256 =
            hash(&mut locked_file(&output.join(DATABASE), MAX_DB).unwrap()).unwrap();
        std::fs::write(
            output.join(MANIFEST),
            serde_json::to_vec(&manifest).unwrap(),
        )
        .unwrap();
        assert!(verify_directory(&output).is_err());
    }
    #[test]
    fn mismatched_checkpoint_incomplete_copy_unknown_version_and_oversized_files_fail() {
        let (dir, _store, security) = fixture();
        let output = dir.path().join("copy");
        security.create_recovery_copy(output.clone()).unwrap();
        let anchor = std::fs::read(output.join(ANCHOR)).unwrap();
        security
            .issue(vec![Permission::Assist], "b".repeat(64))
            .unwrap();
        std::fs::copy(dir.path().join("live-head.json"), output.join(ANCHOR)).unwrap();
        assert!(verify_directory(&output).is_err());
        std::fs::write(output.join(ANCHOR), anchor).unwrap();
        std::fs::write(output.join("straw.db-wal"), "unexpected journal").unwrap();
        assert!(verify_directory(&output).is_err());
        std::fs::remove_file(output.join("straw.db-wal")).unwrap();
        let bytes = std::fs::read(output.join(MANIFEST)).unwrap();
        let mut value: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        value["version"] = serde_json::json!(2);
        std::fs::write(output.join(MANIFEST), serde_json::to_vec(&value).unwrap()).unwrap();
        assert!(verify_directory(&output).is_err());
        std::fs::write(output.join(MANIFEST), vec![b' '; 65537]).unwrap();
        assert!(verify_directory(&output).is_err());
        std::fs::remove_file(output.join(MANIFEST)).unwrap();
        assert!(verify_directory(&output).is_err());
    }
}
