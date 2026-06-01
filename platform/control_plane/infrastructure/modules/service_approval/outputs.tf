output "table_name" {
  description = "DynamoDB table for service-approval runs"
  value       = aws_dynamodb_table.runs.name
}

output "table_arn" {
  description = "DynamoDB table ARN"
  value       = aws_dynamodb_table.runs.arn
}

output "bucket_name" {
  description = "S3 bucket holding per-phase artifacts"
  value       = aws_s3_bucket.artifacts.bucket
}

output "bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.artifacts.arn
}

output "ecr_repository_url" {
  description = "ECR repo for the runner image"
  value       = aws_ecr_repository.runner.repository_url
}

output "ecr_repository_name" {
  value = aws_ecr_repository.runner.name
}

output "task_definition_arn" {
  description = "ECS task definition ARN"
  value       = aws_ecs_task_definition.runner.arn
}

output "task_role_arn" {
  description = "Runner task role ARN"
  value       = aws_iam_role.task.arn
}

output "security_group_id" {
  description = "Runner security group id"
  value       = aws_security_group.runner.id
}

output "state_machine_arn" {
  description = "Step Functions state machine ARN"
  value       = aws_sfn_state_machine.runner.arn
}
