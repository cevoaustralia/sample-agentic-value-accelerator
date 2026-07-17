/**
 * ModelEvaluations — Run and view model evaluation results
 *
 * Features:
 * - Run new evaluations against models
 * - View evaluation history with safety, quality, latency scores
 * - Compare models side-by-side
 * - Track evaluation trends over time
 */

import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { MODELS, MODEL_DETAILS, tooltipStyle } from './mockData';

type EvalStatus = 'completed' | 'running' | 'scheduled' | 'failed';

interface EvaluationRun {
  id: string;
  modelId: string;
  modelName: string;
  status: EvalStatus;
  startedAt: string;
  completedAt?: string;
  scores?: {
    safety: number;
    quality: number;
    latency: number;
    accuracy: number;
    consistency: number;
  };
  evalType: 'full' | 'quick' | 'safety-only' | 'custom';
  triggeredBy: string;
}

const EVAL_RUNS: EvaluationRun[] = [
  {
    id: 'eval-001',
    modelId: 'claude-3-sonnet',
    modelName: 'Claude 3.5 Sonnet',
    status: 'completed',
    startedAt: '2026-05-26 09:00',
    completedAt: '2026-05-26 09:12',
    scores: { safety: 94, quality: 91, latency: 88, accuracy: 92, consistency: 89 },
    evalType: 'full',
    triggeredBy: 'Scheduled',
  },
  {
    id: 'eval-002',
    modelId: 'gpt-4-turbo',
    modelName: 'GPT-4 Turbo',
    status: 'completed',
    startedAt: '2026-05-26 09:00',
    completedAt: '2026-05-26 09:15',
    scores: { safety: 89, quality: 93, latency: 82, accuracy: 94, consistency: 91 },
    evalType: 'full',
    triggeredBy: 'Scheduled',
  },
  {
    id: 'eval-003',
    modelId: 'claude-3-haiku',
    modelName: 'Claude 3 Haiku',
    status: 'running',
    startedAt: '2026-05-26 14:30',
    evalType: 'quick',
    triggeredBy: 'Manual',
  },
  {
    id: 'eval-004',
    modelId: 'titan-express',
    modelName: 'Amazon Titan Express',
    status: 'scheduled',
    startedAt: '2026-05-27 09:00',
    evalType: 'full',
    triggeredBy: 'Scheduled',
  },
  {
    id: 'eval-005',
    modelId: 'mistral-large',
    modelName: 'Mistral Large',
    status: 'failed',
    startedAt: '2026-05-25 09:00',
    completedAt: '2026-05-25 09:02',
    evalType: 'safety-only',
    triggeredBy: 'CI Pipeline',
  },
];

const EVAL_TYPES = [
  { id: 'full', label: 'Full Evaluation', description: 'Safety, quality, latency, accuracy (~15 min)', color: 'bg-blue-100 text-blue-700' },
  { id: 'quick', label: 'Quick Check', description: 'Core metrics only (~3 min)', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'safety-only', label: 'Safety Scan', description: 'Adversarial & bias testing (~5 min)', color: 'bg-amber-100 text-amber-700' },
  { id: 'custom', label: 'Custom Suite', description: 'Select specific test categories', color: 'bg-violet-100 text-violet-700' },
];

const statusColors: Record<EvalStatus, string> = {
  completed: 'bg-emerald-100 text-emerald-700',
  running: 'bg-blue-100 text-blue-700',
  scheduled: 'bg-slate-100 text-slate-600',
  failed: 'bg-rose-100 text-rose-700',
};

