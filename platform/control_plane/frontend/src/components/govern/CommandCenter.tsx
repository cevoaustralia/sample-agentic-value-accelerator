/**
 * CommandCenter — Aggregated governance view
 *
 * Single pane of glass for executives showing trust scores, compliance,
 * risk exposure, and real-time alerts.
 */

import { Link } from 'react-router-dom';
import GovernanceCommandCenter from './GovernanceCommandCenter';

export default function CommandCenter() {
  return (
    <div className="min-h-[calc(100vh-4rem)] relative">
      <div className="relative max-w-7xl mx-auto px-6 py-10">
        <Link to="/govern" className="text-sm text-slate-400 hover:text-slate-600 transition-colors font-medium">
          ← Govern
        </Link>

        <div className="flex items-end justify-between mt-3 mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Command Center</h1>
            <p className="text-slate-500 mt-1 max-w-2xl">
              Aggregated governance view — trust scores, compliance posture, risk exposure, and real-time alerts across your entire AI fleet.
            </p>
          </div>
          <div className="text-xs text-slate-400">
            Updated {new Date().toLocaleTimeString()} · <span className="text-emerald-600 font-medium">● Live</span>
          </div>
        </div>

        <GovernanceCommandCenter />
      </div>
    </div>
  );
}
