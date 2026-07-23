"""CDK app for Life Insurance Claim Validation — serverless architecture.

Deploys:
  - S3 bucket for documents + static website
  - 4 Lambdas (Document Intake, Identity Verification, Claim Validity, Synthesis)
  - Step Function (Express) orchestrating the agent flow
  - API Gateway triggering the Step Function
  - CloudFront distribution for the static site

Usage:
    cd infra
    source .venv/bin/activate
    cdk deploy --profile cevo-dev25 --all
"""

import os
import aws_cdk as cdk
from stacks.claims_stack import LifeInsuranceClaimStack

DEPLOY_ENV = cdk.Environment(
    account=os.environ.get("CDK_DEFAULT_ACCOUNT"),
    region=os.environ.get("CDK_DEFAULT_REGION", "ap-southeast-2"),
)

app = cdk.App()

cdk.Tags.of(app).add("Project", "life-insurance-claim-validator")
cdk.Tags.of(app).add("Environment", "demo")
cdk.Tags.of(app).add("Owner", "nicolas.foulon")

LifeInsuranceClaimStack(
    app,
    "LifeInsuranceClaimStack",
    env=DEPLOY_ENV,
    description="Serverless Life Insurance Claim Validation — Step Functions + Lambdas + Static Site",
)

app.synth()
