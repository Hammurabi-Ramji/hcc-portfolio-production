use serde_json::{json, Value};
use straw_accordion::{Accordion, AccordionError, Autarch};
use straw_storage::Store;
use tempfile::TempDir;

const YAML: &str = r#"
project: { name: demo }
files: [a.rs]
entities:
  - name: user
    fields:
      - { name: name, type: string, required: true, unique: true }
  - name: task
    audit: true
    fields:
      - { name: title, type: string, required: true, label: Task Title }
      - { name: done, type: boolean }
      - { name: priority, type: enum, values: [low, med, high], default: med }
      - { name: estimate, type: integer, min: 0, max: 100 }
      - { name: assigned_to, type: relation, to: user, display_field: name }
      - { name: where, type: coordinates }
      - { name: created, type: datetime, auto: true }
      - name: meta
        type: json
        fields:
          - { name: note, type: text }
  - name: scratch
    soft_delete: false
    fields:
      - { name: label, type: string }
"#;

fn open() -> (TempDir, Accordion, Store) {
    let dir = tempfile::tempdir().unwrap();
    let store = Store::open(dir.path().join("a.db"), "").unwrap();
    let acc = Accordion::open(store.clone(), Autarch::from_yaml(YAML).unwrap()).unwrap();
    (dir, acc, store)
}

fn validation(err: AccordionError) -> std::collections::BTreeMap<String, String> {
    match err {
        AccordionError::Validation(e) => e,
        other => panic!("expected validation error, got {other:?}"),
    }
}

#[test]
fn schema_commands_match_the_origami_contract() {
    let (_d, acc, _store) = open();
    let entities = acc.schema_entities();
    assert_eq!(entities.iter().map(|e| e.name.as_str()).collect::<Vec<_>>(), ["user", "task", "scratch"]);

    let schema = serde_json::to_value(acc.schema_get("task").unwrap()).unwrap();
    assert_eq!(schema["entity"], "task");
    assert_eq!(schema["label"], "Task");
    assert_eq!(schema["audit"], true);
    assert_eq!(schema["soft_delete"], true);
    let fields = schema["fields"].as_array().unwrap();
    let get = |n: &str| fields.iter().find(|f| f["name"] == n).unwrap();
    assert_eq!(get("title")["label"], "Task Title");
    assert_eq!(get("title")["required"], true);
    assert_eq!(get("priority")["type"], "enum");
    assert_eq!(get("priority")["values"], json!(["low", "med", "high"]));
    assert_eq!(get("priority")["default"], "med");
    assert_eq!(get("assigned_to")["to"], "user");
    assert_eq!(get("assigned_to")["display_field"], "name");
    assert_eq!(get("created")["auto"], true);
    assert_eq!(get("meta")["fields"][0]["name"], "note");
    assert_eq!(get("assigned_to")["label"], "Assigned To");

    assert!(matches!(acc.schema_get("nope"), Err(AccordionError::UnknownEntity(_))));
    assert!(matches!(acc.schema_get("../x"), Err(AccordionError::UnknownEntity(_))));
}

#[test]
fn crud_round_trip() {
    let (_d, acc, _store) = open();
    let created = acc.entity_save("task", None, json!({ "title": "Ship", "estimate": 3 })).unwrap();
    let id = created["id"].as_str().unwrap().to_owned();
    assert_eq!(created["priority"], "med", "default applied");
    assert_eq!(created["done"], false);
    assert!(created["created"].as_str().unwrap().ends_with('Z'));

    assert_eq!(acc.entity_read("task", &id).unwrap(), created);
    assert_eq!(acc.entity_list("task").unwrap().len(), 1);

    let updated = acc
        .entity_save("task", Some(id.clone()), json!({ "id": "ignored", "title": "Shipped", "priority": "high", "done": true }))
        .unwrap();
    assert_eq!(updated["id"], id.as_str());
    assert_eq!(updated["title"], "Shipped");
    assert_eq!(updated["created"], created["created"], "auto field survives updates");

    acc.entity_delete("task", &id).unwrap();
    assert!(acc.entity_list("task").unwrap().is_empty());
    assert!(matches!(acc.entity_read("task", &id), Err(AccordionError::NotFound { .. })));
    assert!(matches!(acc.entity_delete("task", &id), Err(AccordionError::NotFound { .. })));
    assert!(matches!(
        acc.entity_save("task", Some(id), json!({ "title": "x" })),
        Err(AccordionError::NotFound { .. })
    ));
}

