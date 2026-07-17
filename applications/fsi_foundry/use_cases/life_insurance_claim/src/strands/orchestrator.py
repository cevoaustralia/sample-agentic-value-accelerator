"""
Life Insurance Claim Validation Orchestrator (Strands Implementation).

Orchestrates specialist agents (Document Intake, Identity Verification,
Claim Validity) using a sequential-then-parallel pattern to produce a
GO / NO_GO / REFER decision on life insurance claim processing.

Flow:
  1. Document Intake Agent runs FIRST (extracts data from all documents)
  2. Identity Verification + Claim Validity run IN PARALLEL (both consume intake output)
  3. Orchestrator synthesizes all results into a final decision
"""

import asyncio
import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict

from base.strands import StrandsOrchestrator
from utils.json_extract import extract_json
from utils.synthesis import build_structured_synthesis_prompt

from .agents import DocumentIntakeAgent, IdentityVerificationAgent, ClaimValidityAgent
from .agents.document_intake_agent import process_document_intake
from .agents.identity_verification_agent import verify_identity
from .agents.claim_validity_agent import validate_claim
from .config import get_life_insurance_claim_settings
from .models import (
    ClaimValidationRequest,
    ClaimValidationResponse,
    Decision,
    DocumentIntakeResult,
    IdentityVerificationResult,
    ClaimValidityResult,
    PolicyStatus,
    ValidationType,
)


