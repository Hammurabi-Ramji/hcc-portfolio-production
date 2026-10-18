use crate::nodes::{all_schemas, execute_node, NodeInputs, NodeValue};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet, VecDeque};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, specta::Type)]
#[serde(transparent)]
pub struct NodeId(Uuid);
impl NodeId {
    pub fn mint() -> Self {
        Self(Uuid::new_v4())
    }
}
impl std::fmt::Display for NodeId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        self.0.fmt(f)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct FlowNode {
    pub id: NodeId,
    pub kind: String,
    pub config: HashMap<String, String>,
    #[serde(default)]
    pub x: f64,
    #[serde(default)]
    pub y: f64,
}
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct FlowEdge {
    pub source: NodeId,
    pub source_handle: String,
    pub target: NodeId,
    pub target_handle: String,
}
#[derive(Debug, Clone, Default, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Graph {
    pub nodes: Vec<FlowNode>,
    pub edges: Vec<FlowEdge>,
}

#[derive(Debug, thiserror::Error)]
#[error("invalid graph: {0}")]
pub struct CycleError(pub String);

#[derive(Debug)]
pub struct AcyclicGraph {
    graph: Graph,
    order: Vec<NodeId>,
}

impl Graph {
    pub fn validate(mut self) -> Result<AcyclicGraph, CycleError> {
        let invalid = |message: &str| CycleError(message.into());
        if self.nodes.is_empty() {
            return Err(invalid("empty graph"));
        }
        let schemas = all_schemas();
        let mut kinds = HashMap::new();
        let mut indegree = HashMap::new();
        let mut adjacency: HashMap<NodeId, Vec<NodeId>> = HashMap::new();
        for node in &mut self.nodes {
            if indegree.insert(node.id, 0_usize).is_some() {
                return Err(invalid("duplicate node ID"));
            }
            let schema = schemas
                .iter()
                .find(|s| s.kind == node.kind)
                .ok_or_else(|| invalid("unknown node kind"))?;
            node.config = schema.validated_config(&node.config).map_err(CycleError)?;
            kinds.insert(node.id, schema);
        }
        let mut targets = HashSet::new();
        for edge in &self.edges {
            let source = kinds
                .get(&edge.source)
                .ok_or_else(|| invalid("unknown source"))?;
            let target = kinds
                .get(&edge.target)
                .ok_or_else(|| invalid("unknown target"))?;
            if !source.outputs.contains(&edge.source_handle)
                || !target.inputs.contains(&edge.target_handle)
            {
                return Err(invalid("unknown port"));
            }
            if !targets.insert((edge.target, edge.target_handle.clone())) {
                return Err(invalid("input connected more than once"));
            }
            *indegree
                .get_mut(&edge.target)
                .ok_or_else(|| invalid("unknown target"))? += 1;
            adjacency.entry(edge.source).or_default().push(edge.target);
        }
        for node in &self.nodes {
            let schema = kinds
                .get(&node.id)
                .ok_or_else(|| invalid("missing node schema"))?;
            for input in schema.input_specs().iter().filter(|p| p.required) {
                if !targets.contains(&(node.id, input.name.clone())) {
                    return Err(invalid(&format!(
                        "{} requires connected input {}",
                        node.kind, input.name
                    )));
                }
            }
        }
        let mut queue: VecDeque<_> = self
            .nodes
            .iter()
            .filter(|n| indegree.get(&n.id) == Some(&0))
            .map(|n| n.id)
            .collect();
        let mut order = Vec::new();
        while let Some(id) = queue.pop_front() {
            order.push(id);
            for target in adjacency.get(&id).into_iter().flatten() {
                let degree = indegree
                    .get_mut(target)
                    .ok_or_else(|| invalid("unknown target"))?;
                *degree -= 1;
                if *degree == 0 {
                    queue.push_back(*target);
                }
            }
        }
        if order.len() != self.nodes.len() {
            return Err(invalid("cycle detected"));
        }
        // Infer all possible output types in dependency order. Conditional outputs
        // preserve the connected condition's types, plus the separate skip state.
        let mut output_types = HashMap::new();
        for id in &order {
            let node = self
                .nodes
                .iter()
                .find(|n| n.id == *id)
                .ok_or_else(|| invalid("missing node"))?;
            let schema = kinds
                .get(id)
                .ok_or_else(|| invalid("missing node schema"))?;
            let mut condition_types = None;
            for input in schema.input_specs() {
                if let Some(edge) = self
                    .edges
                    .iter()
                    .find(|e| e.target == *id && e.target_handle == input.name)
                {
                    let supplied: &Vec<crate::nodes::ValueType> = output_types
                        .get(&(edge.source, edge.source_handle.clone()))
                        .ok_or_else(|| invalid("missing source type"))?;
                    if supplied.iter().any(|t| !input.types.contains(t)) {
                        return Err(invalid("incompatible port types"));
                    }
                    if node.kind == "conditional" {
                        condition_types = Some(supplied.clone());
                    }
                }
            }
            for port in &schema.outputs {
                let types = condition_types
                    .clone()
                    .unwrap_or_else(|| schema.output_types(port, &node.config));
                output_types.insert((*id, port.clone()), types);
            }
        }
        Ok(AcyclicGraph { graph: self, order })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, specta::Type)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum RunStatus {
    Running,
    Completed,
    Failed {
        failed_node: Option<NodeId>,
        error: String,
    },
}
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct NodeResult {
    pub node_id: NodeId,
    pub outputs: HashMap<String, NodeValue>,
}
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionResult {
    pub id: String,
    pub flow_id: crate::flow::FlowId,
    pub status: RunStatus,
    pub started_at: String,
    pub finished_at: Option<String>,
    pub results: Vec<NodeResult>,
    pub order: Vec<NodeId>,
}

impl AcyclicGraph {
    pub fn topological(&self) -> Vec<NodeId> {
        self.order.clone()
    }
    pub(crate) fn execute_with(
        &self,
        generate: &dyn Fn(&crate::contract::ModelSettings, &str, &str) -> Result<String, String>,
    ) -> (RunStatus, Vec<NodeResult>) {
        let mut store: HashMap<NodeId, HashMap<String, NodeValue>> = HashMap::new();
        let mut results = Vec::new();
        for id in &self.order {
            let Some(node) = self.graph.nodes.iter().find(|n| n.id == *id) else {
                return (
                    RunStatus::Failed {
                        failed_node: Some(*id),
                        error: "validated node missing".into(),
                    },
                    results,
                );
            };
            let mut inputs = HashMap::new();
            for edge in self.graph.edges.iter().filter(|e| e.target == *id) {
                let Some(value) = store
                    .get(&edge.source)
                    .and_then(|o| o.get(&edge.source_handle))
                else {
                    return (
                        RunStatus::Failed {
                            failed_node: Some(*id),
                            error: "upstream output missing".into(),
                        },
                        results,
                    );
                };
                // Transitional compatibility with conditional implementations that
                // predate Skipped. Ordinary Null is never interpreted as a skip.
                let legacy_branch_null = matches!(value, NodeValue::Null)
                    && self
                        .graph
                        .nodes
                        .iter()
                        .any(|n| n.id == edge.source && n.kind == "conditional");
                inputs.insert(
                    edge.target_handle.clone(),
                    if legacy_branch_null {
                        NodeValue::Skipped
                    } else {
                        value.clone()
                    },
                );
            }
            let schemas = all_schemas();
            let Some(schema) = schemas.iter().find(|s| s.kind == node.kind) else {
                return (
                    RunStatus::Failed {
                        failed_node: Some(*id),
                        error: "validated schema missing".into(),
                    },
                    results,
                );
            };
            if inputs.values().any(|v| matches!(v, NodeValue::Skipped)) {
                let outputs: HashMap<_, _> = schema
                    .outputs
                    .iter()
                    .map(|p| (p.clone(), NodeValue::Skipped))
                    .collect();
                store.insert(*id, outputs.clone());
                results.push(NodeResult {
                    node_id: *id,
                    outputs,
                });
                continue;
            }
            for spec in schema.input_specs() {
                if let Some(value) = inputs.get(&spec.name) {
                    if !spec.types.iter().any(|t| t.accepts(value)) {
                        return (
                            RunStatus::Failed {
                                failed_node: Some(*id),
                                error: format!("wrong input type for {}", spec.name),
                            },
                            results,
                        );
                    }
                }
            }
            let output = if node.kind == "llm_prompt" {
                crate::nodes::llm_prompt::execute_with(&node.config, NodeInputs(inputs), generate)
            } else {
                execute_node(&node.kind, &node.config, NodeInputs(inputs))
            };
            match output {
                Ok(output) => {
                    store.insert(*id, output.0.clone());
                    results.push(NodeResult {
                        node_id: *id,
                        outputs: output.0,
                    });
                }
                Err(error) => {
                    return (
                        RunStatus::Failed {
                            failed_node: Some(*id),
                            error: error.to_string(),
                        },
                        results,
                    )
                }
            }
        }
        (RunStatus::Completed, results)
    }
}

#[cfg(test)]
mod graph_contract_tests {
    use super::*;
    fn node(kind: &str) -> FlowNode {
        FlowNode {
            id: NodeId::mint(),
            kind: kind.into(),
            config: HashMap::new(),
            x: 0.,
            y: 0.,
        }
    }
    fn edge(source: &FlowNode, output: &str, target: &FlowNode, input: &str) -> FlowEdge {
        FlowEdge {
            source: source.id,
            source_handle: output.into(),
            target: target.id,
            target_handle: input.into(),
        }
    }
    fn fails(graph: Graph, expected: &str) {
        assert!(graph.validate().unwrap_err().to_string().contains(expected));
    }

