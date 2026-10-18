use crate::protocol::*;
use candle_core::{
    quantized::gguf_file::{Content, Value},
    Device, Tensor,
};
use candle_transformers::{generation::LogitsProcessor, models::quantized_qwen3::ModelWeights};
use sha2::{Digest, Sha256};
use std::{
    fs::File,
    io::{Read, Seek, SeekFrom},
    path::{Component, Path},
    time::{Duration, Instant},
};
use tokenizers::Tokenizer;
pub const BUNDLED_MANIFEST: &str =
    include_str!("../../../src-tauri/resources/models/svelte-coder/manifest.json");
pub struct Engine {
    status: EngineStatus,
    weights: Option<ModelWeights>,
    tokenizer: Option<Tokenizer>,
    eos: Vec<u32>,
}
impl Default for Engine {
    fn default() -> Self {
        Self {
            status: EngineStatus {
                phase: EnginePhase::Cold,
                model: "rockypod/svelte-coder-4b".into(),
                context_tokens: 8192,
                device: "cpu".into(),
            },
            weights: None,
            tokenizer: None,
            eos: Vec::new(),
        }
    }
}
fn safe_file(root: &Path, name: &str) -> Result<File, String> {
    let path = Path::new(name);
    if path.components().count() != 1
        || !matches!(path.components().next(), Some(Component::Normal(_)))
    {
        return Err("pack_path_escape".into());
    }
    let root = root.canonicalize().map_err(|e| e.to_string())?;
    let full = root.join(path).canonicalize().map_err(|e| e.to_string())?;
    if !full.starts_with(&root) {
        return Err("pack_path_escape".into());
    }
    let mut options = std::fs::OpenOptions::new();
    options.read(true);
    #[cfg(windows)]
    {
        use std::os::windows::fs::OpenOptionsExt;
        options.share_mode(1);
    }
    options.open(full).map_err(|e| e.to_string())
}
fn digest_reader(file: &mut File) -> Result<String, String> {
    let mut hash = Sha256::new();
    let mut buffer = vec![0u8; 1024 * 1024];
    loop {
        let count = file.read(&mut buffer).map_err(|e| e.to_string())?;
        if count == 0 {
            break;
        }
        hash.update(&buffer[..count]);
    }
    file.seek(SeekFrom::Start(0)).map_err(|e| e.to_string())?;
    Ok(format!("{:x}", hash.finalize()))
}
impl Engine {
    pub fn status(&self) -> EngineStatus {
        self.status.clone()
    }
    pub fn load(&mut self, root: &Path) -> Result<(), String> {
        self.unload();
        let manifest: PackManifest =
            serde_json::from_str(BUNDLED_MANIFEST).map_err(|e| e.to_string())?;
        let mut weights = safe_file(root, &manifest.gguf)?;
        if digest_reader(&mut weights)? != manifest.gguf_sha256 {
            return Err("pack_tampered: GGUF SHA-256 mismatch".into());
        }
        let mut file = safe_file(root, &manifest.tokenizer)?;
        if file.metadata().map_err(|e| e.to_string())?.len() > 20 * 1024 * 1024 {
            return Err("pack_tampered: tokenizer exceeds size bound".into());
        }
        let mut bytes = Vec::new();
        file.read_to_end(&mut bytes).map_err(|e| e.to_string())?;
        if format!("{:x}", Sha256::digest(&bytes)) != manifest.tokenizer_sha256 {
            return Err("pack_tampered: tokenizer SHA-256 mismatch".into());
        }
        let tokenizer = Tokenizer::from_bytes(bytes).map_err(|e| e.to_string())?;
        let mut content = Content::read(&mut weights).map_err(|e| e.to_string())?;
        if content
            .metadata
            .get("general.architecture")
            .and_then(|v| v.to_string().ok())
            .map(String::as_str)
            != Some("qwen3")
        {
            return Err("pack_tampered: expected Qwen3 architecture".into());
        }
        // Prove every tokenizer ID agrees with the GGUF vocabulary, not just EOS.
        let tokens = content
            .metadata
            .get("tokenizer.ggml.tokens")
            .ok_or("pack_tampered: missing vocabulary")?
            .to_vec()
            .map_err(|e| e.to_string())?;
        for (token, id) in tokenizer.get_vocab(true) {
            if tokens.get(id as usize).and_then(|v| v.to_string().ok()) != Some(&token) {
                return Err(format!("pack_tampered: tokenizer mismatch at ID {id}"));
            }
        }
        let eos = ["<|im_end|>", "<|endoftext|>"]
            .into_iter()
            .map(|token| {
                tokenizer
                    .token_to_id(token)
                    .ok_or_else(|| format!("pack_tampered: missing {token}"))
            })
            .collect::<Result<Vec<_>, _>>()?;
        if !(1..=8192).contains(&manifest.context_tokens) {
            return Err("invalid context bound".into());
        }
        let context = content
            .metadata
            .get("qwen3.context_length")
            .ok_or("missing context length")?
            .to_u32()
            .map_err(|e| e.to_string())?
            .min(manifest.context_tokens);
        content
            .metadata
            .insert("qwen3.context_length".into(), Value::U32(context));
        content
            .metadata
            .insert("general.dtype".into(), Value::U32(0)); // CPU F32 activation path
        let model = ModelWeights::from_gguf(content, &mut weights, &Device::Cpu)
            .map_err(|e| e.to_string())?;
        self.weights = Some(model);
        self.tokenizer = Some(tokenizer);
        self.eos = eos;
        self.status.context_tokens = context;
        self.status.phase = EnginePhase::Loaded;
        Ok(())
    }
    pub fn warm(&mut self) -> Result<(), String> {
        let _ = self.generate_inner("Reply OK.", "You are SvelteCoder. /no_think", 0., 1)?;
        self.status.phase = EnginePhase::Warmed;
        Ok(())
    }
    pub fn unload(&mut self) {
        self.weights = None;
        self.tokenizer = None;
        self.eos.clear();
        self.status.phase = EnginePhase::Cold;
    }
    pub fn generate(
        &mut self,
        prompt: &str,
        system: &str,
        temperature: f64,
        max_tokens: u32,
    ) -> Result<String, String> {
        if self.status.phase != EnginePhase::Warmed {
            return Err("engine_not_warmed".into());
        }
        self.generate_inner(prompt, system, temperature, max_tokens)
    }
    fn generate_inner(
        &mut self,
        prompt: &str,
        system: &str,
        temperature: f64,
        max_tokens: u32,
    ) -> Result<String, String> {
        if !temperature.is_finite()
            || !(0.0..=2.0).contains(&temperature)
            || !(1..=1500).contains(&max_tokens)
        {
            return Err("invalid generation bounds".into());
        }
        if prompt.len() + system.len() > MAX_FRAME / 2 {
            return Err("prompt exceeds size bound".into());
        }
        let tokenizer = self.tokenizer.as_ref().ok_or("engine_not_loaded")?;
        let model = self.weights.as_mut().ok_or("engine_not_loaded")?;
        // Escape role delimiters in user data; the native host owns the roles.
        let clean = |s: &str| {
            s.replace("<|im_start|>", "[im_start]")
                .replace("<|im_end|>", "[im_end]")
                .replace("<|endoftext|>", "[endoftext]")
        };
        let chat=format!("<|im_start|>system\n{}\nUse Svelte 5 runes ($state, $derived, $effect) for component state.\n<|im_end|>\n<|im_start|>user\n{}\n/no_think<|im_end|>\n<|im_start|>assistant\n<think>\n\n</think>\n\n",clean(system),clean(prompt));
        let input = tokenizer.encode(chat, false).map_err(|e| e.to_string())?;
        let ids = input.get_ids();
        if ids.len() + max_tokens as usize > self.status.context_tokens as usize {
            return Err("budget_exhausted: prompt plus output exceeds context".into());
        }
        model.clear_kv_cache();
        let result = (|| {
            let start = Instant::now();
            let mut sampler = LogitsProcessor::new(
                42,
                if temperature == 0. {
                    None
                } else {
                    Some(temperature)
                },
                Some(0.95),
            );
            let mut output = Vec::new();
            let mut history = ids.to_vec();
            for step in 0..max_tokens as usize {
                if start.elapsed() > Duration::from_secs(180) {
                    return Err("budget_exhausted: generation deadline".into());
                }
                let slice = if step == 0 {
                    ids
                } else {
                    &output[output.len() - 1..]
                };
                let offset = if step == 0 { 0 } else { ids.len() + step - 1 };
                let tensor = Tensor::new(slice, &Device::Cpu)
                    .and_then(|t| t.unsqueeze(0))
                    .map_err(|e| e.to_string())?;
                let logits = model
                    .forward(&tensor, offset)
                    .and_then(|t| t.squeeze(0))
                    .map_err(|e| e.to_string())?;
                let logits = candle_transformers::utils::apply_repeat_penalty(
                    &logits,
                    1.5,
                    &history[history.len().saturating_sub(64)..],
                )
                .map_err(|e| e.to_string())?;
                let token = sampler.sample(&logits).map_err(|e| e.to_string())?;
                if self.eos.contains(&token) {
                    break;
                }
                output.push(token);
                history.push(token);
            }
            tokenizer.decode(&output, true).map_err(|e| e.to_string())
        })();
        model.clear_kv_cache();
        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn unloaded_cannot_generate_and_paths_cannot_escape() {
        let mut e = Engine::default();
        assert_eq!(
            e.generate("x", "s", 0., 1).unwrap_err(),
            "engine_not_warmed"
        );
        let d = tempfile::tempdir().unwrap();
        assert!(safe_file(d.path(), "../outside")
            .unwrap_err()
            .contains("escape"));
        assert!(safe_file(d.path(), "C:\\outside").is_err()); // crucible:allow(portability) rejection fixture
    }
}
