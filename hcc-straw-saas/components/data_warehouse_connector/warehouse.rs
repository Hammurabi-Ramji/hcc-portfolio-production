pub enum WarehouseType {
    Snowflake,
    BigQuery,
    Redshift,
}

pub struct WarehouseConnector {
    w_type: WarehouseType,
}

impl WarehouseConnector {
    pub fn new(w_type: WarehouseType) -> Self {
        Self { w_type }
    }

    pub fn execute_query(&self, sql: &str) -> String {
        let name = match self.w_type {
            WarehouseType::Snowflake => "Snowflake",
            WarehouseType::BigQuery => "BigQuery",
            WarehouseType::Redshift => "Redshift",
        };
        format!("Executing query on {}: {}", name, sql)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_warehouse_query() {
        let connector = WarehouseConnector::new(WarehouseType::Snowflake);
        let res = connector.execute_query("SELECT * FROM sales");
        assert!(res.contains("Snowflake"));
    }
}
