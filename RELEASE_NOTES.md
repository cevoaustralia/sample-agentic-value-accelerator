# Release Notes

## v3.0 — Plan, Operate, and Govern

Release date: June 2026

v3.0 takes AVA from "deploy and secure agents" to a full **plan → build →
secure → operate → govern** lifecycle on AWS. Five new pillars land in
the Control Plane: an interactive Plan section, a 5-gate Service
Onboarding workflow, a dual observability stack, an 8-workspace Govern
pillar, and AWS Security Agent in AaaS — alongside 22 starter templates
and federated AWS console launch for every Frontier Agent.

### Highlights

- **App Templates** — _Hemal Gadhiya_
  22 deployable starter templates surfaced through the **App Templates**
  tab in the Control Plane, covering 8 categories: foundation &
  observability, agent scaffolds (Strands + LangGraph), multi-agent
  patterns (orchestration kit, supervisor-specialists, plan-and-execute,
  evaluator-optimizer, sequential pipeline, event-driven, RAG report
  generator), human-in-the-loop, memory & knowledge (AgentCore Runtime,
  AgentCore Memory, Bedrock Knowledge Base), security & auth
  (Bedrock Guardrails, Cognito), and API & tools (API Gateway,
  structured output, test harness). Replaces the v2.5 template set.

- **AgentCore Observability** — _Daniela Vargas_
  AVA now emits to **two complementary observability stacks** at deploy
  time: AgentCore Observability for service-level runtime telemetry
  (CloudWatch GenAI Observability + X-Ray Transaction Search,
  capturing `InvokeAgentRuntime` spans, payload metadata, cold-starts,
  IAM denials) and Langfuse for application-level traces, prompts,
  evals, and cost. Wired into every AgentCore runtime stack via
  APPLICATION_LOGS log delivery and X-Ray trace destinations. Per-account
  prereq enables X-Ray Transaction Search via a one-time `null_resource`.
  `telemetry.py` runs in dual mode and registers Strands + LangChain
  OTEL instrumentors plus the Langfuse v4 OTEL span processor.

- **Service Onboarding** — _Bikash Behera & Aditi Pendharkar_
  A guided 5-gate approval workflow — **Risk → Security → Compliance →
  Architecture → Executive** — for any new AI service. Powered by a
  Claude Code plugin that runs each phase as an autonomous reviewer and
  produces a signed approval report with an evidence bundle (threat
  model, control mapping, risk register, architecture review,
  executive summary) ready for auditors. Step Functions orchestrates
  phase progression with full audit trail in DynamoDB; an S3 bucket
  stores per-phase artifacts. New `service_approval` Terraform module +
  `service_approval_runner` container + REST API at
  `/api/service-approvals` + `ServiceOnboardingLanding` workflow UI.

- **Plan section** — _Bikash Behera & Sushil Pramanick_
  Four interactive frameworks turn ambition into an investable plan
  before you build. Use them in order (Assess → Design → Identify →
  Justify) or jump to the one you need:
  - **Maturity Assessment** — score across 5 dimensions (Data,
    Infrastructure, Org, Governance, Strategy) with 25+ indicators,
    gap analysis, L1–L5 rating
  - **Operating Model** — pick a TOM pattern (Centralized CoE /
    Hub-and-Spoke / Federated) by scoring 7 dimensions across 21
    questions, with investment guidance per pattern
  - **Use Case Prioritization** — rank ideas with the AWS Enterprise AI
    Scoring Model (25 weighted criteria) with Go/Conditional/No-Go
    gates
  - **Business Cases** — CFO-grade DCF with NPV, IRR, payback, ROI;
    8-category risk scorecard, ramp-up curves, Go/Review/Reject
    verdicts

  Backed by per-framework backend routes, services, models, and
  schemas; persisted to DynamoDB. Includes a written Use Case
  Discovery Guide at `plan/UseCaseGuidance.md`.

- **Govern** — _Gregg Sorrels_
  Replaces the v2.5 single-page command center with a full GRC pillar —
  one Command Center plus seven deeper workspaces:
  - **Command Center** — AI Platform Activity grid, Trust Stack
    snapshot, Compliance · Guardrails · Cost summary, Recent Activity,
    Quick Actions
  - **Trust Stack** — 3-layer model (Foundation → Production → Scale)
    with AWS service mapping and 3 Lines of Defense
  - **Fleet Overview** — fleet-wide KPIs, 30-day trust + guardrail
    trend, agent × risk heatmap, top risky use cases
  - **Risk Management** — heatmap, control effectiveness, risk
    register; aligned to NIST AI RMF and SR 26-2
  - **Model Management** — model registry with risk tier, eval score,
    attestation status; 4-framework MRM compliance progress (SR 26-2,
    OSFI E-23, NIST AI RMF, EU AI Act)
  - **Compliance Center** — interactive checklists for SR 26-2,
    OSFI E-23, NIST AI RMF, EU AI Act, ISO 42001
  - **Cost & FinOps** — health score, spend velocity, 12-month
    forecast, unit economics, chargeback statement
  - **Audit & Incidents** — searchable timeline of guardrail events,
    incidents, approvals, deployments; per-event evidence drawer

  Shared infrastructure: `useGovernanceAggregator.ts` merges live data
  from guardrails, deployments, use cases, agents, and frontier agents;
  Heroicon outline set keeps icons emoji-free; ModuleGuide drives the
  collapsible "Getting Started" / "How to Use" panels with a unified
  indigo→violet→pink palette.

