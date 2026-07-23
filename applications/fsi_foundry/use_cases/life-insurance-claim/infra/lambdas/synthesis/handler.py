"""Decision Synthesis Lambda — Claude produces final GO/NO_GO/REFER."""

import json
import os
import boto3

REGION = os.environ.get("AWS_REGION_NAME", "ap-southeast-2")
MODEL_ID = os.environ.get("MODEL_ID", "au.anthropic.claude-sonnet-4-5-20250929-v1:0")

bedrock = boto3.client("bedrock-runtime", region_name=REGION)

SYSTEM_PROMPT = """You are a Senior Claims Decision Manager for a life insurance company.

Based on specialist agent assessments, produce a final decision:
- GO: All checks pass, confidence >= 0.85, no risk flags
- NO_GO: Policy invalid, clear exclusions, strong fraud indicators
- REFER: Minor discrepancies, moderate confidence, ambiguous cases

Be conservative — when in doubt, REFER.

Return a JSON object with:
- "decision": "go" | "no_go" | "refer"
- "confidence_score": 0.0-1.0
- "identity_verified": boolean
- "policy_valid": boolean
- "death_cert_valid": boolean
- "risk_flags": list (empty if none)
- "explanation": 2-3 paragraph explanation

Return ONLY the JSON object, no markdown fences."""


def handler(event, context):
    intake_data = event["intake_data"]
    identity_result = event["identity_result"]
    validity_result = event["validity_result"]

    user_msg = f"""Synthesize these specialist assessments into a final claim decision:

## Document Intake
Documents processed: {intake_data.get('documents_processed', 0)}
Categories: {[d.get('category') for d in intake_data.get('documents', [])]}

## Identity Verification
{json.dumps(identity_result, indent=2, default=str)}

## Claim Validity
{json.dumps(validity_result, indent=2, default=str)}

Produce a GO / NO_GO / REFER decision."""

    response = _call_claude(user_msg)

    try:
        return json.loads(response)
    except json.JSONDecodeError:
        return {"raw_response": response, "decision": "refer", "confidence_score": 0.0}


def _call_claude(user_message):
    body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096,
        "system": SYSTEM_PROMPT,
        "messages": [{"role": "user", "content": user_message}],
    })
    resp = bedrock.invoke_model(modelId=MODEL_ID, contentType="application/json", accept="application/json", body=body)
    result = json.loads(resp["body"].read())
    text = result["content"][0]["text"]
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines)
    return text
