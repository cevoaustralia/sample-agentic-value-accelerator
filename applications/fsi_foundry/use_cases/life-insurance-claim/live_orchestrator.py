"""Live orchestrator for the Life Insurance Claim Validation demo.

Self-contained module that calls real AWS services (Textract + Bedrock)
to demonstrate the multi-agent orchestration pattern end-to-end.

No dependency on the FSI Foundry platform — uses boto3 directly.

Flow:
  1. Document Intake Agent: calls Textract AnalyzeID / AnalyzeDocument
  2. Identity Verification Agent: Claude reasons over extracted data
  3. Claim Validity Agent: Claude checks policy + exclusions
  4. Synthesis: Claude produces GO / NO_GO / REFER decision

Environment:
  AWS_PROFILE or default credential chain
  AWS_REGION (defaults to ap-southeast-2)
"""

from __future__ import annotations

import json
import logging
import os
import time
from typing import Any, Generator

import boto3

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

AWS_REGION = os.environ.get("AWS_REGION", "ap-southeast-2")
MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "au.anthropic.claude-sonnet-4-5-20250929-v1:0")
S3_BUCKET = os.environ.get("S3_BUCKET", "")


def _get_bedrock_client():
    return boto3.client("bedrock-runtime", region_name=AWS_REGION)


def _get_textract_client():
    return boto3.client("textract", region_name=AWS_REGION)


def _get_s3_client():
    return boto3.client("s3", region_name=AWS_REGION)


def _call_claude(system_prompt: str, user_message: str, max_tokens: int = 4096) -> str:
    """Call Claude via Bedrock and return the response text."""
    client = _get_bedrock_client()
    body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": max_tokens,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_message}],
    })

    response = client.invoke_model(
        modelId=MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=body,
    )

    result = json.loads(response["body"].read())
    text = result["content"][0]["text"]

    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first line (```json) and last line (```)
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines)

    return text


# ---------------------------------------------------------------------------
# Step 1: Document Intake Agent (calls Textract)
# ---------------------------------------------------------------------------

def run_document_intake(claim_id: str, s3_prefix: str) -> dict:
    """Process all documents with Textract and classify them.

    Args:
        claim_id: Claim identifier.
        s3_prefix: S3 prefix where documents are stored.

    Returns:
        Dict with extracted data from each document.
    """
    s3 = _get_s3_client()
    textract = _get_textract_client()

    # List documents in S3
    response = s3.list_objects_v2(Bucket=S3_BUCKET, Prefix=s3_prefix)
    objects = response.get("Contents", [])

    documents = []

    for obj in objects:
        key = obj["Key"]
        filename = key.split("/")[-1]

        if not filename.endswith((".pdf", ".jpg", ".jpeg", ".png", ".webp", ".tiff", ".tif")):
            continue

        logger.info(f"Processing document: {filename}")

        # Textract doesn't support webp — convert to PNG in memory if needed
        needs_conversion = filename.lower().endswith(".webp")

        # Decide which Textract API to use
        is_id_doc = any(kw in filename.lower() for kw in ["passport", "licence", "license", "id_card", "dl-", "dl_", "nsw-dl", "drivers"])

        extracted = {"filename": filename, "s3_key": key}

        if needs_conversion:
            # Download, convert webp to png, and use Bytes instead of S3Object
            try:
                from io import BytesIO
                from PIL import Image

                s3_obj = s3.get_object(Bucket=S3_BUCKET, Key=key)
                webp_bytes = s3_obj["Body"].read()
                img = Image.open(BytesIO(webp_bytes))
                png_buffer = BytesIO()
                img.convert("RGB").save(png_buffer, format="PNG")
                doc_bytes = png_buffer.getvalue()
                document_param = {"Bytes": doc_bytes}
                document_pages_param = [{"Bytes": doc_bytes}]
            except Exception as e:
                extracted["error"] = f"Failed to convert webp: {e}"
                documents.append(extracted)
                continue
        else:
            document_param = {"S3Object": {"Bucket": S3_BUCKET, "Name": key}}
            document_pages_param = [{"S3Object": {"Bucket": S3_BUCKET, "Name": key}}]

        if is_id_doc:
            # Use AnalyzeID for identity documents
            try:
                id_response = textract.analyze_id(
                    DocumentPages=document_pages_param
                )
                fields = {}
                for doc in id_response.get("IdentityDocuments", []):
                    for field in doc.get("IdentityDocumentFields", []):
                        field_type = field.get("Type", {}).get("Text", "")
                        field_value = field.get("ValueDetection", {}).get("Text", "")
                        confidence = field.get("ValueDetection", {}).get("Confidence", 0)
                        if field_value:
                            fields[field_type] = {"value": field_value, "confidence": round(confidence, 1)}

                extracted["method"] = "Textract AnalyzeID"
                extracted["category"] = "identity_document"
                extracted["fields"] = fields
            except Exception as e:
                extracted["method"] = "Textract AnalyzeID"
                extracted["error"] = str(e)
        else:
            # Use AnalyzeDocument for other documents
            try:
                doc_response = textract.analyze_document(
                    Document=document_param,
                    FeatureTypes=["FORMS"],
                )

                # Extract key-value pairs
                key_map = {}
                value_map = {}
                block_map = {}

                for block in doc_response.get("Blocks", []):
                    block_id = block.get("Id", "")
                    block_map[block_id] = block
                    if block.get("BlockType") == "KEY_VALUE_SET":
                        if "KEY" in block.get("EntityTypes", []):
                            key_map[block_id] = block
                        else:
                            value_map[block_id] = block

                kv_pairs = {}
                for kid, kblock in key_map.items():
                    key_text = _get_block_text(kblock, block_map)
                    val_text = ""
                    for rel in kblock.get("Relationships", []):
                        if rel.get("Type") == "VALUE":
                            for vid in rel.get("Ids", []):
                                vblock = block_map.get(vid, {})
                                val_text = _get_block_text(vblock, block_map)
                    if key_text:
                        kv_pairs[key_text] = val_text

                # Extract lines
                lines = [
                    block["Text"]
                    for block in doc_response.get("Blocks", [])
                    if block.get("BlockType") == "LINE"
                ]

                # Classify document
                category = _classify_document(filename, lines)

                extracted["method"] = "Textract AnalyzeDocument (FORMS)"
                extracted["category"] = category
                extracted["key_value_pairs"] = kv_pairs
                extracted["lines"] = lines[:50]  # Cap for context
            except Exception as e:
                extracted["method"] = "Textract AnalyzeDocument"
                extracted["error"] = str(e)

        documents.append(extracted)

    return {
        "claim_id": claim_id,
        "documents_processed": len(documents),
        "documents": documents,
    }


