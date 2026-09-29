// use wasm_compute; // Not needed if we use the crate directly or via extern crate

#[tauri::command]
pub fn wasm_greet(name: String) -> String {
    wasm_compute::greet(&name)
}

#[tauri::command]
pub fn wasm_fibonacci(n: u32) -> u32 {
    wasm_compute::fibonacci(n)
}
