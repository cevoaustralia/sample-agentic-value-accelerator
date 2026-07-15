#!/bin/bash

# Full Control Plane Deployment Script
# Deploys infrastructure, backend, frontend, and creates a Cognito user.
# Prerequisites: AWS credentials exported, Docker running, Node.js installed, Terraform installed.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
INFRA_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$REPO_ROOT/platform/control_plane/backend"
FRONTEND_DIR="$REPO_ROOT/platform/control_plane/frontend"
RUNNER_DIR="$REPO_ROOT/platform/control_plane/service_approval_runner"

# ============================================================================
# Preflight Checks
# ============================================================================

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Control Plane Full Deployment${NC}"
echo -e "${BLUE}============================================${NC}"
echo

echo "Running preflight checks..."

# AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured. Export your credentials and try again.${NC}"
    exit 1
fi
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION="${AWS_REGION:-$(aws configure get region 2>/dev/null || echo "us-east-1")}"
echo -e "${GREEN}  AWS account: ${AWS_ACCOUNT} (${AWS_REGION})${NC}"

# Docker
if ! docker info &> /dev/null; then
    echo -e "${RED}Error: Docker is not running.${NC}"
    exit 1
fi
echo -e "${GREEN}  Docker: running${NC}"

# Terraform
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}Error: Terraform is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}  Terraform: $(terraform version -json | python3 -c "import sys,json;print(json.load(sys.stdin)['terraform_version'])")${NC}"

# Node
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}  Node: $(node --version)${NC}"

echo

# ============================================================================
# Step 1: Terraform
# ============================================================================

echo -e "${BLUE}[1/7] Infrastructure${NC}"

cd "$INFRA_DIR"

if [ ! -f terraform.tfvars ]; then
    echo "Creating terraform.tfvars from example..."
    cp terraform.tfvars.example terraform.tfvars
fi

