/**
 * RiskControls — Control library with risk mappings and framework associations
 */

import { useState } from 'react';
import { CONTROLS, RISKS, type Control } from './riskData';

export default function RiskControls() {
  const [selectedControl, setSelectedControl] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterFramework, setFilterFramework] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const controlTypes = ['all', ...new Set(CONTROLS.map(c => c.type))];
  const frameworks = ['all', ...new Set(CONTROLS.flatMap(c => c.frameworks))];

  const filteredControls = CONTROLS.filter(control => {
    const matchesType = filterType === 'all' || control.type === filterType;
    const matchesFramework = filterFramework === 'all' || control.frameworks.includes(filterFramework);
    const matchesSearch = searchTerm === '' ||
      control.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      control.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesFramework && matchesSearch;
  });

  const selectedData = selectedControl ? CONTROLS.find(c => c.id === selectedControl) : null;

  const getEffectivenessColor = (eff: Control['effectiveness']) => {
    if (eff === 'high') return 'text-emerald-600 bg-emerald-50';
    if (eff === 'medium') return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getEffectivenessPercent = (eff: Control['effectiveness']) => {
    if (eff === 'high') return 90;
    if (eff === 'medium') return 60;
    return 30;
  };

  const getTypeIcon = (type: Control['type']) => {
    switch (type) {
      case 'preventive':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case 'detective':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
      case 'corrective':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Control Library</h3>
          <p className="text-xs text-slate-500 mt-1">Preventive, detective, and corrective controls mapped to risks</p>
        </div>
        <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
          + Add Control
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search controls..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {controlTypes.map(type => (
            <option key={type} value={type}>{type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}</option>
          ))}
        </select>
        <select
          value={filterFramework}
          onChange={(e) => setFilterFramework(e.target.value)}
          className="px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {frameworks.map(fw => (
            <option key={fw} value={fw}>{fw === 'all' ? 'All Frameworks' : fw}</option>
          ))}
        </select>
      </div>

      {/* Control Type Summary */}
      <div className="grid grid-cols-3 gap-4">
        {(['preventive', 'detective', 'corrective'] as const).map(type => {
          const typeControls = CONTROLS.filter(c => c.type === type);
          const highEff = typeControls.filter(c => c.effectiveness === 'high').length;
          return (
            <div key={type} className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${
                  type === 'preventive' ? 'bg-blue-100 text-blue-600' :
                  type === 'detective' ? 'bg-purple-100 text-purple-600' :
                  'bg-amber-100 text-amber-600'
                }`}>
                  {getTypeIcon(type)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 capitalize">{type}</div>
                  <div className="text-xs text-slate-500">{typeControls.length} controls</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">High Effectiveness</span>
                <span className="text-sm font-semibold text-emerald-600">
                  {highEff}/{typeControls.length}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredControls.map(control => {
          const mitigatedRisks = RISKS.filter(r => control.riskIds.includes(r.id));
          return (
            <div
              key={control.id}
              onClick={() => setSelectedControl(selectedControl === control.id ? null : control.id)}
              className={`bg-white/80 backdrop-blur-sm rounded-xl border p-4 shadow-sm cursor-pointer transition-all ${
                selectedControl === control.id
                  ? 'border-blue-300 ring-2 ring-blue-500'
                  : 'border-slate-200/60 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-slate-400">{control.id}</span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded capitalize ${
                    control.type === 'preventive' ? 'bg-blue-100 text-blue-700' :
                    control.type === 'detective' ? 'bg-purple-100 text-purple-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {control.type}
                  </span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${getEffectivenessColor(control.effectiveness)}`}>
                  {control.effectiveness}
                </span>
              </div>

              <h4 className="text-sm font-semibold text-slate-900 mb-1">{control.name}</h4>
              <p className="text-xs text-slate-600 mb-3 line-clamp-2">{control.description}</p>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">Mitigates:</span>
                  <span className="font-medium text-slate-700">{mitigatedRisks.length} risks</span>
                </div>
                <div className="flex gap-1">
                  {control.frameworks.slice(0, 2).map(fw => (
                    <span key={fw} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px]">
                      {fw}
                    </span>
                  ))}
                  {control.frameworks.length > 2 && (
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px]">
                      +{control.frameworks.length - 2}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Control Detail Panel */}
      {selectedData && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs text-slate-400">{selectedData.id}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                  selectedData.type === 'preventive' ? 'bg-blue-100 text-blue-700' :
                  selectedData.type === 'detective' ? 'bg-purple-100 text-purple-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {selectedData.type}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{selectedData.name}</h3>
            </div>
            <button onClick={() => setSelectedControl(null)} className="text-slate-400 hover:text-slate-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-slate-600 mb-4">{selectedData.description}</p>

          {/* Effectiveness */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-900">Control Effectiveness</span>
              <span className={`text-sm font-semibold px-2 py-0.5 rounded capitalize ${getEffectivenessColor(selectedData.effectiveness)}`}>
                {selectedData.effectiveness}
              </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  selectedData.effectiveness === 'high' ? 'bg-emerald-500' :
                  selectedData.effectiveness === 'medium' ? 'bg-amber-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${getEffectivenessPercent(selectedData.effectiveness)}%` }}
              />
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-[10px] text-slate-400 uppercase">Owner</div>
              <div className="text-sm font-medium text-slate-900">{selectedData.owner}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-[10px] text-slate-400 uppercase">Status</div>
              <div className="text-sm font-medium text-slate-900 capitalize">{selectedData.status.replace('-', ' ')}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-[10px] text-slate-400 uppercase">Last Tested</div>
              <div className="text-sm font-medium text-slate-900">{selectedData.lastTested || 'Not tested'}</div>
            </div>
          </div>

          {/* Frameworks */}
          <div className="mb-6">
            <div className="text-sm font-semibold text-slate-900 mb-2">Regulatory Frameworks</div>
            <div className="flex flex-wrap gap-2">
              {selectedData.frameworks.length > 0 ? selectedData.frameworks.map(fw => (
                <span key={fw} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                  {fw}
                </span>
              )) : (
                <span className="text-xs text-slate-500">No frameworks mapped</span>
              )}
            </div>
          </div>

          {/* Mitigated Risks */}
          <div>
            <div className="text-sm font-semibold text-slate-900 mb-3">Risks Mitigated by This Control</div>
            <div className="space-y-2">
              {RISKS.filter(r => selectedData.riskIds.includes(r.id)).map(risk => (
                <div key={risk.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 mr-2">{risk.id}</span>
                    <span className="text-sm text-slate-900">{risk.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Residual:</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      risk.residualScore >= 15 ? 'bg-red-100 text-red-700' :
                      risk.residualScore >= 10 ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {risk.residualScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Control Types Legend */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Control Types</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 border border-blue-200 bg-blue-50/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-blue-100 text-blue-600 rounded">
                {getTypeIcon('preventive')}
              </div>
              <span className="text-sm font-semibold text-blue-700">Preventive</span>
            </div>
            <p className="text-xs text-slate-600">Stop risks from materializing. Applied before an event occurs.</p>
          </div>
          <div className="p-4 border border-purple-200 bg-purple-50/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-purple-100 text-purple-600 rounded">
                {getTypeIcon('detective')}
              </div>
              <span className="text-sm font-semibold text-purple-700">Detective</span>
            </div>
            <p className="text-xs text-slate-600">Identify risks that have occurred. Monitor and alert on issues.</p>
          </div>
          <div className="p-4 border border-amber-200 bg-amber-50/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-amber-100 text-amber-600 rounded">
                {getTypeIcon('corrective')}
              </div>
              <span className="text-sm font-semibold text-amber-700">Corrective</span>
            </div>
            <p className="text-xs text-slate-600">Remediate issues after detection. Fix and recover from incidents.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
