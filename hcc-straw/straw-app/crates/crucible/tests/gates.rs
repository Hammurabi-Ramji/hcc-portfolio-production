// crucible:allow-file(portability)
// crucible:allow-file(completeness)
// crucible:allow-file(security)
//! Fixtures are generated in temp dirs so the test tree itself stays clean
//! under `crucible validate`.

use std::fs;
use std::path::Path;

use crucible::gates::{completeness, security, structure};
use crucible::{GateName, GateStatus};
use tempfile::TempDir;

fn write(root: &Path, rel: &str, content: &str) {
    let path = root.join(rel);
    fs::create_dir_all(path.parent().unwrap()).unwrap();
    fs::write(path, content).unwrap();
}

fn project(files: &[(&str, &str)]) -> TempDir {
    let dir = tempfile::tempdir().unwrap();
    for (rel, content) in files {
        write(dir.path(), rel, content);
    }
    dir
}

const GITIGNORE: (&str, &str) = (".gitignore", "target/\n.env\n");

#[test]
fn structure_passes_when_all_declared_files_exist() {
    let dir = project(&[
        (".autarch.yaml", "files:\n  - src/main.rs\n  - src/\n"),
        ("src/main.rs", "fn main() {}\n"),
    ]);
    let r = structure::run(dir.path()).unwrap();
    assert_eq!(r.status, GateStatus::Pass);
    assert_eq!(r.details, "2/2 files present");
}

#[test]
fn structure_fails_on_missing_file_and_wrong_kind() {
    let dir = project(&[
        (".autarch.yaml", "files:\n  - src/main.rs\n  - missing.rs\n  - src/main.rs/\n"),
        ("src/main.rs", "fn main() {}\n"),
    ]);
    let r = structure::run(dir.path()).unwrap();
    assert_eq!(r.status, GateStatus::Fail);
    assert_eq!(r.details, "1/3 files present");
    assert_eq!(r.violations.len(), 2);
}

#[test]
fn structure_rejects_traversal_and_absolute_paths() {
    let dir = project(&[(".autarch.yaml", "files:\n  - ../outside\n  - /etc/passwd\n")]);
    let r = structure::run(dir.path()).unwrap();
    assert_eq!(r.status, GateStatus::Fail);
    assert!(r.violations.iter().all(|v| v.message.contains("unsafe")));
}

#[test]
fn structure_fails_without_manifest_or_files() {
    let dir = project(&[("a.rs", "")]);
    assert_eq!(structure::run(dir.path()).unwrap().status, GateStatus::Fail);
    let dir = project(&[(".autarch.yaml", "project: x\n")]);
    assert_eq!(structure::run(dir.path()).unwrap().status, GateStatus::Fail);
}

#[test]
fn completeness_flags_markers_with_locations() {
    let dir = project(&[
        ("src/a.rs", "fn a() {\n    // TODO wire this\n    todo!()\n}\n"),
        ("src/b.ts", "// ...rest follows\nconst x = 1; // fixme\n"),
        ("src/clean.rs", "fn ok() {}\n"),
    ]);
    let r = completeness::run(dir.path()).unwrap();
    assert_eq!(r.status, GateStatus::Fail);
    let hits: Vec<_> = r.violations.iter().map(|v| (v.file.as_str(), v.line.unwrap())).collect();
    assert!(hits.contains(&("src/a.rs", 2)));
    assert!(hits.contains(&("src/a.rs", 3)));
    assert!(hits.contains(&("src/b.ts", 1)));
    assert!(hits.contains(&("src/b.ts", 2)));
    assert!(hits.iter().all(|(f, _)| *f != "src/clean.rs"));
}

#[test]
fn completeness_ignores_word_fragments_and_placeholder_api_use() {
    let dir = project(&[
        ("a.svelte", "<input placeholder=\"Name\" />\n<style>input::placeholder { color: red }</style>\n"),
        ("b.ts", "const o = { placeholder: 'x' };\nel.placeholder = 'y';\nconst mastodon = 1;\n"),
    ]);
    let r = completeness::run(dir.path()).unwrap();
    assert_eq!(r.status, GateStatus::Pass, "{:?}", r.violations);
}