# Check for stale terraform state from a different AWS account
if [ -f terraform.tfstate ]; then
    STATE_ACCOUNT=$(python3 -c "
import json, sys
try:
    with open('terraform.tfstate') as f:
        state = json.load(f)
    for r in state.get('resources', []):
        for i in r.get('instances', []):
            arn = i.get('attributes', {}).get('arn', '')
            if ':' in arn:
                parts = arn.split(':')
                if len(parts) >= 5 and parts[4]:
                    print(parts[4])
                    sys.exit(0)
except Exception:
    pass
" 2>/dev/null)

    if [ -n "$STATE_ACCOUNT" ] && [ "$STATE_ACCOUNT" != "$AWS_ACCOUNT" ]; then
        echo -e "${YELLOW}  Existing terraform state references account ${STATE_ACCOUNT}${NC}"
        echo -e "${YELLOW}  but current credentials are for account ${AWS_ACCOUNT}.${NC}"
        echo
        read -p "  Back up and reset state for clean deployment? (yes/no): " reset_state
        if [ "$reset_state" = "yes" ]; then
            backup="terraform.tfstate.backup.${STATE_ACCOUNT}.$(date +%Y%m%d%H%M%S)"
            mv terraform.tfstate "$backup"
            [ -f terraform.tfstate.backup ] && mv terraform.tfstate.backup "${backup}.prev"
            echo -e "${GREEN}  State backed up to ${backup} and reset.${NC}"
        else
            echo -e "${RED}  Cannot proceed with mismatched state. Either reset the state or switch AWS credentials.${NC}"
            exit 1
        fi
    fi
fi

# Clean terraform cache if state was reset
if [ ! -f terraform.tfstate ]; then
    rm -rf .terraform .terraform.lock.hcl
fi

terraform init -input=false

# Pre-import X-Ray Transaction Search prereqs that are account+region-scoped
# and shared. They commonly pre-exist on accounts where AgentCore was tried
# before, where a prior partial apply created them, or where AWS auto-created
# the aws/spans log group on first X-Ray call. Without these imports a fresh
# `terraform apply` on such an account fails with ResourceAlreadyExistsException.
SPANS_LG=$(aws logs describe-log-groups --log-group-name-prefix "aws/spans" --region "$AWS_REGION" --query "logGroups[?logGroupName=='aws/spans'].logGroupName" --output text 2>/dev/null || echo "")
if [ -n "$SPANS_LG" ] && ! terraform state show aws_cloudwatch_log_group.aws_spans &>/dev/null; then
    echo "  Importing existing aws/spans log group..."
    terraform import aws_cloudwatch_log_group.aws_spans "aws/spans" >/dev/null 2>&1 || \
        echo -e "${YELLOW}  Could not import aws/spans (continuing).${NC}"
fi
SPANS_POLICY=$(aws logs describe-resource-policies --region "$AWS_REGION" --query "resourcePolicies[?policyName=='AWSServiceRoleForXRayLogs'].policyName" --output text 2>/dev/null || echo "")
if [ -n "$SPANS_POLICY" ] && ! terraform state show aws_cloudwatch_log_resource_policy.xray_to_cwlogs &>/dev/null; then
    echo "  Importing existing AWSServiceRoleForXRayLogs resource policy..."
    terraform import aws_cloudwatch_log_resource_policy.xray_to_cwlogs "AWSServiceRoleForXRayLogs" >/dev/null 2>&1 || \
        echo -e "${YELLOW}  Could not import xray_to_cwlogs (continuing).${NC}"
fi

terraform plan -out=tfplan

echo
echo -e "${YELLOW}Review the plan above.${NC}"
read -p "Apply? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}Deployment cancelled.${NC}"
    rm -f tfplan
    exit 0
fi

terraform apply tfplan
rm -f tfplan

# Capture outputs
ECR_REPO=$(terraform output -raw ecr_repository_url)
RUNNER_ECR_REPO=$(terraform output -raw service_approval_runner_ecr_repository_url 2>/dev/null || echo "")
FRONTEND_BUCKET=$(terraform output -raw frontend_bucket_name)
CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id)
API_ENDPOINT=$(terraform output -raw api_endpoint)
FRONTEND_URL=$(terraform output -raw frontend_url)
COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id)
COGNITO_CLIENT_ID=$(terraform output -raw cognito_user_pool_client_id)
ECS_CLUSTER=$(terraform output -raw ecs_cluster_name)
ECS_SERVICE=$(terraform output -raw ecs_service_name)

# Get region from the ECR repo URL (authoritative from terraform)
AWS_REGION=$(echo "$ECR_REPO" | sed 's/.*\.ecr\.\(.*\)\.amazonaws\.com.*/\1/')

echo -e "${GREEN}  Infrastructure deployed.${NC}"
echo

# ============================================================================
# Step 2: Backend Docker Image
# ============================================================================

echo -e "${BLUE}[2/7] Backend Docker image${NC}"

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
echo "  Logging into ECR ($ECR_REGISTRY)..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"

echo "  Building linux/amd64 image..."
docker build \
    --platform linux/amd64 \
    -f "$BACKEND_DIR/Dockerfile" \
    -t "${ECR_REPO}:latest" \
    "$REPO_ROOT"

echo "  Pushing to ECR..."
docker push "${ECR_REPO}:latest"

echo -e "${GREEN}  Backend image pushed.${NC}"
echo

# ============================================================================
# Step 3: Service-Approval Runner Image
# ============================================================================
# The Service Onboarding pipeline launches a Fargate task that pulls this image
# from ECR. Without it the Step Functions execution fails immediately with
# CannotPullContainerError. We build & push every deploy so the image stays in
# sync with the runner source under platform/control_plane/service_approval_runner.

echo -e "${BLUE}[3/7] Service-Approval runner image${NC}"

if [ -z "$RUNNER_ECR_REPO" ]; then
    echo -e "${YELLOW}  service_approval_runner_ecr_repository_url not in tf outputs — skipping.${NC}"
    echo -e "${YELLOW}  (Service Onboarding pipeline will fail until the image is pushed.)${NC}"
