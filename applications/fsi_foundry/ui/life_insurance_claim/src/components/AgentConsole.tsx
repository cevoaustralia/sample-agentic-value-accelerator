// @ts-nocheck
import { useState, useCallback, useRef } from 'react';
import type { RuntimeConfig } from '../config';
import type { ClaimValidationResponse, ExecutionStatus } from '../types';
import { invokeAgent } from '../api/client';
import ResultsPanel from './ResultsPanel';

interface Props {
  config: RuntimeConfig;
}

type TabMode = 'sample' | 'upload';

interface UploadedFiles {
  identity: File | null;
  deathCert: File | null;
  policy: File | null;
  claimForm: File | null;
}

const SAMPLE_CLAIMS = {
  'CLAIM-LI-001': {
    claimant: 'Sarah Jane Mitchell (spouse)',
    deceased: 'David Robert Mitchell',
    dateOfDeath: '28 May 2026',
    causeOfDeath: 'Acute Myocardial Infarction',
    policyNumber: 'LI-2019-004782',
    policyStatus: 'Active',
    sumInsured: '$1,500,000',
    productType: 'Term Life (20 years)',
    documents: ['Passport (Sarah Mitchell)', 'Death Certificate (David Mitchell)', 'Policy Schedule', 'Claim Form'],
  },
  'CLAIM-LI-002': {
    claimant: 'Michael James Thompson (son)',
    deceased: 'Rebecca Anne Thompson',
    dateOfDeath: '14 Jan 2026',
    causeOfDeath: 'Metastatic Breast Cancer',
    policyNumber: 'LI-2020-009231',
    policyStatus: 'Active',
    sumInsured: '$800,000',
    productType: 'Whole Life',
    documents: ['Driver Licence (Michael Thompson)', 'Death Certificate (Rebecca Thompson)', 'Policy Schedule', 'Claim Form'],
  },
  'CLAIM-LI-003': {
    claimant: 'Patricia White (spouse)',
    deceased: 'George Edward White',
    dateOfDeath: '02 Nov 2025',
    causeOfDeath: 'Chronic Obstructive Pulmonary Disease',
    policyNumber: 'LI-2015-002147',
    policyStatus: 'Lapsed',
    sumInsured: '$500,000',
    productType: 'Term Life (10 years)',
    documents: ['Passport (Patricia White)', 'Death Certificate (George White)', 'Policy Schedule (expired)', 'Claim Form'],
  },
};

const flowLabels = ['Document Intake', 'Identity Verification', 'Claim Validity'];

