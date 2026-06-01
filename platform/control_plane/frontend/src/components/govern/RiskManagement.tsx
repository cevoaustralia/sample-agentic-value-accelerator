/**
 * RiskManagement — Enterprise risk management for AI/ML systems
 *
 * Tabs:
 * - Dashboard: Portfolio view, key metrics, trends
 * - Risk Register: Central inventory with CRUD
 * - Assessments: Run risk assessments
 * - Controls: Control library with risk mappings
 * - Issues: Findings and remediation tracking
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import RiskDashboard from './risk/RiskDashboard';
import RiskRegister from './risk/RiskRegister';
import RiskAssessments from './risk/RiskAssessments';
import RiskControls from './risk/RiskControls';
import RiskIssues from './risk/RiskIssues';
import { RiskManagementGuide } from './ModuleGuide';
import { MockDataBadge } from './DataSourceIndicator';

type Tab = 'dashboard' | 'register' | 'assessments' | 'controls' | 'issues';

const TABS: { id: Tab; label: string; description: string }[] = [
  { id: 'dashboard', label: 'Dashboard', description: 'Portfolio risk overview' },
  { id: 'register', label: 'Risk Register', description: 'All identified risks' },
  { id: 'assessments', label: 'Assessments', description: 'Risk evaluation workflows' },
  { id: 'controls', label: 'Controls', description: 'Mitigating controls library' },
  { id: 'issues', label: 'Issues', description: 'Findings & remediation' },
];

export default function RiskManagement() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  return (
    <div className="min-h-[calc(100vh-4rem)] relative">
      <div className="relative max-w-7xl mx-auto px-6 py-10">
        <Link to="/govern" className="text-sm text-slate-400 hover:text-slate-600 transition-colors font-medium">
          ← Govern
        </Link>

        <div className="flex items-end justify-between mt-3 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Risk Management</h1>
              <MockDataBadge integration="Custom PostgreSQL/DynamoDB backend" />
            </div>
            <p className="text-slate-500 mt-1 max-w-2xl">
              Enterprise risk register, assessments, controls, and issue tracking for AI/ML systems.
            </p>
          </div>
        </div>

        {/* How to Use Guide */}
        <RiskManagementGuide />

        {/* Tab navigation */}
        <div className="flex gap-1 p-1 bg-slate-100/80 rounded-xl mb-6 w-fit">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'dashboard' && <RiskDashboard />}
        {activeTab === 'register' && <RiskRegister />}
        {activeTab === 'assessments' && <RiskAssessments />}
        {activeTab === 'controls' && <RiskControls />}
        {activeTab === 'issues' && <RiskIssues />}
      </div>
    </div>
  );
}
