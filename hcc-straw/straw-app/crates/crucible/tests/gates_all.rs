// crucible:allow-file(completeness)
// crucible:allow-file(security)
// crucible:allow-file(portability)
//! Gates 4-9 and the nine-gate composite. External tools are scripted, so
//! these tests never start cargo, biome or pnpm.

use std::fs;
use std::path::Path;

use crucible::exec::{Output, ScriptedRunner};
use crucible::gates::{
    self, compilation, lint, philosophy, portability, reproducibility, tests, Context,
};
use crucible::{composite_status, CompositeStatus, GateStatus};
use tempfile::TempDir;

fn project(files: &[(&str, &str)]) -> TempDir {
    let dir = tempfile::tempdir().unwrap();
    for (rel, content) in files {
        let path: &Path = &dir.path().join(rel);
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(path, content).unwrap();
    }
    dir
}

fn ctx(runner: &ScriptedRunner) -> Context<'_> {
    Context { runner, coverage_threshold: 85.0 }
}

const CLEAN_CARGO: &str = "[package]\nname = \"demo\"\nversion = \"0.1.0\"\n\n[dependencies]\nserde = \"=1.0.0\"\n";

/// A tree that passes every gate when the scripted tools succeed.
fn certifiable() -> TempDir {
    project(&[
        (".gitignore", "target/\n.env\n"),
        (".autarch.yaml", "files:\n  - src/main.rs\n"),
        ("src/main.rs", "fn main() {}\n"),
        ("Cargo.toml", CLEAN_CARGO),
        ("Cargo.lock", "# lock\n"),
        ("README.md", "# demo\n\nKeep the faith, the good exists.\n"),
    ])
}

fn green() -> ScriptedRunner {
    ScriptedRunner::new()
        .ok("cargo build", "")
        .ok("cargo llvm-cov --version", "cargo-llvm-cov 0.8")
        .ok(
            "cargo llvm-cov --workspace",
            "TOTAL 10 1 90.00% 5 0 100.00% 100 5 95.00% 0 0 -\ntest result: ok. 4 passed; 0 failed\n",
        )
        .ok("cargo clippy", "")
}

#[test]
fn a_clean_tree_with_green_tools_is_sovereign_certified() {
    let dir = certifiable();
    let runner = green();
    let results = gates::run_all(dir.path(), &ctx(&runner)).unwrap();
    assert_eq!(results.len(), 9);
    for r in &results {
        assert_eq!(r.status, GateStatus::Pass, "{}: {} {:?}", r.gate, r.details, r.violations);
    }
    assert_eq!(composite_status(&results), CompositeStatus::SovereignCertified);
}

#[test]
fn failure_dominates_composite_status() {
    let dir = project(&[(".gitignore", ".env\n"), (".autarch.yaml", "files:\n  - nope.rs\n")]);
    let runner = green();
    let results = gates::run_all(dir.path(), &ctx(&runner)).unwrap();
    assert_eq!(composite_status(&results), CompositeStatus::Blocked);
}

#[test]
fn non_directory_root_is_an_error() {
    let dir = project(&[("f.txt", "x")]);
    let runner = green();
    assert!(gates::run_all(&dir.path().join("f.txt"), &ctx(&runner)).is_err());
}

// Gate 4

#[test]
fn reproducibility_requires_a_lockfile_and_rejects_floating_ranges() {
    let dir = project(&[(
        "Cargo.toml",
        "[package]\nname=\"d\"\nversion=\"0.1.0\"\n[dependencies]\nserde = \"^1.0\"\nrand = { git = \"https://example.com/r\" }\n",
    )]);
    let r = reproducibility::run(dir.path()).unwrap();
    assert_eq!(r.status, GateStatus::Fail);
    let text: Vec<_> = r.violations.iter().map(|v| v.message.as_str()).collect();
    assert!(text.iter().any(|m| m.contains("no Cargo.lock")));
    assert!(text.iter().any(|m| m.contains("'serde'") && m.contains("floating")));
    assert!(text.iter().any(|m| m.contains("'rand'") && m.contains("rev")));
}

#[test]
fn reproducibility_warns_on_lockfile_only_pins_and_passes_on_exact() {
    let bare = project(&[
        ("Cargo.toml", "[package]\nname=\"d\"\nversion=\"0.1.0\"\n[dependencies]\nserde = \"1\"\n"),
        ("Cargo.lock", ""),
    ]);
    assert_eq!(reproducibility::run(bare.path()).unwrap().status, GateStatus::Warn);

    let exact = project(&[
        (
            "Cargo.toml",
            "[workspace]\nmembers=[]\n[workspace.dependencies]\nserde = { version = \"=1.0.0\" }\nlocal = { path = \"x\" }\n",
        ),
        ("Cargo.lock", ""),
    ]);
    assert_eq!(reproducibility::run(exact.path()).unwrap().status, GateStatus::Pass);
}

