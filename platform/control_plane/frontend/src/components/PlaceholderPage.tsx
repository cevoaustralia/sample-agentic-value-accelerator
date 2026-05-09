import { Link } from 'react-router-dom';

interface Props {
  title: string;
  description: string;
  breadcrumb?: { label: string; to: string };
  accent?: 'blue' | 'violet' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'teal' | 'sky';
  features?: string[];
}

const ACCENTS: Record<NonNullable<Props['accent']>, { bg: string; text: string; ring: string }> = {
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    ring: 'ring-blue-200' },
  violet:  { bg: 'bg-violet-50',  text: 'text-violet-700',  ring: 'ring-violet-200' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   ring: 'ring-amber-200' },
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-700',    ring: 'ring-rose-200' },
  indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-700',  ring: 'ring-indigo-200' },
  teal:    { bg: 'bg-teal-50',    text: 'text-teal-700',    ring: 'ring-teal-200' },
  sky:     { bg: 'bg-sky-50',     text: 'text-sky-700',     ring: 'ring-sky-200' },
};

export default function PlaceholderPage({ title, description, breadcrumb, accent = 'blue', features }: Props) {
  const a = ACCENTS[accent];

  return (
    <div className="min-h-[calc(100vh-4rem)] relative">
      <div className="relative max-w-5xl mx-auto px-6 py-10">
        {breadcrumb && (
          <Link to={breadcrumb.to} className="text-sm text-slate-400 hover:text-slate-600 transition-colors font-medium">
            ← {breadcrumb.label}
          </Link>
        )}

        <div className="flex items-baseline justify-between mt-3 mb-2">
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">{title}</h1>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ${a.bg} ${a.text} ${a.ring}`}>
            Coming Soon
          </span>
        </div>
        <p className="text-slate-500 max-w-2xl mb-10">{description}</p>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl ${a.bg} flex items-center justify-center flex-shrink-0`}>
              <svg className={`w-6 h-6 ${a.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-slate-900 mb-1">In development</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                This page is a placeholder while the capability is being built out. Check back soon or follow progress in the team channel.
              </p>
            </div>
          </div>

          {features && features.length > 0 && (
            <div className="mt-8 pt-8 border-t border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">What this will include</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                    <svg className={`w-4 h-4 ${a.text} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
