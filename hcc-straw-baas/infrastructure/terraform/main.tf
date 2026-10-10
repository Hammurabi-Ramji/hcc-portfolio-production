provider "aws" {
  region = "us-east-1"
}

resource "aws_db_instance" "holo9_db" {
  allocated_storage    = 20
  engine               = "postgres"
  engine_version       = "16"
  instance_class       = "db.t3.micro"
  name                 = "holo9_platform"
  username             = "holo9_admin"
  password             = var.db_password
  skip_final_snapshot  = true
}

resource "aws_elasticache_cluster" "holo9_redis" {
  cluster_id           = "holo9-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
}
