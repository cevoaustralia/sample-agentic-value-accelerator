import { Link, useLocation } from 'react-router-dom';
import type { RuntimeConfig } from '../config';

interface Props {
  config: RuntimeConfig;
}

export default function Navigation({ config }: Props) {
  const location = useLocation();

  const links = [
    { to: '/', label: 'Dashboard' },
    { to: '/console', label: 'Validate Claim' },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b"
      style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <img src="/cevo-logo.png" alt="Cevo" className="h-8 w-auto object-contain" style={{ maxHeight: '32px' }} />
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>Claim Validator</span>
          </div>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {links.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                style={active
                  ? { background: 'rgba(255, 143, 0, 0.08)', color: 'var(--accent)' }
                  : { color: 'var(--text-secondary)' }
                }
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Domain badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(255, 143, 0, 0.08)', color: 'var(--accent)', border: '1px solid rgba(255, 143, 0, 0.25)' }}>
            {config.domain}
          </span>
        </div>
      </div>
      {/* Accent line */}
      <div className="h-0.5" style={{ background: 'linear-gradient(90deg, #FF8F00, #F05A2A, #D3145A, #7204B9, #191970)' }} />
    </nav>
  );
}
