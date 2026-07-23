# Requirements Document

## Introduction

This feature establishes a GitHub Actions CI/CD pipeline for the Control Plane deployment and provides a diagnostic/fix strategy for the dataset access issue affecting FSI Foundry samples deployed via the UI. The Control Plane consists of Terraform infrastructure (13+ modules), a FastAPI backend on ECS Fargate, a React frontend on S3/CloudFront, and Cognito authentication. The FSI Foundry UI deployment (Step Functions → CodeBuild → Terraform) is already functional but deployed samples cannot access their dataset in S3.

## Glossary

- **Control_Plane**: The platform management layer comprising Terraform infrastructure, FastAPI backend (Docker on ECS Fargate), React frontend (S3 + CloudFront), and Cognito authentication
- **CI_CD_Pipeline**: The GitHub Actions workflow that automates the Control Plane deployment process
- **Deploy_Full_Script**: The existing `platform/control_plane/infrastructure/scripts/deploy-full.sh` script that performs the 6-step deployment sequence
- **Terraform_Step**: The infrastructure provisioning phase that runs `terraform init`, `plan`, and `apply` across 13+ modules
- **ECS_Service**: The AWS ECS Fargate service running the FastAPI backend container
- **Frontend_Bundle**: The React application built with Vite and deployed to S3 with CloudFront distribution
- **ECR_Repository**: The AWS Elastic Container Registry storing the backend Docker image
- **CloudFront_Distribution**: The CDN distribution serving the React frontend
- **FSI_Foundry_Deployment**: The UI-triggered deployment of FSI Foundry agentic systems via Step Functions → CodeBuild → Terraform
- **CodeBuild_Role**: The IAM role (`{name_prefix}-codebuild-role`) used by CodeBuild during FSI Foundry deployments
- **Data_Bucket**: The S3 bucket created by the shared IaC module (`ava-{use_case_id}-{framework_short}-data-{suffix}-{random}`) that stores sample data
- **Sample_Data**: JSON, PDF, CSV, and other files in `applications/fsi_foundry/data/samples/` uploaded to S3 during Terraform apply via `aws_s3_object` resources
- **Shared_IaC_Module**: The Terraform module at `applications/fsi_foundry/foundations/iac/shared/` that provisions the Data_Bucket and uploads Sample_Data
- **Data_Path_Variable**: The `data_path` Terraform variable that overrides the default relative path for sample data location, required when `path.module` resolves through symlinks in CodeBuild

## Requirements

### Requirement 1: GitHub Actions Workflow Structure

**User Story:** As a platform engineer, I want an automated CI/CD pipeline for the Control Plane, so that deployments are repeatable, auditable, and do not require manual script execution.

#### Acceptance Criteria

1. THE CI_CD_Pipeline SHALL define a GitHub Actions workflow file at `.github/workflows/deploy-control-plane.yml`
2. WHEN a push is made to the `main` branch with changes in `platform/control_plane/`, THE CI_CD_Pipeline SHALL trigger automatically
3. THE CI_CD_Pipeline SHALL support manual triggering via `workflow_dispatch` with an optional environment input parameter
4. THE CI_CD_Pipeline SHALL execute the deployment steps in sequential order: Terraform_Step, Docker build and push, ECS deployment, Frontend build, S3 sync, and CloudFront invalidation

### Requirement 2: Pipeline Authentication and Secrets

**User Story:** As a platform engineer, I want the pipeline to authenticate securely with AWS, so that credentials are never stored in code or logs.

#### Acceptance Criteria

1. THE CI_CD_Pipeline SHALL authenticate to AWS using OIDC federation via a GitHub Actions IAM role
2. THE CI_CD_Pipeline SHALL retrieve the AWS account ID and region from GitHub Actions secrets or environment variables
3. THE CI_CD_Pipeline SHALL mask all sensitive outputs including ECR repository URLs, Cognito pool IDs, and API endpoints in workflow logs
4. IF OIDC authentication fails, THEN THE CI_CD_Pipeline SHALL terminate the workflow with a descriptive error message within 30 seconds

### Requirement 3: Terraform Infrastructure Step

**User Story:** As a platform engineer, I want Terraform to run in the pipeline with state management, so that infrastructure changes are applied consistently.

#### Acceptance Criteria

1. THE CI_CD_Pipeline SHALL run `terraform init` with backend configuration pointing to the S3 state bucket and DynamoDB lock table
2. THE CI_CD_Pipeline SHALL run `terraform plan` and output the plan summary as a workflow annotation
3. WHEN the workflow is triggered on the `main` branch, THE CI_CD_Pipeline SHALL run `terraform apply` with auto-approve after a successful plan
4. THE CI_CD_Pipeline SHALL capture Terraform outputs (ECR repository URL, frontend bucket name, CloudFront distribution ID, API endpoint, Cognito pool ID, Cognito client ID, ECS cluster name, ECS service name) for use in subsequent steps
5. IF `terraform plan` detects no changes, THEN THE CI_CD_Pipeline SHALL skip the apply step and proceed to the next deployment phase

### Requirement 4: Backend Docker Build and Push

**User Story:** As a platform engineer, I want the backend container image built and pushed automatically, so that code changes are deployed without manual Docker operations.

#### Acceptance Criteria

