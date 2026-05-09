# Release Notes

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
