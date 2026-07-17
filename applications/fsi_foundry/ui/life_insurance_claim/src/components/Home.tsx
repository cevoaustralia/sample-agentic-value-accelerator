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
  { value: '3', label: 'AI Agents', icon: 'agents' },
  { value: '4', label: 'Validation Modes', icon: 'modes' },
  { value: '<3min', label: 'Avg. Processing', icon: 'speed' },
];

const pipelineStages = [
  {
    title: 'Document Intake',
    desc: 'Amazon Textract extracts identity data, death certificates, and policy documents',
    color: '#F97316',
    iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    title: 'Identity Verification',
    desc: 'Claude cross-references identity data across all submitted documents for consistency',
    color: '#E11D48',
    iconPath: 'M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2m5.5-6a4 4 0 100-8 4 4 0 000 8zm11 11v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75',
  },
  {
    title: 'Claim Validity',
    desc: 'Validates policy status, beneficiary entitlement, and death certificate authenticity',
    color: '#4F46E5',
    iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
];

export default function Home({ config }: Props) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-16">

      {/* ── Hero ── */}
      <section className="text-center animate-fadeSlideUp">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6"
          style={{ background: 'var(--indigo-50)', color: 'var(--indigo-800)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          AI-Powered Claim Validation
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight mb-4 heading-dash" style={{ color: 'var(--text-primary)' }}>
          Life Insurance Claim
          <span className="block" style={{ color: 'var(--indigo-600)' }}>Validation Engine</span>
        </h1>
        <p className="text-lg max-w-2xl mx-auto mb-10" style={{ color: 'var(--text-secondary)' }}>
          {config.description}
        </p>

        {/* ── Recent claims feed ── */}
        <div className="relative max-w-3xl mx-auto mb-12 overflow-hidden rounded-xl border"
          style={{ borderColor: 'var(--slate-200)', background: 'white' }}>
          <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: 'var(--slate-100)', background: 'var(--indigo-900)' }}>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-bold" style={{ color: '#A5B4FC' }}>RECENT VALIDATIONS</span>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--slate-200)' }}>
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
            <div className="text-3xl font-extrabold mb-1" style={{ color: 'var(--indigo-600)' }}>{s.value}</div>
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
                  style={{ background: `${stage.color}15` }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={stage.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={stage.iconPath} />
                  </svg>
                </div>
                <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{stage.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{stage.desc}</p>
              </div>
              {i < pipelineStages.length - 1 && (
                <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
                  <path d="M4 12h20m0 0l-6-6m6 6l-6 6" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Agent Cards ── */}
      <section className="animate-fadeSlideUp stagger-3">
        <h2 className="text-2xl font-extrabold text-center mb-8 heading-dash" style={{ color: 'var(--text-primary)' }}>
          AI Validation Agents
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {config.agents.map((agent, i) => {
            const colors = [
              { bg: '#FFF7ED', border: '#F97316', text: '#EA580C', accent: '#FFF7ED' },
              { bg: '#FFF1F2', border: '#E11D48', text: '#BE123C', accent: '#FFF1F2' },
              { bg: '#EEF2FF', border: '#4F46E5', text: '#4338CA', accent: '#EEF2FF' },
            ][i];
            const icons = [
              'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
              'M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2m5.5-6a4 4 0 100-8 4 4 0 000 8zm11 11v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75',
              'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
            ][i];
            return (
              <div key={agent.id} className="card"
                style={{ borderTop: `3px solid ${colors.border}` }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: colors.accent }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={icons} />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold" style={{ color: colors.text }}>{agent.name}</h3>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{agent.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="text-center animate-fadeSlideUp stagger-4 pb-8">
        <div className="card max-w-lg mx-auto" style={{ background: 'linear-gradient(135deg, #EEF2FF, #F0FDF4)' }}>
          <h3 className="text-xl font-extrabold mb-2 heading-dash" style={{ color: 'var(--text-primary)' }}>Ready to validate?</h3>
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
            Try the validation engine with sample claim <code className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: 'white', color: 'var(--indigo-600)' }}>CLAIM-LI-001</code>
          </p>
          <Link to="/console"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #3730A3, #4F46E5)' }}>
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
