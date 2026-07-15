/**
 * Risk Management mock data
 *
 * Risk taxonomy based on:
 * - NIST AI RMF risk categories
 * - SR 26-2 model risk dimensions
 * - EU AI Act high-risk considerations
 */

// ─────────────────────────── Types ───────────────────────────

export type RiskCategory =
  | 'model-performance'
  | 'bias-fairness'
  | 'data-quality'
  | 'security'
  | 'privacy'
  | 'operational'
  | 'compliance'
  | 'reputational'
  | 'financial'
  | 'third-party';

export type RiskStatus = 'open' | 'mitigated' | 'accepted' | 'closed';
export type RiskTrend = 'increasing' | 'stable' | 'decreasing';
export type Likelihood = 1 | 2 | 3 | 4 | 5;
export type Severity = 1 | 2 | 3 | 4 | 5;

export type Risk = {
  id: string;
  title: string;
  description: string;
  category: RiskCategory;
  status: RiskStatus;
  owner: string;
  ownerRole: string;
  inherentLikelihood: Likelihood;
  inherentSeverity: Likelihood;
  inherentScore: number;
  residualLikelihood: Likelihood;
  residualSeverity: Severity;
  residualScore: number;
  trend: RiskTrend;
  controlIds: string[];
  affectedAssets: string[];
  dateIdentified: string;
  lastReviewed: string;
  nextReview: string;
  notes?: string;
};

export type Control = {
  id: string;
  name: string;
  description: string;
  type: 'preventive' | 'detective' | 'corrective';
  category: RiskCategory;
  status: 'implemented' | 'partial' | 'planned' | 'not-implemented';
  effectiveness: 'high' | 'medium' | 'low';
  owner: string;
  evidence?: string;
  evidenceLink?: string;
  lastTested?: string;
  riskIds: string[];
  frameworks: string[];
};

export type Issue = {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'remediated' | 'closed';
  source: 'audit' | 'assessment' | 'incident' | 'self-identified';
  riskId?: string;
  controlId?: string;
  owner: string;
  dueDate: string;
  dateIdentified: string;
  remediation?: string;
};

export type Assessment = {
  id: string;
  name: string;
  type: 'initial' | 'periodic' | 'change-triggered';
  status: 'draft' | 'in-progress' | 'completed' | 'approved';
  scope: string;
  assessor: string;
  startDate: string;
  completedDate?: string;
  risksIdentified: number;
  controlsEvaluated: number;
  findings: number;
};

// ─────────────────────────── Constants ───────────────────────────

export const RISK_CATEGORIES: { id: RiskCategory; name: string; icon: string; color: string }[] = [
  { id: 'model-performance', name: 'Model Performance', icon: '📊', color: '#3b82f6' },
  { id: 'bias-fairness', name: 'Bias & Fairness', icon: '⚖️', color: '#8b5cf6' },
  { id: 'data-quality', name: 'Data Quality', icon: '🗃️', color: '#06b6d4' },
  { id: 'security', name: 'Security', icon: '🛡️', color: '#ef4444' },
  { id: 'privacy', name: 'Privacy', icon: '🔒', color: '#f59e0b' },
  { id: 'operational', name: 'Operational', icon: '⚙️', color: '#10b981' },
  { id: 'compliance', name: 'Regulatory', icon: '📋', color: '#6366f1' },
  { id: 'reputational', name: 'Reputational', icon: '🏛️', color: '#ec4899' },
  { id: 'financial', name: 'Financial', icon: '💰', color: '#14b8a6' },
  { id: 'third-party', name: 'Third Party', icon: '🤝', color: '#78716c' },
];

export const LIKELIHOOD_LABELS: Record<Likelihood, string> = {
  1: 'Rare',
  2: 'Unlikely',
  3: 'Possible',
  4: 'Likely',
  5: 'Almost Certain',
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  1: 'Negligible',
  2: 'Minor',
  3: 'Moderate',
  4: 'Major',
  5: 'Severe',
};

