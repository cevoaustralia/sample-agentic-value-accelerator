---
inclusion: fileMatch
fileMatchPattern: "applications/fsi_foundry/**"
---

# Standalone Use Case Development

## Context

When working on files under `applications/fsi_foundry/`, the developer is likely working on a single use case in standalone mode (without the Control Plane). Keep these principles in mind:

## Key Facts

- Standalone deployment does NOT require the Control Plane to be deployed
- The deploy script (`scripts/main/deploy.sh`) reads source directly from the local filesystem — no CodeCommit repo needed
- Code changes are deployed by re-running `deploy.sh` (it rebuilds Docker, pushes to ECR, updates runtime)
- Use `--app-only` flag to skip infrastructure provisioning on subsequent deploys
- Each use case gets an isolated stack (CloudFront + S3 + API Gateway + Lambda + AgentCore)

## Development Loop

1. Edit code in `use_cases/<use_case>/src/<framework>/`
2. Test locally with `DEPLOYMENT_MODE=fastapi`
3. Deploy with `./scripts/main/deploy.sh` or the pattern-specific script
4. Repeat

## Environment Variables for Standalone

```bash
USE_CASE_ID=<use_case_name>       # e.g., kyc_banking
FRAMEWORK=<framework>              # strands or langchain_langgraph
DEPLOYMENT_PATTERN=<pattern>       # agentcore, ec2, or step_functions
AWS_REGION=<region>                # us-east-1, us-west-2, etc.
DEPLOYMENT_MODE=fastapi            # For local dev; changes to agentcore/lambda on deploy
```

## Code Structure Per Use Case

```
use_cases/<name>/
├── src/
│   ├── strands/                   # Strands SDK implementation
│   │   ├── agents/                # Individual agent definitions
│   │   ├── orchestrator.py        # Multi-agent orchestration
│   │   └── tools/                 # Agent tools
│   └── langchain_langgraph/       # LangGraph implementation
│       ├── agents/
│       ├── graph.py               # State graph definition
│       └── tools/
├── data/                          # Sample/test data
└── config/                        # Use case config
```

## Common Tasks

- **Add a new tool**: Create in `use_cases/<name>/src/<framework>/tools/`, register in the agent
- **Change the model**: Update `BEDROCK_MODEL_ID` in `.env` or Terraform variables
- **Add sample data**: Place in `use_cases/<name>/data/` or `data/samples/<name>/`
- **Register a new use case**: Add entry to `data/registry/offerings.json` and create the directory structure

## Deployment Patterns

| Pattern | Script | Use When |
|---------|--------|----------|
| AgentCore | `scripts/deploy/full/deploy_agentcore.sh` | Production (managed, auto-scaling) |
| EC2 + ALB | `scripts/deploy/full/deploy_ec2.sh` | Dev/debug (SSH access, logs) |
| Step Functions | `scripts/deploy/full/deploy_sf.sh` | Event-driven workloads |

## Important Constraints

- AgentCore runtime names: only `[a-zA-Z][a-zA-Z0-9_]{0,47}` (no hyphens)
- AgentCore regions: us-east-1, us-east-2, us-west-2 only
- Docker images must be ARM64 for AgentCore
- Terraform workspaces isolate multi-use-case deployments in the same account
