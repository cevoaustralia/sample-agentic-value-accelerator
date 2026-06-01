/**
 * FleetOverview — Fleet-wide KPIs and trends
 *
 * Agent fleet dashboard with KPIs, guardrail trends, and violation tracking.
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  GOV_KPIS, RISK_CATEGORIES, AGENT_RISK, GUARDRAIL_FEED, TOP_RISKY_USE_CASES, RISK_TREND_30D,
  tooltipStyle,
} from './mockData';
import RiskDrawer from './RiskDrawer';
import { FleetOverviewGuide } from './ModuleGuide';
import { useGovernanceAggregator } from './useGovernanceAggregator';

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

function cellColor(score: number): string {
  if (score < 20) return 'bg-emerald-100 text-emerald-800';
  if (score < 40) return 'bg-lime-100 text-lime-800';
  if (score < 60) return 'bg-amber-100 text-amber-800';
  if (score < 80) return 'bg-orange-100 text-orange-800';
  return 'bg-rose-100 text-rose-800';
}

export default function FleetOverview() {
  const [openRisk, setOpenRisk] = useState<{ agent: string; category: string; score: number } | null>(null);
  const { loading, summary, guardrails, deployments, useCases, frontierAgents, guardrailMetricsTotal } = useGovernanceAggregator();

  // Build KPIs from real data + fallback to mock
  const kpis = useMemo(() => {
    if (loading) return GOV_KPIS;
    return [
      { label: 'Trust Score', value: `${summary.trustScore}%`, sub: summary.trustTrend === 'improving' ? '↑ improving' : summary.trustTrend === 'declining' ? '↓ declining' : '→ stable', intent: summary.trustScore >= 80 ? 'success' : summary.trustScore >= 60 ? 'warning' : 'danger' },
      { label: 'Guardrails Active', value: summary.guardrailsActive.toString(), sub: `${summary.guardrailsDraft} draft, ${summary.guardrailsFailed} failed`, intent: summary.guardrailsFailed > 0 ? 'danger' : 'success' },
      { label: 'Deployments', value: summary.deploymentsActive.toString(), sub: `${summary.deploymentsPending} pending`, intent: summary.deploymentsFailed > 0 ? 'warning' : 'primary' },
      { label: 'Use Cases', value: summary.totalUseCases.toString(), sub: `${summary.deployedUseCases} in production`, intent: 'primary' },
      { label: 'Guardrail Events (24h)', value: guardrailMetricsTotal.totalInvocations.toLocaleString(), sub: `${guardrailMetricsTotal.blockedCount} blocked (${guardrailMetricsTotal.blockRate.toFixed(1)}%)`, intent: guardrailMetricsTotal.blockRate > 10 ? 'warning' : 'success' },
    ];
  }, [loading, summary, guardrailMetricsTotal]);

  return (
    <div className="min-h-[calc(100vh-4rem)] relative">
      <div className="relative max-w-7xl mx-auto px-6 py-10">
        <Link to="/govern" className="text-sm text-slate-400 hover:text-slate-600 transition-colors font-medium">
          ← Govern
        </Link>

        <div className="flex items-end justify-between mt-3 mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Fleet Overview</h1>
            <p className="text-slate-500 mt-1 max-w-2xl">
              Fleet-wide KPIs, guardrail trends, and violation tracking. Monitor every agent from a single dashboard.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/govern/risk"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              View Risk Management →
            </Link>
            <div className="text-xs text-slate-400">
              Updated {new Date().toLocaleTimeString()} · <span className="text-emerald-600 font-medium">● Live</span>
            </div>
          </div>
        </div>

        {/* How to Use Guide */}
        <FleetOverviewGuide />

        <div className="space-y-6">
          {/* Real-time data indicator */}
          {!loading && (guardrails.length > 0 || deployments.length > 0 || useCases.length > 0) && (
            <div className="flex items-center gap-2 text-[10px] text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live AVA Data: {guardrails.length} guardrails, {deployments.length} deployments, {useCases.length} use cases, {frontierAgents.length} agents
            </div>
          )}

          {/* KPI Cards - Now using real data */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {kpis.map((k) => (
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

          {/* Trust & Guardrail Trend */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-slate-900">30-Day Trust & Guardrail Trend</div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Trust score</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Guardrail hits</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Violations</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
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

          {/* Risk Heatmap & Top Risky Use Cases */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-slate-900">Agent × Risk Heatmap</div>
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

          {/* Recent Activity */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-slate-900">Guardrail & Incident Feed</div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-semibold text-slate-400">Last 3 hours</span>
                <Link to="/govern/audit" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  View All →
                </Link>
              </div>
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
        </div>
      </div>

      <RiskDrawer selection={openRisk} onClose={() => setOpenRisk(null)} />
    </div>
  );
}
