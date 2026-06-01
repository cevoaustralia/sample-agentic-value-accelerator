/**
 * RiskRegister — Central inventory of all identified risks
 */

import { useState, useMemo } from 'react';
import {
  RISKS, CONTROLS, RISK_CATEGORIES, getRiskClass,
  LIKELIHOOD_LABELS, SEVERITY_LABELS,
  type RiskCategory, type RiskStatus,
} from './riskData';

export default function RiskRegister() {
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<RiskCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<RiskStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const filteredRisks = useMemo(() => {
    return RISKS.filter(r => {
      const categoryOk = categoryFilter === 'all' || r.category === categoryFilter;
      const statusOk = statusFilter === 'all' || r.status === statusFilter;
      const searchOk = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
      return categoryOk && statusOk && searchOk;
    });
  }, [categoryFilter, statusFilter, search]);

  const selectedRiskData = selectedRisk ? RISKS.find(r => r.id === selectedRisk) : null;
  const selectedControls = selectedRiskData ? CONTROLS.filter(c => selectedRiskData.controlIds.includes(c.id)) : [];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search risks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as RiskCategory | 'all')}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {RISK_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RiskStatus | 'all')}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="mitigated">Mitigated</option>
              <option value="accepted">Accepted</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            + Add Risk
          </button>
        </div>
      </div>

      {/* Risk Matrix Quick View */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Risk Matrix (Residual)</h3>
        <div className="flex gap-6">
          {/* Matrix Grid */}
          <div className="flex-shrink-0">
            <div className="flex">
              <div className="w-8" />
              {[1, 2, 3, 4, 5].map(s => (
                <div key={s} className="w-12 text-center text-[9px] text-slate-400 pb-1">{s}</div>
              ))}
            </div>
            {[5, 4, 3, 2, 1].map(l => (
              <div key={l} className="flex items-center">
                <div className="w-8 text-right text-[9px] text-slate-400 pr-2">{l}</div>
                {[1, 2, 3, 4, 5].map(s => {
                  const score = l * s;
                  const riskClass = getRiskClass(score);
                  const risksInCell = filteredRisks.filter(r => r.residualLikelihood === l && r.residualSeverity === s);
                  return (
                    <div
                      key={s}
                      className={`w-12 h-10 border border-white flex items-center justify-center text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity ${
                        score >= 20 ? 'bg-red-200 text-red-800' :
                        score >= 15 ? 'bg-orange-200 text-orange-800' :
                        score >= 10 ? 'bg-amber-200 text-amber-800' :
                        score >= 5 ? 'bg-emerald-200 text-emerald-800' :
                        'bg-slate-200 text-slate-600'
                      }`}
                      title={`L${l} × S${s} = ${score} (${riskClass.label})`}
                    >
                      {risksInCell.length > 0 ? risksInCell.length : ''}
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="flex mt-1">
              <div className="w-8" />
              <div className="flex-1 text-center text-[9px] text-slate-400">Severity →</div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1">
            <div className="text-xs text-slate-500 mb-2">Likelihood ↑</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Critical (20-25)', color: 'bg-red-200' },
                { label: 'High (15-19)', color: 'bg-orange-200' },
                { label: 'Medium (10-14)', color: 'bg-amber-200' },
                { label: 'Low (5-9)', color: 'bg-emerald-200' },
                { label: 'Very Low (1-4)', color: 'bg-slate-200' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${item.color}`} />
                  <span className="text-slate-600">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-[10px] text-slate-400">
              Click a cell to filter risks. {filteredRisks.length} risks shown.
            </div>
          </div>
        </div>
      </div>

      {/* Risk Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-slate-400 uppercase tracking-wide bg-slate-50/50">
                <th className="text-left py-2.5 px-4 font-medium">ID</th>
                <th className="text-left py-2.5 px-3 font-medium">Risk</th>
                <th className="text-left py-2.5 px-3 font-medium">Category</th>
                <th className="text-center py-2.5 px-3 font-medium">Inherent</th>
                <th className="text-center py-2.5 px-3 font-medium">Residual</th>
                <th className="text-center py-2.5 px-3 font-medium">Controls</th>
                <th className="text-center py-2.5 px-3 font-medium">Trend</th>
                <th className="text-left py-2.5 px-3 font-medium">Status</th>
                <th className="text-left py-2.5 px-3 font-medium">Owner</th>
                <th className="text-left py-2.5 px-4 font-medium">Next Review</th>
              </tr>
            </thead>
            <tbody>
              {filteredRisks.map(risk => {
                const cat = RISK_CATEGORIES.find(c => c.id === risk.category);
                const inherentClass = getRiskClass(risk.inherentScore);
                const residualClass = getRiskClass(risk.residualScore);
                return (
                  <tr
                    key={risk.id}
                    onClick={() => setSelectedRisk(selectedRisk === risk.id ? null : risk.id)}
                    className={`border-t border-slate-100 cursor-pointer transition-colors ${
                      selectedRisk === risk.id ? 'bg-blue-50' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <td className="py-2.5 px-4 font-mono text-xs text-slate-500">{risk.id}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-900 max-w-[250px] truncate" title={risk.title}>
                        {risk.title}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 text-xs" style={{ color: cat?.color }}>
                        <span>{cat?.icon}</span>
                        <span>{cat?.name}</span>
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
                    <td className="py-2.5 px-3 text-center text-slate-600">{risk.controlIds.length}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-sm ${
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
                    <td className="py-2.5 px-3 text-slate-600 text-xs">{risk.owner}</td>
                    <td className="py-2.5 px-4 text-slate-500 text-xs">{risk.nextReview}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Detail Panel */}
      {selectedRiskData && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-slate-400">{selectedRiskData.id}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                  selectedRiskData.status === 'open' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                  selectedRiskData.status === 'mitigated' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                  selectedRiskData.status === 'accepted' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                  'bg-slate-100 border-slate-200 text-slate-600'
                }`}>
                  {selectedRiskData.status}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mt-1">{selectedRiskData.title}</h3>
              <p className="text-sm text-slate-600 mt-2 max-w-3xl">{selectedRiskData.description}</p>
            </div>
            <button onClick={() => setSelectedRisk(null)} className="text-slate-400 hover:text-slate-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Risk Scores */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 border border-slate-200 rounded-lg">
              <div className="text-xs text-slate-500 uppercase mb-2">Inherent Risk</div>
              <div className="flex items-center gap-4">
                <div className={`text-3xl font-bold ${getRiskClass(selectedRiskData.inherentScore).bgColor} px-3 py-1 rounded`}>
                  {selectedRiskData.inherentScore}
                </div>
                <div className="text-xs text-slate-600">
                  <div>Likelihood: {selectedRiskData.inherentLikelihood} ({LIKELIHOOD_LABELS[selectedRiskData.inherentLikelihood]})</div>
                  <div>Severity: {selectedRiskData.inherentSeverity} ({SEVERITY_LABELS[selectedRiskData.inherentSeverity]})</div>
                </div>
              </div>
            </div>
            <div className="p-4 border border-slate-200 rounded-lg">
              <div className="text-xs text-slate-500 uppercase mb-2">Residual Risk (After Controls)</div>
              <div className="flex items-center gap-4">
                <div className={`text-3xl font-bold ${getRiskClass(selectedRiskData.residualScore).bgColor} px-3 py-1 rounded`}>
                  {selectedRiskData.residualScore}
                </div>
                <div className="text-xs text-slate-600">
                  <div>Likelihood: {selectedRiskData.residualLikelihood} ({LIKELIHOOD_LABELS[selectedRiskData.residualLikelihood]})</div>
                  <div>Severity: {selectedRiskData.residualSeverity} ({SEVERITY_LABELS[selectedRiskData.residualSeverity]})</div>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-4 gap-4 mb-6 text-sm">
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Owner</div>
              <div className="font-medium text-slate-900">{selectedRiskData.owner}</div>
              <div className="text-xs text-slate-500">{selectedRiskData.ownerRole}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Identified</div>
              <div className="text-slate-700">{selectedRiskData.dateIdentified}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Last Reviewed</div>
              <div className="text-slate-700">{selectedRiskData.lastReviewed}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Next Review</div>
              <div className="text-slate-700">{selectedRiskData.nextReview}</div>
            </div>
          </div>

          {/* Affected Assets */}
          <div className="mb-6">
            <div className="text-sm font-semibold text-slate-900 mb-2">Affected Assets</div>
            <div className="flex flex-wrap gap-2">
              {selectedRiskData.affectedAssets.map(asset => (
                <span key={asset} className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded">
                  {asset}
                </span>
              ))}
            </div>
          </div>

          {/* Mitigating Controls */}
          <div>
            <div className="text-sm font-semibold text-slate-900 mb-3">Mitigating Controls ({selectedControls.length})</div>
            <div className="space-y-2">
              {selectedControls.map(control => (
                <div key={control.id} className="p-3 border border-slate-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400">{control.id}</span>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                          control.type === 'preventive' ? 'bg-blue-100 text-blue-700' :
                          control.type === 'detective' ? 'bg-purple-100 text-purple-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {control.type}
                        </span>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                          control.status === 'implemented' ? 'bg-emerald-100 text-emerald-700' :
                          control.status === 'partial' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {control.status}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-slate-900 mt-1">{control.name}</div>
                      <div className="text-xs text-slate-500 mt-1">{control.description}</div>
                    </div>
                    <div className="text-right ml-4">
                      <div className={`text-xs font-medium ${
                        control.effectiveness === 'high' ? 'text-emerald-600' :
                        control.effectiveness === 'medium' ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        {control.effectiveness} effectiveness
                      </div>
                      {control.evidence && (
                        <div className="text-[10px] text-slate-400 mt-1">{control.evidence}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {selectedRiskData.notes && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-xs font-semibold text-amber-700 mb-1">Notes</div>
              <div className="text-sm text-amber-800">{selectedRiskData.notes}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
