/**
 * TrustStack3Layer — 3-Layer Trust Stack view for AVA Platform
 *
 * Shows ACTUAL implementation status of AVA capabilities:
 * - Layer 1 (75%): Guardrails done, Service Onboarding done, Tools coming, Knowledge partial
 * - Layer 2 (85%): FSI Foundry done, Deployments done, Custom Agents coming, Model Registry UI-only
 * - Layer 3 (45%): Frontier Agents 2/3, Govern UI ready but needs backend data
 *
 * Status markers: 'done' (implemented), 'partial' (UI-only / coming soon), 'todo' (not started)
 *
 * Integration opportunities from AI Trust Platform:
 * - Explainability engine (LIME, SHAP, adverse action notices)
 * - Live compliance control tracking (not just framework mapping)
 * - Real-time agent monitoring with actual metrics
 * - Model inventory with attestation workflow
 */
import { useState } from 'react';
import { Icon, type IconName } from './icons';

type Status = 'done' | 'partial' | 'todo';

interface Capability {
  status: Status;
  text: string;
}

function statusIcon(status: Status) {
  if (status === 'done') return <Icon name="check-circle" className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} />;
  if (status === 'partial') return <Icon name="circle-half" className="w-3.5 h-3.5 text-amber-500" strokeWidth={2} />;
  return <Icon name="circle" className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />;
}

// ─────────────────────────── Types ───────────────────────────
interface KPI {
  label: string;
  value: string | number;
  sub: string;
  color: string;
}

interface Module {
  label: string;
  icon: IconName;
  desc: string;
  route?: string;
}

interface KeyControl {
  id: string;
  name: string;
  status: 'Active' | 'Pending' | 'Review';
}

interface AwsServiceMapping {
  service: string;
  challenge: string;
  solves: string;
  features: string[];
}

interface LoDActivity {
  title: string;
  how: string;
}

interface LineOfDefense {
  role: string;
  subtitle: string;
  activities: LoDActivity[];
}

interface ThreeLoD {
  first: LineOfDefense;
  second: LineOfDefense;
  third: LineOfDefense;
}

interface FrontierAgent {
  agent: string;
  role: string;
  description: string;
  capabilities: string[];
  govRelevance: string;
  status: 'Available' | 'Coming Soon' | 'Preview';
}

interface Layer {
  id: number;
  label: string;
  name: string;
  question: string;
  color: string;
  bgGradient: string;
  score: number;
  kpis: KPI[];
  capabilities: Capability[];
  modules: Module[];
  keyControls: KeyControl[];
  awsServices: string[];
  awsServiceMap: AwsServiceMapping[];
  threeLoD: ThreeLoD;
  frontierAgents?: FrontierAgent[];
  oldLayers: string[];
}

// ─────────────────────────── Readiness scores ───────────────────────────
// Scores reflect actual implementation status: implemented features vs planned
const l1Score = 75; // Guardrails implemented, compliance framework UI ready
const l2Score = 85; // FSI Foundry + deployments fully implemented
const l3Score = 45; // Govern UI with mock data, needs backend integration
const overallScore = Math.round((l1Score + l2Score + l3Score) / 3);

