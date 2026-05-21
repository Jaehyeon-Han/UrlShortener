variable "aws_profile" {}
variable "shorten_lambda_role_name" {}
variable "authorize_lambda_role_name" {}
variable "getOriginalUrl_lambda_role_name" {}
variable "secret" {
  type      = string
  sensitive = true
}
variable "discord_webhook_url" {
  type      = string
  sensitive = true
}
