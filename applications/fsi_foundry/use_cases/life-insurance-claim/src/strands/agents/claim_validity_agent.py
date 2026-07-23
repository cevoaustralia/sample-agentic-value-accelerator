"""Claim Validity Agent for Life Insurance Claim Validation.

Validates that the policy is active, the claimant is an entitled beneficiary,
the death certificate is authentic and consistent, and no exclusions apply.
Produces the policy-level go/no-go assessment that feeds into the final decision.
"""

from base.strands import StrandsAgent
from tools.s3_retriever_strands import s3_retriever_tool


class ClaimValidityAgent(StrandsAgent):
    """Validates policy status, beneficiary entitlement, and death certificate authenticity."""

    name = "claim_validity_agent"

    system_prompt = """You are an expert Life Insurance Claims Assessor.

Your role is to determine whether a life insurance claim is valid from a
policy and evidentiary standpoint. You assess three key areas:

## 1. Policy Validity
- Is the policy currently ACTIVE (premiums paid, not lapsed or cancelled)?
- Was the policy in force at the date of death?
- Has the contestability period (typically 2 years) passed?
- Is the sum insured correctly identified?

## 2. Beneficiary Entitlement
- Is the claimant a named beneficiary on the policy?
- If multiple beneficiaries, what is the claimant's entitlement share?
- If the claimant is not a named beneficiary, is there a valid legal basis
  (e.g. estate executor, power of attorney, court order)?
- Does the relationship stated on the claim form match the policy records?

## 3. Death Certificate Validation
- Is the death certificate from a recognised registering authority?
- Does the registration number follow the expected format for the jurisdiction?
- Is the date of death plausible relative to the claim submission date?
- Does the cause of death trigger any policy exclusions?
- Are there any signs the certificate may be fraudulent (formatting, missing
  official elements, inconsistent dates)?

## 4. Exclusion Assessment
Check whether any standard life insurance exclusions apply:
- Suicide within the exclusion period (typically 13 months)
- Death resulting from criminal activity by the insured
- Death while engaging in excluded hazardous activities
- Pre-existing condition non-disclosure (if within contestability period)
- Death in an excluded geographic region or conflict zone
- Substance abuse exclusions

## Output Format
Provide your assessment as a JSON object with:
- "policy_status": "active" | "lapsed" | "cancelled" | "pending" | "unknown"
- "policy_number": the identified policy number string
- "beneficiary_confirmed": boolean — is the claimant an entitled beneficiary?
- "death_certificate_valid": boolean — does the death cert pass validation?
- "coverage_applicable": boolean — does the policy cover this claim?
- "sum_insured": float — the policy's sum insured amount
- "exclusions_triggered": list of exclusion concerns (empty if none)
- "validity_notes": list of observations supporting your assessment

Return ONLY the JSON object."""

    tools = [s3_retriever_tool]
    model_kwargs = {"temperature": 0.1, "max_tokens": 8192}


async def validate_claim(claim_id: str, intake_data: str, context: str | None = None) -> dict:
    """Run claim validity assessment for a life insurance claim.

    This agent receives the extracted document data from the Document Intake
    Agent and evaluates policy validity, beneficiary entitlement, and death
    certificate authenticity.

    Args:
        claim_id: The claim identifier.
        intake_data: JSON string of extracted data from the Document Intake Agent.
        context: Optional additional context.

    Returns:
        Dict with agent name, claim_id, and validity analysis.
    """
    agent = ClaimValidityAgent()

    input_text = f"""Assess the validity of life insurance claim: {claim_id}

## Extracted Document Data (from Document Intake Agent)
{intake_data}

## Instructions
1. Review the policy document data — confirm policy status, sum insured, beneficiary designations
2. Verify the claimant is a named beneficiary or has legal authority to claim
3. Assess the death certificate for authenticity indicators and jurisdictional formatting
4. Check the cause of death against policy exclusions
5. Verify the date of death falls within the policy coverage period
6. Assess whether the contestability period has passed
7. Identify any exclusions that may be triggered

If the extracted data is missing key policy fields, use the s3_retriever_tool with
customer_id='{claim_id}' and data_type='profile' to retrieve additional policy records.

{"Additional Context: " + context if context else ""}

Provide your claim validity assessment as the specified JSON object."""

    result = await agent.ainvoke(input_text)
    return {"agent": "claim_validity_agent", "claim_id": claim_id, "analysis": result.output}