#[test]
fn reproducibility_checks_package_json() {
    let dir = project(&[("package.json", "{\"dependencies\":{\"a\":\"^1.0.0\",\"b\":\"2.0.0\"}}")]);
    let r = reproducibility::run(dir.path()).unwrap();
    assert_eq!(r.status, GateStatus::Fail);
    assert_eq!(r.violations.len(), 2, "missing lockfile plus one floating dependency");

    let ok = project(&[("package.json", "{\"dependencies\":{\"b\":\"2.0.0\"}}"), ("pnpm-lock.yaml", "")]);
    assert_eq!(reproducibility::run(ok.path()).unwrap().status, GateStatus::Pass);
}

#[test]
fn reproducibility_fails_when_there_is_nothing_to_verify() {
    let dir = project(&[("a.txt", "x")]);
    assert_eq!(reproducibility::run(dir.path()).unwrap().status, GateStatus::Fail);
}

// Gate 5

#[test]
fn portability_flags_os_paths_and_honors_suppression() {
    let dir = project(&[
        ("a.rs", "let p = \"C:\\\\Users\\\\me\";\n"),
        ("b.ts", "const h = '/home/me/x';\nconst ok = 'https://x.com/home/page';\n"),
        ("c.rs", "let t = \"/etc/hosts\"; // crucible:allow(portability)\n"),
        ("d.md", "docs may mention /usr/bin freely\n"),
    ]);
    let r = portability::run(dir.path()).unwrap();
    assert_eq!(r.status, GateStatus::Fail);
    let hits: Vec<_> = r.violations.iter().map(|v| (v.file.as_str(), v.line.unwrap())).collect();
    assert_eq!(hits, vec![("a.rs", 1), ("b.ts", 1)]);
    assert!(r.details.contains("1 suppressed"));
}

// Gate 6

#[test]
fn compilation_follows_the_build_exit_code() {
    let dir = project(&[("Cargo.toml", CLEAN_CARGO)]);
    let good = ScriptedRunner::new().ok("cargo build", "");
    assert_eq!(compilation::run(dir.path(), &ctx(&good)).unwrap().status, GateStatus::Pass);
    assert_eq!(good.calls(), vec!["cargo build --workspace --locked --offline"]);

    let bad = ScriptedRunner::new().fail("cargo build", "error[E0425]: cannot find value\nerror: could not compile `d`");
    let r = compilation::run(dir.path(), &ctx(&bad)).unwrap();
    assert_eq!(r.status, GateStatus::Fail);
    assert!(r.violations[0].message.contains("could not compile"));

    let missing = ScriptedRunner::new().on("cargo build", Err("cannot start 'cargo'".into()));
    assert_eq!(compilation::run(dir.path(), &ctx(&missing)).unwrap().status, GateStatus::Fail);
}

#[test]
fn compilation_fails_without_anything_to_build() {
    let dir = project(&[("a.txt", "x")]);
    let none = ScriptedRunner::new();
    assert_eq!(compilation::run(dir.path(), &ctx(&none)).unwrap().status, GateStatus::Fail);
    assert!(none.calls().is_empty());
}

#[test]
fn compilation_runs_the_node_build_the_lockfile_names() {
    let dir = project(&[("package.json", "{\"scripts\":{\"build\":\"x\"}}"), ("pnpm-lock.yaml", "")]);
    let runner = ScriptedRunner::new().ok("pnpm build", "");
    assert_eq!(compilation::run(dir.path(), &ctx(&runner)).unwrap().status, GateStatus::Pass);
    assert_eq!(runner.calls(), vec!["pnpm build"]);
}

// Gate 7

#[test]
fn successful_rust_build_cannot_hide_a_failed_trunk_frontend() {
    let dir = project(&[("Cargo.toml", CLEAN_CARGO), ("Trunk.toml", "[build]\ntarget = 'index.html'\n")]);
    let broken = ScriptedRunner::new().ok("cargo build", "Rust compiled")
        .fail("trunk build", "Svelte frontend compilation failed");
    let report = compilation::run(dir.path(), &ctx(&broken)).unwrap();
    assert_eq!(report.status, GateStatus::Fail);
    assert!(report.violations[0].message.contains("Svelte frontend compilation failed"));
    let complete = ScriptedRunner::new().ok("cargo build", "Rust compiled").ok("trunk build", "Frontend compiled");
    assert_eq!(compilation::run(dir.path(), &ctx(&complete)).unwrap().status, GateStatus::Pass);
    assert_eq!(complete.calls().len(), 2);
}

#[test]
fn tests_gate_measures_coverage_when_the_tool_exists() {
    let dir = project(&[("Cargo.toml", CLEAN_CARGO)]);
    let run = |pct: &str| {
        let out = format!("TOTAL 1 0 100.00% 1 0 100.00% 100 5 {pct}% 0 0 -\ntest result: ok. 7 passed; 0 failed\n");
        let runner = ScriptedRunner::new().ok("cargo llvm-cov --version", "v").ok("cargo llvm-cov --workspace", &out);
        tests::run(dir.path(), &ctx(&runner)).unwrap()
    };
    let pass = run("90.00");
    assert_eq!(pass.status, GateStatus::Pass);
    assert!(pass.details.contains("7 passed") && pass.details.contains("90.0%"));
    assert_eq!(run("70.00").status, GateStatus::Warn);
}