def _get_block_text(block: dict, block_map: dict) -> str:
    """Extract text from a Textract block."""
    parts = []
    for rel in block.get("Relationships", []):
        if rel.get("Type") == "CHILD":
            for child_id in rel.get("Ids", []):
                child = block_map.get(child_id, {})
                if child.get("BlockType") == "WORD":
                    parts.append(child.get("Text", ""))
    return " ".join(parts)


def _classify_document(filename: str, lines: list[str]) -> str:
    """Classify a document based on filename and content."""
    fname = filename.lower()
    content = " ".join(lines[:10]).lower()

    if "death" in fname or "certificate of death" in content:
        return "death_certificate"
    elif "policy" in fname or "policy schedule" in content or "sum insured" in content:
        return "policy_document"
    elif "claim" in fname or "claim form" in content:
        return "claim_form"
    elif "passport" in fname or "licence" in fname:
        return "identity_document"
    return "unknown"


# ---------------------------------------------------------------------------
# Step 2: Identity Verification Agent (Claude reasoning)
# ---------------------------------------------------------------------------

IDENTITY_SYSTEM_PROMPT = """You are an expert Identity Verification Specialist for life insurance claims.

Your role is to cross-reference identity information extracted from multiple documents
to verify that:
1. The claimant's identity is consistent across all submitted documents
2. The deceased person named in the death certificate matches the policy holder
3. The claimant is correctly identified as a beneficiary
4. There are no inconsistencies suggesting fraud

Provide your assessment as a JSON object with:
- "identity_confirmed": boolean
- "name_consistency_score": 0.0-1.0
- "dob_consistency_score": 0.0-1.0
- "address_consistency_score": 0.0-1.0
- "overall_confidence": 0.0-1.0
- "discrepancies": list of issues found
- "fraud_indicators": list of fraud risks (empty if none)
- "verification_notes": list of key observations

Return ONLY the JSON object."""


def run_identity_verification(intake_data: dict) -> dict:
    """Call Claude to cross-reference identity data across documents."""
    user_msg = f"""Cross-reference identity data from these extracted documents:

{json.dumps(intake_data, indent=2, default=str)}

Check name consistency, DOB consistency, address consistency across all documents.
Verify the claimant matches the beneficiary on the policy.
Verify the deceased on the death certificate matches the policy holder."""

    response = _call_claude(IDENTITY_SYSTEM_PROMPT, user_msg)

    try:
        return json.loads(response)
    except json.JSONDecodeError:
        return {"raw_response": response, "error": "Failed to parse JSON"}


# ---------------------------------------------------------------------------
# Step 3: Claim Validity Agent (Claude reasoning)
# ---------------------------------------------------------------------------

VALIDITY_SYSTEM_PROMPT = """You are an expert Life Insurance Claims Assessor.

Your role is to validate:
1. Policy status (active/lapsed/cancelled)
2. Beneficiary entitlement
3. Death certificate authenticity indicators
4. Whether any exclusions are triggered

Provide your assessment as a JSON object with:
- "policy_status": "active" | "lapsed" | "cancelled" | "unknown"
- "policy_number": string
- "beneficiary_confirmed": boolean
- "death_certificate_valid": boolean
- "coverage_applicable": boolean
- "sum_insured": float
- "exclusions_triggered": list (empty if none)
- "validity_notes": list of key observations

Return ONLY the JSON object."""


