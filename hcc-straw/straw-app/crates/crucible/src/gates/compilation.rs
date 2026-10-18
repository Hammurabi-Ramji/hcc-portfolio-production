//! Gate 6: Compilation. BSM-CODE: gate.compilation()
//!
//! The build command must exit 0. Rust projects run
//! `cargo build --workspace --locked --offline`; Node projects with a `build`
//! script run it through the package manager their lockfile names. A project
//! declaring Trunk.toml must also build its frontend through Trunk. A project
//! with no build surface FAILS: an unbuildable tree cannot be certified.

use std::path::Path;

use crate::exec::tail;
use crate::gates::Context;
use crate::{CrucibleError, GateName, GateResult, GateStatus, Violation};

fn node_build_command(root: &Path) -> Option<(&'static str, Vec<&'static str>)> {
    let manifest = std::fs::read_to_string(root.join("package.json")).ok()?;
    let doc: serde_json::Value = serde_json::from_str(&manifest).ok()?;
    doc.get("scripts")?.get("build")?;
    if root.join("pnpm-lock.yaml").is_file() {
        Some(("pnpm", vec!["build"]))
    } else if root.join("package-lock.json").is_file() {
        Some(("npm", vec!["run", "build"]))
    } else {
        None
    }
}

pub fn run(root: &Path, ctx: &Context) -> Result<GateResult, CrucibleError> {
    let mut commands: Vec<(&str, Vec<&str>)> = Vec::new();
    if root.join("Cargo.toml").is_file() {
        commands.push(("cargo", vec!["build", "--workspace", "--locked", "--offline"]));
    }
    if let Some(node) = node_build_command(root) {
        commands.push(node);
    }
    if root.join("Trunk.toml").is_file() {
        commands.push(("trunk", vec!["build", "--locked=true", "--offline=true"]));
    }

    let mut violations = Vec::new();
    for (program, args) in &commands {
        let line = format!("{program} {}", args.join(" "));
        let message = match ctx.runner.run(root, program, args) {
            Ok(out) if out.success => continue,
            Ok(out) => {
                let detail = tail(&out, 3);
                let hint = if detail.contains("Access is denied") {
                    " (if crucible itself lives in this target directory, run a copy of the binary)"
                } else {
                    ""
                };
                format!("`{line}` failed: {detail}{hint}")
            }
            Err(e) => format!("`{line}` could not run: {e}"),
        };
        violations.push(Violation { file: ".".into(), line: None, message });
    }

    let (status, details) = if commands.is_empty() {
        violations.push(Violation { file: ".".into(), line: None, message: "no Cargo.toml, Trunk.toml, or buildable package.json".into() });
        (GateStatus::Fail, "no build command found".to_owned())
    } else if violations.is_empty() {
        (GateStatus::Pass, format!("{} build command(s) exited 0", commands.len()))
    } else {
        (GateStatus::Fail, format!("{} of {} build command(s) failed", violations.len(), commands.len()))
    };
    Ok(GateResult { gate: GateName::Compilation, status, details, violations })
}
