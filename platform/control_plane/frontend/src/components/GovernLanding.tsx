import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Line, Legend,
  RadialBarChart, RadialBar,
} from 'recharts';
import {
  // Dashboard
  TRUST_SCORE, GOV_KPIS, COMPLIANCE_FRAMEWORKS, RISK_CATEGORIES, AGENT_RISK,
  GUARDRAIL_FEED, TOP_RISKY_USE_CASES, RISK_TREND_30D,
  // Cost
  COST_HEALTH, COST_KPIS, SPEND_VELOCITY, COST_BY_MODEL, COST_30DAY_TREND,
  ANOMALY_ALERTS, BU_BUDGETS, AGENT_COSTS,
  OPTIMIZATION_OPPS, TOTAL_POTENTIAL_SAVINGS,
  // Trust stack + models
  TRUST_STACK_LAYERS, MODELS,
  tooltipStyle,
} from './govern/mockData';
import ModelDrawer from './govern/ModelDrawer';
import RiskDrawer from './govern/RiskDrawer';
import FrameworkDrawer from './govern/FrameworkDrawer';

const intentBg: Record<string, string> = {
  primary: 'bg-blue-50 text-blue-700 ring-blue-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  danger:  'bg-rose-50 text-rose-700 ring-rose-200',
};

const severityBg: Record<string, string> = {
  low:    'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high:   'bg-rose-100 text-rose-700',
};

const anomalySeverity: Record<string, string> = {
  warning: 'bg-amber-100 text-amber-700',
  primary: 'bg-blue-100 text-blue-700',
};

