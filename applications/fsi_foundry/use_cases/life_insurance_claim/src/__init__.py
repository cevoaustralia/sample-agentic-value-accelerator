"""
Life Insurance Claim Validation Use Case.

AI-powered life insurance claim validation that analyses identity documents,
death certificates, and policy records to produce a GO / NO_GO / REFER decision.

Supports the Strands agent framework (default and only implementation).

The use case is automatically registered with the AVA registry on import.
"""

import os
from base.registry import register_agent, RegisteredAgent

# Framework selection (strands only for this use case)
AGENT_FRAMEWORK = os.getenv("AGENT_FRAMEWORK", "strands").lower()

from strands.orchestrator import run_life_insurance_claim_validation
from strands.models import ClaimValidationRequest, ClaimValidationResponse

register_agent("life_insurance_claim", RegisteredAgent(
    entry_point=run_life_insurance_claim_validation,
    request_model=ClaimValidationRequest,
    response_model=ClaimValidationResponse,
))

__all__ = [
    "run_life_insurance_claim_validation",
    "ClaimValidationRequest",
    "ClaimValidationResponse",
]