// ─────────────────────────── 3-Layer Data (AVA actual implementation status) ───────────────────────────
const LAYERS: Layer[] = [
  {
    id: 3,
    label: 'LAYER 3',
    name: 'Observe and Scale',
    question: 'How can we explain AI decisions, govern autonomous actions, and prove compliance?',
    color: '#3b82f6', // blue-500 — Layer 3 (Scale)
    bgGradient: 'from-blue-50 to-slate-50',
    score: l3Score,
    kpis: [
      { label: 'Frontier Agents', value: '2/3', sub: '1 coming soon', color: '#1e40af' },
      { label: 'Govern UI', value: 'Ready', sub: 'mock data', color: '#1e3a8a' },
      { label: 'Risk Heatmap', value: 'Ready', sub: 'needs backend', color: '#1e40af' },
      { label: 'FinOps', value: 'Ready', sub: 'needs backend', color: '#1d4ed8' },
    ],
    capabilities: [
      { status: 'done',    text: 'AWS DevOps Agent — incident investigation, root cause analysis (Available)' },
      { status: 'done',    text: 'AWS Security Agent — design review, code review, pen testing (Available)' },
      { status: 'partial', text: 'Kiro IDE — spec-driven development, autonomous agents (Coming Soon)' },
      { status: 'partial', text: 'Governance Command Center UI — risk heatmap, compliance, FinOps (UI ready, needs live data)' },
      { status: 'partial', text: 'Agent fleet observability — health, metrics, incident tracking (UI ready, needs backend)' },
      { status: 'todo',    text: 'Explainability — LIME, SHAP, adverse action notices (Not yet implemented)' },
    ],
    modules: [
      { label: 'Frontier Agents',  icon: 'cpu-chip',         desc: '2 available, Kiro coming', route: '/aaas/aws-agents' },
      { label: 'Govern Dashboard', icon: 'chart-bar',        desc: 'UI ready, mock data',      route: '/govern' },
      { label: 'FinOps',           icon: 'currency-dollar',  desc: 'UI ready, needs backend',  route: '/govern/finops' },
      { label: 'Audit Trail',      icon: 'clipboard-list',   desc: 'UI ready, needs backend',  route: '/govern/audit' },
    ],
    keyControls: [
      { id: 'OBS-001', name: 'Frontier Agent Deployment', status: 'Active' },
      { id: 'OBS-002', name: 'Govern UI Components', status: 'Active' },
      { id: 'OBS-003', name: 'Live Data Integration', status: 'Pending' },
      { id: 'OBS-004', name: 'Explainability Engine', status: 'Pending' },
    ],
    awsServices: ['Bedrock AgentCore', 'CloudWatch', 'CloudTrail', 'Cost Explorer'],
    awsServiceMap: [
      { service: 'Amazon Bedrock AgentCore', challenge: 'How do we govern autonomous agents at scale?', solves: 'Agent runtime, memory, tool orchestration, and fleet management with full observability', features: ['Agent Runtime', 'Session Memory', 'Tool Registry (MCP)', 'Observability API', 'Fleet Management'] },
      { service: 'Amazon CloudWatch', challenge: 'How do we know when AI systems degrade?', solves: 'Real-time metrics, alarms, dashboards for latency, errors, drift, and quality scores', features: ['Custom AI Metrics', 'Composite Alarms', 'Real-time Dashboards', 'Anomaly Detection', 'Logs Insights'] },
      { service: 'AWS CloudTrail', challenge: 'How do we prove every AI action was logged?', solves: 'Immutable audit trail for every Bedrock invocation — 7-year retention for regulators', features: ['Management Events', 'Data Events', 'CloudTrail Lake', 'Organization Trail', 'Tamper Detection'] },
      { service: 'AWS Cost Explorer', challenge: 'How do we govern AI spend across business units?', solves: 'Per-model cost tracking, BU budgets, showback/chargeback, optimization recommendations', features: ['Cost Allocation Tags', 'Budget Alerts', 'Savings Plans', 'Forecasting', 'Anomaly Detection'] },
    ],
    threeLoD: {
      first: {
        role: '1st Line — Business & Development',
        subtitle: 'Model owners, AI/ML engineers, agent developers',
        activities: [
          { title: 'Day-to-day performance monitoring', how: 'Set CloudWatch alarms for drift >7%, latency p99 >5s, error rate >1%' },
          { title: 'Agent development & tool integration', how: 'Deploy via AgentCore, configure MCP tools, set up 13 evaluators for quality' },
          { title: 'Incident detection & first response', how: 'Use SSM runbook for auto-disable, SNS alerting within SLA' },
          { title: 'Cost tracking & optimization', how: 'Tag invocations with cost-center/BU, set AWS Budgets alerts per BU' },
        ],
      },
      second: {
        role: '2nd Line — Risk & Compliance',
        subtitle: 'CRO, CCO, MRM team, fair lending officer',
        activities: [
          { title: 'Fair lending & bias monitoring', how: 'Run paired tests (same app, different demographics), verify DI ratio >0.80' },
          { title: 'Agent policy governance', how: 'Review Cedar policies for completeness, test with Policy Simulator' },
          { title: 'Consumer protection oversight', how: 'Monitor complaint trends, verify 15/60-day SLA compliance' },
          { title: 'Regulatory exam preparation', how: 'Maintain evidence bundles, verify documentation is current' },
        ],
      },
      third: {
        role: '3rd Line — Internal Audit',
        subtitle: 'Internal audit, external auditors, regulators',
        activities: [
          { title: 'Audit trail integrity', how: 'Query CloudTrail in Athena, verify SHA-256 evidence hashes' },
          { title: 'Red team review', how: 'Review adversarial test results, verify HIGH/CRITICAL findings remediated' },
          { title: 'Trust Score validation', how: 'Re-run eval independently, compare against reported scores' },
          { title: 'Incident post-mortem', how: 'Review playbooks, verify tabletop results, check notification SLAs' },
        ],
      },
    },
    frontierAgents: [
      {
        agent: 'AWS DevOps Agent',
        role: 'Autonomous incident resolution',
        description: 'Always-available operations teammate that resolves and proactively prevents incidents across AWS, multicloud, and on-prem.',
        capabilities: ['Automatic incident triage', 'Root cause analysis', 'Correlated alarm grouping', 'Mitigation with rollback', 'Cross-agent handoff'],
        govRelevance: 'Reduces MTTR for AI system incidents. Provides audit trail of every investigation. Ensures AI infrastructure reliability meets SLAs.',
        status: 'Available',
      },
      {
        agent: 'AWS Security Agent',
        role: 'Continuous security validation',
        description: 'Proactively secures applications with context-aware penetration testing and automated security reviews.',
        capabilities: ['On-demand pen testing', 'Automated security reviews', 'Vulnerability discovery', 'OWASP LLM Top 10 validation', '90%+ faster security testing'],
        govRelevance: 'Validates AI application security continuously. Ensures guardrail bypass attempts are caught. Tests agent authorization boundaries.',
        status: 'Available',
      },
      {
        agent: 'Kiro IDE',
        role: 'Governed AI-assisted development',
        description: 'Spec-driven development with governance hooks — requirements → design → implementation with compliance checks at every step.',
        capabilities: ['Spec-driven development', 'Pre-commit governance hooks', 'Steering files for standards', 'Multi-file refactoring', 'IaC generation'],
        govRelevance: 'Enforces coding standards during development. Hooks ensure every code change passes compliance checks before commit.',
        status: 'Coming Soon',
      },
    ],
    oldLayers: ['L5 — Explainability', 'L6 — AI Operations', 'L7 — Agentic Operations'],
  },
  {
    id: 2,
    label: 'LAYER 2',
    name: 'Build a Path to Production',
    question: 'How can we govern every AI system through a structured lifecycle?',
    color: '#1d4ed8', // blue-700 — Layer 2 (Production)
    bgGradient: 'from-blue-100/60 to-slate-50',
    score: l2Score,
    kpis: [
      { label: 'Use Cases',       value: 34,      sub: 'deployable',   color: '#1e40af' },
      { label: 'Frameworks',      value: 4,       sub: 'agent SDKs',   color: '#1e3a8a' },
      { label: 'Deploy Patterns', value: 3,       sub: 'IaC ready',    color: '#1d4ed8' },
      { label: 'Custom Agents',   value: 'Soon',  sub: 'coming soon',  color: '#b45309' },
    ],
    capabilities: [
      { status: 'done',    text: 'FSI Foundry: 34 use cases across Banking, Risk, Capital Markets, Insurance, Ops, Moderntic' },
      { status: 'done',    text: 'Dual-framework: LangGraph/LangChain + Strands (CrewAI, LlamaIndex available)' },
      { status: 'done',    text: 'Deployment: EC2 + ALB, Step Functions + Lambda, Bedrock AgentCore' },
      { status: 'done',    text: 'IaC generation: CDK, CloudFormation, Terraform templates' },
      { status: 'partial', text: 'Custom Agent Builder — UI ready, deployment orchestration coming soon' },
      { status: 'partial', text: 'Model Registry — UI with mock data, needs live inventory integration' },
    ],
    modules: [
      { label: 'FSI Foundry',    icon: 'building-office',     desc: '34 use cases, deploy now',  route: '/applications/fsi-foundry' },
      { label: 'Deployments',    icon: 'rocket-launch',       desc: '3 patterns, IaC ready',     route: '/applications' },
      { label: 'Custom Agents',  icon: 'wrench-screwdriver',  desc: 'UI ready, deploy coming',   route: '/aaas/custom' },
      { label: 'Model Registry', icon: 'clipboard-list',      desc: 'UI ready, mock data',       route: '/govern/models' },
    ],
    keyControls: [
      { id: 'PRD-001', name: 'FSI Foundry Catalog', status: 'Active' },
      { id: 'PRD-002', name: 'Multi-Framework Support', status: 'Active' },
      { id: 'PRD-003', name: 'IaC Deployment Patterns', status: 'Active' },
      { id: 'PRD-004', name: 'Custom Agent Deployment', status: 'Pending' },
    ],
    awsServices: ['Bedrock AgentCore', 'Step Functions', 'Lambda', 'EC2', 'ALB', 'CDK'],
    awsServiceMap: [
      { service: 'Amazon Bedrock AgentCore Registry', challenge: 'How do we inventory all AI assets?', solves: 'Complete AI inventory: models, agents, MCP servers, tools, skills — OSFI E-23 compliant', features: ['Model Registry', 'Agent Registry', 'Tool Registry', 'Version Tracking', 'Metadata & Tags'] },
      { service: 'Amazon Bedrock Evaluation', challenge: 'How do we validate models we didn\'t build?', solves: 'LLM-as-Judge scoring with FSI-specific metrics — independent validation', features: ['Automatic Evaluation', 'Human Evaluation', 'Custom Metrics', 'Model Comparison', 'CI/CD Integration'] },
      { service: 'Amazon Bedrock Guardrails', challenge: 'How do we enforce content policies at inference?', solves: 'Topic denial, content filters, PII redaction, prompt attack detection per use case', features: ['Content Filters', 'Denied Topics', 'PII Redaction', 'Prompt Attack Detection', 'Grounding Check'] },
      { service: 'AWS Step Functions', challenge: 'How do we enforce stage gates in governance?', solves: 'Orchestrated workflow — requirements must be met before advancement, no shortcuts', features: ['Visual Workflow', 'Choice States', 'Wait States', 'Error Handling', 'Full Audit Trail'] },
    ],
    threeLoD: {
      first: {
        role: '1st Line — Business & Development',
        subtitle: 'Model owners, AI/ML engineers, data scientists',
        activities: [
          { title: 'Use case lifecycle management', how: 'Submit via Registry, advance through 9-stage pipeline with evidence at each gate' },
          { title: 'Model selection & deployment', how: 'Run ListFoundationModels, pin version IDs, create evaluator jobs via Bedrock API' },
          { title: 'Guardrails configuration', how: 'Create guardrail with content filters, PII entities, denied topics per use case' },
          { title: 'Evaluation execution', how: 'Build FSI test cases, run Bedrock Evaluation with LLM-as-Judge metrics' },
        ],
      },
      second: {
        role: '2nd Line — Risk & Compliance',
        subtitle: 'CRO, CCO, MRM team, DPO',
        activities: [
          { title: 'Independent model validation', how: 'Run same eval suite against 2-3 challenger models, compare weighted scores' },
          { title: 'Framework compliance assessment', how: 'Map controls to 6 frameworks in Compliance Center, run gap analysis quarterly' },
          { title: 'Service approval gate reviews', how: 'Review at each gate: Risk, Security, Compliance, Architecture, Executive' },
          { title: 'Third-party risk management', how: 'Review DDQs for model providers, assess concentration risk, verify no-training terms' },
        ],
      },
      third: {
        role: '3rd Line — Internal Audit',
        subtitle: 'Internal audit, external auditors, board',
        activities: [
          { title: 'Evidence package verification', how: 'Check artifacts across all layers for completeness, currency, integrity' },
          { title: 'Control objective assessment', how: 'Independently assess CRI FS objectives, validate maturity scores' },
          { title: 'MRM framework review', how: 'Verify 3 lines operate independently, check for conflicts of interest' },
          { title: 'Concentration risk audit', how: 'Verify methodology, confirm fallback models tested within 90 days' },
        ],
      },
    },
    oldLayers: ['L3 — Model Assurance', 'L4 — Governance & Risk'],
  },
  {
    id: 1,
    label: 'LAYER 1',
    name: 'Establish a Secure Foundation',
    question: 'How do we establish a secure, responsible, and scalable foundation for AI?',
    color: '#1e3a8a', // blue-900 — Layer 1 (Foundation)
    bgGradient: 'from-slate-100/70 to-slate-50',
    score: l1Score,
    kpis: [
      { label: 'Guardrail Builder', value: 'Live',  sub: '5 types',     color: '#1d4ed8' },
      { label: 'PII Detection',     value: 'Live',  sub: '12 entities', color: '#1e3a8a' },
      { label: 'Tools',             value: '0/6',   sub: 'coming soon', color: '#b45309' },
      { label: 'Knowledge',         value: '3/6',   sub: '3 coming',    color: '#1e40af' },
    ],
    capabilities: [
      { status: 'done',    text: 'Guardrail Builder: Content filters, PII detection, denied topics, word filters, grounding' },
      { status: 'done',    text: 'Guardrail Templates: Create, list, deploy to Bedrock Guardrails' },
      { status: 'done',    text: 'Live Preview: Test guardrails before deployment' },
      { status: 'done',    text: 'Service Onboarding: Guided AI service approval workflow' },
      { status: 'partial', text: 'Tools Factory: MCP Gateway, Code Exec, Browser, APIs (Coming Soon)' },
      { status: 'partial', text: 'Knowledge: 3 available, 3 coming (Credit Memos, Adverse Media, Gov Events)' },
    ],
    modules: [
      { label: 'Guardrails',         icon: 'shield-check',        desc: 'Builder + templates + preview', route: '/secure/guardrails' },
      { label: 'Service Onboarding', icon: 'check-circle',        desc: 'AI service approval',           route: '/secure/service-onboarding' },
      { label: 'Tools',              icon: 'wrench-screwdriver',  desc: '6 tools coming soon',           route: '/capabilities/tools' },
      { label: 'Knowledge',          icon: 'book-open',           desc: '3 available, 3 coming',         route: '/capabilities/knowledge' },
    ],
    keyControls: [
      { id: 'FND-001', name: 'Guardrail Builder', status: 'Active' },
      { id: 'FND-002', name: 'PII Detection (12 types)', status: 'Active' },
      { id: 'FND-003', name: 'Service Onboarding Flow', status: 'Active' },
      { id: 'FND-004', name: 'Tools Factory', status: 'Pending' },
    ],
    awsServices: ['Bedrock Guardrails', 'IAM', 'Cognito', 'KMS', 'S3', 'Textract'],
    awsServiceMap: [
      { service: 'Amazon Bedrock Guardrails', challenge: 'How do we prevent harmful outputs?', solves: 'Content filters, topic denial, PII/PHI redaction before model input — 14 PHI types', features: ['Content Filters (4 categories)', 'Denied Topics', 'PII Filters (14 types)', 'Word Filters', 'Grounding Check'] },
      { service: 'AWS IAM', challenge: 'How do we enforce least-privilege access?', solves: 'Service-specific roles with resource policies — no wildcard, per-model access control', features: ['Service Roles', 'Resource Policies', 'Permission Boundaries', 'IAM Access Analyzer', 'SCPs'] },
      { service: 'AWS KMS', challenge: 'How do we encrypt AI data at rest and in transit?', solves: 'AES-256 at rest, TLS 1.3 in transit — customer-managed keys for all Bedrock data', features: ['Customer Managed Keys', 'Auto Key Rotation', 'Encryption Context', 'Multi-Region Keys', 'CloudTrail Logging'] },
      { service: 'AWS Security Hub', challenge: 'How do we assess security posture?', solves: 'Aggregated findings from 50+ services, compliance scoring, prioritized remediation', features: ['Security Best Practices', 'CIS Benchmarks', 'Automated Findings', 'Custom Actions', 'Compliance Score'] },
    ],
    threeLoD: {
      first: {
        role: '1st Line — Business & Development',
        subtitle: 'Platform engineers, data engineers, AI/ML engineers',
        activities: [
          { title: 'Guardrails configuration', how: 'Create Bedrock Guardrails with content filters, PII detection, denied topics per use case' },
          { title: 'Data classification & privacy', how: 'Configure Macie for S3 scanning, classify data types across sensitivity levels' },
          { title: 'IAM & network security', how: 'Create service roles with resource policies, configure VPC PrivateLink, enable KMS CMKs' },
          { title: 'Model inventory management', how: 'Register all models in Registry with owner, risk tier, version, provenance' },
        ],
      },
      second: {
        role: '2nd Line — Risk & Compliance',
        subtitle: 'CISO, DPO, compliance officers',
        activities: [
          { title: 'Data protection compliance', how: 'Validate HIPAA Safe Harbor (18 identifiers), assess PCI DSS Req 3.3, conduct DPIA' },
          { title: 'Guardrail coverage validation', how: 'Map guardrail policies to regulatory requirements, verify no gaps' },
          { title: 'Security posture review', how: 'Review Security Hub findings, map controls to frameworks, validate Config rules' },
          { title: 'Vendor concentration assessment', how: 'Review DDQs for providers, assess concentration risk (78% threshold), verify exit strategies' },
        ],
      },
      third: {
        role: '3rd Line — Internal Audit',
        subtitle: 'Internal audit, external auditors, regulators',
        activities: [
          { title: 'Penetration testing', how: 'Run adversarial prompt injection tests, verify guardrails cannot be circumvented' },
          { title: 'Encryption audit', how: 'Verify AES-256 at rest, TLS 1.3 in transit, audit KMS key rotation' },
          { title: 'IAM least-privilege verification', how: 'Run IAM Access Analyzer, verify no wildcard permissions, audit cross-account access' },
          { title: 'DR & incident response', how: 'Test failover procedures, verify RTO/RPO targets, audit playbook execution' },
        ],
      },
    },
    oldLayers: ['L1 — Infrastructure Security', 'L2 — Data Protection'],
  },
];


