provider "aws" {
  region = "us-east-1"
  profile = var.aws_profile
}

data "aws_iam_role" "lambda_exec" {
  name = var.lambda_role_name
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

resource "aws_lambda_function" "shorten_url" {
  function_name = "shortenUrl"

  role    = data.aws_iam_role.lambda_exec.arn
  handler = "index.handler"
  runtime = "nodejs24.x"

  filename         = "dummy.zip"
  source_code_hash = filebase64sha256("dummy.zip")

  environment {
    variables = {
      BASE_URL   = "https://jhan.cc"
      TABLE_NAME = "UrlMapping"
    }
  }

  lifecycle {
    ignore_changes = [
      filename,
      source_code_hash
    ]
  }
}