class LifeInsuranceClaimOrchestrator(StrandsOrchestrator):
    """
    Life Insurance Claim Validation Orchestrator.

    Coordinates Document Intake, Identity Verification, and Claim Validity
    agents using a sequential-then-parallel pattern:
      1. Document Intake runs first to extract data from submitted documents
      2. Identity Verification and Claim Validity run in parallel using the
         extracted data from step 1
      3. Results are synthesized into a GO / NO_GO / REFER decision
    """

    name = "life_insurance_claim_orchestrator"

    system_prompt = """You are a Senior Claims Decision Manager for a life insurance company.

Your role is to:
1. Review the outputs of three specialist agents (Document Intake, Identity Verification, Claim Validity)
2. Synthesize their findings into a final GO / NO_GO / REFER decision
3. Provide a clear confidence score and explanation for the decision

## Decision Criteria

### GO (approve for processing)
- All submitted documents are complete and legible
- Claimant identity is confirmed across documents (confidence >= 0.85)
- Policy is active and covers the claim
- Claimant is a confirmed beneficiary
- Death certificate passes validation
- No exclusions triggered
- No fraud indicators present

### NO_GO (reject)
- Policy is lapsed, cancelled, or was not in force at date of death
- Claimant is NOT a beneficiary and has no legal authority
- Death certificate fails validation (fraudulent indicators)
- Clear exclusions triggered (e.g. suicide within exclusion period)
- Strong fraud indicators present

### REFER (escalate to human reviewer)
- Identity verification has minor discrepancies (confidence 0.40-0.85)
- Some documents are missing but claim may still be valid
- Exclusions are ambiguous (need legal interpretation)
- Moderate fraud indicators that need investigation
- Any uncertainty where human judgement is required

## Output
Produce a structured JSON decision. Be conservative — when in doubt, REFER.
A false GO is far more costly than a false REFER."""

    def __init__(self):
        super().__init__(
            agents={
                "document_intake_agent": DocumentIntakeAgent(),
                "identity_verification_agent": IdentityVerificationAgent(),
                "claim_validity_agent": ClaimValidityAgent(),
            }
        )
        self._settings = get_life_insurance_claim_settings()

    def run_validation(
        self,
        claim_id: str,
        validation_type: str = "full",
        context: str | None = None,
    ) -> Dict[str, Any]:
        """Run the claim validation workflow synchronously.

        Uses sequential-then-parallel: intake first, then verification +
        validity in parallel, then synthesis.
        """
        intake_result = None
        identity_result = None
        validity_result = None

        input_text = self._build_intake_input(claim_id, context)

        if validation_type == "full":
            # Step 1: Document intake (must run first)
            intake_result = self.run_agent("document_intake_agent", input_text)
            intake_data = intake_result.output

            # Step 2: Identity + Validity in parallel using intake output
            verification_input = self._build_verification_input(claim_id, intake_data, context)
            parallel_results = self.run_parallel(
                ["identity_verification_agent", "claim_validity_agent"],
                verification_input,
            )
            identity_result = parallel_results["identity_verification_agent"]
            validity_result = parallel_results["claim_validity_agent"]

        elif validation_type == "document_intake_only":
            intake_result = self.run_agent("document_intake_agent", input_text)

        elif validation_type == "identity_only":
            # Still need intake first for identity verification
            intake_result = self.run_agent("document_intake_agent", input_text)
            verification_input = self._build_verification_input(
                claim_id, intake_result.output, context
            )
            identity_result = self.run_agent("identity_verification_agent", verification_input)

        elif validation_type == "policy_only":
            # Still need intake first for policy validation
            intake_result = self.run_agent("document_intake_agent", input_text)
            verification_input = self._build_verification_input(
                claim_id, intake_result.output, context
            )
            validity_result = self.run_agent("claim_validity_agent", verification_input)

        # Synthesize final decision
        synthesis_prompt = self._build_synthesis_prompt(
            intake_result, identity_result, validity_result
        )
        summary = self.synthesize({}, synthesis_prompt)

        return {
            "claim_id": claim_id,
            "document_intake_result": (
                {"agent": "document_intake_agent", "claim_id": claim_id, "analysis": intake_result.output}
                if intake_result else None
            ),
            "identity_verification_result": (
                {"agent": "identity_verification_agent", "claim_id": claim_id, "analysis": identity_result.output}
                if identity_result else None
            ),
            "claim_validity_result": (
                {"agent": "claim_validity_agent", "claim_id": claim_id, "analysis": validity_result.output}
                if validity_result else None
            ),
            "final_summary": summary,
        }

    async def arun_validation(
        self,
        claim_id: str,
        validation_type: str = "full",
        context: str | None = None,
    ) -> Dict[str, Any]:
        """Run the claim validation workflow asynchronously.

        Sequential-then-parallel: Document Intake first, then Identity
        Verification and Claim Validity in parallel, then synthesis.
        """
        intake_result = None
        identity_result = None
        validity_result = None

        if validation_type == "full":
            # Step 1: Document Intake (must complete first)
            intake_result = await process_document_intake(claim_id, context)
            intake_data = intake_result["analysis"]

            # Step 2: Identity + Validity in parallel
            identity_result, validity_result = await asyncio.gather(
                verify_identity(claim_id, intake_data, context),
                validate_claim(claim_id, intake_data, context),
            )

        elif validation_type == "document_intake_only":
            intake_result = await process_document_intake(claim_id, context)

        elif validation_type == "identity_only":
            intake_result = await process_document_intake(claim_id, context)
            identity_result = await verify_identity(
                claim_id, intake_result["analysis"], context
            )

        elif validation_type == "policy_only":
            intake_result = await process_document_intake(claim_id, context)
            validity_result = await validate_claim(
                claim_id, intake_result["analysis"], context
            )

        # Synthesize final decision
        synthesis_prompt = self._build_synthesis_prompt(
            intake_result, identity_result, validity_result
        )

        loop = asyncio.get_event_loop()
        summary = await loop.run_in_executor(
            None,
            lambda: self.synthesize({}, synthesis_prompt),
        )

        return {
            "claim_id": claim_id,
            "document_intake_result": intake_result,
            "identity_verification_result": identity_result,
            "claim_validity_result": validity_result,
            "final_summary": summary,
        }

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _build_intake_input(self, claim_id: str, context: str | None = None) -> str:
        base = f"""Process all documents submitted for life insurance claim: {claim_id}

Steps:
1. Retrieve the claim's document manifest using s3_retriever_tool with customer_id='{claim_id}' and data_type='profile'
2. For each document in the manifest:
   a. If it's an identity document → use textract_id_tool to extract identity fields
   b. If it's a death certificate or policy → use textract_document_tool to extract forms data
   c. If you need visual analysis for authenticity or complex content → use document_analyzer_tool
3. Classify each document by category
4. Compile complete extraction results"""

        if context:
            base += f"\n\nAdditional Context: {context}"
        return base

    def _build_verification_input(
        self, claim_id: str, intake_data: str, context: str | None = None
    ) -> str:
        base = f"""Perform verification for life insurance claim: {claim_id}

## Extracted Document Data (from Document Intake Agent)
{intake_data}"""

        if context:
            base += f"\n\nAdditional Context: {context}"
        return base

    def _build_synthesis_prompt(
        self, intake_result, identity_result, validity_result
    ) -> str:
        agent_results = {}
        if intake_result:
            analysis = intake_result.output if hasattr(intake_result, "output") else intake_result.get("analysis", "")
            agent_results["document_intake"] = {"analysis": analysis}
        if identity_result:
            analysis = identity_result.output if hasattr(identity_result, "output") else identity_result.get("analysis", "")
            agent_results["identity_verification"] = {"analysis": analysis}
        if validity_result:
            analysis = validity_result.output if hasattr(validity_result, "output") else validity_result.get("analysis", "")
            agent_results["claim_validity"] = {"analysis": analysis}

        return build_structured_synthesis_prompt(
            agent_results=agent_results,
            response_schema={
                "decision": "go | no_go | refer",
                "confidence_score": "float 0.0-1.0",
                "identity_verified": "boolean",
                "policy_valid": "boolean",
                "death_cert_valid": "boolean",
                "risk_flags": ["list of fraud/risk indicators — empty if none"],
                "explanation": "2-3 paragraph executive summary explaining the decision, key findings, and any recommended next steps",
            },
            domain_context=(
                "You are a Senior Claims Decision Manager. Based on the specialist "
                "assessments below, produce a final GO / NO_GO / REFER decision. "
                "Be conservative — when in doubt, REFER to a human reviewer."
            ),
        )


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------


