//! Explicit smoke test against a staged worker and verified local model pack.
//! Run: cargo run -p straw-inference --example model-smoke -- WORKER PACK
use straw_inference::{protocol::{EnginePhase, Request, Response}, supervisor::Supervisor};
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut args = std::env::args_os().skip(1);
    let binary = args.next().ok_or("missing worker path")?;
    let pack = args.next().ok_or("missing pack path")?;
    if args.next().is_some() { return Err("unexpected argument".into()); }
    let worker = Supervisor::new(binary.into(), pack.into());
    for (request, expected) in [(Request::Status, EnginePhase::Cold),
        (Request::Load, EnginePhase::Loaded), (Request::Warm, EnginePhase::Warmed)] {
        let start = std::time::Instant::now();
        let response = worker.request(request).map_err(std::io::Error::other)?;
        match &response {
            Response::Status(status) if status.phase == expected => {},
            _ => return Err("unexpected lifecycle response".into()),
        }
        println!("{}", serde_json::json!({"response":response, "elapsedSeconds":start.elapsed().as_secs_f64()}));
    }
    let start = std::time::Instant::now();
    let response = worker.request(Request::Generate {
        prompt: "Write a minimal Svelte 5 counter button using $state. Return code only.".into(),
        system: "You are a Svelte 5 coding assistant. Use runes.".into(),
        temperature: 0., max_tokens: 64,
    }).map_err(std::io::Error::other)?;
    match &response {
        Response::Text(text) if !text.trim().is_empty() => {},
        _ => return Err("empty generation response".into()),
    }
    println!("{}", serde_json::json!({"response":response,"elapsedSeconds":start.elapsed().as_secs_f64(),"outputCap":64}));
    let response = worker.request(Request::Unload).map_err(std::io::Error::other)?;
    match &response {
        Response::Status(status) if status.phase == EnginePhase::Cold => {},
        _ => return Err("worker did not unload".into()),
    }
    worker.stop().map_err(std::io::Error::other)?;
    println!("{}", serde_json::json!({"response":response,"workerStopped":true}));
    Ok(())
}
