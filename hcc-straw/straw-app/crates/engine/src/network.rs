use std::{collections::HashMap, io::Read, time::Duration};

pub const MAX_BODY: u64 = 4 * 1024 * 1024;

pub struct LoopbackEndpoint(String);
impl LoopbackEndpoint {
    pub fn parse(url: &str) -> Result<Self, String> {
        if url
            .chars()
            .any(|c| c.is_control() || c.is_whitespace() || c == '\\')
        {
            return Err("invalid endpoint characters".into());
        }
        let rest = url
            .strip_prefix("http://")
            .ok_or("only plain HTTP on 127.0.0.1 is supported")?;
        let authority = rest.split('/').next().unwrap_or("");
        let port = authority
            .strip_prefix("127.0.0.1")
            .ok_or("endpoint must be 127.0.0.1")?;
        if !port.is_empty() {
            let number = port
                .strip_prefix(':')
                .ok_or("invalid authority")?
                .parse::<u16>()
                .map_err(|_| "invalid port")?;
            if number == 0 {
                return Err("port must be nonzero".into());
            }
        }
        Ok(Self(url.into()))
    }
}

pub fn request(
    method: &str,
    url: &str,
    headers: &HashMap<String, String>,
    body: &str,
) -> Result<(u16, String), String> {
    let endpoint = LoopbackEndpoint::parse(url)?;
    if !["GET", "POST", "PUT", "DELETE"].contains(&method) {
        return Err("unsupported HTTP method".into());
    }
    if body.len() as u64 > MAX_BODY {
        return Err("request exceeds size limit".into());
    }
    let agent = ureq::AgentBuilder::new()
        .redirects(0)
        .try_proxy_from_env(false)
        .timeout_connect(Duration::from_secs(3))
        .timeout(Duration::from_secs(180))
        .build();
    let mut request = agent.request(method, &endpoint.0);
    for (name, value) in headers {
        if name.chars().any(|c| c.is_control()) || value.chars().any(|c| c.is_control()) {
            return Err("invalid header".into());
        }
        request = request.set(name, value);
    }
    let response = match if body.is_empty() {
        request.call()
    } else {
        request.send_string(body)
    } {
        Ok(r) => r,
        Err(ureq::Error::Status(_, r)) => r,
        Err(e) => return Err(e.to_string()),
    };
    let status = response.status();
    if (300..400).contains(&status) {
        return Err("redirects are disabled".into());
    }
    let mut bytes = Vec::new();
    response
        .into_reader()
        .take(MAX_BODY + 1)
        .read_to_end(&mut bytes)
        .map_err(|e| e.to_string())?;
    if bytes.len() as u64 > MAX_BODY {
        return Err("response exceeds size limit".into());
    }
    Ok((
        status,
        String::from_utf8(bytes).map_err(|_| "response is not UTF-8")?,
    ))
}

pub fn generate(
    settings: &crate::contract::ModelSettings,
    prompt: &str,
    system: &str,
) -> Result<String, String> {
    if settings.model.trim().is_empty()
        || !settings.temperature.is_finite()
        || !(0.0..=2.0).contains(&settings.temperature)
    {
        return Err("invalid model settings".into());
    }
    let openai = settings.api_url.ends_with("/v1/chat/completions");
    let body = if openai {
        serde_json::json!({"model":settings.model,"messages":[{"role":"system","content":system},{"role":"user","content":prompt}],"stream":false,"temperature":settings.temperature,"max_tokens":1500})
    } else {
        serde_json::json!({"model":settings.model,"prompt":prompt,"system":system,"stream":false,"options":{"temperature":settings.temperature,"num_ctx":8192,"num_predict":1500,"repeat_penalty":1.5}})
    };
    let (status, text) = request(
        "POST",
        &settings.api_url,
        &HashMap::from([("Content-Type".into(), "application/json".into())]),
        &body.to_string(),
    )?;
    if status != 200 {
        return Err(format!("local model returned HTTP {status}"));
    }
    let value: serde_json::Value = serde_json::from_str(&text).map_err(|e| e.to_string())?;
    (if openai {
        value.pointer("/choices/0/message/content")
    } else {
        value.get("response")
    })
    .and_then(|r| r.as_str())
    .map(str::to_owned)
    .ok_or("local model response missing text".into())
}
