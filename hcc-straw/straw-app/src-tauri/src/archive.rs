use crate::{blocking, consume, error::ApiError, writable, Operation};
use std::{path::Path, sync::Arc};
use straw_engine::db::DbState;
use straw_security::Security;
use straw_storage::{
    eduba::{self, Archive, Preview},
    Store,
};
use tauri::State;
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
#[specta::specta]
pub async fn eduba_pick_source(app: tauri::AppHandle) -> Result<Option<String>, ApiError> {
    blocking(move || {
        app.dialog()
            .file()
            .set_title("Choose an Eduba database or archive")
            .add_filter(
                "Eduba databases and archives",
                &["db", "sqlite", "sqlite3", "json"],
            )
            .blocking_pick_file()
            .map(|file| {
                file.into_path()
                    .map(|p| p.to_string_lossy().into_owned())
                    .map_err(|e| e.to_string())
            })
            .transpose()
    })
    .await
}

#[tauri::command]
#[specta::specta]
pub async fn eduba_pick_export(app: tauri::AppHandle) -> Result<Option<String>, ApiError> {
    blocking(move || {
        app.dialog()
            .file()
            .set_title("Export Eduba archive")
            .set_file_name("eduba-archive.json")
            .add_filter("JSON archive", &["json"])
            .blocking_save_file()
            .map(|file| {
                file.into_path()
                    .map(|p| p.to_string_lossy().into_owned())
                    .map_err(|e| e.to_string())
            })
            .transpose()
    })
    .await
}

#[tauri::command]
#[specta::specta]
pub async fn eduba_preview(source_path: String) -> Result<Preview, ApiError> {
    blocking(move || eduba::prepare(Path::new(&source_path)).map(|p| p.preview())).await
}

#[tauri::command]
#[specta::specta]
pub async fn eduba_list(db: State<'_, DbState>) -> Result<Vec<Archive>, ApiError> {
    let store = db.storage().clone();
    blocking(move || store.eduba_archives()).await
}

#[tauri::command]
#[specta::specta]
pub async fn eduba_import(
    db: State<'_, DbState>,
    security: State<'_, Arc<Security>>,
    source_path: String,
    digest: String,
    grant: String,
) -> Result<Archive, ApiError> {
    let store = db.storage().clone();
    let security = security.inner().clone();
    blocking(move || import(&store, &security, source_path, digest, grant)).await
}

fn import(
    store: &Store,
    security: &Security,
    source_path: String,
    digest: String,
    grant: String,
) -> Result<Archive, String> {
    writable(security)?;
    // Capture once again before consuming consent. Import uses that exact owned
    // snapshot, so a later source edit cannot alter approved content.
    let prepared = eduba::prepare(Path::new(&source_path))?;
    if prepared.preview().digest != digest {
        return Err("invalid Eduba archive: source changed; preview and approve again".into());
    }
    consume(
        security,
        grant,
        &Operation::ImportEduba {
            source_path,
            digest,
        },
    )?;
    store.import_eduba(prepared)
}

#[tauri::command]
#[specta::specta]
pub async fn eduba_export(
    db: State<'_, DbState>,
    security: State<'_, Arc<Security>>,
    digest: String,
    output_path: String,
    grant: String,
) -> Result<(), ApiError> {
    let store = db.storage().clone();
    let security = security.inner().clone();
    blocking(move || export(&store, &security, digest, output_path, grant)).await
}

fn export(
    store: &Store,
    security: &Security,
    digest: String,
    output_path: String,
    grant: String,
) -> Result<(), String> {
    writable(security)?;
    let path = Path::new(&output_path);
    eduba::require_local(path)?;
    if !path.is_absolute() || path.extension().and_then(|e| e.to_str()) != Some("json") {
        return Err("invalid Eduba archive: choose an absolute local .json export path".into());
    }
    let parent = path
        .parent()
        .ok_or("invalid export path")?
        .canonicalize()
        .map_err(|e| e.to_string())?;
    eduba::require_local(&parent)?;
    if path.exists() {
        return Err("invalid Eduba archive: export file already exists".into());
    }
    let json = store.eduba_json(digest.clone())?;
    consume(
        security,
        grant,
        &Operation::ExportEduba {
            digest,
            output_path: output_path.clone(),
        },
    )?;
    eduba::write_json(Path::new(&output_path), &json)
}

