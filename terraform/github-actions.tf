// GitHub Actions OIDC 인증용 IAM 리소스

resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = ["sts.amazonaws.com"]

  // GitHub OIDC CA 인증서 thumbprint (AWS가 자체 검증하므로 실질적으로 무시되지만 필수 필드)
  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd"
  ]
}

resource "aws_iam_role" "github_actions_deploy" {
  name = "github-actions-lambda-deploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:ref:refs/heads/main"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "github_actions_deploy" {
  name = "lambda-update-code"
  role = aws_iam_role.github_actions_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:UpdateFunctionCode",
          "lambda:GetFunctionConfiguration"
        ]
        Resource = [
          aws_lambda_function.shorten_url.arn,
          aws_lambda_function.get_original_url.arn
        ]
      }
    ]
  })
}

output "github_actions_role_arn" {
  description = "GitHub Actions Secret 'AWS_DEPLOY_ROLE_ARN'에 입력할 값"
  value       = aws_iam_role.github_actions_deploy.arn
}
