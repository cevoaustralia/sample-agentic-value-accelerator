/**
 * GovernanceCommandCenter — Executive AI GRC Dashboard
 *
 * "Centralize governance, federate innovation"
 * Shows aggregated data from Plan, Build, Secure, and Operate modules.
 * Includes platform integration map showing governance across AVA.
 */

import { useGovernanceAggregator } from './useGovernanceAggregator';
import type { ActivityFeedItem } from './useGovernanceAggregator';
import { Icon, type IconName } from './icons';

// ─────────────────────────── Platform Integration Data ───────────────────────────
interface PlatformModule {
  name: string;
  route: string;
  layer: 1 | 2 | 3;
  governance: string;
}

interface PlatformPhase {
  phase: string;
  color: string;
  icon: IconName;
  modules: PlatformModule[];
}

const PLATFORM_INTEGRATION: PlatformPhase[] = [
  {
    phase: 'Plan',
    color: '#6366f1',
    icon: 'clipboard-list',
    modules: [
      { name: 'Maturity Assessment', route: '/maturity-assessment', layer: 1, governance: 'Baseline readiness scoring, gap identification' },
      { name: 'Operating Model', route: '/operating-model', layer: 2, governance: '3 Lines of Defense roles, RACI matrix' },
      { name: 'Use Cases', route: '/use-cases', layer: 2, governance: 'Risk tiering, stage gate requirements' },
      { name: 'Business Cases', route: '/business-cases', layer: 2, governance: 'ROI validation, compliance cost estimation' },
    ],
  },
  {
    phase: 'Build',
    color: '#10b981',
    icon: 'wrench-screwdriver',
    modules: [
      { name: 'FSI Foundry', route: '/applications/fsi-foundry', layer: 2, governance: 'Pre-validated patterns, compliance templates' },
      { name: 'Reference Implementations', route: '/applications/reference-implementations', layer: 2, governance: 'Production-grade patterns, validated architectures' },
      { name: 'Templates Catalog', route: '/applications/templates', layer: 2, governance: 'Reusable agent templates, version control' },
      { name: 'App Factory', route: '/applications/app-factory', layer: 3, governance: 'Prototyping pattern, experimental builds' },
      { name: 'Custom Agents', route: '/aaas/custom', layer: 3, governance: 'Agent registration, tool authorization' },
      { name: 'AWS Frontier Agents', route: '/aaas/aws-agents', layer: 3, governance: 'DevOps/Security agent fleet governance' },
      { name: 'Tools Factory', route: '/capabilities/tools', layer: 1, governance: 'MCP tool registration, permission boundaries' },
      { name: 'Knowledge Bases', route: '/capabilities/knowledge', layer: 1, governance: 'Data classification, source attestation' },
      { name: 'Prompts', route: '/capabilities/prompts', layer: 1, governance: 'Prompt library, versioning, evaluations' },
    ],
  },
  {
    phase: 'Secure',
    color: '#f59e0b',
    icon: 'shield-check',
    modules: [
      { name: 'Guardrails', route: '/secure/guardrails', layer: 1, governance: 'Content filters, PII detection, topic denial' },
      { name: 'Service Onboarding', route: '/secure/service-onboarding', layer: 1, governance: '5-gate approval workflow, risk assessment' },
      { name: 'Policy Management', route: '/secure/policy', layer: 1, governance: 'Cedar policies, deny-by-default rules' },
    ],
  },
  {
    phase: 'Operate & Govern',
    color: '#3b82f6',
    icon: 'chart-bar',
    modules: [
      { name: 'Deployments', route: '/deployments', layer: 2, governance: 'Deployment tracking, version control' },
      { name: 'Observability', route: '/observability', layer: 3, governance: 'Langfuse traces, performance monitoring' },
      { name: 'Model Registry', route: '/govern/models', layer: 2, governance: 'Inventory, lifecycle status, attestation' },
      { name: 'FinOps', route: '/govern/finops', layer: 3, governance: 'Cost allocation, budget alerts, showback' },
      { name: 'Audit Trail', route: '/govern/audit', layer: 3, governance: 'CloudTrail events, incident tracking' },
    ],
  },
];



// ─────────────────────────── Helper Components ───────────────────────────

