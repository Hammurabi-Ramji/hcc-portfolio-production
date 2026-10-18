pub struct TimeSeriesPoint {
    pub measurement: String,
    pub value: f64,
    pub timestamp: i64,
}

pub struct InfluxClient;

impl InfluxClient {
    pub fn write_point(point: TimeSeriesPoint) {
        println!("[INFLUX] Writing {} = {} at {}", 
                 point.measurement, point.value, point.timestamp);
    }

    pub fn query_range(measurement: &str, start: i64, end: i64) -> Vec<f64> {
        println!("[INFLUX] Querying {} from {} to {}", measurement, start, end);
        vec![10.5, 12.2, 11.8]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_influx_write() {
        InfluxClient::write_point(TimeSeriesPoint {
            measurement: "cpu_usage".to_string(),
            value: 45.2,
            timestamp: 1625097600,
        });
    }
}