/* ── Upload box component ── */
function UploadBox({ label, icon, file, onFileChange }: { label: string; icon: string; file: File | null; onFileChange: (f: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 hover:border-indigo-400 hover:bg-indigo-50/30"
      style={{
        borderColor: file ? 'var(--indigo-500)' : '#CBD5E1',
        background: file ? 'var(--indigo-50)' : 'white',
        borderStyle: file ? 'solid' : 'dashed',
      }}
      onClick={() => inputRef.current?.click()}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      {file && (
        <div className="text-xs font-bold mt-1" style={{ color: 'var(--indigo-600)' }}>{file.name}</div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => onFileChange(e.target.files?.[0] || null)}
      />
    </div>
  );
}

export default function AgentConsole({ config }: Props) {
  const { input_schema } = config;
  const [tabMode, setTabMode] = useState<TabMode>('sample');
  const [claimId, setClaimId] = useState('');
  const [validationType, setValidationType] = useState(input_schema.type_options[0].value);
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [result, setResult] = useState<ClaimValidationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(-1);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({
    identity: null,
    deathCert: null,
    policy: null,
    claimForm: null,
  });

  const selectedClaim = SAMPLE_CLAIMS[claimId as keyof typeof SAMPLE_CLAIMS];
  const hasUploadedFiles = uploadedFiles.identity || uploadedFiles.deathCert;

  const handleSubmit = useCallback(async () => {
    if (!claimId.trim()) return;
    setStatus('running');
    setError(null);
    setResult(null);
    setActiveStep(0);

    const stepTimer1 = setTimeout(() => setActiveStep(1), 3000);
    const stepTimer2 = setTimeout(() => setActiveStep(2), 6000);

    try {
      const payload: Record<string, string> = {
        [input_schema.id_field]: claimId.trim(),
        [input_schema.type_field]: validationType,
      };
      const res = await invokeAgent(config, payload);
      setResult(res);
      setStatus('complete');
      setActiveStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setStatus('error');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
    }
  }, [claimId, validationType, config, input_schema]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">

      {/* ── Header ── */}
      <div className="animate-fadeSlideUp">
        <h1 className="text-3xl font-extrabold tracking-tight heading-dash" style={{ color: 'var(--text-primary)' }}>
          Claim Validation Console
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Validate life insurance claims through the AI document analysis and verification pipeline
        </p>
      </div>

      {/* ── Input Form ── */}
      <div className="card animate-fadeSlideUp stagger-1">
        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTabMode('sample')}
            className="px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all duration-200"
            style={{
              borderColor: tabMode === 'sample' ? 'transparent' : '#E2E8F0',
              background: tabMode === 'sample' ? 'linear-gradient(135deg, #3730A3, #4F46E5)' : 'white',
              color: tabMode === 'sample' ? 'white' : 'var(--text-secondary)',
            }}
          >
            Sample Claims
          </button>
          <button
            onClick={() => setTabMode('upload')}
            className="px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all duration-200"
            style={{
              borderColor: tabMode === 'upload' ? 'transparent' : '#E2E8F0',
              background: tabMode === 'upload' ? 'linear-gradient(135deg, #3730A3, #4F46E5)' : 'white',
              color: tabMode === 'upload' ? 'white' : 'var(--text-secondary)',
            }}
          >
            Upload Documents
          </button>
        </div>

        {/* ── Sample Claims Tab ── */}
        {tabMode === 'sample' && (
          <>
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-secondary)' }}>
                {input_schema.id_label}
              </label>
              <input
                type="text"
                value={claimId}
                onChange={(e) => setClaimId(e.target.value)}
                placeholder={input_schema.id_placeholder}
                className="w-full px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 outline-none"
                style={{
                  borderColor: claimId ? 'var(--indigo-500)' : '#E2E8F0',
                  background: claimId ? 'var(--indigo-50)' : 'white',
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              {input_schema.test_entities.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Sample claims:</span>
                  {input_schema.test_entities.map((id) => (
                    <button key={id} onClick={() => setClaimId(id)}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg transition-colors hover:opacity-80"
                      style={{ background: 'var(--indigo-50)', color: 'var(--indigo-800)' }}>
                      {id}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Claim Details Preview */}
            {selectedClaim && (
              <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl" style={{ background: 'var(--orange-50)', borderLeft: '3px solid var(--orange-500)' }}>
                  <div className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--orange-600)' }}>Claimant</div>
                  <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedClaim.claimant}</div>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'var(--rose-50)', borderLeft: '3px solid var(--rose-500)' }}>
                  <div className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--rose-600)' }}>Deceased</div>
                  <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedClaim.deceased}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedClaim.dateOfDeath}</div>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'var(--indigo-50)', borderLeft: '3px solid var(--indigo-500)' }}>
                  <div className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--indigo-600)' }}>Policy</div>
                  <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedClaim.policyNumber}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedClaim.policyStatus} · {selectedClaim.sumInsured}</div>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'var(--green-50)', borderLeft: '3px solid var(--green-500)' }}>
                  <div className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--green-700)' }}>Documents ({selectedClaim.documents.length})</div>
                  {selectedClaim.documents.map((d, i) => (
                    <div key={i} className="text-xs" style={{ color: 'var(--text-secondary)' }}>📄 {d}</div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Upload Documents Tab ── */}
        {tabMode === 'upload' && (
          <>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Upload identity documents, death certificates, and policy documents. The AI agents will extract data, verify identity, and validate the claim.
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <UploadBox
                label="Identity Document"
                icon="🪪"
                file={uploadedFiles.identity}
                onFileChange={(f) => setUploadedFiles((prev) => ({ ...prev, identity: f }))}
              />
              <UploadBox
                label="Death Certificate"
                icon="📜"
                file={uploadedFiles.deathCert}
                onFileChange={(f) => setUploadedFiles((prev) => ({ ...prev, deathCert: f }))}
              />
              <UploadBox
                label="Policy Document"
                icon="📋"
                file={uploadedFiles.policy}
                onFileChange={(f) => setUploadedFiles((prev) => ({ ...prev, policy: f }))}
              />
              <UploadBox
                label="Claim Form"
                icon="📝"
                file={uploadedFiles.claimForm}
                onFileChange={(f) => setUploadedFiles((prev) => ({ ...prev, claimForm: f }))}
              />
            </div>
            <p className="text-xs text-center mb-2" style={{ color: 'var(--text-muted)' }}>
              Accepted formats: PDF, JPG, PNG, WebP. Documents are uploaded to S3 and processed by Amazon Textract + Claude.
            </p>
          </>
        )}

        {/* Validation Type Cards */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider mb-3"
            style={{ color: 'var(--text-secondary)' }}>
            Validation Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {input_schema.type_options.map((opt) => {
              const selected = validationType === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setValidationType(opt.value)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer"
                  style={{
                    borderColor: selected ? 'var(--indigo-600)' : '#E2E8F0',
                    background: selected ? 'var(--indigo-50)' : 'white',
                    transform: selected ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  <span className="text-xs font-bold" style={{ color: selected ? 'var(--indigo-800)' : 'var(--text-secondary)' }}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={(tabMode === 'sample' && !claimId.trim()) || (tabMode === 'upload' && !hasUploadedFiles) || status === 'running'}
          className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
          style={{ background: 'linear-gradient(135deg, #3730A3, #4F46E5)' }}
        >
          {status === 'running' ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" opacity="0.3" />
                <path d="M12 2a10 10 0 019.8 8" stroke="white" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Validation in Progress...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {tabMode === 'upload' ? 'Validate Uploaded Documents (Textract + Claude)' : 'Run Claim Validation (Textract + Claude)'}
            </span>
          )}
        </button>
      </div>

      {/* ── Processing Flow ── */}
      {status === 'running' && (
        <div className="card animate-fadeSlideUp">
          <h3 className="text-sm font-bold mb-5" style={{ color: 'var(--text-primary)' }}>Agent Pipeline</h3>
          <div className="flex items-center justify-between mb-6">
            {flowLabels.map((label, i) => (
              <div key={label} className="flex items-center gap-3 flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                      activeStep > i ? 'text-white' : activeStep === i ? 'text-white animate-pulseIndigo' : 'text-gray-400'
                    }`}
                    style={{
                      background: activeStep > i
                        ? 'var(--green-600)'
                        : activeStep === i
                          ? 'linear-gradient(135deg, #3730A3, #4F46E5)'
                          : '#F1F5F9',
                    }}
                  >
                    {activeStep > i ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className="text-xs font-semibold mt-2" style={{
                    color: activeStep >= i ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}>{label}</span>
                </div>
                {i < flowLabels.length - 1 && (
                  <div className="flex-1 h-1 rounded-full mx-2 mt-[-20px]"
                    style={{
                      background: activeStep > i ? 'var(--green-600)' : '#E2E8F0',
                      transition: 'background 0.5s ease',
                    }} />
                )}
              </div>
            ))}
          </div>

          {/* Agent Status Cards */}
          <div className="grid grid-cols-3 gap-3">
            {config.agents.map((agent, i) => {
              const agentColors = ['#F97316', '#E11D48', '#4F46E5'];
              const isActive = activeStep === i;
              const isDone = activeStep > i;
              return (
                <div key={agent.id}
                  className="p-3 rounded-xl border transition-all duration-300"
                  style={{
                    borderColor: isActive ? agentColors[i] : isDone ? 'var(--green-600)' : '#E2E8F0',
                    background: isActive ? `${agentColors[i]}08` : isDone ? 'var(--green-50)' : 'white',
                  }}>
                  <div className="flex items-center gap-2 mb-2">
                    {isDone ? (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--green-50)' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--green-600)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    ) : isActive ? (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: `${agentColors[i]}20` }}>
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: agentColors[i] }} />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full" style={{ background: 'var(--slate-100)' }} />
                    )}
                    <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{agent.name}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--slate-100)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: isDone ? '100%' : isActive ? '60%' : '0%',
                        background: `linear-gradient(90deg, ${agentColors[i]}, ${agentColors[i]}88)`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {status === 'error' && error && (
        <div className="card animate-fadeSlideUp" style={{ borderLeft: '4px solid var(--rose-600)' }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--rose-50)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--rose-600)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--rose-600)' }}>Validation Error</h3>
              <p className="text-xs" style={{ color: 'var(--rose-500)' }}>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {status === 'complete' && result && (
        <ResultsPanel result={result} />
      )}
    </div>
  );
}
