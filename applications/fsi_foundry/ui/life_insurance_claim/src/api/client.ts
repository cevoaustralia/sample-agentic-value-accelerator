import type { RuntimeConfig } from '../config';
import type { ClaimValidationResponse } from '../types';

interface InvokeResponse {
  session_id: string;
  status: string;
}

interface StatusResponse {
  session_id: string;
  status: 'PENDING' | 'COMPLETE' | 'ERROR';
  result?: ClaimValidationResponse;
  error?: string;
}

export async function invokeAgent(
  config: RuntimeConfig,
  payload: Record<string, string>,
): Promise<ClaimValidationResponse> {
  const invokeRes = await fetch(config.api_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!invokeRes.ok) {
    const text = await invokeRes.text();
    throw new Error(text || `Request failed with status ${invokeRes.status}`);
  }

  const { session_id } = (await invokeRes.json()) as InvokeResponse;

  const baseUrl = config.api_endpoint.replace(/\/invoke$/, '');
  const statusUrl = `${baseUrl}/status/${session_id}`;

  while (true) {
    await sleep(2000);

    const statusRes = await fetch(statusUrl);
    if (!statusRes.ok) {
      throw new Error(`Status check failed with ${statusRes.status}`);
    }

    const data = (await statusRes.json()) as StatusResponse;

    if (data.status === 'COMPLETE' && data.result) {
      return normalizeResponse(data.result);
    }

    if (data.status === 'ERROR') {
      throw new Error(data.error || 'Agent invocation failed');
    }
  }
}

function toNum(val: unknown): number {
  if (typeof val === 'number') return val;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function normalizeResponse(raw: ClaimValidationResponse): ClaimValidationResponse {
  const r = raw as unknown as Record<string, unknown>;

  return {
    claim_id: String(r.claim_id || ''),
    validation_id: String(r.validation_id || r.session_id || ''),
    timestamp: String(r.timestamp || ''),
    decision: normalizeDecision(r.decision),
    confidence_score: toNum(r.confidence_score),
    identity_verified: Boolean(r.identity_verified),
    policy_valid: Boolean(r.policy_valid),
    death_cert_valid: Boolean(r.death_cert_valid),
    risk_flags: Array.isArray(r.risk_flags) ? r.risk_flags.map(String) : [],
    explanation: String(r.explanation || ''),
    document_intake: r.document_intake ? r.document_intake as ClaimValidationResponse['document_intake'] : null,
    identity_verification: r.identity_verification ? r.identity_verification as ClaimValidationResponse['identity_verification'] : null,
    claim_validity: r.claim_validity ? r.claim_validity as ClaimValidationResponse['claim_validity'] : null,
    raw_analysis: (r.raw_analysis || {}) as Record<string, unknown>,
  };
}

function normalizeDecision(val: unknown): 'go' | 'no_go' | 'refer' {
  const s = String(val).toLowerCase();
  if (s === 'go') return 'go';
  if (s === 'no_go' || s === 'no-go' || s === 'nogo') return 'no_go';
  return 'refer';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
