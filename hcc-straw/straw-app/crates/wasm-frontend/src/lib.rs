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
    #[test]
    fn bounded_compute() {
        assert_eq!(fibonacci(0), Ok(0));
        assert_eq!(fibonacci(10), Ok(55));
        assert_eq!(fibonacci(46), Ok(1836311903));
        assert!(fibonacci(47).is_err());
    }
}
