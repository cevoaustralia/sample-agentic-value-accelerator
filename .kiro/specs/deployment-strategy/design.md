# Design Document

## Overview

This document describes the architecture and implementation design for the Control Plane CI/CD pipeline (GitHub Actions) and the dataset access fix for FSI Foundry deployments. The pipeline automates the existing `deploy-full.sh` flow, while the dataset access fix addresses the root cause of UI-deployed samples being unable to access their S3 data: the CodeBuild role's S3 policy uses an `fsi-*` wildcard but actual buckets are named `ava-*`, and the `data_path` variable must be explicitly set in the CodeBuild environment.

## Architecture

The solution has two distinct components:

1. **CI/CD Pipeline** — A GitHub Actions workflow (`.github/workflows/deploy-control-plane.yml`) that mirrors the 6-step `deploy-full.sh` sequence: Terraform → Docker build/push → ECS rolling deploy → Frontend build → S3 sync → CloudFront invalidation.

2. **Dataset Access Fix** — Two targeted changes to the existing CodeBuild/Terraform infrastructure:
   - IAM policy update: change `fsi-*` to `ava-*` in the CodeBuild role's S3 access policy
   - Data path resolution: ensure the buildspec passes an explicit `data_path` variable and add a Terraform validation precondition

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GitHub Actions Workflow                        │
│  deploy-control-plane.yml                                            │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────────┤
│ Step 1   │ Step 2   │ Step 3   │ Step 4   │ Step 5   │ Step 6       │
│ Terraform│ Docker   │ ECS      │ Frontend │ S3 Sync  │ CloudFront   │
│ init/    │ build +  │ update-  │ npm      │ aws s3   │ invalidation │
│ plan/    │ push to  │ service  │ install  │ sync     │ /*           │
│ apply    │ ECR      │ --force  │ + build  │ --delete │              │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────────┘
         │                                                    │
         │  Terraform Outputs (ECR URL, bucket, CF ID, etc.)  │
         └────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     Dataset Access Fix                                │
├─────────────────────────────────┬───────────────────────────────────┤
│ IAM Policy Fix                  │ Data Path Fix                     │
│ codebuild/main.tf               │ shared/s3.tf + buildspec.yml      │
│ fsi-* → ava-*                   │ Explicit data_path variable       │
│ + add s3:ListBucket             │ + validation precondition         │
└─────────────────────────────────┴───────────────────────────────────┘
```

## Components and Interfaces

### Component 1: GitHub Actions Workflow File

**File:** `.github/workflows/deploy-control-plane.yml`

**Responsibilities:**
- Define triggers (push to main with path filter, workflow_dispatch)
- Configure OIDC authentication with AWS
- Orchestrate the 6-step deployment sequence
- Capture and pass Terraform outputs between steps
- Handle failures with descriptive summaries

**Structure:**

```yaml
name: Deploy Control Plane

on:
  push:
    branches: [main]
    paths:
      - 'platform/control_plane/**'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: false
        default: 'production'
        type: choice
        options:
          - production
          - staging

permissions:
  id-token: write
  contents: read

env:
  AWS_REGION: ${{ secrets.AWS_REGION }}
  TF_STATE_BUCKET: ${{ secrets.TF_STATE_BUCKET }}
  TF_LOCK_TABLE: ${{ secrets.TF_LOCK_TABLE }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 45
    steps:
      # Authentication, Terraform, Docker, ECS, Frontend steps...
```

### Component 2: Terraform Output Parser

**Location:** Inline within the workflow step (shell script)

**Responsibilities:**
- Extract Terraform JSON outputs after `terraform apply`
- Set GitHub Actions outputs for downstream steps
- Mask sensitive values in logs

**Interface:**

```bash
# After terraform apply, capture outputs as step outputs
terraform output -json > /tmp/tf_outputs.json

# Parse and set as GitHub Actions outputs
ECR_REPO=$(jq -r '.ecr_repository_url.value' /tmp/tf_outputs.json)
FRONTEND_BUCKET=$(jq -r '.frontend_bucket_name.value' /tmp/tf_outputs.json)
CLOUDFRONT_ID=$(jq -r '.cloudfront_distribution_id.value' /tmp/tf_outputs.json)
API_ENDPOINT=$(jq -r '.api_endpoint.value' /tmp/tf_outputs.json)
COGNITO_POOL_ID=$(jq -r '.cognito_user_pool_id.value' /tmp/tf_outputs.json)
COGNITO_CLIENT_ID=$(jq -r '.cognito_user_pool_client_id.value' /tmp/tf_outputs.json)
ECS_CLUSTER=$(jq -r '.ecs_cluster_name.value' /tmp/tf_outputs.json)
ECS_SERVICE=$(jq -r '.ecs_service_name.value' /tmp/tf_outputs.json)

# Mask sensitive values
echo "::add-mask::$ECR_REPO"
echo "::add-mask::$COGNITO_POOL_ID"
echo "::add-mask::$COGNITO_CLIENT_ID"
echo "::add-mask::$API_ENDPOINT"

# Set outputs for subsequent steps
echo "ecr_repo=$ECR_REPO" >> $GITHUB_OUTPUT
echo "frontend_bucket=$FRONTEND_BUCKET" >> $GITHUB_OUTPUT
echo "cloudfront_id=$CLOUDFRONT_ID" >> $GITHUB_OUTPUT
echo "api_endpoint=$API_ENDPOINT" >> $GITHUB_OUTPUT
echo "cognito_pool_id=$COGNITO_POOL_ID" >> $GITHUB_OUTPUT
echo "cognito_client_id=$COGNITO_CLIENT_ID" >> $GITHUB_OUTPUT
echo "ecs_cluster=$ECS_CLUSTER" >> $GITHUB_OUTPUT
echo "ecs_service=$ECS_SERVICE" >> $GITHUB_OUTPUT
```

### Component 3: Environment File Generator

**Location:** Inline within the frontend build step

**Responsibilities:**
- Generate `.env.production` from Terraform outputs
- Ensure all required VITE_ variables are present

**Interface:**

```bash
# Generate .env.production for Vite build
cat > platform/control_plane/frontend/.env.production <<EOF
VITE_API_URL=${{ steps.terraform.outputs.api_endpoint }}
VITE_COGNITO_USER_POOL_ID=${{ steps.terraform.outputs.cognito_pool_id }}
VITE_COGNITO_CLIENT_ID=${{ steps.terraform.outputs.cognito_client_id }}
VITE_COGNITO_REGION=${{ env.AWS_REGION }}
EOF
```

### Component 4: IAM Policy Fix (CodeBuild S3 Access)

**File:** `platform/control_plane/infrastructure/modules/codebuild/main.tf`

**Change:** Update the `codebuild_s3` policy resource pattern from `fsi-*` to `ava-*` and add `s3:ListBucket` permission.

**Before:**
```hcl
Resource = [
  var.project_archives_bucket_arn,
  "${var.project_archives_bucket_arn}/*",
  "arn:aws:s3:::fsi-*",
  "arn:aws:s3:::fsi-*/*"
]
```

**After:**
```hcl
# Deployment data buckets (dynamically named ava-{use_case}-{framework}-data-{suffix}-{random})
{
  Effect = "Allow"
  Action = [
    "s3:GetObject",
    "s3:PutObject",
    "s3:ListBucket",
    "s3:GetBucketLocation"
  ]
  Resource = [
    "arn:aws:s3:::ava-*",
    "arn:aws:s3:::ava-*/*"
  ]
}
```

### Component 5: Data Path Resolution Fix

**File:** `applications/fsi_foundry/foundations/iac/shared/s3.tf`

**Change:** Add a Terraform `precondition` lifecycle check that validates the `data_path` directory exists when explicitly provided.

```hcl
# In the aws_s3_object.sample_data resource, add a precondition
resource "null_resource" "validate_data_path" {
  count = var.data_path != "" ? 1 : 0

  lifecycle {
    precondition {
      condition     = fileexists("${var.data_path}/.") || length(fileset(var.data_path, "*")) >= 0
      error_message = "The data_path directory '${var.data_path}' does not exist. Ensure the sample data directory is available in the CodeBuild workspace."
    }
  }
}
```

**Buildspec already sets data_path correctly** (verified in existing `buildspec.yml`):
```hcl
data_path = "/tmp/workspace/data/samples"
```

### Component 6: Diagnostic Checklist Document

**File:** `docs/dataset-access-diagnostic.md` (or inline in workflow README)

**Responsibilities:**
- Provide a structured troubleshooting guide for dataset access issues
- Cover IAM, data path, bucket naming, object existence, and region consistency

## Data Models

### Terraform Output Schema

The pipeline depends on these Terraform outputs being available after `terraform apply`:

| Output Key | Type | Description |
|---|---|---|
| `ecr_repository_url` | string | Full ECR repository URL for Docker push |
| `frontend_bucket_name` | string | S3 bucket name for frontend assets |
| `cloudfront_distribution_id` | string | CloudFront distribution ID for invalidation |
| `api_endpoint` | string | API Gateway endpoint URL |
| `cognito_user_pool_id` | string | Cognito User Pool ID |
| `cognito_user_pool_client_id` | string | Cognito App Client ID |
| `ecs_cluster_name` | string | ECS cluster name |
| `ecs_service_name` | string | ECS service name |

### S3 Bucket Naming Convention

Data buckets follow the pattern:
```
ava-{use_case_id_s3}-{framework_short_s3}-data-{deployment_suffix}-{random_hex}
```

Where:
- `use_case_id_s3`: lowercase, hyphens replacing underscores, truncated to 15 chars with hash if longer
- `framework_short_s3`: lowercase framework short name (e.g., `langgraph`, `strands`)
- `deployment_suffix`: deployment pattern identifier (e.g., `ec2`, `agentcore`, `sf`)
- `random_hex`: 8-character hex from `random_id.bucket_suffix`

### GitHub Actions Secrets Required

| Secret | Description |
|---|---|
| `AWS_REGION` | Target AWS region |
| `AWS_ACCOUNT_ID` | AWS account ID |
| `OIDC_ROLE_ARN` | IAM role ARN for OIDC federation |
| `TF_STATE_BUCKET` | S3 bucket for Terraform state |
| `TF_LOCK_TABLE` | DynamoDB table for Terraform state locking |

## Interfaces

### Workflow Triggers

```yaml
# Push trigger with path filter
on:
  push:
    branches: [main]
    paths:
      - 'platform/control_plane/**'

