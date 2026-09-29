use std::collections::{HashMap, HashSet, VecDeque};
use serde::{Deserialize, Serialize};
use crate::nodes::{NodeInputs, NodeValue, execute_node};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlowNode {
    pub id: String,
    pub kind: String,
    pub config: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlowEdge {
    pub id: String,
    pub source: String,
    pub source_handle: String,
    pub target: String,
    pub target_handle: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Flow {
    pub nodes: Vec<FlowNode>,
    pub edges: Vec<FlowEdge>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeResult {
    pub node_id: String,
    pub outputs: HashMap<String, NodeValue>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionResult {
    pub results: Vec<NodeResult>,
    pub order: Vec<String>,
}

pub fn run_flow(flow: &Flow) -> ExecutionResult {
    let order = topological_sort(flow);
    let mut store: HashMap<String, HashMap<String, NodeValue>> = HashMap::new();
    let mut results = Vec::new();

    for node_id in &order {
        let node = match flow.nodes.iter().find(|n| &n.id == node_id) {
            Some(n) => n,
            None => continue,
        };

        // Collect inputs wired from upstream node outputs
        let mut input_map: HashMap<String, NodeValue> = HashMap::new();
        for edge in &flow.edges {
            if &edge.target == node_id {
                if let Some(src_outputs) = store.get(&edge.source) {
                    if let Some(val) = src_outputs.get(&edge.source_handle) {
                        input_map.insert(edge.target_handle.clone(), val.clone());
                    }
                }
            }
        }

        let node_result = match execute_node(&node.kind, &node.config, NodeInputs(input_map)) {
            Ok(outputs) => {
                let out_map = outputs.0.clone();
                store.insert(node_id.clone(), out_map.clone());
                NodeResult { node_id: node_id.clone(), outputs: out_map, error: None }
            }
            Err(e) => NodeResult {
                node_id: node_id.clone(),
                outputs: HashMap::new(),
                error: Some(e.to_string()),
            },
        };

        results.push(node_result);
    }

    ExecutionResult { results, order }
}

fn topological_sort(flow: &Flow) -> Vec<String> {
    let mut in_degree: HashMap<String, usize> = HashMap::new();
    let mut adj: HashMap<String, Vec<String>> = HashMap::new();

    for node in &flow.nodes {
        in_degree.entry(node.id.clone()).or_insert(0);
        adj.entry(node.id.clone()).or_default();
    }

    for edge in &flow.edges {
        *in_degree.entry(edge.target.clone()).or_insert(0) += 1;
        adj.entry(edge.source.clone()).or_default().push(edge.target.clone());
    }

    let mut queue: VecDeque<String> = in_degree
        .iter()
        .filter(|(_, &deg)| deg == 0)
        .map(|(id, _)| id.clone())
        .collect();

    let mut sorted = Vec::new();
    let mut visited: HashSet<String> = HashSet::new();

    while let Some(id) = queue.pop_front() {
        if visited.contains(&id) { continue; }
        visited.insert(id.clone());
        sorted.push(id.clone());

        if let Some(neighbors) = adj.get(&id) {
            for neighbor in neighbors {
                let deg = in_degree.entry(neighbor.clone()).or_insert(0);
                if *deg > 0 { *deg -= 1; }
                if *deg == 0 {
                    queue.push_back(neighbor.clone());
                }
            }
        }
    }

    sorted
}