1. THE CI_CD_Pipeline SHALL build the Docker image using `platform/control_plane/backend/Dockerfile` with the repository root as build context
2. THE CI_CD_Pipeline SHALL build the image for the `linux/amd64` platform architecture
3. THE CI_CD_Pipeline SHALL authenticate to ECR using `aws ecr get-login-password` before pushing
4. THE CI_CD_Pipeline SHALL tag the image with both `latest` and the Git SHA of the triggering commit
5. THE CI_CD_Pipeline SHALL push the tagged image to the ECR_Repository output from the Terraform_Step

### Requirement 5: ECS Rolling Deployment

**User Story:** As a platform engineer, I want ECS to perform a rolling deployment of the new container, so that the backend updates with zero downtime.

#### Acceptance Criteria

1. THE CI_CD_Pipeline SHALL trigger a new ECS deployment using `aws ecs update-service --force-new-deployment`
2. THE CI_CD_Pipeline SHALL wait for the ECS_Service to reach a stable state with a timeout of 10 minutes
3. IF the ECS_Service does not stabilize within 10 minutes, THEN THE CI_CD_Pipeline SHALL fail the workflow and output the service events for debugging

### Requirement 6: Frontend Build and Deploy

**User Story:** As a platform engineer, I want the React frontend built with correct environment variables and deployed to S3/CloudFront, so that UI changes go live automatically.

#### Acceptance Criteria

1. THE CI_CD_Pipeline SHALL generate a `.env.production` file containing VITE_API_URL, VITE_COGNITO_USER_POOL_ID, VITE_COGNITO_CLIENT_ID, and VITE_COGNITO_REGION from Terraform outputs
2. THE CI_CD_Pipeline SHALL run `npm install` and `npm run build` in the `platform/control_plane/frontend/` directory
3. THE CI_CD_Pipeline SHALL sync the built `dist/` directory to the Frontend_Bundle S3 bucket with the `--delete` flag
4. THE CI_CD_Pipeline SHALL create a CloudFront invalidation for `/*` on the CloudFront_Distribution
5. THE CI_CD_Pipeline SHALL wait for the CloudFront invalidation to complete before marking the step as successful

### Requirement 7: Pipeline Failure Handling and Notifications

**User Story:** As a platform engineer, I want clear failure reporting, so that deployment issues are diagnosed quickly.

#### Acceptance Criteria

1. IF any step in the CI_CD_Pipeline fails, THEN THE CI_CD_Pipeline SHALL stop execution of subsequent steps
2. IF the CI_CD_Pipeline fails, THEN THE CI_CD_Pipeline SHALL output a summary identifying the failed step and relevant error context
3. THE CI_CD_Pipeline SHALL set the overall workflow status to failed when any deployment step fails
4. THE CI_CD_Pipeline SHALL retain workflow logs for a minimum of 30 days

### Requirement 8: Dataset Access Diagnostic Checklist

**User Story:** As a platform engineer, I want a structured diagnostic checklist for the dataset access issue, so that I can systematically identify why UI-deployed FSI Foundry samples cannot access their data.

#### Acceptance Criteria

1. THE CI_CD_Pipeline documentation SHALL include a diagnostic checklist covering IAM permission verification for the CodeBuild_Role S3 access policy
2. THE diagnostic checklist SHALL include verification that the `data_path` variable resolves correctly in the CodeBuild environment where `path.module` traverses symlinks
3. THE diagnostic checklist SHALL include verification that Sample_Data objects exist in the Data_Bucket under the `samples/` prefix after Terraform apply completes
4. THE diagnostic checklist SHALL include verification that the S3 bucket name pattern (`ava-{use_case_id}-{framework_short}-data-{suffix}-{random}`) matches what the deployed agent runtime expects
5. THE diagnostic checklist SHALL include verification that the CodeBuild_Role has `s3:GetObject` and `s3:ListBucket` permissions on the dynamically-named Data_Bucket (not just the `fsi-*` wildcard pattern)
6. THE diagnostic checklist SHALL include verification that the deployment region matches the region where the Data_Bucket was provisioned

### Requirement 9: Dataset Access Fix — Data Path Resolution

**User Story:** As a platform engineer, I want the data upload to work reliably in CodeBuild, so that deployed samples always have their dataset available.

#### Acceptance Criteria

1. WHEN the Shared_IaC_Module is executed in CodeBuild, THE Shared_IaC_Module SHALL resolve the sample data path using the `data_path` variable rather than relying on `path.module` relative traversal
2. THE FSI_Foundry_Deployment buildspec SHALL pass an explicit `data_path` value pointing to the absolute workspace path of `applications/fsi_foundry/data/samples/` within the CodeBuild source directory
3. IF the `data_path` directory does not exist at the specified location, THEN THE Shared_IaC_Module SHALL fail the Terraform plan with a clear error message indicating the missing data directory

### Requirement 10: Dataset Access Fix — IAM Permissions

**User Story:** As a platform engineer, I want the CodeBuild role to have correct S3 permissions for dynamically-named buckets, so that Terraform can upload sample data during deployment.

#### Acceptance Criteria

1. THE CodeBuild_Role S3 policy SHALL grant `s3:PutObject`, `s3:GetObject`, `s3:ListBucket`, and `s3:GetBucketLocation` permissions on buckets matching the pattern `arn:aws:s3:::ava-*`
2. THE CodeBuild_Role S3 policy SHALL grant the same permissions on objects within those buckets (`arn:aws:s3:::ava-*/*`)
3. WHEN a new Data_Bucket is created by the Shared_IaC_Module, THE CodeBuild_Role SHALL have sufficient permissions to upload objects to the new bucket without requiring a separate IAM policy update
