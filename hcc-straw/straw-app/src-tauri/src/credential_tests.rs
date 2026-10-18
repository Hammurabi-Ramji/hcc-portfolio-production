//! Real IPC, signed grants and synthetic legacy data; no native dialog clicks.
use crate::command_tests::Desk;
use crate::*;
use serde_json::json;
const ROOT: &str = "fixture-installation-key";
const PASSWORD: &str = "000102030405060708090a0b72f58f3916cb8f0b42231e517061e7c66783b43475f3d446815a6aea55ca700e1e1849ec6a5ecc6e9b400eb6";
fn source(desk: &Desk) -> (straw_storage::Store, String) {
    let path = desk.dir.path().join("legacy.db");
    let store = straw_storage::Store::open(&path, "").unwrap();
    let cipher: Vec<u8> = PASSWORD
        .as_bytes()
        .as_chunks::<2>()
        .0
        .iter()
        .map(|pair| u8::from_str_radix(std::str::from_utf8(pair).unwrap(), 16).unwrap())
        .collect();
    store.call(move|c|Box::pin(async move {
        sqlx::raw_sql("CREATE TABLE users(id INTEGER PRIMARY KEY); INSERT INTO users VALUES(1),(2); CREATE TABLE credentials(id INTEGER PRIMARY KEY,user_id INTEGER,service TEXT,username_encrypted BLOB,password_encrypted BLOB,notes_encrypted BLOB,url TEXT,created_at DATETIME,updated_at DATETIME);").execute(&mut *c).await?;
        sqlx::query("INSERT INTO credentials VALUES(1,1,'service',?,?,NULL,NULL,NULL,NULL),(2,2,'other',?,?,NULL,NULL,NULL,NULL)").bind(&cipher).bind(&cipher).bind(&cipher).bind(&cipher).execute(c).await?;
        Ok(())
    })).unwrap();
    (store, path.to_string_lossy().into_owned())
}
fn mutate(store: &straw_storage::Store, sql: &'static str) {
    store
        .call(move |c| {
            Box::pin(async move {
                sqlx::raw_sql(sql).execute(c).await?;
                Ok(())
            })
        })
        .unwrap();
}
#[test]
fn credential_ipc_import_reveal_scope_replay_lock_and_secret_free_receipts() {
    let desk = Desk::new();
    desk.initialize();
    let (_source, path) = source(&desk);
    let owners = desk.ok("credentials_owners", json!({"sourcePath":path}));
    assert_eq!(owners.as_array().unwrap().len(), 2);
    let preview = desk.ok(
        "credentials_preview",
        json!({"sourcePath":path,"ownerId":"1"}),
    );
    assert_eq!(preview["credentialIds"], json!(["1"]));
    let digest = preview["digest"].as_str().unwrap().to_owned();
    let grant = desk.grant(&Operation::ImportCredentials {
        source_path: path.clone(),
        owner_id: "1".into(),
        digest: digest.clone(),
    });
    let other = desk.ok(
        "credentials_preview",
        json!({"sourcePath":path,"ownerId":"2"}),
    );
    desk.refuses("credentials_import",json!({"sourcePath":path,"ownerId":"2","digest":other["digest"],"legacyKey":ROOT,"grant":grant}),"grant_invalid");
    assert_eq!(desk.ok("credentials_list", json!({})), json!([]));
    let args =
        json!({"sourcePath":path,"ownerId":"1","digest":digest,"legacyKey":ROOT,"grant":grant});
    let receipt = desk.ok("credentials_import", args.clone());
    assert_eq!(receipt["ownerId"], "1");
    assert_eq!(receipt["credentialIds"], json!(["1"]));
    desk.refuses("credentials_import", args, "grant_invalid");
    let receipts = desk.ok("credentials_list", json!({})).to_string();
    for secret in [ROOT, "PRIVATE_LEGACY_PASSWORD_5793", "service"] {
        assert!(!receipts.contains(secret));
    }
    let grant = desk.grant(&Operation::RevealCredential {
        digest: digest.clone(),
        credential_id: "1".into(),
    });
    desk.refuses(
        "credentials_reveal",
        json!({"digest":digest,"credentialId":"2","grant":grant}),
        "grant_invalid",
    );
    let args = json!({"digest":digest,"credentialId":"1","grant":grant});
    let text = desk.ok("credentials_reveal", args.clone());
    assert!(text
        .as_str()
        .unwrap()
        .contains("PRIVATE_LEGACY_PASSWORD_5793"));
    desk.refuses("credentials_reveal", args, "grant_invalid");
    let grant = desk.grant(&Operation::RevealCredential {
        digest: digest.clone(),
        credential_id: "1".into(),
    });
    desk.ok("vault_lock", json!({}));
    desk.refuses(
        "credentials_reveal",
        json!({"digest":digest,"credentialId":"1","grant":grant}),
        "vault_locked",
    );
    assert_eq!(
        desk.ok("credentials_list", json!({}))
            .as_array()
            .unwrap()
            .len(),
        1
    );
}
#[test]
fn credential_ipc_changed_source_preserves_grant_wrong_key_spends_it_without_importing() {
    let desk = Desk::new();
    desk.initialize();
    let (source, path) = source(&desk);
    let preview = desk.ok(
        "credentials_preview",
        json!({"sourcePath":path,"ownerId":"1"}),
    );
    let digest = preview["digest"].as_str().unwrap().to_owned();
    let grant = desk.grant(&Operation::ImportCredentials {
        source_path: path.clone(),
        owner_id: "1".into(),
        digest: digest.clone(),
    });
    mutate(
        &source,
        "UPDATE credentials SET service='changed' WHERE user_id=1",
    );
    desk.refuses(
        "credentials_import",
        json!({"sourcePath":path,"ownerId":"1","digest":digest,"legacyKey":ROOT,"grant":grant}),
        "source changed",
    );
    mutate(
        &source,
        "UPDATE credentials SET service='service' WHERE user_id=1",
    );
    desk.refuses("credentials_import",json!({"sourcePath":path,"ownerId":"1","digest":digest,"legacyKey":"incorrect installation key","grant":grant}),"authentication failed");
    assert_eq!(desk.ok("credentials_list", json!({})), json!([]));
    desk.refuses(
        "credentials_import",
        json!({"sourcePath":path,"ownerId":"1","digest":digest,"legacyKey":ROOT,"grant":grant}),
        "grant_invalid",
    );
    let grant = desk.grant(&Operation::ImportCredentials {
        source_path: path.clone(),
        owner_id: "1".into(),
        digest: digest.clone(),
    });
    desk.ok(
        "credentials_import",
        json!({"sourcePath":path,"ownerId":"1","digest":digest,"legacyKey":ROOT,"grant":grant}),
    );
}
#[test]
fn credential_consent_is_closed_and_does_not_encode_installation_keys() {
    let operation = Operation::ImportCredentials {
        source_path: "chosen.db".into(),
        owner_id: "1".into(),
        digest: "a".repeat(64),
    };
    assert_eq!(
        operation.permissions(),
        vec![Permission::Import, Permission::Unseal]
    );
    assert!(operation.summary().contains("re-encrypt"));
    let mut value = serde_json::to_value(operation).unwrap();
    assert!(!value.to_string().contains("legacyKey"));
    value["legacyKey"] = json!(ROOT);
    assert!(serde_json::from_value::<Operation>(value).is_err());
    assert!(serde_json::from_value::<Operation>(
        json!({"kind":"export_credentials","digest":"a".repeat(64)})
    )
    .is_err());
}
