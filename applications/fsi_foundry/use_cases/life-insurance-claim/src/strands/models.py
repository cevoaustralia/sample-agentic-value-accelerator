"""Life Insurance Claim Validation Models."""

from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class ValidationType(str, Enum):
    """Type of validation to perform."""
    FULL = "full"
    DOCUMENT_INTAKE_ONLY = "document_intake_only"
    IDENTITY_ONLY = "identity_only"
    POLICY_ONLY = "policy_only"


class Decision(str, Enum):
    """Final claim processing decision."""
    GO = "go"
    NO_GO = "no_go"
    REFER = "refer"


class DocumentCategory(str, Enum):
    """Categories of documents submitted with a claim."""
    IDENTITY_DOCUMENT = "identity_document"
    DEATH_CERTIFICATE = "death_certificate"
    POLICY_DOCUMENT = "policy_document"
    CLAIM_FORM = "claim_form"
    SUPPORTING_EVIDENCE = "supporting_evidence"
    UNKNOWN = "unknown"


class IdentityDocumentType(str, Enum):
    """Types of identity documents."""
    PASSPORT = "passport"
    DRIVERS_LICENCE = "drivers_licence"
    NATIONAL_ID = "national_id"
    BIRTH_CERTIFICATE = "birth_certificate"
    MEDICARE_CARD = "medicare_card"
    OTHER = "other"


class PolicyStatus(str, Enum):
    """Policy status values."""
    ACTIVE = "active"
    LAPSED = "lapsed"
    CANCELLED = "cancelled"
    PENDING = "pending"
    UNKNOWN = "unknown"


# ---------------------------------------------------------------------------
# Request
# ---------------------------------------------------------------------------


class ClaimValidationRequest(BaseModel):
    """Request to validate a life insurance claim."""
    claim_id: str = Field(..., description="Unique claim identifier (e.g., CLAIM-LI-001)")
    validation_type: ValidationType = Field(
        default=ValidationType.FULL,
        description="Type of validation: full, document_intake_only, identity_only, policy_only",
    )
    additional_context: str | None = Field(
        default=None,
        description="Optional additional context for the validation",
    )


# ---------------------------------------------------------------------------
# Sub-models for agent results
# ---------------------------------------------------------------------------


class ExtractedDocument(BaseModel):
    """A single document's extracted information."""
    document_name: str = Field(default="", description="Source file name or key")
    category: DocumentCategory = Field(default=DocumentCategory.UNKNOWN)
    document_subtype: str = Field(default="", description="e.g. passport, drivers_licence, medical_certificate")
    extracted_fields: dict = Field(default_factory=dict, description="Key-value pairs extracted from the document")
    confidence: float = Field(default=0.0, ge=0.0, le=1.0, description="Extraction confidence score")
    quality_issues: list[str] = Field(default_factory=list, description="Image quality or readability issues")


class DocumentIntakeResult(BaseModel):
    """Result from the Document Intake Agent."""
    documents_processed: int = Field(default=0, description="Number of documents processed")
    documents: list[ExtractedDocument] = Field(default_factory=list, description="Extracted data per document")
    overall_completeness: float = Field(default=0.0, ge=0.0, le=1.0, description="Overall documentation completeness")
    missing_documents: list[str] = Field(default_factory=list, description="Required documents not found")
    notes: list[str] = Field(default_factory=list, description="Intake observations")


class IdentityVerificationResult(BaseModel):
    """Result from the Identity Verification Agent."""
    identity_confirmed: bool = Field(default=False, description="Whether claimant identity is confirmed")
    name_consistency_score: float = Field(default=0.0, ge=0.0, le=1.0, description="Name match score across documents")
    dob_consistency_score: float = Field(default=0.0, ge=0.0, le=1.0, description="DOB match score across documents")
    address_consistency_score: float = Field(default=0.0, ge=0.0, le=1.0, description="Address match score across documents")
    overall_confidence: float = Field(default=0.0, ge=0.0, le=1.0, description="Overall identity confidence")
    discrepancies: list[str] = Field(default_factory=list, description="Discrepancies found between documents")
    fraud_indicators: list[str] = Field(default_factory=list, description="Potential fraud indicators")


class ClaimValidityResult(BaseModel):
    """Result from the Claim Validity Agent."""
    policy_status: PolicyStatus = Field(default=PolicyStatus.UNKNOWN, description="Current policy status")
    policy_number: str = Field(default="", description="Identified policy number")
    beneficiary_confirmed: bool = Field(default=False, description="Whether claimant is a confirmed beneficiary")
    death_certificate_valid: bool = Field(default=False, description="Whether death cert passes validation")
    coverage_applicable: bool = Field(default=False, description="Whether policy covers this type of claim")
    sum_insured: float = Field(default=0.0, description="Policy sum insured amount")
    exclusions_triggered: list[str] = Field(default_factory=list, description="Policy exclusions that may apply")
    validity_notes: list[str] = Field(default_factory=list, description="Validity assessment notes")


# ---------------------------------------------------------------------------
# Response
# ---------------------------------------------------------------------------


class ClaimValidationResponse(BaseModel):
    """Response from the Life Insurance Claim Validation workflow."""
    claim_id: str = Field(..., description="Claim identifier")
    validation_id: str = Field(..., description="Unique validation run UUID")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Validation timestamp")
    decision: Decision = Field(default=Decision.REFER, description="Final claim decision: go, no_go, refer")
    confidence_score: float = Field(default=0.0, ge=0.0, le=1.0, description="Overall decision confidence")
    document_intake: DocumentIntakeResult | None = Field(default=None, description="Document intake results")
    identity_verification: IdentityVerificationResult | None = Field(default=None, description="Identity verification results")
    claim_validity: ClaimValidityResult | None = Field(default=None, description="Claim validity results")
    risk_flags: list[str] = Field(default_factory=list, description="Fraud or risk indicators")
    explanation: str = Field(default="", description="Human-readable decision explanation")
    raw_analysis: dict = Field(default_factory=dict, description="Raw agent output for audit")
