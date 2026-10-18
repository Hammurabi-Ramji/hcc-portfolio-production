use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn fibonacci(n: u32) -> Result<u32, String> {
    if n > 46 {
        return Err("fibonacci input must be 0..46".into());
    }
    let (mut previous, mut current) = (0_u32, 1_u32);
    for _ in 0..n {
        (previous, current) = (current, previous.checked_add(current).unwrap_or(0));
    }
    Ok(previous)
}

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {name}. Computed in WebAssembly.")
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Browser Modules compute exercises these inputs (0, 1, 10, 46).
    #[test]
    fn browser_compute_boundaries() {
        assert_eq!(fibonacci(0), Ok(0));
        assert_eq!(fibonacci(1), Ok(1));
        assert_eq!(fibonacci(10), Ok(55));
        assert_eq!(fibonacci(46), Ok(1_836_311_903));
    }

    #[test]
    fn rejects_out_of_range() {
        let err = fibonacci(47).expect_err("47 must be rejected");
        assert_eq!(err, "fibonacci input must be 0..46");
        assert!(fibonacci(100).is_err());
        assert!(fibonacci(u32::MAX).is_err());
    }

    /// Native Tauri `wasm_fibonacci` delegates to this same function.
    #[test]
    fn native_wasm_fibonacci_agreement() {
        assert_eq!(fibonacci(0), Ok(0));
        assert_eq!(fibonacci(1), Ok(1));
        assert_eq!(fibonacci(10), Ok(55));
        assert_eq!(fibonacci(46), Ok(1_836_311_903));
        assert!(fibonacci(47).is_err());
    }

    #[test]
    fn greet_export() {
        assert_eq!(
            greet("STRAW"),
            "Hello, STRAW. Computed in WebAssembly."
        );
    }
}
