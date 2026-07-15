/**
 * ModelMonitoring — Real-time model quality monitoring
 *
 * Features:
 * - Quality KPIs with thresholds (error rate, safety, hallucination, drift)
 * - Traffic light status (green/amber/red)
 * - Drill-down details with trend charts
 * - Intervention actions (tighten guardrails, pause model, route to human)
 */

import { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { MODELS, tooltipStyle } from './mockData';

// Quality thresholds - green/amber boundaries
const QUALITY_THRESHOLDS = {
  errorRate: { green: 0.5, amber: 2, label: 'Error Rate', unit: '%', icon: '⚠', invert: false },
  guardrailIntervention: { green: 5, amber: 15, label: 'Guardrail Interventions', unit: '%', icon: '🛡', invert: false },
  safetyScore: { green: 98, amber: 95, label: 'Safety Score', unit: '%', icon: '✓', invert: true },
  hallucinationRate: { green: 2, amber: 5, label: 'Hallucination Rate', unit: '%', icon: '💭', invert: false },
  latencyP99: { green: 3, amber: 5, label: 'Latency P99', unit: 's', icon: '⏱', invert: false },
  driftScore: { green: 2, amber: 5, label: 'Model Drift', unit: '%', icon: '📈', invert: false },
};

type MetricKey = keyof typeof QUALITY_THRESHOLDS;
type Status = 'green' | 'amber' | 'red';

interface ModelMetrics {
  modelId: string;
  modelName: string;
  metrics: Record<MetricKey, number>;
  trend: { date: string; errorRate: number; safety: number; hallucination: number }[];
}

// Mock metrics data - would come from CloudWatch in production
const MODEL_METRICS: ModelMetrics[] = MODELS.map(m => ({
  modelId: m.id,
  modelName: m.name,
  metrics: {
    errorRate: +(Math.random() * 1.5).toFixed(2),
    guardrailIntervention: +(Math.random() * 10 + 2).toFixed(1),
    safetyScore: +(95 + Math.random() * 4).toFixed(1),
    hallucinationRate: +(Math.random() * 4 + 1).toFixed(1),
    latencyP99: +(Math.random() * 3 + 1.5).toFixed(2),
    driftScore: +(Math.random() * 4).toFixed(1),
  },
  trend: Array.from({ length: 7 }, (_, i) => ({
    date: `May ${20 + i}`,
    errorRate: +(Math.random() * 1.5).toFixed(2),
    safety: +(95 + Math.random() * 4).toFixed(1),
    hallucination: +(Math.random() * 4 + 1).toFixed(1),
  })),
}));

const INTERVENTIONS = [
  {
    id: 'tighten',
    label: 'Tighten Guardrails',
    icon: '🛡',
    severity: 'Medium',
    description: 'Escalate content filters to HIGH. Enable all PII detection. Add denied topics.',
    impact: 'May increase intervention rate, reduces harmful outputs',
  },
  {
    id: 'pause',
    label: 'Pause Model',
    icon: '⏸',
    severity: 'Critical',
    description: 'Activate circuit breaker. Stop all invocations. Route to fallback.',
    impact: 'All requests blocked until manually resumed',
  },
  {
    id: 'human',
    label: 'Route to Human',
    icon: '👤',
    severity: 'High',
    description: 'Enable human-in-the-loop for all decisions. Queue outputs for review.',
    impact: 'Increased latency (5-15 min per decision), reduced throughput',
  },
];

function getStatus(value: number, threshold: typeof QUALITY_THRESHOLDS[MetricKey]): Status {
  if (threshold.invert) {
    if (value >= threshold.green) return 'green';
    if (value >= threshold.amber) return 'amber';
    return 'red';
  }
  if (value <= threshold.green) return 'green';
  if (value <= threshold.amber) return 'amber';
  return 'red';
}

const STATUS_COLORS: Record<Status, string> = {
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
};

const STATUS_BG: Record<Status, string> = {
  green: 'bg-emerald-50 border-emerald-200',
  amber: 'bg-amber-50 border-amber-200',
  red: 'bg-rose-50 border-rose-200',
};

export default function ModelMonitoring() {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [expandedMetric, setExpandedMetric] = useState<MetricKey | null>(null);
  const [showIntervention, setShowIntervention] = useState(false);

  // Aggregate fleet metrics
  const fleetMetrics = useMemo(() => {
    const totals: Record<MetricKey, number[]> = {
      errorRate: [],
      guardrailIntervention: [],
      safetyScore: [],
      hallucinationRate: [],
      latencyP99: [],
      driftScore: [],
    };

    MODEL_METRICS.forEach(m => {
      (Object.keys(totals) as MetricKey[]).forEach(key => {
        totals[key].push(m.metrics[key]);
      });
    });

    const avg = (arr: number[]) => +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
    return Object.fromEntries(
      (Object.keys(totals) as MetricKey[]).map(key => [key, avg(totals[key])])
    ) as Record<MetricKey, number>;
  }, []);

  // Count statuses across fleet
  const statusCounts = useMemo(() => {
    const counts: Record<Status, number> = { green: 0, amber: 0, red: 0 };
    MODEL_METRICS.forEach(m => {
      (Object.keys(QUALITY_THRESHOLDS) as MetricKey[]).forEach(key => {
        const status = getStatus(m.metrics[key], QUALITY_THRESHOLDS[key]);
        counts[status]++;
      });
    });
    return counts;
  }, []);

  const selectedModelData = selectedModel
    ? MODEL_METRICS.find(m => m.modelId === selectedModel)
    : null;

  return (
    <div className="space-y-6">
      {/* Fleet Health Summary */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Fleet Quality Monitor</h3>
            <p className="text-xs text-slate-500 mt-0.5">Real-time metrics across {MODELS.length} models</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {statusCounts.green} OK
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {statusCounts.amber} Warn
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                {statusCounts.red} Crit
              </span>
            </div>
            <button
              onClick={() => setShowIntervention(!showIntervention)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                showIntervention
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              {showIntervention ? 'Close' : 'Interventions'}
            </button>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-6 gap-3">
          {(Object.keys(QUALITY_THRESHOLDS) as MetricKey[]).map(key => {
            const threshold = QUALITY_THRESHOLDS[key];
            const value = fleetMetrics[key];
            const status = getStatus(value, threshold);
            const isExpanded = expandedMetric === key;

            return (
              <button
                key={key}
                onClick={() => setExpandedMetric(isExpanded ? null : key)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isExpanded
                    ? 'ring-2 ring-blue-500 ' + STATUS_BG[status]
                    : STATUS_BG[status] + ' hover:shadow-md'
                }`}
                style={{ borderLeftWidth: '3px', borderLeftColor: STATUS_COLORS[status] }}
              >
                <div className="text-lg mb-1">{threshold.icon}</div>
                <div
                  className="text-xl font-bold tabular-nums"
                  style={{ color: STATUS_COLORS[status] }}
                >
                  {value}{threshold.unit}
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-1">
                  {threshold.label}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  Target: {threshold.invert ? '>' : '<'}{threshold.green}{threshold.unit}
                </div>
              </button>
            );
          })}
        </div>

        {/* Expanded Metric Detail */}
        {expandedMetric && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{QUALITY_THRESHOLDS[expandedMetric].icon}</span>
                <span className="text-sm font-semibold text-slate-900">
                  {QUALITY_THRESHOLDS[expandedMetric].label} — Fleet Detail
                </span>
              </div>
              <button
                onClick={() => setExpandedMetric(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase">Fleet Average</div>
                <div className="text-xl font-bold text-slate-900">
                  {fleetMetrics[expandedMetric]}{QUALITY_THRESHOLDS[expandedMetric].unit}
                </div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase">Best Model</div>
                <div className="text-xl font-bold text-emerald-600">
                  {Math.min(...MODEL_METRICS.map(m => m.metrics[expandedMetric]))}{QUALITY_THRESHOLDS[expandedMetric].unit}
                </div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase">Worst Model</div>
                <div className="text-xl font-bold text-rose-600">
                  {Math.max(...MODEL_METRICS.map(m => m.metrics[expandedMetric]))}{QUALITY_THRESHOLDS[expandedMetric].unit}
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-500">
              Source: CloudWatch AWS/Bedrock · Window: 7 days ·
              Threshold: {QUALITY_THRESHOLDS[expandedMetric].invert ? '>' : '<'}{QUALITY_THRESHOLDS[expandedMetric].green}{QUALITY_THRESHOLDS[expandedMetric].unit} (green),
              {QUALITY_THRESHOLDS[expandedMetric].invert ? '>' : '<'}{QUALITY_THRESHOLDS[expandedMetric].amber}{QUALITY_THRESHOLDS[expandedMetric].unit} (amber)
            </div>
          </div>
        )}
      </div>

      {/* Intervention Panel */}
      {showIntervention && (
        <div className="bg-rose-50/50 backdrop-blur-sm rounded-xl border border-rose-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-rose-900 mb-4">Emergency Interventions</h3>
          <div className="grid grid-cols-3 gap-4">
            {INTERVENTIONS.map(intervention => (
              <div
                key={intervention.id}
                className="p-4 bg-white rounded-lg border border-rose-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{intervention.icon}</span>
                  <span className="text-sm font-semibold text-slate-900">{intervention.label}</span>
                </div>
                <div className="text-xs text-slate-600 mb-3">{intervention.description}</div>
                <div className="text-[10px] text-slate-500 mb-3">
                  <span className="font-medium">Impact:</span> {intervention.impact}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    intervention.severity === 'Critical' ? 'bg-rose-100 text-rose-700' :
                    intervention.severity === 'High' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {intervention.severity}
                  </span>
                  <button className="px-3 py-1.5 text-xs font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors">
                    Execute
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-Model Metrics */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Per-Model Quality</h3>
          <span className="text-xs text-slate-400">Click row for trend details</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-slate-400 uppercase tracking-wide bg-slate-50/50">
              <th className="text-left py-2.5 px-5 font-medium">Model</th>
              <th className="text-center py-2.5 px-3 font-medium">Error %</th>
              <th className="text-center py-2.5 px-3 font-medium">Guardrail %</th>
              <th className="text-center py-2.5 px-3 font-medium">Safety</th>
              <th className="text-center py-2.5 px-3 font-medium">Hallucination %</th>
              <th className="text-center py-2.5 px-3 font-medium">Latency P99</th>
              <th className="text-center py-2.5 px-3 font-medium">Drift %</th>
              <th className="text-center py-2.5 px-5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {MODEL_METRICS.map(m => {
              const worstStatus = (Object.keys(QUALITY_THRESHOLDS) as MetricKey[]).reduce<Status>(
                (worst, key) => {
                  const s = getStatus(m.metrics[key], QUALITY_THRESHOLDS[key]);
                  if (s === 'red') return 'red';
                  if (s === 'amber' && worst !== 'red') return 'amber';
                  return worst;
                },
                'green'
              );

              return (
                <tr
                  key={m.modelId}
                  onClick={() => setSelectedModel(selectedModel === m.modelId ? null : m.modelId)}
                  className={`border-t border-slate-100 hover:bg-slate-50/60 cursor-pointer transition-colors ${
                    selectedModel === m.modelId ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <td className="py-2.5 px-5 font-medium text-slate-900">{m.modelName}</td>
                  {(Object.keys(QUALITY_THRESHOLDS) as MetricKey[]).map(key => {
                    const status = getStatus(m.metrics[key], QUALITY_THRESHOLDS[key]);
                    return (
                      <td key={key} className="py-2.5 px-3 text-center">
                        <span
                          className="font-semibold tabular-nums"
                          style={{ color: STATUS_COLORS[status] }}
                        >
                          {m.metrics[key]}{QUALITY_THRESHOLDS[key].unit}
                        </span>
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-5 text-center">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      worstStatus === 'green' ? 'bg-emerald-100 text-emerald-700' :
                      worstStatus === 'amber' ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {worstStatus === 'green' ? 'Healthy' : worstStatus === 'amber' ? 'Warning' : 'Critical'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Selected Model Trend */}
      {selectedModelData && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">
              {selectedModelData.modelName} — 7-Day Trend
            </h3>
            <button
              onClick={() => setSelectedModel(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-xs text-slate-500 mb-2">Error Rate & Hallucination</div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={selectedModelData.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="errorRate" name="Error %" fill="#ef4444" />
                  <Bar dataKey="hallucination" name="Hallucination %" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-2">Safety Score</div>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={selectedModelData.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis domain={[90, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="safety" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