export default function ModelEvaluations() {
  const [showNewEval, setShowNewEval] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareModels, setCompareModels] = useState<string[]>([]);

  // Aggregate scores for comparison radar chart
  const comparisonData = useMemo(() => {
    if (compareModels.length < 2) return null;

    const metrics = ['safety', 'quality', 'latency', 'accuracy', 'consistency'] as const;
    return metrics.map(metric => {
      const point: Record<string, string | number> = { metric: metric.charAt(0).toUpperCase() + metric.slice(1) };
      compareModels.forEach(modelId => {
        const run = EVAL_RUNS.find(r => r.modelId === modelId && r.status === 'completed');
        if (run?.scores) {
          point[modelId] = run.scores[metric];
        }
      });
      return point;
    });
  }, [compareModels]);

  const completedRuns = EVAL_RUNS.filter(r => r.status === 'completed');
  const avgScores = useMemo(() => {
    if (completedRuns.length === 0) return null;
    const totals = { safety: 0, quality: 0, latency: 0, accuracy: 0, consistency: 0 };
    completedRuns.forEach(r => {
      if (r.scores) {
        totals.safety += r.scores.safety;
        totals.quality += r.scores.quality;
        totals.latency += r.scores.latency;
        totals.accuracy += r.scores.accuracy;
        totals.consistency += r.scores.consistency;
      }
    });
    const n = completedRuns.length;
    return {
      safety: Math.round(totals.safety / n),
      quality: Math.round(totals.quality / n),
      latency: Math.round(totals.latency / n),
      accuracy: Math.round(totals.accuracy / n),
      consistency: Math.round(totals.consistency / n),
    };
  }, [completedRuns]);

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 shadow-sm">
          <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Evaluations Run</div>
          <div className="text-2xl font-semibold text-slate-900 mt-1">{EVAL_RUNS.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Last 30 days</div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 shadow-sm">
          <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Avg Safety</div>
          <div className="text-2xl font-semibold text-emerald-600 mt-1">{avgScores?.safety ?? '—'}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Across fleet</div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 shadow-sm">
          <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Avg Quality</div>
          <div className="text-2xl font-semibold text-blue-600 mt-1">{avgScores?.quality ?? '—'}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Across fleet</div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 shadow-sm">
          <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Running</div>
          <div className="text-2xl font-semibold text-blue-600 mt-1">{EVAL_RUNS.filter(r => r.status === 'running').length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">In progress</div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-4 shadow-sm">
          <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Failed</div>
          <div className="text-2xl font-semibold text-rose-600 mt-1">{EVAL_RUNS.filter(r => r.status === 'failed').length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Needs attention</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewEval(!showNewEval)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + New Evaluation
          </button>
          <button
            onClick={() => {
              setCompareMode(!compareMode);
              if (compareMode) setCompareModels([]);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              compareMode
                ? 'bg-violet-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            {compareMode ? 'Exit Compare' : 'Compare Models'}
          </button>
        </div>
        {compareMode && (
          <div className="text-sm text-slate-500">
            Select 2-3 models to compare • {compareModels.length} selected
          </div>
        )}
      </div>

      {/* New Evaluation Panel */}
      {showNewEval && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Start New Evaluation</h3>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-medium text-slate-700 uppercase tracking-wide">Select Model</label>
              <select className="mt-2 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500">
                <option value="">Choose a model...</option>
                {MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 uppercase tracking-wide">Evaluation Type</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {EVAL_TYPES.map(et => (
                  <button
                    key={et.id}
                    className="p-2 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left"
                  >
                    <div className="text-xs font-semibold text-slate-900">{et.label}</div>
                    <div className="text-[10px] text-slate-500">{et.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => setShowNewEval(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
              Start Evaluation
            </button>
          </div>
        </div>
      )}

      {/* Comparison Chart */}
      {compareMode && compareModels.length >= 2 && comparisonData && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Model Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={comparisonData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              {compareModels.map((modelId, i) => {
                const colors = ['#3b82f6', '#10b981', '#f59e0b'];
                const model = MODELS.find(m => m.id === modelId);
                return (
                  <Radar
                    key={modelId}
                    name={model?.name ?? modelId}
                    dataKey={modelId}
                    stroke={colors[i % colors.length]}
                    fill={colors[i % colors.length]}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                );
              })}
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Tooltip contentStyle={tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Evaluation History */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Evaluation History</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-slate-400 uppercase tracking-wide bg-slate-50/50">
              {compareMode && <th className="py-2.5 px-5 text-left font-medium w-12"></th>}
              <th className="text-left py-2.5 px-5 font-medium">Model</th>
              <th className="text-left py-2.5 px-3 font-medium">Type</th>
              <th className="text-center py-2.5 px-3 font-medium">Safety</th>
              <th className="text-center py-2.5 px-3 font-medium">Quality</th>
              <th className="text-center py-2.5 px-3 font-medium">Latency</th>
              <th className="text-left py-2.5 px-3 font-medium">Started</th>
              <th className="text-left py-2.5 px-3 font-medium">Triggered By</th>
              <th className="text-left py-2.5 px-5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {EVAL_RUNS.map(run => (
              <tr
                key={run.id}
                className={`border-t border-slate-100 hover:bg-slate-50/60 transition-colors ${
                  compareModels.includes(run.modelId) ? 'bg-blue-50/30' : ''
                }`}
              >
                {compareMode && (
                  <td className="py-2.5 px-5">
                    <input
                      type="checkbox"
                      checked={compareModels.includes(run.modelId)}
                      onChange={e => {
                        if (e.target.checked && compareModels.length < 3) {
                          setCompareModels([...compareModels, run.modelId]);
                        } else {
                          setCompareModels(compareModels.filter(id => id !== run.modelId));
                        }
                      }}
                      disabled={!compareModels.includes(run.modelId) && compareModels.length >= 3}
                      className="rounded border-slate-300"
                    />
                  </td>
                )}
                <td className="py-2.5 px-5">
                  <div className="font-semibold text-slate-900">{run.modelName}</div>
                  <div className="text-[10px] text-slate-400">{run.id}</div>
                </td>
                <td className="py-2.5 px-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    EVAL_TYPES.find(t => t.id === run.evalType)?.color ?? 'bg-slate-100 text-slate-600'
                  }`}>
                    {run.evalType}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  {run.scores ? (
                    <span className={`font-semibold ${run.scores.safety >= 90 ? 'text-emerald-600' : run.scores.safety >= 80 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {run.scores.safety}
                    </span>
                  ) : '—'}
                </td>
                <td className="py-2.5 px-3 text-center">
                  {run.scores ? (
                    <span className={`font-semibold ${run.scores.quality >= 90 ? 'text-emerald-600' : run.scores.quality >= 80 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {run.scores.quality}
                    </span>
                  ) : '—'}
                </td>
                <td className="py-2.5 px-3 text-center">
                  {run.scores ? (
                    <span className={`font-semibold ${run.scores.latency >= 90 ? 'text-emerald-600' : run.scores.latency >= 80 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {run.scores.latency}
                    </span>
                  ) : '—'}
                </td>
                <td className="py-2.5 px-3 text-slate-500 text-[11px]">{run.startedAt}</td>
                <td className="py-2.5 px-3 text-slate-600 text-xs">{run.triggeredBy}</td>
                <td className="py-2.5 px-5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${statusColors[run.status]}`}>
                    {run.status === 'running' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse mr-1" />}
                    {run.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fleet Trend */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Fleet Evaluation Trend (30 days)</h3>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Safety</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Quality</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Latency</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={Object.values(MODEL_DETAILS)[0]?.evalHistory ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis domain={[50, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="safety" stroke="#10b981" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="quality" stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="latency" stroke="#f59e0b" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
