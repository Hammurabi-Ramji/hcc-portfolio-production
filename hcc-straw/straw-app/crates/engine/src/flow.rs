use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, specta::Type)]
#[serde(try_from = "String", into = "String")]
pub struct FlowId(Uuid);

impl FlowId {
    pub fn mint() -> Self {
        Self(Uuid::new_v4())
    }
}

impl TryFrom<String> for FlowId {
    type Error = String;
    fn try_from(value: String) -> Result<Self, Self::Error> {
        let id = Uuid::parse_str(&value).map_err(|_| "flow ID must be a UUID")?;
        if id.is_nil() {
            return Err("flow ID must not be nil".into());
        }
        Ok(Self(id))
    }
}
impl From<FlowId> for String {
    fn from(id: FlowId) -> Self {
        id.0.to_string()
    }
}
impl std::fmt::Display for FlowId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        self.0.fmt(f)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct FlowRecord {
    pub id: FlowId,
    pub name: String,
    pub definition: crate::dag::Graph,
    pub created_at: String,
    pub updated_at: String,
}

impl FlowRecord {
    pub fn new(name: String) -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        Self {
            id: FlowId::mint(),
            name,
            definition: Default::default(),
            created_at: now.clone(),
            updated_at: now,
        }
    }
}
