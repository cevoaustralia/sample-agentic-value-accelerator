terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

locals {
  table_name         = "${var.name_prefix}-service-approval"
  bucket_name        = "${var.name_prefix}-service-approval-artifacts"
  ecr_repo_name      = "${var.name_prefix}-service-approval-runner"
  log_group_name     = "/aws/ecs/${var.name_prefix}-service-approval-runner"
  state_machine_name = "${var.name_prefix}-service-approval-runner"
  effective_image    = var.runner_image != "" ? var.runner_image : "${aws_ecr_repository.runner.repository_url}:${var.image_tag}"
  cluster_arn        = var.ecs_cluster_arn != "" ? var.ecs_cluster_arn : aws_ecs_cluster.runner[0].arn
}

# Dedicated cluster when caller doesn't pass one — avoids a cycle with the
# main control-plane ECS module while still letting Step Functions launch the
# task on Fargate.
resource "aws_ecs_cluster" "runner" {
  count = var.ecs_cluster_arn == "" ? 1 : 0
  name  = "${var.name_prefix}-service-approval"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = merge(var.tags, { Name = "${var.name_prefix}-service-approval" })
}

resource "aws_ecs_cluster_capacity_providers" "runner" {
  count              = var.ecs_cluster_arn == "" ? 1 : 0
  cluster_name       = aws_ecs_cluster.runner[0].name
  capacity_providers = ["FARGATE"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
  }
}

# ----------------------------------------------------------------------------
# DynamoDB — runs table (one item per pipeline run)
# ----------------------------------------------------------------------------

resource "aws_dynamodb_table" "runs" {
  name         = local.table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  attribute {
    name = "pk"
    type = "S"
  }
  attribute {
    name = "sk"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(var.tags, { Name = local.table_name })
}

# ----------------------------------------------------------------------------
# S3 — per-phase artifacts (slug/<phase>/...)
# ----------------------------------------------------------------------------

resource "aws_s3_bucket" "artifacts" {
  bucket        = local.bucket_name
  force_destroy = false
  tags          = merge(var.tags, { Name = local.bucket_name })
}

resource "aws_s3_bucket_public_access_block" "artifacts" {
  bucket                  = aws_s3_bucket.artifacts.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ----------------------------------------------------------------------------
# ECR — runner image
# ----------------------------------------------------------------------------

resource "aws_ecr_repository" "runner" {
  name                 = local.ecr_repo_name
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(var.tags, { Name = local.ecr_repo_name })
}

# ----------------------------------------------------------------------------
# CloudWatch Logs
# ----------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "runner" {
  name              = local.log_group_name
  retention_in_days = var.log_retention_days
  tags              = var.tags
}

# ----------------------------------------------------------------------------
# IAM — task execution + task role
# ----------------------------------------------------------------------------

data "aws_iam_policy_document" "ecs_task_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# Task execution role — pulls the image, writes logs
resource "aws_iam_role" "task_execution" {
  name               = "${var.name_prefix}-sa-runner-exec"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume.json
  tags               = var.tags
}

resource "aws_iam_role_policy_attachment" "task_execution" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Task role — runtime permissions
resource "aws_iam_role" "task" {
  name               = "${var.name_prefix}-sa-runner-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume.json
  tags               = var.tags
}

data "aws_iam_policy_document" "task" {
  statement {
    sid    = "Artifacts"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket",
    ]
    resources = [
      aws_s3_bucket.artifacts.arn,
      "${aws_s3_bucket.artifacts.arn}/*",
    ]
  }
  statement {
    sid    = "Runs"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:Query",
    ]
    resources = [aws_dynamodb_table.runs.arn]
  }
  statement {
    sid    = "BedrockInvoke"
    effect = "Allow"
    actions = [
      "bedrock:InvokeModel",
      "bedrock:InvokeModelWithResponseStream",
      "bedrock:Converse",
      "bedrock:ConverseStream",
    ]
    resources = ["*"]
  }
  statement {
    sid       = "Logs"
    effect    = "Allow"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.runner.arn}:*"]
  }
  statement {
    sid    = "ECSExec"
    effect = "Allow"
    actions = [
      "ssmmessages:CreateControlChannel",
      "ssmmessages:CreateDataChannel",
      "ssmmessages:OpenControlChannel",
      "ssmmessages:OpenDataChannel",
    ]
    resources = ["*"]
  }
}

