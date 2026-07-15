/**
 * GovernLanding — Hub page for Governance module
 *
 * Displays cards for each governance capability, linking to dedicated pages.
 * Pattern mirrors PlanLanding.tsx — simple hub with hero illustrations per card.
 */

import { Link, useNavigate } from 'react-router-dom';
import { GovernLandingGuide } from './govern/ModuleGuide';

type Illustration =
  | 'command-center'
  | 'trust-stack'
  | 'fleet'
  | 'risk'
  | 'models'
  | 'compliance'
  | 'finops'
  | 'audit';

interface GovItem {
  id: string;
  path: string;
  name: string;
  tagline: string;
  description: string;
  iconBg: string;
  iconPath: string;
  illustration: Illustration;
  tags: string[];
  stats?: { label: string; value: string }[];
}

const GOV_ITEMS: GovItem[] = [
  {
    id: 'command-center',
    path: '/govern/command-center',
    name: 'Command Center',
    tagline: 'AI governance across AVA.',
    description: 'See how governance integrates across Plan → Build → Secure → Operate. Real-time trust scores, compliance posture, risk exposure, and alerts.',
    iconBg: 'from-indigo-500 to-blue-600',
    iconPath: 'M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6',
    illustration: 'command-center',
    tags: ['Platform view', 'Trust scores', 'Alerts'],
    stats: [
      { label: 'Modules', value: '16' },
      { label: 'Updates', value: 'Live' },
    ],
  },
  {
    id: 'trust-stack',
    path: '/govern/trust-stack',
    name: 'Trust Stack',
    tagline: 'Foundation → Production → Scale.',
    description: 'Deep dive into the 3-layer model: AWS services, key controls, 3 Lines of Defense activities. Build out your governance maturity.',
    iconBg: 'from-blue-500 to-indigo-600',
    iconPath: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
    illustration: 'trust-stack',
    tags: ['3 layers', 'AWS services', '3LoD'],
    stats: [
      { label: 'Layers', value: '3' },
      { label: 'Controls', value: '45+' },
    ],
  },
  {
    id: 'fleet',
    path: '/govern/fleet',
    name: 'Fleet Overview',
    tagline: 'Know your agents.',
    description: 'Fleet-wide KPIs, guardrail trends, violation tracking, and trust score history. Monitor every agent from a single dashboard.',
    iconBg: 'from-indigo-500 to-violet-600',
    iconPath: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
    illustration: 'fleet',
    tags: ['Agent KPIs', 'Guardrails', '30-day trends'],
    stats: [
      { label: 'Agents', value: '12' },
      { label: 'KPIs', value: '5' },
    ],
  },
  {
    id: 'risk',
    path: '/govern/risk',
    name: 'Risk Management',
    tagline: 'Identify, assess, mitigate.',
    description: 'Complete risk register with heatmaps, assessments, controls library, and issue tracking. Aligned to NIST AI RMF and SR 26-2.',
    iconBg: 'from-violet-500 to-purple-600',
    iconPath: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
    illustration: 'risk',
    tags: ['Risk register', 'Heatmaps', 'Controls', 'Issues'],
    stats: [
      { label: 'Categories', value: '10' },
      { label: 'Controls', value: '25+' },
    ],
  },
  {
    id: 'models',
    path: '/govern/models',
    name: 'Model Management',
    tagline: 'Govern your models.',
    description: 'Model registry, lifecycle management, evaluations, and monitoring. Track risk tiers, validation status, and cost per model.',
    iconBg: 'from-violet-500 to-purple-600',
    iconPath: 'M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9',
    illustration: 'models',
    tags: ['Registry', 'Lifecycle', 'Evaluations'],
    stats: [
      { label: 'Models', value: '8' },
      { label: 'Use cases', value: '23' },
    ],
  },
  {
    id: 'compliance',
    path: '/govern/compliance',
    name: 'Compliance Center',
    tagline: 'Stay audit-ready.',
    description: 'Interactive checklists for SR 26-2, NIST AI RMF, EU AI Act, and data sensitivity. Track control status, evidence, and gaps.',
    iconBg: 'from-purple-500 to-fuchsia-600',
    iconPath: 'M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z',
    illustration: 'compliance',
    tags: ['SR 26-2', 'NIST AI RMF', 'EU AI Act', 'PII/PHI'],
    stats: [
      { label: 'Frameworks', value: '4' },
      { label: 'Controls', value: '80+' },
    ],
  },
  {
    id: 'finops',
    path: '/govern/finops',
    name: 'Cost & FinOps',
    tagline: 'Control AI spend.',
    description: 'Budget tracking, spend velocity, cost by model and BU, anomaly detection, and optimization recommendations.',
    iconBg: 'from-fuchsia-500 to-pink-600',
    iconPath: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z',
    illustration: 'finops',
    tags: ['Budgets', 'Anomalies', 'Optimizations'],
    stats: [
      { label: 'Health', value: '72' },
      { label: 'Savings', value: '$4.2k' },
    ],
  },
  {
    id: 'audit',
    path: '/govern/audit',
    name: 'Audit & Incidents',
    tagline: 'Track every event.',
    description: 'Guardrail activity feed, incident management, audit logs, and compliance evidence. Full traceability for regulators.',
    iconBg: 'from-pink-500 to-rose-600',
    iconPath: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    illustration: 'audit',
    tags: ['Activity feed', 'Incidents', 'Audit trail'],
    stats: [
      { label: 'Events', value: '156' },
      { label: 'Open', value: '3' },
    ],
  },
];

