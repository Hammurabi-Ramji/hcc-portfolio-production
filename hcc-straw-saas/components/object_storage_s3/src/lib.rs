pub struct S3Storage {
    bucket: String,
}

impl S3Storage {
    pub fn new(bucket: &str) -> Self {
        Self { bucket: bucket.to_string() }
    }

    pub fn upload(&self, key: &str, _data: Vec<u8>) -> String {
        format!("https://{}.s3.amazonaws.com/{}", self.bucket, key)
    }

    pub fn delete(&self, key: &str) {
        println!("Deleting {} from bucket {}", key, self.bucket);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_s3_upload() {
        let s3 = S3Storage::new("my-assets");
        let url = s3.upload("img.png", vec![0, 1, 2]);
        assert!(url.contains("my-assets.s3.amazonaws.com/img.png"));
    }
}
