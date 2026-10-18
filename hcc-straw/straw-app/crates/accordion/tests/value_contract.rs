use serde_json::{json, Value};
use straw_accordion::{
    autarch::{EntityDef, FieldDef},
    record::{clean_record, validate_value},
};

#[test]
fn schema_rejects_inapplicable_constraints_nested_relations_and_invalid_display_fields() {
    use straw_accordion::Autarch;
    for (definition, expected) in [
        (
            json!({"name":"value","type":"string","values":["unused"]}),
            "only valid on enum",
        ),
        (json!({"name":"value","type":"relation"}), "relation needs"),
        (
            json!({"name":"value","type":"string","to":"related"}),
            "only valid on relations",
        ),
        (
            json!({"name":"value","type":"string","display_field":"title"}),
            "only valid on relations",
        ),
        (
            json!({"name":"value","type":"json","fields":[{"name":"child","type":"relation","to":"related"}]}),
            "not allowed inside json",
        ),
        (
            json!({"name":"value","type":"json","fields":[{"name":"child","type":"string","unique":true}]}),
            "cannot be unique or auto",
        ),
        (
            json!({"name":"value","type":"json","fields":[{"name":"child","type":"datetime","auto":true}]}),
            "cannot be unique or auto",
        ),
        (
            json!({"name":"value","type":"string","fields":[]}),
            "only valid on json",
        ),
        (
            json!({"name":"value","type":"relation","to":"related","display_field":"absent"}),
            "not on",
        ),
        (
            json!({"name":"bad-field","type":"string"}),
            "invalid field name",
        ),
        (
            json!({"name":"1value","type":"string"}),
            "invalid field name",
        ),
    ] {
        let document = json!({"entities":[{"name":"related","fields":[{"name":"title","type":"string"}]},{"name":"owner","fields":[definition]}]});
        let error = Autarch::from_yaml(&document.to_string())
            .expect_err("invalid definition accepted");
        assert!(error.to_string().contains(expected), "{error}");
    }
    for name in ["1entity", "bad/name", "_entity", ""] {
        assert!(
            Autarch::from_yaml(&json!({"entities":[{"name":name,"fields":[]}]}).to_string())
                .is_err()
        );
    }
    let valid=Autarch::from_yaml(&json!({"entities":[{"name":"entity_name","fields":[{"name":"_field","type":"json","fields":[{"name":"child","type":"json","fields":[{"name":"value","type":"string"}]}]}]}]}).to_string()).unwrap();
    assert!(valid
        .entity("entity_name")
        .unwrap()
        .field("absent")
        .is_none());
}

fn field(kind: &str) -> FieldDef {
    serde_json::from_value(json!({"name":"value","type":kind,"label":"Value"})).unwrap()
}

#[test]
fn scalar_values_enforce_type_size_bounds_and_optional_normalization() {
    for kind in ["string", "text"] {
        let definition = field(kind);
        assert_eq!(validate_value(&definition, None).unwrap(), json!(""));
        assert_eq!(
            validate_value(&definition, Some(&json!("valid"))).unwrap(),
            json!("valid")
        );
        assert!(validate_value(&definition, Some(&json!(4)))
            .unwrap_err()
            .contains("must be text"));
        let cap = if kind == "text" {
            1024 * 1024
        } else {
            64 * 1024
        };
        assert!(
            validate_value(&definition, Some(&json!("x".repeat(cap + 1))))
                .unwrap_err()
                .contains("too long")
        );
    }
    let mut integer = field("integer");
    integer.min = Some(0);
    integer.max = Some(5);
    for value in [json!(0), json!(5)] {
        assert_eq!(validate_value(&integer, Some(&value)).unwrap(), value);
    }
    for value in [json!(-1), json!(6), json!(1.5), json!("2")] {
        assert!(validate_value(&integer, Some(&value)).is_err());
    }
    assert_eq!(
        validate_value(&integer, Some(&Value::Null)).unwrap(),
        Value::Null
    );
    integer.required = true;
    assert!(validate_value(&integer, None)
        .unwrap_err()
        .contains("required"));
    let boolean = field("boolean");
    for input in [
        None,
        Some(Value::Null),
        Some(json!(false)),
        Some(json!(true)),
    ] {
        assert!(validate_value(&boolean, input.as_ref())
            .unwrap()
            .is_boolean());
    }
    assert!(validate_value(&boolean, Some(&json!("false"))).is_err());
    let date = field("datetime");
    for text in [
        "2026-10-14T12:30:00Z",
        "2026-10-14T12:30",
        "2026-10-14T12:30:20",
        "2026-10-14T12:30:20.123",
    ] {
        assert_eq!(
            validate_value(&date, Some(&json!(text))).unwrap(),
            json!(text)
        );
    }
    for value in [json!("2026-99-01"), json!(42)] {
        assert!(validate_value(&date, Some(&value)).is_err());
    }
    let mut enumeration = field("enum");
    enumeration.values = vec!["one".into(), "two".into()];
    assert_eq!(
        validate_value(&enumeration, Some(&json!("two"))).unwrap(),
        json!("two")
    );
    assert!(validate_value(&enumeration, Some(&json!("three"))).is_err());
}

