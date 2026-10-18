//! Gate 8: Lint. BSM-CODE: gate.lint()
//!
//! Zero errors. Rust runs `cargo clippy` and counts diagnostics; warnings are
//! reported in the details but do not block. A `biome.json` adds
//! `biome check`. A project with no linter configuration FAILS: nothing
//! enforced is nothing verified.

use std::path::Path;
use std::sync::LazyLock;

use regex::Regex;

use crate::exec::tail;
use crate::gates::Context;
use crate::{CrucibleError, GateName, GateResult, GateStatus, Violation};

// Short-format diagnostics look like `path:line:col: warning: message`.
static DIAGNOSTIC: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^(.*?):(\d+):\d+: (warning|error)(?:\[[^\]]*\])?: (.*)$").expect("static regex"));

pub struct Counts {
    pub errors: Vec<Violation>,
    pub warnings: usize,
}

pub fn parse_clippy(output: &str) -> Counts {
    let mut counts = Counts { errors: Vec::new(), warnings: 0 };
    for line in output.lines() {
        let Some(c) = DIAGNOSTIC.captures(line.trim()) else { continue };
        if &c[3] == "warning" {
            counts.warnings += 1;
        } else {
            counts.errors.push(Violation {
                file: c[1].replace('\\', "/"),
                line: c[2].parse().ok(),
                message: c[4].to_owned(),
            });
        }
    }
    counts
}

pub fn run(root: &Path, ctx: &Context) -> Result<GateResult, CrucibleError> {
    let mut violations = Vec::new();
    let mut warnings = 0usize;
    let mut linters = 0usize;

    if root.join("Cargo.toml").is_file() {
        linters += 1;
        let args = ["clippy", "--workspace", "--all-targets", "--locked", "--offline", "--message-format=short"];
        match ctx.runner.run(root, "cargo", &args) {
            Ok(out) => {
                let counts = parse_clippy(&format!("{}\n{}", out.stderr, out.stdout));
                warnings += counts.warnings;
                let found = !counts.errors.is_empty();
                violations.extend(counts.errors);
                if !out.success && !found {
                    violations.push(Violation {
                        file: ".".into(),
                        line: None,
                        message: format!("`cargo clippy` failed: {}", tail(&out, 3)),
                    });
                }
            }
            Err(e) => violations.push(Violation { file: ".".into(), line: None, message: e }),
        }
    }

    if root.join("biome.json").is_file() {
        linters += 1;
        match ctx.runner.run(root, "biome", &["check", "."]) {
            Ok(out) if out.success => {}
            Ok(out) => violations.push(Violation {
                file: "biome.json".into(),
                line: None,
                message: format!("`biome check` failed: {}", tail(&out, 3)),
            }),
            Err(e) => violations.push(Violation { file: "biome.json".into(), line: None, message: e }),
        }
    }

    if linters == 0 {
        return Ok(GateResult {
            gate: GateName::Lint,
            status: GateStatus::Fail,
            details: "no linter configured".into(),
            violations: vec![Violation { file: ".".into(), line: None, message: "no Cargo.toml or biome.json".into() }],
        });
    }
    let status = if violations.is_empty() { GateStatus::Pass } else { GateStatus::Fail };
    Ok(GateResult {
        gate: GateName::Lint,
        status,
        details: format!("{} error(s), {warnings} warning(s)", violations.len()),
        violations,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_short_format_diagnostics() {
        let out = "crates\\a\\src\\lib.rs:10:5: warning: unused variable: `x`\n\
                   src/b.rs:3:1: error[E0425]: cannot find value `y`\n\
                   warning: `a` (lib) generated 1 warning\n\
                   error: could not compile `b` (lib) due to 1 previous error\n";
        let c = parse_clippy(out);
        assert_eq!(c.warnings, 1);
        assert_eq!(c.errors.len(), 1);
        assert_eq!(c.errors[0].file, "src/b.rs");
        assert_eq!(c.errors[0].line, Some(3));
    }
}
