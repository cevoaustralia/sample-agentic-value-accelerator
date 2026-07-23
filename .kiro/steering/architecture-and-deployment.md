# Architecture & Deployment Guide

## High-Level Architecture

AVA follows a three-layer architecture:

1. **Platform Layer** — The Control Plane (React frontend + FastAPI backend) that manages everything
2. **Application Layer** — FSI Foundry use cases, reference implementations, and App Factory
3. **Infrastructure Layer** — Terraform modules provisioning AWS resources

The Control Plane is the single management surface. Once deployed, it CI/CD-deploys all applications from its UI.

## Deployment Topology

```
┌─────────────────────────────────────────────────────────────────┐
│  CloudFront (CDN)                                               │
│  ├── /static/* → S3 (React frontend)                           │
│  └── /api/*   → API Gateway → ECS Fargate (FastAPI backend)    │
├─────────────────────────────────────────────────────────────────┤
│  Authentication: Amazon Cognito (User Pools + RBAC)             │
├─────────────────────────────────────────────────────────────────┤
│  CI/CD Pipeline (per deployment):                               │
│  Step Functions → CodeBuild → Terraform → AgentCore + UI        │
├─────────────────────────────────────────────────────────────────┤
│  Per-Use-Case Deployment:                                       │
│  CloudFront → S3 (React UI) + API Gateway → Lambda → AgentCore │
├─────────────────────────────────────────────────────────────────┤
│  Data: DynamoDB (state) | S3 (artifacts, TF state) | ECR       │
├─────────────────────────────────────────────────────────────────┤
│  Observability: Langfuse v3 + OpenTelemetry (ECS Fargate)       │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment Modes

### 1. Control Plane Deployment (Recommended)

The full platform deployment provisions all infrastructure and gives you a web UI to manage everything.

```bash
cd platform/control_plane/infrastructure/scripts && ./deploy-full.sh
```

This creates:
- VPC + networking
- ECS Fargate cluster (backend)
- API Gateway (HTTP API)
- CloudFront + S3 (frontend hosting)
- Cognito (auth)
- DynamoDB (deployment state)
- ECR (container registry)
- CodeBuild + Step Functions (CI/CD pipeline)
- EventBridge (lifecycle events + Git triggers)
- S3 (Terraform state backend)

### 2. Standalone Use Case Deployment

Deploy a single FSI Foundry use case without the Control Plane:

```bash
cd applications/fsi_foundry && ./scripts/main/deploy.sh
```

### 3. Local Development

Backend + frontend running locally with `USE_DEV_AUTH=True`:
- Backend: `http://localhost:8000` (FastAPI with hot reload)
- Frontend: `http://localhost:5173` (Vite dev server)

## Dual Deployment Paths (from Control Plane UI)

Both paths are triggered from the Control Plane web UI — neither requires CLI usage.

| Path | Source | Best For |
|------|--------|----------|
| **Quick Deploy (S3)** | Backend zips source → S3 → CodeBuild unzips | Business users, standard deployments |
| **Deploy from Git (CodeCommit)** | Pre-seeded CodeCommit repo → CodeBuild clones | Developers who want to customize source |

Both paths converge at the same CodeBuild pipeline: Docker build → Terraform apply → UI build → S3 sync → CloudFront invalidation.

### Deploy from Git — UI Flow

1. User clicks "Deploy from Git" in the Control Plane UI
2. Frontend calls `GET /codecommit/repositories` → lists pre-seeded `fsi-foundry-*` repos
3. User selects a repo and branch from the dropdown
4. Frontend calls `POST /applications/foundry/deploy-from-git` with repo name + branch
5. Backend validates the repo, then starts the Step Functions pipeline (CodeBuild does `git clone` instead of S3 unzip)

Repos are pre-seeded by running `./seed-codecommit.sh init` once after Control Plane deployment. After seeding, they appear in the UI for selection. Developers can also push changes directly to those repos — EventBridge triggers auto-redeploy on push to `main` or PR merge.

## How User Code Changes Flow Through Deployment

### Git Path (Recommended for Iterative Development)

1. `seed-codecommit.sh init` creates one CodeCommit repo per use case (e.g., `fsi-foundry-kyc-banking`) pre-populated with source
2. Developer clones the repo locally, modifies agents, prompts, tools, models, etc.
3. Developer pushes to `main` or merges a PR
4. EventBridge rule on the repo detects the push → automatically triggers Step Functions → CodeBuild clones updated repo → builds → deploys
5. Alternatively, developer can return to the Control Plane UI and click "Deploy from Git" selecting the same repo for a manual redeploy

This is the intended workflow for customizing use cases.

### S3/Quick Deploy Path (Standard Deployments Only)

