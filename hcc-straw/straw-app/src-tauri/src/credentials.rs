use crate::{blocking, consume, error::ApiError, writable, Operation};
use std::{path::Path, sync::Arc};
use straw_security::{
    digital_hands::{self, CredentialImportReceipt, CredentialOwner, CredentialPreview},
    Security,
};
use tauri::State;
use tauri_plugin_dialog::DialogExt;
use zeroize::Zeroizing;

#[tauri::command]
#[specta::specta]
pub async fn credentials_pick_source(app: tauri::AppHandle) -> Result<Option<String>, ApiError> {
    blocking(move || {
        app.dialog()
            .file()
            .set_title("Choose a Digital Hands database")
            .add_filter("SQLite databases", &["db", "sqlite", "sqlite3"])
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
pub async fn credentials_owners(source_path: String) -> Result<Vec<CredentialOwner>, ApiError> {
    blocking(move || digital_hands::owners(Path::new(&source_path))).await
}
#[tauri::command]
#[specta::specta]
pub async fn credentials_preview(
    source_path: String,
    owner_id: String,
) -> Result<CredentialPreview, ApiError> {
    blocking(move || {
        digital_hands::prepare(Path::new(&source_path), &owner_id).map(|p| p.preview())
    })
    .await
}
#[tauri::command]
#[specta::specta]
pub async fn credentials_list(
    security: State<'_, Arc<Security>>,
) -> Result<Vec<CredentialImportReceipt>, ApiError> {
    let security = security.inner().clone();
    blocking(move || security.digital_hands_imports()).await
}
#[tauri::command]
#[specta::specta]
pub async fn credentials_import(
    security: State<'_, Arc<Security>>,
    source_path: String,
    owner_id: String,
    digest: String,
    legacy_key: String,
    grant: String,
) -> Result<CredentialImportReceipt, ApiError> {
    let key = Zeroizing::new(legacy_key);
    let security = security.inner().clone();
    blocking(move || import(&security, source_path, owner_id, digest, key, grant)).await
}
fn import(
    security: &Security,
    source_path: String,
    owner_id: String,
    digest: String,
    key: Zeroizing<String>,
    grant: String,
) -> Result<CredentialImportReceipt, String> {
    writable(security)?;
    let prepared = digital_hands::prepare(Path::new(&source_path), &owner_id)?;
    if prepared.preview().digest != digest {
        return Err("Digital Hands source changed; preview and approve again".into());
    }
    consume(
        security,
        grant,
        &Operation::ImportCredentials {
            source_path,
            owner_id,
            digest,
        },
    )?;
    security.import_digital_hands(prepared, key)
}
#[tauri::command]
#[specta::specta]
pub async fn credentials_reveal(
    security: State<'_, Arc<Security>>,
    digest: String,
    credential_id: String,
    grant: String,
) -> Result<String, ApiError> {
    let security = security.inner().clone();
    blocking(move || reveal(&security, digest, credential_id, grant)).await
}
fn reveal(
    security: &Security,
    digest: String,
    credential_id: String,
    grant: String,
) -> Result<String, String> {
    consume(
        security,
        grant,
        &Operation::RevealCredential {
            digest: digest.clone(),
            credential_id: credential_id.clone(),
        },
    )?;
    security.reveal_digital_hands(digest, credential_id)
}
