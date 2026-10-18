use serde::{Deserialize, Serialize};
#[derive(Clone, Debug, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "snake_case")]
pub enum LocalProvider {
    Ollama,
    LlamaCpp,
}
#[derive(Debug, Serialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct LocalModel {
    pub id: String,
    pub provider: LocalProvider,
    pub endpoint: String,
}
pub fn scan(provider: LocalProvider, base: &str) -> Result<Vec<LocalModel>, String> {
    let base = base.trim_end_matches('/');
    let url = format!(
        "{}{}",
        base,
        match provider {
            LocalProvider::Ollama => "/api/tags",
            LocalProvider::LlamaCpp => "/v1/models",
        }
    );
    let (status, body) = straw_engine::network::request("GET", &url, &Default::default(), "")?;
    if status != 200 {
        return Err(format!("local model discovery returned {status}"));
    }
    let data: serde_json::Value = serde_json::from_str(&body).map_err(|e| e.to_string())?;
    let (array, key, endpoint) = match provider {
        LocalProvider::Ollama => ("models", "name", format!("{base}/api/generate")),
        LocalProvider::LlamaCpp => ("data", "id", format!("{base}/v1/chat/completions")),
    };
    data[array]
        .as_array()
        .ok_or("invalid local model list")?
        .iter()
        .filter(|row| !matches!(provider, LocalProvider::Ollama) || !is_remote(row))
        .map(|row| {
            Ok(LocalModel {
                id: row[key].as_str().ok_or("model has no identity")?.into(),
                provider: provider.clone(),
                endpoint: endpoint.clone(),
            })
        })
        .collect()
}
fn is_remote(model: &serde_json::Value) -> bool {
    ["remote_host", "remote_model"]
        .iter()
        .any(|key| model[*key].as_str().is_some_and(|value| !value.is_empty()))
        || ["name", "model"].iter().any(|key| {
            model[*key].as_str().is_some_and(|id| {
                let id = id.to_ascii_lowercase();
                id.ends_with(":cloud") || id.ends_with("-cloud")
            })
        })
}
/// Recheck metadata before sending a prompt: a local Ollama endpoint can host
/// a cloud-backed model or an alias whose name does not reveal that fact.
pub fn verify_ollama_local(base: &str, id: &str) -> Result<(), String> {
    if is_remote(&serde_json::json!({"name":id})) {
        return Err("cloud-backed Ollama models are disabled".into());
    }
    let (status, body) = straw_engine::network::request(
        "POST",
        &format!("{}/api/show", base.trim_end_matches('/')),
        &Default::default(),
        &serde_json::json!({"model":id}).to_string(),
    )?;
    if status != 200 {
        return Err(format!("local model verification returned {status}"));
    }
    let data: serde_json::Value = serde_json::from_str(&body).map_err(|e| e.to_string())?;
    if !data.is_object() || is_remote(&data) {
        return Err("cloud-backed or invalid Ollama model metadata".into());
    }
    Ok(())
}
/// Load only a model already present at the selected local Ollama service.
/// llama.cpp loads weights at server startup; selection validates its model list.
pub fn load(provider: LocalProvider, base: &str, id: &str) -> Result<(), String> {
    if !scan(provider.clone(), base)?.iter().any(|m| m.id == id) {
        return Err("select a discovered local model".into());
    }
    if matches!(provider, LocalProvider::Ollama) {
        verify_ollama_local(base, id)?;
        let body = serde_json::json!({"model":id,"prompt":"","stream":false,"keep_alive":"5m"})
            .to_string();
        let (status, _) = straw_engine::network::request(
            "POST",
            &format!("{}/api/generate", base.trim_end_matches('/')),
            &Default::default(),
            &body,
        )?;
        if status != 200 {
            return Err(format!("local model load returned {status}"));
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{BufRead, Read, Write};
    fn with_service<T>(responses: &[(&str, u16, &str)], call: impl FnOnce(&str) -> T) -> T {
        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        listener.set_nonblocking(true).unwrap();
        let base = format!("http://{}", listener.local_addr().unwrap());
        let responses: Vec<_> = responses
            .iter()
            .map(|(path, status, body)| (path.to_string(), *status, body.to_string()))
            .collect();
        let server = std::thread::spawn(move || {
            let deadline = std::time::Instant::now() + std::time::Duration::from_secs(5);
            for (expected, status, body) in responses {
                let mut stream = loop {
                    match listener.accept() {
                        Ok((stream, _)) => break stream,
                        Err(e)
                            if e.kind() == std::io::ErrorKind::WouldBlock
                                && std::time::Instant::now() < deadline =>
                        {
                            std::thread::sleep(std::time::Duration::from_millis(5))
                        }
                        Err(e) => panic!("fixture accept: {e}"),
                    }
                };
                stream
                    .set_read_timeout(Some(std::time::Duration::from_secs(2)))
                    .unwrap();
                let mut reader = std::io::BufReader::new(&mut stream);
                let mut first = String::new();
                reader.read_line(&mut first).unwrap();
                assert!(first.starts_with(&expected), "{first}");
                let mut length = 0;
                loop {
                    let mut header = String::new();
                    reader.read_line(&mut header).unwrap();
                    if header == "\r\n" {
                        break;
                    }
                    assert!(!header.is_empty(), "truncated headers");
                    if let Some((name, value)) = header.split_once(':') {
                        if name.eq_ignore_ascii_case("content-length") {
                            length = value.trim().parse::<usize>().unwrap();
                        }
                    }
                }
                assert!(length < 64 * 1024);
                let mut bytes = vec![0; length];
                reader.read_exact(&mut bytes).unwrap();
                write!(stream,"HTTP/1.1 {status} Fixture\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",body.len()).unwrap();
            }
        });
        let result = call(&base);
        server.join().unwrap();
        result
    }

    #[test]
    fn provider_scan_and_selection_validate_local_lists_and_http_errors() {
        let selected = with_service(
            &[("GET /v1/models", 200, r#"{"data":[{"id":"installed"}]}"#)],
            |base| scan(LocalProvider::LlamaCpp, &format!("{base}/")).unwrap(),
        );
        assert_eq!(selected[0].id, "installed");
        assert!(selected[0].endpoint.ends_with("/v1/chat/completions"));
        assert!(with_service(
            &[("GET /v1/models", 200, r#"{"data":[{"id":"installed"}]}"#)],
            |base| load(LocalProvider::LlamaCpp, base, "installed")
        )
        .is_ok());
        for (status, body, expected) in [
            (503, "{}", "returned 503"),
            (200, "not JSON", "expected"),
            (200, "{}", "invalid local model list"),
            (200, r#"{"models":[{}]}"#, "no identity"),
        ] {
            let error = with_service(&[("GET /api/tags", status, body)], |base| {
                scan(LocalProvider::Ollama, base)
            })
            .unwrap_err();
            assert!(error.contains(expected), "{error}");
        }
        let error = with_service(&[("GET /v1/models", 200, r#"{"data":[]}"#)], |base| {
            load(LocalProvider::LlamaCpp, base, "absent")
        })
        .unwrap_err();
        assert!(error.contains("discovered local model"));
    }

    #[test]
    fn ollama_warmup_checks_metadata_before_loading_and_preserves_server_failures() {
        for status in [200, 503] {
            let result = with_service(
                &[
                    ("GET /api/tags", 200, r#"{"models":[{"name":"local"}]}"#),
                    ("POST /api/show", 200, "{}"),
                    ("POST /api/generate", status, "{}"),
                ],
                |base| load(LocalProvider::Ollama, base, "local"),
            );
            if status == 200 {
                assert!(result.is_ok());
            } else {
                assert!(result.unwrap_err().contains("load returned 503"));
            }
        }
        for (status, body) in [
            (503, "{}"),
            (200, "broken"),
            (200, "[]"),
            (200, r#"{"remote_host":"remote"}"#),
        ] {
            assert!(with_service(&[("POST /api/show", status, body)], |base| {
                verify_ollama_local(base, "local")
            })
            .is_err());
        }
        assert!(verify_ollama_local("http://127.0.0.1:1", "MODEL:CLOUD")
            .unwrap_err()
            .contains("cloud-backed"));
        assert!(is_remote(&serde_json::json!({"model":"model-CLOUD"})));
        assert!(!is_remote(
            &serde_json::json!({"remote_host":"","name":"ordinary"})
        ));
    }
    #[test]
    fn local_discovery_excludes_remote_models_and_load_rechecks_opaque_aliases() {
        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let base = format!("http://{}", listener.local_addr().unwrap());
        let server = std::thread::spawn(move || {
            for (expected, response) in [
                (
                    "GET /api/tags",
                    serde_json::json!({"models":[
                    {"name":"local"}, {"name":"qwen:cloud"},
                    {"name":"alias", "remote_host":"https://ollama.com"}]}),
                ),
                (
                    "GET /api/tags",
                    serde_json::json!({"models":[{"name":"opaque"}]}),
                ),
                (
                    "POST /api/show",
                    serde_json::json!({"remote_model":"qwen3", "remote_host":"https://ollama.com"}),
                ),
            ] {
                let (mut stream, _) = listener.accept().unwrap();
                stream
                    .set_read_timeout(Some(std::time::Duration::from_secs(5)))
                    .unwrap();
                let mut reader = std::io::BufReader::new(stream.try_clone().unwrap());
                let mut first = String::new();
                reader.read_line(&mut first).unwrap();
                assert!(first.starts_with(expected), "{first}");
                let mut content_length = 0;
                loop {
                    let mut line = String::new();
                    reader.read_line(&mut line).unwrap();
                    if line == "\r\n" || line.is_empty() {
                        break;
                    }
                    if let Some(length) = line.to_ascii_lowercase().strip_prefix("content-length:")
                    {
                        content_length = length.trim().parse::<usize>().unwrap();
                    }
                }
                let mut request_body = vec![0; content_length];
                reader.read_exact(&mut request_body).unwrap();
                if expected == "POST /api/show" {
                    let request: serde_json::Value = serde_json::from_slice(&request_body).unwrap();
                    assert_eq!(request["model"], "opaque");
                }
                let body = response.to_string();
                write!(stream, "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", body.len()).unwrap();
            }
        });
        let models = scan(LocalProvider::Ollama, &base).unwrap();
        assert_eq!(models.len(), 1);
        assert_eq!(models[0].id, "local");
        let error = load(LocalProvider::Ollama, &base, "opaque").unwrap_err();
        assert!(error.contains("cloud-backed"), "{error}");
        server.join().unwrap();
    }
}