#[test]
fn tests_gate_never_invents_coverage() {
    let dir = project(&[("Cargo.toml", CLEAN_CARGO)]);
    let runner = ScriptedRunner::new()
        .on("cargo llvm-cov --version", Err("cannot start".into()))
        .ok("cargo test", "test result: ok. 5 passed; 0 failed\n");
    let r = tests::run(dir.path(), &ctx(&runner)).unwrap();
    assert_eq!(r.status, GateStatus::Warn);
    assert!(r.details.contains("coverage not measured"));
}

#[test]
fn tests_gate_fails_on_any_failing_test() {
    let dir = project(&[("Cargo.toml", CLEAN_CARGO)]);
    let runner = ScriptedRunner::new().on("cargo llvm-cov --version", Err("cannot start".into())).on(
        "cargo test",
        Ok(Output {
            success: false,
            stdout: "test result: FAILED. 4 passed; 1 failed\n".into(),
            stderr: "error: test failed".into(),
        }),
    );
    let r = tests::run(dir.path(), &ctx(&runner)).unwrap();
    assert_eq!(r.status, GateStatus::Fail);
    assert_eq!(r.details, "4 passed, 1 failed");
}

// Gate 8

#[test]
fn lint_fails_only_on_errors_and_reports_warnings() {
    let dir = project(&[("Cargo.toml", CLEAN_CARGO)]);
    let warn_only = ScriptedRunner::new().ok("cargo clippy", "src/a.rs:1:1: warning: unused\nwarning: `d` generated 1 warning\n");
    let r = lint::run(dir.path(), &ctx(&warn_only)).unwrap();
    assert_eq!(r.status, GateStatus::Pass);
    assert_eq!(r.details, "0 error(s), 1 warning(s)");

    let errored = ScriptedRunner::new().fail("cargo clippy", "src/a.rs:4:2: error: bad thing\n");
    let r = lint::run(dir.path(), &ctx(&errored)).unwrap();
    assert_eq!(r.status, GateStatus::Fail);
    assert_eq!((r.violations[0].file.as_str(), r.violations[0].line), ("src/a.rs", Some(4)));

    let broken = ScriptedRunner::new().fail("cargo clippy", "error: could not compile\n");
    assert_eq!(lint::run(dir.path(), &ctx(&broken)).unwrap().status, GateStatus::Fail);
}

#[test]
fn lint_runs_biome_when_configured_and_fails_with_no_linter() {
    let dir = project(&[("biome.json", "{}")]);
    let ok = ScriptedRunner::new().ok("biome check", "");
    assert_eq!(lint::run(dir.path(), &ctx(&ok)).unwrap().status, GateStatus::Pass);
    let missing = ScriptedRunner::new().on("biome check", Err("cannot start 'biome'".into()));
    assert_eq!(lint::run(dir.path(), &ctx(&missing)).unwrap().status, GateStatus::Fail);

    let bare = project(&[("a.txt", "x")]);
    assert_eq!(lint::run(bare.path(), &ctx(&ok)).unwrap().status, GateStatus::Fail);
}

// Gate 9

#[test]
fn philosophy_catches_transitive_telemetry_in_lockfiles() {
    let dir = project(&[
        (
            "Cargo.lock",
            "[[package]]\nname = \"serde\"\nversion = \"1.0.0\"\n\n[[package]]\nname = \"sentry-core\"\nversion = \"0.3.0\"\n",
        ),
        ("package.json", "{\"dependencies\":{\"posthog-js\":\"1.0.0\",\"left-pad\":\"1.0.0\"}}"),
        ("README.md", "BSM-C"),
    ]);
    let r = philosophy::run(dir.path()).unwrap();
    assert_eq!(r.status, GateStatus::Fail);
    let msgs: Vec<_> = r.violations.iter().map(|v| v.message.clone()).collect();
    assert!(msgs.iter().any(|m| m.contains("sentry-core")));
    assert!(msgs.iter().any(|m| m.contains("posthog-js")));
    assert!(!msgs.iter().any(|m| m.contains("serde") || m.contains("left-pad")));
}

#[test]
fn philosophy_warns_when_the_declaration_is_missing() {
    let dir = project(&[("README.md", "# nothing relevant\n")]);
    assert_eq!(philosophy::run(dir.path()).unwrap().status, GateStatus::Warn);
    let none = project(&[("a.txt", "x")]);
    assert_eq!(philosophy::run(none.path()).unwrap().status, GateStatus::Warn);
}

#[test]
fn gitignored_build_output_directories_are_not_scanned() {
    let dir = project(&[
        (".gitignore", "/gen/\ncache/\n"),
        ("gen/out.js", "// TODO generated\n"),
        ("a/cache/x.js", "// TODO generated\n"),
        ("src/real.rs", "// TODO real\n"),
    ]);
    let r = crucible::gates::completeness::run(dir.path()).unwrap();
    let files: Vec<_> = r.violations.iter().map(|v| v.file.as_str()).collect();
    assert_eq!(files, vec!["src/real.rs"]);
}
