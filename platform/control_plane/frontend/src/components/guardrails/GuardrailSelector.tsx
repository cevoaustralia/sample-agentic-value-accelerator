import { useState, useEffect } from 'react';
import { guardrailsApi } from '../../api/client';
import type { GuardrailTemplate } from '../../types';

interface Props {
  value?: string;
  onChange: (guardrailId: string | undefined, guardrailVersion: string | undefined) => void;
}

export default function GuardrailSelector({ value, onChange }: Props) {
  const [templates, setTemplates] = useState<GuardrailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    guardrailsApi.list('active')
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selected = templates.find((t) => t.guardrail_id === value);

  const featureTags = (t: GuardrailTemplate): string[] => {
    const tags: string[] = [];
    if (t.content_filters?.length > 0) tags.push('Content');
    if (t.pii_entities?.length > 0) tags.push('PII');
    if (t.denied_topics?.length > 0) tags.push('Topics');
    return tags;
  };

  if (loading) {
    return (
      <div className="p-4 border border-slate-200 rounded-xl">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="w-4 h-4 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          Loading guardrails...
        </div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50">
        <p className="text-sm text-slate-500">No active guardrails available. <a href="/secure/guardrails?tab=builder" className="text-blue-600 hover:underline">Create one</a></p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="label mb-0">Guardrail (Optional)</label>
        {value && (
          <button
            onClick={() => onChange(undefined, undefined)}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Selected display or selector */}
      {selected ? (
        <div className="p-3 border border-blue-200 bg-blue-50/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">{selected.name}</p>
              <p className="text-[10px] text-slate-500 font-mono">{selected.guardrail_id}</p>
            </div>
          </div>
          <button onClick={() => setExpanded(true)} className="text-xs text-blue-600 hover:text-blue-800">Change</button>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-3 border border-slate-200 rounded-xl text-left text-sm text-slate-500 hover:border-blue-200 hover:bg-blue-50/20 transition-colors"
        >
          Select a guardrail template...
        </button>
      )}

      {/* Dropdown list */}
      {expanded && (
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-lg max-h-64 overflow-y-auto">
          {templates.map((t) => (
            <button
              key={t.template_id}
              onClick={() => {
                onChange(t.guardrail_id || undefined, t.guardrail_version || undefined);
                setExpanded(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-800">{t.name}</p>
                <div className="flex gap-1">
                  {featureTags(t).map((tag) => (
                    <span key={tag} className="px-1.5 py-0.5 text-[9px] bg-slate-100 text-slate-500 rounded">{tag}</span>
                  ))}
                </div>
              </div>
              {t.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{t.description}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