    #[test]
    fn graph_identity_ports_and_ownership_are_checked_before_execution() {
        let source = node("text_input");
        let target = node("transform");
        fails(Graph::default(), "empty graph");
        fails(
            Graph {
                nodes: vec![source.clone(), source.clone()],
                edges: vec![],
            },
            "duplicate node ID",
        );
        fails(
            Graph {
                nodes: vec![node("unknown")],
                edges: vec![],
            },
            "unknown node kind",
        );
        fails(
            Graph {
                nodes: vec![source.clone()],
                edges: vec![edge(&node("text_input"), "text", &source, "text")],
            },
            "unknown source",
        );
        fails(
            Graph {
                nodes: vec![source.clone()],
                edges: vec![edge(&source, "text", &node("transform"), "text")],
            },
            "unknown target",
        );
        fails(
            Graph {
                nodes: vec![source.clone(), target.clone()],
                edges: vec![edge(&source, "unknown", &target, "text")],
            },
            "unknown port",
        );
        let connection = edge(&source, "text", &target, "text");
        fails(
            Graph {
                nodes: vec![source.clone(), target.clone()],
                edges: vec![connection.clone(), connection],
            },
            "more than once",
        );
        fails(
            Graph {
                nodes: vec![target.clone()],
                edges: vec![],
            },
            "requires connected input",
        );
        fails(
            Graph {
                nodes: vec![target.clone()],
                edges: vec![edge(&target, "result", &target, "text")],
            },
            "cycle detected",
        );
        let join = node("join_text");
        fails(
            Graph {
                nodes: vec![source.clone(), join.clone()],
                edges: vec![edge(&source, "text", &join, "list")],
            },
            "incompatible port types",
        );
        let valid = Graph {
            nodes: vec![target.clone(), source.clone()],
            edges: vec![edge(&source, "text", &target, "text")],
        }
        .validate()
        .unwrap();
        assert_eq!(valid.topological(), vec![source.id, target.id]);
        assert!(matches!(
            valid
                .execute_with(&|_, _, _| Err("must not infer".into()))
                .0,
            RunStatus::Completed
        ));
    }
}