#[test]
fn validation_is_authoritative() {
    let (_d, acc, _store) = open();
    let errs = validation(
        acc.entity_save(
            "task",
            None,
            json!({ "title": "", "estimate": 500, "priority": "urgent", "where": { "lat": 99, "lng": 0 }, "bogus": 1,
                    "meta": { "note": 5 } }),
        )
        .unwrap_err(),
    );
    assert_eq!(errs["title"], "Task Title is required");
    assert_eq!(errs["estimate"], "Estimate must be at most 100");
    assert_eq!(errs["priority"], "Priority must be one of: low, med, high");
    assert!(errs["where"].contains("latitude"));
    assert_eq!(errs["bogus"], "unknown field");
    assert!(errs["meta"].contains("note"));

    let errs = validation(acc.entity_save("task", None, json!({ "title": "t", "estimate": 1.5 })).unwrap_err());
    assert_eq!(errs["estimate"], "Estimate must be a whole number");
    let errs = validation(acc.entity_save("task", None, json!("not an object")).unwrap_err());
    assert!(errs[""].contains("object"));
    assert!(acc.entity_list("task").unwrap().is_empty(), "failed saves write nothing");
}


#[test]
fn auto_field_is_server_owned() {
    let (_d, acc, _s) = open();
    let saved = acc.entity_save("task", None, json!({ "title": "t", "created": "1999-01-01T00:00:00Z" })).unwrap();
    assert_ne!(saved["created"], "1999-01-01T00:00:00Z");
}

#[test]
fn relations_are_checked_and_protected() {
    let (_d, acc, _s) = open();
    let errs = validation(acc.entity_save("task", None, json!({ "title": "t", "assigned_to": "ghost" })).unwrap_err());
    assert!(errs["assigned_to"].contains("missing user"));

    let ada = acc.entity_save("user", None, json!({ "name": "Ada" })).unwrap();
    let ada_id = ada["id"].as_str().unwrap();
    let task = acc.entity_save("task", None, json!({ "title": "t", "assigned_to": ada_id })).unwrap();

    let err = acc.entity_delete("user", ada_id).unwrap_err();
    assert!(matches!(err, AccordionError::Conflict(ref m) if m.contains("task.assigned_to")), "{err:?}");
    assert_eq!(acc.entity_list("user").unwrap().len(), 1);

    acc.entity_delete("task", task["id"].as_str().unwrap()).unwrap();
    acc.entity_delete("user", ada_id).unwrap();
}

#[test]
fn unique_fields_are_enforced_among_live_records() {
    let (_d, acc, _s) = open();
    let a = acc.entity_save("user", None, json!({ "name": "Ada" })).unwrap();
    let errs = validation(acc.entity_save("user", None, json!({ "name": "Ada" })).unwrap_err());
    assert_eq!(errs["name"], "Name must be unique");
    acc.entity_save("user", Some(a["id"].as_str().unwrap().to_owned()), json!({ "name": "Ada" })).unwrap();
    acc.entity_delete("user", a["id"].as_str().unwrap()).unwrap();
    acc.entity_save("user", None, json!({ "name": "Ada" })).unwrap();
}

fn count(store: &Store, sql: &'static str) -> i64 {
    store.call(move |c| Box::pin(async move { sqlx::query_scalar(sql).fetch_one(c).await })).unwrap()
}

#[test]
fn soft_delete_keeps_the_row_and_hard_delete_removes_it() {
    let (_d, acc, store) = open();
    let t = acc.entity_save("task", None, json!({ "title": "t" })).unwrap();
    let s = acc.entity_save("scratch", None, json!({ "label": "x" })).unwrap();
    acc.entity_delete("task", t["id"].as_str().unwrap()).unwrap();
    acc.entity_delete("scratch", s["id"].as_str().unwrap()).unwrap();
    assert_eq!(count(&store, "SELECT count(*) FROM accordion_records WHERE entity='task'"), 1);
    assert_eq!(count(&store, "SELECT count(*) FROM accordion_records WHERE entity='scratch'"), 0);
}