#[test]
fn completeness_flags_placeholder_prose_and_honors_suppressions() {
    let dir = project(&[
        ("a.md", "this section is a placeholder\n"),
        ("b.rs", "// FIXME later crucible:allow(completeness)\n"),
        ("c.rs", "// crucible:allow-file(completeness)\n// TBD\n"),
    ]);
    let r = completeness::run(dir.path()).unwrap();
    assert_eq!(r.violations.len(), 1);
    assert_eq!(r.violations[0].file, "a.md");
    assert!(r.details.contains("2 suppressed"));
}

#[test]
fn completeness_skips_build_and_dependency_dirs() {
    let dir = project(&[
        ("target/gen.rs", "// TODO\n"),
        ("node_modules/pkg/index.js", "// FIXME\n"),
        ("src/ok.rs", "fn ok() {}\n"),
    ]);
    assert_eq!(completeness::run(dir.path()).unwrap().status, GateStatus::Pass);
}

#[test]
fn security_flags_secrets_without_echoing_values() {
    let dir = project(&[
        GITIGNORE,
        ("a.rs", "const KEY: &str = \"AKIAIOSFODNN7EXAMPLE\";\n"),
        ("b.ts", "const cfg = { apiKey: \"sk_live_abcdef123456\" };\n"),
        ("c.toml", "password = \"hunter2hunter2\"\n"),
        ("d.rs", "// -----BEGIN RSA PRIVATE KEY-----\n"),
    ]);
    let r = security::run(dir.path()).unwrap();
    assert_eq!(r.status, GateStatus::Fail);
    assert_eq!(r.violations.len(), 4);
    for v in &r.violations {
        assert!(!v.message.contains("AKIA") && !v.message.contains("hunter2") && !v.message.contains("sk_live"));
    }
}

#[test]
fn security_allows_env_references_and_short_values() {
    let dir = project(&[
        GITIGNORE,
        ("a.ts", "const t = { token: \"${API_TOKEN}\", password: \"short\" };\n"),
        ("b.toml", "api_key = \"$API_KEY\"\n"),
    ]);
    let r = security::run(dir.path()).unwrap();
    assert_eq!(r.status, GateStatus::Pass, "{:?}", r.violations);
}

#[test]
fn security_enforces_https_but_allows_loopback() {
    let dir = project(&[
        GITIGNORE,
        ("a.ts", "fetch('http://api.vendor.com/v1');\nfetch('http://localhost:3000');\nfetch('http://127.0.0.1:8080/x');\n"),
        ("b.svg.html", "<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>\n"),
    ]);
    let r = security::run(dir.path()).unwrap();
    assert_eq!(r.status, GateStatus::Fail);
    assert_eq!(r.violations.len(), 1);
    assert_eq!(r.violations[0].line, Some(1));
}

#[test]
fn security_env_handling() {
    let tracked = project(&[(".env", "X=1\n"), ("a.rs", "")]);
    let r = security::run(tracked.path()).unwrap();
    assert_eq!(r.status, GateStatus::Fail);

    let ignored = project(&[GITIGNORE, (".env", "TOKEN=abcdefghijkl\n")]);
    assert_eq!(security::run(ignored.path()).unwrap().status, GateStatus::Pass);

    let no_rule = project(&[("a.rs", "")]);
    assert_eq!(security::run(no_rule.path()).unwrap().status, GateStatus::Warn);
}

#[test]
fn gate_names_parse_by_name_and_number() {
    assert_eq!("security".parse::<GateName>().unwrap(), GateName::Security);
    assert_eq!("9".parse::<GateName>().unwrap(), GateName::Philosophy);
    assert!("10".parse::<GateName>().is_err());
}