async def run_life_insurance_claim_validation(
    request: ClaimValidationRequest,
) -> ClaimValidationResponse:
    """Run the full life insurance claim validation workflow.

    This is the primary entry point registered with the AVA platform.
    """
    settings = get_life_insurance_claim_settings()
    orchestrator = LifeInsuranceClaimOrchestrator()

    final_state = await orchestrator.arun_validation(
        claim_id=request.claim_id,
        validation_type=request.validation_type.value,
        context=request.additional_context,
    )

    # Parse the synthesized decision
    decision = Decision.REFER
    confidence_score = 0.0
    risk_flags: list[str] = []
    explanation = "Validation completed"
    document_intake = None
    identity_verification = None
    claim_validity = None

    try:
        structured = extract_json(final_state.get("final_summary", "{}"))

        # Decision
        raw_decision = structured.get("decision", "refer").lower().strip()
        if raw_decision in ("go", "approve"):
            decision = Decision.GO
        elif raw_decision in ("no_go", "reject"):
            decision = Decision.NO_GO
        else:
            decision = Decision.REFER

        confidence_score = float(structured.get("confidence_score", 0.0))
        risk_flags = structured.get("risk_flags", [])
        explanation = structured.get("explanation", explanation)

        # Apply threshold overrides
        if confidence_score >= settings.auto_approve_threshold and decision == Decision.GO:
            pass  # confirmed GO
        elif confidence_score < settings.auto_reject_threshold:
            decision = Decision.NO_GO
        elif decision == Decision.GO and confidence_score < settings.auto_approve_threshold:
            decision = Decision.REFER  # not confident enough to auto-approve

        # Parse sub-results if full validation was run
        if request.validation_type in (ValidationType.FULL, ValidationType.DOCUMENT_INTAKE_ONLY):
            intake_raw = final_state.get("document_intake_result")
            if intake_raw:
                try:
                    intake_parsed = extract_json(
                        intake_raw.get("analysis", "") if isinstance(intake_raw, dict) else str(intake_raw)
                    )
                    document_intake = DocumentIntakeResult(
                        documents_processed=intake_parsed.get("documents_processed", 0),
                        documents=intake_parsed.get("documents", []),
                        overall_completeness=intake_parsed.get("overall_completeness", 0.0),
                        missing_documents=intake_parsed.get("missing_documents", []),
                        notes=intake_parsed.get("notes", []),
                    )
                except Exception:
                    pass

        if request.validation_type in (ValidationType.FULL, ValidationType.IDENTITY_ONLY):
            identity_raw = final_state.get("identity_verification_result")
            if identity_raw:
                try:
                    id_parsed = extract_json(
                        identity_raw.get("analysis", "") if isinstance(identity_raw, dict) else str(identity_raw)
                    )
                    identity_verification = IdentityVerificationResult(
                        identity_confirmed=id_parsed.get("identity_confirmed", False),
                        name_consistency_score=id_parsed.get("name_consistency_score", 0.0),
                        dob_consistency_score=id_parsed.get("dob_consistency_score", 0.0),
                        address_consistency_score=id_parsed.get("address_consistency_score", 0.0),
                        overall_confidence=id_parsed.get("overall_confidence", 0.0),
                        discrepancies=id_parsed.get("discrepancies", []),
                        fraud_indicators=id_parsed.get("fraud_indicators", []),
                    )
                except Exception:
                    pass

        if request.validation_type in (ValidationType.FULL, ValidationType.POLICY_ONLY):
            validity_raw = final_state.get("claim_validity_result")
            if validity_raw:
                try:
                    val_parsed = extract_json(
                        validity_raw.get("analysis", "") if isinstance(validity_raw, dict) else str(validity_raw)
                    )
                    try:
                        policy_status = PolicyStatus(val_parsed.get("policy_status", "unknown"))
                    except ValueError:
                        policy_status = PolicyStatus.UNKNOWN

                    claim_validity = ClaimValidityResult(
                        policy_status=policy_status,
                        policy_number=val_parsed.get("policy_number", ""),
                        beneficiary_confirmed=val_parsed.get("beneficiary_confirmed", False),
                        death_certificate_valid=val_parsed.get("death_certificate_valid", False),
                        coverage_applicable=val_parsed.get("coverage_applicable", False),
                        sum_insured=val_parsed.get("sum_insured", 0.0),
                        exclusions_triggered=val_parsed.get("exclusions_triggered", []),
                        validity_notes=val_parsed.get("validity_notes", []),
                    )
                except Exception:
                    pass

    except Exception:
        explanation = str(final_state.get("final_summary", explanation))

    return ClaimValidationResponse(
        claim_id=request.claim_id,
        validation_id=str(uuid.uuid4()),
        timestamp=datetime.now(timezone.utc),
        decision=decision,
        confidence_score=confidence_score,
        document_intake=document_intake,
        identity_verification=identity_verification,
        claim_validity=claim_validity,
        risk_flags=risk_flags,
        explanation=explanation,
        raw_analysis={
            "document_intake": final_state.get("document_intake_result"),
            "identity_verification": final_state.get("identity_verification_result"),
            "claim_validity": final_state.get("claim_validity_result"),
        },
    )