# Manual trigger with environment selection
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [production, staging]
```

### Step Output Interface

Steps communicate via `$GITHUB_OUTPUT`:

```
terraform step → outputs: ecr_repo, frontend_bucket, cloudfront_id, api_endpoint, cognito_pool_id, cognito_client_id, ecs_cluster, ecs_service
```

Subsequent steps reference these as `${{ steps.terraform.outputs.<key> }}`.

### IAM Policy Interface

The CodeBuild role's S3 policy uses wildcard resource patterns:
- `arn:aws:s3:::ava-*` — matches any bucket starting with `ava-`
- `arn:aws:s3:::ava-*/*` — matches any object in those buckets

This ensures new dynamically-named buckets are automatically covered without policy updates.

## Error Handling

### Pipeline Failure Strategy

1. **Sequential execution with fail-fast**: Each step depends on the previous. If any step fails, subsequent steps are skipped.
2. **Failure summary**: An `if: failure()` step at the end collects the failed step name and relevant context.
3. **Timeout protection**: The overall job has a 45-minute timeout. ECS stabilization has a 10-minute timeout.

```yaml
- name: Failure Summary
  if: failure()
  run: |
    echo "## Deployment Failed" >> $GITHUB_STEP_SUMMARY
    echo "**Failed step:** ${{ github.action }}" >> $GITHUB_STEP_SUMMARY
    echo "**Commit:** ${{ github.sha }}" >> $GITHUB_STEP_SUMMARY
    echo "**Triggered by:** ${{ github.actor }}" >> $GITHUB_STEP_SUMMARY
```

### ECS Stabilization Timeout

```yaml
- name: Wait for ECS stability
  run: |
    timeout 600 aws ecs wait services-stable \
      --cluster ${{ steps.terraform.outputs.ecs_cluster }} \
      --services ${{ steps.terraform.outputs.ecs_service }}
  continue-on-error: false

- name: ECS debug on failure
  if: failure()
  run: |
    aws ecs describe-services \
      --cluster ${{ steps.terraform.outputs.ecs_cluster }} \
      --services ${{ steps.terraform.outputs.ecs_service }} \
      --query 'services[0].events[:10]'
```

### Terraform No-Changes Handling

```yaml
- name: Terraform Apply
  if: steps.plan.outputs.has_changes == 'true'
  run: terraform apply -auto-approve tfplan
```

### Data Path Validation

When `data_path` is set but the directory doesn't exist, Terraform's `fileset()` will fail during plan with an error. The precondition adds a clearer error message:

```
Error: The data_path directory '/tmp/workspace/data/samples' does not exist.
Ensure the sample data directory is available in the CodeBuild workspace.
```

## Testing Strategy

### Unit Tests
- Validate workflow YAML structure (triggers, step ordering, secret references)
- Verify IAM policy JSON contains correct resource patterns and actions
- Test Terraform output parsing with sample JSON fixtures
- Test .env.production generation with various input combinations

### Integration Tests
- Run `terraform validate` on the modified CodeBuild module
- Run `terraform plan` on the shared IaC module with explicit `data_path` pointing to a test directory
- Validate the GitHub Actions workflow syntax using `actionlint`

### Property-Based Tests
- Terraform output parsing correctness across varied JSON structures
- Environment file generation completeness across varied inputs
- Data path resolution logic (explicit vs fallback)
- IAM policy pattern matching against dynamically-generated bucket names

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Terraform output parsing extracts all required keys

*For any* valid Terraform output JSON object containing the keys `ecr_repository_url`, `frontend_bucket_name`, `cloudfront_distribution_id`, `api_endpoint`, `cognito_user_pool_id`, `cognito_user_pool_client_id`, `ecs_cluster_name`, and `ecs_service_name`, the parsing function SHALL extract all eight values correctly and none shall be empty.

**Validates: Requirements 3.4**

### Property 2: Environment file generation produces all required variables

*For any* valid set of Terraform outputs (a non-empty API URL string, a non-empty Cognito pool ID, a non-empty Cognito client ID, and a non-empty AWS region), the generated `.env.production` content SHALL contain exactly four lines: `VITE_API_URL`, `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_CLIENT_ID`, and `VITE_COGNITO_REGION`, each with the corresponding value.

**Validates: Requirements 6.1**

### Property 3: Data path resolution uses explicit path when provided

*For any* non-empty `data_path` string, the resolved base path SHALL equal `data_path` exactly. *For any* empty `data_path` string, the resolved base path SHALL fall back to the `path.module`-relative default (`${path.module}/../../data/samples`).

**Validates: Requirements 9.1**

### Property 4: IAM policy covers all dynamically-named data buckets

*For any* bucket name generated by the naming convention `ava-{use_case_id_s3}-{framework_short_s3}-data-{suffix}-{random_hex}` (where `use_case_id_s3` is a lowercase hyphenated string ≤15 chars, `framework_short_s3` is a lowercase framework identifier, `suffix` is an alphanumeric deployment suffix, and `random_hex` is an 8-char hex string), the bucket name SHALL match the IAM policy resource pattern `arn:aws:s3:::ava-*` and the object pattern `arn:aws:s3:::ava-*/*`.

**Validates: Requirements 10.1, 10.2, 10.3**
