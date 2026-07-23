# Implementation Plan: Deployment Strategy

## Overview

This plan implements two components: (1) a GitHub Actions CI/CD workflow for the Control Plane deployment, and (2) a dataset access fix for FSI Foundry by correcting the CodeBuild IAM policy and data path resolution. Tasks are ordered so infrastructure fixes land first, followed by the pipeline workflow, and finally integration wiring and validation.

## Tasks

- [ ] 1. Fix dataset access — IAM policy and data path resolution
  - [ ] 1.1 Update CodeBuild S3 IAM policy from `fsi-*` to `ava-*`
    - Modify `platform/control_plane/infrastructure/modules/codebuild/main.tf`
    - Change the S3 resource pattern from `arn:aws:s3:::fsi-*` and `arn:aws:s3:::fsi-*/*` to `arn:aws:s3:::ava-*` and `arn:aws:s3:::ava-*/*`
    - Add `s3:ListBucket` and `s3:GetBucketLocation` to the allowed actions alongside existing `s3:GetObject` and `s3:PutObject`
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ] 1.2 Add data path validation precondition in shared IaC module
    - Modify `applications/fsi_foundry/foundations/iac/shared/s3.tf`
    - Add a `null_resource` with a `precondition` lifecycle block that validates the `data_path` directory exists when explicitly provided
    - Ensure the error message clearly indicates the missing data directory path
    - _Requirements: 9.1, 9.3_

  - [ ] 1.3 Verify buildspec passes explicit `data_path` to Terraform
    - Review `platform/control_plane/infrastructure/modules/codebuild/buildspec.yml`
    - Ensure the buildspec sets `-var data_path=/tmp/workspace/data/samples` (or equivalent absolute path) when invoking Terraform for the shared module
    - If missing, add the explicit `data_path` variable assignment
    - _Requirements: 9.1, 9.2_

  - [ ]* 1.4 Write property test for IAM policy pattern matching
    - **Property 4: IAM policy covers all dynamically-named data buckets**
    - **Validates: Requirements 10.1, 10.2, 10.3**
    - Generate random bucket names following the `ava-{use_case_id_s3}-{framework_short_s3}-data-{suffix}-{random_hex}` convention
    - Assert each generated name matches the `arn:aws:s3:::ava-*` pattern

  - [ ]* 1.5 Write property test for data path resolution
    - **Property 3: Data path resolution uses explicit path when provided**
    - **Validates: Requirements 9.1**
    - For any non-empty `data_path`, assert the resolved path equals `data_path` exactly
    - For empty `data_path`, assert fallback to `${path.module}/../../data/samples`

- [ ] 2. Checkpoint — Validate dataset access fix
  - Ensure `terraform validate` passes on the modified codebuild module and shared IaC module, ask the user if questions arise.

- [ ] 3. Create GitHub Actions CI/CD workflow file
  - [ ] 3.1 Create workflow file with triggers and authentication
    - Create `.github/workflows/deploy-control-plane.yml`
    - Define `push` trigger on `main` branch with path filter `platform/control_plane/**`
    - Define `workflow_dispatch` trigger with `environment` choice input (production, staging)
    - Configure `permissions: id-token: write, contents: read` for OIDC
    - Set environment variables for `AWS_REGION`, `TF_STATE_BUCKET`, `TF_LOCK_TABLE` from secrets
    - Add OIDC authentication step using `aws-actions/configure-aws-credentials`
    - Set job `timeout-minutes: 45`
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2_

  - [ ] 3.2 Implement Terraform step with output capture
    - Add step to run `terraform init` with S3 backend config and DynamoDB lock table
    - Add step to run `terraform plan -out=tfplan` and capture `has_changes` output
    - Add conditional `terraform apply -auto-approve tfplan` step (skip if no changes)
    - Parse Terraform JSON outputs and set as step outputs (ecr_repo, frontend_bucket, cloudfront_id, api_endpoint, cognito_pool_id, cognito_client_id, ecs_cluster, ecs_service)
    - Mask sensitive values using `::add-mask::`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 2.3_

  - [ ] 3.3 Implement Docker build and ECR push step
    - Add ECR login step using `aws ecr get-login-password`
    - Build Docker image from `platform/control_plane/backend/Dockerfile` with `--platform linux/amd64`
    - Tag image with `latest` and `${{ github.sha }}`
    - Push both tags to the ECR repository from Terraform outputs
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 3.4 Implement ECS rolling deployment step
    - Add `aws ecs update-service --force-new-deployment` step referencing cluster and service from Terraform outputs
    - Add `aws ecs wait services-stable` with 600-second timeout
    - Add failure handler that outputs last 10 ECS service events for debugging
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 3.5 Implement frontend build and S3/CloudFront deploy step
    - Generate `.env.production` with VITE_API_URL, VITE_COGNITO_USER_POOL_ID, VITE_COGNITO_CLIENT_ID, VITE_COGNITO_REGION from Terraform outputs
    - Run `npm install` and `npm run build` in `platform/control_plane/frontend/`
    - Sync `dist/` to S3 frontend bucket with `--delete` flag
    - Create CloudFront invalidation for `/*` and wait for completion
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 3.6 Implement failure handling and summary step
    - Add `if: failure()` step that writes deployment failure summary to `$GITHUB_STEP_SUMMARY`
    - Include failed step name, commit SHA, and triggering actor in the summary
    - Ensure sequential step execution stops on first failure (default GitHub Actions behavior)
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 3.7 Write property test for Terraform output parsing
    - **Property 1: Terraform output parsing extracts all required keys**
    - **Validates: Requirements 3.4**
    - Generate valid Terraform output JSON with all 8 required keys containing random non-empty string values
    - Assert the parsing logic extracts all 8 values correctly and none are empty

  - [ ]* 3.8 Write property test for environment file generation
    - **Property 2: Environment file generation produces all required variables**
    - **Validates: Requirements 6.1**
    - Generate random non-empty strings for API URL, Cognito pool ID, client ID, and region
    - Assert the generated `.env.production` content contains exactly 4 VITE_ lines with correct values

- [ ] 4. Checkpoint — Validate workflow syntax
  - Ensure the workflow YAML is valid (run `actionlint` or YAML validation), ask the user if questions arise.

- [ ] 5. Create dataset access diagnostic checklist document
  - [ ] 5.1 Create diagnostic checklist markdown document
    - Create `docs/dataset-access-diagnostic.md`
    - Include sections for: IAM permission verification, data path resolution, S3 object existence check, bucket naming pattern validation, region consistency check
    - Reference the `ava-*` bucket pattern and the `data_path` variable
    - Include CLI commands for each verification step (e.g., `aws iam get-role-policy`, `aws s3 ls`)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 6. Final checkpoint — Ensure all changes are consistent
  - Ensure `terraform validate` passes on all modified modules, workflow YAML is syntactically valid, and documentation is complete. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The IAM policy fix (task 1.1) is the root cause of the dataset access issue — `fsi-*` pattern doesn't match `ava-*` buckets
- The workflow file (task 3.x) mirrors the existing `deploy-full.sh` sequence but in GitHub Actions format
- Terraform HCL and GitHub Actions YAML are the primary languages for this feature

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["1.4", "1.5", "3.1"] },
    { "id": 2, "tasks": ["3.2", "3.3"] },
    { "id": 3, "tasks": ["3.4", "3.5", "3.6"] },
    { "id": 4, "tasks": ["3.7", "3.8", "5.1"] }
  ]
}
```
