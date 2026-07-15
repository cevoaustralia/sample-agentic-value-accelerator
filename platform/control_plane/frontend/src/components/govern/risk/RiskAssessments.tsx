/**
 * RiskAssessments — Run and track risk assessments
 */

import { useState } from 'react';
import { ASSESSMENTS } from './riskData';

export default function RiskAssessments() {
  const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null);

  const selectedData = selectedAssessment ? ASSESSMENTS.find(a => a.id === selectedAssessment) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Risk Assessments</h3>
          <p className="text-xs text-slate-500 mt-1">Initial, periodic, and change-triggered risk evaluations</p>
        </div>
        <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
          + New Assessment
        </button>
      </div>

      {/* Assessment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ASSESSMENTS.map(assessment => (
          <div
            key={assessment.id}
            onClick={() => setSelectedAssessment(selectedAssessment === assessment.id ? null : assessment.id)}
            className={`bg-white/80 backdrop-blur-sm rounded-xl border p-5 shadow-sm cursor-pointer transition-all ${
              selectedAssessment === assessment.id
                ? 'border-blue-300 ring-2 ring-blue-500'
                : 'border-slate-200/60 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-slate-400">{assessment.id}</span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                    assessment.type === 'initial' ? 'bg-blue-100 text-blue-700' :
                    assessment.type === 'periodic' ? 'bg-purple-100 text-purple-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {assessment.type}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-900 mt-1">{assessment.name}</h4>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-1 rounded border ${
                assessment.status === 'completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                assessment.status === 'approved' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                assessment.status === 'in-progress' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
                {assessment.status}
              </span>
            </div>

            <div className="text-xs text-slate-600 mb-3">{assessment.scope}</div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2 bg-slate-50 rounded-lg">
                <div className="text-lg font-bold text-slate-900">{assessment.risksIdentified}</div>
                <div className="text-[9px] text-slate-500 uppercase">Risks</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <div className="text-lg font-bold text-slate-900">{assessment.controlsEvaluated}</div>
                <div className="text-[9px] text-slate-500 uppercase">Controls</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <div className="text-lg font-bold text-slate-900">{assessment.findings}</div>
                <div className="text-[9px] text-slate-500 uppercase">Findings</div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
              <span>Assessor: {assessment.assessor}</span>
              <span>{assessment.completedDate || assessment.startDate}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Assessment Detail */}
      {selectedData && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{selectedData.name}</h3>
              <p className="text-sm text-slate-500 mt-1">{selectedData.scope}</p>
            </div>
            <button onClick={() => setSelectedAssessment(null)} className="text-slate-400 hover:text-slate-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Assessment Progress */}
          <div className="mb-6">
            <div className="text-sm font-semibold text-slate-900 mb-3">Assessment Workflow</div>
            <div className="flex items-center gap-2">
              {['Draft', 'In Progress', 'Completed', 'Approved'].map((step, i) => {
                const statusIndex = ['draft', 'in-progress', 'completed', 'approved'].indexOf(selectedData.status);
                const isComplete = i <= statusIndex;
                const isCurrent = i === statusIndex;
                return (
                  <div key={step} className="flex items-center gap-2 flex-1">
                    <div className={`flex-1 h-2 rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                    <div className={`text-xs ${isCurrent ? 'font-semibold text-emerald-600' : 'text-slate-500'}`}>
                      {step}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-[10px] text-slate-400 uppercase">Type</div>
              <div className="text-sm font-medium text-slate-900 capitalize">{selectedData.type.replace('-', ' ')}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-[10px] text-slate-400 uppercase">Assessor</div>
              <div className="text-sm font-medium text-slate-900">{selectedData.assessor}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-[10px] text-slate-400 uppercase">Started</div>
              <div className="text-sm font-medium text-slate-900">{selectedData.startDate}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-[10px] text-slate-400 uppercase">Completed</div>
              <div className="text-sm font-medium text-slate-900">{selectedData.completedDate || 'In progress'}</div>
            </div>
          </div>

          {/* Risks Identified */}
          {selectedData.risksIdentified > 0 && (
            <div>
              <div className="text-sm font-semibold text-slate-900 mb-3">Risks Identified in This Assessment</div>
              <div className="text-xs text-slate-500">
                {selectedData.risksIdentified} new risks were identified during this assessment.
                View them in the Risk Register tab.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assessment Types Info */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Assessment Types</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { type: 'Initial', desc: 'First assessment before production deployment', trigger: 'New AI system', color: 'blue' },
            { type: 'Periodic', desc: 'Scheduled recurring assessments', trigger: 'Quarterly / Annual', color: 'purple' },
            { type: 'Change-Triggered', desc: 'Assessment due to significant changes', trigger: 'Model upgrade, scope change', color: 'amber' },
          ].map(item => (
            <div key={item.type} className="p-4 border border-slate-200 rounded-lg">
              <div className={`text-sm font-semibold text-${item.color}-700 mb-2`}>{item.type}</div>
              <div className="text-xs text-slate-600 mb-2">{item.desc}</div>
              <div className="text-[10px] text-slate-400">Trigger: {item.trigger}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
