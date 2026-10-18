//! Gate 7: Tests. BSM-CODE: gate.tests()
//!
//! All tests must pass. With `cargo-llvm-cov` installed, line coverage is
//! measured and compared with the threshold (below it: WARN). Without it the
//! tests still run, and the gate WARNs that coverage was not measured; it never
//! reports a coverage number it did not observe.

use std::path::Path;

use crate::exec::tail;
use crate::gates::Context;
use crate::{CrucibleError, GateName, GateResult, GateStatus, Violation};

/// Sums `test result: ... N passed; M failed` lines from `cargo test` output.
pub fn count_tests(output: &str) -> (u64, u64) {
    let mut passed = 0;
    let mut failed = 0;
    for line in output.lines().filter(|l| l.trim_start().starts_with("test result:")) {
        let number_before = |word: &str| {
            line.split(';')
                .find(|part| part.contains(word))
                .and_then(|part| part.split_whitespace().rev().nth(1))
                .and_then(|n| n.parse::<u64>().ok())
        };
        passed += number_before("passed").unwrap_or(0);
        failed += number_before("failed").unwrap_or(0);
    }
    (passed, failed)
}

/// Line coverage percent from the `TOTAL` row of `cargo llvm-cov --summary-only`.
pub fn parse_line_coverage(output: &str) -> Option<f64> {
    let total = output.lines().find(|l| l.trim_start().starts_with("TOTAL"))?;
    let percents: Vec<f64> = total
        .split_whitespace()
        .filter_map(|t| t.strip_suffix('%'))
        .filter_map(|t| t.parse().ok())
        .collect();
    // Columns: region cover, function cover, line cover, ...
    percents.get(2).copied()
}

fn single(gate_status: GateStatus, details: String, message: Option<String>) -> GateResult {
    GateResult {
        gate: GateName::Tests,
        status: gate_status,
        details,
        violations: message
            .into_iter()
            .map(|message| Violation { file: ".".into(), line: None, message })
            .collect(),
    }
}

pub fn run(root: &Path, ctx: &Context) -> Result<GateResult, CrucibleError> {
    if !root.join("Cargo.toml").is_file() {
        return Ok(single(GateStatus::Fail, "no test runner found".into(), Some("no Cargo.toml".into())));
    }

    let coverage_available =
        ctx.runner.run(root, "cargo", &["llvm-cov", "--version"]).is_ok_and(|o| o.success);
    let args: Vec<&str> = if coverage_available {
        vec!["llvm-cov", "--workspace", "--locked", "--offline", "--summary-only"]
    } else {
        vec!["test", "--workspace", "--locked", "--offline"]
    };

    let out = match ctx.runner.run(root, "cargo", &args) {
        Ok(out) => out,
        Err(e) => return Ok(single(GateStatus::Fail, "test runner could not start".into(), Some(e))),
    };
    let (passed, failed) = count_tests(&format!("{}\n{}", out.stdout, out.stderr));
    if !out.success || failed > 0 {
        return Ok(single(
            GateStatus::Fail,
            format!("{passed} passed, {failed} failed"),
            Some(format!("`cargo {}` failed: {}", args.join(" "), tail(&out, 3))),
        ));
    }

    if !coverage_available {
        return Ok(single(
            GateStatus::Warn,
            format!("{passed} passed; coverage not measured"),
            Some("install cargo-llvm-cov to measure coverage".into()),
        ));
    }
    match parse_line_coverage(&out.stdout) {
        Some(pct) if pct >= ctx.coverage_threshold => Ok(single(
            GateStatus::Pass,
            format!("{passed} passed; line coverage {pct:.1}% (target {:.0}%)", ctx.coverage_threshold),
            None,
        )),
        Some(pct) => Ok(single(
            GateStatus::Warn,
            format!("{passed} passed; line coverage {pct:.1}% (target {:.0}%)", ctx.coverage_threshold),
            Some(format!("coverage {pct:.1}% is below the {:.0}% target", ctx.coverage_threshold)),
        )),
        None => Ok(single(
            GateStatus::Warn,
            format!("{passed} passed; coverage report unreadable"),
            Some("no TOTAL row in the cargo-llvm-cov summary".into()),
        )),
    }
}

#[cfg(test)]
mod parsing {
    use super::*;

    #[test]
    fn counts_across_test_binaries() {
        let out = "test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured\n\
                   test result: FAILED. 3 passed; 2 failed; 0 ignored\n\
                   unrelated line\n";
        assert_eq!(count_tests(out), (15, 2));
    }

    #[test]
    fn reads_line_coverage_from_total_row() {
        let out = "Filename Regions Missed Cover Functions Missed Executed Lines Missed Cover\n\
                   TOTAL 100 20 80.00% 10 1 90.00% 200 30 85.50% 0 0 -\n";
        assert_eq!(parse_line_coverage(out), Some(85.5));
        assert_eq!(parse_line_coverage("no totals here"), None);
    }
}
