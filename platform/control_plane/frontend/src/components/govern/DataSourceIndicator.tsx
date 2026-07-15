/**
 * DataSourceIndicator — Shows users which data is live vs mock
 *
 * Helps users understand what integrations are needed for production use.
 */

import { useState } from 'react';

interface DataSource {
  name: string;
  status: 'live' | 'mock';
  description: string;
  integration?: string;
}

const DATA_SOURCES: DataSource[] = [
  // Live data from AVA
  { name: 'Use Cases', status: 'live', description: 'From Plan module prioritization API' },
  { name: 'Business Cases', status: 'live', description: 'From Plan module business cases API' },
  { name: 'Maturity Assessments', status: 'live', description: 'From Plan module maturity API' },
  { name: 'Operating Models', status: 'live', description: 'From Plan module operating model API' },
  { name: 'Deployments', status: 'live', description: 'From Build module deployments API' },
  { name: 'Frontier Agents', status: 'live', description: 'From Build module frontier agents API' },
  { name: 'Guardrails', status: 'live', description: 'From Secure module guardrails API' },
  { name: 'Guardrail Metrics', status: 'live', description: 'From Amazon Bedrock Guardrails CloudWatch' },
  { name: 'Service Approvals', status: 'live', description: 'From Secure module service approval API' },

  // Mock data needing integration
  { name: 'Model Inventory', status: 'mock', description: 'Foundation model registry with risk tiers', integration: 'Amazon Bedrock ListFoundationModels + custom metadata DB' },
  { name: 'Model Evaluations', status: 'mock', description: 'Safety, quality, latency scores', integration: 'Amazon Bedrock Model Evaluation + Langfuse' },
  { name: 'Cost & FinOps', status: 'mock', description: 'AI spend, budgets, forecasts', integration: 'AWS Cost Explorer API + Cost Allocation Tags' },
  { name: 'Audit Trail', status: 'mock', description: 'Governance events and incidents', integration: 'AWS CloudTrail + Amazon EventBridge' },
  { name: 'Risk Register', status: 'mock', description: 'Risk inventory with controls', integration: 'Custom PostgreSQL/DynamoDB backend' },
  { name: 'Compliance Status', status: 'mock', description: 'Framework control assessments', integration: 'AWS Audit Manager + custom compliance DB' },
];

export function DataSourceIndicator({ compact = false }: { compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  const liveCount = DATA_SOURCES.filter(d => d.status === 'live').length;
  const mockCount = DATA_SOURCES.filter(d => d.status === 'mock').length;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-[10px]">
        <span className="flex items-center gap-1 text-emerald-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {liveCount} live
        </span>
        <span className="flex items-center gap-1 text-amber-600">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 border border-dashed border-amber-500" />
          {mockCount} demo
        </span>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/80 backdrop-blur-sm rounded-xl border border-slate-200/60 overflow-hidden mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-100/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-slate-700">Data Sources</div>
            <div className="text-[10px] text-slate-500">
              <span className="text-emerald-600">{liveCount} live from AVA</span>
              {' · '}
              <span className="text-amber-600">{mockCount} demo data</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">{expanded ? 'Hide details' : 'Show details'}</span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-200/60">
          <div className="grid grid-cols-2 gap-4 mt-3">
            {/* Live Data */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-semibold text-emerald-700">Live Data from AVA Platform</span>
              </div>
              <div className="space-y-1.5">
                {DATA_SOURCES.filter(d => d.status === 'live').map(d => (
                  <div key={d.name} className="flex items-start gap-2 text-[10px]">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <div>
                      <span className="font-medium text-slate-700">{d.name}</span>
                      <span className="text-slate-400 ml-1">— {d.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock Data */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 border border-dashed border-amber-500" />
                <span className="text-[11px] font-semibold text-amber-700">Demo Data (Integration Required)</span>
              </div>
              <div className="space-y-2">
                {DATA_SOURCES.filter(d => d.status === 'mock').map(d => (
                  <div key={d.name} className="text-[10px]">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">○</span>
                      <div>
                        <span className="font-medium text-slate-700">{d.name}</span>
                        <span className="text-slate-400 ml-1">— {d.description}</span>
                      </div>
                    </div>
                    {d.integration && (
                      <div className="ml-4 mt-0.5 text-[9px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block">
                        Integrate: {d.integration}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="text-[11px] font-semibold text-blue-800 mb-1">Production Deployment</div>
            <div className="text-[10px] text-blue-700 leading-relaxed">
              Demo data showcases governance capabilities. For production, integrate with AWS services
              (Cost Explorer, CloudTrail, Audit Manager) and provision a metadata database for model
              inventory, risk register, and compliance tracking.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Small badge to mark mock data sections */
export function MockDataBadge({ integration }: { integration?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-dashed border-amber-300 cursor-help"
      title={integration ? `Integration needed: ${integration}` : 'Demo data for illustration'}
    >
      <span className="w-1 h-1 rounded-full bg-amber-400" />
      Demo
    </span>
  );
}

/** Small badge to mark live data sections */
export function LiveDataBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200">
      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
      Live
    </span>
  );
}

export default DataSourceIndicator;
