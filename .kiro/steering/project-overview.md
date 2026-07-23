# AVA — Agentic Value Accelerator

## What This Project Is

AVA is an open-source platform for planning, building, operating, and securing AI agents for financial services on AWS. It provides a unified Control Plane (React + FastAPI) that manages 34 FSI use cases, reference implementations, an App Factory, managed Frontier Agents, and reusable capabilities — all deployed on Amazon Bedrock AgentCore.

## Repository Layout

```
ava/
├── plan/                          # Strategic guidance for enterprise AI adoption
├── platform/                      # Control Plane (the management layer)
│   ├── control_plane/
│   │   ├── frontend/              # React 19 + TypeScript + Vite 8 + Tailwind CSS 4
│   │   ├── backend/               # FastAPI (Python 3.11) on ECS Fargate
│   │   ├── infrastructure/        # Terraform modules (16 modules)
│   │   ├── templates/             # 6 starter templates deployable from the UI
│   │   └── aaas/                  # Agent-as-a-Service (Frontier Agents registry + IaC)
│   └── docs/                      # Architecture docs, diagrams, template docs
├── applications/
│   ├── fsi_foundry/               # 34 multi-agent POCs across 7 FSI domains
│   │   ├── foundations/           # Shared base classes, adapters, tools, Terraform, Docker
│   │   ├── use_cases/            # Per-use-case implementations (Strands + LangGraph)
│   │   ├── ui/                    # Per-use-case React frontends
│   │   ├── data/                  # Registry (offerings.json) + sample data
│   │   └── scripts/              # Deploy, test, and cleanup scripts
│   ├── reference_implementations/ # 4 full-stack apps (Market Surveillance, Shopping Concierge, Case Management, Agent Safety)
│   └── app_factory/              # Natural-language → AI-generated agent + Terraform → deployed
└── internal/                      # Internal docs and release planning
```

## Key Technologies

| Layer | Stack |
|-------|-------|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router 7, Axios |
| Backend | FastAPI, Python 3.11, Pydantic, Boto3 |
| Infrastructure | Terraform (16 modules), Docker, CodeBuild, Step Functions |
| Agent Frameworks | Strands Agents SDK, LangGraph/LangChain (dual implementation per use case) |
| AI Runtime | Amazon Bedrock AgentCore |
| Auth | Amazon Cognito (User Pools + RBAC) |
| Observability | Langfuse v3 + OpenTelemetry |
| Data | DynamoDB, S3 |
| CDN/Hosting | CloudFront, S3 static hosting |

## Conventions

- Python code uses Python 3.11+ with type hints and Pydantic models
- Frontend uses TypeScript strict mode with functional React components
- Infrastructure is Terraform with modular composition (one module per AWS service)
- Each FSI use case has dual framework implementations: `src/strands/` and `src/langchain_langgraph/`
- Environment configuration via `.env` files (never commit secrets)
- Deployment modes: `fastapi` (local/EC2), `agentcore` (Bedrock AgentCore), `lambda` (Step Functions)

## Build & Run Commands

| Task | Command |
|------|---------|
| Start backend (local) | `cd platform/control_plane/backend && ./run_dev.sh` |
| Start frontend (local) | `cd platform/control_plane/frontend && npm run dev` |
| Deploy Control Plane | `cd platform/control_plane/infrastructure/scripts && ./deploy-full.sh` |
| Deploy single use case (standalone) | `cd applications/fsi_foundry && ./scripts/main/deploy.sh` |
| Seed CodeCommit repos | `cd platform/control_plane/infrastructure/scripts && ./seed-codecommit.sh init` |
| Destroy infrastructure | `cd platform/control_plane/infrastructure/scripts && ./destroy.sh` |

## Environment Variables

Key variables in `.env`:
- `AWS_REGION` — AWS region (default: us-east-1)
- `BEDROCK_MODEL_ID` — Bedrock inference profile ARN
- `APP_ENV` — Environment (dev/prod)
- `AGENT_NAME` — Which use case to run from the registry
- `DEPLOYMENT_MODE` — `fastapi` | `agentcore` | `lambda`
- `LOG_LEVEL` — Logging verbosity

## Important Notes

- The Control Plane is the recommended entry point — deploy it first, then use its UI for everything else
- AWS accounts need Bedrock model access enabled (Claude models)
- Local dev uses `USE_DEV_AUTH=True` to bypass Cognito
- Frontend dev server runs on port 5173, backend on port 8000
- CORS is pre-configured for localhost development
