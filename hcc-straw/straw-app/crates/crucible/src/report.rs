//! Terminal and JSON reports. BSM-CODE: gate.report.terminal(), gate.report.json()

use serde::Serialize;

use crate::{composite_status, CompositeStatus, GateResult, GateStatus};

const MAX_LISTED_PER_GATE: usize = 20;

#[derive(Serialize)]
struct JsonReport<'a> {
    result: CompositeStatus,
    gates: &'a [GateResult],
}

pub fn render_json(results: &[GateResult]) -> String {
    let report = JsonReport {
        result: composite_status(results),
        gates: results,
    };
    serde_json::to_string_pretty(&report).expect("report serializes to JSON")
}

pub fn result_line(results: &[GateResult]) -> String {
    let count = |s: GateStatus| results.iter().filter(|r| r.status == s).count();
    let (fail, warn, skip) = (
        count(GateStatus::Fail),
        count(GateStatus::Warn),
        count(GateStatus::Skipped),
    );
    let status = composite_status(results);
    match status {
        CompositeStatus::Blocked => {
            format!("RESULT: {status} - {fail} gate(s) failed, {warn} warning(s)")
        }
        CompositeStatus::Incomplete => format!(
            "RESULT: {status} - {}/{} gates ran, {skip} skipped, {warn} warning(s)",
            results.len() - skip,
            crate::GateName::ALL.len()
        ),
        CompositeStatus::PassWithWarnings => format!("RESULT: {status} - {warn} warning(s)"),
        CompositeStatus::SovereignCertified => format!("RESULT: {status}"),
    }
}

pub fn render_table(results: &[GateResult]) -> String {
    let name_w = results
        .iter()
        .map(|r| r.gate.as_str().len())
        .max()
        .unwrap_or(4)
        .max(4)
        + 5;
    let det_w = results
        .iter()
        .map(|r| r.details.len())
        .max()
        .unwrap_or(7)
        .max(7);
    let rule = format!(
        "+{}+{}+{}+",
        "-".repeat(name_w + 2),
        "-".repeat(8),
        "-".repeat(det_w + 2)
    );

    let mut out = String::new();
    out.push_str(&rule);
    out.push('\n');
    out.push_str(&format!(
        "| {:<name_w$} | {:<6} | {:<det_w$} |\n",
        "Gate", "Status", "Details"
    ));
    out.push_str(&rule);
    out.push('\n');
    for r in results {
        let label = format!("{} {}", r.gate.number(), r.gate.as_str());
        out.push_str(&format!(
            "| {:<name_w$} | {:<6} | {:<det_w$} |\n",
            label,
            r.status.to_string(),
            r.details
        ));
    }
    out.push_str(&rule);
    out.push('\n');

    for r in results.iter().filter(|r| !r.violations.is_empty()) {
        out.push_str(&format!("\n{} ({}):\n", r.gate.as_str(), r.gate.bsm_code()));
        for v in r.violations.iter().take(MAX_LISTED_PER_GATE) {
            match v.line {
                Some(line) => out.push_str(&format!("  {}:{line}  {}\n", v.file, v.message)),
                None => out.push_str(&format!("  {}  {}\n", v.file, v.message)),
            }
        }
        if r.violations.len() > MAX_LISTED_PER_GATE {
            out.push_str(&format!(
                "  ... and {} more (use --format json)\n",
                r.violations.len() - MAX_LISTED_PER_GATE
            ));
        }
    }

    out.push('\n');
    out.push_str(&result_line(results));
    out.push('\n');
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{GateName, Violation};

    fn results(status: GateStatus) -> Vec<GateResult> {
        GateName::ALL
            .into_iter()
            .map(|gate| GateResult {
                gate,
                status,
                details: "reviewed input".into(),
                violations: vec![],
            })
            .collect()
    }

    #[test]
    fn reports_distinguish_failed_warned_skipped_and_certified_runs() {
        for (status, label) in [
            (GateStatus::Pass, "SOVEREIGN CERTIFIED"),
            (GateStatus::Warn, "9 warning(s)"),
            (GateStatus::Fail, "9 gate(s) failed"),
            (GateStatus::Skipped, "0/9 gates ran, 9 skipped"),
        ] {
            let results = results(status);
            let table = render_table(&results);
            assert!(table.contains(label), "{table}");
            assert!(table.contains("9 philosophy"));
            assert!(table.contains(&status.to_string()));
            let json: serde_json::Value = serde_json::from_str(&render_json(&results)).unwrap();
            assert_eq!(json["gates"].as_array().unwrap().len(), 9);
            assert_eq!(
                json["result"],
                serde_json::to_value(composite_status(&results)).unwrap()
            );
        }
        let table = render_table(&[]);
        assert!(table.contains("0/9 gates ran"));
        assert!(table.contains("Gate") && table.contains("Details"));
    }

    #[test]
    fn terminal_bounds_violation_lists_while_json_retains_every_location() {
        let mut results = results(GateStatus::Pass);
        results[0].status = GateStatus::Fail;
        results[0].violations = (0..23)
            .map(|i| Violation {
                file: format!("src/f{i}.rs"),
                line: (i % 2 == 0).then_some(i + 1),
                message: format!("issue {i}"),
            })
            .collect();
        let table = render_table(&results);
        assert!(table.contains("structure (gate.structure()):"));
        assert!(table.contains("src/f0.rs:1  issue 0"));
        assert!(table.contains("src/f1.rs  issue 1"));
        assert!(table.contains("... and 3 more (use --format json)"));
        assert!(!table.contains("issue 20"));
        let json: serde_json::Value = serde_json::from_str(&render_json(&results)).unwrap();
        assert_eq!(json["gates"][0]["violations"].as_array().unwrap().len(), 23);
        assert_eq!(json["gates"][0]["violations"][22]["line"], 23);
    }
}
