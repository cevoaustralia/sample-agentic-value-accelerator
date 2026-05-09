import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Drawer from './Drawer';
import { getRiskDrill, tooltipStyle } from './mockData';

interface Props {
  selection: { agent: string; category: string; score: number } | null;
  onClose: () => void;
}

const sevBg: Record<string, string> = {
  low:    'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high:   'bg-rose-100 text-rose-700',
};

export default function RiskDrawer({ selection, onClose }: Props) {
  const detail = selection ? getRiskDrill(selection.agent, selection.category, selection.score) : null;

  return (
    <Drawer
      open={!!selection && !!detail}
      onClose={onClose}
      title={selection ? `${selection.agent} — ${selection.category}` : ''}
      subtitle={selection ? `Risk score ${selection.score}/100 · last 14 days shown` : undefined}
      width="lg"
    >
      {selection && detail && (
        <div className="space-y-6">
          {/* Score trend */}
          <div>
            <div className="text-sm font-semibold text-slate-900 mb-2">14-Day Risk Trend</div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={detail.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="score" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Incidents */}
          <div>
            <div className="text-sm font-semibold text-slate-900 mb-2">Recent Incidents ({detail.incidents.length})</div>
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {detail.incidents.map((inc, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono text-slate-400 w-10">{inc.ts}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase ${sevBg[inc.severity]}`}>{inc.severity}</span>
                    <span className="text-xs text-slate-500 ml-auto">{inc.action}</span>
                  </div>
                  <div className="text-sm text-slate-900 pl-12">{inc.summary}</div>
                  {inc.resolvedBy && (
                    <div className="text-[11px] text-slate-500 pl-12 mt-0.5">Resolution: {inc.resolvedBy}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Example prompts */}
          <div>
            <div className="text-sm font-semibold text-slate-900 mb-2">Example Triggering Prompts</div>
            <div className="bg-slate-900 rounded-xl p-4 space-y-2">
              {detail.examplePrompts.map((p, i) => (
                <div key={i} className="text-xs text-slate-200 font-mono leading-relaxed">
                  <span className="text-slate-500 mr-2">›</span>{p}
                </div>
              ))}
            </div>
          </div>

          {/* Mitigations */}
          <div>
            <div className="text-sm font-semibold text-slate-900 mb-2">Mitigations</div>
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {detail.mitigations.map((m, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="text-sm font-medium text-slate-900">{m.name}</div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase ${
                      m.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 leading-relaxed">{m.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