# The plugin's MCP servers (aws-documentation, awsiac, iam, awsknowledge)
# issue read-only describe/list calls against the target AWS service to
# verify capability claims. ReadOnlyAccess is the simplest correct grant —
# tighten with an SCP later if needed.
resource "aws_iam_role_policy_attachment" "task_readonly" {
  role       = aws_iam_role.task.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

resource "aws_iam_role_policy" "task" {
  name   = "${var.name_prefix}-sa-runner-task"
  role   = aws_iam_role.task.id
  policy = data.aws_iam_policy_document.task.json
}

# ----------------------------------------------------------------------------
# ECS Task Definition (Fargate) — single container runs the full pipeline
# ----------------------------------------------------------------------------

resource "aws_ecs_task_definition" "runner" {
  family                   = "${var.name_prefix}-service-approval-runner"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = tostring(var.task_cpu)
  memory                   = tostring(var.task_memory)
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([
    {
      name      = "runner"
      image     = local.effective_image
      essential = true
      environment = [
        { name = "AWS_REGION", value = data.aws_region.current.name },
        { name = "SERVICE_APPROVAL_TABLE", value = aws_dynamodb_table.runs.name },
        { name = "SERVICE_APPROVAL_BUCKET", value = aws_s3_bucket.artifacts.bucket },
        { name = "BEDROCK_MODEL_ID", value = var.bedrock_model_id },
        { name = "CLAUDE_CODE_USE_BEDROCK", value = "1" },
        { name = "ANTHROPIC_MODEL", value = var.bedrock_model_id },
        { name = "DISABLE_TELEMETRY", value = "1" },
        { name = "DISABLE_AUTOUPDATER", value = "1" },
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.runner.name
          awslogs-region        = data.aws_region.current.name
          awslogs-stream-prefix = "runner"
        }
      }
    }
  ])

  tags = var.tags
}

# Security group attached to the runner ENI
resource "aws_security_group" "runner" {
  name        = "${var.name_prefix}-sa-runner"
  description = "Service-approval runner egress"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, { Name = "${var.name_prefix}-sa-runner" })
}

# ----------------------------------------------------------------------------
# Step Functions state machine — runs ECS task once per execution
# ----------------------------------------------------------------------------

data "aws_iam_policy_document" "sfn_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["states.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "sfn" {
  name               = "${var.name_prefix}-sa-sfn"
  assume_role_policy = data.aws_iam_policy_document.sfn_assume.json
  tags               = var.tags
}

data "aws_iam_policy_document" "sfn" {
  statement {
    sid    = "RunTask"
    effect = "Allow"
    actions = [
      "ecs:RunTask",
      "ecs:StopTask",
      "ecs:DescribeTasks",
    ]
    resources = ["*"]
  }
  statement {
    sid       = "PassRoles"
    effect    = "Allow"
    actions   = ["iam:PassRole"]
    resources = [aws_iam_role.task.arn, aws_iam_role.task_execution.arn]
  }
  statement {
    sid    = "EventsForSync"
    effect = "Allow"
    actions = [
      "events:PutTargets",
      "events:PutRule",
      "events:DescribeRule",
    ]
    resources = ["arn:aws:events:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:rule/StepFunctionsGetEventsForECSTaskRule"]
  }
  statement {
    sid    = "Updates"
    effect = "Allow"
    actions = [
      "dynamodb:UpdateItem",
      "dynamodb:PutItem",
    ]
    resources = [aws_dynamodb_table.runs.arn]
  }
}

resource "aws_iam_role_policy" "sfn" {
  name   = "${var.name_prefix}-sa-sfn"
  role   = aws_iam_role.sfn.id
  policy = data.aws_iam_policy_document.sfn.json
}

resource "aws_sfn_state_machine" "runner" {
  name     = local.state_machine_name
  role_arn = aws_iam_role.sfn.arn
  type     = "STANDARD"

  definition = jsonencode({
    Comment        = "Service-approval pipeline — runs the runner Fargate task once per execution"
    StartAt        = "RunRunner"
    TimeoutSeconds = var.task_timeout_minutes * 60
    States = {
      RunRunner = {
        Type     = "Task"
        Resource = "arn:aws:states:::ecs:runTask.sync"
        Parameters = {
          Cluster              = local.cluster_arn
          TaskDefinition       = aws_ecs_task_definition.runner.arn
          LaunchType           = "FARGATE"
          EnableExecuteCommand = true
          NetworkConfiguration = {
            AwsvpcConfiguration = {
              Subnets        = var.private_subnet_ids
              SecurityGroups = [aws_security_group.runner.id]
              AssignPublicIp = "DISABLED"
            }
          }
          Overrides = {
            ContainerOverrides = [
              {
                Name = "runner"
                Environment = [
                  { Name = "SLUG", "Value.$" = "$.slug" },
                  { Name = "SERVICE", "Value.$" = "$.service" },
                  { Name = "FRAMEWORK", "Value.$" = "$.framework" },
                  { Name = "TESTING_MODE", "Value.$" = "$.testing_mode" },
                ]
              }
            ]
          }
        }
        End = true
      }
    }
  })

  tags = var.tags
}