function SeverityBadge({ severity }: { severity: 'low' | 'medium' | 'high' | 'critical' }) {
  const colors = {
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-rose-100 text-rose-700',
  };
  return (
    <span className={`text-[8px] px-1.5 py-0.5 rounded font-medium ${colors[severity]}`}>
      {severity}
    </span>
  );
}

function ModuleBadge({ module }: { module: ActivityFeedItem['module'] }) {
  const colors = {
    plan: 'bg-indigo-100 text-indigo-700',
    build: 'bg-emerald-100 text-emerald-700',
    secure: 'bg-amber-100 text-amber-700',
    operate: 'bg-blue-100 text-blue-700',
    govern: 'bg-violet-100 text-violet-700',
  };
  return (
    <span className={`text-[8px] px-1.5 py-0.5 rounded font-medium uppercase ${colors[module]}`}>
      {module}
    </span>
  );
}

type Tone = 'indigo' | 'blue' | 'sky' | 'cyan' | 'slate' | 'rose' | 'emerald' | 'amber';

const TONE: Record<Tone, { icon: string; iconBg: string; chipBg: string; chipText: string; chipBorder: string; label: string; hoverBorder: string }> = {
  indigo:  { icon: 'text-indigo-700',  iconBg: 'bg-indigo-100',  chipBg: 'bg-indigo-50',  chipText: 'text-indigo-700',  chipBorder: 'border-indigo-100',  label: 'text-indigo-700',  hoverBorder: 'hover:border-indigo-300' },
  blue:    { icon: 'text-blue-700',    iconBg: 'bg-blue-100',    chipBg: 'bg-blue-50',    chipText: 'text-blue-700',    chipBorder: 'border-blue-100',    label: 'text-blue-700',    hoverBorder: 'hover:border-blue-300' },
  sky:     { icon: 'text-sky-700',     iconBg: 'bg-sky-100',     chipBg: 'bg-sky-50',     chipText: 'text-sky-700',     chipBorder: 'border-sky-100',     label: 'text-sky-700',     hoverBorder: 'hover:border-sky-300' },
  cyan:    { icon: 'text-cyan-700',    iconBg: 'bg-cyan-100',    chipBg: 'bg-cyan-50',    chipText: 'text-cyan-700',    chipBorder: 'border-cyan-100',    label: 'text-cyan-700',    hoverBorder: 'hover:border-cyan-300' },
  slate:   { icon: 'text-slate-700',   iconBg: 'bg-slate-100',   chipBg: 'bg-slate-50',   chipText: 'text-slate-700',   chipBorder: 'border-slate-200',   label: 'text-slate-700',   hoverBorder: 'hover:border-slate-300' },
  rose:    { icon: 'text-rose-700',    iconBg: 'bg-rose-100',    chipBg: 'bg-rose-50',    chipText: 'text-rose-700',    chipBorder: 'border-rose-100',    label: 'text-rose-700',    hoverBorder: 'hover:border-rose-300' },
  emerald: { icon: 'text-emerald-700', iconBg: 'bg-emerald-100', chipBg: 'bg-emerald-50', chipText: 'text-emerald-700', chipBorder: 'border-emerald-100', label: 'text-emerald-700', hoverBorder: 'hover:border-emerald-300' },
  amber:   { icon: 'text-amber-700',   iconBg: 'bg-amber-100',   chipBg: 'bg-amber-50',   chipText: 'text-amber-700',   chipBorder: 'border-amber-100',   label: 'text-amber-700',   hoverBorder: 'hover:border-amber-300' },
};

