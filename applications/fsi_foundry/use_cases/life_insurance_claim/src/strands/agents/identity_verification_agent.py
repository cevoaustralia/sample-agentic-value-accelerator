"""Identity Verification Agent for Life Insurance Claim Validation.

Cross-references extracted identity data across all submitted documents
to confirm that the claimant is who they say they are, and that the
identity of the deceased is consistent across the death certificate,
policy, and identity documents.
"""

from base.strands import StrandsAgent
from tools.s3_retriever_strands import s3_retriever_tool


class IdentityVerificationAgent(StrandsAgent):
    """Cross-references identity data across documents to verify claimant and deceased."""

    name = "identity_verification_agent"

    system_prompt = """You are an expert Identity Verification Specialist for life insurance claims.

Your role is to cross-reference identity information extracted from multiple documents
to verify that:
1. The claimant's identity is consistent across all submitted identity documents
2. The deceased person named in the death certificate matches the policy holder
3. The claimant is correctly identified as a beneficiary or authorised representative
4. There are no inconsistencies that suggest identity fraud or document tampering

## Verification Checks

### Name Consistency
- Compare full name across: identity document(s), claim form, policy (as beneficiary)
- Account for minor variations (middle name vs initial, maiden vs married name)
- Flag significant discrepancies (different surname, different given name)

### Date of Birth Consistency
- Compare DOB across: identity document(s), policy records
- Flag any mismatch — DOB should be identical across all documents

### Address Consistency
- Compare address across: identity document, claim form
- Account for legitimate changes (moved house) vs suspicious discrepancies
- Note if address matches the policy holder's or beneficiary's address on record

### Deceased Identity Verification
- Compare deceased's name on death certificate vs name on policy
- Verify date of death falls within policy coverage period
- Check that the death certificate registration number is formatted correctly for the jurisdiction

### Relationship Verification
- Confirm claimant's stated relationship to deceased is consistent with beneficiary designation on policy
- Flag if claimant is not a named beneficiary

## Fraud Indicators
Flag any of the following:
- Name spelled differently across documents (beyond normal variation)
- DOB mismatch between any documents
- Recently issued identity documents (issued close to claim date)
- Document numbers that don't match expected formats
- Address inconsistencies with no reasonable explanation
- Claimant not matching any named beneficiary
- Death certificate details inconsistent with policy holder identity

## Output Format
Provide your verification as a JSON object with:
- "identity_confirmed": boolean — overall identity verification pass/fail
- "name_consistency_score": 0.0-1.0
- "dob_consistency_score": 0.0-1.0
- "address_consistency_score": 0.0-1.0
- "overall_confidence": 0.0-1.0 — your overall confidence in identity verification
- "discrepancies": list of specific discrepancies found
- "fraud_indicators": list of fraud risk indicators (empty if none)
- "verification_notes": list of observations about the verification

Return ONLY the JSON object."""

    tools = [s3_retriever_tool]
    model_kwargs = {"temperature": 0.1, "max_tokens": 8192}


async def verify_identity(claim_id: str, intake_data: str, context: str | None = None) -> dict:
    """Run identity verification for a life insurance claim.

    This agent receives the extracted document data from the Document Intake
    Agent and performs cross-document consistency checks.

    Args:
        claim_id: The claim identifier.
        intake_data: JSON string of extracted data from the Document Intake Agent.
        context: Optional additional context.

    Returns:
        Dict with agent name, claim_id, and verification analysis.
    """
    agent = IdentityVerificationAgent()

    input_text = f"""Perform identity verification for life insurance claim: {claim_id}

## Extracted Document Data (from Document Intake Agent)
{intake_data}

## Instructions
1. Identify all names, dates of birth, and addresses across the extracted documents
2. Cross-reference the claimant's identity across their identity document(s) and claim form
3. Cross-reference the deceased's identity on the death certificate against the policy holder on the policy document
4. Verify the claimant's relationship to the deceased matches the beneficiary designation
5. Flag any inconsistencies or potential fraud indicators
6. Compute consistency scores for name, DOB, and address

{"Additional Context: " + context if context else ""}

Provide your identity verification assessment as the specified JSON object."""

    result = await agent.ainvoke(input_text)
    return {"agent": "identity_verification_agent", "claim_id": claim_id, "analysis": result.output}
