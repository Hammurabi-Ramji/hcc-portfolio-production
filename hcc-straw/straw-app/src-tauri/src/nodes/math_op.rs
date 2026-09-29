use std::collections::HashMap;
use super::{NodeError, NodeInputs, NodeOutputs, NodeResult, NodeSchema, NodeValue, SchemaField};

pub fn schema() -> NodeSchema {
    NodeSchema {
        kind: "math_op".into(),
        label: "Math Operation".into(),
        description: "Perform arithmetic on one or two numeric inputs.".into(),
        category: "Logic".into(),
        inputs: vec!["a".into(), "b".into()],
        outputs: vec!["result".into()],
        config_fields: vec![
            SchemaField {
                name: "operation".into(),
                label: "Operation".into(),
                field_type: "select".into(),
                default: Some("add".into()),
                options: Some(vec![
                    "add".into(), "subtract".into(), "multiply".into(), "divide".into(),
                    "modulo".into(), "power".into(), "abs".into(), "round".into(),
                    "floor".into(), "ceil".into(), "min".into(), "max".into(),
                    "clamp".into(),
                ]),
                required: true,
            },
            SchemaField {
                name: "b_value".into(),
                label: "B value (constant, if not wired)".into(),
                field_type: "number".into(),
                default: Some("0".into()),
                options: None,
                required: false,
            },
            SchemaField {
                name: "clamp_min".into(),
                label: "Clamp min".into(),
                field_type: "number".into(),
                default: Some("0".into()),
                options: None,
                required: false,
            },
            SchemaField {
                name: "clamp_max".into(),
                label: "Clamp max".into(),
                field_type: "number".into(),
                default: Some("100".into()),
                options: None,
                required: false,
            },
            SchemaField {
                name: "decimals".into(),
                label: "Decimal places (round)".into(),
                field_type: "number".into(),
                default: Some("0".into()),
                options: None,
                required: false,
            },
        ],
    }
}

fn coerce_number(v: &NodeValue) -> Result<f64, NodeError> {
    match v {
        NodeValue::Number(n) => Ok(*n),
        NodeValue::Text(s) => s.trim().parse::<f64>()
            .map_err(|_| NodeError::Execution(format!("cannot parse '{s}' as number"))),
        NodeValue::Bool(b) => Ok(if *b { 1.0 } else { 0.0 }),
        _ => Err(NodeError::WrongType("expected number".into())),
    }
}

pub fn execute(config: &HashMap<String, String>, inputs: NodeInputs) -> NodeResult {
    let op = config.get("operation").map(|s| s.as_str()).unwrap_or("add");

    let a = inputs.0.get("a")
        .ok_or_else(|| NodeError::MissingInput("a".into()))
        .and_then(coerce_number)?;

    // b can come from wired input or constant config
    let b = if let Some(b_val) = inputs.0.get("b") {
        coerce_number(b_val)?
    } else {
        config.get("b_value").and_then(|s| s.parse::<f64>().ok()).unwrap_or(0.0)
    };

    let result = match op {
        "add"      => a + b,
        "subtract" => a - b,
        "multiply" => a * b,
        "divide"   => {
            if b == 0.0 { return Err(NodeError::Execution("division by zero".into())); }
            a / b
        }
        "modulo"   => {
            if b == 0.0 { return Err(NodeError::Execution("modulo by zero".into())); }
            a % b
        }
        "power"    => a.powf(b),
        "abs"      => a.abs(),
        "floor"    => a.floor(),
        "ceil"     => a.ceil(),
        "min"      => a.min(b),
        "max"      => a.max(b),
        "clamp"    => {
            let lo = config.get("clamp_min").and_then(|s| s.parse::<f64>().ok()).unwrap_or(0.0);
            let hi = config.get("clamp_max").and_then(|s| s.parse::<f64>().ok()).unwrap_or(100.0);
            a.clamp(lo, hi)
        }
        "round" => {
            let decimals = config.get("decimals").and_then(|s| s.parse::<u32>().ok()).unwrap_or(0);
            let factor = 10_f64.powi(decimals as i32);
            (a * factor).round() / factor
        }
        _ => return Err(NodeError::Execution(format!("unknown operation: {op}"))),
    };

    Ok(NodeOutputs::single("result", NodeValue::Number(result)))
}