- **AWS Security Agent + federated console launch** — _Vivian Bui_
  Amazon's managed Security Agent is now in AaaS — design review,
  code review, and on-demand pentest — deployable in three IaC flavors
  (Terraform, CDK, CloudFormation). After deploy, hit **Launch in
  Console** on any Frontier Agent (DevOps or Security) and the backend
  mints an STS-backed federated sign-in URL that drops you straight
  into the agent's AWS Console with the right operator role — no
  manual role-switching.

### User-facing changes

- New top-level Plan section with 4 framework workspaces.
- New Secure → Service Onboarding workflow page.
- New Operate page surfacing both observability stacks.
- New Govern pillar with 8 workspaces under `/govern/*`.
- Frontier Agents catalog adds Security Agent; **Launch in Console**
  button on every deployed Frontier Agent.
- App Templates tab now lists 22 templates across 8 categories.
- DeploymentList page: clickable status chips for filtering and a
  status-priority default sort.
- Refreshed home screenshots (plan, foundry, aaas, capabilities,
  observability, govern-command-center).

### Infrastructure

- New Terraform modules: `service_approval` (Step Functions + DynamoDB
  + S3 + Lambda runner), `frontier_agents_pipeline`, X-Ray Transaction
  Search prereq via `null_resource`.
- AgentCore runtime stacks now include APPLICATION_LOGS log delivery
  and X-Ray trace destinations.
- Cognito module supports optional demo-user seeding for fresh stamps.
- Docker Hub credentials wiring for the Langfuse Foundation Stack.

### Security

- Real AWS identifiers replaced with placeholders in test scripts,
  runtime configs, and sample-data scripts (case-management
  config.json, load_sample_data.sh, ConfigManager.tsx,
  economic_research test_business_logic.sh, customer_service /
  fraud_detection runtime configs).

### Upgrade notes

- The v2.5 template set (tool-calling-agent,
  multi-agent-orchestration, rag-application, langraph-agentcore,
  strands-agentcore) is replaced by the new 22-template catalog. If
  you forked any of those templates, migrate to the closest v3.0
  equivalent (e.g., `agent-scaffold-langgraph`, `agent-scaffold-strands`,
  `multi-agent-kit`, `research-report-generator`).
- The v2.5 `GovernLanding` (single-page command center) is replaced by
  the new 8-workspace pillar. The same `/govern` route now lands on
  the new pillar; no breaking change for users, but anyone deep-linking
  to the old single-page sections will need updated paths
  (`/govern/command-center`, `/govern/trust-stack`, etc.).
- AgentCore Observability requires a one-time per-account/region X-Ray
  Transaction Search enable. Set `enable_xray_transaction_search=true`
  on your first Control Plane deploy.

### Contributors to v3.0

- **Hemal Gadhiya** ([gadhiy@amazon.com](mailto:gadhiy@amazon.com)) — App Templates
- **Daniela Vargas** ([vargas-dann-0896@amazon.com](mailto:vargas-dann-0896@amazon.com)) — AgentCore Observability
- **Bikash Behera** ([behebika@amazon.com](mailto:behebika@amazon.com)) — Plan section design and implementation, Service Onboarding implementation
- **Aditi Pendharkar** ([aditipen@amazon.com](mailto:aditipen@amazon.com)) — Service Onboarding review workflow, Claude Code plugin design
- **Sushil Pramanick** ([sushipra@amazon.com](mailto:sushipra@amazon.com)) — Plan section design, AI use case discovery methodology
- **Gregg Sorrels** ([gsorrels@amazon.com](mailto:gsorrels@amazon.com)) — Govern pillar design, AI Trust Stack model, MRM framework alignment
- **Vivian Bui** ([vivibui@amazon.com](mailto:vivibui@amazon.com)) — AWS Security Agent IaC, federated AWS console launch, Control Plane integration, README + Architecture refresh

---

## v2.5 — Guardrails, Capabilities, and Governance

Release date: May 2026

v2.5 rounds out the AVA platform with three additions that move the story
from "deploy agents" to "deploy, secure, and govern agents" end-to-end.

### Highlights

- **Guardrails** — _Adarsh Parakh_
  Amazon Bedrock Guardrails are now a first-class concept in the Control
  Plane. Build templates with content filters, PII detection, denied
  topics, word filters, and contextual grounding; attach one or more to
  any agent at deploy time. Post-processing guardrails are wired into the
  `customer_service` use case and the foundation base classes, so any
  Foundry UC can opt in. Ships with three FSI-tuned presets
  (FSI Standard, Market Surveillance, Customer Service).

