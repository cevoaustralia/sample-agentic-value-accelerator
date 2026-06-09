import { Link, useLocation } from 'react-router-dom';
import type { RuntimeConfig } from '../config';

export default function Navigation({ config }: { config: RuntimeConfig }) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b" style={{ background: '#ffffff', borderColor: 'var(--border)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3 group">
            <img src="/cevo-logo.png" alt="Cevo" className="h-8 w-auto" />
            <div>
              <div className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{config.use_case_name}</div>
              <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--accent)' }}>AVA</div>
            </div>
          </Link>

          <div className="flex items-center space-x-1">
            <Link
              to="/"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: isActive('/') ? 'rgba(255, 143, 0, 0.08)' : 'transparent',
                color: isActive('/') ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              Home
            </Link>
            <Link
              to="/console"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: isActive('/console') ? 'rgba(255, 143, 0, 0.08)' : 'transparent',
                color: isActive('/console') ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              KYC Console
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