export const getRiskClass = (score: number): { label: string; color: string; bgColor: string } => {
  if (score >= 20) return { label: 'Critical', color: '#991b1b', bgColor: 'bg-red-100 text-red-800 border-red-200' };
  if (score >= 15) return { label: 'High', color: '#c2410c', bgColor: 'bg-orange-100 text-orange-800 border-orange-200' };
  if (score >= 10) return { label: 'Medium', color: '#a16207', bgColor: 'bg-amber-100 text-amber-800 border-amber-200' };
  if (score >= 5) return { label: 'Low', color: '#15803d', bgColor: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  return { label: 'Very Low', color: '#475569', bgColor: 'bg-slate-100 text-slate-700 border-slate-200' };
};

// ─────────────────────────── Mock Data ───────────────────────────

export const RISKS: Risk[] = [
  {
    id: 'RSK-001',
    title: 'Model produces biased credit decisions',
    description: 'Credit decisioning model may produce disparate outcomes across protected classes, leading to fair lending violations.',
    category: 'bias-fairness',
    status: 'mitigated',
    owner: 'S. Chen',
    ownerRole: 'RAI Council Lead',
    inherentLikelihood: 4,
    inherentSeverity: 5,
    inherentScore: 20,
    residualLikelihood: 2,
    residualSeverity: 5,
    residualScore: 10,
    trend: 'stable',
    controlIds: ['CTL-001', 'CTL-002', 'CTL-003'],
    affectedAssets: ['Credit Risk Agent', 'Loan Origination Model'],
    dateIdentified: '2025-06-15',
    lastReviewed: '2026-05-15',
    nextReview: '2026-08-15',
  },
  {
    id: 'RSK-002',
    title: 'Hallucinated financial advice',
    description: 'Model generates inaccurate or fabricated financial information that could mislead customers or result in regulatory violations.',
    category: 'model-performance',
    status: 'mitigated',
    owner: 'J. Martinez',
    ownerRole: 'ML Platform Lead',
    inherentLikelihood: 3,
    inherentSeverity: 5,
    inherentScore: 15,
    residualLikelihood: 1,
    residualSeverity: 5,
    residualScore: 5,
    trend: 'decreasing',
    controlIds: ['CTL-004', 'CTL-005', 'CTL-006'],
    affectedAssets: ['Trading Assistant', 'Wealth Advisory Agent'],
    dateIdentified: '2025-08-01',
    lastReviewed: '2026-05-10',
    nextReview: '2026-08-10',
  },
  {
    id: 'RSK-003',
    title: 'PII exposure in model outputs',
    description: 'Model may inadvertently expose customer PII in responses, logs, or to downstream systems.',
    category: 'privacy',
    status: 'mitigated',
    owner: 'R. Patel',
    ownerRole: 'Privacy Officer',
    inherentLikelihood: 4,
    inherentSeverity: 4,
    inherentScore: 16,
    residualLikelihood: 2,
    residualSeverity: 4,
    residualScore: 8,
    trend: 'stable',
    controlIds: ['CTL-007', 'CTL-008'],
    affectedAssets: ['Customer Service Agent', 'KYC Banking Agent'],
    dateIdentified: '2025-07-20',
    lastReviewed: '2026-05-01',
    nextReview: '2026-08-01',
  },
  {
    id: 'RSK-004',
    title: 'Prompt injection attacks',
    description: 'Malicious inputs could manipulate model behavior to bypass controls, extract data, or perform unauthorized actions.',
    category: 'security',
    status: 'open',
    owner: 'T. Wilson',
    ownerRole: 'Security Lead',
    inherentLikelihood: 3,
    inherentSeverity: 4,
    inherentScore: 12,
    residualLikelihood: 2,
    residualSeverity: 4,
    residualScore: 8,
    trend: 'increasing',
    controlIds: ['CTL-009', 'CTL-010'],
    affectedAssets: ['All customer-facing agents'],
    dateIdentified: '2025-09-10',
    lastReviewed: '2026-05-20',
    nextReview: '2026-06-20',
    notes: 'Red team exercise scheduled for Q3',
  },
  {
    id: 'RSK-005',
    title: 'Model drift degrades performance',
    description: 'Model performance degrades over time due to data drift, concept drift, or environmental changes.',
    category: 'model-performance',
    status: 'mitigated',
    owner: 'J. Martinez',
    ownerRole: 'ML Platform Lead',
    inherentLikelihood: 4,
    inherentSeverity: 3,
    inherentScore: 12,
    residualLikelihood: 2,
    residualSeverity: 3,
    residualScore: 6,
    trend: 'stable',
    controlIds: ['CTL-011', 'CTL-012'],
    affectedAssets: ['All production models'],
    dateIdentified: '2025-06-01',
    lastReviewed: '2026-04-15',
    nextReview: '2026-07-15',
  },
  {
    id: 'RSK-006',
    title: 'Inadequate model documentation',
    description: 'Insufficient documentation of model design, assumptions, and limitations may impede validation and audit.',
    category: 'compliance',
    status: 'open',
    owner: 'A. Williams',
    ownerRole: 'MRM Committee',
    inherentLikelihood: 3,
    inherentSeverity: 3,
    inherentScore: 9,
    residualLikelihood: 2,
    residualSeverity: 3,
    residualScore: 6,
    trend: 'decreasing',
    controlIds: ['CTL-013'],
    affectedAssets: ['Nova Pro', 'Nova Lite'],
    dateIdentified: '2026-01-15',
    lastReviewed: '2026-05-01',
    nextReview: '2026-06-01',
  },
  {
    id: 'RSK-007',
    title: 'Third-party model vendor risk',
    description: 'Reliance on third-party model providers (Anthropic, Amazon) introduces dependency and limited transparency risks.',
    category: 'third-party',
    status: 'accepted',
    owner: 'M. Garcia',
    ownerRole: 'Vendor Management',
    inherentLikelihood: 2,
    inherentSeverity: 4,
    inherentScore: 8,
    residualLikelihood: 2,
    residualSeverity: 4,
    residualScore: 8,
    trend: 'stable',
    controlIds: ['CTL-014', 'CTL-015'],
    affectedAssets: ['All Bedrock models'],
    dateIdentified: '2025-05-01',
    lastReviewed: '2026-04-01',
    nextReview: '2026-10-01',
    notes: 'Risk accepted per board approval. Multi-vendor strategy in place.',
  },
  {
    id: 'RSK-008',
    title: 'Unexplainable model decisions',
    description: 'Inability to explain model decisions may violate adverse action notice requirements under ECOA.',
    category: 'compliance',
    status: 'open',
    owner: 'S. Chen',
    ownerRole: 'RAI Council Lead',
    inherentLikelihood: 3,
    inherentSeverity: 4,
    inherentScore: 12,
    residualLikelihood: 2,
    residualSeverity: 4,
    residualScore: 8,
    trend: 'decreasing',
    controlIds: ['CTL-016'],
    affectedAssets: ['Credit Risk Agent', 'Loan Origination Model'],
    dateIdentified: '2025-08-15',
    lastReviewed: '2026-05-10',
    nextReview: '2026-06-10',
    notes: 'Explainability module deployment in progress',
  },
  {
    id: 'RSK-009',
    title: 'Cost overrun from uncontrolled usage',
    description: 'Unexpected usage patterns or inefficient prompts may lead to significant cost overruns.',
    category: 'financial',
    status: 'mitigated',
    owner: 'K. Brown',
    ownerRole: 'FinOps Lead',
    inherentLikelihood: 4,
    inherentSeverity: 2,
    inherentScore: 8,
    residualLikelihood: 2,
    residualSeverity: 2,
    residualScore: 4,
    trend: 'stable',
    controlIds: ['CTL-017', 'CTL-018'],
    affectedAssets: ['All agents'],
    dateIdentified: '2025-07-01',
    lastReviewed: '2026-05-01',
    nextReview: '2026-08-01',
  },
  {
    id: 'RSK-010',
    title: 'Training data quality issues',
    description: 'Poor quality, outdated, or biased training data may compromise model accuracy and fairness.',
    category: 'data-quality',
    status: 'mitigated',
    owner: 'D. Lee',
    ownerRole: 'Data Governance',
    inherentLikelihood: 3,
    inherentSeverity: 4,
    inherentScore: 12,
    residualLikelihood: 2,
    residualSeverity: 4,
    residualScore: 8,
    trend: 'stable',
    controlIds: ['CTL-019', 'CTL-020'],
    affectedAssets: ['Fine-tuned models', 'RAG knowledge bases'],
    dateIdentified: '2025-06-15',
    lastReviewed: '2026-04-20',
    nextReview: '2026-07-20',
  },
];

export const CONTROLS: Control[] = [
  {
    id: 'CTL-001',
    name: 'Bias testing on protected classes',
    description: 'Quarterly testing of model outputs across 7 protected classes with disparate impact analysis.',
    type: 'detective',
    category: 'bias-fairness',
    status: 'implemented',
    effectiveness: 'high',
    owner: 'RAI Council',
    evidence: 'Q1 2026 Bias Report',
    lastTested: '2026-04-15',
    riskIds: ['RSK-001'],
    frameworks: ['SR 26-2', 'ECOA', 'NIST AI RMF'],
  },
  {
    id: 'CTL-002',
    name: 'Fair lending monitoring dashboard',
    description: 'Real-time monitoring of approval rates, pricing, and terms across demographic segments.',
    type: 'detective',
    category: 'bias-fairness',
    status: 'implemented',
    effectiveness: 'high',
    owner: 'Fair Lending Team',
    evidence: 'Dashboard active',
    riskIds: ['RSK-001'],
    frameworks: ['ECOA', 'FHA'],
  },
  {
    id: 'CTL-003',
    name: 'Pre-deployment bias review gate',
    description: 'Mandatory bias review before any credit-impacting model goes to production.',
    type: 'preventive',
    category: 'bias-fairness',
    status: 'implemented',
    effectiveness: 'high',
    owner: 'RAI Council',
    evidence: 'Gate checklist v2.1',
    riskIds: ['RSK-001'],
    frameworks: ['SR 26-2', 'ISO 42001'],
  },
  {
    id: 'CTL-004',
    name: 'Dual-framework validation',
    description: 'All model outputs validated by both Bedrock evaluation and DeepEval frameworks.',
    type: 'detective',
    category: 'model-performance',
    status: 'implemented',
    effectiveness: 'high',
    owner: 'ML Platform',
    evidence: '99.2% agreement rate',
    lastTested: '2026-05-01',
    riskIds: ['RSK-002'],
    frameworks: ['SR 26-2', 'NIST AI RMF'],
  },
  {
    id: 'CTL-005',
    name: 'Hallucination detection guardrail',
    description: 'Bedrock Guardrails configured for hallucination detection with 0% threshold.',
    type: 'preventive',
    category: 'model-performance',
    status: 'implemented',
    effectiveness: 'high',
    owner: 'Platform',
    evidence: 'Guardrail config GR-004',
    riskIds: ['RSK-002'],
    frameworks: ['NIST AI RMF'],
  },
  {
    id: 'CTL-006',
    name: 'Grounding to knowledge base',
    description: 'Financial advice responses grounded to approved knowledge base with citation requirements.',
    type: 'preventive',
    category: 'model-performance',
    status: 'implemented',
    effectiveness: 'medium',
    owner: 'ML Platform',
    evidence: 'KB-Finance active',
    riskIds: ['RSK-002'],
    frameworks: ['NIST AI RMF'],
  },
  {
    id: 'CTL-007',
    name: 'PII detection and redaction',
    description: 'Bedrock Guardrails configured to detect and redact PII entities (SSN, account numbers, etc.).',
    type: 'preventive',
    category: 'privacy',
    status: 'implemented',
    effectiveness: 'high',
    owner: 'Platform',
    evidence: 'Guardrail config GR-001',
    riskIds: ['RSK-003'],
    frameworks: ['GLBA', 'CCPA', 'NYDFS 500'],
  },
  {
    id: 'CTL-008',
    name: 'Output logging with PII masking',
    description: 'All model outputs logged with automatic PII masking before storage.',
    type: 'preventive',
    category: 'privacy',
    status: 'implemented',
    effectiveness: 'high',
    owner: 'Platform',
    evidence: 'Langfuse config',
    riskIds: ['RSK-003'],
    frameworks: ['GLBA', 'SOC 2'],
  },
  {
    id: 'CTL-009',
    name: 'Input validation and sanitization',
    description: 'All user inputs validated and sanitized before model processing.',
    type: 'preventive',
    category: 'security',
    status: 'implemented',
    effectiveness: 'medium',
    owner: 'Security',
    evidence: 'Input filter v3',
    riskIds: ['RSK-004'],
    frameworks: ['NIST AI RMF', 'SOC 2'],
  },
  {
    id: 'CTL-010',
    name: 'Prompt injection detection',
    description: 'ML-based detection of prompt injection attempts with blocking.',
    type: 'detective',
    category: 'security',
    status: 'partial',
    effectiveness: 'medium',
    owner: 'Security',
    evidence: 'Detector v1.2 — 87% accuracy',
    lastTested: '2026-04-01',
    riskIds: ['RSK-004'],
    frameworks: ['NIST AI RMF'],
  },
  {
    id: 'CTL-011',
    name: 'Model performance monitoring',
    description: 'Continuous monitoring of model accuracy, latency, and error rates with alerting.',
    type: 'detective',
    category: 'model-performance',
    status: 'implemented',
    effectiveness: 'high',
    owner: 'Platform',
    evidence: 'CloudWatch dashboards',
    riskIds: ['RSK-005'],
    frameworks: ['SR 26-2', 'NIST AI RMF'],
  },
  {
    id: 'CTL-012',
    name: 'Drift detection alerts',
    description: 'Automated detection of data and concept drift with 2% threshold alerts.',
    type: 'detective',
    category: 'model-performance',
    status: 'implemented',
    effectiveness: 'high',
    owner: 'ML Platform',
    evidence: 'Drift monitor active',
    lastTested: '2026-05-15',
    riskIds: ['RSK-005'],
    frameworks: ['SR 26-2'],
  },
  {
    id: 'CTL-013',
    name: 'Model card documentation standard',
    description: 'Standardized model card template with mandatory fields for all production models.',
    type: 'preventive',
    category: 'compliance',
    status: 'partial',
    effectiveness: 'medium',
    owner: 'ML Platform',
    evidence: 'Template v2.0 — 80% adoption',
    riskIds: ['RSK-006'],
    frameworks: ['SR 26-2', 'ISO 42001', 'EU AI Act'],
  },
  {
    id: 'CTL-014',
    name: 'Vendor due diligence',
    description: 'Annual due diligence review of model vendors including security, compliance, and continuity.',
    type: 'preventive',
    category: 'third-party',
    status: 'implemented',
    effectiveness: 'medium',
    owner: 'Vendor Management',
    evidence: '2026 vendor reviews complete',
    lastTested: '2026-03-15',
    riskIds: ['RSK-007'],
    frameworks: ['SR 26-2', 'NYDFS 500'],
  },
  {
    id: 'CTL-015',
    name: 'Multi-vendor strategy',
    description: 'Maintain capability to switch between model providers to reduce single-vendor dependency.',
    type: 'corrective',
    category: 'third-party',
    status: 'implemented',
    effectiveness: 'medium',
    owner: 'ML Platform',
    evidence: 'Anthropic + Amazon active',
    riskIds: ['RSK-007'],
    frameworks: ['NIST AI RMF'],
  },
  {
    id: 'CTL-016',
    name: 'Explainability for credit decisions',
    description: 'LIME/SHAP explanations generated for all credit-impacting decisions.',
    type: 'preventive',
    category: 'compliance',
    status: 'partial',
    effectiveness: 'medium',
    owner: 'RAI Council',
    evidence: 'Pilot on Credit Risk agent',
    riskIds: ['RSK-008'],
    frameworks: ['ECOA', 'SR 26-2'],
  },
  {
    id: 'CTL-017',
    name: 'Budget alerts and throttling',
    description: 'AWS Budgets configured with alerts at 80%/90%/100% and automatic throttling.',
    type: 'preventive',
    category: 'financial',
    status: 'implemented',
    effectiveness: 'high',
    owner: 'FinOps',
    evidence: 'AWS Budgets config',
    riskIds: ['RSK-009'],
    frameworks: [],
  },
  {
    id: 'CTL-018',
    name: 'Token usage monitoring',
    description: 'Real-time monitoring of token consumption by agent, use case, and business unit.',
    type: 'detective',
    category: 'financial',
    status: 'implemented',
    effectiveness: 'high',
    owner: 'FinOps',
    evidence: 'FinOps dashboard',
    riskIds: ['RSK-009'],
    frameworks: [],
  },
  {
    id: 'CTL-019',
    name: 'Data quality validation',
    description: 'Automated data quality checks on all inputs to RAG knowledge bases.',
    type: 'preventive',
    category: 'data-quality',
    status: 'implemented',
    effectiveness: 'high',
    owner: 'Data Governance',
    evidence: 'DQ pipeline active',
    riskIds: ['RSK-010'],
    frameworks: ['ISO 42001', 'EU AI Act'],
  },
  {
    id: 'CTL-020',
    name: 'Knowledge base refresh cadence',
    description: 'Defined refresh schedules for all knowledge bases with staleness alerts.',
    type: 'preventive',
    category: 'data-quality',
    status: 'implemented',
    effectiveness: 'medium',
    owner: 'Data Governance',
    evidence: 'KB refresh schedule',
    riskIds: ['RSK-010'],
    frameworks: ['NIST AI RMF'],
  },
];

export const ISSUES: Issue[] = [
  {
    id: 'ISS-001',
    title: 'Prompt injection detector accuracy below target',
    description: 'Current detector accuracy at 87%, target is 95%. Red team found bypass techniques.',
    severity: 'high',
    status: 'in-progress',
    source: 'assessment',
    riskId: 'RSK-004',
    controlId: 'CTL-010',
    owner: 'T. Wilson',
    dueDate: '2026-07-01',
    dateIdentified: '2026-04-15',
    remediation: 'Upgrading to v2.0 detector with additional training data',
  },
  {
    id: 'ISS-002',
    title: 'Model card documentation incomplete for Nova models',
    description: 'Nova Pro and Nova Lite missing required sections: limitations, bias testing results.',
    severity: 'medium',
    status: 'in-progress',
    source: 'audit',
    riskId: 'RSK-006',
    controlId: 'CTL-013',
    owner: 'J. Martinez',
    dueDate: '2026-06-15',
    dateIdentified: '2026-05-01',
    remediation: 'Documentation sprint scheduled for June',
  },
  {
    id: 'ISS-003',
    title: 'Explainability not yet deployed for Credit Risk agent',
    description: 'ECOA adverse action notice requirement not fully met — explanations still in pilot.',
    severity: 'high',
    status: 'in-progress',
    source: 'self-identified',
    riskId: 'RSK-008',
    controlId: 'CTL-016',
    owner: 'S. Chen',
    dueDate: '2026-06-30',
    dateIdentified: '2026-03-01',
    remediation: 'Explainability module GA planned for June',
  },
  {
    id: 'ISS-004',
    title: 'User training completion below target',
    description: 'Only 65% of required users completed AI risk training, target is 100%.',
    severity: 'medium',
    status: 'open',
    source: 'assessment',
    owner: 'L&D Team',
    dueDate: '2026-07-15',
    dateIdentified: '2026-05-10',
    remediation: 'Mandatory training campaign launching June 1',
  },
  {
    id: 'ISS-005',
    title: 'EU AI Act transparency disclosure gaps',
    description: 'Consumer-facing AI transparency disclosures not yet implemented for 2 agents.',
    severity: 'medium',
    status: 'open',
    source: 'audit',
    riskId: 'RSK-006',
    owner: 'Product Team',
    dueDate: '2026-08-01',
    dateIdentified: '2026-04-01',
    remediation: 'UX designs in review, implementation Q3',
  },
];

export const ASSESSMENTS: Assessment[] = [
  {
    id: 'ASM-001',
    name: 'Q2 2026 Quarterly Risk Assessment',
    type: 'periodic',
    status: 'completed',
    scope: 'All production AI/ML systems',
    assessor: 'MRM Committee',
    startDate: '2026-04-01',
    completedDate: '2026-04-30',
    risksIdentified: 2,
    controlsEvaluated: 20,
    findings: 3,
  },
  {
    id: 'ASM-002',
    name: 'Nova Pro Initial Risk Assessment',
    type: 'initial',
    status: 'completed',
    scope: 'Nova Pro model deployment',
    assessor: 'ML Platform + RAI Council',
    startDate: '2026-02-15',
    completedDate: '2026-03-10',
    risksIdentified: 3,
    controlsEvaluated: 12,
    findings: 1,
  },
  {
    id: 'ASM-003',
    name: 'Sonnet 4.5 → 4.6 Upgrade Assessment',
    type: 'change-triggered',
    status: 'in-progress',
    scope: 'Sonnet version upgrade impact',
    assessor: 'ML Platform',
    startDate: '2026-05-20',
    risksIdentified: 0,
    controlsEvaluated: 8,
    findings: 0,
  },
  {
    id: 'ASM-004',
    name: 'Annual Comprehensive Risk Assessment',
    type: 'periodic',
    status: 'draft',
    scope: 'Enterprise AI/ML risk portfolio',
    assessor: 'MRM Committee + Internal Audit',
    startDate: '2026-07-01',
    risksIdentified: 0,
    controlsEvaluated: 0,
    findings: 0,
  },
];

// ─────────────────────────── Aggregations ───────────────────────────

export const getRiskStats = () => {
  const total = RISKS.length;
  const byStatus = {
    open: RISKS.filter(r => r.status === 'open').length,
    mitigated: RISKS.filter(r => r.status === 'mitigated').length,
    accepted: RISKS.filter(r => r.status === 'accepted').length,
    closed: RISKS.filter(r => r.status === 'closed').length,
  };
  const byCategory = RISK_CATEGORIES.map(cat => ({
    ...cat,
    count: RISKS.filter(r => r.category === cat.id).length,
    avgResidual: Math.round(RISKS.filter(r => r.category === cat.id).reduce((s, r) => s + r.residualScore, 0) / (RISKS.filter(r => r.category === cat.id).length || 1)),
  }));
  const critical = RISKS.filter(r => r.residualScore >= 20).length;
  const high = RISKS.filter(r => r.residualScore >= 15 && r.residualScore < 20).length;
  const avgResidual = Math.round(RISKS.reduce((s, r) => s + r.residualScore, 0) / total);
  const increasing = RISKS.filter(r => r.trend === 'increasing').length;

  return { total, byStatus, byCategory, critical, high, avgResidual, increasing };
};

export const getControlStats = () => {
  const total = CONTROLS.length;
  const implemented = CONTROLS.filter(c => c.status === 'implemented').length;
  const partial = CONTROLS.filter(c => c.status === 'partial').length;
  const effectiveness = {
    high: CONTROLS.filter(c => c.effectiveness === 'high').length,
    medium: CONTROLS.filter(c => c.effectiveness === 'medium').length,
    low: CONTROLS.filter(c => c.effectiveness === 'low').length,
  };

  return { total, implemented, partial, effectiveness };
};

export const getIssueStats = () => {
  const total = ISSUES.length;
  const open = ISSUES.filter(i => i.status === 'open').length;
  const inProgress = ISSUES.filter(i => i.status === 'in-progress').length;
  const critical = ISSUES.filter(i => i.severity === 'critical').length;
  const high = ISSUES.filter(i => i.severity === 'high').length;
  const overdue = ISSUES.filter(i => new Date(i.dueDate) < new Date() && i.status !== 'closed' && i.status !== 'remediated').length;

  return { total, open, inProgress, critical, high, overdue };
};