- The backend's Packaging Service reads use case source from its own filesystem (the deployed container's copy)
- It zips the source into an archive and uploads to S3 for CodeBuild to unzip
- If a user modifies foundry code locally, those changes only reach Quick Deploy if the Control Plane backend container is rebuilt and redeployed with the updated source
- In practice, Quick Deploy is designed for deploying standard, unmodified use cases as-is

### Summary

| Scenario | Use This Path |
|----------|---------------|
| Deploy a standard use case without changes | Quick Deploy (S3) |
| Customize code and iterate | Deploy from Git (CodeCommit) |
| Continuous deployment on every push | Git path + EventBridge auto-trigger |
| One-off redeploy of customized code | Git path via UI ("Deploy from Git" button) |

## Infrastructure Modules (Terraform)

The Control Plane infrastructure is composed of 16 Terraform modules:

| Module | Purpose |
|--------|---------|
| `networking` | VPC, subnets, security groups |
| `ecs` | Fargate cluster + backend service |
| `api_gateway` | HTTP API with VPC Link |
| `cloudfront` | CDN for frontend |
| `s3` | Frontend hosting + artifact storage |
| `cognito` | User pools + RBAC |
| `dynamodb` | Deployment state + metadata |
| `ecr` | Container registry |
| `codebuild` | CI/CD build projects (dual-source buildspec) |
| `codecommit` | Pre-seeded repos for Git deploy path |
| `step_functions` | Deployment orchestration |
| `eventbridge` | Lifecycle events + Git push triggers |
| `frontier_agents_pipeline` | Dedicated pipeline for Frontier Agent deploys |
| `agent_registry` | AgentCore agent metadata |
| `observability` | CloudWatch logs + alarms |
| `state_backend` | Terraform remote state (S3 + DynamoDB lock) |

## Per-Use-Case Architecture

Each deployed FSI Foundry use case gets its own isolated stack:

- **CloudFront** distribution (CDN for the use case UI)
- **S3 bucket** (React app static files)
- **API Gateway** (HTTP API for the use case)
- **Lambda Proxy** (routes requests to AgentCore, validates x-origin-secret)
- **Lambda Worker** (async agent invocation)
- **DynamoDB** (session tracking)
- **Bedrock AgentCore Runtime** (the actual agent)

## Agent Runtime Options

| Mode | Runtime | When to Use |
|------|---------|-------------|
| `agentcore` | Amazon Bedrock AgentCore | Production — managed, scalable agent hosting |
| `fastapi` | FastAPI on EC2/ECS or local | Development and testing |
| `lambda` | AWS Lambda + Step Functions | Event-driven, cost-optimized workloads |

Set via `DEPLOYMENT_MODE` in `.env`.

## CI/CD Pipeline Flow

1. User triggers deploy from Control Plane UI (S3 or Git path)
2. Backend packages source (S3 path) or validates repo (Git path)
3. Step Functions orchestrates the pipeline
4. CodeBuild executes:
   - **Source phase**: Unzip from S3 OR git clone from CodeCommit
   - **Build phase**: Docker build + push to ECR
   - **Infrastructure phase**: `terraform apply` (infra → runtime → ui_iac)
   - **UI phase**: `npm install` + `vite build` + S3 sync + CloudFront invalidation
5. Outputs captured in DynamoDB
6. EventBridge emits lifecycle events

## Auto-Deploy on Git Push

CodeCommit repos have EventBridge rules that trigger Step Functions on push to `main` or PR merge. Developers can `git push` to redeploy without touching the UI.

## Observability Stack

- **Langfuse v3** on ECS Fargate — agent tracing, prompt management, evaluation
- **OpenTelemetry** — distributed tracing across services
- Deployed once per account/region via the Foundation Stack template
- Every use case auto-provisions its own Langfuse project

## Security & Auth

- **Cognito** with User Pools and RBAC (admin/viewer roles)
- **Dev mode**: `USE_DEV_AUTH=True` bypasses Cognito for local development
- **Bedrock Guardrails** attached to every agent — content filtering, PII detection, denied topics, prompt-injection defense
- **x-origin-secret** header validation on per-use-case Lambda proxies

## Key Architecture Decisions

1. **Dual-source pipeline** — Same Step Functions/CodeBuild stages regardless of S3 or Git source, reducing maintenance
2. **Per-use-case isolation** — Each deployed use case gets its own CloudFront + S3 + Lambda + API Gateway stack
3. **Dual framework support** — Every use case implemented in both Strands and LangGraph so teams can choose
4. **Terraform modular composition** — One module per AWS service for reusability and independent lifecycle
5. **Managed runtime preference** — Bedrock AgentCore as the production target; FastAPI for dev convenience
6. **Foundation Stack pattern** — Observability (Langfuse) deployed once, shared by all use cases