elif [ ! -f "$RUNNER_DIR/Dockerfile" ]; then
    echo -e "${YELLOW}  Runner source not found at $RUNNER_DIR — skipping.${NC}"
else
    # Sync the upstream service-onboarding plugin if a local checkout exists.
    # Skip silently otherwise — the existing ./plugin tree (committed in repo)
    # is used as-is.
    if [ -x "$RUNNER_DIR/sync-plugin.sh" ]; then
        SRC="${SERVICE_ONBOARDING_SRC:-$HOME/dev/LL/service-onboarding}"
        if [ -d "$SRC" ]; then
            echo "  Syncing plugin tree from $SRC..."
            (cd "$RUNNER_DIR" && SERVICE_ONBOARDING_SRC="$SRC" ./sync-plugin.sh > /dev/null)
        else
            echo "  Plugin source not at $SRC — using committed ./plugin/."
        fi
    fi

    echo "  Building linux/amd64 runner image (~600MB, may take several minutes)..."
    docker build \
        --platform linux/amd64 \
        -t "${RUNNER_ECR_REPO}:latest" \
        "$RUNNER_DIR"

    echo "  Pushing runner image to ECR..."
    docker push "${RUNNER_ECR_REPO}:latest"

    echo -e "${GREEN}  Runner image pushed.${NC}"
fi
echo

# ============================================================================
# Step 4: ECS Deployment
# ============================================================================

echo -e "${BLUE}[4/7] ECS rolling deployment${NC}"

aws ecs update-service \
    --cluster "$ECS_CLUSTER" \
    --service "$ECS_SERVICE" \
    --force-new-deployment \
    --region "$AWS_REGION" \
    --query 'service.deployments[0].rolloutState' \
    --output text

echo "  Waiting for tasks to stabilize..."
aws ecs wait services-stable \
    --cluster "$ECS_CLUSTER" \
    --services "$ECS_SERVICE" \
    --region "$AWS_REGION" 2>/dev/null || true

echo -e "${GREEN}  ECS service updated.${NC}"
echo

# ============================================================================
# Step 5: Frontend Build
# ============================================================================

echo -e "${BLUE}[5/7] Frontend build${NC}"

cat > "$FRONTEND_DIR/.env.production" <<EOF
VITE_API_URL=${API_ENDPOINT}
VITE_COGNITO_USER_POOL_ID=${COGNITO_USER_POOL_ID}
VITE_COGNITO_CLIENT_ID=${COGNITO_CLIENT_ID}
VITE_COGNITO_REGION=${AWS_REGION}
EOF

cd "$FRONTEND_DIR"
npm install --silent
npm run build

echo -e "${GREEN}  Frontend built.${NC}"
echo

# ============================================================================
# Step 6: Frontend Deploy
# ============================================================================

echo -e "${BLUE}[6/7] Frontend deploy to S3 + CloudFront${NC}"