#[cfg(test)]
mod tests {
    use super::*;
    fn fixture() -> (tempfile::TempDir, Store, Security, String, String) {
        let dir = tempfile::tempdir().unwrap();
        let store = Store::open(dir.path().join("store.db"), "").unwrap();
        let security = Security::open(store.clone(), dir.path().join("checkpoint.json")).unwrap();
        security
            .initialize(zeroize::Zeroizing::new("archive test passphrase".into()))
            .unwrap();
        let path = dir.path().join("source.json");
        std::fs::write(&path, r#"{"version":1,"learners":[],"courses":[],"lessons":[],"enrollments":[],"submissions":[]}"#).unwrap();
        let preview = eduba::prepare(&path).unwrap().preview();
        (dir, store, security, preview.source_path, preview.digest)
    }
    fn grant(security: &Security, operation: &Operation) -> String {
        security
            .issue(
                operation.permissions(),
                straw_security::digest(operation).unwrap(),
            )
            .unwrap()
            .id
    }
    #[test]
    fn changed_source_fails_before_consuming_consent_or_writing() {
        let (_dir, store, security, source_path, digest) = fixture();
        let operation = Operation::ImportEduba {
            source_path: source_path.clone(),
            digest: digest.clone(),
        };
        let id = grant(&security, &operation);
        let original = std::fs::read(&source_path).unwrap();
        std::fs::write(&source_path, r#"{"version":1,"learners":[{"id":"new","name":"new","created_at":1}],"courses":[],"lessons":[],"enrollments":[],"submissions":[]}"#).unwrap();
        assert!(import(
            &store,
            &security,
            source_path.clone(),
            digest.clone(),
            id.clone()
        )
        .unwrap_err()
        .contains("source changed"));
        assert!(store.eduba_archives().unwrap().is_empty());
        std::fs::write(&source_path, original).unwrap();
        import(
            &store,
            &security,
            source_path.clone(),
            digest.clone(),
            id.clone(),
        )
        .unwrap();
        assert!(import(&store, &security, source_path, digest, id).is_err());
        assert_eq!(store.eduba_archives().unwrap().len(), 1);
    }
    #[test]
    fn export_is_scoped_to_content_and_path_and_never_overwrites() {
        let (dir, store, security, source_path, digest) = fixture();
        store
            .import_eduba(eduba::prepare(Path::new(&source_path)).unwrap())
            .unwrap();
        let output_path = dir
            .path()
            .join("export.json")
            .to_string_lossy()
            .into_owned();
        let other = dir.path().join("other.json").to_string_lossy().into_owned();
        let operation = Operation::ExportEduba {
            digest: digest.clone(),
            output_path: output_path.clone(),
        };
        let id = grant(&security, &operation);
        assert!(export(&store, &security, digest.clone(), other.clone(), id.clone()).is_err());
        assert!(!Path::new(&other).exists());
        export(
            &store,
            &security,
            digest.clone(),
            output_path.clone(),
            id.clone(),
        )
        .unwrap();
        assert_eq!(
            eduba::prepare(Path::new(&output_path))
                .unwrap()
                .preview()
                .digest,
            digest
        );
        let before = std::fs::read(&output_path).unwrap();
        assert!(export(&store, &security, digest, output_path.clone(), id).is_err());
        assert_eq!(std::fs::read(output_path).unwrap(), before);
    }
    #[test]
    fn locked_vault_and_wrong_content_grant_cannot_import() {
        let (_dir, store, security, source_path, digest) = fixture();
        let wrong = Operation::ImportEduba {
            source_path: source_path.clone(),
            digest: "different".into(),
        };
        let id = grant(&security, &wrong);
        assert!(import(&store, &security, source_path.clone(), digest.clone(), id).is_err());
        let operation = Operation::ImportEduba {
            source_path: source_path.clone(),
            digest: digest.clone(),
        };
        let id = grant(&security, &operation);
        security.lock().unwrap();
        assert!(import(&store, &security, source_path, digest, id).is_err());
        assert!(store.eduba_archives().unwrap().is_empty());
    }
}
