"""Document Intake Lambda — calls Textract on claim documents."""

import json
import os
import boto3

S3_BUCKET = os.environ["S3_BUCKET"]
REGION = os.environ.get("AWS_REGION_NAME", "ap-southeast-2")

s3 = boto3.client("s3", region_name=REGION)
textract = boto3.client("textract", region_name=REGION)


def handler(event, context):
    claim_id = event["claim_id"]
    s3_prefix = event["s3_prefix"]

    # List documents
    response = s3.list_objects_v2(Bucket=S3_BUCKET, Prefix=s3_prefix)
    objects = response.get("Contents", [])

    documents = []
    for obj in objects:
        key = obj["Key"]
        filename = key.split("/")[-1]
        if not filename.lower().endswith((".pdf", ".jpg", ".jpeg", ".png", ".tiff")):
            continue

        extracted = {"filename": filename, "s3_key": key}
        is_id_doc = any(kw in filename.lower() for kw in [
            "passport", "licence", "license", "id_card", "dl-", "nsw-dl", "drivers"
        ])

        try:
            if is_id_doc:
                id_resp = textract.analyze_id(
                    DocumentPages=[{"S3Object": {"Bucket": S3_BUCKET, "Name": key}}]
                )
                fields = {}
                for doc in id_resp.get("IdentityDocuments", []):
                    for field in doc.get("IdentityDocumentFields", []):
                        ft = field.get("Type", {}).get("Text", "")
                        fv = field.get("ValueDetection", {}).get("Text", "")
                        fc = field.get("ValueDetection", {}).get("Confidence", 0)
                        if fv:
                            fields[ft] = {"value": fv, "confidence": round(fc, 1)}
                extracted["method"] = "Textract AnalyzeID"
                extracted["category"] = "identity_document"
                extracted["fields"] = fields
            else:
                doc_resp = textract.analyze_document(
                    Document={"S3Object": {"Bucket": S3_BUCKET, "Name": key}},
                    FeatureTypes=["FORMS"],
                )
                kv_pairs = _extract_kv_pairs(doc_resp)
                lines = [b["Text"] for b in doc_resp.get("Blocks", []) if b.get("BlockType") == "LINE"]
                extracted["method"] = "Textract AnalyzeDocument (FORMS)"
                extracted["category"] = _classify(filename, lines)
                extracted["key_value_pairs"] = kv_pairs
                extracted["lines"] = lines[:50]
        except Exception as e:
            extracted["error"] = str(e)

        documents.append(extracted)

    return {
        "claim_id": claim_id,
        "documents_processed": len(documents),
        "documents": documents,
    }


def _extract_kv_pairs(response):
    block_map, key_map = {}, {}
    for block in response.get("Blocks", []):
        block_map[block["Id"]] = block
        if block.get("BlockType") == "KEY_VALUE_SET" and "KEY" in block.get("EntityTypes", []):
            key_map[block["Id"]] = block

    kv = {}
    for kid, kblock in key_map.items():
        key_text = _block_text(kblock, block_map)
        val_text = ""
        for rel in kblock.get("Relationships", []):
            if rel["Type"] == "VALUE":
                for vid in rel["Ids"]:
                    val_text = _block_text(block_map.get(vid, {}), block_map)
        if key_text:
            kv[key_text] = val_text
    return kv


def _block_text(block, block_map):
    parts = []
    for rel in block.get("Relationships", []):
        if rel["Type"] == "CHILD":
            for cid in rel["Ids"]:
                child = block_map.get(cid, {})
                if child.get("BlockType") == "WORD":
                    parts.append(child.get("Text", ""))
    return " ".join(parts)


def _classify(filename, lines):
    f = filename.lower()
    content = " ".join(lines[:10]).lower()
    if "death" in f or "certificate of death" in content:
        return "death_certificate"
    elif "policy" in f or "policy schedule" in content or "sum insured" in content:
        return "policy_document"
    elif "claim" in f or "claim form" in content:
        return "claim_form"
    return "unknown"
