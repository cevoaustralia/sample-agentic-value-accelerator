"""Amazon Textract tools for identity document and general document analysis.

Provides two tools:
  * textract_id_tool — Uses Textract AnalyzeID to extract structured fields
    from identity documents (passports, driver's licences, government IDs).
  * textract_document_tool — Uses Textract AnalyzeDocument for general document
    analysis (death certificates, claim forms, policy documents).

Both tools accept an S3 key and return structured JSON with extracted fields
and confidence scores.
"""

from __future__ import annotations

import json
import logging
from typing import Any

import boto3
from strands.tools.decorator import tool

from config.settings import settings

logger = logging.getLogger(__name__)


def _get_textract_client():
    """Create a Textract client in the configured region."""
    return boto3.client("textract", region_name=settings.aws_region)


# ---------------------------------------------------------------------------
# AnalyzeID — identity documents (passport, licence, national ID)
# ---------------------------------------------------------------------------


@tool
def textract_id_tool(s3_bucket: str = "", s3_key: str = "") -> str:
    """Extract structured identity fields from an identity document using Amazon Textract AnalyzeID.

    Supports passports, driver's licences, and government-issued identity cards.
    Returns structured fields such as full name, date of birth, document number,
    expiry date, address, and nationality.

    Args:
        s3_bucket: S3 bucket containing the document image. Defaults to the
                   configured data bucket if empty.
        s3_key: S3 key of the identity document image (JPEG, PNG, or PDF).

    Returns:
        JSON string with extracted identity fields, confidence scores, and
        document type classification.
    """
    if not s3_key:
        return json.dumps({"error": "s3_key is required"})

    bucket = s3_bucket or settings.s3_bucket_name

    logger.info("textract_id_tool invoked | bucket=%s key=%s", bucket, s3_key)

    try:
        client = _get_textract_client()
        response = client.analyze_id(
            DocumentPages=[
                {"S3Object": {"Bucket": bucket, "Name": s3_key}}
            ]
        )

        # Parse AnalyzeID response into structured fields
        identity_documents = response.get("IdentityDocuments", [])
        results = []

        for doc in identity_documents:
            fields: dict[str, Any] = {}
            field_confidences: dict[str, float] = {}

            for field in doc.get("IdentityDocumentFields", []):
                field_type = field.get("Type", {}).get("Text", "UNKNOWN")
                field_value = field.get("ValueDetection", {}).get("Text", "")
                confidence = field.get("ValueDetection", {}).get("Confidence", 0.0)

                if field_value:
                    fields[field_type] = field_value
                    field_confidences[field_type] = round(confidence / 100.0, 3)

            results.append({
                "document_index": doc.get("DocumentIndex", 1),
                "fields": fields,
                "field_confidences": field_confidences,
                "average_confidence": round(
                    sum(field_confidences.values()) / max(len(field_confidences), 1), 3
                ),
            })

        return json.dumps({
            "status": "SUCCESS",
            "s3_key": s3_key,
            "document_count": len(results),
            "identity_documents": results,
        }, indent=2)

    except client.exceptions.UnsupportedDocumentException:
        logger.warning("textract_id_tool unsupported document | key=%s", s3_key)
        return json.dumps({
            "status": "UNSUPPORTED_DOCUMENT",
            "s3_key": s3_key,
            "error": "Document format not supported for ID analysis. Try a clearer image.",
        })
    except Exception as e:
        logger.error("textract_id_tool error | key=%s error=%s", s3_key, str(e))
        return json.dumps({
            "status": "ERROR",
            "s3_key": s3_key,
            "error": f"Textract AnalyzeID failed: {e}",
        })


# ---------------------------------------------------------------------------
# AnalyzeDocument — general documents (death certs, claim forms, policies)
# ---------------------------------------------------------------------------


@tool
def textract_document_tool(s3_bucket: str = "", s3_key: str = "", feature_types: str = "FORMS,TABLES") -> str:
    """Extract text, forms, and tables from a document using Amazon Textract AnalyzeDocument.

    Use this for non-identity documents such as death certificates, claim forms,
    and policy documents. Extracts key-value pairs from forms and structured
    data from tables.

    Args:
        s3_bucket: S3 bucket containing the document. Defaults to configured bucket.
        s3_key: S3 key of the document (JPEG, PNG, PDF, or TIFF).
        feature_types: Comma-separated Textract features. Options: FORMS, TABLES, SIGNATURES.
                       Default: "FORMS,TABLES"

    Returns:
        JSON string with extracted key-value pairs, tables, and raw text blocks
        with confidence scores.
    """
    if not s3_key:
        return json.dumps({"error": "s3_key is required"})

    bucket = s3_bucket or settings.s3_bucket_name
    features = [f.strip() for f in feature_types.split(",") if f.strip()]

    logger.info("textract_document_tool invoked | bucket=%s key=%s features=%s", bucket, s3_key, features)

    try:
        client = _get_textract_client()
        response = client.analyze_document(
            Document={"S3Object": {"Bucket": bucket, "Name": s3_key}},
            FeatureTypes=features,
        )

        # Extract key-value pairs from FORMS
        key_value_pairs: dict[str, Any] = {}
        key_map: dict[str, dict] = {}
        value_map: dict[str, dict] = {}
        block_map: dict[str, dict] = {}

        for block in response.get("Blocks", []):
            block_id = block.get("Id", "")
            block_map[block_id] = block

            if block.get("BlockType") == "KEY_VALUE_SET":
                if "KEY" in block.get("EntityTypes", []):
                    key_map[block_id] = block
                else:
                    value_map[block_id] = block

        for key_id, key_block in key_map.items():
            key_text = _get_text_from_block(key_block, block_map)
            value_text = ""

            for rel in key_block.get("Relationships", []):
                if rel.get("Type") == "VALUE":
                    for val_id in rel.get("Ids", []):
                        val_block = block_map.get(val_id, {})
                        value_text = _get_text_from_block(val_block, block_map)

            if key_text:
                key_value_pairs[key_text] = value_text

        # Extract raw text lines
        lines = []
        for block in response.get("Blocks", []):
            if block.get("BlockType") == "LINE":
                lines.append({
                    "text": block.get("Text", ""),
                    "confidence": round(block.get("Confidence", 0.0) / 100.0, 3),
                })

        return json.dumps({
            "status": "SUCCESS",
            "s3_key": s3_key,
            "key_value_pairs": key_value_pairs,
            "line_count": len(lines),
            "lines": lines[:100],  # Cap at 100 lines to avoid context overflow
            "average_confidence": round(
                sum(l["confidence"] for l in lines) / max(len(lines), 1), 3
            ),
        }, indent=2)

    except Exception as e:
        logger.error("textract_document_tool error | key=%s error=%s", s3_key, str(e))
        return json.dumps({
            "status": "ERROR",
            "s3_key": s3_key,
            "error": f"Textract AnalyzeDocument failed: {e}",
        })


def _get_text_from_block(block: dict, block_map: dict) -> str:
    """Extract text from a block by following CHILD relationships."""
    text_parts = []
    for rel in block.get("Relationships", []):
        if rel.get("Type") == "CHILD":
            for child_id in rel.get("Ids", []):
                child = block_map.get(child_id, {})
                if child.get("BlockType") == "WORD":
                    text_parts.append(child.get("Text", ""))
    return " ".join(text_parts)