- **Capabilities** — _Vivian Bui_
  New top-level section under Build for the composable primitives every
  agent depends on. Three children:
  - **Tools** — pre-built MCP Gateway, Code Interpreter, Web Browser,
    API Connector, Notifications; plus a builder for custom tools from
    Lambda functions, REST/OpenAPI endpoints, or MCP servers.
  - **Knowledge** — data sources (S3, RDS, APIs), knowledge bases
    (Bedrock KBs with vector + hybrid retrieval), document stores, and
    streaming feeds with attached-agent counts, refresh cadence, and
    backend stack.
  - **Prompts** — versioned system prompts, response templates,
    evaluation rubrics, and guardrail clauses backed by Amazon Bedrock
    Prompt Management.

  The old "Tools Factory" page moves out of Agent-as-a-Service into
  Capabilities; the legacy `/aaas/tools` URL redirects.

- **Governance Command Center** — _Vivian Bui_
  A new pillar focused on the governance story regulators and
  executives expect. Single-page command center shows AI Trust Stack
  posture across 7 layers (infrastructure, data, model, application,
  agent, access, governance), fleet KPIs, a 30-day trust & guardrail
  trend, agent × risk heatmap, model inventory, compliance coverage
  (NIST AI RMF · ISO 42001 · NYDFS Part 500 + AI circular · EU AI Act
  · SR 11-7 · SOC 2 Type II), Cost & FinOps summary, and recent
  activity. Drill-down drawers open per model, per heatmap cell, and
  per compliance framework.

  Three deep sub-pages for analysts and auditors, each buildable today
  against real AWS APIs:
  - **Model Registry** — filters, attestation board, EU AI Act
    classification, approval pipeline, fleet eval trend.
  - **Cost & FinOps** — FinOps health, 12-month forecast scenarios,
    unit economics, chargeback by BU, commitment / Provisioned
    Throughput planner, optimization opportunities.
  - **Audit & Incidents** — filterable timeline of guardrail events,
    incidents, approvals, deployments, and config changes with a
    per-event evidence drawer (trace, CloudTrail, exportable bundles).

### User-facing changes

- Sidebar: Applications, Agent-as-a-Service, Capabilities,
  Observability, and Govern are now collapsible per section with
  chevron toggles; expanded state persists to localStorage. When the
  sidebar is collapsed, clicking a parent icon opens a flyout menu.
- Home page: new Capabilities banner below the Applications and
  Agent-as-a-Service cards; Govern gets a tile on the Secure/Operate
  row.
- Observability: Langfuse page now probes the advertised URL on load
  and falls back to a "Deploy Langfuse" CTA if the server is
  unreachable (handles the case where a deployment record outlives the
  ECS stack).
- README: refreshed hero image, new Capabilities/Secure/Govern
  sections, updated footer attribution to "FSI PACE".

### Infrastructure

- `aws_s3_bucket_policy.frontend_cloudfront` gains an
  `extra_cloudfront_distribution_arns` input so vanity-domain
  distributions (e.g. Alternate Domain Names routed through a separate
  CloudFront) can be allowed without drifting out of Terraform.
- `cors_origins` gains an `extra_cors_origins` variable for the same
  reason.
- Guardrails DynamoDB table, `ecs_task_bedrock_guardrails` IAM policy,
  and `GUARDRAILS_TABLE_NAME` env var are added to the ECS task.
- Use-case UI buildspec stops importing `aws_lambda_permission.apigw`
  (which couldn't reconcile when API Gateway was recreated) and
  instead removes any existing `AllowAPIGateway*` statements pre-plan
  so Terraform creates a fresh, correct one on every apply.

### Security

- Pre-release scan scrubbed real CloudFront distribution IDs, API
  Gateway IDs, ALB DNS names, and S3 bucket names from source and
  from all historical commits. Every `<api-id>`, `<region>`,
  `<ACCOUNT_ID>`, and `<alb-name>` placeholder must be substituted at
  deploy time.
- No AKIA keys, private keys, or `terraform.tfstate` files are tracked.

### Upgrade notes

- Users upgrading from v2.0 should re-clone the repository rather than
  pulling, because v2.5 ships with a rewritten history that scrubs
  historical secrets. Pre-existing forks and clones from v2.0 or
  earlier may diverge on rebased commit hashes.
- Recharts is a new dependency of the Control Plane frontend. Run
  `npm install` before starting the dev server or building.

### Contributors to v2.5

- Adarsh Parakh (`parakhad@amazon.com`)
- Vivian Bui (`vivibui@amazon.com`)

---

## Earlier releases

See the [Git tag history](https://github.com/aws-samples/sample-agentic-value-accelerator/tags)
for v2.0, v1.2, v1.1, and v1.0 release notes.
