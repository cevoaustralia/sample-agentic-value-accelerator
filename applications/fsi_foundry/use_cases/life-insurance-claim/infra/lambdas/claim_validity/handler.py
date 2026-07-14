"""Claim Validity Lambda — Claude checks policy status and exclusions."""

import json
import os
import boto3

REGION = os.environ.get("AWS_REGION_NAME", "ap-southeast-2")
MODEL_ID = os.environ.get("MODEL_ID", "au.anthropic.claude-sonnet-4-5-20250929-v1:0")

bedrock = boto3.client("bedrock-runtime", region_name=REGION)

SYSTEM_PROMPT = """You are an expert Life Insurance Claims Assessor.

Validate:
1. Policy status (active/lapsed/cancelled)
2. Beneficiary entitlement
3. Death certificate authenticity indicators
4. Whether any exclusions are triggered (suicide within 13 months, criminal activity, etc.)

Return a JSON object with:
- "policy_status": "active" | "lapsed" | "cancelled" | "unknown"
- "policy_number": string or null
- "beneficiary_confirmed": boolean
- "death_certificate_valid": boolean
- "coverage_applicable": boolean
- "sum_insured": float or null
- "exclusions_triggered": list (empty if none)
- "validity_notes": list of key observations

Return ONLY the JSON object, no markdown fences."""


def handler(event, context):
    intake_data = event["intake_data"]

    user_msg = f"""Assess the validity of this life insurance claim:

{json.dumps(intake_data, indent=2, default=str)}

Check policy status, beneficiary entitlement, death certificate validity,
cause of death vs exclusions, and coverage period."""

    response = _call_claude(user_msg)

    try:
        return json.loads(response)
    except json.JSONDecodeError:
        return {"raw_response": response, "policy_status": "unknown", "coverage_applicable": False}


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
