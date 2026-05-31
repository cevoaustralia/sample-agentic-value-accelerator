# Standalone Use Case Development & Deployment

This guide covers working with a single FSI Foundry use case **without deploying the Control Plane**. You edit code directly in this monorepo, test locally, and deploy via CLI.

---

## When to Use This Approach

- You want to develop, customize, or demo a single use case
- You don't need the Control Plane UI, CI/CD pipeline, or multi-use-case management
- You want the fastest path from code change to deployed agent

---

## Prerequisites

- Python 3.11+
- AWS CLI >= 2.28.9 (for AgentCore deployments)
- Terraform >= 1.0
- Docker with buildx support
- AWS account with Bedrock model access enabled
- `jq` installed (`brew install jq`)

---

## Project Structure (What You'll Touch)

```
applications/fsi_foundry/
├── use_cases/<your_use_case>/
│   ├── src/
│   │   ├── strands/              # Strands framework implementation
│   │   └── langchain_langgraph/  # LangGraph framework implementation
│   ├── data/                     # Sample data for the use case
│   └── config/                   # Use case configuration
├── foundations/                   # Shared base classes, adapters, tools
├── scripts/
│   ├── main/deploy.sh            # Interactive deploy wizard
│   └── deploy/full/              # Pattern-specific deploy scripts
└── data/registry/offerings.json  # Use case registry
```

---

## Workflow

### 1. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```dotenv
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=arn:aws:bedrock:us-east-1:<ACCOUNT_ID>:inference-profile/global.anthropic.claude-opus-4-5-20251101-v1:0
DEPLOYMENT_MODE=fastapi
AGENT_NAME=kyc
LOG_LEVEL=INFO
```

### 2. Develop Locally

Run the agent locally using FastAPI mode for fast iteration:

```bash
cd applications/fsi_foundry

# Set environment for local dev
export DEPLOYMENT_MODE=fastapi
export USE_CASE_ID=kyc_banking
export FRAMEWORK=strands

# Run locally (uses the FastAPI adapter)
python -m uvicorn foundations.src.adapters.fastapi_adapter:app --reload --port 8000
```

Make your code changes in `use_cases/<your_use_case>/src/` and the server hot-reloads.

### 3. Deploy to AWS

When ready to deploy, use the interactive wizard:

```bash
cd applications/fsi_foundry
./scripts/main/deploy.sh
```

The wizard walks you through:
1. **Select use case** — from the registry
2. **Select framework** — Strands or LangGraph
3. **Select deployment pattern** — AgentCore, EC2, or Step Functions
4. **Select region** — us-east-1, us-west-2, etc.

Or skip the wizard with environment variables:

```bash
export USE_CASE_ID=kyc_banking
export FRAMEWORK=strands
export DEPLOYMENT_PATTERN=agentcore
export AWS_REGION=us-east-1

./scripts/main/deploy.sh
```

### 4. Redeploy After Changes

After editing code, just run the deploy script again. It rebuilds the Docker image, pushes to ECR, and updates the runtime:

```bash
# Full redeploy (infra + app)
./scripts/main/deploy.sh

# App-only redeploy (faster — skips infra if already provisioned)
./scripts/main/deploy.sh --app-only
```

For example, if you fixed a UI bug in the fraud_detection use case and only need to rebuild/redeploy the frontend and app layer:

```bash
cd applications/fsi_foundry && ./scripts/main/deploy.sh --app-only
```

### 5. Test

```bash
./scripts/main/test.sh
```

### 6. Cleanup

Remove all deployed resources when done:

```bash
# Pattern-specific cleanup
./scripts/use_cases/<your_use_case>/cleanup/cleanup_agentcore.sh
```

---

## Managing Code Changes

### No Separate Repo Needed

Unlike the Control Plane path (which uses CodeCommit repos), standalone deployment reads source directly from your local filesystem. Your workflow is:

1. Edit code in `applications/fsi_foundry/use_cases/<your_use_case>/`
2. Test locally with `DEPLOYMENT_MODE=fastapi`
3. Run `deploy.sh` to push changes live
4. Repeat

### Version Control Options

| Approach | How |
|----------|-----|
| Use this monorepo's Git | Create branches, use PRs for review, deploy from your working copy |
| Fork the repo | Fork to your org, work on your fork, deploy from there |
| Add your own CI/CD | Hook GitHub Actions or CodePipeline to run `deploy.sh` on merge to main |

### Multi-Use-Case Isolation

You can deploy multiple use cases from the same repo. Terraform workspaces keep them isolated:

```bash
# Deploy KYC
USE_CASE_ID=kyc_banking FRAMEWORK=strands ./scripts/deploy/full/deploy_agentcore.sh

# Deploy Payments (separate stack, same account)
USE_CASE_ID=agentic_payments FRAMEWORK=strands ./scripts/deploy/full/deploy_agentcore.sh
```

Each gets its own CloudFront, S3, API Gateway, Lambda, and AgentCore runtime.

---

## What You Don't Get (vs. Control Plane)

| Capability | Standalone | With Control Plane |
|------------|-----------|-------------------|
| Deploy via CLI | ✅ | ✅ |
| Deploy via Web UI | ❌ | ✅ |
| Auto-deploy on git push | ❌ | ✅ (EventBridge + CodeCommit) |
| CI/CD pipeline (Step Functions + CodeBuild) | ❌ | ✅ |
| Centralized auth (Cognito RBAC) | ❌ | ✅ |
| Deployment state tracking | ❌ | ✅ (DynamoDB) |
| Multi-use-case dashboard | ❌ | ✅ |

---

## Deployment Patterns Reference

| Pattern | Command | Best For |
|---------|---------|----------|
| AgentCore | `./scripts/deploy/full/deploy_agentcore.sh` | Production — managed, scalable |
| EC2 + ALB | `./scripts/deploy/full/deploy_ec2.sh` | Development, debugging |
| Step Functions | `./scripts/deploy/full/deploy_sf.sh` | Event-driven, cost-optimized |

---

## Troubleshooting

**Deploy script can't find registry**
Make sure you're running from `applications/fsi_foundry/` or the repo root.

**AWS credentials error**
Run `aws sts get-caller-identity` to verify your credentials are valid.

**AgentCore not available in region**
Use `us-east-1`, `us-east-2`, or `us-west-2`. Other regions may not support AgentCore yet.

**Docker buildx issues**
Run `docker buildx create --use` to initialize buildx.

**Want to switch frameworks mid-development**
Change `FRAMEWORK` env var and redeploy. Both implementations share the same infrastructure pattern.
