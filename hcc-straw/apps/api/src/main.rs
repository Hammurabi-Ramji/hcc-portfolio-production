use std::{
    io::{self, Read},
    process::ExitCode,
};
use straw_web_api::{auth::bootstrap_admin, router, AppState, Config, Store};

#[tokio::main]
async fn main() -> ExitCode {
    match run().await {
        Ok(()) => ExitCode::SUCCESS,
        Err(message) => {
            eprintln!("{message}");
            ExitCode::FAILURE
        }
    }
}
async fn run() -> Result<(), &'static str> {
    let config = Config::from_env().map_err(|_| "Invalid local API configuration.")?;
    let store = Store::open(&config.database).map_err(|_| "Could not open local API database.")?;
    let address = config.address();
    let state = AppState::new(store, config);
    let args: Vec<String> = std::env::args().skip(1).collect();
    match args.as_slice() {
        [] => (),
        [command, email] if command == "bootstrap-admin" => {
            eprintln!("Read administrator password from standard input; it is not logged.");
            let mut password = String::new();
            io::stdin()
                .take(1024)
                .read_to_string(&mut password)
                .map_err(|_| "Could not read password.")?;
            bootstrap_admin(&state, email, password.trim_end_matches(['\r', '\n']))
                .map_err(|_| "Administrator creation failed (invalid fields or existing email).")?;
            println!("Administrator created.");
            return Ok(());
        }
        _ => return Err("Usage: straw-web-api [bootstrap-admin EMAIL]"),
    }
    let listener = tokio::net::TcpListener::bind(address)
        .await
        .map_err(|_| "Could not bind loopback API port.")?;
    println!("Local web API listening on http://{address}");
    axum::serve(listener, router(state))
        .with_graceful_shutdown(async {
            let _ = tokio::signal::ctrl_c().await;
        })
        .await
        .map_err(|_| "Local API server stopped unexpectedly.")
}
