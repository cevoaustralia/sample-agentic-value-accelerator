variable "name_prefix" {
  description = "Resource name prefix"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC where the runner ECS task runs"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnets for the runner ECS task (must have NAT egress to reach Bedrock + S3)"
  type        = list(string)
}

variable "ecs_cluster_arn" {
  description = "Existing ECS cluster ARN to run the service-approval Fargate task on. If empty, the module creates its own dedicated cluster."
  type        = string
  default     = ""
}

variable "task_cpu" {
  description = "Fargate task CPU units. The runner ships Node + uv + the Claude CLI and runs a multi-skill plugin orchestration; 2 vCPU is the practical floor."
  type        = number
  default     = 2048
}

variable "task_memory" {
  description = "Fargate task memory (MiB). Bumped from 2 GiB so the plugin's parallel research sub-skills don't OOM."
  type        = number
  default     = 8192
}

variable "task_timeout_minutes" {
  description = "How long a single pipeline run is allowed to take before Step Functions stops the task."
  type        = number
  default     = 90
}

variable "runner_image" {
  description = "ECR image URI for the service-approval runner task. If empty, the image_tag-suffixed default is used and you push to it externally."
  type        = string
  default     = ""
}

variable "image_tag" {
  description = "Default image tag when runner_image is empty"
  type        = string
  default     = "latest"
}

variable "bedrock_model_id" {
  description = "Bedrock inference profile the Claude Code CLI uses for skill execution. Must support cross-region routing — the long-running pipeline relies on it."
  type        = string
  default     = "us.anthropic.claude-opus-4-7"
}

variable "log_retention_days" {
  description = "CloudWatch retention for runner task logs"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
