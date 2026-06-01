/**
 * RiskDashboard — Portfolio risk overview with key metrics and trends
 */

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import {
  RISKS, CONTROLS, ISSUES,
  getRiskStats, getControlStats, getIssueStats,
  getRiskClass, RISK_CATEGORIES,
} from './riskData';

const tooltipStyle = {
  background: 'rgba(255,255,255,0.98)',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  fontSize: 12,
  color: '#0f172a',
  boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
};

export default function RiskDashboard() {
  const riskStats = useMemo(() => getRiskStats(), []);
  const controlStats = useMemo(() => getControlStats(), []);
  const issueStats = useMemo(() => getIssueStats(), []);

  const riskByClass = useMemo(() => {
    const classes = [
      { name: 'Critical', min: 20, max: 25, color: '#991b1b' },
      { name: 'High', min: 15, max: 19, color: '#c2410c' },
      { name: 'Medium', min: 10, max: 14, color: '#a16207' },
      { name: 'Low', min: 5, max: 9, color: '#15803d' },
      { name: 'Very Low', min: 0, max: 4, color: '#475569' },
    ];
    return classes.map(c => ({
      ...c,
      count: RISKS.filter(r => r.residualScore >= c.min && r.residualScore <= c.max).length,
    })).filter(c => c.count > 0);
  }, []);

  const topRisks = useMemo(() =>
    [...RISKS].sort((a, b) => b.residualScore - a.residualScore).slice(0, 5),
  []);

  const categoryData = useMemo(() =>
    riskStats.byCategory.filter(c => c.count > 0).sort((a, b) => b.count - a.count),
  [riskStats]);

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 shadow-sm">
          <div className="text-[10px] font-medium text-slate-500 uppercase">Total Risks</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">{riskStats.total}</div>
          <div className="text-xs text-slate-400 mt-1">{riskStats.byStatus.open} open</div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rose-200 p-4 shadow-sm">
          <div className="text-[10px] font-medium text-rose-600 uppercase">Critical / High</div>
          <div className="text-3xl font-bold text-rose-700 mt-1">{riskStats.critical + riskStats.high}</div>
          <div className="text-xs text-rose-400 mt-1">{riskStats.critical} critical, {riskStats.high} high</div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-amber-200 p-4 shadow-sm">
          <div className="text-[10px] font-medium text-amber-600 uppercase">Trending Up</div>
          <div className="text-3xl font-bold text-amber-700 mt-1">{riskStats.increasing}</div>
          <div className="text-xs text-amber-400 mt-1">risks increasing</div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-emerald-200 p-4 shadow-sm">
          <div className="text-[10px] font-medium text-emerald-600 uppercase">Controls</div>
          <div className="text-3xl font-bold text-emerald-700 mt-1">{controlStats.implemented}/{controlStats.total}</div>
          <div className="text-xs text-emerald-400 mt-1">implemented</div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-blue-200 p-4 shadow-sm">
          <div className="text-[10px] font-medium text-blue-600 uppercase">Open Issues</div>
          <div className="text-3xl font-bold text-blue-700 mt-1">{issueStats.open + issueStats.inProgress}</div>
          <div className="text-xs text-blue-400 mt-1">{issueStats.high} high severity</div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 shadow-sm">
          <div className="text-[10px] font-medium text-slate-500 uppercase">Avg Residual</div>
          <div className="text-3xl font-bold mt-1" style={{ color: getRiskClass(riskStats.avgResidual).color }}>
            {riskStats.avgResidual}
          </div>
          <div className="text-xs text-slate-400 mt-1">{getRiskClass(riskStats.avgResidual).label}</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risk by Class Pie */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Risk Distribution</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={riskByClass}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={60}
                  paddingAngle={2}
                >
                  {riskByClass.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {riskByClass.map(c => (
                <div key={c.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-xs text-slate-600">{c.name}</span>
                  <span className="text-xs font-semibold text-slate-900 ml-auto">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Risk by Category */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Risks by Category</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={categoryData} layout="vertical" margin={{ left: 0, right: 10 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#475569', fontSize: 10 }}
                width={100}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Control Effectiveness */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Control Effectiveness</h3>
          <div className="space-y-4">
            {[
              { label: 'High', value: controlStats.effectiveness.high, color: '#10b981' },
              { label: 'Medium', value: controlStats.effectiveness.medium, color: '#f59e0b' },
              { label: 'Low', value: controlStats.effectiveness.low, color: '#ef4444' },
            ].map(row => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600">{row.label} effectiveness</span>
                  <span className="font-semibold text-slate-900">{row.value}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(row.value / controlStats.total) * 100}%`, backgroundColor: row.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Implementation rate</span>
              <span className="font-semibold text-emerald-600">
                {Math.round((controlStats.implemented / controlStats.total) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Risks Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Top Risks by Residual Score</h3>
          <span className="text-xs text-slate-400">Sorted by residual risk</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-slate-400 uppercase tracking-wide">
                <th className="text-left py-2 px-3 font-medium">Risk ID</th>
                <th className="text-left py-2 px-3 font-medium">Title</th>
                <th className="text-left py-2 px-3 font-medium">Category</th>
                <th className="text-center py-2 px-3 font-medium">Inherent</th>
                <th className="text-center py-2 px-3 font-medium">Residual</th>
                <th className="text-center py-2 px-3 font-medium">Trend</th>
                <th className="text-left py-2 px-3 font-medium">Status</th>
                <th className="text-left py-2 px-3 font-medium">Owner</th>
              </tr>
            </thead>
            <tbody>
              {topRisks.map(risk => {
                const cat = RISK_CATEGORIES.find(c => c.id === risk.category);
                const inherentClass = getRiskClass(risk.inherentScore);
                const residualClass = getRiskClass(risk.residualScore);
                return (
                  <tr key={risk.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-mono text-xs text-slate-500">{risk.id}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-900 max-w-xs truncate">{risk.title}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <span>{cat?.icon}</span>
                        <span className="text-slate-600">{cat?.name}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${inherentClass.bgColor}`}>
                        {risk.inherentScore}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${residualClass.bgColor}`}>
                        {risk.residualScore}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-xs ${
                        risk.trend === 'increasing' ? 'text-rose-600' :
                        risk.trend === 'decreasing' ? 'text-emerald-600' : 'text-slate-400'
                      }`}>
                        {risk.trend === 'increasing' ? '↑' : risk.trend === 'decreasing' ? '↓' : '→'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        risk.status === 'open' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                        risk.status === 'mitigated' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        risk.status === 'accepted' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                        'bg-slate-100 border-slate-200 text-slate-600'
                      }`}>
                        {risk.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{risk.owner}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issues Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Open Issues */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Open Issues</h3>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
              issueStats.overdue > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {issueStats.overdue > 0 ? `${issueStats.overdue} overdue` : 'On track'}
            </span>
          </div>
          <div className="space-y-3">
            {ISSUES.filter(i => i.status !== 'closed' && i.status !== 'remediated').slice(0, 4).map(issue => (
              <div key={issue.id} className="p-3 border border-slate-200 rounded-lg">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-400">{issue.id}</span>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                        issue.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        issue.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                        issue.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {issue.severity}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-slate-900 mt-1 truncate">{issue.title}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Owner: {issue.owner} · Due: {issue.dueDate}
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border flex-shrink-0 ${
                    issue.status === 'open' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                    'bg-blue-50 border-blue-200 text-blue-700'
                  }`}>
                    {issue.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Three Lines of Defense Summary */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Three Lines of Defense</h3>
          <div className="space-y-4">
            {[
              { line: '1st Line', role: 'Business / Operations', desc: 'Risk ownership, day-to-day controls', controls: CONTROLS.filter(c => ['ML Platform', 'Platform', 'FinOps'].includes(c.owner)).length },
              { line: '2nd Line', role: 'Risk / Compliance', desc: 'Oversight, policy, monitoring', controls: CONTROLS.filter(c => ['RAI Council', 'Fair Lending Team', 'Security', 'Data Governance'].includes(c.owner)).length },
              { line: '3rd Line', role: 'Internal Audit', desc: 'Independent assurance', controls: 0 },
            ].map((lod, i) => (
              <div key={i} className="flex items-center gap-4 p-3 border border-slate-200 rounded-lg">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                  i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-purple-500' : 'bg-slate-500'
                }`}>
                  {lod.line.split(' ')[0]}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-900">{lod.role}</div>
                  <div className="text-xs text-slate-500">{lod.desc}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-900">{lod.controls}</div>
                  <div className="text-[10px] text-slate-400">controls</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