#[test]
fn audited_entities_log_every_write_and_the_log_is_append_only() {
    let (_d, acc, store) = open();
    let t = acc.entity_save("task", None, json!({ "title": "a" })).unwrap();
    let id = t["id"].as_str().unwrap().to_owned();
    acc.entity_save("task", Some(id.clone()), json!({ "title": "b" })).unwrap();
    acc.entity_delete("task", &id).unwrap();
    acc.entity_save("scratch", None, json!({ "label": "unaudited" })).unwrap();
    assert_eq!(count(&store, "SELECT count(*) FROM accordion_audit WHERE entity='task'"), 3);
    assert_eq!(count(&store, "SELECT count(*) FROM accordion_audit WHERE entity='scratch'"), 0);
    let rewrite = store.call(|c| Box::pin(async move { sqlx::query("DELETE FROM accordion_audit").execute(c).await.map(|_| ()) }));
    assert!(rewrite.is_err(), "audit rows must not be deletable");
}

#[test]
fn failed_validation_writes_no_audit_row() {
    let (_d, acc, store) = open();
    assert!(acc.entity_save("task", None, json!({ "title": "" })).is_err());
    assert_eq!(count(&store, "SELECT count(*) FROM accordion_audit"), 0);
}

#[test]
fn data_survives_reopening_the_database() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("a.db");
    let id = {
        let acc = Accordion::open_path(&path, Autarch::from_yaml(YAML).unwrap()).unwrap();
        acc.entity_save("user", None, json!({ "name": "Ada" })).unwrap()["id"].as_str().unwrap().to_owned()
    };
    let acc = Accordion::open_path(&path, Autarch::from_yaml(YAML).unwrap()).unwrap();
    assert_eq!(acc.entity_read("user", &id).unwrap()["name"], "Ada");
}

fn schema_error(yaml: &str) -> String {
    match Autarch::from_yaml(yaml) {
        Err(AccordionError::Schema(m)) => m,
        other => panic!("expected schema error, got {other:?}"),
    }
}

#[test]
fn bad_definitions_fail_at_load() {
    let ent = |fields: &str| format!("entities:\n  - name: e\n    fields:\n{fields}");
    assert!(schema_error(&ent("      - { name: a, type: hologram }")).contains("hologram"));
    assert!(schema_error(&ent("      - { name: a, type: string, requird: true }")).contains("requird"));
    assert!(schema_error(&ent("      - { name: a, type: string }\n      - { name: a, type: text }")).contains("duplicate"));
    assert!(schema_error(&ent("      - { name: a, type: enum }")).contains("no values"));
    assert!(schema_error(&ent("      - { name: a, type: relation, to: ghost }")).contains("ghost"));
    assert!(schema_error(&ent("      - { name: a, type: string, auto: true }")).contains("auto"));
    assert!(schema_error(&ent("      - { name: a, type: text, unique: true }")).contains("unique"));
    assert!(schema_error(&ent("      - { name: a, type: integer, min: 5, max: 1 }")).contains("min"));
    assert!(schema_error(&ent("      - { name: 'a b', type: string }")).contains("invalid field"));
    assert!(schema_error(&ent("      - { name: a, type: integer, default: 'x' }")).contains("default"));
    assert!(schema_error("entities:\n  - { name: '../x', fields: [] }").contains("invalid entity"));
    assert!(schema_error("entities:\n  - { name: e, fields: [] }\n  - { name: e, fields: [] }").contains("duplicate"));
}

#[test]
fn the_repository_manifest_loads() {
    let text = std::fs::read_to_string(concat!(env!("CARGO_MANIFEST_DIR"), "/../../.autarch.yaml")).unwrap();
    let autarch = Autarch::from_yaml(&text).unwrap();
    assert!(autarch.entity("note").is_some());
    let dir = tempfile::tempdir().unwrap();
    let acc = Accordion::open_path(dir.path().join("a.db"), autarch).unwrap();
    let topic = acc.entity_save("topic", None, json!({ "name": "Rust" })).unwrap();
    let note = acc.entity_save("note", None, json!({ "title": "Hi", "topic": topic["id"] })).unwrap();
    assert_eq!(note["status"], "draft");
    assert_eq!(note["priority"], 0);
    let _: Value = acc.entity_read("note", note["id"].as_str().unwrap()).unwrap();
}
