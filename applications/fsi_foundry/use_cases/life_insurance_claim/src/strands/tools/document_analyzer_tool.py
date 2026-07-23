"""Bedrock multimodal document analyzer tool.

Uses Claude's vision capabilities to analyze document images directly,
providing intelligent understanding of document content, layout, and
authenticity indicators that go beyond raw OCR.

Particularly useful for:
  - Death certificate analysis (detecting official seals, signatures, formatting)
  - Document authenticity assessment (detecting tampering, inconsistencies)
  - Handwritten content interpretation
  - Complex layout analysis where Textract key-value extraction falls short
"""

from __future__ import annotations

import base64
import io
import json
import logging
from typing import Any

import boto3
from strands.tools.decorator import tool

from config.settings import settings
from tools.s3_retriever import _get_retriever

logger = logging.getLogger(__name__)


@tool
def document_analyzer_tool(
    s3_key: str = "",
    analysis_prompt: str = "",
    document_context: str = "",
) -> str:
    """Analyze a document image using Bedrock Claude's multimodal vision capabilities.

    Downloads an image from S3 and sends it to Claude with a targeted analysis
    prompt. Returns structured analysis results including extracted text,
    document characteristics, and authenticity indicators.

    Use this tool when you need intelligent document understanding beyond
    raw OCR — for example, assessing whether a death certificate looks
    authentic, reading handwritten notes, or understanding document layout.

    Args:
        s3_key: S3 key of the document image (JPEG, PNG supported).
        analysis_prompt: Specific analysis instructions. Examples:
            - "Extract all identity fields from this passport photo page"
            - "Analyze this death certificate for authenticity indicators"
            - "Extract the policy number, sum insured, and beneficiary names"
        document_context: Optional context about the document type or what
            to look for (e.g., "This is a claim form for policy POL-12345").

    Returns:
        JSON string with the analysis result, including extracted information
        and any observations about document quality or authenticity.
    """
    if not s3_key:
        return json.dumps({"error": "s3_key is required"})
    if not analysis_prompt:
        return json.dumps({"error": "analysis_prompt is required — tell me what to look for"})

    logger.info("document_analyzer_tool invoked | key=%s", s3_key)

    # Retrieve document from S3
    try:
        retriever = _get_retriever()
        envelope = retriever.get_object_by_key(s3_key)
    except Exception as e:
        logger.error("document_analyzer fetch error | key=%s error=%s", s3_key, str(e))
        return json.dumps({"error": f"Failed to fetch document from S3: {e}", "s3_key": s3_key})

    if "error" in envelope:
        return json.dumps({"error": envelope["error"], "s3_key": s3_key})

    content_b64 = envelope.get("content_base64", "")
    content_type = envelope.get("content_type", "image/jpeg")

    if not content_b64:
        return json.dumps({"error": "Document had no content", "s3_key": s3_key})

    # Determine media type for the Bedrock API
    media_type = content_type
    if media_type not in ("image/jpeg", "image/png", "image/gif", "image/webp"):
        # Default to JPEG for unknown types
        media_type = "image/jpeg"

    # Build the analysis prompt
    full_prompt = f"""Analyze the following document image and provide a structured assessment.

{f"Document Context: {document_context}" if document_context else ""}

Instructions: {analysis_prompt}

Provide your response as a JSON object with these fields:
- "extracted_fields": key-value pairs of information extracted from the document
- "document_type": what type of document this appears to be
- "authenticity_indicators": list of observations about document authenticity (official seals, signatures, watermarks, formatting consistency)
- "quality_assessment": assessment of image/document quality (clear, blurry, partial, damaged)
- "confidence": overall confidence in your extraction (0.0 to 1.0)
- "notes": any additional observations or concerns

Return ONLY the JSON object, no other text."""

    # Call Bedrock with the image
    try:
        bedrock = boto3.client("bedrock-runtime", region_name=settings.aws_region)

        model_id = settings.effective_bedrock_model_id

        response = bedrock.invoke_model(
            modelId=model_id,
            contentType="application/json",
            accept="application/json",
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 4096,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": media_type,
                                    "data": content_b64,
                                },
                            },
                            {
                                "type": "text",
                                "text": full_prompt,
                            },
                        ],
                    }
                ],
            }),
        )

        result_body = json.loads(response["body"].read())
        assistant_text = result_body.get("content", [{}])[0].get("text", "")

        # Try to parse as JSON, fall back to wrapping in a result envelope
        try:
            parsed = json.loads(assistant_text)
            parsed["s3_key"] = s3_key
            parsed["status"] = "SUCCESS"
            return json.dumps(parsed, indent=2)
        except json.JSONDecodeError:
            return json.dumps({
                "status": "SUCCESS",
                "s3_key": s3_key,
                "raw_analysis": assistant_text,
                "note": "Response was not structured JSON — raw text returned",
            }, indent=2)

    except Exception as e:
        logger.error("document_analyzer_tool Bedrock error | key=%s error=%s", s3_key, str(e))
        return json.dumps({
            "status": "ERROR",
            "s3_key": s3_key,
            "error": f"Bedrock vision analysis failed: {e}",
        })
