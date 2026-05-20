provider "aws" {
  region = "us-east-1"
  profile = var.aws_profile
}

resource "aws_dynamodb_table" "url_table" {
  name         = "UrlMapping"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "shortCode"

  attribute {
    name = "shortCode"
    type = "S"
  }
  
  attribute {
    name = "originalUrl"
    type = "S"
  }
  
  global_secondary_index {
    name = "long_url_idx"
    key_schema {
      attribute_name = "originalUrl"
      key_type = "HASH"
    }
    projection_type = "ALL"
  }
}