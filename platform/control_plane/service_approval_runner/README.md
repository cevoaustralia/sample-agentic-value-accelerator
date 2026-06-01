# Service Approval Runner

Container image launched by the `service_approval` Step Functions state
machine to execute the upstream **service-onboarding plugin** end-to-end
against an AWS service. The image bundles the Claude Code CLI, the plugin
tree, and `uv` (for `uvx`-based MCP servers) so the same flow that runs
locally as `/service-approval` runs unchanged inside Fargate against
Amazon Bedrock.

A watcher mirrors the plugin's `.service-approval/<service>/` output to
S3 and updates the DynamoDB run record per phase as files land, so the
AVA UI streams real artifacts during the run.

## Build & push

```bash
# 1) Sync the latest plugin tree into ./plugin/ (defaults to ~/dev/LL/service-onboarding)
./sync-plugin.sh
#    or: SERVICE_ONBOARDING_SRC=/elsewhere/service-onboarding ./sync-plugin.sh

# 2) Auth + build + push
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
REGION=us-east-1
NAME_PREFIX=ava-cp-dev-${ACCOUNT: -6}
REPO=${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com/${NAME_PREFIX}-service-approval-runner

aws ecr get-login-password --region $REGION \
  | docker login --username AWS --password-stdin ${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com

docker build --platform=linux/amd64 -t $REPO:latest .
docker push $REPO:latest
```

> The image runs Node 20 + Python 3.12 + `uv` + the `@anthropic-ai/claude-code`
> CLI. Expect ~600 MB compressed.

## Run locally

```bash
docker run --rm \
  -e AWS_REGION=us-east-1 \
  -e SERVICE_APPROVAL_TABLE=ava-cp-dev-XXXXXX-service-approval \
  -e SERVICE_APPROVAL_BUCKET=ava-cp-dev-XXXXXX-service-approval-artifacts \
  -e BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-20250514-v1:0 \
  -e SLUG=apigateway-20260101-000000 \
  -e SERVICE=amazonapigateway \
  -e FRAMEWORK=ccmv4 \
  -e TESTING_MODE=skip \
  -v $HOME/.aws:/root/.aws:ro \
  $REPO:latest
```

## How it works

1. `entrypoint.py` reads `SLUG`, `SERVICE`, `FRAMEWORK`, `TESTING_MODE`
   from the environment (Step Functions sets them via `Overrides`).
2. It prepares `/tmp/run/<slug>/` and symlinks the plugin tree
   (`.claude-plugin/`, `commands/`, `skills/`, `.mcp.json`, ...) into it.
3. It launches `claude --print --permission-mode bypassPermissions
   /service-approval --service=<svc> --framework=<fw>` with
   `CLAUDE_CODE_USE_BEDROCK=1` and the configured inference profile.
4. A watcher thread polls `.service-approval/<svc>/` every 5s and
   incrementally uploads every new/changed file to
   `s3://<bucket>/<slug>/<phase-dir>/...`, updating per-phase counts
   in DynamoDB so the UI reflects progress live.
5. On exit, if `07-summarize/APPROVAL-REPORT.md` is present the run is
   marked `completed`; otherwise it's marked `failed` with the pipeline
   log under `_logs/` for triage.

## Required IAM (task role)

In addition to S3 + DynamoDB + Bedrock invoke (already in the Terraform
module), the plugin's MCP servers issue read-only describes against the
target AWS service. The Terraform module attaches `ReadOnlyAccess` to
the task role for that reason — narrow it later via service-specific
SCP if needed.
