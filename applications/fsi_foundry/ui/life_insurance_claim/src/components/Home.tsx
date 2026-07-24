import { Link } from 'react-router-dom';
import type { RuntimeConfig } from '../config';

interface Props {
  config: RuntimeConfig;
}

const sampleClaims = [
  { id: 'CLAIM-LI-001', scenario: 'Valid claim — all documents consistent', decision: 'GO', time: '2m 14s' },
  { id: 'CLAIM-LI-002', scenario: 'Name mismatch between ID and policy', decision: 'REFER', time: '1m 52s' },
  { id: 'CLAIM-LI-003', scenario: 'Lapsed policy, expired coverage', decision: 'NO_GO', time: '1m 38s' },
];

const stats = [
  { value: '4', label: 'AI Agents' },
  { value: '4', label: 'Validation Modes' },
  { value: '<3min', label: 'Avg. Processing' },
];

const pipelineStages = [
  {
    title: 'Document Intake',
    desc: 'S3 document retrieval + Amazon Textract extracts identity data, death certificates, and policy documents',
    color: '#FF8F00',
    iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    title: 'Identity Verification',
    desc: 'Claude cross-references identity data across all submitted documents for consistency',
    color: '#D3145A',
    iconPath: 'M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2m5.5-6a4 4 0 100-8 4 4 0 000 8zm11 11v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75',
  },
  {
    title: 'Claim Validity',
    desc: 'Validates policy status, beneficiary entitlement, and death certificate authenticity',
    color: '#7204B9',
    iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'Decision Synthesis',
    desc: 'Claude synthesizes all agent results into a final GO / NO_GO / REFER decision with explanation',
    color: '#059669',
    iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
];

export default function Home({ config }: Props) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-16">

      {/* ── Hero ── */}
      <section className="text-center animate-fadeSlideUp">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6"
          style={{ background: 'rgba(255, 143, 0, 0.08)', color: 'var(--accent)', border: '1px solid rgba(255, 143, 0, 0.25)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          AI-Powered Claim Validation
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight mb-4 heading-dash" style={{ color: 'var(--text-primary)' }}>
          Life Insurance Claim
          <span className="block gradient-text">Validation Engine</span>
        </h1>
        <p className="text-lg max-w-2xl mx-auto mb-10" style={{ color: 'var(--text-secondary)' }}>
          {config.description}
        </p>

        {/* ── Recent claims feed ── */}
        <div className="relative max-w-3xl mx-auto mb-12 overflow-hidden rounded-xl border"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--approve)' }} />
            <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>RECENT VALIDATIONS</span>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {sampleClaims.map((claim, i) => (
              <div key={claim.id} className="flex items-center gap-4 px-4 py-3 animate-fadeSlideUp"
                style={{ animationDelay: `${i * 0.15}s` }}>
                <span className={`decision-badge text-xs py-1 px-2 ${claim.decision === 'GO' ? 'go' : claim.decision === 'NO_GO' ? 'no_go' : 'refer'}`}
                  style={{ fontSize: '0.6rem' }}>
                  {claim.decision.replace('_', ' ')}
                </span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{claim.id}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{claim.scenario}</p>
                </div>
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{claim.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="grid grid-cols-3 gap-6 max-w-2xl mx-auto animate-fadeSlideUp stagger-1">
        {stats.map((s) => (
          <div key={s.label} className="card text-center">
            <div className="text-3xl font-extrabold mb-1" style={{ color: 'var(--accent)' }}>{s.value}</div>
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── Pipeline Visualization ── */}
      <section className="animate-fadeSlideUp stagger-2">
        <h2 className="text-2xl font-extrabold text-center mb-8 heading-dash" style={{ color: 'var(--text-primary)' }}>
          Validation Pipeline
        </h2>
        <div className="flex items-center justify-center gap-4">
          {pipelineStages.map((stage, i) => (
            <div key={stage.title} className="flex items-center gap-4">
              <div className="card text-center px-8 py-6 flex flex-col items-center"
                style={{ borderTop: `3px solid ${stage.color}`, minWidth: '200px' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: `linear-gradient(135deg, ${stage.color}, ${stage.color}cc)` }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={stage.iconPath} />
                  </svg>
                </div>
                <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{stage.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{stage.desc}</p>
              </div>
              {i < pipelineStages.length - 1 && (
                <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
                  <path d="M4 12h20m0 0l-6-6m6 6l-6 6" stroke="#FF8F00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Architecture Diagram (SVG) ── */}
      <section className="animate-fadeSlideUp stagger-3">
        <h2 className="text-2xl font-extrabold text-center mb-8 heading-dash" style={{ color: 'var(--text-primary)' }}>
          Platform Architecture
        </h2>
        <div className="card p-8 max-w-5xl mx-auto overflow-x-auto">
          <svg viewBox="0 0 1000 700" fill="none" className="w-full" style={{ minWidth: '700px' }}>
            <defs>
              <marker id="arrowOrange" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <path d="M0,0 L8,3 L0,6 Z" fill="#FF8F00" />
              </marker>
              <linearGradient id="bgGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFBEB" />
                <stop offset="100%" stopColor="#FEF3C7" />
              </linearGradient>
              <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF7ED" />
                <stop offset="100%" stopColor="#FFEDD5" />
              </linearGradient>
              <linearGradient id="bgGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F0FDF4" />
                <stop offset="100%" stopColor="#DCFCE7" />
              </linearGradient>
              <linearGradient id="bgGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ECFDF5" />
                <stop offset="100%" stopColor="#A7F3D0" />
              </linearGradient>
            </defs>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* ROW 0: User → CloudFront → S3 (Frontend)               */}
            {/* ═══════════════════════════════════════════════════════ */}
            <rect x="30" y="15" width="110" height="70" rx="10" fill="url(#bgGrad1)" stroke="#FF8F00" strokeWidth="1.5" />
            <text x="85" y="42" textAnchor="middle" fill="#FF8F00" fontSize="11" fontWeight="600">Claims Handler</text>
            <text x="85" y="58" textAnchor="middle" fill="#737373" fontSize="8">Browser / SPA</text>

            <line x1="140" y1="50" x2="210" y2="50" stroke="#FF8F00" strokeWidth="1.5" markerEnd="url(#arrowOrange)" />

            <image href="/aws-icons/Arch_Amazon-CloudFront_48.svg" x="222" y="18" width="36" height="36" />
            <text x="240" y="72" textAnchor="middle" fill="#FF8F00" fontSize="10" fontWeight="600">CloudFront</text>
            <text x="240" y="84" textAnchor="middle" fill="#737373" fontSize="8">CDN + Lambda@Edge</text>

            <line x1="270" y1="55" x2="350" y2="55" stroke="#FF8F00" strokeWidth="1.5" markerEnd="url(#arrowOrange)" />
            <text x="310" y="48" textAnchor="middle" fill="#A3A3A3" fontSize="7">OAC</text>

            <image href="/aws-icons/Arch_Amazon-Simple-Storage-Service_48.svg" x="362" y="18" width="36" height="36" />
            <text x="380" y="72" textAnchor="middle" fill="#FF8F00" fontSize="10" fontWeight="600">S3</text>
            <text x="380" y="84" textAnchor="middle" fill="#737373" fontSize="8">Static UI Assets</text>

            {/* CloudFront → API Layer (down arrow) */}
            <line x1="240" y1="90" x2="240" y2="130" stroke="#FF8F00" strokeWidth="1.5" />
            <line x1="240" y1="130" x2="160" y2="130" stroke="#FF8F00" strokeWidth="1.5" />
            <line x1="160" y1="130" x2="160" y2="160" stroke="#FF8F00" strokeWidth="1.5" markerEnd="url(#arrowOrange)" />
            <text x="200" y="126" textAnchor="middle" fill="#A3A3A3" fontSize="7">/api/* routing</text>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* ROW 1: API Layer — Proxy Lambda → Invoke Lambda         */}
            {/* ═══════════════════════════════════════════════════════ */}
            <image href="/aws-icons/Arch_AWS-Lambda_48.svg" x="72" y="162" width="36" height="36" />
            <text x="90" y="214" textAnchor="middle" fill="#D3145A" fontSize="10" fontWeight="600">Proxy Lambda</text>
            <text x="90" y="226" textAnchor="middle" fill="#737373" fontSize="8">SigV4 Signing</text>

            <line x1="120" y1="180" x2="210" y2="180" stroke="#D3145A" strokeWidth="1.5" markerEnd="url(#arrowOrange)" />
            <text x="165" y="174" textAnchor="middle" fill="#A3A3A3" fontSize="7">IAM Auth</text>

            <image href="/aws-icons/Arch_AWS-Lambda_48.svg" x="222" y="162" width="36" height="36" />
            <text x="240" y="214" textAnchor="middle" fill="#D3145A" fontSize="10" fontWeight="600">Invoke Lambda</text>
            <text x="240" y="226" textAnchor="middle" fill="#737373" fontSize="8">StartStepFunction</text>

            {/* Invoke Lambda → Step Functions */}
            <line x1="240" y1="230" x2="240" y2="270" stroke="#D3145A" strokeWidth="1.5" markerEnd="url(#arrowOrange)" />

            {/* ═══════════════════════════════════════════════════════ */}
            {/* ROW 2: Orchestration — Step Functions                   */}
            {/* ═══════════════════════════════════════════════════════ */}
            <rect x="120" y="270" width="240" height="70" rx="12" fill="#FEF2F2" stroke="#DC2626" strokeWidth="2" />
            <text x="240" y="300" textAnchor="middle" fill="#DC2626" fontSize="12" fontWeight="700">Step Functions</text>
            <text x="240" y="318" textAnchor="middle" fill="#737373" fontSize="9">Express Workflow — Synchronous</text>
            <text x="240" y="332" textAnchor="middle" fill="#A3A3A3" fontSize="7">Orchestrates 4-agent pipeline</text>

            {/* Step Functions → Agent Pipeline (vertical drop then branch) */}
            <line x1="240" y1="340" x2="240" y2="380" stroke="#DC2626" strokeWidth="1.5" />
            {/* Horizontal spine at y=380 */}
            <line x1="100" y1="380" x2="580" y2="380" stroke="#DC2626" strokeWidth="1.5" />
            {/* Drop to Document Intake (center x=100) */}
            <line x1="100" y1="380" x2="100" y2="410" stroke="#DC2626" strokeWidth="1.5" markerEnd="url(#arrowOrange)" />
            {/* Drop to Identity Verification (center x=340) */}
            <line x1="340" y1="380" x2="340" y2="410" stroke="#DC2626" strokeWidth="1.5" markerEnd="url(#arrowOrange)" />
            {/* Drop to Claim Validity (center x=580) */}
            <line x1="580" y1="380" x2="580" y2="410" stroke="#DC2626" strokeWidth="1.5" markerEnd="url(#arrowOrange)" />

            {/* ═══════════════════════════════════════════════════════ */}
            {/* ROW 3: Agent Pipeline — 3 agents then synthesis below  */}
            {/* ═══════════════════════════════════════════════════════ */}
            {/* Agent 1: Document Intake (center x=100) */}
            <rect x="10" y="410" width="180" height="60" rx="10" fill="url(#bgGrad1)" stroke="#FF8F00" strokeWidth="2" />
            <text x="100" y="435" textAnchor="middle" fill="#FF8F00" fontSize="11" fontWeight="700">Document Intake</text>
            <text x="100" y="453" textAnchor="middle" fill="#737373" fontSize="8">Textract + S3 Retrieval</text>
            <text x="100" y="465" textAnchor="middle" fill="#A3A3A3" fontSize="7">Step 1 — Sequential</text>

            {/* Arrow: Intake → Identity */}
            <line x1="190" y1="440" x2="250" y2="440" stroke="#FF8F00" strokeWidth="1.5" strokeDasharray="4,3" markerEnd="url(#arrowOrange)" />
            <text x="220" y="434" textAnchor="middle" fill="#A3A3A3" fontSize="7">data</text>

            {/* Agent 2: Identity Verification (center x=340) */}
            <rect x="250" y="410" width="180" height="60" rx="10" fill="url(#bgGrad2)" stroke="#D3145A" strokeWidth="2" />
            <text x="340" y="435" textAnchor="middle" fill="#D3145A" fontSize="11" fontWeight="700">Identity Verification</text>
            <text x="340" y="453" textAnchor="middle" fill="#737373" fontSize="8">Claude Cross-Reference</text>
            <text x="340" y="465" textAnchor="middle" fill="#A3A3A3" fontSize="7">Step 2a — Parallel</text>

            {/* Agent 3: Claim Validity (center x=580) */}
            <rect x="490" y="410" width="180" height="60" rx="10" fill="url(#bgGrad3)" stroke="#7204B9" strokeWidth="2" />
            <text x="580" y="435" textAnchor="middle" fill="#7204B9" fontSize="11" fontWeight="700">Claim Validity</text>
            <text x="580" y="453" textAnchor="middle" fill="#737373" fontSize="8">Policy + Exclusion Check</text>
            <text x="580" y="465" textAnchor="middle" fill="#A3A3A3" fontSize="7">Step 2b — Parallel</text>

            {/* Merge arrows down to Decision Synthesis */}
            <line x1="340" y1="470" x2="340" y2="500" stroke="#D3145A" strokeWidth="1.5" strokeDasharray="4,3" />
            <line x1="580" y1="470" x2="580" y2="500" stroke="#7204B9" strokeWidth="1.5" strokeDasharray="4,3" />
            <line x1="340" y1="500" x2="580" y2="500" stroke="#DC2626" strokeWidth="1.5" strokeDasharray="4,3" />
            <line x1="460" y1="500" x2="460" y2="520" stroke="#DC2626" strokeWidth="1.5" markerEnd="url(#arrowOrange)" />

            {/* Agent 4: Decision Synthesis (centered between agents 2 & 3) */}
            <rect x="320" y="520" width="280" height="60" rx="10" fill="url(#bgGrad4)" stroke="#059669" strokeWidth="2" />
            <text x="460" y="545" textAnchor="middle" fill="#059669" fontSize="11" fontWeight="700">Decision Synthesis</text>
            <text x="460" y="563" textAnchor="middle" fill="#737373" fontSize="8">Claude — GO / NO_GO / REFER</text>
            <text x="460" y="575" textAnchor="middle" fill="#A3A3A3" fontSize="7">Step 3 — Final Decision</text>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* ROW 4: AWS Services (bottom)                            */}
            {/* ═══════════════════════════════════════════════════════ */}
            {/* Textract */}
            <line x1="100" y1="470" x2="100" y2="600" stroke="#FF8F00" strokeWidth="1" strokeDasharray="4,3" />
            <rect x="10" y="600" width="180" height="55" rx="8" fill="#FFF7ED" stroke="#FF8F00" strokeWidth="1" strokeDasharray="4,2" />
            <image href="/aws-icons/Arch_Amazon-Textract_48.svg" x="22" y="608" width="36" height="36" />
            <text x="65" y="628" textAnchor="start" fill="#FF8F00" fontSize="10" fontWeight="600">Amazon Textract</text>
            <text x="65" y="643" textAnchor="start" fill="#737373" fontSize="8">AnalyzeID + AnalyzeDocument</text>

            {/* S3 Documents Bucket */}
            <line x1="190" y1="625" x2="272" y2="625" stroke="#FF8F00" strokeWidth="1" strokeDasharray="4,3" />
            <image href="/aws-icons/Arch_Amazon-Simple-Storage-Service_48.svg" x="272" y="602" width="36" height="36" />
            <text x="290" y="654" textAnchor="middle" fill="#FF8F00" fontSize="10" fontWeight="600">S3 Documents</text>
            <text x="290" y="666" textAnchor="middle" fill="#737373" fontSize="8">Claim Files (Private)</text>

            {/* Bedrock / Claude */}
            <line x1="460" y1="580" x2="460" y2="600" stroke="#7204B9" strokeWidth="1" strokeDasharray="4,3" />
            <line x1="460" y1="600" x2="580" y2="600" stroke="#7204B9" strokeWidth="1" strokeDasharray="4,3" />
            <image href="/aws-icons/Arch_Amazon-Bedrock_48.svg" x="562" y="602" width="36" height="36" />
            <text x="580" y="654" textAnchor="middle" fill="#7204B9" fontSize="10" fontWeight="600">Amazon Bedrock</text>
            <text x="580" y="666" textAnchor="middle" fill="#737373" fontSize="8">Claude Sonnet 4.5 (x3 agents)</text>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* ROW 5: Security & Monitoring (right sidebar)            */}
            {/* ═══════════════════════════════════════════════════════ */}
            <rect x="820" y="15" width="160" height="650" rx="12" fill="#FAFAFA" stroke="#E5E7EB" strokeWidth="1" />
            <text x="900" y="42" textAnchor="middle" fill="#374151" fontSize="11" fontWeight="700">Security & Monitoring</text>

            <line x1="840" y1="55" x2="960" y2="55" stroke="#E5E7EB" strokeWidth="1" />

            {/* CloudWatch */}
            <image href="/aws-icons/Arch_Amazon-CloudWatch_48.svg" x="842" y="62" width="36" height="36" />
            <text x="860" y="114" textAnchor="middle" fill="#FF8F00" fontSize="9" fontWeight="600">CloudWatch</text>
            <text x="860" y="126" textAnchor="middle" fill="#737373" fontSize="7">Logs + Metrics</text>

            {/* X-Ray */}
            <image href="/aws-icons/Arch_AWS-X-Ray_48.svg" x="842" y="132" width="36" height="36" />
            <text x="860" y="184" textAnchor="middle" fill="#FF8F00" fontSize="9" fontWeight="600">X-Ray</text>
            <text x="860" y="196" textAnchor="middle" fill="#737373" fontSize="7">Tracing</text>

            {/* IAM */}
            <rect x="840" y="200" width="120" height="45" rx="6" fill="#FEF2F2" stroke="#DC2626" strokeWidth="1" />
            <text x="900" y="220" textAnchor="middle" fill="#DC2626" fontSize="9" fontWeight="600">IAM</text>
            <text x="900" y="235" textAnchor="middle" fill="#737373" fontSize="7">SigV4 + Policies</text>

            {/* Lambda@Edge */}
            <rect x="840" y="260" width="120" height="45" rx="6" fill="#FEF2F2" stroke="#DC2626" strokeWidth="1" />
            <text x="900" y="280" textAnchor="middle" fill="#DC2626" fontSize="9" fontWeight="600">Lambda@Edge</text>
            <text x="900" y="295" textAnchor="middle" fill="#737373" fontSize="7">Basic Auth</text>

            {/* S3 Security */}
            <rect x="840" y="320" width="120" height="45" rx="6" fill="#FEF2F2" stroke="#DC2626" strokeWidth="1" />
            <text x="900" y="340" textAnchor="middle" fill="#DC2626" fontSize="9" fontWeight="600">S3 Block Public</text>
            <text x="900" y="355" textAnchor="middle" fill="#737373" fontSize="7">Private Bucket</text>

            {/* Bedrock Security */}
            <rect x="840" y="380" width="120" height="45" rx="6" fill="#FEF2F2" stroke="#DC2626" strokeWidth="1" />
            <text x="900" y="400" textAnchor="middle" fill="#DC2626" fontSize="9" fontWeight="600">Bedrock IAM</text>
            <text x="900" y="415" textAnchor="middle" fill="#737373" fontSize="7">Model Access</text>

            {/* Cost */}
            <rect x="840" y="450" width="120" height="45" rx="6" fill="#F0FDF4" stroke="#059669" strokeWidth="1" />
            <text x="900" y="470" textAnchor="middle" fill="#059669" fontSize="9" fontWeight="600">Cost</text>
            <text x="900" y="485" textAnchor="middle" fill="#737373" fontSize="7">~$0.22 / claim</text>

            {/* Latency */}
            <rect x="840" y="505" width="120" height="45" rx="6" fill="#F0FDF4" stroke="#059669" strokeWidth="1" />
            <text x="900" y="525" textAnchor="middle" fill="#059669" fontSize="9" fontWeight="600">Latency</text>
            <text x="900" y="540" textAnchor="middle" fill="#737373" fontSize="7">&lt; 3 min avg</text>

            {/* Connection lines from sidebar to main */}
            <line x1="820" y1="220" x2="780" y2="220" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4,3" />
            <line x1="820" y1="340" x2="780" y2="340" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4,3" />
            <line x1="820" y1="470" x2="780" y2="470" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4,3" />
          </svg>
        </div>
      </section>

      {/* ── Agent Cards ── */}
      <section className="animate-fadeSlideUp stagger-4">
        <h2 className="text-2xl font-extrabold text-center mb-8 heading-dash" style={{ color: 'var(--text-primary)' }}>
          AI Validation Agents
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {config.agents.map((agent, i) => {
            const colors = [
              { bg: '#FFFBEB', border: '#FF8F00', text: '#FF8F00', accent: '#FF8F00' },
              { bg: '#FFF7ED', border: '#D3145A', text: '#D3145A', accent: '#D3145A' },
              { bg: '#F5F3FF', border: '#7204B9', text: '#7204B9', accent: '#7204B9' },
              { bg: '#ECFDF5', border: '#059669', text: '#059669', accent: '#059669' },
            ];
            const icons = [
              'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
              'M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2m5.5-6a4 4 0 100-8 4 4 0 000 8zm11 11v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75',
              'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
              'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
            ];
            const c = colors[i % colors.length];
            return (
              <div key={agent.id} className="card"
                style={{ borderTop: `3px solid ${c.border}` }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${c.border}, ${c.border}cc)` }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={icons[i]} />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold" style={{ color: c.text }}>{agent.name}</h3>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{agent.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="text-center animate-fadeSlideUp stagger-5 pb-8">
        <div className="card max-w-lg mx-auto">
          <h3 className="text-xl font-extrabold mb-2 heading-dash" style={{ color: 'var(--text-primary)' }}>Ready to validate?</h3>
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
            Try the validation engine with sample claim <code className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: 'rgba(255,143,0,0.08)', color: 'var(--accent)' }}>CLAIM-LI-001</code>
          </p>
          <Link to="/console"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #FF8F00, #F05A2A)', boxShadow: '0 4px 14px rgba(255,143,0,0.3)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Validate a Claim
          </Link>
        </div>
      </section>
    </div>
  );
}