// Light tones for dark backgrounds — used inside the AI Platform Activity hero
const TONE_DARK: Record<Tone, { icon: string; iconBg: string; chipBg: string; chipText: string; chipBorder: string; label: string }> = {
  indigo:  { icon: 'text-indigo-200',  iconBg: 'bg-indigo-400/30',  chipBg: 'bg-indigo-400/20',  chipText: 'text-indigo-200',  chipBorder: 'border-indigo-300/30',  label: 'text-indigo-200' },
  blue:    { icon: 'text-blue-200',    iconBg: 'bg-blue-400/30',    chipBg: 'bg-blue-400/20',    chipText: 'text-blue-200',    chipBorder: 'border-blue-300/30',    label: 'text-blue-200' },
  sky:     { icon: 'text-sky-200',     iconBg: 'bg-sky-400/30',     chipBg: 'bg-sky-400/20',     chipText: 'text-sky-200',     chipBorder: 'border-sky-300/30',     label: 'text-sky-200' },
  cyan:    { icon: 'text-cyan-200',    iconBg: 'bg-cyan-400/30',    chipBg: 'bg-cyan-400/20',    chipText: 'text-cyan-200',    chipBorder: 'border-cyan-300/30',    label: 'text-cyan-200' },
  slate:   { icon: 'text-slate-200',   iconBg: 'bg-slate-300/30',   chipBg: 'bg-slate-300/20',   chipText: 'text-slate-200',   chipBorder: 'border-slate-300/30',   label: 'text-slate-200' },
  rose:    { icon: 'text-rose-200',    iconBg: 'bg-rose-400/30',    chipBg: 'bg-rose-400/20',    chipText: 'text-rose-200',    chipBorder: 'border-rose-300/30',    label: 'text-rose-200' },
  emerald: { icon: 'text-emerald-200', iconBg: 'bg-emerald-400/30', chipBg: 'bg-emerald-400/20', chipText: 'text-emerald-200', chipBorder: 'border-emerald-300/30', label: 'text-emerald-200' },
  amber:   { icon: 'text-amber-200',   iconBg: 'bg-amber-400/30',   chipBg: 'bg-amber-400/20',   chipText: 'text-amber-200',   chipBorder: 'border-amber-300/30',   label: 'text-amber-200' },
};

function ActivityTile({
  href, icon, label, value, sub, chip, tone, chipTone, small, dark,
}: {
  href?: string;
  icon: IconName;
  label: string;
  value: string | number;
  sub: string;
  chip?: string;
  tone: Tone;
  chipTone?: Tone;
  small?: boolean;
  dark?: boolean;
}) {
  const t = dark ? TONE_DARK[tone] : TONE[tone];
  const c = dark ? TONE_DARK[chipTone ?? tone] : TONE[chipTone ?? tone];
  const Wrapper = href ? 'a' : 'div';
  const wrapperProps = href ? { href } : {};
  const cardClass = dark
    ? 'group p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 hover:border-white/40 hover:-translate-y-0.5 transition-all'
    : `group p-4 rounded-xl bg-white border border-slate-200 ${(t as typeof TONE[Tone]).hoverBorder} hover:shadow-md hover:-translate-y-0.5 transition-all`;
  const valueClass = dark
    ? `${small ? 'text-xl' : 'text-3xl'} font-bold text-white leading-tight`
    : `${small ? 'text-xl' : 'text-3xl'} font-bold text-slate-900 leading-tight`;
  const subClass = dark ? 'text-[10px] text-blue-200 mt-1' : 'text-[10px] text-slate-500 mt-1';
  return (
    <Wrapper {...wrapperProps} className={cardClass}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg ${t.iconBg} flex items-center justify-center`}>
          <Icon name={icon} className={`w-4 h-4 ${t.icon}`} strokeWidth={2} />
        </div>
        <span className={`text-[10px] font-semibold ${t.label} uppercase tracking-wide`}>{label}</span>
      </div>
      <div className={valueClass}>{value}</div>
      <div className={subClass}>{sub}</div>
      {chip && (
        <div className="flex items-center gap-1 mt-2">
          <span className={`text-[9px] px-1.5 py-0.5 rounded ${c.chipBg} ${c.chipText} border ${c.chipBorder}`}>{chip}</span>
        </div>
      )}
    </Wrapper>
  );
}

function PulseDot({ color, size = 'sm' }: { color: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-2 h-2', md: 'w-3 h-3', lg: 'w-4 h-4' };
  return (
    <span className="relative flex">
      <span
        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${sizes[size]}`}
        style={{ backgroundColor: color }}
      />
      <span
        className={`relative inline-flex rounded-full ${sizes[size]}`}
        style={{ backgroundColor: color }}
      />
    </span>
  );
}

// ─────────────────────────── Main Component ───────────────────────────

