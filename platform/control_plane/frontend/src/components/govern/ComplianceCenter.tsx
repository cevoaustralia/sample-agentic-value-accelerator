/**
 * ComplianceCenter — Interactive compliance framework management
 *
 * Features:
 * - Interactive checklists with checkboxes
 * - Evidence attachment and links
 * - Notes per control
 * - Progress tracking with visual indicators
 * - Data Sensitivity framework (PII/PHI/PCI)
 * - Export/audit trail
 */

import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  COMPLIANCE_CENTER_FRAMEWORKS,
  type ControlStatus,
  type ComplianceFramework,
} from './mockData';
import { ComplianceCenterGuide } from './ModuleGuide';
import { MockDataBadge } from './DataSourceIndicator';

// ─────────────────────────── Helpers ───────────────────────────

const STATUS_CONFIG: Record<ControlStatus, { label: string; color: string; bgColor: string; icon: string }> = {
  'pass': { label: 'Compliant', color: '#10b981', bgColor: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: '✓' },
  'in-progress': { label: 'In Progress', color: '#f59e0b', bgColor: 'bg-amber-50 border-amber-200 text-amber-700', icon: '◐' },
  'fail': { label: 'Gap', color: '#ef4444', bgColor: 'bg-rose-50 border-rose-200 text-rose-700', icon: '✗' },
  'not-started': { label: 'N/A', color: '#6b7280', bgColor: 'bg-slate-100 border-slate-200 text-slate-500', icon: '—' },
};

// ─────────────────────────── Export Utilities ───────────────────────────

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportComplianceCSV(framework: ComplianceFramework, controlStates: Record<string, { checked: boolean; notes: string }>) {
  const timestamp = new Date().toISOString().split('T')[0];
  const headers = ['Control ID', 'Section', 'Control Label', 'Status', 'Owner', 'Due Date', 'Last Reviewed', 'Evidence', 'User Checked', 'User Notes'];

  const rows: string[][] = [];
  framework.categories.forEach(cat => {
    cat.controls.forEach(ctrl => {
      const state = controlStates[ctrl.id] || { checked: false, notes: '' };
      rows.push([
        ctrl.id,
        ctrl.section || '',
        ctrl.label,
        STATUS_CONFIG[ctrl.status].label,
        ctrl.owner || '',
        ctrl.dueDate || '',
        ctrl.lastReviewed || '',
        ctrl.evidence || '',
        state.checked ? 'Yes' : 'No',
        state.notes,
      ]);
    });
  });

  const escape = (val: string) => `"${String(val).replace(/"/g, '""')}"`;
  const csvContent = [
    `# ${framework.name} Compliance Export`,
    `# Generated: ${timestamp}`,
    '',
    headers.map(escape).join(','),
    ...rows.map(row => row.map(escape).join(',')),
  ].join('\n');

  downloadFile(csvContent, `${framework.shortName}_Compliance_${timestamp}.csv`, 'text/csv');
}

function generateComplianceReport(framework: ComplianceFramework, controlStates: Record<string, { checked: boolean; notes: string }>) {
  const timestamp = new Date().toISOString().split('T')[0];
  const allControls = framework.categories.flatMap(c => c.controls);
  const stats = {
    total: allControls.length,
    pass: allControls.filter(c => c.status === 'pass').length,
    inProgress: allControls.filter(c => c.status === 'in-progress').length,
    fail: allControls.filter(c => c.status === 'fail').length,
    notStarted: allControls.filter(c => c.status === 'not-started').length,
  };
  const compliancePct = Math.round((stats.pass / (stats.total - stats.notStarted)) * 100) || 0;

  const reportData = {
    reportTitle: `${framework.name} Compliance Report`,
    framework: framework.shortName,
    generatedDate: timestamp,
    lastAudit: framework.lastAudit,
    nextAudit: framework.nextAudit,
    summary: {
      compliancePercentage: compliancePct,
      ...stats,
    },
    categories: framework.categories.map(cat => ({
      name: cat.name,
      controls: cat.controls.map(ctrl => {
        const state = controlStates[ctrl.id] || { checked: false, notes: '' };
        return {
          id: ctrl.id,
          label: ctrl.label,
          status: ctrl.status,
          owner: ctrl.owner,
          dueDate: ctrl.dueDate,
          evidence: ctrl.evidence,
          userChecked: state.checked,
          userNotes: state.notes,
        };
      }),
    })),
    gaps: allControls.filter(c => c.status === 'fail').map(c => ({
      id: c.id,
      label: c.label,
      owner: c.owner,
      dueDate: c.dueDate,
    })),
  };

  downloadFile(JSON.stringify(reportData, null, 2), `${framework.shortName}_Compliance_Report_${timestamp}.json`, 'application/json');
}

