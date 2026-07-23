"""Identity Verification Lambda — Claude cross-references identity data."""

import json
import os
import boto3

REGION = os.environ.get("AWS_REGION_NAME", "ap-southeast-2")
MODEL_ID = os.environ.get("MODEL_ID", "au.anthropic.claude-sonnet-4-5-20250929-v1:0")

bedrock = boto3.client("bedrock-runtime", region_name=REGION)

SYSTEM_PROMPT = """You are an expert Identity Verification Specialist for life insurance claims.

Cross-reference identity information extracted from multiple documents to verify:
1. Claimant identity is consistent across all submitted documents
2. Deceased on the death certificate matches the policy holder
3. Claimant is correctly identified as a beneficiary
4. No inconsistencies suggesting fraud

Return a JSON object with:
- "identity_confirmed": boolean
- "name_consistency_score": 0.0-1.0
- "dob_consistency_score": 0.0-1.0
- "address_consistency_score": 0.0-1.0
- "overall_confidence": 0.0-1.0
- "discrepancies": list of issues
- "fraud_indicators": list of fraud risks
- "verification_notes": list of key observations

Return ONLY the JSON object, no markdown fences."""


def handler(event, context):
    intake_data = event["intake_data"]

    user_msg = f"""Cross-reference identity data from these extracted documents:

{json.dumps(intake_data, indent=2, default=str)}

Check name, DOB, and address consistency. Verify claimant matches beneficiary on policy.
Verify deceased on death certificate matches policy holder."""

    response = _call_claude(user_msg)

    try:
        return json.loads(response)
    except json.JSONDecodeError:
        return {"raw_response": response, "identity_confirmed": False, "overall_confidence": 0.0}


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