export default function GovernanceCommandCenter() {
  const {
    loading,
    error,
    summary,
    activityFeed,
    complianceFrameworks,
    costByModel,
    buBudgets,
    refresh,
  } = useGovernanceAggregator();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <div className="text-slate-500">Loading governance data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
        {error}
      </div>
    );
  }

  // Compute compliance percentage
  const compliancePct = Math.round((summary.controlsImplemented / summary.controlsTotal) * 100);

  return (
    <div className="space-y-4">
      {/* ══════════════════════ HERO: Platform Activity Overview ══════════════════════ */}
      <div className="relative rounded-2xl p-6 shadow-md border border-blue-800/40 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 45%, #1d4ed8 100%)',
        }} />
        <div className="relative flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">AI Platform Activity</h2>
            <p className="text-xs text-blue-200 mt-0.5">Real-time governance across Plan, Build, Secure, Operate</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <PulseDot color="#10b981" size="sm" />
              <span className="text-xs text-emerald-300 font-medium">Live</span>
            </div>
            <button
              onClick={refresh}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white border border-white/20 transition-colors"
            >
              ↻ Refresh
            </button>
          </div>
        </div>
        <div className="relative">

        {/* Main Activity Metrics Grid — quiet white tiles, only the icon chip is colored */}
        <div className="grid grid-cols-4 gap-3">
          <ActivityTile dark
            href="/use-cases"
            icon="clipboard-list"
            label="Plan"
            value={summary.totalUseCases}
            sub="Use Cases"
            chip={`${summary.deployedUseCases} in prod`}
            tone="indigo"
          />
          <ActivityTile dark
            href="/applications"
            icon="cube"
            label="Build · Apps"
            value="FSI Foundry"
            sub="Pre-built agent apps"
            chip="Catalog · Templates"
            tone="blue"
            small
          />
          <ActivityTile dark
            href="/aaas"
            icon="cpu-chip"
            label="Build · AaaS"
            value={summary.totalAgents}
            sub="Agents"
            chip="Frontier · Custom"
            tone="sky"
          />
          <ActivityTile dark
            href="/capabilities"
            icon="puzzle-piece"
            label="Build · Capabilities"
            value="Tools · KB · Prompts"
            sub="Reusable building blocks"
            chip="MCP-ready"
            tone="cyan"
            small
          />
          <ActivityTile dark
            href="/secure/guardrails"
            icon="shield-check"
            label="Secure"
            value={summary.guardrailsActive}
            sub="Guardrails Active"
            chip={`${summary.recentGuardrailBlocks} blocked 24h`}
            tone="slate"
          />
          <ActivityTile dark
            href="/deployments"
            icon="chart-bar"
            label="Operate"
            value={summary.deploymentsActive}
            sub="Deployments"
            chip={
              summary.deploymentsFailed > 0 ? `${summary.deploymentsFailed} failed`
              : summary.deploymentsPending > 0 ? `${summary.deploymentsPending} pending`
              : 'all healthy'
            }
            chipTone={
              summary.deploymentsFailed > 0 ? 'rose'
              : summary.deploymentsPending > 0 ? 'amber'
              : 'emerald'
            }
            tone="blue"
          />
          <ActivityTile dark
            href="/govern/compliance"
            icon="document-check"
            label="Compliance"
            value={`${compliancePct}%`}
            sub="Controls Met"
            chip={`${summary.frameworksTotal} frameworks`}
            tone="indigo"
          />
          <ActivityTile dark
            icon={summary.criticalIncidents > 0 ? 'exclamation-triangle' : 'check-circle'}
            label={summary.criticalIncidents > 0 ? 'Incidents' : 'Status'}
            value={summary.criticalIncidents > 0 ? summary.criticalIncidents : 'OK'}
            sub={summary.criticalIncidents > 0 ? 'Critical Issues' : 'No Critical Issues'}
            chip={`${summary.openIncidents} open`}
            chipTone={summary.openIncidents > 0 ? 'amber' : 'emerald'}
            tone={summary.criticalIncidents > 0 ? 'rose' : 'emerald'}
          />
        </div>
        </div>
      </div>

      {/* ══════════════════════ AI Governance Across AVA Platform ══════════════════════ */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-800">Governance Across AVA Platform</span>
            <div className="flex gap-1">
              {[
                { label: 'L1', color: '#8b5cf6', name: 'Foundation' },
                { label: 'L2', color: '#10b981', name: 'Production' },
                { label: 'L3', color: '#3b82f6', name: 'Scale' },
              ].map((l) => (
                <span
                  key={l.label}
                  className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: `${l.color}15`, color: l.color }}
                  title={l.name}
                >
                  {l.label}
                </span>
              ))}
            </div>
          </div>
          <span className="text-[10px] text-slate-400">{PLATFORM_INTEGRATION.reduce((n, p) => n + p.modules.length, 0)} governed modules across {PLATFORM_INTEGRATION.length} phases</span>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {PLATFORM_INTEGRATION.map((phase, pi) => (
            <div key={pi} className="space-y-2">
              <div className="flex items-center gap-1.5 pb-1.5 border-b-2" style={{ borderColor: phase.color }}>
                <span style={{ color: phase.color }} className="flex items-center">
                  <Icon name={phase.icon} className="w-3.5 h-3.5" strokeWidth={2} />
                </span>
                <span className="text-xs font-bold" style={{ color: phase.color }}>{phase.phase}</span>
                <span className="text-[9px] text-slate-400 ml-auto">{phase.modules.length} modules</span>
              </div>
              {phase.modules.map((mod, mi) => (
                <a
                  key={mi}
                  href={mod.route}
                  className="block p-2 rounded-lg bg-slate-50/80 border border-slate-200/60 hover:border-slate-300 hover:bg-white hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-semibold text-slate-700">{mod.name}</span>
                    <span
                      className="text-[7px] font-bold px-1 py-0.5 rounded"
                      style={{
                        background: mod.layer === 1 ? '#8b5cf615' : mod.layer === 2 ? '#10b98115' : '#3b82f615',
                        color: mod.layer === 1 ? '#8b5cf6' : mod.layer === 2 ? '#10b981' : '#3b82f6',
                      }}
                    >
                      L{mod.layer}
                    </span>
                  </div>
                  <div className="text-[8px] text-slate-500 leading-snug">{mod.governance}</div>
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════ 3-Layer Governance Coverage ══════════════════════ */}
      <div className="bg-gradient-to-r from-violet-50/80 via-emerald-50/50 to-blue-50/80 rounded-xl border border-slate-200/60 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold text-slate-800">3-Layer Trust Stack Coverage</div>
            <div className="text-xs text-slate-500 mt-0.5">Governance maturity across Foundation → Production → Scale</div>
          </div>
          <a href="/govern/trust-stack" className="text-xs text-blue-600 hover:text-blue-800 font-medium">
            View Trust Stack →
          </a>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Layer 1: Foundation */}
          <div className="relative">
            <div className="absolute -left-1 top-0 bottom-0 w-1 rounded-full bg-violet-500" />
            <div className="pl-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-100 text-violet-700">L1</span>
                <span className="text-sm font-semibold text-slate-800">Foundation</span>
              </div>
              <div className="text-xs text-slate-500 mb-3">Core infrastructure & policies</div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Guardrails configured</span>
                  <span className="text-xs font-semibold text-violet-700">{summary.guardrailsActive} active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Knowledge bases</span>
                  <span className="text-xs font-semibold text-violet-700">3 classified</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Tools registered</span>
                  <span className="text-xs font-semibold text-violet-700">12 approved</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-violet-200/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-500">Coverage</span>
                  <span className="text-xs font-bold text-violet-700">78%</span>
                </div>
                <div className="h-2 bg-violet-100 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: '78%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Layer 2: Production */}
          <div className="relative">
            <div className="absolute -left-1 top-0 bottom-0 w-1 rounded-full bg-emerald-500" />
            <div className="pl-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">L2</span>
                <span className="text-sm font-semibold text-slate-800">Production</span>
              </div>
              <div className="text-xs text-slate-500 mb-3">Deployments & workflows</div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Use cases governed</span>
                  <span className="text-xs font-semibold text-emerald-700">{summary.deployedUseCases}/{summary.totalUseCases}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Deployments tracked</span>
                  <span className="text-xs font-semibold text-emerald-700">{summary.deploymentsActive} active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Models in registry</span>
                  <span className="text-xs font-semibold text-emerald-700">{summary.modelsInProduction} prod</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-emerald-200/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-500">Coverage</span>
                  <span className="text-xs font-bold text-emerald-700">{summary.totalUseCases > 0 ? Math.round((summary.deployedUseCases / summary.totalUseCases) * 100) : 0}%</span>
                </div>
                <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${summary.totalUseCases > 0 ? (summary.deployedUseCases / summary.totalUseCases) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Layer 3: Scale */}
          <div className="relative">
            <div className="absolute -left-1 top-0 bottom-0 w-1 rounded-full bg-blue-500" />
            <div className="pl-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">L3</span>
                <span className="text-sm font-semibold text-slate-800">Scale</span>
              </div>
              <div className="text-xs text-slate-500 mb-3">Fleet operations & observability</div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Agents governed</span>
                  <span className="text-xs font-semibold text-blue-700">{summary.agentsWithPolicies}/{summary.totalAgents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Observability</span>
                  <span className="text-xs font-semibold text-blue-700">Langfuse active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Cost tracking</span>
                  <span className="text-xs font-semibold text-blue-700">${(summary.monthlySpend / 1000).toFixed(0)}k/mo</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-blue-200/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-500">Coverage</span>
                  <span className="text-xs font-bold text-blue-700">{summary.totalAgents > 0 ? Math.round((summary.agentsWithPolicies / summary.totalAgents) * 100) : 0}%</span>
                </div>
                <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${summary.totalAgents > 0 ? (summary.agentsWithPolicies / summary.totalAgents) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════ Compliance · Guardrails · Cost ══════════════════════ */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/80 rounded-xl border border-slate-200/60 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Compliance Frameworks</span>
              {summary.frameworksNeedingAttention.length > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                  {summary.frameworksNeedingAttention.length} need attention
                </span>
              )}
            </div>
            <a href="/govern/compliance" className="text-[10px] text-blue-600 hover:text-blue-800 font-medium">
              Compliance Center →
            </a>
          </div>

          <div className="space-y-2">
            {complianceFrameworks.map((fw, i) => {
              const pct = Math.round((fw.covered / fw.total) * 100);
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-slate-700 truncate">{fw.name}</div>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: fw.status === 'on-track' ? '#10b981' : '#f59e0b',
                      }}
                    />
                  </div>
                  <div className="w-10 text-right text-[10px] text-slate-500">{pct}%</div>
                  <div className={`w-14 text-[8px] px-1 py-0.5 rounded text-center ${
                    fw.status === 'on-track' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {fw.status === 'on-track' ? 'On Track' : 'Attention'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
            <span className="text-[10px] text-slate-500">{summary.controlsImplemented}/{summary.controlsTotal} controls implemented</span>
            <span className="text-xs font-bold text-slate-700">{compliancePct}% overall</span>
          </div>
        </div>
        {/* Guardrails & Agents */}
        <div className="bg-white/80 rounded-xl border border-slate-200/60 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Guardrails & Agents</div>
            <a href="/secure/guardrails" className="text-[10px] text-blue-600 hover:text-blue-800">Guardrails →</a>
          </div>

          {/* Guardrail Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200/60 text-center">
              <div className="text-lg font-bold text-emerald-600">{summary.guardrailsActive}</div>
              <div className="text-[9px] text-slate-500">Active</div>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200/60 text-center">
              <div className="text-lg font-bold text-amber-600">{summary.guardrailsDraft}</div>
              <div className="text-[9px] text-slate-500">Draft</div>
            </div>
            <div className="p-2 rounded-lg bg-rose-50 border border-rose-200/60 text-center">
              <div className="text-lg font-bold text-rose-600">{summary.guardrailsFailed}</div>
              <div className="text-[9px] text-slate-500">Failed</div>
            </div>
          </div>

          {/* Deployment Stats */}
          <div className="pt-3 border-t border-slate-200/60">
            <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">Deployments</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-blue-50 border border-blue-200/60 text-center">
                <div className="text-lg font-bold text-blue-600">{summary.deploymentsActive}</div>
                <div className="text-[9px] text-slate-500">Active</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/60 text-center">
                <div className="text-lg font-bold text-slate-600">{summary.deploymentsPending}</div>
                <div className="text-[9px] text-slate-500">Pending</div>
              </div>
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200/60 text-center">
                <div className="text-lg font-bold text-rose-600">{summary.deploymentsFailed}</div>
                <div className="text-[9px] text-slate-500">Failed</div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200/60 text-[10px] text-slate-500">
            Total agents: <span className="font-semibold text-slate-700">{summary.totalAgents}</span> ·
            <span className="font-semibold text-emerald-600"> {summary.agentsWithPolicies} governed</span>
          </div>
        </div>

        {/* Cost Overview */}
        <div className="bg-white/80 rounded-xl border border-slate-200/60 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Cost by Model</div>
            <a href="/govern/finops" className="text-[10px] text-blue-600 hover:text-blue-800">FinOps →</a>
          </div>

          <div className="space-y-2">
            {costByModel.slice(0, 5).map((m, i) => {
              const maxCost = Math.max(...costByModel.map(c => c.cost));
              const width = (m.cost / maxCost) * 100;
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-700 truncate">{m.model}</span>
                      <span className="text-[10px] font-semibold text-slate-900">${m.cost.toLocaleString()}</span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden mt-0.5">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${width}%`, background: m.color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {summary.costAnomalies > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-2">
              <PulseDot color="#f59e0b" size="sm" />
              <span className="text-[10px] text-amber-600 font-medium">
                {summary.costAnomalies} anomalies detected
              </span>
            </div>
          )}

          {/* Budget strip */}
          <div className="mt-3 pt-3 border-t border-slate-200/60">
            <div className="text-[9px] text-slate-400 uppercase tracking-wide mb-1.5">BU Budgets</div>
            <div className="flex gap-1">
              {buBudgets.slice(0, 4).map((bu, i) => {
                const pct = Math.round((bu.currentSpend / bu.monthlyBudget) * 100);
                const color = pct > 90 ? '#ef4444' : pct > 75 ? '#f59e0b' : '#10b981';
                return (
                  <div key={i} className="flex-1" title={`${bu.bu}: ${pct}%`}>
                    <div className="h-3 bg-slate-100 rounded overflow-hidden">
                      <div
                        className="h-full rounded"
                        style={{ width: `${Math.min(pct, 100)}%`, background: color }}
                      />
                    </div>
                    <div className="text-[8px] text-slate-400 truncate mt-0.5">{bu.bu}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* ══════════════════════ Recent Activity ══════════════════════ */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">Recent Activity</span>
            <PulseDot color="#10b981" size="sm" />
          </div>
          <a href="/govern/audit" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            View Audit Log →
          </a>
        </div>
        <div className="space-y-2 max-h-[320px] overflow-y-auto">
          {activityFeed.slice(0, 10).map((item) => (
            <div
              key={item.id}
              className="p-2 rounded-lg bg-slate-50/80 border border-slate-200/40 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <ModuleBadge module={item.module} />
                <SeverityBadge severity={item.severity} />
                <span className="text-[8px] text-slate-400 ml-auto">{item.ts}</span>
              </div>
              <div className="text-[11px] text-slate-800 font-medium">{item.title}</div>
              <div className="text-[10px] text-slate-500">{item.description}</div>
              {item.actor && (
                <div className="text-[9px] text-slate-400 mt-0.5">by {item.actor}</div>
              )}
            </div>
          ))}
        </div>
      </div>


      {/* ══════════════════════ Quick Actions ══════════════════════ */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href="/govern/audit"
          className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white shadow-sm">
              <Icon name="clipboard-list" className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <div className="text-sm font-semibold text-blue-800">Full Audit Log</div>
              <div className="text-[10px] text-slate-500">CloudTrail events</div>
            </div>
          </div>
        </a>
        <a
          href="/govern/risk"
          className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200/60 hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500 flex items-center justify-center text-white shadow-sm">
              <Icon name="exclamation-triangle" className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <div className="text-sm font-semibold text-rose-800">Risk Register</div>
              <div className="text-[10px] text-slate-500">Heatmaps & controls</div>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}