aws s3 sync "$FRONTEND_DIR/dist/" "s3://$FRONTEND_BUCKET/" --delete --quiet
aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_ID" \
    --paths "/*" \
    --query 'Invalidation.Status' \
    --output text

echo -e "${GREEN}  Frontend deployed.${NC}"
echo

# ============================================================================
# Step 7: Cognito Users (one per RBAC role)
# ============================================================================
#
# Creates one Cognito user per RBAC role. Each user is added to the matching
# Cognito group so the JWT carries a `cognito:groups` claim — without group
# membership, the backend defaults the role to VIEWER and the user cannot
# deploy anything ("Requires operator role or higher").
#
# Roles (groups created by the cognito Terraform module):
#   - admin    → Role.ADMIN     — full access (manage users, deploy, configure)
#   - operator → Role.OPERATOR  — create/manage deployments
#   - viewer   → Role.VIEWER    — read-only
#
# Admin is recommended (you'll want at least one). Operator and viewer are
# optional; press Enter at the prompts to skip.

echo -e "${BLUE}[7/7] Cognito users (one per role)${NC}"
echo "  Each role corresponds to a Cognito group. Press Enter (empty email) to skip a role."
echo "  Operator and viewer users are optional."
echo

# Track which users got created for the summary
ADMIN_EMAIL=""
OPERATOR_EMAIL=""
VIEWER_EMAIL=""

# create_cognito_user <role> <description> [email_var_name]
# Prompts for an email, creates the user, adds them to the group.
create_cognito_user() {
    local role="$1"
    local description="$2"
    local email_var="$3"
    local email=""

    local role_upper
    role_upper=$(echo "$role" | tr '[:lower:]' '[:upper:]')
    read -p "  ${role_upper} email (${description}): " email
    if [ -z "$email" ]; then
        echo -e "${YELLOW}  Skipped — no $role user created.${NC}"
        echo
        return 0
    fi

    if aws cognito-idp admin-create-user \
        --user-pool-id "$COGNITO_USER_POOL_ID" \
        --username "$email" \
        --temporary-password "TempPass1234!" \
        --user-attributes "Name=email,Value=$email" \
        --region "$AWS_REGION" &> /dev/null; then
        echo -e "${GREEN}    User created: $email${NC}"
        echo -e "${YELLOW}    Temporary password: TempPass1234!${NC}"
        echo    "    User must set a new password on first login."
    else
        echo -e "${YELLOW}    User already exists (skipping create, will still ensure group membership).${NC}"
    fi

    # Group membership is idempotent — safe to re-run.
    if aws cognito-idp admin-add-user-to-group \
        --user-pool-id "$COGNITO_USER_POOL_ID" \
        --username "$email" \
        --group-name "$role" \
        --region "$AWS_REGION" &> /dev/null; then
        echo -e "${GREEN}    Added to '$role' group.${NC}"
        # Persist the email back to the caller via the named variable.
        printf -v "$email_var" '%s' "$email"
    else
        echo -e "${YELLOW}    Could not add to '$role' group. Run manually:${NC}"
        echo "      aws cognito-idp admin-add-user-to-group \\"
        echo "        --user-pool-id $COGNITO_USER_POOL_ID \\"
        echo "        --username $email \\"
        echo "        --group-name $role \\"
        echo "        --region $AWS_REGION"
    fi
    echo
}

create_cognito_user "admin"    "full access — deploy, manage, configure" ADMIN_EMAIL
create_cognito_user "operator" "create + manage deployments (optional)" OPERATOR_EMAIL
create_cognito_user "viewer"   "read-only (optional)"                   VIEWER_EMAIL

# ============================================================================
# Summary
# ============================================================================

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Deployment complete${NC}"
echo -e "${GREEN}============================================${NC}"
echo
echo -e "  Frontend:  ${FRONTEND_URL}"
echo -e "  API:       ${API_ENDPOINT}"
echo -e "  Cognito:   ${COGNITO_USER_POOL_ID}"
echo -e "  ECR:       ${ECR_REPO}"
echo
echo -e "  Users:"
if [ -n "$ADMIN_EMAIL" ]; then
    echo -e "    ${GREEN}admin${NC}    → $ADMIN_EMAIL"
else
    echo -e "    ${YELLOW}admin    → not configured${NC}"
fi
if [ -n "$OPERATOR_EMAIL" ]; then
    echo -e "    ${GREEN}operator${NC} → $OPERATOR_EMAIL"
else
    echo -e "    ${YELLOW}operator → not configured${NC}"
fi
if [ -n "$VIEWER_EMAIL" ]; then
    echo -e "    ${GREEN}viewer${NC}   → $VIEWER_EMAIL"
else
    echo -e "    ${YELLOW}viewer   → not configured${NC}"
fi
echo
echo -e "  Temporary password for any newly-created users: ${YELLOW}TempPass1234!${NC}"
echo "  Each user must set a new password on first login."
echo
