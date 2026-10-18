#![forbid(unsafe_code)]
use std::{
    io::{self, Write},
    path::PathBuf,
};
use straw_inference::{
    engine::Engine,
    protocol::{read_frame, Request, Response, MAX_FRAME},
};
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut args = std::env::args_os().skip(1);
    if args.next().as_deref() != Some(std::ffi::OsStr::new("--pack")) {
        return Err("expected --pack DIRECTORY".into());
    }
    let root = PathBuf::from(args.next().ok_or("missing pack directory")?);
    if args.next().is_some() {
        return Err("unexpected argument".into());
    }
    let mut engine = Engine::default();
    let mut stdin = io::stdin().lock();
    let mut stdout = io::stdout().lock();
    while let Some(frame) = read_frame(&mut stdin)? {
        let response = (|| -> Result<Response, String> {
            match serde_json::from_slice::<Request>(&frame).map_err(|e| e.to_string())? {
                Request::Status => Ok(Response::Status(engine.status())),
                Request::Load => {
                    engine.load(&root)?;
                    Ok(Response::Status(engine.status()))
                }
                Request::Warm => {
                    engine.warm()?;
                    Ok(Response::Status(engine.status()))
                }
                Request::Unload => {
                    engine.unload();
                    Ok(Response::Status(engine.status()))
                }
                Request::Generate {
                    prompt,
                    system,
                    temperature,
                    max_tokens,
                } => engine
                    .generate(&prompt, &system, temperature, max_tokens)
                    .map(Response::Text),
            }
        })()
        .unwrap_or_else(Response::Error);
        let encoded = serde_json::to_vec(&response)?;
        if encoded.len() + 1 > MAX_FRAME {
            return Err("response exceeds frame bound".into());
        }
        stdout.write_all(&encoded)?;
        stdout.write_all(b"\n")?;
        stdout.flush()?;
    }
    Ok(())
}
