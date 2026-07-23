"""CDK Stack — Step Functions + Lambdas + CloudFront (basic auth) + S3 Static Site."""

from __future__ import annotations

import os
from pathlib import Path

from constructs import Construct
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    RemovalPolicy,
    CfnOutput,
    Duration,
    aws_s3 as s3,
    aws_s3_deployment as s3deploy,
    aws_iam as iam,
    aws_lambda as _lambda,
    aws_stepfunctions as sfn,
    aws_stepfunctions_tasks as sfn_tasks,
    aws_apigateway as apigw,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
)

LAMBDA_DIR = Path(__file__).parent.parent / "lambdas"
FRONTEND_DIR = Path(__file__).parent.parent.parent / "frontend"
MODEL_ID = "au.anthropic.claude-sonnet-4-5-20250929-v1:0"

# Basic auth credentials for the demo site (override via env vars)
BASIC_AUTH_USER = os.environ.get("DEMO_AUTH_USER", "cevo")
BASIC_AUTH_PASS = os.environ.get("DEMO_AUTH_PASS", "claims-demo-2026")


class LifeInsuranceClaimStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # ------------------------------------------------------------------
        # S3 — Document bucket
        # ------------------------------------------------------------------
        docs_bucket = s3.Bucket(
            self, "DocsBucket",
            bucket_name=f"li-claim-docs-{self.account}-{self.region}",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            cors=[s3.CorsRule(
                allowed_methods=[s3.HttpMethods.PUT, s3.HttpMethods.POST, s3.HttpMethods.GET],
                allowed_origins=["*"],
                allowed_headers=["*"],
            )],
        )

        # Upload test documents
        s3deploy.BucketDeployment(
            self, "TestDocs",
            sources=[s3deploy.Source.asset(str(Path(__file__).parent.parent.parent / "test_documents"))],
            destination_bucket=docs_bucket,
            destination_key_prefix="samples/life-insurance-claim",
        )

        # ------------------------------------------------------------------
        # S3 — Static website bucket
        # ------------------------------------------------------------------
        site_bucket = s3.Bucket(
            self, "SiteBucket",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        )

        # ------------------------------------------------------------------
        # IAM — Lambda execution role
        # ------------------------------------------------------------------
        lambda_role = iam.Role(
            self, "LambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole"),
            ],
        )

        docs_bucket.grant_read_write(lambda_role)

        lambda_role.add_to_policy(iam.PolicyStatement(
            actions=["textract:AnalyzeDocument", "textract:AnalyzeID", "textract:DetectDocumentText"],
            resources=["*"],
        ))
        lambda_role.add_to_policy(iam.PolicyStatement(
            actions=["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
            resources=["*"],
        ))

        # ------------------------------------------------------------------
        # Lambda functions (agent pipeline)
        # ------------------------------------------------------------------
        common_env = {
            "S3_BUCKET": docs_bucket.bucket_name,
            "AWS_REGION_NAME": self.region,
            "MODEL_ID": MODEL_ID,
        }

        fn_intake = _lambda.Function(
            self, "DocumentIntakeFn",
            function_name="li-claim-document-intake",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="handler.handler",
            code=_lambda.Code.from_asset(str(LAMBDA_DIR / "document_intake")),
            timeout=Duration.seconds(60),
            memory_size=512,
            role=lambda_role,
            environment=common_env,
        )

        fn_identity = _lambda.Function(
            self, "IdentityVerificationFn",
            function_name="li-claim-identity-verification",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="handler.handler",
            code=_lambda.Code.from_asset(str(LAMBDA_DIR / "identity_verification")),
            timeout=Duration.seconds(60),
            memory_size=256,
            role=lambda_role,
            environment=common_env,
        )

        fn_validity = _lambda.Function(
            self, "ClaimValidityFn",
            function_name="li-claim-claim-validity",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="handler.handler",
            code=_lambda.Code.from_asset(str(LAMBDA_DIR / "claim_validity")),
            timeout=Duration.seconds(60),
            memory_size=256,
            role=lambda_role,
            environment=common_env,
        )

        fn_synthesis = _lambda.Function(
            self, "SynthesisFn",
            function_name="li-claim-synthesis",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="handler.handler",
            code=_lambda.Code.from_asset(str(LAMBDA_DIR / "synthesis")),
            timeout=Duration.seconds(60),
            memory_size=256,
            role=lambda_role,
            environment=common_env,
        )

        # ------------------------------------------------------------------
        # Step Function — Express workflow
        # ------------------------------------------------------------------
        task_intake = sfn_tasks.LambdaInvoke(
            self, "DocumentIntake",
            lambda_function=fn_intake,
            payload=sfn.TaskInput.from_object({
                "claim_id": sfn.JsonPath.string_at("$.claim_id"),
                "s3_prefix": sfn.JsonPath.string_at("$.s3_prefix"),
            }),
            result_path="$.intake_result",
            payload_response_only=True,
        )

        task_identity = sfn_tasks.LambdaInvoke(
            self, "IdentityVerification",
            lambda_function=fn_identity,
            payload=sfn.TaskInput.from_object({
                "intake_data": sfn.JsonPath.object_at("$.intake_result"),
            }),
            result_path="$.identity_result",
            payload_response_only=True,
        )

        task_validity = sfn_tasks.LambdaInvoke(
            self, "ClaimValidity",
            lambda_function=fn_validity,
            payload=sfn.TaskInput.from_object({
                "intake_data": sfn.JsonPath.object_at("$.intake_result"),
            }),
            result_path="$.validity_result",
            payload_response_only=True,
        )

        parallel_verification = sfn.Parallel(
            self, "ParallelVerification",
            result_path="$.parallel_results",
        )
        parallel_verification.branch(task_identity)
        parallel_verification.branch(task_validity)

        task_synthesis = sfn_tasks.LambdaInvoke(
            self, "Synthesis",
            lambda_function=fn_synthesis,
            payload=sfn.TaskInput.from_object({
                "intake_data": sfn.JsonPath.object_at("$.intake_result"),
                "identity_result": sfn.JsonPath.object_at("$.parallel_results[0]"),
                "validity_result": sfn.JsonPath.object_at("$.parallel_results[1]"),
            }),
            result_path="$.decision",
            payload_response_only=True,
        )

        definition = task_intake.next(parallel_verification).next(task_synthesis)

        state_machine = sfn.StateMachine(
            self, "ClaimValidationSM",
            state_machine_name="li-claim-validation",
            state_machine_type=sfn.StateMachineType.EXPRESS,
            definition_body=sfn.DefinitionBody.from_chainable(definition),
            timeout=Duration.minutes(2),
            tracing_enabled=True,
        )

        # ------------------------------------------------------------------
        # API — Lambda Function URL (no auth, protected by CloudFront basic auth)
        # ------------------------------------------------------------------
        invoke_sfn_fn = _lambda.Function(
            self, "InvokeSfnFn",
            function_name="li-claim-invoke-sfn",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="index.handler",
            code=_lambda.Code.from_inline("""
import json, os, boto3

sfn = boto3.client("stepfunctions")
STATE_MACHINE_ARN = os.environ["STATE_MACHINE_ARN"]

def handler(event, context):
    body = event.get("body", "{}")
    if isinstance(body, str) and body:
        pass
    else:
        body = "{}"
    try:
        resp = sfn.start_sync_execution(
            stateMachineArn=STATE_MACHINE_ARN,
            input=body,
        )
        if resp["status"] == "SUCCEEDED":
            return {
                "statusCode": 200,
                "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"},
                "body": resp.get("output", "{}"),
            }
        else:
            return {
                "statusCode": 500,
                "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"},
                "body": json.dumps({"error": resp["status"], "cause": resp.get("cause", "")}),
            }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"},
            "body": json.dumps({"error": str(e)}),
        }
"""),
            timeout=Duration.seconds(90),
            memory_size=256,
            environment={"STATE_MACHINE_ARN": state_machine.state_machine_arn},
        )

        state_machine.grant_start_sync_execution(invoke_sfn_fn)

        # Function URL — IAM auth required (prevents unauthorized access)
        fn_url = invoke_sfn_fn.add_function_url(
            auth_type=_lambda.FunctionUrlAuthType.AWS_IAM,
            cors=_lambda.FunctionUrlCorsOptions(
                allowed_origins=["*"],
                allowed_methods=[_lambda.HttpMethod.POST],
                allowed_headers=["Content-Type", "Authorization", "X-Amz-Date", "X-Amz-Security-Token", "X-Amz-Content-Sha256"],
            ),
        )

        # Allow any authenticated principal in this account to invoke
        invoke_sfn_fn.grant_invoke_url(
            iam.AccountPrincipal(self.account)
        )

        # ------------------------------------------------------------------
        # API Proxy Lambda — sits behind CloudFront, signs requests to Function URL
        # This means the Function URL is never exposed to the browser directly.
        # The browser calls CloudFront /api/validate → proxy Lambda → Function URL (IAM signed)
        # ------------------------------------------------------------------
        api_proxy_fn = _lambda.Function(
            self, "ApiProxyFn",
            function_name="li-claim-api-proxy",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="index.handler",
            code=_lambda.Code.from_inline(f"""
import json, os, boto3
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
from botocore.credentials import Credentials
import urllib.request

FUNCTION_URL = os.environ["FUNCTION_URL"]

def handler(event, context):
    # Get the body from the CloudFront/API GW proxy event
    body = event.get("body", "{{}}")

    # Create a signed request to the Function URL
    session = boto3.Session()
    creds = session.get_credentials().get_frozen_credentials()

    request = AWSRequest(
        method="POST",
        url=FUNCTION_URL,
        data=body,
        headers={{"Content-Type": "application/json"}},
    )
    SigV4Auth(creds, "lambda", "{self.region}").add_auth(request)

    # Forward the signed request
    req = urllib.request.Request(
        FUNCTION_URL,
        data=body.encode("utf-8"),
        headers=dict(request.headers),
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=85) as resp:
            response_body = resp.read().decode("utf-8")
            return {{
                "statusCode": resp.status,
                "headers": {{
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                }},
                "body": response_body,
            }}
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8") if e.fp else str(e)
        return {{
            "statusCode": e.code,
            "headers": {{"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}},
            "body": json.dumps({{"error": error_body}}),
        }}
    except Exception as e:
        return {{
            "statusCode": 500,
            "headers": {{"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}},
            "body": json.dumps({{"error": str(e)}}),
        }}
"""),
            timeout=Duration.seconds(90),
            memory_size=256,
            environment={"FUNCTION_URL": fn_url.url},
        )

        # The proxy needs permission to invoke the Function URL
        invoke_sfn_fn.grant_invoke_url(api_proxy_fn)

        # Create a Function URL for the proxy (no auth — it's behind CloudFront basic auth)
        proxy_fn_url = api_proxy_fn.add_function_url(
            auth_type=_lambda.FunctionUrlAuthType.NONE,
            cors=_lambda.FunctionUrlCorsOptions(
                allowed_origins=["*"],
                allowed_methods=[_lambda.HttpMethod.POST],
                allowed_headers=["Content-Type"],
            ),
        )
        import base64
        auth_token = base64.b64encode(f"{BASIC_AUTH_USER}:{BASIC_AUTH_PASS}".encode()).decode()

        auth_fn = cloudfront.experimental.EdgeFunction(
            self, "BasicAuthFn",
            function_name="li-claim-basic-auth",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="index.handler",
            code=_lambda.Code.from_inline(f"""
import base64

VALID_TOKEN = "{auth_token}"

def handler(event, context):
    request = event["Records"][0]["cf"]["request"]
    headers = request.get("headers", {{}})

    auth_header = headers.get("authorization", [])
    if auth_header:
        token = auth_header[0]["value"].replace("Basic ", "")
        if token == VALID_TOKEN:
            return request

    return {{
        "status": "401",
        "statusDescription": "Unauthorized",
        "headers": {{
            "www-authenticate": [{{"key": "WWW-Authenticate", "value": "Basic realm=\\"Cevo Claims Demo\\"" }}],
            "content-type": [{{"key": "Content-Type", "value": "text/html"}}],
        }},
        "body": "<html><body><h1>401 - Login Required</h1><p>Enter your Cevo credentials.</p></body></html>",
    }}
"""),
            stack_id=f"{construct_id}-EdgeFnStack",
        )

        # ------------------------------------------------------------------
        # CloudFront — protected by basic auth
        # ------------------------------------------------------------------
        oai = cloudfront.OriginAccessIdentity(self, "OAI")
        site_bucket.grant_read(oai)

        distribution = cloudfront.Distribution(
            self, "SiteDistribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3Origin(site_bucket, origin_access_identity=oai),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                edge_lambdas=[
                    cloudfront.EdgeLambda(
                        function_version=auth_fn.current_version,
                        event_type=cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
                    ),
                ],
            ),
            default_root_object="index.html",
            error_responses=[
                cloudfront.ErrorResponse(
                    http_status=404,
                    response_page_path="/index.html",
                    response_http_status=200,
                ),
            ],
        )

        # Deploy frontend
        s3deploy.BucketDeployment(
            self, "FrontendDeploy",
            sources=[s3deploy.Source.asset(str(FRONTEND_DIR))],
            destination_bucket=site_bucket,
            distribution=distribution,
            distribution_paths=["/*"],
        )

        # ------------------------------------------------------------------
        # Outputs
        # ------------------------------------------------------------------
        CfnOutput(self, "SiteUrl",
                  value=f"https://{distribution.distribution_domain_name}",
                  description=f"Demo site (login: {BASIC_AUTH_USER} / {BASIC_AUTH_PASS})")
        CfnOutput(self, "ProxyApiUrl", value=proxy_fn_url.url,
                  description="API proxy URL (no auth, protected by basic auth on CloudFront)")
        CfnOutput(self, "FunctionUrl", value=fn_url.url,
                  description="Direct Function URL (IAM auth required)")
        CfnOutput(self, "DocsBucketName", value=docs_bucket.bucket_name)
        CfnOutput(self, "StateMachineArn", value=state_machine.state_machine_arn)