// ─────────────────────────── Score Colors ───────────────────────────
function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-rose-600';
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-100';
  if (score >= 60) return 'bg-amber-100';
  return 'bg-rose-100';
}

// ─────────────────────────── Component ───────────────────────────
export default function TrustStack3Layer() {
  const [focusLayer, setFocusLayer] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {/* Header with overall score */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">3-Layer Trust Stack</h2>
          <p className="text-xs text-slate-500">Foundation → Production → Scale: controls, AWS services, and 3 Lines of Defense</p>
        </div>
        <div className="flex items-center gap-4">
          <a href="/govern/command-center" className="text-xs text-blue-600 hover:text-blue-800 font-medium">
            ← Command Center
          </a>
          <div className="text-center">
            <div className={`text-2xl font-bold ${scoreColor(overallScore)}`}>{overallScore}%</div>
            <div className="text-[9px] text-slate-400 uppercase tracking-wide">Trust Readiness</div>
          </div>
        </div>
      </div>

      {/* Trust Stack Model — explains the 3 layers */}
      {!focusLayer && (
        <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-slate-50 rounded-xl border border-blue-200/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">The 3-Layer Trust Stack</span>
            <span className="text-[10px] text-slate-400">Click a layer below to explore details</span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-1 rounded-full bg-gradient-to-r from-blue-900 via-blue-700 to-blue-500" />
            <span className="text-[10px] text-slate-500">Foundation → Production → Scale</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { step: '1', title: 'Layer 1: Foundation', desc: 'Guardrails, encryption, data protection, vendor assessment', color: '#1e3a8a', layer: 1 },
              { step: '2', title: 'Layer 2: Production', desc: 'Use case registry, model evaluation, risk tiering, evidence', color: '#1d4ed8', layer: 2 },
              { step: '3', title: 'Layer 3: Scale', desc: 'Monitoring, explainability, agent governance, compliance', color: '#3b82f6', layer: 3 },
              { step: '→', title: 'Prove Compliance', desc: 'Export evidence packages for regulators and auditors', color: '#475569', layer: null },
            ].map((s, i) => (
              <button
                key={i}
                onClick={() => s.layer && setFocusLayer(s.layer)}
                className="flex gap-2 text-left p-2 rounded-lg hover:bg-white/60 transition-colors"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: s.color }}
                >
                  {s.step}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800">{s.title}</div>
                  <div className="text-[10px] text-slate-500 leading-tight">{s.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Back button when focused */}
      {focusLayer && (
        <button
          onClick={() => setFocusLayer(null)}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          ← Back to Overview
        </button>
      )}

      {/* Layer Cards */}
      <div className="space-y-3">
        {LAYERS.filter(layer => focusLayer ? layer.id === focusLayer : true).map((layer) => (
          <div
            key={layer.id}
            onClick={() => !focusLayer && setFocusLayer(layer.id)}
            className={`bg-gradient-to-r ${layer.bgGradient} rounded-xl border shadow-sm overflow-hidden transition-all ${
              !focusLayer ? 'cursor-pointer hover:shadow-md hover:scale-[1.005]' : ''
            }`}
            style={{ borderColor: `${layer.color}40`, borderLeftWidth: '4px', borderLeftColor: layer.color }}
          >
            {/* Layer Header */}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                      style={{ background: layer.color }}
                    >
                      {layer.label}
                    </span>
                    <span className="text-base font-semibold text-slate-900">{layer.name}</span>
                    {!focusLayer && <span className="text-slate-400">→</span>}
                  </div>
                  <p className="text-xs italic" style={{ color: layer.color }}>
                    "{layer.question}"
                  </p>

                  {/* KPI Strip */}
                  <div className="flex gap-4 mt-3">
                    {layer.kpis.map((kpi, i) => (
                      <div key={i} className="text-center">
                        <div className="text-lg font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
                        <div className="text-[9px] text-slate-500 uppercase">{kpi.label}</div>
                        <div className="text-[8px] text-slate-400">{kpi.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Readiness Score */}
                <div className="text-center ml-4">
                  <div className={`text-2xl font-bold ${scoreColor(layer.score)}`}>{layer.score}%</div>
                  <div className="text-[9px] text-slate-400 uppercase">Readiness</div>
                  <div className={`mt-1 h-1.5 w-16 rounded-full ${scoreBg(layer.score)}`}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${layer.score}%`, background: layer.color }}
                    />
                  </div>
                </div>
              </div>

              {/* Modules Grid — always shown */}
              <div className="flex gap-2 mt-4 flex-wrap">
                {layer.modules.map((mod, i) => {
                  const Wrapper = mod.route ? 'a' : 'div';
                  return (
                    <Wrapper
                      key={i}
                      {...(mod.route ? { href: mod.route } : {})}
                      className="flex-1 min-w-[140px] p-2.5 rounded-lg bg-white/70 border border-slate-200/70 hover:border-blue-400 hover:shadow-sm transition-all"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span style={{ color: layer.color }} className="flex items-center">
                          <Icon name={mod.icon} className="w-3.5 h-3.5" strokeWidth={2} />
                        </span>
                        <span className="text-xs font-semibold text-slate-800">{mod.label}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{mod.desc}</div>
                    </Wrapper>
                  );
                })}
              </div>

              {/* AWS Services Strip */}
              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <Icon name="cloud" className="w-3 h-3 text-slate-400" strokeWidth={2} />
                  Powered by
                </span>
                {layer.awsServices.map((svc, i) => (
                  <span key={i} className="px-1.5 py-0.5 text-[9px] rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {svc}
                  </span>
                ))}
              </div>
            </div>

            {/* Expanded Details — only when focused */}
            {focusLayer === layer.id && (
              <div className="border-t border-slate-200/60 p-4 bg-white/40">
                {/* Capabilities */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2" style={{ color: layer.color }}>
                    Capabilities
                  </h4>
                  <div className="space-y-1.5">
                    {layer.capabilities.map((cap, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className="mt-0.5 flex-shrink-0">{statusIcon(cap.status)}</span>
                        <span>{cap.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AWS Services — Challenge Mapping */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      AWS Services — How They Solve Each Challenge
                    </h4>
                    <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {layer.awsServiceMap.length} services
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {layer.awsServiceMap.map((svc, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-white/85 border border-slate-200 border-l-[3px]"
                        style={{ borderLeftColor: layer.color }}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon name="cloud" className="w-3.5 h-3.5 text-slate-500" strokeWidth={2} />
                          <span className="text-xs font-bold text-slate-800">{svc.service}</span>
                        </div>
                        <div className="text-[10px] italic mb-1" style={{ color: layer.color }}>{svc.challenge}</div>
                        <div className="text-[10px] text-slate-600 leading-snug mb-2">{svc.solves}</div>
                        <div className="border-t border-slate-200/60 pt-1.5">
                          <div className="text-[8px] text-slate-400 uppercase tracking-wide mb-1">Implement</div>
                          <div className="flex flex-wrap gap-1">
                            {svc.features.map((feat, fi) => (
                              <span
                                key={fi}
                                className="text-[8px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200"
                              >
                                {feat}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Controls */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Key Controls</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {layer.keyControls.map((ctrl, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200/60">
                        <div>
                          <span className="text-[10px] text-blue-600 font-mono">{ctrl.id}</span>
                          <span className="text-xs text-slate-700 ml-2">{ctrl.name}</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">{ctrl.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Frontier Agents — only for layers that have them */}
                {layer.frontierAgents && layer.frontierAgents.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-violet-600 uppercase tracking-wide">
                        AWS Frontier Agents
                      </h4>
                      <span className="text-[10px] text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded">
                        Autonomous AI Workers
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {layer.frontierAgents.map((fa, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-lg bg-white/80 border border-violet-200/60 border-t-2 border-t-violet-400"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-800">{fa.agent}</span>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                              fa.status === 'Available'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {fa.status}
                            </span>
                          </div>
                          <div className="text-[9px] text-violet-600 font-medium mb-1">{fa.role}</div>
                          <div className="text-[9px] text-slate-500 leading-snug mb-2">{fa.description}</div>

                          <div className="text-[8px] text-slate-400 uppercase tracking-wide mb-1">Capabilities</div>
                          <div className="space-y-0.5 mb-2">
                            {fa.capabilities.slice(0, 4).map((cap, ci) => (
                              <div key={ci} className="text-[8px] text-slate-600 pl-2 border-l border-violet-200">
                                {cap}
                              </div>
                            ))}
                            {fa.capabilities.length > 4 && (
                              <div className="text-[8px] text-slate-400 pl-2">+{fa.capabilities.length - 4} more</div>
                            )}
                          </div>

                          <div className="p-1.5 rounded bg-violet-50 border border-violet-100">
                            <div className="text-[8px] text-violet-600 font-medium mb-0.5">Governance Relevance</div>
                            <div className="text-[8px] text-slate-600 leading-snug">{fa.govRelevance}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3 Lines of Defense */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                    3 Lines of Defense
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { lod: layer.threeLoD.first, color: '#3b82f6', borderColor: 'border-t-blue-400' },
                      { lod: layer.threeLoD.second, color: '#f59e0b', borderColor: 'border-t-amber-400' },
                      { lod: layer.threeLoD.third, color: '#ef4444', borderColor: 'border-t-rose-400' },
                    ].map(({ lod, color, borderColor }, i) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-lg bg-white/80 border border-slate-200/60 border-t-2 ${borderColor}`}
                      >
                        <div className="text-[10px] font-semibold mb-0.5" style={{ color }}>
                          {lod.role}
                        </div>
                        <div className="text-[8px] text-slate-400 mb-2">{lod.subtitle}</div>
                        <div className="space-y-2">
                          {lod.activities.map((act, j) => (
                            <div
                              key={j}
                              className="pl-2 border-l-2"
                              style={{ borderLeftColor: `${color}40` }}
                            >
                              <div className="text-[9px] font-medium text-slate-700">{act.title}</div>
                              <div className="text-[8px] text-slate-500 leading-snug">
                                <span className="text-blue-600 font-medium">How: </span>
                                {act.how}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legacy Layer Mapping */}
                <div className="pt-3 border-t border-slate-200/60">
                  <span className="text-[10px] text-slate-400">Maps to original layers: </span>
                  {layer.oldLayers.map((ol, i) => (
                    <span key={i} className="text-[10px] text-blue-600 ml-1">{ol}{i < layer.oldLayers.length - 1 ? ',' : ''}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Cross-cutting CTAs — overview mode only */}
      {!focusLayer && (
        <div className="flex gap-3">
          <button className="flex-1 p-3 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <Icon name="map" className="w-5 h-5 text-blue-700" strokeWidth={2} />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">System Trust Map</div>
                <div className="text-[10px] text-slate-500">Trace AI systems across all 3 layers</div>
              </div>
            </div>
          </button>
          <button className="flex-1 p-3 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <Icon name="document-arrow-down" className="w-5 h-5 text-blue-700" strokeWidth={2} />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">Export Evidence Package</div>
                <div className="text-[10px] text-slate-500">Regulator-ready documentation</div>
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
