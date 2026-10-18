use crate::protocol::*;
use std::{
    io::{BufReader, Write},
    path::PathBuf,
    process::{Child, ChildStdin, Command, Stdio},
    sync::{
        atomic::{AtomicBool, Ordering},
        mpsc, Arc, Mutex,
    },
    thread,
    time::Duration,
};
struct Worker {
    child: Arc<Mutex<Child>>,
    input: ChildStdin,
    output: mpsc::Receiver<Result<Response, String>>,
    reader: Option<thread::JoinHandle<()>>,
}
impl Drop for Worker {
    fn drop(&mut self) {
        if let Ok(mut child) = self.child.lock() {
            let _ = child.kill();
            let _ = child.wait();
        }
        let (_, empty) = mpsc::channel();
        drop(std::mem::replace(&mut self.output, empty));
        if let Some(reader) = self.reader.take() {
            let _ = reader.join();
        }
    }
}
pub struct Supervisor {
    executable: PathBuf,
    pack: PathBuf,
    worker: Mutex<Option<Worker>>,
    process: Mutex<Option<Arc<Mutex<Child>>>>,
    stopped: AtomicBool,
}
impl Supervisor {
    pub fn new(executable: PathBuf, pack: PathBuf) -> Self {
        Self {
            executable,
            pack,
            worker: Mutex::new(None),
            process: Mutex::new(None),
            stopped: AtomicBool::new(false),
        }
    }
    pub fn stop(&self) -> Result<(), String> {
        self.stopped.store(true, Ordering::SeqCst);
        let process = self.process.lock().map_err(|e| e.to_string())?.clone();
        // Kill independently of the request lock, so application exit interrupts
        // a blocked load or generation before joining the reader thread.
        if let Some(child) = process {
            let _ = child.lock().map_err(|e| e.to_string())?.kill();
        }
        self.worker.lock().map_err(|e| e.to_string())?.take();
        Ok(())
    }
    fn spawn(&self) -> Result<Worker, String> {
        let mut command = Command::new(&self.executable);
        command.env_clear();
        if let Some(system_root) = std::env::var_os("SystemRoot") {
            command
                .env("SystemRoot", &system_root)
                .env("WINDIR", system_root);
        }
        command.env(
            "RAYON_NUM_THREADS",
            std::thread::available_parallelism()
                .map(|n| n.get().min(8))
                .unwrap_or(1)
                .to_string(),
        );
        command
            .arg("--pack")
            .arg(&self.pack)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null());
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            command.creation_flags(0x08000000);
        }
        let mut child = command
            .spawn()
            .map_err(|e| format!("sidecar launch: {e}"))?;
        let input = child.stdin.take().ok_or("missing sidecar stdin")?;
        let output = child.stdout.take().ok_or("missing sidecar stdout")?;
        let child = Arc::new(Mutex::new(child));
        *self.process.lock().map_err(|e| e.to_string())? = Some(child.clone());
        if self.stopped.load(Ordering::SeqCst) {
            let mut child = child.lock().map_err(|e| e.to_string())?;
            let _ = child.kill();
            let _ = child.wait();
            return Err("sidecar stopped".into());
        }
        let (sender, receiver) = mpsc::sync_channel(1);
        let reader = thread::spawn(move || {
            let mut output = BufReader::new(output);
            loop {
                let response = match read_frame(&mut output) {
                    Ok(Some(frame)) => serde_json::from_slice(&frame).map_err(|e| e.to_string()),
                    Ok(None) => break,
                    Err(e) => Err(e.to_string()),
                };
                if sender.send(response).is_err() {
                    break;
                }
            }
        });
        Ok(Worker {
            child,
            input,
            output: receiver,
            reader: Some(reader),
        })
    }
    pub fn request(&self, request: Request) -> Result<Response, String> {
        self.request_with_timeout(request, Duration::from_secs(210))
    }
    fn request_with_timeout(
        &self,
        request: Request,
        timeout: Duration,
    ) -> Result<Response, String> {
        if self.stopped.load(Ordering::SeqCst) {
            return Err("sidecar stopped".into());
        }
        let mut worker = self.worker.try_lock().map_err(|_| "engine_busy")?;
        if matches!(request, Request::Unload) {
            worker.take();
            return Ok(Response::Status(Self::cold()));
        }
        if worker.is_none() && matches!(request, Request::Status) {
            return Ok(Response::Status(Self::cold()));
        }
        if worker.is_none() && !matches!(request, Request::Load) {
            return Err("engine_not_warmed".into());
        }
        if worker.is_none() {
            *worker = Some(self.spawn()?);
        }
        let encoded = serde_json::to_vec(&request).map_err(|e| e.to_string())?;
        if encoded.len() + 1 > MAX_FRAME {
            return Err("protocol frame exceeds bound".into());
        }
        let result = (|| {
            let process = worker.as_mut().ok_or("sidecar unavailable")?;
            process
                .input
                .write_all(&encoded)
                .and_then(|_| process.input.write_all(b"\n"))
                .and_then(|_| process.input.flush())
                .map_err(|e| e.to_string())?;
            process
                .output
                .recv_timeout(timeout)
                .map_err(|e| format!("sidecar deadline or exit: {e}"))?
        })();
        match result {
            Ok(Response::Error(error)) => Err(error),
            Ok(response) => Ok(response),
            Err(error) => {
                worker.take();
                Err(error)
            }
        }
    }
    fn cold() -> EngineStatus {
        EngineStatus {
            phase: EnginePhase::Cold,
            model: "rockypod/svelte-coder-4b".into(),
            context_tokens: 8192,
            device: "cpu".into(),
        }
    }
    pub fn generate(&self, prompt: &str, system: &str, temperature: f64) -> Result<String, String> {
        match self.request(Request::Generate {
            prompt: prompt.into(),
            system: system.into(),
            temperature,
            max_tokens: 1500,
        })? {
            Response::Text(text) => Ok(text),
            _ => Err("unexpected sidecar response".into()),
        }
    }
}

#[cfg(test)]
#[path = "supervisor_tests.rs"]
mod tests;