const tierBg: Record<string, string> = {
  'Tier 1': 'bg-rose-50 text-rose-700 ring-rose-200',
  'Tier 2': 'bg-amber-50 text-amber-700 ring-amber-200',
  'Tier 3': 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

const modelStatusBg: Record<string, string> = {
  'Production':     'bg-emerald-50 text-emerald-700',
  'Pending Review': 'bg-amber-50 text-amber-700',
};

function cellColor(score: number): string {
  if (score < 20) return 'bg-emerald-100 text-emerald-800';
  if (score < 40) return 'bg-lime-100 text-lime-800';
  if (score < 60) return 'bg-amber-100 text-amber-800';
  if (score < 80) return 'bg-orange-100 text-orange-800';
  return 'bg-rose-100 text-rose-800';
}

function TrustScoreGauge() {
  const data = [{ name: 'trust', value: TRUST_SCORE.overall, fill: '#6366f1' }];
  return (
    <div className="relative flex items-center justify-center">
      <ResponsiveContainer width={160} height={160}>
        <RadialBarChart innerRadius="70%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
          <RadialBar dataKey="value" background={{ fill: '#e0e7ff' }} cornerRadius={10} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold text-slate-900">{TRUST_SCORE.overall}</div>
        <div className="text-[9px] uppercase tracking-widest text-slate-400">Trust Score</div>
        <div className={`mt-0.5 text-[10px] font-semibold ${TRUST_SCORE.trend === 'improving' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {TRUST_SCORE.trend === 'improving' ? '▲' : '▼'} {TRUST_SCORE.delta > 0 ? '+' : ''}{TRUST_SCORE.delta} w/w
        </div>
      </div>
    </div>
  );
}

const SECTIONS = [
  { id: 'trust-stack', label: 'Trust Stack' },
  { id: 'fleet',       label: 'Fleet' },
  { id: 'risk',        label: 'Risk' },
  { id: 'models',      label: 'Models' },
  { id: 'compliance',  label: 'Compliance' },
  { id: 'cost',        label: 'Cost' },
  { id: 'activity',    label: 'Activity' },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

export default function GovernLanding() {
  const [active, setActive] = useState<SectionId>('trust-stack');
  const [openModel, setOpenModel] = useState<string | null>(null);
  const [openRisk, setOpenRisk] = useState<{ agent: string; category: string; score: number } | null>(null);
  const [openFramework, setOpenFramework] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id as SectionId);
        });
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const totalBudget = BU_BUDGETS.reduce((s, b) => s + b.monthlyBudget, 0);
  const totalSpend = BU_BUDGETS.reduce((s, b) => s + b.currentSpend, 0);

  return (
    <div className="min-h-[calc(100vh-4rem)] relative">
      <div className="relative max-w-7xl mx-auto px-6 py-10">
        <Link to="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors font-medium">
          ← Home
        </Link>

        <div className="flex items-end justify-between mt-3 mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Govern</h1>
            <p className="text-slate-500 mt-1 max-w-2xl">
              The one view your executives, auditors, and engineers share — trust, compliance, risk, models, and cost across every agent.
            </p>
          </div>
          <div className="text-xs text-slate-400">
            Updated {new Date().toLocaleTimeString()} · <span className="text-emerald-600 font-medium">● Live</span>
          </div>
        </div>

        {/* Sticky section nav */}
        <nav className="sticky top-4 z-20 mb-6 flex justify-start">
          <div className="inline-flex items-center gap-1 px-2 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-slate-200/60 shadow-sm">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={() => setActive(s.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  active === s.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                {s.label}
              </a>
            ))}
          </div>
        </nav>

        {/* ─── TRUST STACK ─── */}
        <section id="trust-stack" className="scroll-mt-20 mb-10">
          <div className="flex items-end justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-900">AI Trust Stack</h2>
            <div className="text-xs text-slate-400">7 layers · governance, access, agent, application, model, data, infrastructure</div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-4 shadow-sm flex flex-col items-center justify-center">
              <TrustScoreGauge />
              <div className="mt-3 space-y-1.5 w-full">
                {TRUST_SCORE.components.slice(0, 4).map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">{c.name}</span>
                    <span className="font-semibold text-slate-900">{c.score}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-4 shadow-sm">
              <div className="space-y-1.5">
                {TRUST_STACK_LAYERS.map((l) => (
                  <div key={l.id} className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-center gap-2 w-44 flex-shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 w-7">{l.id}</span>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                      <span className="text-sm font-semibold text-slate-900">{l.name}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${l.score}%`, background: l.color }} />
                        </div>
                        <span className="text-xs font-bold text-slate-900 w-7 text-right">{l.score}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {l.signals.map((s) => (
                          <span key={s} className="text-[10px] text-slate-500">· {s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── FLEET KPIs ─── */}
        <section id="fleet" className="scroll-mt-20 mb-10">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Fleet at a Glance</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {GOV_KPIS.map((k) => (
              <div key={k.label} className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{k.label}</div>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ring-1 ${intentBg[k.intent]}`}>●</span>
                </div>
                <div className="text-2xl font-semibold text-slate-900 mt-1">{k.value}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-slate-900">30-Day Trust & Guardrail Trend</div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Trust score</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Guardrail hits</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Violations</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={RISK_TREND_30D} margin={{ left: 0, right: 5, bottom: 0, top: 5 }}>
                <defs>
                  <linearGradient id="trustGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="hitsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area yAxisId="left" type="monotone" dataKey="trustScore" stroke="#6366f1" fill="url(#trustGrad)" strokeWidth={2} />
                <Area yAxisId="right" type="monotone" dataKey="guardrailHits" stroke="#f59e0b" fill="url(#hitsGrad)" strokeWidth={2} />
                <Area yAxisId="right" type="monotone" dataKey="violations" stroke="#ef4444" fill="none" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* ─── RISK HEATMAP ─── */}
        <section id="risk" className="scroll-mt-20 mb-10">
          <div className="flex items-end justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-900">Risk</h2>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <span>Low</span>
              <span className="w-3 h-3 rounded-sm bg-emerald-100" />
              <span className="w-3 h-3 rounded-sm bg-lime-100" />
              <span className="w-3 h-3 rounded-sm bg-amber-100" />
              <span className="w-3 h-3 rounded-sm bg-orange-100" />
              <span className="w-3 h-3 rounded-sm bg-rose-100" />
              <span>High</span>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
              <div className="text-sm font-semibold text-slate-900 mb-3">Agent × Risk Heatmap</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500">
                      <th className="text-left font-medium pr-3 pb-2">Agent</th>
                      {RISK_CATEGORIES.map((c) => (
                        <th key={c} className="text-center font-medium px-1.5 pb-2">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {AGENT_RISK.map((r) => (
                      <tr key={r.agent} className="border-t border-slate-100">
                        <td className="py-2 pr-3 text-slate-700 font-medium">{r.agent}</td>
                        {r.scores.map((s, i) => (
                          <td key={i} className="p-1 text-center">
                            <button
                              onClick={() => setOpenRisk({ agent: r.agent, category: RISK_CATEGORIES[i], score: s })}
                              className={`w-full py-1.5 rounded font-semibold cursor-pointer hover:ring-2 hover:ring-slate-400 transition ${cellColor(s)}`}
                              title="Click for details"
                            >
                              {s}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
              <div className="text-sm font-semibold text-slate-900 mb-3">Top Risky Use Cases</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={TOP_RISKY_USE_CASES} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} width={110} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="riskScore" fill="#ef4444" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* ─── MODELS ─── */}
        <section id="models" className="scroll-mt-20 mb-10">
          <div className="flex items-end justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Model Inventory</h2>
              <div className="text-xs text-slate-400 mt-0.5">{MODELS.length} models · {MODELS.reduce((s, m) => s + m.useCases, 0)} use cases · ${(MODELS.reduce((s, m) => s + m.monthlyCost, 0)).toLocaleString()}/mo</div>
            </div>
            <Link to="/govern/models" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Open Model Registry →</Link>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-slate-400 uppercase tracking-wide bg-slate-50/50">
                  <th className="text-left py-2.5 px-5 font-medium">Model</th>
                  <th className="text-left py-2.5 px-3 font-medium">Owner</th>
                  <th className="text-center py-2.5 px-3 font-medium">Risk Tier</th>
                  <th className="text-right py-2.5 px-3 font-medium">Use Cases</th>
                  <th className="text-right py-2.5 px-3 font-medium">Eval</th>
                  <th className="text-right py-2.5 px-3 font-medium">Monthly Cost</th>
                  <th className="text-left py-2.5 px-3 font-medium">Last Validated</th>
                  <th className="text-left py-2.5 px-5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {MODELS.map((m) => (
                  <tr key={m.id} onClick={() => setOpenModel(m.id)} className="border-t border-slate-100 hover:bg-slate-50/60 cursor-pointer transition-colors">
                    <td className="py-2.5 px-5">
                      <div className="font-semibold text-slate-900">{m.name}</div>
                      <div className="text-[11px] text-slate-400">{m.provider}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{m.owner}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ${tierBg[m.tier]}`}>{m.tier}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 tabular-nums">{m.useCases}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`font-semibold tabular-nums ${m.evalScore >= 85 ? 'text-emerald-600' : m.evalScore >= 70 ? 'text-amber-600' : 'text-rose-600'}`}>{m.evalScore}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 tabular-nums">${m.monthlyCost.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">{m.lastValidated}</td>
                    <td className="py-2.5 px-5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${modelStatusBg[m.status]}`}>{m.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── COMPLIANCE ─── */}
        <section id="compliance" className="scroll-mt-20 mb-10">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Compliance Coverage</h2>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
              {COMPLIANCE_FRAMEWORKS.map((f) => {
                const pct = (f.covered / f.total) * 100;
                const barColor = f.status === 'on-track' ? 'bg-emerald-500' : f.status === 'attention' ? 'bg-amber-500' : 'bg-rose-500';
                return (
                  <button
                    key={f.name}
                    onClick={() => setOpenFramework(f.name)}
                    className="text-left p-1 -m-1 rounded hover:bg-slate-50 transition-colors"
                    title="Click to view controls"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-700 font-medium">{f.name}</span>
                      <span className="text-slate-400">{f.covered}/{f.total}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {pct.toFixed(0)}% controls covered · {f.status === 'on-track' ? 'On track' : f.status === 'attention' ? 'Needs attention' : 'At risk'} · <span className="text-blue-600">view details →</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── COST ─── */}
        <section id="cost" className="scroll-mt-20 mb-10">
          <div className="flex items-end justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Cost & FinOps</h2>
              <div className="text-xs text-slate-400 mt-0.5">${totalSpend.toLocaleString()} of ${totalBudget.toLocaleString()} budget ({((totalSpend / totalBudget) * 100).toFixed(0)}%)</div>
            </div>
            <Link to="/govern/finops" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Open Cost & FinOps →</Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4 mb-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-emerald-200 p-5 shadow-sm text-center">
              <div className="text-[11px] uppercase tracking-widest text-slate-400">FinOps Health</div>
              <div className={`text-5xl font-bold mt-2 ${COST_HEALTH.score >= 70 ? 'text-emerald-600' : COST_HEALTH.score >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                {COST_HEALTH.score}
              </div>
              <div className={`inline-block mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full ${COST_HEALTH.trend === 'improving' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {COST_HEALTH.trend === 'improving' ? '▲ Improving' : '▼ Declining'}
              </div>
              <div className="mt-3 text-xs text-slate-500">
                Savings realized: <span className="font-semibold text-slate-700">${COST_HEALTH.savingsRealized.toLocaleString()}</span>
                <span className="text-slate-400"> / ${COST_HEALTH.savingsTarget.toLocaleString()}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {COST_KPIS.map((k) => (
                <div key={k.label} className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 shadow-sm">
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{k.label}</div>
                  <div className="text-2xl font-semibold mt-1" style={{ color: k.color }}>{k.value}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{k.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {ANOMALY_ALERTS.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-amber-200 p-4 shadow-sm mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase">Cost Anomalies</span>
                <span className="text-xs text-slate-500">{ANOMALY_ALERTS.length} active alerts</span>
              </div>
              <div className="space-y-1.5">
                {ANOMALY_ALERTS.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-xs">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${anomalySeverity[a.severity]}`}>{a.type}</span>
                    <span className="text-slate-700">{a.desc}</span>
                    <span className="text-slate-400">· {a.bu}</span>
                    <span className="text-slate-400 ml-auto">{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
              <div className="text-sm font-semibold text-slate-900 mb-3">Spend Velocity (Today)</div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={SPEND_VELOCITY} margin={{ left: 0, right: 5, bottom: 0, top: 5 }}>
                  <defs>
                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} unit="$" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => `$${Number(v).toFixed(2)}`} />
                  <Area type="monotone" dataKey="cost" stroke="#f59e0b" fill="url(#spendGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
              <div className="text-sm font-semibold text-slate-900 mb-3">Cost by Model (Monthly)</div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={COST_BY_MODEL} dataKey="cost" nameKey="model" cx="50%" cy="50%" outerRadius={68} innerRadius={40} paddingAngle={2}>
                    {COST_BY_MODEL.map((m, i) => <Cell key={i} fill={m.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => `$${Number(v).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] mt-2">
                {COST_BY_MODEL.map((m) => (
                  <div key={m.model} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                    <span className="text-slate-700 truncate">{m.model}</span>
                    <span className="text-slate-400 ml-auto">${m.cost.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 mb-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
              <div className="text-sm font-semibold text-slate-900 mb-3">30-Day Cost vs Budget</div>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={COST_30DAY_TREND} margin={{ left: 5, right: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} unit="$" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => `$${Number(v).toFixed(0)}`} />
                  <Area type="monotone" dataKey="cost" stroke="#f59e0b" fill="url(#costGrad)" strokeWidth={2} name="Daily Cost" />
                  <Line type="monotone" dataKey="budget" stroke="#ef4444" strokeDasharray="5 5" dot={false} name="Daily Budget" />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
              <div className="text-sm font-semibold text-slate-900 mb-3">Budget by BU</div>
              <div className="space-y-2.5">
                {BU_BUDGETS.map((b) => {
                  const pct = (b.currentSpend / b.monthlyBudget);
                  const color = pct > 0.9 ? 'bg-rose-500' : pct > 0.75 ? 'bg-amber-500' : 'bg-emerald-500';
                  return (
                    <div key={b.bu}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-700 font-medium">{b.bu}</span>
                        <span className="text-slate-400">${b.currentSpend.toLocaleString()}/${b.monthlyBudget.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct * 100, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
              <div className="text-sm font-semibold text-slate-900 mb-3">Top Cost Drivers — Agents</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={AGENT_COSTS.slice().sort((a, b) => b.monthlyCost - a.monthlyCost)} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} unit="$" />
                  <YAxis type="category" dataKey="agent" tick={{ fill: '#475569', fontSize: 10 }} width={130} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => `$${Number(v).toFixed(2)}`} />
                  <Bar dataKey="monthlyCost" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-slate-900">Optimization Opportunities</div>
                <span className="text-[11px] font-semibold text-emerald-600">${TOTAL_POTENTIAL_SAVINGS}/mo potential</span>
              </div>
              <div className="space-y-2">
                {OPTIMIZATION_OPPS.map((o) => (
                  <div key={o.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50/60 transition-colors">
                    <div className="text-lg font-bold text-emerald-600 w-16 flex-shrink-0 text-right">${o.savings}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-700 leading-tight">{o.rec}</div>
                      <div className="flex items-center gap-2 mt-1 text-[10px]">
                        <span className="text-slate-400">Effort: <span className="text-slate-600 font-medium">{o.effort}</span></span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-400">Risk: <span className="text-slate-600 font-medium">{o.risk}</span></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── ACTIVITY ─── */}
        <section id="activity" className="scroll-mt-20 mb-10">
          <div className="flex items-end justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
            <Link to="/govern/audit" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Open Audit & Incidents →</Link>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-slate-900">Guardrail & Incident Feed</div>
              <span className="text-[10px] font-semibold text-slate-400">Last 3 hours</span>
            </div>
            <div className="space-y-2">
              {GUARDRAIL_FEED.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 font-mono w-10">{e.ts}</span>
                  <span className={`px-1.5 py-0.5 rounded font-medium text-[10px] ${severityBg[e.severity]}`}>{e.severity}</span>
                  <span className="text-slate-700 flex-1 truncate">{e.event}</span>
                  <span className="text-slate-400 text-[10px]">{e.agent}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>

      <ModelDrawer     modelId={openModel}          onClose={() => setOpenModel(null)} />
      <RiskDrawer      selection={openRisk}         onClose={() => setOpenRisk(null)} />
      <FrameworkDrawer frameworkKey={openFramework} onClose={() => setOpenFramework(null)} />
    </div>
  );
}
