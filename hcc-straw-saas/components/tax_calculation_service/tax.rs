pub struct TaxService;

impl TaxService {
    pub fn calculate_vat(amount: f64, country_code: &str) -> f64 {
        let rate = match country_code {
            "UK" => 0.20,
            "DE" => 0.19,
            "FR" => 0.20,
            _ => 0.0,
        };
        amount * rate
    }

    pub fn calculate_sales_tax(amount: f64, state: &str) -> f64 {
        let rate = match state {
            "NY" => 0.08875,
            "CA" => 0.0725,
            _ => 0.0,
        };
        amount * rate
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tax_calculations() {
        assert_eq!(TaxService::calculate_vat(100.0, "UK"), 20.0);
        assert_eq!(TaxService::calculate_sales_tax(100.0, "NY"), 8.875);
    }
}
