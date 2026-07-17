"""Life Insurance Claim Validation Configuration."""

from config.settings import Settings, get_regional_model_id


class LifeInsuranceClaimSettings(Settings):
    """Settings specific to the life insurance claim validation use case."""

    data_prefix: str = "samples/life_insurance_claim"
    _base_model: str = "anthropic.claude-sonnet-4-20250514-v1:0"

    # --- Model configuration per agent ---

    @property
    def document_intake_model(self) -> str:
        """Model for Document Intake Agent (needs vision capabilities)."""
        return get_regional_model_id(self.aws_region, self._base_model)

    @property
    def identity_verification_model(self) -> str:
        """Model for Identity Verification Agent."""
        return get_regional_model_id(self.aws_region, self._base_model)

    @property
    def claim_validity_model(self) -> str:
        """Model for Claim Validity Agent."""
        return get_regional_model_id(self.aws_region, self._base_model)

    # --- Validation thresholds ---

    # Minimum confidence to auto-approve (GO) vs escalate (REFER)
    auto_approve_threshold: float = 0.85
    # Below this confidence, auto-reject (NO_GO)
    auto_reject_threshold: float = 0.40
    # Identity match threshold across documents
    identity_match_threshold: float = 0.80
    # Minimum document quality score to accept
    document_quality_threshold: float = 0.60

    # --- Document requirements ---

    # Documents required for a complete life insurance claim
    required_document_categories: list[str] = [
        "identity_document",
        "death_certificate",
        "policy_document",
        "claim_form",
    ]

    # --- Textract configuration ---
    textract_confidence_threshold: float = 0.70

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


def get_life_insurance_claim_settings() -> LifeInsuranceClaimSettings:
    """Get cached settings for this use case."""
    return LifeInsuranceClaimSettings()
