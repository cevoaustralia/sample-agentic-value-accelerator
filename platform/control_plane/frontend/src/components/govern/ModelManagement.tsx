/**
 * ModelManagement — Comprehensive model governance hub
 *
 * Features:
 * - Registry: Model inventory with owner, tier, status
 * - Evaluations: Run and view eval results (safety, quality, latency)
 * - Monitoring: Drift detection, performance tracking
 * - Governance: Risk tiers, attestation, approval workflows
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import ModelRegistry from './ModelRegistry';
import ModelEvaluations from './ModelEvaluations';
import ModelMonitoring from './ModelMonitoring';
import ModelGovernance from './ModelGovernance';
import ModelLifecycle from './ModelLifecycle';
import ModelOperations from './ModelOperations';
import {
  ModelRegistryGuide,
  ModelEvaluationsGuide,
  ModelMonitoringGuide,
  ModelGovernanceGuide,
  ModelLifecycleGuide,
  ModelOperationsGuide,
} from './ModuleGuide';
import DataSourceIndicator from './DataSourceIndicator';

type Tab = 'registry' | 'evaluations' | 'monitoring' | 'governance' | 'lifecycle' | 'operations';

const TABS: { id: Tab; label: string; description: string }[] = [
  { id: 'registry', label: 'Registry', description: 'Model inventory & approval status' },
  { id: 'evaluations', label: 'Evaluations', description: 'Run & view eval results' },
  { id: 'monitoring', label: 'Monitoring', description: 'Drift & performance tracking' },
  { id: 'governance', label: 'Governance', description: 'Risk tiers & attestation' },
  { id: 'lifecycle', label: 'Lifecycle', description: 'Sunset & migration tracking' },
  { id: 'operations', label: 'Operations', description: 'Issues, dependencies & analytics' },
];

export default function ModelManagement() {
  const [activeTab, setActiveTab] = useState<Tab>('registry');

  return (
    <div className="min-h-[calc(100vh-4rem)] relative">
      <div className="relative max-w-7xl mx-auto px-6 py-10">
        <Link to="/govern" className="text-sm text-slate-400 hover:text-slate-600 transition-colors font-medium">
          ← Govern
        </Link>

        <div className="flex items-end justify-between mt-3 mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Model Management</h1>
            <p className="text-slate-500 mt-1 max-w-2xl">
              Comprehensive model governance: registry, evaluations, monitoring, and compliance tracking.
            </p>
          </div>
        </div>

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

        {/* Data Sources Indicator */}
        <DataSourceIndicator />

        {/* Tab-specific guide */}
        {activeTab === 'registry' && <ModelRegistryGuide />}
        {activeTab === 'evaluations' && <ModelEvaluationsGuide />}
        {activeTab === 'monitoring' && <ModelMonitoringGuide />}
        {activeTab === 'governance' && <ModelGovernanceGuide />}
        {activeTab === 'lifecycle' && <ModelLifecycleGuide />}
        {activeTab === 'operations' && <ModelOperationsGuide />}

        {/* Tab content */}
        {activeTab === 'registry' && <RegistryTab />}
        {activeTab === 'evaluations' && <ModelEvaluations />}
        {activeTab === 'monitoring' && <ModelMonitoring />}
        {activeTab === 'governance' && <ModelGovernance />}
        {activeTab === 'lifecycle' && <ModelLifecycle />}
        {activeTab === 'operations' && <ModelOperations embedded />}
      </div>
    </div>
  );
}

// Registry tab - uses existing ModelRegistry component (inline version)
function RegistryTab() {
  return (
    <div className="bg-white/60 rounded-xl border border-slate-200/60 p-1">
      <ModelRegistry embedded />
    </div>
  );
}
