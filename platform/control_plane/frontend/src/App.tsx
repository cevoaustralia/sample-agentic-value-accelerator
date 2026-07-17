import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { UserProvider } from './contexts/UserContext';
import SignIn from './components/SignIn';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import PlanLanding from './components/PlanLanding';
import Prioritization from './components/Prioritization';
import MaturityAssessment from './components/MaturityAssessment';
import OperatingModel from './components/OperatingModel';
import BusinessCases from './components/BusinessCases';
import TemplateCatalog from './components/TemplateCatalog';
import DeploymentList from './components/DeploymentList';
import DeploymentCreate from './components/DeploymentCreate';
import DeploymentDetail from './components/DeploymentDetail';
import Documentation from './components/Documentation';
import FSIFoundryCatalog from './components/FSIFoundryCatalog';
import ReferenceImplementations from './components/ReferenceImplementations';
import AppDeployCreate from './components/AppDeployCreate';
import RefImplDeployCreate from './components/RefImplDeployCreate';
import Observability from './components/Observability';
import Guardrails from './components/Guardrails';
import Policy from './components/Policy';
import ServiceOnboardingLanding from './components/service-onboarding/ServiceOnboardingLanding';
import ServiceOnboardingFileViewer from './components/service-onboarding/ServiceOnboardingFileViewer';
import AppFactory from './components/AppFactory';
import ApplicationsLanding from './components/ApplicationsLanding';
import AaaSLanding from './components/AaaSLanding';
import AwsAgentsCatalog from './components/AwsAgentsCatalog';
import CustomAgentsCatalog from './components/CustomAgentsCatalog';
import AwsDevOpsAgent from './components/AwsDevOpsAgent';
import AwsSecurityAgent from './components/AwsSecurityAgent';
import CustomAgentCreate from './components/CustomAgentCreate';
import Tools from './components/capabilities/Tools';
import Knowledge from './components/capabilities/Knowledge';
import Prompts from './components/capabilities/Prompts';
import CapabilitiesLanding from './components/CapabilitiesLanding';
import GovernLanding from './components/GovernLanding';
import CommandCenter from './components/govern/CommandCenter';
import TrustStackPage from './components/govern/TrustStackPage';
import FleetOverview from './components/govern/FleetOverview';
import ModelRegistry from './components/govern/ModelRegistry';
import FinOps from './components/govern/FinOps';
import AuditIncidents from './components/govern/AuditIncidents';
import ComplianceCenter from './components/govern/ComplianceCenter';
import RiskManagement from './components/govern/RiskManagement';
import MyAgents from './components/MyAgents';
import MyApps from './components/MyApps';

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) return <SignIn />;

  return (
    <UserProvider>
    <div className="h-screen flex overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative">
        {/* Shared ombre gradient */}
        <div className="fixed inset-0 pointer-events-none z-0" style={{
          background: 'radial-gradient(ellipse 80% 70% at 20% 50%, rgba(219,234,254,0.8) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 40%, rgba(221,214,254,0.6) 0%, transparent 55%), radial-gradient(ellipse 50% 60% at 50% 80%, rgba(252,231,243,0.5) 0%, transparent 50%)',
          animation: 'gradientDrift 20s ease-in-out infinite',
        }} />
        <div className="relative h-full">
          <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/plan" element={<PlanLanding />} />
        <Route path="/use-cases" element={<Prioritization />} />
        <Route path="/maturity-assessment" element={<MaturityAssessment />} />
        <Route path="/operating-model" element={<OperatingModel />} />
        <Route path="/business-cases" element={<BusinessCases />} />
        <Route path="/applications" element={<ApplicationsLanding />} />
        <Route path="/applications/fsi-foundry" element={<FSIFoundryCatalog />} />
        <Route path="/applications/reference-implementations" element={<ReferenceImplementations />} />
        <Route path="/applications/deploy/:useCaseId" element={<AppDeployCreate />} />
        <Route path="/applications/reference-implementations/deploy/:implId" element={<RefImplDeployCreate />} />
        <Route path="/applications/templates" element={<TemplateCatalog />} />
        <Route path="/applications/app-factory" element={<AppFactory />} />
        <Route path="/aaas" element={<AaaSLanding />} />
        <Route path="/aaas/aws-agents" element={<AwsAgentsCatalog />} />
        <Route path="/aaas/aws-agents/aws-devops" element={<AwsDevOpsAgent />} />
        <Route path="/aaas/aws-agents/aws-security" element={<AwsSecurityAgent />} />
        <Route path="/aaas/aws-agents/kiro" element={<AwsAgentsCatalog />} />
        <Route path="/aaas/custom" element={<CustomAgentsCatalog />} />
        <Route path="/aaas/custom/create" element={<CustomAgentCreate />} />
        <Route path="/aaas/custom/my-agents" element={<MyAgents />} />
        {/* Capabilities (formerly Tools Factory lived under /aaas/tools) */}
        <Route path="/aaas/tools" element={<Navigate to="/capabilities/tools" replace />} />
        <Route path="/capabilities" element={<CapabilitiesLanding />} />
        <Route path="/capabilities/tools" element={<Tools />} />
        <Route path="/capabilities/knowledge" element={<Knowledge />} />
        <Route path="/capabilities/prompts" element={<Prompts />} />
        {/* Govern: hub landing + dedicated pages for each capability */}
        <Route path="/govern" element={<GovernLanding />} />
        <Route path="/govern/command-center" element={<CommandCenter />} />
        <Route path="/govern/trust-stack" element={<TrustStackPage />} />
        <Route path="/govern/fleet" element={<FleetOverview />} />
        <Route path="/govern/models" element={<ModelRegistry />} />
        <Route path="/govern/risk" element={<RiskManagement />} />
        <Route path="/govern/compliance" element={<ComplianceCenter />} />
        <Route path="/govern/finops" element={<FinOps />} />
        <Route path="/govern/audit" element={<AuditIncidents />} />
        {/* Legacy redirects */}
        <Route path="/govern/dashboard" element={<Navigate to="/govern" replace />} />
        <Route path="/govern/cost-tracking" element={<Navigate to="/govern/finops" replace />} />
        <Route path="/applications/my-apps" element={<MyApps />} />
        <Route path="/templates" element={<TemplateCatalog />} />
        <Route path="/observability" element={<Observability />} />
        <Route path="/secure/service-onboarding" element={<ServiceOnboardingLanding />} />
        <Route path="/secure/service-onboarding/runs/:slug" element={<ServiceOnboardingLanding />} />
        <Route path="/secure/service-onboarding/runs/:slug/files/:phase" element={<ServiceOnboardingFileViewer />} />
        <Route path="/secure/guardrails" element={<Guardrails initialTab="templates" />} />
        <Route path="/secure/guardrails/create" element={<Guardrails initialTab="builder" />} />
        <Route path="/secure/guardrails/observability" element={<Guardrails initialTab="observability" />} />
        <Route path="/secure/policy" element={<Policy />} />
        <Route path="/deployments" element={<DeploymentList />} />
        <Route path="/deployments/create" element={<DeploymentCreate />} />
        <Route path="/deployments/:id" element={<DeploymentDetail />} />
        <Route path="/docs" element={<Documentation />} />
        <Route path="/docs/:section" element={<Documentation />} />
      </Routes>
        </div>
      </main>
    </div>
    </UserProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AuthGate />
      </Router>
    </AuthProvider>
  );
}

export default App;
