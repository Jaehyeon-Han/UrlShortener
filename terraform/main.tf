provider "aws" {
  region  = "us-east-1"
  profile = var.aws_profile
}

data "aws_iam_role" "shorten_lambda_role" {
  name = var.shorten_lambda_role_name
}

data "aws_iam_role" "get_original_lambda_role" {
  name = var.getOriginalUrl_lambda_role_name
}

data "aws_iam_role" "authorize_lambda_role" {
  name = var.authorize_lambda_role_name
}

// --- DynamoDB

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
      key_type       = "HASH"
    }
    projection_type = "ALL"
  }
}

// --- Lambda Functions

resource "aws_lambda_function" "shorten_url" {
  function_name = "shortenUrl"

  role    = data.aws_iam_role.shorten_lambda_role.arn
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

resource "aws_lambda_function" "get_original_url" {
  function_name = "getOriginalUrl"

  role    = data.aws_iam_role.get_original_lambda_role.arn
  handler = "index.handler"
  runtime = "nodejs24.x"

  filename         = "dummy.zip"
  source_code_hash = filebase64sha256("dummy.zip")

  environment {
    variables = {
      DISCORD_WEBHOOK_URL = var.discord_webhook_url
    }
  }

  lifecycle {
    ignore_changes = [
      filename,
      source_code_hash
    ]
  }
}

resource "aws_lambda_function" "authorizer" {
  function_name = "authorizeUrlShortening"

  role    = data.aws_iam_role.authorize_lambda_role.arn
  handler = "index.handler"
  runtime = "nodejs24.x"

  filename         = "dummy.zip"
  source_code_hash = filebase64sha256("dummy.zip")

  environment {
    variables = {
      SECRET = var.secret
    }
  }

  lifecycle {
    ignore_changes = [
      filename,
      source_code_hash
    ]
  }
}

// --- API Gateway

resource "aws_apigatewayv2_api" "url_shortener" {
  name                         = "UrlShortener"
  protocol_type                = "HTTP"
  disable_execute_api_endpoint = true
}

resource "aws_apigatewayv2_integration" "shorten" {
  api_id = aws_apigatewayv2_api.url_shortener.id

  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.shorten_url.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "redirect" {
  api_id = aws_apigatewayv2_api.url_shortener.id

  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_original_url.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "shorten" {
  api_id             = aws_apigatewayv2_api.url_shortener.id
  route_key          = "POST /shorten"
  target             = "integrations/${aws_apigatewayv2_integration.shorten.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.shorten_authorizer.id
}

resource "aws_apigatewayv2_route" "redirect" {
  api_id    = aws_apigatewayv2_api.url_shortener.id
  route_key = "GET /{shortCode}"
  target    = "integrations/${aws_apigatewayv2_integration.redirect.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.url_shortener.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit = 1
    throttling_rate_limit  = 1
  }
}

resource "aws_apigatewayv2_authorizer" "shorten_authorizer" {
  api_id = aws_apigatewayv2_api.url_shortener.id

  name            = "admin"
  authorizer_type = "REQUEST"

  authorizer_uri = aws_lambda_function.authorizer.invoke_arn

  authorizer_payload_format_version = "2.0"

  identity_sources = [
    "$request.header.x-Api-Key"
  ]

  enable_simple_responses = false
}

resource "aws_lambda_permission" "shorten" {
  statement_id  = "9cb5bc0b-7f0d-5a17-a3b3-7d578bd63594"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.shorten_url.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.url_shortener.execution_arn}/*/*/shorten"
  // {execution_arn}/{stage}/{method}/{path}
}

resource "aws_lambda_permission" "redirect" {
  statement_id  = "54472628-5f49-54c4-aa34-596aea91911d"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_original_url.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.url_shortener.execution_arn}/*/*/{shortCode}"
}

resource "aws_lambda_permission" "authorizer" {
  statement_id  = "c9b8a133-8a93-5cb4-9125-86f6604c9d65"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.authorizer.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.url_shortener.execution_arn}/authorizers/${aws_apigatewayv2_authorizer.shorten_authorizer.id}"
}
