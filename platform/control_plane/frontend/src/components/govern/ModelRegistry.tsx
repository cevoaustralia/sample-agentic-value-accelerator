import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell,
} from 'recharts';
import { MODELS, MODEL_DETAILS, tooltipStyle, generateNeedsAttentionAlerts, getPortfolioRiskSummary, MRM_FRAMEWORKS_META } from './mockData';
import ModelDrawer from './ModelDrawer';
import { useGovernanceAggregator } from './useGovernanceAggregator';

const tierBg: Record<string, string> = {
  'Tier 1': 'bg-rose-50 text-rose-700 ring-rose-200',
  'Tier 2': 'bg-amber-50 text-amber-700 ring-amber-200',
  'Tier 3': 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

const statusBg: Record<string, string> = {
  'Production':     'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Pending Review': 'bg-amber-50 text-amber-700 border-amber-200',
};

const revalidationBg: Record<string, string> = {
  'current':  'bg-emerald-50 text-emerald-700',
  'due-soon': 'bg-amber-50 text-amber-700',
  'overdue':  'bg-rose-50 text-rose-700',
};

const alertSeverityStyle: Record<string, { bg: string; border: string; icon: string; iconBg: string }> = {
  'critical': { bg: 'bg-rose-50', border: 'border-rose-200', icon: '!', iconBg: 'bg-rose-100 text-rose-600' },
  'high': { bg: 'bg-orange-50', border: 'border-orange-200', icon: '⚠', iconBg: 'bg-orange-100 text-orange-600' },
  'medium': { bg: 'bg-amber-50', border: 'border-amber-200', icon: '○', iconBg: 'bg-amber-100 text-amber-600' },
  'low': { bg: 'bg-slate-50', border: 'border-slate-200', icon: '·', iconBg: 'bg-slate-100 text-slate-600' },
};

const alertTypeLabels: Record<string, string> = {
  'overdue-review': 'Revalidation',
  'high-risk-threshold': 'Risk',
  'missing-evaluation': 'Evidence',
  'expiring-attestation': 'Attestation',
  'compliance-gap': 'Compliance',
  'control-gap': 'Controls',
};

interface Props {
  embedded?: boolean;
}

export default function ModelRegistry({ embedded = false }: Props) {
  const [filter, setFilter] = useState<'all' | 'Tier 1' | 'Tier 2' | 'Tier 3'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Production' | 'Pending Review'>('all');
  const [search, setSearch] = useState('');
  const [openModel, setOpenModel] = useState<string | null>(null);

  // Pull real AVA data
  const { loading: avaLoading, useCases, deployments, guardrails, frontierAgents } = useGovernanceAggregator();

  const filtered = useMemo(() => MODELS.filter(m => {
    const tierOk = filter === 'all' || m.tier === filter;
    const statusOk = statusFilter === 'all' || m.status === statusFilter;
    const q = search.toLowerCase();
    const searchOk = !q
      || m.name.toLowerCase().includes(q)
      || m.provider.toLowerCase().includes(q)
      || m.owner.toLowerCase().includes(q);
    return tierOk && statusOk && searchOk;
  }), [filter, statusFilter, search]);

  const totalCost = MODELS.reduce((s, m) => s + m.monthlyCost, 0);
  const totalUseCases = MODELS.reduce((s, m) => s + m.useCases, 0);
  const attested = Object.values(MODEL_DETAILS).filter(d => d.attestation.sr26_2.attested).length;
  const pendingAttestation = MODELS.length - attested;

  const modelsWithComplianceGaps = MODELS.filter(m => {
    const detail = MODEL_DETAILS[m.id];
    return detail?.mrmCompliance?.some(fw => fw.controls.some(c => c.status === 'fail'));
  });

  const modelsNeedingRevalidation = MODELS.filter(m => {
    const detail = MODEL_DETAILS[m.id];
    return detail?.revalidation?.status === 'due-soon' || detail?.revalidation?.status === 'overdue';
  });

  const needsAttentionAlerts = useMemo(() => generateNeedsAttentionAlerts(), []);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  const portfolioRisk = useMemo(() => getPortfolioRiskSummary(), []);

  // Global MRM Framework compliance summary
  const globalMrmCompliance = useMemo(() => {
    const frameworkStats: Record<string, { pass: number; fail: number; inProgress: number; total: number }> = {};

    Object.values(MODEL_DETAILS).forEach(d => {
      d.mrmCompliance?.forEach(fw => {
        if (!frameworkStats[fw.framework]) {
          frameworkStats[fw.framework] = { pass: 0, fail: 0, inProgress: 0, total: 0 };
        }
        fw.controls.forEach(ctrl => {
          if (ctrl.status !== 'not-applicable') {
            frameworkStats[fw.framework].total++;
            if (ctrl.status === 'pass') frameworkStats[fw.framework].pass++;
            else if (ctrl.status === 'fail') frameworkStats[fw.framework].fail++;
            else frameworkStats[fw.framework].inProgress++;
          }
        });
      });
    });

    return Object.entries(frameworkStats).map(([framework, stats]) => ({
      framework,
      ...stats,
      pct: stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0,
      meta: MRM_FRAMEWORKS_META.find(m => m.id === framework),
    }));
  }, []);

  // Aggregate eval history: for each date, mean score across all models that have it
  const aggregateEval = useMemo(() => {
    const byDate: Record<string, { safety: number[]; quality: number[]; latency: number[] }> = {};
    Object.values(MODEL_DETAILS).forEach(d => {
      d.evalHistory.forEach(e => {
        if (!byDate[e.date]) byDate[e.date] = { safety: [], quality: [], latency: [] };
        byDate[e.date].safety.push(e.safety);
        byDate[e.date].quality.push(e.quality);
        byDate[e.date].latency.push(e.latency);
      });
    });
    const mean = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
    return Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, xs]) => ({
      date,
      safety: mean(xs.safety),
      quality: mean(xs.quality),
      latency: mean(xs.latency),
    }));
  }, []);

  return (
    <div className={embedded ? '' : 'min-h-[calc(100vh-4rem)] relative'}>
      <div className={embedded ? '' : 'relative max-w-7xl mx-auto px-6 py-10'}>
        {!embedded && (
          <>
            <Link to="/govern" className="text-sm text-slate-400 hover:text-slate-600 transition-colors font-medium">
              ← Govern
            </Link>

            <div className="flex items-end justify-between mt-3 mb-6">
              <div>
                <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Model Registry</h1>
                <p className="text-slate-500 mt-1 max-w-2xl">
                  Every foundation model in use, with owner, risk tier, eval score, cost, attestation state, and approval chain. Click any row for the full Model 360.
                </p>
              </div>
            </div>
          </>
        )}

        {/* Consolidated Alerts Bar */}
        {(modelsWithComplianceGaps.length > 0 || modelsNeedingRevalidation.length > 0 || needsAttentionAlerts.length > 0) && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm mb-4 p-3">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Critical/High Alert Count */}
              {needsAttentionAlerts.filter(a => a.severity === 'critical' || a.severity === 'high').length > 0 && (
                <button
                  onClick={() => setShowAllAlerts(!showAllAlerts)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
                >
                  <span className="w-5 h-5 bg-rose-100 rounded flex items-center justify-center text-[10px] font-bold text-rose-600">!</span>
                  <span className="text-xs font-medium text-rose-700">
                    {needsAttentionAlerts.filter(a => a.severity === 'critical').length} critical, {needsAttentionAlerts.filter(a => a.severity === 'high').length} high
                  </span>
                </button>
              )}

              {/* Compliance Gaps */}
              {modelsWithComplianceGaps.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-xs font-medium text-amber-700">
                    {modelsWithComplianceGaps.length} compliance gap{modelsWithComplianceGaps.length > 1 ? 's' : ''}
                  </span>
                  <div className="flex gap-1">
                    {modelsWithComplianceGaps.slice(0, 2).map(m => (
                      <button
                        key={m.id}
                        onClick={() => setOpenModel(m.id)}
                        className="text-[10px] font-medium px-1.5 py-0.5 bg-amber-100 rounded text-amber-700 hover:bg-amber-200"
                      >
                        {m.name.split(' ')[0]}
                      </button>
                    ))}
                    {modelsWithComplianceGaps.length > 2 && (
                      <span className="text-[10px] text-amber-600">+{modelsWithComplianceGaps.length - 2}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Revalidation Due */}
              {modelsNeedingRevalidation.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-xs font-medium text-blue-700">
                    {modelsNeedingRevalidation.length} revalidation{modelsNeedingRevalidation.length > 1 ? 's' : ''} due
                  </span>
                  <div className="flex gap-1">
                    {modelsNeedingRevalidation.slice(0, 2).map(m => {
                      const detail = MODEL_DETAILS[m.id];
                      const isOverdue = detail?.revalidation?.status === 'overdue';
                      return (
                        <button
                          key={m.id}
                          onClick={() => setOpenModel(m.id)}
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded hover:opacity-80 ${
                            isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {m.name.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Total Alerts Toggle */}
              <button
                onClick={() => setShowAllAlerts(!showAllAlerts)}
                className="ml-auto text-[11px] font-medium text-slate-500 hover:text-slate-700"
              >
                {showAllAlerts ? 'Hide details' : `${needsAttentionAlerts.length} alerts`}
              </button>
            </div>

            {/* Expandable Alert Details */}
            {showAllAlerts && (
              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                {needsAttentionAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`px-2.5 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity ${alertSeverityStyle[alert.severity].bg} border ${alertSeverityStyle[alert.severity].border}`}
                    onClick={() => alert.modelId && setOpenModel(alert.modelId)}
                  >
                    <span className={`w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold ${alertSeverityStyle[alert.severity].iconBg}`}>
                      {alertSeverityStyle[alert.severity].icon}
                    </span>
                    <span className="text-[10px] font-medium text-slate-700 truncate flex-1">{alert.title}</span>
                    <span className="text-[8px] px-1 py-0.5 rounded bg-white/60 text-slate-500">{alertTypeLabels[alert.type]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Models Registered', value: MODELS.length,                 sub: `${MODELS.filter(m => m.status === 'Production').length} in production` },
            { label: 'Use Cases',          value: totalUseCases,                 sub: 'across the fleet' },
            { label: 'Monthly Cost',       value: `$${totalCost.toLocaleString()}`, sub: `~$${(totalCost * 12 / 1000).toFixed(1)}k/yr` },
            { label: 'SR 26-2 Attested',   value: `${attested}/${MODELS.length}`,   sub: `${pendingAttestation} pending` },
            { label: 'Avg Eval Score',     value: Math.round(MODELS.reduce((s, m) => s + m.evalScore, 0) / MODELS.length), sub: 'quality/safety/latency' },
          ].map(k => (
            <div key={k.label} className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 shadow-sm">
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{k.label}</div>
              <div className="text-2xl font-semibold text-slate-900 mt-1">{k.value}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Portfolio Risk Dashboard */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Portfolio Risk Dashboard</div>
              <div className="text-[11px] text-slate-500">Fleet-wide inherent vs residual risk analysis</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-rose-600">{portfolioRisk.avgInherentScore}</div>
                <div className="text-[10px] text-slate-500">Avg Inherent</div>
              </div>
              <div className="text-slate-300">→</div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{portfolioRisk.avgResidualScore}</div>
                <div className="text-[10px] text-slate-500">Avg Residual</div>
              </div>
              <div className="px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="text-lg font-bold text-emerald-600">{portfolioRisk.avgReduction}%</div>
                <div className="text-[10px] text-emerald-700">Risk Reduction</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Risk Distribution */}
            <div>
              <div className="text-xs font-medium text-slate-700 mb-2">Inherent Risk Distribution</div>
              <div className="space-y-2">
                {(['Critical', 'High', 'Medium', 'Low'] as const).map(tier => {
                  const count = portfolioRisk.riskDistribution[tier];
                  const pct = Math.round((count / portfolioRisk.totalModels) * 100);
                  const colors = {
                    Critical: 'bg-rose-500',
                    High: 'bg-orange-500',
                    Medium: 'bg-amber-500',
                    Low: 'bg-emerald-500',
                  };
                  return (
                    <div key={tier} className="flex items-center gap-2">
                      <div className="w-16 text-[10px] text-slate-600">{tier}</div>
                      <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden">
                        <div className={`h-full ${colors[tier]} rounded`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="w-8 text-[10px] text-slate-600 text-right">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Residual Distribution */}
            <div>
              <div className="text-xs font-medium text-slate-700 mb-2">Residual Risk Distribution</div>
              <div className="space-y-2">
                {(['Critical', 'High', 'Medium', 'Low'] as const).map(tier => {
                  const count = portfolioRisk.residualDistribution[tier];
                  const pct = Math.round((count / portfolioRisk.totalModels) * 100);
                  const colors = {
                    Critical: 'bg-rose-500',
                    High: 'bg-orange-500',
                    Medium: 'bg-amber-500',
                    Low: 'bg-emerald-500',
                  };
                  return (
                    <div key={tier} className="flex items-center gap-2">
                      <div className="w-16 text-[10px] text-slate-600">{tier}</div>
                      <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden">
                        <div className={`h-full ${colors[tier]} rounded`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="w-8 text-[10px] text-slate-600 text-right">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scatter Plot */}
            <div>
              <div className="text-xs font-medium text-slate-700 mb-2">Inherent vs Residual by Model</div>
              <ResponsiveContainer width="100%" height={130}>
                <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" dataKey="inherent" name="Inherent" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 9 }} label={{ value: 'Inherent', position: 'bottom', fontSize: 9, fill: '#94a3b8' }} />
                  <YAxis type="number" dataKey="residual" name="Residual" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 9 }} label={{ value: 'Residual', angle: -90, position: 'left', fontSize: 9, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [`${value}`, '']}
                    labelFormatter={(label) => {
                      const item = portfolioRisk.scatterData.find((d: { inherent: number; modelName: string }) => d.inherent === label);
                      return item?.modelName || '';
                    }}
                  />
                  <Scatter data={portfolioRisk.scatterData} fill="#3b82f6">
                    {portfolioRisk.scatterData.map((entry, index) => {
                      const tierColors = { 'Tier 1': '#ef4444', 'Tier 2': '#f59e0b', 'Tier 3': '#10b981' };
                      return <Cell key={index} fill={tierColors[entry.tier as keyof typeof tierColors] || '#6b7280'} />;
                    })}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-[9px] text-slate-500"><span className="w-2 h-2 rounded-full bg-rose-500" /> Tier 1</span>
                <span className="flex items-center gap-1 text-[9px] text-slate-500"><span className="w-2 h-2 rounded-full bg-amber-500" /> Tier 2</span>
                <span className="flex items-center gap-1 text-[9px] text-slate-500"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Tier 3</span>
              </div>
            </div>
          </div>

          {/* Control Gaps Alert */}
          {portfolioRisk.controlGaps > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-amber-800">Control Coverage Gap</div>
                <div className="text-[11px] text-amber-700">
                  {portfolioRisk.controlGaps} model{portfolioRisk.controlGaps > 1 ? 's have' : ' has'} planned or not-started controls. Implement to reduce residual risk further.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Global MRM Framework Compliance - Consolidated */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Global MRM Framework Compliance</div>
              <div className="text-[11px] text-slate-500">Cross-jurisdictional compliance status across all models</div>
            </div>
            <div className="flex items-center gap-2">
              {globalMrmCompliance.map((fw, i) => (
                <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: `${fw.meta?.color}15` }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: fw.meta?.color }} />
                  <span className="text-[10px] font-semibold" style={{ color: fw.meta?.color }}>{fw.pct}%</span>
                </div>
              ))}
            </div>
          </div>
          {/* Framework Summary Cards */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {globalMrmCompliance.map((fw, i) => (
              <div key={i} className="rounded-lg border p-2" style={{ borderColor: `${fw.meta?.color}40`, backgroundColor: `${fw.meta?.color}08` }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs">
                    {fw.framework.includes('US') ? '🇺🇸' : fw.framework.includes('Canada') ? '🇨🇦' : fw.framework.includes('EU') ? '🇪🇺' : fw.framework.includes('AWS') ? '☁️' : '🌐'}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-900">{fw.meta?.shortCode || fw.framework.split(' ')[0]}</span>
                  <span className={`text-xs font-bold ml-auto ${fw.fail > 0 ? 'text-rose-600' : fw.pct === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {fw.pct}%
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${fw.pct}%`, backgroundColor: fw.meta?.color }} />
                </div>
                <div className="flex justify-between text-[9px] mt-1">
                  <span className="text-emerald-600">✓{fw.pass}</span>
                  {fw.fail > 0 && <span className="text-rose-600">✗{fw.fail}</span>}
                </div>
              </div>
            ))}
          </div>
          {/* Per-Model Breakdown Table */}
          <div className="border border-slate-100 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-slate-600">Model</th>
                  <th className="text-center px-2 py-2 font-medium text-slate-600">🇺🇸 SR 26-2</th>
                  <th className="text-center px-2 py-2 font-medium text-slate-600">🇨🇦 OSFI</th>
                  <th className="text-center px-2 py-2 font-medium text-slate-600">🇺🇸 NIST</th>
                  <th className="text-center px-2 py-2 font-medium text-slate-600">🇪🇺 EU AI</th>
                  <th className="text-center px-2 py-2 font-medium text-slate-600">☁️ AWS RAI</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MODELS.map(m => {
                  const detail = MODEL_DETAILS[m.id];
                  const frameworks = detail?.mrmFrameworks || [];
                  const getCompliance = (name: string) => frameworks.find(f => f.framework.includes(name))?.compliance || 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{m.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                            m.tier === 'Tier 1' ? 'bg-rose-100 text-rose-700' :
                            m.tier === 'Tier 2' ? 'bg-amber-100 text-amber-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>{m.tier}</span>
                        </div>
                      </td>
                      {['SR 26-2', 'OSFI', 'NIST', 'EU AI', 'AWS'].map((fw, idx) => {
                        const pct = getCompliance(fw);
                        return (
                          <td key={idx} className="text-center px-2 py-2">
                            <span className={`text-[10px] font-bold ${pct === 0 ? 'text-slate-300' : pct === 100 ? 'text-emerald-600' : pct >= 80 ? 'text-amber-600' : 'text-rose-600'}`}>
                              {pct > 0 ? `${pct}%` : '—'}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-2 py-2">
                        <button onClick={() => setOpenModel(m.id)} className="text-[10px] text-blue-600 hover:text-blue-700">
                          Details →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fleet eval trend */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-slate-900">Fleet-Wide Eval Trend</div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Safety</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Quality</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Latency</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={aggregateEval}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis domain={[50, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="safety"  stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="quality" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="latency" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            type="text"
            placeholder="Search models, providers, owners..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[240px] py-2 px-3 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400"
          />
          <div className="flex gap-1">
            {(['all', 'Tier 1', 'Tier 2', 'Tier 3'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filter === t
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {t === 'all' ? 'All tiers' : t}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {(['all', 'Production', 'Pending Review'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  statusFilter === s
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {s === 'all' ? 'All statuses' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Registry table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-slate-400 uppercase tracking-wide bg-slate-50/50">
                <th className="text-left py-2.5 px-5 font-medium">Model</th>
                <th className="text-left py-2.5 px-3 font-medium">Owner</th>
                <th className="text-center py-2.5 px-3 font-medium">Tier</th>
                <th className="text-center py-2.5 px-3 font-medium">Risk</th>
                <th className="text-center py-2.5 px-3 font-medium">
                  <div className="flex items-center justify-center gap-1">
                    <span>MRM Frameworks</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-0.5 text-[9px] font-normal normal-case">
                    <span title="SR 26-2 (US Fed)">🇺🇸SR</span>
                    <span title="OSFI E-23 (Canada)">🇨🇦OSFI</span>
                    <span title="NIST AI RMF">🇺🇸NIST</span>
                    <span title="EU AI Act">🇪🇺EU</span>
                  </div>
                </th>
                <th className="text-right py-2.5 px-3 font-medium">Eval</th>
                <th className="text-center py-2.5 px-3 font-medium">Revalidation</th>
                <th className="text-left py-2.5 px-5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const detail = MODEL_DETAILS[m.id];
                return (
                  <tr key={m.id} onClick={() => setOpenModel(m.id)} className="border-t border-slate-100 hover:bg-slate-50/60 cursor-pointer transition-colors">
                    <td className="py-2.5 px-5">
                      <div className="font-semibold text-slate-900">{m.name}</div>
                      <div className="text-[11px] text-slate-400">{m.provider}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{m.owner}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ${tierBg[m.tier]}`}>{m.tier}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {detail?.riskProfile ? (
                        <div className="flex items-center justify-center gap-1">
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                            detail.riskProfile.inherentRisk === 'Critical' ? 'bg-rose-100 text-rose-700' :
                            detail.riskProfile.inherentRisk === 'High' ? 'bg-orange-100 text-orange-700' :
                            detail.riskProfile.inherentRisk === 'Medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {detail.riskProfile.inherentRisk.charAt(0)}
                          </span>
                          <span className="text-slate-300 text-[10px]">→</span>
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                            detail.riskProfile.residualRisk === 'Critical' ? 'bg-rose-100 text-rose-700' :
                            detail.riskProfile.residualRisk === 'High' ? 'bg-orange-100 text-orange-700' :
                            detail.riskProfile.residualRisk === 'Medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {detail.riskProfile.residualRisk.charAt(0)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {detail?.mrmCompliance ? (
                        <div className="flex items-center justify-center gap-1">
                          {detail.mrmCompliance.map((fw, i) => {
                            const pass = fw.controls.filter(c => c.status === 'pass').length;
                            const total = fw.controls.filter(c => c.status !== 'not-applicable').length;
                            const hasGaps = fw.controls.some(c => c.status === 'fail');
                            const allPass = pass === total;
                            const pct = total > 0 ? Math.round((pass / total) * 100) : 0;
                            const meta = MRM_FRAMEWORKS_META.find(m => m.id === fw.framework);
                            return (
                              <div
                                key={i}
                                className={`flex flex-col items-center px-1.5 py-1 rounded ${hasGaps ? 'bg-rose-50' : allPass ? 'bg-emerald-50' : 'bg-amber-50'}`}
                                title={`${fw.framework}: ${pass}/${total} controls (${pct}%)`}
                              >
                                <span className="text-[9px]">{meta?.shortCode || fw.framework.split(' ')[0]}</span>
                                <span className={`text-[9px] font-bold ${hasGaps ? 'text-rose-600' : allPass ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  {pct}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`font-semibold tabular-nums ${m.evalScore >= 85 ? 'text-emerald-600' : m.evalScore >= 70 ? 'text-amber-600' : 'text-rose-600'}`}>{m.evalScore}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {detail?.revalidation ? (
                        <div className="flex flex-col items-center">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${revalidationBg[detail.revalidation.status]}`}>
                            {detail.revalidation.status === 'current' ? '✓ Current' :
                             detail.revalidation.status === 'due-soon' ? 'Due Soon' : 'Overdue'}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">{detail.revalidation.nextDue}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">{m.lastValidated}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${statusBg[m.status]}`}>{m.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* AVA Platform Integration - Real Data */}
        {!avaLoading && (useCases.length > 0 || deployments.length > 0 || guardrails.length > 0) && (
          <div className="bg-gradient-to-r from-indigo-50 via-violet-50 to-purple-50 rounded-xl border border-indigo-200/60 p-5 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <div className="text-sm font-semibold text-slate-900">AVA Platform Integration</div>
                <span className="text-[10px] text-slate-500">Real-time data from Plan, Build, Secure modules</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {/* Use Cases from Plan */}
              <div className="bg-white/80 rounded-lg p-3 border border-indigo-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs">📋</span>
                  <span className="text-[10px] font-semibold text-indigo-600 uppercase">Plan: Use Cases</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{useCases.length}</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {useCases.filter(uc => uc.status === 'Production').length} in production,{' '}
                  {useCases.filter(uc => uc.status === 'Pilot').length} in pilot
                </div>
                <div className="mt-2 space-y-1 max-h-20 overflow-y-auto">
                  {useCases.slice(0, 3).map(uc => (
                    <div key={uc.use_case_id} className="text-[10px] text-slate-600 truncate" title={uc.name}>
                      • {uc.name}
                    </div>
                  ))}
                  {useCases.length > 3 && <div className="text-[10px] text-slate-400">+{useCases.length - 3} more</div>}
                </div>
              </div>

              {/* Deployments from Build */}
              <div className="bg-white/80 rounded-lg p-3 border border-emerald-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs">🔧</span>
                  <span className="text-[10px] font-semibold text-emerald-600 uppercase">Build: Deployments</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{deployments.length}</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {deployments.filter(d => d.status === 'deployed' || d.status === 'delivered').length} active,{' '}
                  {deployments.filter(d => d.status === 'pending' || d.status === 'deploying').length} pending
                </div>
                <div className="mt-2 space-y-1 max-h-20 overflow-y-auto">
                  {deployments.slice(0, 3).map(d => (
                    <div key={d.deployment_id} className="text-[10px] text-slate-600 truncate" title={d.deployment_name}>
                      • {d.deployment_name}
                    </div>
                  ))}
                  {deployments.length > 3 && <div className="text-[10px] text-slate-400">+{deployments.length - 3} more</div>}
                </div>
              </div>

              {/* Guardrails from Secure */}
              <div className="bg-white/80 rounded-lg p-3 border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs">🛡️</span>
                  <span className="text-[10px] font-semibold text-amber-600 uppercase">Secure: Guardrails</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{guardrails.length}</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {guardrails.filter(g => g.status === 'active').length} active,{' '}
                  {guardrails.filter(g => g.status === 'draft').length} draft
                </div>
                <div className="mt-2 space-y-1 max-h-20 overflow-y-auto">
                  {guardrails.slice(0, 3).map(g => (
                    <div key={g.template_id} className="text-[10px] text-slate-600 truncate" title={g.name}>
                      • {g.name} {g.metrics && <span className="text-emerald-600">({g.metrics.total_invocations} inv)</span>}
                    </div>
                  ))}
                  {guardrails.length > 3 && <div className="text-[10px] text-slate-400">+{guardrails.length - 3} more</div>}
                </div>
              </div>

              {/* Frontier Agents */}
              <div className="bg-white/80 rounded-lg p-3 border border-violet-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs">🤖</span>
                  <span className="text-[10px] font-semibold text-violet-600 uppercase">Build: Agents</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{frontierAgents.length}</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Frontier agent catalog
                </div>
                <div className="mt-2 space-y-1 max-h-20 overflow-y-auto">
                  {frontierAgents.slice(0, 3).map(a => (
                    <div key={a.id} className="text-[10px] text-slate-600 truncate" title={a.name}>
                      • {a.name}
                    </div>
                  ))}
                  {frontierAgents.length > 3 && <div className="text-[10px] text-slate-400">+{frontierAgents.length - 3} more</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Approval Pipeline (pending models) */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm mb-6">
          <div className="text-sm font-semibold text-slate-900 mb-3">Approval Pipeline — Pending Models</div>
          <div className="space-y-4">
            {MODELS.filter(m => {
              const detail = MODEL_DETAILS[m.id];
              return detail?.approvalChain.some(a => a.status === 'pending');
            }).map(m => {
              const detail = MODEL_DETAILS[m.id];
              return (
                <div key={m.id} className="border border-slate-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{m.name}</div>
                      <div className="text-[11px] text-slate-500">{m.provider} · {m.owner}</div>
                    </div>
                    <button onClick={() => setOpenModel(m.id)} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                      Open detail →
                    </button>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {detail.approvalChain.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 flex-shrink-0">
                        <div className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium ${
                          a.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          a.status === 'pending'  ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                    'bg-slate-50 text-slate-500 border border-slate-200'
                        }`}>
                          <div className="font-semibold">{a.step}</div>
                          <div className="text-[10px] opacity-80 mt-0.5">{a.approver}</div>
                        </div>
                        {i < detail.approvalChain.length - 1 && (
                          <svg className="w-3 h-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <ModelDrawer modelId={openModel} onClose={() => setOpenModel(null)} />
      </div>
    </div>
  );
}