// ─────────────────────────── Component ───────────────────────────

export default function ComplianceCenter() {
  const [selectedFramework, setSelectedFramework] = useState<string>(COMPLIANCE_CENTER_FRAMEWORKS[0].id);
  const [controlStates, setControlStates] = useState<Record<string, { checked: boolean; notes: string }>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<ControlStatus | 'all'>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const framework = COMPLIANCE_CENTER_FRAMEWORKS.find(f => f.id === selectedFramework)!;

  const stats = useMemo(() => {
    const allControls = framework.categories.flatMap(c => c.controls);
    return {
      total: allControls.length,
      pass: allControls.filter(c => c.status === 'pass').length,
      inProgress: allControls.filter(c => c.status === 'in-progress').length,
      fail: allControls.filter(c => c.status === 'fail').length,
      notStarted: allControls.filter(c => c.status === 'not-started').length,
    };
  }, [framework]);

  const pct = Math.round((stats.pass / (stats.total - stats.notStarted)) * 100) || 0;

  const toggleCategory = (catName: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catName)) next.delete(catName);
      else next.add(catName);
      return next;
    });
  };

  const toggleControl = (controlId: string) => {
    setControlStates(prev => ({
      ...prev,
      [controlId]: { ...prev[controlId], checked: !prev[controlId]?.checked },
    }));
  };

  const updateNotes = (controlId: string, notes: string) => {
    setControlStates(prev => ({
      ...prev,
      [controlId]: { ...prev[controlId], notes },
    }));
  };

  const filteredCategories = useMemo(() => {
    if (filterStatus === 'all') return framework.categories;
    return framework.categories.map(cat => ({
      ...cat,
      controls: cat.controls.filter(c => c.status === filterStatus),
    })).filter(cat => cat.controls.length > 0);
  }, [framework, filterStatus]);

  return (
    <div className="min-h-[calc(100vh-4rem)] relative">
      <div className="relative max-w-7xl mx-auto px-6 py-10">
        <Link to="/govern" className="text-sm text-slate-400 hover:text-slate-600 transition-colors font-medium">
          ← Govern
        </Link>

        <div className="flex items-end justify-between mt-3 mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Compliance</h1>
            <p className="text-slate-500 mt-1 max-w-2xl">
              Interactive compliance checklists for SR 26-2, NIST AI RMF, EU AI Act, and data sensitivity requirements.
            </p>
            <div className="mt-2">
              <MockDataBadge integration="AWS Audit Manager + custom compliance DB" />
            </div>
          </div>
          <Link
            to="/govern/risk"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            View Risk Controls →
          </Link>
        </div>

        <ComplianceCenterGuide />

        <div className="space-y-6">
          {/* Framework Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {COMPLIANCE_CENTER_FRAMEWORKS.map(fw => {
              const fwControls = fw.categories.flatMap(c => c.controls);
              const fwPass = fwControls.filter(c => c.status === 'pass').length;
              const fwTotal = fwControls.filter(c => c.status !== 'not-started').length;
              const fwPct = Math.round((fwPass / fwTotal) * 100) || 0;
              return (
                <button
                  key={fw.id}
                  onClick={() => setSelectedFramework(fw.id)}
                  className={`flex-shrink-0 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                    selectedFramework === fw.id
                      ? 'border-current shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white/60'
                  }`}
                  style={{ borderColor: selectedFramework === fw.id ? fw.color : undefined }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: fw.color }}
                    />
                    <span className="text-sm font-semibold text-slate-900">{fw.shortName}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{fwPass}/{fwTotal} compliant</div>
                  <div className="w-full h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${fwPct}%`, backgroundColor: fw.color }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Framework Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: framework.color }}
                  />
                  <h2 className="text-lg font-semibold text-slate-900">{framework.name}</h2>
                </div>
                <p className="text-sm text-slate-500 mt-1 max-w-2xl">{framework.description}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold" style={{ color: framework.color }}>{pct}%</div>
                <div className="text-xs text-slate-500">compliant</div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-5 gap-3 mt-4">
              <button
                onClick={() => setFilterStatus('all')}
                className={`p-3 rounded-lg border transition-all ${filterStatus === 'all' ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
              >
                <div className="text-xl font-bold text-slate-900">{stats.total}</div>
                <div className="text-[10px] text-slate-500 uppercase">Total</div>
              </button>
              {(['pass', 'in-progress', 'fail', 'not-started'] as ControlStatus[]).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
                  className={`p-3 rounded-lg border transition-all ${filterStatus === status ? 'ring-2' : 'hover:bg-opacity-80'} ${STATUS_CONFIG[status].bgColor}`}
                  style={{ ['--tw-ring-color' as string]: STATUS_CONFIG[status].color }}
                >
                  <div className="text-xl font-bold">{stats[status === 'in-progress' ? 'inProgress' : status === 'not-started' ? 'notStarted' : status]}</div>
                  <div className="text-[10px] uppercase">{STATUS_CONFIG[status].label}</div>
                </button>
              ))}
            </div>

            {framework.lastAudit && (
              <div className="flex gap-6 mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500">
                <div>Last audit: <span className="font-medium text-slate-700">{framework.lastAudit}</span></div>
                {framework.nextAudit && <div>Next audit: <span className="font-medium text-slate-700">{framework.nextAudit}</span></div>}
              </div>
            )}
          </div>

          {/* Controls by Category */}
          <div className="space-y-4">
            {filteredCategories.map(category => {
              const catStats = {
                pass: category.controls.filter(c => c.status === 'pass').length,
                total: category.controls.filter(c => c.status !== 'not-started').length,
              };
              const isExpanded = expandedCategories.has(category.name) || expandedCategories.size === 0;

              return (
                <div key={category.name} className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category.name)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-sm font-semibold text-slate-900">{category.name}</span>
                      <span className="text-xs text-slate-400">({category.controls.length} controls)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">{catStats.pass}/{catStats.total}</span>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${catStats.total ? (catStats.pass / catStats.total) * 100 : 0}%`,
                            backgroundColor: framework.color,
                          }}
                        />
                      </div>
                    </div>
                  </button>

                  {/* Controls List */}
                  {isExpanded && (
                    <div className="border-t border-slate-100">
                      {category.controls.map(control => {
                        const state = controlStates[control.id] || { checked: false, notes: '' };
                        const statusConfig = STATUS_CONFIG[control.status];

                        return (
                          <div key={control.id} className="border-b border-slate-100 last:border-b-0">
                            <div className="flex items-start gap-3 p-4">
                              {/* Checkbox */}
                              <button
                                onClick={() => toggleControl(control.id)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                                  state.checked
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-slate-300 hover:border-slate-400'
                                }`}
                              >
                                {state.checked && <span className="text-xs">✓</span>}
                              </button>

                              {/* Control Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{control.id}</span>
                                      {control.section && (
                                        <span className="text-[10px] text-slate-400">{control.section}</span>
                                      )}
                                    </div>
                                    <div className="text-sm text-slate-900 mt-1">{control.label}</div>
                                  </div>
                                  <span className={`text-[10px] font-semibold px-2 py-1 rounded border flex-shrink-0 ${statusConfig.bgColor}`}>
                                    {statusConfig.icon} {statusConfig.label}
                                  </span>
                                </div>

                                {/* Metadata Row */}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                                  {control.owner && (
                                    <span>Owner: <span className="text-slate-700">{control.owner}</span></span>
                                  )}
                                  {control.lastReviewed && (
                                    <span>Reviewed: <span className="text-slate-700">{control.lastReviewed}</span></span>
                                  )}
                                  {control.dueDate && (
                                    <span className="text-amber-600">Due: {control.dueDate}</span>
                                  )}
                                </div>

                                {/* Evidence */}
                                {control.evidence && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <span className="text-[10px] text-slate-400 uppercase">Evidence:</span>
                                    {control.evidenceLink ? (
                                      <a href={control.evidenceLink} className="text-xs text-blue-600 hover:underline">{control.evidence}</a>
                                    ) : (
                                      <span className="text-xs text-slate-600">{control.evidence}</span>
                                    )}
                                  </div>
                                )}

                                {/* Notes Input */}
                                <div className="mt-3">
                                  <textarea
                                    placeholder="Add notes..."
                                    value={state.notes}
                                    onChange={(e) => updateNotes(control.id, e.target.value)}
                                    className="w-full text-xs p-2 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={1}
                                    onFocus={(e) => e.target.rows = 3}
                                    onBlur={(e) => { if (!e.target.value) e.target.rows = 1; }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Export Actions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">Export Compliance Status</div>
                <div className="text-xs text-slate-500">Generate audit-ready documentation for {framework.shortName}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    exportComplianceCSV(framework, controlStates);
                    showToast(`${framework.shortName} exported to CSV`, 'success');
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => {
                    generateComplianceReport(framework, controlStates);
                    showToast(`${framework.shortName} report generated`, 'success');
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-sm font-medium z-50 transition-all ${
          toast.type === 'success' ? 'bg-emerald-500 text-white' :
          toast.type === 'error' ? 'bg-rose-500 text-white' :
          'bg-slate-800 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
