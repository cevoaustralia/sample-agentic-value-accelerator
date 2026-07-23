export interface DocumentIntakeResult {
  documents_classified: number;
  extracted_fields: Record<string, string>;
  quality_assessment: string;
  notes: string;
}

export interface IdentityVerificationResult {
  identity_match_confidence: number;
  discrepancies: string[];
  name_consistency: number;
  dob_consistency: number;
  address_consistency: number;
  fraud_indicators: string[];
  notes: string;
}

export interface ClaimValidityResult {
  policy_status: string;
  beneficiary_confirmed: boolean;
  death_cert_valid: boolean;
  coverage_applicable: boolean;
  notes: string;
}

export interface ClaimValidationResponse {
  claim_id: string;
  validation_id: string;
  timestamp: string;
  decision: 'go' | 'no_go' | 'refer';
  confidence_score: number;
  identity_verified: boolean;
  policy_valid: boolean;
  death_cert_valid: boolean;
  risk_flags: string[];
  explanation: string;
  document_intake: DocumentIntakeResult | null;
  identity_verification: IdentityVerificationResult | null;
  claim_validity: ClaimValidityResult | null;
  raw_analysis: Record<string, unknown>;
}

export type ExecutionStatus = 'idle' | 'running' | 'complete' | 'error';
