/**
 * ModuleGuide — Collapsible guidance component with visual indicators.
 * Landing pages use "Getting Started with..." and sub-modules use "How to Use..."
 */
import { useState } from 'react';

interface Step {
  step?: string | number;
  title: string;
  desc: string;
  color?: string;
}

interface MaturityStage {
  stage: string;
  desc: string;
  focus?: string;
  color: string;
  nav?: string;
}

interface QuickLink {
  label: string;
  nav?: string;
  onClick?: () => void;
  icon?: string;
  color?: string;
}

interface ModuleGuideProps {
  title: string;
  steps?: Step[];
  maturityStages?: MaturityStage[];
  quickLinks?: QuickLink[];
  onNavigate?: (nav: string) => void;
  variant?: 'landing' | 'submodule';
}

const ModuleGuide = ({ title, steps, maturityStages, quickLinks, onNavigate, variant = 'submodule' }: ModuleGuideProps) => {
  const [collapsed, setCollapsed] = useState(true);

  const isLanding = variant === 'landing';

  return (
    <div className="rounded-xl border shadow-sm mb-4 overflow-hidden bg-gradient-to-r from-indigo-50 via-violet-50 to-pink-50 border-violet-200/60">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-violet-100/30"
      >
        <div className="flex items-center gap-3">
          {/* Icon container — lightning bolt on landing, lightbulb on submodule (so the two are still distinguishable) */}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-indigo-600 via-violet-500 to-pink-500 shadow-md shadow-violet-200">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {isLanding ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              )}
            </svg>
          </div>
          <div className="text-left">
            <span className="text-xs font-semibold text-violet-700">
              {title}
            </span>
            <div className="text-[10px] text-violet-500">
              {collapsed ? 'Click to expand' : 'Click to collapse'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {collapsed && steps && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
              {steps.length} steps
            </span>
          )}
          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-violet-100">
            <svg
              className={`w-4 h-4 transition-transform text-violet-600 ${collapsed ? '' : 'rotate-180'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-4 bg-white/50">
          {/* Steps */}
          {steps && steps.length > 0 && (
            <div className="pt-2">
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(steps.length, 4)}, 1fr)` }}>
                {steps.map((s, i) => (
                  <div key={i} className="bg-white rounded-lg border border-slate-200/80 p-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: s.color || '#3b82f6' }}
                      >
                        {s.step || i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-slate-800">{s.title}</div>
                        <div className="text-[10px] text-slate-500 leading-relaxed mt-1">{s.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Maturity Stages */}
          {maturityStages && maturityStages.length > 0 && (
            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded flex items-center justify-center bg-fuchsia-100">
                  <svg className="w-3 h-3 text-fuchsia-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-fuchsia-700">Where Are You on the Journey?</span>
              </div>
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(maturityStages.length, 4)}, 1fr)` }}>
                {maturityStages.map((m, i) => (
                  <div
                    key={i}
                    onClick={() => m.nav && onNavigate?.(m.nav)}
                    className="p-3 rounded-lg border-2 cursor-pointer hover:shadow-md transition-all relative overflow-hidden"
                    style={{
                      backgroundColor: `${m.color}08`,
                      borderColor: `${m.color}40`,
                    }}
                  >
                    {/* Progress indicator line at top */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ backgroundColor: m.color }}
                    />
                    <div className="text-[12px] font-bold mt-1" style={{ color: m.color }}>{m.stage}</div>
                    <div className="text-[10px] text-slate-600 mt-1">{m.desc}</div>
                    {m.focus && (
                      <div className="text-[9px] text-slate-500 mt-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                        Focus: {m.focus}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links */}
          {quickLinks && quickLinks.length > 0 && (
            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded flex items-center justify-center bg-pink-100">
                  <svg className="w-3 h-3 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold text-pink-700">Quick Links</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickLinks.map((link, i) => (
                  <button
                    key={i}
                    onClick={() => link.onClick?.() || (link.nav && onNavigate?.(link.nav))}
                    className="px-3 py-1.5 text-[11px] font-medium rounded-lg border-2 transition-all hover:shadow-md hover:-translate-y-0.5"
                    style={{
                      color: link.color || '#3b82f6',
                      borderColor: `${link.color || '#3b82f6'}50`,
                      backgroundColor: `${link.color || '#3b82f6'}08`,
                    }}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModuleGuide;

// ═══════════════════════════════════════════════════════════════
// Pre-built guides for each Govern sub-module
// ═══════════════════════════════════════════════════════════════

export const GovernLandingGuide = ({ onNavigate }: { onNavigate?: (nav: string) => void }) => (
  <ModuleGuide
    title="Getting Started with Govern"
    variant="landing"
    onNavigate={onNavigate}
    steps={[
      { step: '1', title: 'Register Models', desc: 'Add AI models to the registry with risk tier, owner, and use cases.', color: '#4338ca' },
      { step: '2', title: 'Assess Compliance', desc: 'Map to SR 26-2, OSFI E-23, NIST AI RMF, and EU AI Act frameworks.', color: '#8b5cf6' },
      { step: '3', title: 'Track Findings', desc: 'Log issues from audits and validations. Assign owners and remediation.', color: '#a21caf' },
      { step: '4', title: 'Monitor & Report', desc: 'Track fleet health, generate regulatory reports, schedule revalidations.', color: '#ec4899' },
    ]}
    maturityStages={[
      { stage: 'Ad-hoc',    desc: 'No formal MRM process',                 focus: 'Model Registry',          color: '#4338ca' },
      { stage: 'Defined',   desc: 'Policies exist, partial coverage',      focus: 'Compliance Mapping',      color: '#8b5cf6' },
      { stage: 'Managed',   desc: 'Full coverage, regular reviews',        focus: 'Monitoring + Evidence',   color: '#a21caf' },
      { stage: 'Optimized', desc: 'Automated, continuous, proactive',      focus: 'Integration + Automation',color: '#ec4899' },
    ]}
    quickLinks={[
      { label: 'Model Registry',     nav: 'models',     color: '#4338ca' },
      { label: 'Compliance Center',  nav: 'compliance', color: '#8b5cf6' },
      { label: 'Risk Management',    nav: 'risk',       color: '#a21caf' },
      { label: 'Audit & Incidents',  nav: 'audit',      color: '#ec4899' },
    ]}
  />
);

export const ModelRegistryGuide = ({ onNavigate }: { onNavigate?: (nav: string) => void }) => (
  <ModuleGuide
    title="How to Use Model Registry"
    onNavigate={onNavigate}
    steps={[
      { step: '1', title: 'View Fleet', desc: 'See all models with risk tier, eval score, attestation status, and owner.', color: '#4338ca' },
      { step: '2', title: 'Check Compliance', desc: 'Review MRM framework compliance (SR 26-2, OSFI, NIST, EU AI Act) per model.', color: '#8b5cf6' },
      { step: '3', title: 'Open Model 360', desc: 'Click any model row to see full details: evals, approvals, evidence, risk profile.', color: '#a21caf' },
      { step: '4', title: 'Monitor Alerts', desc: 'Check the alerts bar for compliance gaps, overdue revalidations, and findings.', color: '#ec4899' },
    ]}
    maturityStages={[
      { stage: 'Inventory', desc: 'Models listed, minimal metadata', focus: 'Registration', color: '#4338ca' },
      { stage: 'Classified', desc: 'Risk tiers assigned, owners set', focus: 'Risk Tiering', color: '#8b5cf6' },
      { stage: 'Governed', desc: 'Compliance mapped, approvals tracked', focus: 'MRM Frameworks', color: '#a21caf' },
      { stage: 'Optimized', desc: 'Full 360 view, automated alerts', focus: 'Continuous Monitoring', color: '#ec4899' },
    ]}
    quickLinks={[
      { label: 'Portfolio Risk Dashboard', nav: 'portfolio-risk', color: '#4338ca' },
      { label: 'Framework Compliance', nav: 'framework-compliance', color: '#8b5cf6' },
      { label: 'Approval Pipeline', nav: 'approval-pipeline', color: '#a21caf' },
    ]}
  />
);

export const ModelGovernanceGuide = ({ onNavigate }: { onNavigate?: (nav: string) => void }) => (
  <ModuleGuide
    title="How to Use Governance"
    onNavigate={onNavigate}
    steps={[
      { step: '1', title: 'Risk Assessment', desc: 'View fleet risk summary and per-model risk matrix with controls.', color: '#4338ca' },
      { step: '2', title: 'MRM Frameworks', desc: 'Track compliance across 4 global frameworks with per-model progress bars.', color: '#8b5cf6' },
      { step: '3', title: 'Model Cards', desc: 'Review documentation completeness and EU AI Act classification.', color: '#a21caf' },
      { step: '4', title: 'Review Schedule', desc: 'Manage revalidation calendar and upcoming deadlines.', color: '#ec4899' },
    ]}
    maturityStages={[
      { stage: 'Reactive', desc: 'Respond to audit findings', focus: 'Risk Assessment', color: '#4338ca' },
      { stage: 'Structured', desc: 'Frameworks mapped, gaps known', focus: 'MRM Frameworks', color: '#8b5cf6' },
      { stage: 'Proactive', desc: 'Continuous monitoring', focus: 'Review Schedule', color: '#a21caf' },
      { stage: 'Embedded', desc: 'Governance in every stage', focus: 'Full Automation', color: '#ec4899' },
    ]}
  />
);

export const ModelOperationsGuide = ({ onNavigate }: { onNavigate?: (nav: string) => void }) => (
  <ModuleGuide
    title="How to Use Operations"
    onNavigate={onNavigate}
    steps={[
      { step: '1', title: 'Track Issues', desc: 'View findings from audits, MRAs, and self-identified issues. Filter by severity/status.', color: '#4338ca' },
      { step: '2', title: 'Map Dependencies', desc: 'See which systems consume each model. Assess impact before changes.', color: '#8b5cf6' },
      { step: '3', title: 'Compare Models', desc: 'Side-by-side comparison of 2-4 models on 14 metrics (performance, cost, compliance).', color: '#a21caf' },
      { step: '4', title: 'Optimize Costs', desc: 'Review cost insights: underutilized models, tier mismatches, savings opportunities.', color: '#ec4899' },
    ]}
    maturityStages={[
      { stage: 'Reactive', desc: 'Fix issues as they arise', focus: 'Issue Tracking', color: '#4338ca' },
      { stage: 'Visible', desc: 'Dependencies mapped, impacts known', focus: 'Dependency Mapping', color: '#8b5cf6' },
      { stage: 'Optimized', desc: 'Active cost and performance tuning', focus: 'Model Comparison', color: '#a21caf' },
      { stage: 'Predictive', desc: 'Proactive optimization, trend-based', focus: 'Trend Analytics', color: '#ec4899' },
    ]}
    quickLinks={[
      { label: 'Issues & Findings', nav: 'findings', color: '#4338ca' },
      { label: 'Dependencies', nav: 'dependencies', color: '#8b5cf6' },
      { label: 'Model Comparison', nav: 'comparison', color: '#a21caf' },
      { label: 'Cost Optimization', nav: 'cost', color: '#ec4899' },
      { label: 'Trend Analytics', nav: 'trends', color: '#4338ca' },
      { label: 'Integrations', nav: 'integrations', color: '#8b5cf6' },
    ]}
  />
);

export const ModelEvaluationsGuide = ({ onNavigate }: { onNavigate?: (nav: string) => void }) => (
  <ModuleGuide
    title="How to Use Evaluations"
    onNavigate={onNavigate}
    steps={[
      { step: '1', title: 'Select Model', desc: 'Choose a model from the fleet to evaluate against safety, quality, and latency metrics.', color: '#4338ca' },
      { step: '2', title: 'Choose Dataset', desc: 'Use built-in FSI test cases or upload custom evaluation datasets.', color: '#8b5cf6' },
      { step: '3', title: 'Run Evaluation', desc: 'Execute the eval job. Results include per-case scores and aggregate metrics.', color: '#a21caf' },
      { step: '4', title: 'Review & Export', desc: 'Analyze results, compare against baselines, export evidence for validation.', color: '#ec4899' },
    ]}
    maturityStages={[
      { stage: 'Ad-hoc', desc: 'Manual, inconsistent testing', focus: 'Basic Evals', color: '#4338ca' },
      { stage: 'Standardized', desc: 'Consistent datasets, regular runs', focus: 'Test Suites', color: '#8b5cf6' },
      { stage: 'Automated', desc: 'CI/CD integrated, regression tests', focus: 'Automation', color: '#a21caf' },
      { stage: 'Continuous', desc: 'Real-time monitoring, auto-revalidation', focus: 'Continuous Eval', color: '#ec4899' },
    ]}
  />
);

export const ModelMonitoringGuide = ({ onNavigate }: { onNavigate?: (nav: string) => void }) => (
  <ModuleGuide
    title="How to Use Monitoring"
    onNavigate={onNavigate}
    steps={[
      { step: '1', title: 'Check Drift', desc: 'Monitor quality and hallucination drift over time. Alert on threshold breaches.', color: '#4338ca' },
      { step: '2', title: 'Track Performance', desc: 'View latency, error rates, and throughput trends per model.', color: '#8b5cf6' },
      { step: '3', title: 'Review Guardrails', desc: 'Check guardrail event counts: blocked, flagged, anonymized.', color: '#a21caf' },
      { step: '4', title: 'Set Alerts', desc: 'Configure thresholds and notification channels for anomalies.', color: '#ec4899' },
    ]}
    maturityStages={[
      { stage: 'Blind', desc: 'No production visibility', focus: 'Basic Metrics', color: '#4338ca' },
      { stage: 'Observable', desc: 'Dashboards exist, manual review', focus: 'Drift Detection', color: '#8b5cf6' },
      { stage: 'Alerting', desc: 'Thresholds set, notifications active', focus: 'Alert Configuration', color: '#a21caf' },
      { stage: 'Self-healing', desc: 'Auto-remediation, predictive alerts', focus: 'Automation', color: '#ec4899' },
    ]}
  />
);

export const ModelLifecycleGuide = ({ onNavigate }: { onNavigate?: (nav: string) => void }) => (
  <ModuleGuide
    title="How to Use Lifecycle"
    onNavigate={onNavigate}
    steps={[
      { step: '1', title: 'Track Stages', desc: 'View models across lifecycle stages: development, validation, production, sunset.', color: '#4338ca' },
      { step: '2', title: 'Manage Transitions', desc: 'Progress models through stage gates with required approvals and evidence.', color: '#8b5cf6' },
      { step: '3', title: 'Plan Decommissioning', desc: 'Initiate sunset workflow: assessment, migration, archival, completion.', color: '#a21caf' },
      { step: '4', title: 'Archive & Retain', desc: 'Configure data retention policies and archive locations per compliance requirements.', color: '#ec4899' },
    ]}
    maturityStages={[
      { stage: 'Informal', desc: 'No defined stages or gates', focus: 'Stage Definition', color: '#4338ca' },
      { stage: 'Gated', desc: 'Stage gates exist, manual approvals', focus: 'Gate Reviews', color: '#8b5cf6' },
      { stage: 'Controlled', desc: 'Evidence required, audit trail', focus: 'Evidence Collection', color: '#a21caf' },
      { stage: 'Automated', desc: 'CI/CD gates, auto-promotion', focus: 'Pipeline Integration', color: '#ec4899' },
    ]}
  />
);

export const FinOpsGuide = ({ onNavigate }: { onNavigate?: (nav: string) => void }) => (
  <ModuleGuide
    title="How to Use FinOps"
    onNavigate={onNavigate}
    steps={[
      { step: '1', title: 'View Spend', desc: 'See total AI spend, daily trends, and per-model cost breakdown.', color: '#4338ca' },
      { step: '2', title: 'Analyze Unit Costs', desc: 'Understand cost per decision, per token, and per use case.', color: '#8b5cf6' },
      { step: '3', title: 'Find Savings', desc: 'Review optimization recommendations: model substitution, caching, batching.', color: '#a21caf' },
      { step: '4', title: 'Allocate & Budget', desc: 'Set budgets, track utilization, enable showback/chargeback by team.', color: '#ec4899' },
    ]}
    maturityStages={[
      { stage: 'Crawl', desc: 'No cost visibility', focus: 'Cost Overview', color: '#4338ca' },
      { stage: 'Walk', desc: 'Know total spend', focus: 'Unit Economics', color: '#8b5cf6' },
      { stage: 'Run', desc: 'Optimizing actively', focus: 'Recommendations', color: '#a21caf' },
      { stage: 'Fly', desc: 'Automated optimization', focus: 'Full FinOps Culture', color: '#ec4899' },
    ]}
  />
);

export const ComplianceCenterGuide = ({ onNavigate }: { onNavigate?: (nav: string) => void }) => (
  <ModuleGuide
    title="How to Use Compliance Center"
    onNavigate={onNavigate}
    steps={[
      { step: '1', title: 'Select Frameworks', desc: 'Choose applicable frameworks: SR 26-2, OSFI E-23, NIST AI RMF, EU AI Act, ISO 42001.', color: '#4338ca' },
      { step: '2', title: 'Assess Controls', desc: 'Review control status across domains. Identify gaps and remediation priorities.', color: '#8b5cf6' },
      { step: '3', title: 'Collect Evidence', desc: 'Upload documentation, screenshots, and test results for each control.', color: '#a21caf' },
      { step: '4', title: 'Generate Reports', desc: 'Export compliance reports and evidence packages for auditors.', color: '#ec4899' },
    ]}
    maturityStages={[
      { stage: 'Aware', desc: 'Frameworks identified, gaps unknown', focus: 'Framework Selection', color: '#4338ca' },
      { stage: 'Assessed', desc: 'Controls mapped, gaps documented', focus: 'Gap Analysis', color: '#8b5cf6' },
      { stage: 'Evidenced', desc: 'Artifacts collected, audit-ready', focus: 'Evidence Management', color: '#a21caf' },
      { stage: 'Certified', desc: 'Attested, continuously maintained', focus: 'Continuous Compliance', color: '#ec4899' },
    ]}
  />
);

export const RiskManagementGuide = ({ onNavigate }: { onNavigate?: (nav: string) => void }) => (
  <ModuleGuide
    title="How to Use Risk Management"
    onNavigate={onNavigate}
    steps={[
      { step: '1', title: 'Review Dashboard', desc: 'See risk heatmap, control effectiveness, and risk trend over time.', color: '#4338ca' },
      { step: '2', title: 'Manage Register', desc: 'View and update the risk register with inherent/residual scores and owners.', color: '#8b5cf6' },
      { step: '3', title: 'Run Assessments', desc: 'Execute periodic risk assessments and document findings.', color: '#a21caf' },
      { step: '4', title: 'Track Controls', desc: 'Monitor control implementation status and effectiveness metrics.', color: '#ec4899' },
    ]}
    maturityStages={[
      { stage: 'Initial', desc: 'Risk-aware but reactive', focus: 'Risk Register', color: '#4338ca' },
      { stage: 'Repeatable', desc: 'Regular assessments', focus: 'Assessments', color: '#8b5cf6' },
      { stage: 'Defined', desc: 'Controls mapped to risks', focus: 'Controls', color: '#a21caf' },
      { stage: 'Managed', desc: 'Quantified and monitored', focus: 'Dashboard KPIs', color: '#ec4899' },
    ]}
  />
);

export const AuditIncidentsGuide = ({ onNavigate }: { onNavigate?: (nav: string) => void }) => (
  <ModuleGuide
    title="How to Use Audit & Incidents"
    onNavigate={onNavigate}
    steps={[
      { step: '1', title: 'Review Audit Trail', desc: 'See all governance events: approvals, policy changes, model updates, access logs.', color: '#4338ca' },
      { step: '2', title: 'Investigate Incidents', desc: 'Drill into security incidents, policy violations, and anomalies.', color: '#8b5cf6' },
      { step: '3', title: 'Track Risk Trends', desc: 'Monitor 30-day risk trends across compliance, security, and operational domains.', color: '#a21caf' },
      { step: '4', title: 'Export Evidence', desc: 'Generate audit reports and incident timelines for regulatory review.', color: '#ec4899' },
    ]}
    maturityStages={[
      { stage: 'Logging', desc: 'Events captured, no analysis', focus: 'Audit Trail', color: '#4338ca' },
      { stage: 'Reviewed', desc: 'Regular log reviews, manual triage', focus: 'Incident Triage', color: '#8b5cf6' },
      { stage: 'Correlated', desc: 'Cross-system analysis, root cause', focus: 'Trend Analysis', color: '#a21caf' },
      { stage: 'Predictive', desc: 'Anomaly detection, auto-escalation', focus: 'Proactive Response', color: '#ec4899' },
    ]}
  />
);

export const FleetOverviewGuide = ({ onNavigate }: { onNavigate?: (nav: string) => void }) => (
  <ModuleGuide
    title="How to Use Fleet Overview"
    onNavigate={onNavigate}
    steps={[
      { step: '1', title: 'View Fleet Health', desc: 'See aggregate metrics: total models, risk distribution, compliance scores.', color: '#4338ca' },
      { step: '2', title: 'Identify Hot Spots', desc: 'Find models with highest risk, lowest compliance, or pending actions.', color: '#8b5cf6' },
      { step: '3', title: 'Track Trends', desc: 'Monitor fleet-wide eval scores, drift signals, and cost trends over time.', color: '#a21caf' },
      { step: '4', title: 'Drill Down', desc: 'Click any card or chart to navigate to detailed views.', color: '#ec4899' },
    ]}
    maturityStages={[
      { stage: 'Scattered', desc: 'Models exist, no central view', focus: 'Inventory', color: '#4338ca' },
      { stage: 'Visible', desc: 'Fleet dashboard, basic metrics', focus: 'KPI Tracking', color: '#8b5cf6' },
      { stage: 'Managed', desc: 'Trends tracked, hot spots flagged', focus: 'Trend Analysis', color: '#a21caf' },
      { stage: 'Optimized', desc: 'Proactive management, auto-alerts', focus: 'Fleet Optimization', color: '#ec4899' },
    ]}
  />
);

export const TrustStackGuide = ({ onNavigate }: { onNavigate?: (nav: string) => void }) => (
  <ModuleGuide
    title="How to Use Trust Stack"
    onNavigate={onNavigate}
    steps={[
      { step: '1', title: 'Understand Layers', desc: 'Review the 3-layer trust architecture: Foundation, Guardrails, Governance.', color: '#4338ca' },
      { step: '2', title: 'Check Layer Health', desc: 'Each layer shows status indicators for its key components.', color: '#8b5cf6' },
      { step: '3', title: 'Explore Components', desc: 'Click into any layer to see detailed configuration and metrics.', color: '#a21caf' },
      { step: '4', title: 'Validate Integration', desc: 'Ensure all layers are connected and working together.', color: '#ec4899' },
    ]}
    maturityStages={[
      { stage: 'Foundation', desc: 'Basic infra, no guardrails', focus: 'Platform Setup', color: '#4338ca' },
      { stage: 'Protected', desc: 'Guardrails active, basic policies', focus: 'Guardrail Config', color: '#8b5cf6' },
      { stage: 'Governed', desc: 'Full 3-layer coverage, audited', focus: 'Governance Layer', color: '#a21caf' },
      { stage: 'Integrated', desc: 'Layers connected, auto-enforced', focus: 'End-to-End Trust', color: '#ec4899' },
    ]}
  />
);