export default function GovernLanding() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[calc(100dvh-4rem)]">
      {/* Ambient gradient */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 70% at 20% 50%, rgba(221,214,254,0.7) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 40%, rgba(245,208,254,0.55) 0%, transparent 55%), radial-gradient(ellipse 50% 60% at 50% 80%, rgba(251,207,232,0.55) 0%, transparent 50%)',
        animation: 'gradientDrift 20s ease-in-out infinite',
      }} />

      <div className="relative max-w-7xl mx-auto px-6 py-8">
        <div className="mb-3 animate-fade-in">
          <Link to="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors font-medium">← Back to Home</Link>
        </div>

        {/* Hero */}
        <div className="mb-6 animate-fade-in stagger-1">
          <h1 className="text-5xl font-semibold tracking-tight leading-tight" style={{ backgroundImage: 'linear-gradient(135deg, #4338ca 0%, #8b5cf6 50%, #ec4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', color: 'transparent' }}>
            AI Governance, Risk, Compliance — one view.
          </h1>
          <p className="text-slate-500 mt-4 max-w-2xl">
            The AI GRC hub your executives, auditors, and engineers share. Monitor trust, track compliance, manage risk, and control cost across every agent in your fleet.
          </p>
          <div className="text-xs text-slate-400 mt-2">
            Updated {new Date().toLocaleTimeString()} · <span className="text-emerald-600 font-medium">● Live</span>
          </div>
        </div>

        {/* Getting Started Guide */}
        <div className="mb-6 animate-fade-in stagger-1">
          <GovernLandingGuide onNavigate={(nav) => navigate(`/govern/${nav}`)} />
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in stagger-2">
          {GOV_ITEMS.map((item) => (
            <GovCard key={item.id} item={item} onClick={() => navigate(item.path)} />
          ))}
        </div>

        {/* Quick guidance */}
        <div className="mt-6 p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200/60 animate-fade-in stagger-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="md:border-l-2 md:border-indigo-400 md:pl-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">For Executives</span>
              <p className="text-slate-600 mt-1">Start with <strong>Command Center</strong> for the 30-second governance snapshot.</p>
            </div>
            <div className="md:border-l-2 md:border-violet-400 md:pl-4">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-700">For Risk Teams</span>
              <p className="text-slate-600 mt-1"><strong>Risk Management</strong> has heatmaps, controls, and issue tracking.</p>
            </div>
            <div className="md:border-l-2 md:border-fuchsia-400 md:pl-4">
              <span className="text-xs font-bold uppercase tracking-wider text-fuchsia-700">For Compliance</span>
              <p className="text-slate-600 mt-1"><strong>Compliance Center</strong> maps controls to SR 26-2, NIST, EU AI Act.</p>
            </div>
            <div className="md:border-l-2 md:border-pink-400 md:pl-4">
              <span className="text-xs font-bold uppercase tracking-wider text-pink-700">For FinOps</span>
              <p className="text-slate-600 mt-1"><strong>Cost & FinOps</strong> tracks budgets, anomalies, and savings.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GovCard({ item, onClick }: { item: GovItem; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group relative bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/70 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-indigo-300/60 transition-all duration-300 flex flex-col"
    >
      {/* Hero illustration */}
      <div className="relative h-20 overflow-hidden flex-shrink-0">
        {item.illustration === 'command-center' && <CommandCenterArt />}
        {item.illustration === 'trust-stack'    && <TrustStackArt />}
        {item.illustration === 'fleet'          && <FleetArt />}
        {item.illustration === 'risk'           && <RiskArt />}
        {item.illustration === 'models'         && <ModelsArt />}
        {item.illustration === 'compliance'     && <ComplianceArt />}
        {item.illustration === 'finops'         && <FinOpsArt />}
        {item.illustration === 'audit'          && <AuditArt />}

        {/* Stats floated top-right */}
        {item.stats && (
          <div className="absolute top-2 right-2 flex gap-1">
            {item.stats.map((s) => (
              <div key={s.label} className="bg-white/20 backdrop-blur-sm rounded px-2 py-0.5 border border-white/25 text-center">
                <div className="text-xs font-bold text-white leading-none">{s.value}</div>
                <div className="text-[8px] uppercase tracking-wider text-white/80 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Icon badge */}
        <div className="absolute bottom-2 left-3">
          <div className="w-9 h-9 rounded-lg bg-white/25 backdrop-blur-sm flex items-center justify-center shadow-sm ring-1 ring-white/30 group-hover:scale-110 transition-transform">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={item.iconPath} />
            </svg>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{item.name}</h3>
        <p className="text-xs font-medium text-slate-500 mb-2">{item.tagline}</p>
        <p className="text-xs text-slate-600 leading-relaxed mb-3 flex-1">{item.description}</p>

        <div className="flex flex-wrap gap-1 mb-3">
          {item.tags.slice(0, 3).map((t) => (
            <span key={t} className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium">{t}</span>
          ))}
        </div>

        <div className="flex items-center text-xs font-semibold text-indigo-600 group-hover:text-indigo-700 transition-colors">
          Open
          <svg className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ───────── Hero illustrations (one per card) ───────── */

function ArtBackdrop({ from, via, to }: { from: string; via?: string; to: string }) {
  return (
    <>
      <div className={`absolute inset-0 bg-gradient-to-br ${from} ${via ?? ''} ${to}`} />
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/15" />
      <div className="absolute -top-10 -left-6 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-8 right-6 w-24 h-24 rounded-full bg-white/15 blur-2xl" />
    </>
  );
}

/* Command Center — radar pulse + KPI tiles */
function CommandCenterArt() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <ArtBackdrop from="from-indigo-500" via="via-blue-500" to="to-blue-600" />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 128" preserveAspectRatio="xMidYMid meet">
        {/* concentric rings */}
        <g stroke="white" fill="none" strokeOpacity="0.4">
          <circle cx="80" cy="64" r="18" strokeWidth="1" />
          <circle cx="80" cy="64" r="32" strokeWidth="1" strokeOpacity="0.28" />
          <circle cx="80" cy="64" r="46" strokeWidth="1" strokeOpacity="0.18" />
        </g>
        {/* sweep */}
        <path d="M80 64 L80 18 A46 46 0 0 1 124 50 Z" fill="white" fillOpacity="0.18" />
        {/* center dot */}
        <circle cx="80" cy="64" r="4" fill="white" />
        {/* mini KPI tiles on right */}
        <g>
          <rect x="160" y="26" width="56" height="28" rx="5" fill="white" fillOpacity="0.22" />
          <rect x="222" y="26" width="56" height="28" rx="5" fill="white" fillOpacity="0.32" />
          <rect x="160" y="62" width="56" height="28" rx="5" fill="white" fillOpacity="0.32" />
          <rect x="222" y="62" width="56" height="28" rx="5" fill="white" fillOpacity="0.22" />
          {/* sparklines inside tiles */}
          <polyline points="166,46 178,40 188,44 198,36 210,38" fill="none" stroke="white" strokeOpacity="0.85" strokeWidth="1.4" strokeLinecap="round" />
          <polyline points="228,46 238,42 248,46 260,38 272,42" fill="none" stroke="white" strokeOpacity="0.85" strokeWidth="1.4" strokeLinecap="round" />
          <polyline points="166,82 178,76 188,80 198,72 210,76" fill="none" stroke="white" strokeOpacity="0.85" strokeWidth="1.4" strokeLinecap="round" />
          <polyline points="228,82 238,78 248,82 260,74 272,78" fill="none" stroke="white" strokeOpacity="0.85" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}

/* Trust Stack — three stacked layers */
function TrustStackArt() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <ArtBackdrop from="from-blue-500" via="via-indigo-500" to="to-indigo-600" />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 128" preserveAspectRatio="xMidYMid meet">
        {/* three perspective slabs */}
        <g>
          <polygon points="80,28 240,28 268,42 52,42" fill="white" fillOpacity="0.85" />
          <polygon points="52,42 268,42 268,52 52,52" fill="white" fillOpacity="0.55" />

          <polygon points="80,58 240,58 268,72 52,72" fill="white" fillOpacity="0.65" />
          <polygon points="52,72 268,72 268,82 52,82" fill="white" fillOpacity="0.4" />

          <polygon points="80,88 240,88 268,102 52,102" fill="white" fillOpacity="0.45" />
          <polygon points="52,102 268,102 268,112 52,112" fill="white" fillOpacity="0.28" />
        </g>
        {/* layer labels */}
        <text x="160" y="38" textAnchor="middle" fill="#4338ca" fontSize="9" fontWeight="700" fontFamily="Inter, sans-serif">SCALE</text>
        <text x="160" y="68" textAnchor="middle" fill="#4338ca" fontSize="9" fontWeight="700" fontFamily="Inter, sans-serif">PRODUCTION</text>
        <text x="160" y="98" textAnchor="middle" fill="#4338ca" fontSize="9" fontWeight="700" fontFamily="Inter, sans-serif">FOUNDATION</text>
      </svg>
    </div>
  );
}

/* Fleet — grid of agent tiles with status dots */
function FleetArt() {
  const cells = [
    { x: 40,  y: 22, op: 0.8, dot: '#10b981' },
    { x: 100, y: 22, op: 0.7, dot: '#10b981' },
    { x: 160, y: 22, op: 0.85, dot: '#f59e0b' },
    { x: 220, y: 22, op: 0.6, dot: '#10b981' },
    { x: 40,  y: 58, op: 0.65, dot: '#10b981' },
    { x: 100, y: 58, op: 0.85, dot: '#ef4444' },
    { x: 160, y: 58, op: 0.7, dot: '#10b981' },
    { x: 220, y: 58, op: 0.75, dot: '#10b981' },
    { x: 40,  y: 94, op: 0.6, dot: '#10b981' },
    { x: 100, y: 94, op: 0.7, dot: '#10b981' },
    { x: 160, y: 94, op: 0.55, dot: '#f59e0b' },
    { x: 220, y: 94, op: 0.8, dot: '#10b981' },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden">
      <ArtBackdrop from="from-indigo-500" via="via-blue-500" to="to-violet-600" />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 128" preserveAspectRatio="xMidYMid meet">
        {cells.map((c, i) => (
          <g key={i}>
            <rect x={c.x} y={c.y} width="44" height="22" rx="4" fill="white" fillOpacity={c.op * 0.5} />
            <rect x={c.x + 4} y={c.y + 6} width="20" height="3" rx="1.5" fill="white" fillOpacity={0.85} />
            <rect x={c.x + 4} y={c.y + 12} width="14" height="2.5" rx="1.25" fill="white" fillOpacity={0.55} />
            <circle cx={c.x + 38} cy={c.y + 8} r="2.5" fill={c.dot} />
          </g>
        ))}
      </svg>
    </div>
  );
}

/* Risk — 4×4 heatmap */
function RiskArt() {
  // intensity drives opacity; simulates risk severity
  const cells: { x: number; y: number; op: number }[] = [];
  const intensities = [
    [0.25, 0.35, 0.55, 0.85],
    [0.3,  0.5,  0.7,  0.95],
    [0.4,  0.55, 0.45, 0.7],
    [0.5,  0.4,  0.35, 0.55],
  ];
  const startX = 100;
  const startY = 16;
  const size = 22;
  const gap = 4;
  intensities.forEach((row, ri) => {
    row.forEach((op, ci) => {
      cells.push({ x: startX + ci * (size + gap), y: startY + ri * (size + gap), op });
    });
  });
  return (
    <div className="absolute inset-0 overflow-hidden">
      <ArtBackdrop from="from-violet-500" via="via-purple-500" to="to-purple-600" />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 128" preserveAspectRatio="xMidYMid meet">
        {/* axis labels */}
        <text x="86" y="29" textAnchor="end" fill="white" fillOpacity="0.7" fontSize="8" fontFamily="Inter, sans-serif">High</text>
        <text x="86" y="55" textAnchor="end" fill="white" fillOpacity="0.7" fontSize="8" fontFamily="Inter, sans-serif">Med</text>
        <text x="86" y="81" textAnchor="end" fill="white" fillOpacity="0.7" fontSize="8" fontFamily="Inter, sans-serif">Low</text>
        <text x="86" y="107" textAnchor="end" fill="white" fillOpacity="0.7" fontSize="8" fontFamily="Inter, sans-serif">Min</text>
        {cells.map((c, i) => (
          <rect key={i} x={c.x} y={c.y} width={size} height={size} rx="3" fill="white" fillOpacity={c.op} />
        ))}
        {/* impact axis */}
        <text x="111" y="122" fill="white" fillOpacity="0.7" fontSize="8" fontFamily="Inter, sans-serif">Likelihood →</text>
      </svg>
    </div>
  );
}

/* Models — registry cards stacked diagonally */
function ModelsArt() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <ArtBackdrop from="from-purple-500" via="via-fuchsia-500" to="to-fuchsia-600" />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 128" preserveAspectRatio="xMidYMid meet">
        {/* back card */}
        <g transform="translate(70, 30) rotate(-6 80 30)">
          <rect width="180" height="60" rx="8" fill="white" fillOpacity="0.35" />
        </g>
        {/* mid card */}
        <g transform="translate(70, 30) rotate(-2 80 30)">
          <rect width="180" height="60" rx="8" fill="white" fillOpacity="0.55" />
        </g>
        {/* front card */}
        <g transform="translate(70, 30)">
          <rect width="180" height="60" rx="8" fill="white" fillOpacity="0.95" />
          {/* inside */}
          <rect x="14" y="12" width="44" height="6" rx="3" fill="#a21caf" fillOpacity="0.85" />
          <rect x="14" y="22" width="80" height="4" rx="2" fill="#a21caf" fillOpacity="0.4" />
          {/* badge */}
          <rect x="130" y="10" width="38" height="14" rx="7" fill="#a21caf" fillOpacity="0.18" stroke="#a21caf" strokeOpacity="0.6" strokeWidth="0.8" />
          <text x="149" y="20" textAnchor="middle" fill="#a21caf" fontSize="8" fontWeight="700" fontFamily="Inter, sans-serif">PROD</text>
          {/* lifecycle bar */}
          <rect x="14" y="36" width="152" height="6" rx="3" fill="#fae8ff" />
          <rect x="14" y="36" width="100" height="6" rx="3" fill="#a21caf" />
          {/* dots */}
          <circle cx="32" cy="50" r="3" fill="#a21caf" />
          <circle cx="62" cy="50" r="3" fill="#a21caf" />
          <circle cx="92" cy="50" r="3" fill="#a21caf" />
          <circle cx="122" cy="50" r="3" fill="#f0abfc" />
          <circle cx="152" cy="50" r="3" fill="#fae8ff" />
        </g>
      </svg>
    </div>
  );
}

/* Compliance — checklist */
function ComplianceArt() {
  const rows = [
    { y: 22, w: 180, done: true },
    { y: 44, w: 150, done: true },
    { y: 66, w: 200, done: true },
    { y: 88, w: 130, done: false },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden">
      <ArtBackdrop from="from-fuchsia-500" via="via-pink-500" to="to-pink-600" />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 128" preserveAspectRatio="xMidYMid meet">
        {rows.map((r, i) => (
          <g key={i}>
            {/* checkbox */}
            <rect x="48" y={r.y} width="14" height="14" rx="3" fill={r.done ? 'white' : 'white'} fillOpacity={r.done ? 0.95 : 0.25} stroke="white" strokeOpacity="0.7" strokeWidth="1" />
            {r.done && (
              <path d={`M${50.5} ${r.y + 7} l${3} ${3} l${5} -${5}`} fill="none" stroke="#db2777" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            )}
            {/* label bar */}
            <rect x="70" y={r.y + 3} width={r.w} height="8" rx="3" fill="white" fillOpacity={r.done ? 0.7 : 0.35} />
            {/* framework chip */}
            <rect x={70 + r.w + 6} y={r.y + 1} width="32" height="12" rx="6" fill="white" fillOpacity="0.25" />
          </g>
        ))}
      </svg>
    </div>
  );
}

/* FinOps — area chart with budget line */
function FinOpsArt() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <ArtBackdrop from="from-pink-500" via="via-rose-500" to="to-rose-600" />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 128" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="finops-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.5" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* grid lines */}
        <g stroke="white" strokeOpacity="0.18" strokeWidth="0.8">
          <line x1="40" y1="36" x2="296" y2="36" />
          <line x1="40" y1="64" x2="296" y2="64" />
          <line x1="40" y1="92" x2="296" y2="92" />
        </g>
        {/* budget reference */}
        <line x1="40" y1="48" x2="296" y2="48" stroke="white" strokeOpacity="0.6" strokeWidth="1" strokeDasharray="3 3" />
        <text x="296" y="44" textAnchor="end" fill="white" fillOpacity="0.85" fontSize="8" fontWeight="600" fontFamily="Inter, sans-serif">Budget</text>
        {/* spend area */}
        <path d="M40 96 L72 86 L104 78 L136 70 L168 64 L200 58 L232 52 L264 44 L296 40 L296 112 L40 112 Z" fill="url(#finops-area)" />
        <path d="M40 96 L72 86 L104 78 L136 70 L168 64 L200 58 L232 52 L264 44 L296 40" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
        {/* anomaly dot */}
        <circle cx="232" cy="52" r="4" fill="#fbbf24" stroke="white" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

/* Audit — timeline log */
function AuditArt() {
  const rows = [
    { y: 22, level: 'info' },
    { y: 44, level: 'warn' },
    { y: 66, level: 'info' },
    { y: 88, level: 'error' },
  ];
  const colorFor = (l: string) => l === 'error' ? '#fca5a5' : l === 'warn' ? '#fcd34d' : '#a7f3d0';
  return (
    <div className="absolute inset-0 overflow-hidden">
      <ArtBackdrop from="from-rose-500" via="via-pink-500" to="to-pink-600" />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 128" preserveAspectRatio="xMidYMid meet">
        {/* timeline rail */}
        <line x1="56" y1="20" x2="56" y2="104" stroke="white" strokeOpacity="0.35" strokeWidth="1.5" />
        {rows.map((r, i) => (
          <g key={i}>
            <circle cx="56" cy={r.y + 5} r="4" fill={colorFor(r.level)} />
            <rect x="70" y={r.y} width="12" height="14" rx="3" fill="white" fillOpacity="0.22" />
            <rect x="88" y={r.y + 2} width="80" height="4" rx="2" fill="white" fillOpacity="0.85" />
            <rect x="88" y={r.y + 9} width="120" height="3" rx="1.5" fill="white" fillOpacity="0.45" />
            <rect x="218" y={r.y + 2} width="44" height="10" rx="5" fill="white" fillOpacity="0.18" stroke="white" strokeOpacity="0.4" strokeWidth="0.6" />
          </g>
        ))}
      </svg>
    </div>
  );
}
