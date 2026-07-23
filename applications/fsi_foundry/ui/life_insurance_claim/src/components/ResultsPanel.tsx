import { useState } from 'react';
import type { ClaimValidationResponse } from '../types';

interface Props {
  result: ClaimValidationResponse;
}

/* ── Helper: Radial progress circle ── */
function RadialProgress({ value, size = 72, stroke = 6, color = '#FF8F00' }: { value: number; size?: number; stroke?: number; color?: string }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="radial-progress" style={{ '--size': `${size}px`, '--stroke': `${stroke}px` } as React.CSSProperties}>
      <svg>
        <circle className="track" cx={size / 2} cy={size / 2} r={radius} />
        <circle className="fill" cx={size / 2} cy={size / 2} r={radius}
          style={{ stroke: color, strokeDasharray: circumference, strokeDashoffset: offset }} />
      </svg>
      <span className="label">{value}%</span>
    </div>
  );
}

/* ── Helper: Verification metric ── */
function VerificationMetric({ label, passed, icon }: { label: string; passed: boolean; icon: string }) {
  return (
    <div className="metric-card">
      <div className={`metric-card-accent ${passed ? 'go' : 'no-go'}`} />
      <div className="p-4 text-center">
        <div className="text-2xl mb-1">{icon}</div>
        <div className={`text-2xl font-extrabold ${passed ? 'text-green-600' : 'text-red-600'}`}>
          {passed ? '✓' : '✗'}
        </div>
        <div className="text-xs font-semibold mt-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
      </div>
    </div>
  );
}

export default function ResultsPanel({ result }: Props) {
  const [rawExpanded, setRawExpanded] = useState(false);

  const confidencePct = Math.round(result.confidence_score * 100);
  const confidenceColor = confidencePct >= 80 ? 'var(--approve)' : confidencePct >= 60 ? 'var(--escalate)' : 'var(--reject)';

  const decisionLabel = {
    go: '✅ GO — Approve Claim',
    no_go: '❌ NO GO — Decline',
    refer: '⚠️ REFER — Manual Review',
  }[result.decision];

  return (
    <div className="space-y-6 animate-fadeSlideUp">

      {/* ── Decision Header ── */}
      <div className="card" style={{ borderTop: `4px solid ${result.decision === 'go' ? 'var(--approve)' : result.decision === 'no_go' ? 'var(--reject)' : 'var(--escalate)'}` }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-extrabold heading-dash" style={{ color: 'var(--text-primary)' }}>Validation Result</h2>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                {result.claim_id}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {result.timestamp ? new Date(result.timestamp).toLocaleString() : ''}
              </span>
            </div>
          </div>
          <span className={`decision-badge ${result.decision}`}>
            {decisionLabel}
          </span>
        </div>
      </div>

      {/* ── Confidence + Verification Metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeSlideUp stagger-1">
        {/* Confidence */}
        <div className="metric-card">
          <div className="metric-card-accent neutral" />
          <div className="p-4 flex items-center gap-4">
            <RadialProgress value={confidencePct} size={64} stroke={5} color={confidenceColor} />
            <div>
              <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Confidence</div>
              <div className="text-lg font-extrabold" style={{ color: confidenceColor }}>{confidencePct}%</div>
            </div>
          </div>
        </div>

        {/* Identity */}
        <VerificationMetric label="Identity" passed={result.identity_verified} icon="🪪" />

        {/* Policy */}
        <VerificationMetric label="Policy" passed={result.policy_valid} icon="📋" />

        {/* Death Certificate */}
        <VerificationMetric label="Death Cert" passed={result.death_cert_valid} icon="📜" />
      </div>

      {/* ── Risk Flags ── */}
      {result.risk_flags.length > 0 && (
        <div className="card animate-fadeSlideUp stagger-2">
          <h3 className="text-sm font-extrabold mb-3 flex items-center gap-2" style={{ color: 'var(--escalate)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Risk Flags ({result.risk_flags.length})
          </h3>
          <div className="space-y-1">
            {result.risk_flags.map((flag, i) => (
              <div key={i} className="risk-flag animate-signalReveal" style={{ animationDelay: `${i * 0.1}s` }}>
                ⚠️ {flag}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Explanation ── */}
      <div className="card animate-fadeSlideUp stagger-3" style={{ borderLeft: '4px solid var(--accent)' }}>
        <h3 className="text-sm font-extrabold mb-2 flex items-center gap-2 heading-dash" style={{ color: 'var(--text-primary)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          Decision Explanation
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {result.explanation || 'No explanation available.'}
        </p>
      </div>

      {/* ── Agent Details (collapsible) ── */}
      {Object.keys(result.raw_analysis).length > 0 && (
        <div className="card animate-fadeSlideUp stagger-4">
          <button
            onClick={() => setRawExpanded(!rawExpanded)}
            className="w-full flex items-center justify-between text-sm font-bold"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              Raw Agent Analysis
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: rawExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {rawExpanded && (
            <pre className="mt-4 p-4 rounded-xl text-xs overflow-x-auto"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontFamily: 'ui-monospace, monospace' }}>
              {JSON.stringify(result.raw_analysis, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