#[test]
fn structured_values_normalize_metadata_and_reject_invalid_shapes() {
    let file = field("file");
    let metadata =
        json!({"name":"local.txt","size":42,"type":"text/plain","untrusted":"discarded"});
    assert_eq!(
        validate_value(&file, Some(&metadata)).unwrap(),
        json!({"name":"local.txt","size":42,"type":"text/plain"})
    );
    for value in [
        json!("path"),
        json!({"name":"","size":0,"type":""}),
        json!({"name":"x","size":-1,"type":"text"}),
        json!({"name":"x".repeat(256),"size":1,"type":""}),
        json!({"name":"x","size":1,"type":"x".repeat(256)}),
    ] {
        assert!(validate_value(&file, Some(&value)).is_err());
    }
    let coordinates = field("coordinates");
    for value in [json!({"lat":90,"lng":180}), json!({"lat":-90,"lng":-180})] {
        assert!(validate_value(&coordinates, Some(&value))
            .unwrap()
            .is_object());
    }
    for value in [
        json!({"lat":91,"lng":0}),
        json!({"lat":0,"lng":181}),
        json!({"lat":"north","lng":0}),
    ] {
        assert!(validate_value(&coordinates, Some(&value)).is_err());
    }
    let relation = field("relation");
    assert_eq!(
        validate_value(&relation, Some(&json!("id"))).unwrap(),
        json!("id")
    );
    assert!(validate_value(&relation, Some(&json!("x".repeat(65)))).is_err());
    assert!(validate_value(&relation, Some(&json!(4))).is_err());
    let mut structured = field("json");
    assert_eq!(
        validate_value(&structured, Some(&json!([1, 2]))).unwrap(),
        json!([1, 2])
    );
    assert!(validate_value(&structured, Some(&json!("x".repeat(256 * 1024)))).is_err());
    let mut child = field("integer");
    child.required = true;
    structured.fields = Some(vec![child]);
    assert_eq!(
        validate_value(&structured, Some(&json!({"value":3}))).unwrap(),
        json!({"value":3})
    );
    for value in [
        json!([]),
        json!({"value":"invalid"}),
        json!({"unexpected":1}),
    ] {
        assert!(validate_value(&structured, Some(&value)).is_err());
    }
}

#[test]
fn whole_records_preserve_server_managed_fields_defaults_and_explicit_null() {
    let entity: EntityDef = serde_json::from_value(json!({"name":"record","fields":[
        {"name":"created","type":"datetime","auto":true},
        {"name":"priority","type":"integer","default":3},
        {"name":"title","type":"string","required":true}
    ]}))
    .unwrap();
    let first = clean_record(
        &entity,
        &json!({"id":"client-id","title":"Ready","created":"client-forgery"}),
        None,
        "server-time",
    )
    .unwrap();
    assert_eq!(first["created"], "server-time");
    assert_eq!(first["priority"], 3);
    assert!(!first.contains_key("id"));
    let second = clean_record(
        &entity,
        &json!({"title":"Edited","priority":null}),
        Some(&first),
        "later",
    )
    .unwrap();
    assert_eq!(second["created"], "server-time");
    assert_eq!(second["priority"], Value::Null);
    let errors = clean_record(&entity, &json!({"unexpected":true}), None, "now").unwrap_err();
    assert!(errors.contains_key("unexpected") && errors.contains_key("title"));
    assert!(clean_record(&entity, &json!([]), None, "now")
        .unwrap_err()
        .contains_key(""));
}
