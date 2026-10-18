//! A test process for supervisor framing and lifecycle, with no model or network.
use std::io::{self, BufRead, Write};
fn main() {
    let mode = std::env::args().nth(2).unwrap_or_default();
    // The supervisor must not forward the parent's PATH to an inference worker.
    if std::env::var_os("PATH").is_some() {
        return;
    }
    let mut phase = "loaded";
    for line in io::stdin().lock().lines() {
        let line = line.unwrap();
        let status = |phase: &str| {
            format!(
                r#"{{"kind":"status","value":{{"phase":"{phase}","model":"fixture","contextTokens":8,"device":"cpu"}}}}"#
            )
        };
        let response = if mode == "exit" {
            return;
        } else if mode == "slow" {
            std::thread::sleep(std::time::Duration::from_secs(30));
            return;
        } else if mode == "malformed" {
            "invalid JSON".into()
        } else if mode == "oversize" {
            "x".repeat(4 * 1024 * 1024 + 1)
        } else if line.contains(r#""command":"generate""#) {
            match mode.as_str() {
                "error" => r#"{"kind":"error","value":"fixture refusal"}"#.into(),
                "wrong" => status(phase),
                _ => r#"{"kind":"text","value":"synthetic response"}"#.into(),
            }
        } else if line.contains(r#""command":"warm""#) {
            phase = "warmed";
            status(phase)
        } else {
            status(phase)
        };
        let mut out = io::stdout().lock();
        if writeln!(out, "{response}")
            .and_then(|_| out.flush())
            .is_err()
        {
            return;
        }
    }
}
