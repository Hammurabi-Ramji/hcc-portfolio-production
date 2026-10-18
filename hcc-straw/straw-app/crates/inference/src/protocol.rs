use serde::{Deserialize, Serialize};
pub const MAX_FRAME: usize = 4 * 1024 * 1024;
#[derive(Clone, Copy, Debug, Serialize, Deserialize, specta::Type, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum EnginePhase {
    Cold,
    Loaded,
    Warmed,
}
#[derive(Clone, Debug, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct EngineStatus {
    pub phase: EnginePhase,
    pub model: String,
    pub context_tokens: u32,
    pub device: String,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(tag = "command", rename_all = "snake_case", deny_unknown_fields)]
pub enum Request {
    Status,
    Load,
    Warm,
    Unload,
    Generate {
        prompt: String,
        system: String,
        temperature: f64,
        max_tokens: u32,
    },
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(tag = "kind", content = "value", rename_all = "snake_case")]
pub enum Response {
    Status(EngineStatus),
    Text(String),
    Error(String),
}
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct PackManifest {
    pub model_id: String,
    pub gguf: String,
    pub gguf_sha256: String,
    pub tokenizer: String,
    pub tokenizer_sha256: String,
    pub context_tokens: u32,
}
/// Read one newline-delimited JSON frame with a hard cap, including at EOF.
pub fn read_frame(reader: &mut impl std::io::BufRead) -> std::io::Result<Option<Vec<u8>>> {
    use std::io::{BufRead, Read};
    let mut frame = Vec::new();
    reader
        .take((MAX_FRAME + 1) as u64)
        .read_until(b'\n', &mut frame)?;
    if frame.is_empty() {
        return Ok(None);
    }
    if frame.len() > MAX_FRAME {
        return Err(std::io::Error::other("protocol frame exceeds 4 MiB"));
    }
    Ok(Some(frame))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{self, Cursor};

    #[test]
    fn frames_preserve_boundaries_accept_final_eof_and_stop_at_the_hard_limit() {
        let mut reader = Cursor::new(b"{\"command\":\"status\"}\n{\"command\":\"unload\"}");
        assert!(matches!(
            serde_json::from_slice::<Request>(&read_frame(&mut reader).unwrap().unwrap()).unwrap(),
            Request::Status
        ));
        assert!(matches!(
            serde_json::from_slice::<Request>(&read_frame(&mut reader).unwrap().unwrap()).unwrap(),
            Request::Unload
        ));
        assert!(read_frame(&mut reader).unwrap().is_none());
        assert_eq!(
            read_frame(&mut Cursor::new(vec![b'x'; MAX_FRAME]))
                .unwrap()
                .unwrap()
                .len(),
            MAX_FRAME
        );
        assert!(read_frame(&mut Cursor::new(vec![b'x'; MAX_FRAME + 1]))
            .unwrap_err()
            .to_string()
            .contains("4 MiB"));
    }

    #[test]
    fn io_failure_and_unknown_request_fields_are_not_swallowed() {
        struct Broken;
        impl io::Read for Broken {
            fn read(&mut self, _: &mut [u8]) -> io::Result<usize> {
                Err(io::Error::other("broken stream"))
            }
        }
        impl io::BufRead for Broken {
            fn fill_buf(&mut self) -> io::Result<&[u8]> {
                Err(io::Error::other("broken stream"))
            }
            fn consume(&mut self, _: usize) {}
        }
        assert!(read_frame(&mut Broken)
            .unwrap_err()
            .to_string()
            .contains("broken stream"));
        assert!(serde_json::from_str::<Request>(r#"{"command":"generate","prompt":"x","system":"s","temperature":0,"max_tokens":5,"extra":true}"#).is_err());
        for response in [
            Response::Text("reply".into()),
            Response::Error("failure".into()),
            Response::Status(EngineStatus {
                phase: EnginePhase::Warmed,
                model: "test".into(),
                context_tokens: 8,
                device: "cpu".into(),
            }),
        ] {
            let json = serde_json::to_string(&response).unwrap();
            let recovered: Response = serde_json::from_str(&json).unwrap();
            assert_eq!(json, serde_json::to_string(&recovered).unwrap());
        }
    }
}