def run_claim_validity(intake_data: dict) -> dict:
    """Call Claude to validate the claim against policy terms."""
    user_msg = f"""Assess the validity of this life insurance claim based on extracted document data:

{json.dumps(intake_data, indent=2, default=str)}

Check:
- Is the policy active? Are premiums current?
- Is the claimant a named beneficiary?
- Does the death certificate appear valid?
- Does the cause of death trigger any exclusions?
- Is the date of death within the coverage period?
- Has the contestability period passed?"""

    response = _call_claude(VALIDITY_SYSTEM_PROMPT, user_msg)

    try:
        return json.loads(response)
    except json.JSONDecodeError:
        return {"raw_response": response, "error": "Failed to parse JSON"}


# ---------------------------------------------------------------------------
# Step 4: Decision Synthesis (Claude reasoning)
# ---------------------------------------------------------------------------

SYNTHESIS_SYSTEM_PROMPT = """You are a Senior Claims Decision Manager for a life insurance company.

Based on specialist agent assessments, produce a final decision.

Decision criteria:
- GO: All checks pass, confidence >= 0.85, no risk flags
- NO_GO: Policy invalid, clear exclusions, or strong fraud indicators
- REFER: Minor discrepancies, moderate confidence, ambiguous exclusions

Be conservative - when in doubt, REFER.

Provide your decision as a JSON object with:
- "decision": "go" | "no_go" | "refer"
- "confidence_score": 0.0-1.0
- "identity_verified": boolean
- "policy_valid": boolean
- "death_cert_valid": boolean
- "risk_flags": list (empty if none)
- "explanation": 2-3 paragraph explanation of the decision

Return ONLY the JSON object."""


def run_synthesis(identity_result: dict, validity_result: dict, intake_data: dict) -> dict:
    """Call Claude to synthesize all agent results into a final decision."""
    user_msg = f"""Synthesize these specialist assessments into a final claim decision:

## Document Intake Summary
Documents processed: {intake_data.get('documents_processed', 0)}
Categories found: {[d.get('category') for d in intake_data.get('documents', [])]}

## Identity Verification Result
{json.dumps(identity_result, indent=2, default=str)}

## Claim Validity Result
{json.dumps(validity_result, indent=2, default=str)}

Produce a final GO / NO_GO / REFER decision with confidence score and explanation."""

    response = _call_claude(SYNTHESIS_SYSTEM_PROMPT, user_msg)

    try:
        return json.loads(response)
    except json.JSONDecodeError:
        return {"raw_response": response, "decision": "refer", "confidence_score": 0.0}


# ---------------------------------------------------------------------------
# Full orchestration
# ---------------------------------------------------------------------------

def run_full_validation(claim_id: str, s3_document_prefix: str | None = None) -> Generator[tuple[str, Any], None, None]:
    """Run the full validation pipeline, yielding progress updates.

    Yields tuples of (step_name, result) as each step completes:
      ("intake_start", None)
      ("intake_complete", intake_data)
      ("verification_start", None)
      ("verification_complete", identity_result)
      ("validity_complete", validity_result)
      ("synthesis_start", None)
      ("synthesis_complete", final_decision)
    """
    prefix = s3_document_prefix or f"samples/life-insurance-claim/{claim_id}/documents"

    # Step 1: Document Intake (Textract)
    yield ("intake_start", None)
    intake_data = run_document_intake(claim_id, prefix)
    yield ("intake_complete", intake_data)

    # Step 2: Identity Verification + Claim Validity (parallel in concept, sequential here for simplicity)
    yield ("verification_start", None)
    identity_result = run_identity_verification(intake_data)
    yield ("verification_complete", identity_result)

    validity_result = run_claim_validity(intake_data)
    yield ("validity_complete", validity_result)

    # Step 3: Synthesis
    yield ("synthesis_start", None)
    final_decision = run_synthesis(identity_result, validity_result, intake_data)
    yield ("synthesis_complete", final_decision)


# ---------------------------------------------------------------------------
# CLI test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import sys

    claim_id = sys.argv[1] if len(sys.argv) > 1 else "CLAIM-LI-001"
    print(f"\n{'='*60}")
    print(f"  LIVE VALIDATION: {claim_id}")
    print(f"{'='*60}\n")

    for step, result in run_full_validation(claim_id):
        if step.endswith("_start"):
            print(f"  >> {step.replace('_start', '').title()} starting...")
        elif step.endswith("_complete"):
            agent = step.replace("_complete", "")
            print(f"  << {agent.title()} complete")
            if isinstance(result, dict):
                print(f"     {json.dumps(result, indent=2, default=str)[:500]}")
            print()

    print(f"\n{'='*60}")
    print("  DONE")
    print(f"{'='*60}\n")
