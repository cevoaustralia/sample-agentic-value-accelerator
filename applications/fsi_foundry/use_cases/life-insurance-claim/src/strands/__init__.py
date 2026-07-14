"""
Life Insurance Claim Validation - Strands Implementation.

AI-powered claim validation using Document Intake, Identity Verification,
and Claim Validity agents to produce GO / NO_GO / REFER decisions.

The use case is automatically registered with the AVA registry on import.
"""

from .orchestrator import LifeInsuranceClaimOrchestrator, run_life_insurance_claim_validation
from .models import ClaimValidationRequest, ClaimValidationResponse

# Register this use case with the platform registry
from base.registry import register_agent, RegisteredAgent

register_agent(
    name="life_insurance_claim",
    config=RegisteredAgent(
        entry_point=run_life_insurance_claim_validation,
        request_model=ClaimValidationRequest,
        response_model=ClaimValidationResponse,
    ),
)

__all__ = [
    "LifeInsuranceClaimOrchestrator",
    "run_life_insurance_claim_validation",
    "ClaimValidationRequest",
    "ClaimValidationResponse",
]
