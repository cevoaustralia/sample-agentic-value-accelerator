import axios, { AxiosError } from 'axios';
import type {
  ProjectCreate,
  ProjectResponse,
  LangfuseServer,
  LangfuseServerCreate,
  ApiError,
  Template,
  TemplateStats,
  BootstrapRequest,
  Deployment,
  DeploymentCreate,
  DeploymentStatusResponse,
  TestStartResponse,
  TestDeploymentResponse,
  GuardrailTemplate,
  GuardrailTemplateCreate,
  GuardrailPreset,
  GuardrailMetrics,
  ServiceApprovalRun,
  ServiceApprovalRunCreate,
  ServiceApprovalFileTree,
  ServiceApprovalFileContent,
  AwsService,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and user email
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // For dev mode: send x-user-email header to simulate different users
  const devUserEmail = localStorage.getItem('dev_user_email');
  if (devUserEmail) {
    config.headers['x-user-email'] = devUserEmail;
  }

  return config;
});

// Response interceptor for error handling
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      // Clear auth token and reload to trigger SignIn
      localStorage.removeItem('auth_token');
      window.location.reload();
      return Promise.reject(new Error('Session expired. Please log in again.'));
    }
    const errorMessage = error.response?.data?.detail || error.message;
    return Promise.reject(new Error(errorMessage));
  }
);

// Projects API
export const projectsApi = {
  generate: async (data: ProjectCreate): Promise<ProjectResponse> => {
    const response = await client.post<ProjectResponse>('/api/v1/projects/generate', data);
    return response.data;
  },

  get: async (projectName: string): Promise<ProjectResponse> => {
    const response = await client.get<ProjectResponse>(`/api/v1/projects/${projectName}`);
    return response.data;
  },
};

// Langfuse Servers API
export const langfuseApi = {
  list: async (): Promise<LangfuseServer[]> => {
    const response = await client.get<LangfuseServer[]>('/api/v1/langfuse-servers');
    return response.data;
  },

  create: async (data: LangfuseServerCreate): Promise<LangfuseServer> => {
    const response = await client.post<LangfuseServer>('/api/v1/langfuse-servers', data);
    return response.data;
  },

  get: async (id: string): Promise<LangfuseServer> => {
    const response = await client.get<LangfuseServer>(`/api/v1/langfuse-servers/${id}`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/api/v1/langfuse-servers/${id}`);
  },
};

// Health API
export const healthApi = {
  check: async () => {
    const response = await client.get('/health');
    return response.data;
  },

  ping: async () => {
    const response = await client.get('/ping');
    return response.data;
  },
};

// Template Catalog API
export const getTemplates = async (
  patternType?: string,
  framework?: string,
  deploymentPattern?: string
): Promise<Template[]> => {
  const params = new URLSearchParams();
  if (patternType) params.append('pattern_type', patternType);
  if (framework) params.append('framework', framework);
  if (deploymentPattern) params.append('deployment_pattern', deploymentPattern);

  const response = await client.get<{ templates: Template[]; total: number }>('/api/v1/templates', { params });
  return response.data.templates; // Extract templates array from response
};

export const getTemplate = async (templateId: string): Promise<Template> => {
  const response = await client.get<{ metadata: Template; path: string }>(`/api/v1/templates/${templateId}`);
  return response.data.metadata; // Extract metadata from response
};

export const getTemplateStats = async (): Promise<TemplateStats> => {
  const response = await client.get<TemplateStats>('/api/v1/templates/stats');
  return response.data;
};

export const bootstrapProject = async (request: BootstrapRequest): Promise<Blob> => {
  const response = await client.post('/api/v1/bootstrap', request, {
    responseType: 'blob',
  });
  return response.data;
};

export const downloadTemplate = async (templateId: string, iac?: string): Promise<Blob> => {
  const params = iac ? { iac } : {};
  const response = await client.get(`/api/v1/templates/${templateId}/download`, {
    params,
    responseType: 'blob',
  });
  return response.data;
};

// Deployments API
export const deploymentsApi = {
  list: async (status?: string, templateId?: string): Promise<Deployment[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (templateId) params.append('template_id', templateId);
    const response = await client.get<Deployment[]>('/api/v1/deployments', { params });
    return response.data;
  },

  get: async (id: string): Promise<Deployment> => {
    const response = await client.get<Deployment>(`/api/v1/deployments/${id}`);
    return response.data;
  },

  create: async (data: DeploymentCreate): Promise<Deployment> => {
    const response = await client.post<Deployment>('/api/v1/deployments', data);
    return response.data;
  },

  getDeploymentStatus: async (id: string): Promise<DeploymentStatusResponse> => {
    const response = await client.get<DeploymentStatusResponse>(`/api/v1/deployments/${id}/status`);
    return response.data;
  },

  destroyDeployment: async (id: string): Promise<Deployment> => {
    const response = await client.post<Deployment>(`/api/v1/deployments/${id}/destroy`);
    return response.data;
  },

  getTemplateDependencies: async (templateId: string): Promise<{ template_id: string; name: string; has_active_deployment: boolean; outputs: Record<string, string> }[]> => {
    const response = await client.get(`/api/v1/deployments/templates/${templateId}/dependencies`);
    return response.data;
  },

  redeployDeployment: async (id: string): Promise<Deployment> => {
    const response = await client.post<Deployment>(`/api/v1/deployments/${id}/redeploy`);
    return response.data;
  },

  getDeploymentLogs: async (id: string): Promise<{ deployment_id: string; build_id: string; logs: string }> => {
    const response = await client.get<{ deployment_id: string; build_id: string; logs: string }>(`/api/v1/deployments/${id}/logs`);
    return response.data;
  },

  getRuntimeLogs: async (id: string): Promise<{
    deployment_id: string;
    log_group: string;
    fleet_dashboard_url: string;
    observability_console_url: string;
    logs: string;
  }> => {
    const response = await client.get(`/api/v1/deployments/${id}/runtime-logs`);
    return response.data;
  },

  getSourceZipUrl: async (id: string): Promise<{ download_url: string; s3_bucket: string; s3_key: string }> => {
    const response = await client.get<{ download_url: string; s3_bucket: string; s3_key: string }>(`/api/v1/deployments/${id}/source-zip`);
    return response.data;
  },

  testDeployment: async (deploymentId: string, payload: Record<string, any>): Promise<TestStartResponse> => {
    const response = await client.post<TestStartResponse>(`/api/v1/deployments/${deploymentId}/test`, { payload });
    return response.data;
  },

  getTestResult: async (deploymentId: string, testId: string): Promise<TestDeploymentResponse> => {
    const response = await client.get<TestDeploymentResponse>(`/api/v1/deployments/${deploymentId}/test/${testId}`);
    return response.data;
  },

  uploadTestData: async (deploymentId: string, file: File): Promise<{ s3_key: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await client.post<{ s3_key: string }>(
      `/api/v1/deployments/${deploymentId}/upload-test-data`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  runTestScript: async (deploymentId: string, scriptType: string): Promise<any> => {
    const response = await client.post(
      `/api/v1/deployments/${deploymentId}/run-script`,
      { script_type: scriptType }
    );
    return response.data;
  },

  getSampleData: async (deploymentId: string): Promise<any> => {
    const response = await client.get(`/api/v1/deployments/${deploymentId}/sample-data`);
    return response.data;
  },
};

// User API
export const userApi = {
  getCurrentUser: async (): Promise<{ email: string; role: string; role_level: number; can_deploy: boolean }> => {
    const response = await client.get('/api/v1/users/me');
    return response.data;
  },
};

export default client;

// App Factory API
export const appFactoryApi = {
  submit: async (data: Record<string, string>): Promise<{ submission_id: string }> => {
    const response = await client.post<{ submission_id: string }>('/api/v1/app-factory/submissions', data);
    return response.data;
  },

  deploy: async (submissionId: string): Promise<Deployment> => {
    const response = await client.post<Deployment>(`/api/v1/app-factory/submissions/${submissionId}/deploy`);
    return response.data;
  },

  get: async (submissionId: string): Promise<Record<string, any>> => {
    const response = await client.get<Record<string, any>>(`/api/v1/app-factory/submissions/${submissionId}`);
    return response.data;
  },

  list: async (): Promise<Record<string, any>[]> => {
    const response = await client.get<Record<string, any>[]>('/api/v1/app-factory/submissions');
    return response.data;
  },
};

// Applications API (FSI Foundry)
export const applicationsApi = {
  listFoundryUseCases: async () => {
    const response = await client.get('/api/v1/applications/foundry/use-cases');
    return response.data;
  },

  deployFoundry: async (data: {
    deployment_name: string;
    use_case_name: string;
    framework: string;
    deployment_pattern: string;
    aws_region: string;
    parameters?: Record<string, any>;
  }): Promise<Deployment> => {
    const response = await client.post<Deployment>('/api/v1/applications/foundry/deploy', data);
    return response.data;
  },

  deployFoundryFromGit: async (data: {
    deployment_name: string;
    codecommit_repo: string;
    codecommit_branch: string;
    use_case_name: string;
    framework: string;
    deployment_pattern: string;
    aws_region: string;
    parameters?: Record<string, any>;
  }): Promise<Deployment> => {
    const response = await client.post<Deployment>('/api/v1/applications/foundry/deploy-from-git', data);
    return response.data;
  },
};

// Frontier Agents API (Agent-as-a-Service)
export interface FrontierAgentParameter {
  name: string;
  label: string;
  type: string;
  required: boolean;
  default: string;
  description: string;
}

export interface FrontierAgentCatalogEntry {
  id: string;
  name: string;
  description: string;
  status: string;
  supported_iac_types: string[];
  coming_soon_iac_types: string[];
  parameters: FrontierAgentParameter[];
  advanced_parameters: FrontierAgentParameter[];
}

export const frontierAgentsApi = {
  listCatalog: async (): Promise<FrontierAgentCatalogEntry[]> => {
    const response = await client.get<FrontierAgentCatalogEntry[]>('/api/v1/frontier-agents/catalog');
    return response.data;
  },

  getAgent: async (agentId: string): Promise<FrontierAgentCatalogEntry> => {
    const response = await client.get<FrontierAgentCatalogEntry>(`/api/v1/frontier-agents/catalog/${agentId}`);
    return response.data;
  },

  deploy: async (data: {
    deployment_name: string;
    agent_id: string;
    iac_type: string;
    aws_region: string;
    parameters?: Record<string, any>;
  }): Promise<Deployment> => {
    const response = await client.post<Deployment>('/api/v1/frontier-agents/deploy', data);
    return response.data;
  },

  federate: async (data: {
    agent_id: string;
    operator_app_url: string;
  }): Promise<{ signin_url: string; operator_app_url: string; expires_in_seconds: number }> => {
    const response = await client.post<{ signin_url: string; operator_app_url: string; expires_in_seconds: number }>(
      '/api/v1/frontier-agents/federate',
      data,
    );
    return response.data;
  },
};

// CodeCommit API
export interface CodeCommitRepo {
  repository_name: string;
  template_id: string;
  source: string;
  clone_url_http: string;
  default_branch: string;
  description: string;
}

export const codecommitApi = {
  listRepositories: async (): Promise<CodeCommitRepo[]> => {
    const response = await client.get<CodeCommitRepo[]>('/api/v1/codecommit/repositories');
    return response.data;
  },
};

// Guardrails API
export const guardrailsApi = {
  list: async (status?: string): Promise<GuardrailTemplate[]> => {
    const params = status ? { status } : {};
    const response = await client.get<GuardrailTemplate[]>('/api/v1/guardrails', { params });
    return response.data;
  },

  get: async (templateId: string): Promise<GuardrailTemplate> => {
    const response = await client.get<GuardrailTemplate>(`/api/v1/guardrails/${templateId}`);
    return response.data;
  },

  create: async (data: GuardrailTemplateCreate): Promise<GuardrailTemplate> => {
    const response = await client.post<GuardrailTemplate>('/api/v1/guardrails', data);
    return response.data;
  },

  update: async (templateId: string, data: Partial<GuardrailTemplateCreate>): Promise<GuardrailTemplate> => {
    const response = await client.put<GuardrailTemplate>(`/api/v1/guardrails/${templateId}`, data);
    return response.data;
  },

  delete: async (templateId: string): Promise<GuardrailTemplate> => {
    const response = await client.delete<GuardrailTemplate>(`/api/v1/guardrails/${templateId}`);
    return response.data;
  },

  publish: async (templateId: string): Promise<GuardrailTemplate> => {
    const response = await client.post<GuardrailTemplate>(`/api/v1/guardrails/${templateId}/publish`);
    return response.data;
  },

  getMetrics: async (templateId: string, hours: number = 24): Promise<GuardrailMetrics> => {
    const response = await client.get<GuardrailMetrics>(`/api/v1/guardrails/${templateId}/metrics`, { params: { hours } });
    return response.data;
  },

  getPresets: async (): Promise<GuardrailPreset[]> => {
    const response = await client.get<GuardrailPreset[]>('/api/v1/guardrails/presets');
    return response.data;
  },
};

// Prioritization API ---------------------------------------------------------

export type PrioritizationAIType = 'Traditional ML' | 'Generative AI' | 'Agentic AI';
export type PrioritizationComplexity = 'Low' | 'Medium' | 'High';
export type PrioritizationAutomationScope = 'Augmentation' | 'Co-pilot' | 'Full Autonomy';
export type PrioritizationIntegrationDepth = 'Single-system batch' | 'API-connected real-time' | 'Multi-system orchestration';
export type UseCaseStatus = 'Concept' | 'Active' | 'Pilot' | 'Production' | 'Paused' | 'Archived';
export type GoNoGo = 'GO' | 'CONDITIONAL GO' | 'NO GO';

export interface BusinessValueScores {
  revenue_impact: number;
  cost_savings: number;
  productivity_gains: number;
  customer_experience: number;
  scalability_potential: number;
}
export interface TechnicalFeasibilityScores {
  data_readiness: number;
  technical_complexity: number;
  integration_requirements: number;
  time_to_value: number;
  talent_availability: number;
}
export interface RiskGovernanceScores {
  regulatory_compliance: number;
  data_privacy_security: number;
  ethical_bias_risk: number;
  model_reliability: number;
  autonomous_decision_risk: number;
}
export interface OrgReadinessScores {
  data_infrastructure: number;
  process_maturity: number;
  change_management: number;
  executive_sponsorship: number;
  cross_functional_collab: number;
}
export interface StrategicAlignmentScores {
  mission_criticality: number;
  competitive_advantage: number;
  innovation_potential: number;
}
export interface CostEfficiencyScores {
  implementation_cost: number;
  ongoing_operational_cost: number;
  roi_timeline: number;
}
export interface PrioritizationScores {
  business_value: BusinessValueScores;
  technical_feasibility: TechnicalFeasibilityScores;
  risk_governance: RiskGovernanceScores;
  org_readiness: OrgReadinessScores;
  strategic_alignment: StrategicAlignmentScores;
  cost_efficiency: CostEfficiencyScores;
}
export interface DimensionWeights {
  business_value: number;
  technical_feasibility: number;
  risk_governance: number;
  org_readiness: number;
  strategic_alignment: number;
  cost_efficiency: number;
}
export interface ComputedScore {
  dimension_subtotals: DimensionWeights;
  composite: number;
  risk_score: number;
  readiness_score: number;
  go_no_go: GoNoGo;
}

export interface UseCase {
  use_case_id: string;
  name: string;
  description: string;
  ai_type: PrioritizationAIType;
  business_domain: string;
  complexity: PrioritizationComplexity;
  automation_scope: PrioritizationAutomationScope;
  integration_depth: PrioritizationIntegrationDepth;
  business_owner: string;
  technical_owner: string;
  target_go_live: string;
  status: UseCaseStatus;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  scores: PrioritizationScores;
  weights: DimensionWeights;
  computed?: ComputedScore | null;
}

export interface UseCaseCreate {
  name: string;
  description?: string;
  ai_type?: PrioritizationAIType;
  business_domain?: string;
  complexity?: PrioritizationComplexity;
  automation_scope?: PrioritizationAutomationScope;
  integration_depth?: PrioritizationIntegrationDepth;
  business_owner?: string;
  technical_owner?: string;
  target_go_live?: string;
  status?: UseCaseStatus;
  scores?: PrioritizationScores;
  weights?: DimensionWeights;
}

export interface PrioritizationFramework {
  dimension_weights: DimensionWeights;
  sub_weights: Record<string, Record<string, number>>;
  thresholds: Record<string, Record<string, string>>;
}

export const prioritizationApi = {
  framework: async (): Promise<PrioritizationFramework> => {
    const response = await client.get<PrioritizationFramework>('/api/v1/prioritization/framework');
    return response.data;
  },
  list: async (status?: UseCaseStatus): Promise<UseCase[]> => {
    const params = status ? { status } : {};
    const response = await client.get<UseCase[]>('/api/v1/prioritization', { params });
    return response.data;
  },
  get: async (id: string): Promise<UseCase> => {
    const response = await client.get<UseCase>(`/api/v1/prioritization/${id}`);
    return response.data;
  },
  create: async (data: UseCaseCreate): Promise<UseCase> => {
    const response = await client.post<UseCase>('/api/v1/prioritization', data);
    return response.data;
  },
  update: async (id: string, data: Partial<UseCaseCreate>): Promise<UseCase> => {
    const response = await client.put<UseCase>(`/api/v1/prioritization/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<UseCase> => {
    const response = await client.delete<UseCase>(`/api/v1/prioritization/${id}`);
    return response.data;
  },
};

// Maturity Assessment API ----------------------------------------------------

export type AssessmentStatus = 'Draft' | 'In Progress' | 'Complete' | 'Archived';

export interface MaturityWeights {
  people: number;
  process: number;
  technology: number;
  data: number;
  governance: number;
  strategy: number;
}

export interface DimensionResult {
  label: string;
  answered: number;
  total: number;
  average: number;
  weighted_contribution: number;
  maturity_level: number;
}

export interface ComputedMaturity {
  dimensions: Record<string, DimensionResult>;
  composite: number;
  maturity_level: number;
  answered: number;
  total: number;
  completion: number;
}

export interface MaturityAssessment {
  assessment_id: string;
  name: string;
  description: string;
  organization: string;
  assessor: string;
  status: AssessmentStatus;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  scores: Record<string, number>;
  weights: MaturityWeights;
  computed?: ComputedMaturity | null;
}

export interface MaturityAssessmentCreate {
  name: string;
  description?: string;
  organization?: string;
  assessor?: string;
  status?: AssessmentStatus;
  scores?: Record<string, number>;
  weights?: MaturityWeights;
}

export const maturityApi = {
  list: async (status?: AssessmentStatus): Promise<MaturityAssessment[]> => {
    const params = status ? { status } : {};
    const response = await client.get<MaturityAssessment[]>('/api/v1/maturity', { params });
    return response.data;
  },
  get: async (id: string): Promise<MaturityAssessment> => {
    const response = await client.get<MaturityAssessment>(`/api/v1/maturity/${id}`);
    return response.data;
  },
  create: async (data: MaturityAssessmentCreate): Promise<MaturityAssessment> => {
    const response = await client.post<MaturityAssessment>('/api/v1/maturity', data);
    return response.data;
  },
  update: async (id: string, data: Partial<MaturityAssessmentCreate>): Promise<MaturityAssessment> => {
    const response = await client.put<MaturityAssessment>(`/api/v1/maturity/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<MaturityAssessment> => {
    const response = await client.delete<MaturityAssessment>(`/api/v1/maturity/${id}`);
    return response.data;
  },
};

// Business Cases API --------------------------------------------------------

export type BusinessCaseStatus = 'Draft' | 'Review' | 'Approved' | 'Rejected' | 'Archived';
export type IndustrySubSector = 'Retail Banking' | 'Insurance' | 'Capital Markets' | 'Other';
export type BCAITechnologyType = 'Traditional ML' | 'Generative AI' | 'Agentic AI';
export type ProjectSize = 'Small' | 'Medium' | 'Large';
export type NpvDecision = 'POSITIVE NPV - Proceed' | 'NEGATIVE NPV - Reject' | 'BREAKEVEN - Review';

export interface ProjectInputs {
  sponsor: string;
  business_unit: string;
  evaluation_date?: string | null;
  industry: IndustrySubSector;
  ai_technology_type: BCAITechnologyType;
  project_size: ProjectSize;
  wacc_base: number;
  technology_risk_premium: number;
  hurdle_rate: number;
  tax_rate: number;
  inflation_rate: number;
  ramp_y1: number;
  ramp_y2: number;
  ramp_y3: number;
  compliance_adder_pct: number;
}

export interface CostLineItem {
  label: string;
  year_0: number;
  year_1: number;
  year_2: number;
  year_3: number;
}

export interface BenefitLineItem {
  label: string;
  year_1: number;
  year_2: number;
  year_3: number;
}

export interface CostModel {
  initial: CostLineItem[];
  operating: CostLineItem[];
  staffing: CostLineItem[];
}

export interface BenefitModel {
  tangible: BenefitLineItem[];
  intangible: BenefitLineItem[];
}

export interface RiskScorecard {
  technical: number;
  data: number;
  model: number;
  regulatory: number;
  organizational: number;
  vendor_lockin: number;
  change_management: number;
  cybersecurity: number;
}

export interface RiskWeights extends RiskScorecard {}

export interface CashFlowYear {
  year: number;
  benefits: number;
  costs: number;
  pre_tax: number;
  tax_impact: number;
  after_tax: number;
  cumulative: number;
  discount_factor: number;
  discounted: number;
}

export interface ComputedFinancials {
  discount_rate: number;
  cash_flow: CashFlowYear[];
  total_benefits: number;
  total_costs: number;
  npv: number;
  irr: number | null;
  roi: number;
  payback_years: number | null;
  benefit_cost_ratio: number;
  irr_passes_hurdle: boolean;
  npv_decision: NpvDecision;
}

export interface ComputedRisk {
  composite: number;
  level: string;
  by_category: Record<string, number>;
}

export interface ComputedBC {
  financials: ComputedFinancials;
  risk: ComputedRisk;
}

export interface BusinessCase {
  business_case_id: string;
  name: string;
  description: string;
  status: BusinessCaseStatus;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  inputs: ProjectInputs;
  costs: CostModel;
  benefits: BenefitModel;
  risk_scores: RiskScorecard;
  risk_weights: RiskWeights;
  computed?: ComputedBC | null;
}

export interface BusinessCaseCreate {
  name: string;
  description?: string;
  status?: BusinessCaseStatus;
  inputs?: ProjectInputs;
  costs?: CostModel;
  benefits?: BenefitModel;
  risk_scores?: RiskScorecard;
  risk_weights?: RiskWeights;
}

export const businessCasesApi = {
  list: async (status?: BusinessCaseStatus): Promise<BusinessCase[]> => {
    const params = status ? { status } : {};
    const response = await client.get<BusinessCase[]>('/api/v1/business-cases', { params });
    return response.data;
  },
  get: async (id: string): Promise<BusinessCase> => {
    const response = await client.get<BusinessCase>(`/api/v1/business-cases/${id}`);
    return response.data;
  },
  create: async (data: BusinessCaseCreate): Promise<BusinessCase> => {
    const response = await client.post<BusinessCase>('/api/v1/business-cases', data);
    return response.data;
  },
  update: async (id: string, data: Partial<BusinessCaseCreate>): Promise<BusinessCase> => {
    const response = await client.put<BusinessCase>(`/api/v1/business-cases/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<BusinessCase> => {
    const response = await client.delete<BusinessCase>(`/api/v1/business-cases/${id}`);
    return response.data;
  },
};

// Operating Model API ------------------------------------------------------

export type OperatingModelStatus = 'Draft' | 'In Progress' | 'Complete' | 'Archived';

export interface OperatingModelWeights {
  strategy: number;
  governance: number;
  organization: number;
  people: number;
  technology: number;
  process: number;
  ecosystem: number;
}

export interface OperatingModelDimensionResult {
  label: string;
  answered: number;
  total: number;
  average: number;
  weighted_contribution: number;
  level: number;
}

export interface ComputedOperatingModel {
  dimensions: Record<string, OperatingModelDimensionResult>;
  composite: number;
  maturity_level: number;
  recommended_pattern: string;
  recommended_governance: string;
  answered: number;
  total: number;
  completion: number;
  total_investment_m: number;
}

export interface OperatingModelCapabilityChoice {
  capability_id: number;
  placement: 'Centralized' | 'Hub-and-Spoke' | 'Federated';
  ownership: string;
}

export interface OperatingModelInvestmentSplit {
  people_pct: number;
  technology_pct: number;
  algorithms_pct: number;
}

export interface OperatingModelRoadmapPhase {
  name: string;
  months: string;
  investment_m: number;
  enabled: boolean;
}

export interface OperatingModel {
  operating_model_id: string;
  name: string;
  description: string;
  organization: string;
  designer: string;
  status: OperatingModelStatus;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  scores: Record<string, number>;
  weights: OperatingModelWeights;
  pattern: string;
  governance: string;
  capability_choices: OperatingModelCapabilityChoice[];
  investment: OperatingModelInvestmentSplit;
  roadmap: OperatingModelRoadmapPhase[];
  computed?: ComputedOperatingModel | null;
}

export interface OperatingModelCreate {
  name: string;
  description?: string;
  organization?: string;
  designer?: string;
  status?: OperatingModelStatus;
  scores?: Record<string, number>;
  weights?: OperatingModelWeights;
  pattern?: string;
  governance?: string;
  capability_choices?: OperatingModelCapabilityChoice[];
  investment?: OperatingModelInvestmentSplit;
  roadmap?: OperatingModelRoadmapPhase[];
}

export const operatingModelApi = {
  list: async (status?: OperatingModelStatus): Promise<OperatingModel[]> => {
    const params = status ? { status } : {};
    const response = await client.get<OperatingModel[]>('/api/v1/operating-models', { params });
    return response.data;
  },
  get: async (id: string): Promise<OperatingModel> => {
    const response = await client.get<OperatingModel>(`/api/v1/operating-models/${id}`);
    return response.data;
  },
  create: async (data: OperatingModelCreate): Promise<OperatingModel> => {
    const response = await client.post<OperatingModel>('/api/v1/operating-models', data);
    return response.data;
  },
  update: async (id: string, data: Partial<OperatingModelCreate>): Promise<OperatingModel> => {
    const response = await client.put<OperatingModel>(`/api/v1/operating-models/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<OperatingModel> => {
    const response = await client.delete<OperatingModel>(`/api/v1/operating-models/${id}`);
    return response.data;
  },
};

// Service Approval API ------------------------------------------------------

export const serviceApprovalApi = {
  listAwsServices: async (): Promise<AwsService[]> => {
    const response = await client.get<AwsService[]>('/api/v1/service-approval/aws-services');
    return response.data;
  },

  list: async (): Promise<ServiceApprovalRun[]> => {
    const response = await client.get<ServiceApprovalRun[]>('/api/v1/service-approval/runs');
    return response.data;
  },

  get: async (slug: string): Promise<ServiceApprovalRun> => {
    const response = await client.get<ServiceApprovalRun>(`/api/v1/service-approval/runs/${slug}`);
    return response.data;
  },

  create: async (data: ServiceApprovalRunCreate): Promise<ServiceApprovalRun> => {
    const response = await client.post<ServiceApprovalRun>('/api/v1/service-approval/runs', data);
    return response.data;
  },

  cancel: async (slug: string): Promise<ServiceApprovalRun> => {
    const response = await client.post<ServiceApprovalRun>(`/api/v1/service-approval/runs/${slug}/cancel`);
    return response.data;
  },

  delete: async (slug: string): Promise<void> => {
    await client.delete(`/api/v1/service-approval/runs/${slug}`);
  },

  listFiles: async (slug: string, phase: string): Promise<ServiceApprovalFileTree> => {
    const response = await client.get<ServiceApprovalFileTree>(
      `/api/v1/service-approval/runs/${slug}/files`,
      { params: { phase } }
    );
    return response.data;
  },

  getFile: async (slug: string, path: string): Promise<ServiceApprovalFileContent> => {
    const response = await client.get<ServiceApprovalFileContent>(
      `/api/v1/service-approval/runs/${slug}/file`,
      { params: { path } }
    );
    return response.data;
  },

  downloadAllUrl: (slug: string): string =>
    `${API_URL}/api/v1/service-approval/runs/${slug}/download`,

  downloadPhaseUrl: (slug: string, phase: string): string =>
    `${API_URL}/api/v1/service-approval/runs/${slug}/download?phase=${encodeURIComponent(phase)}`,

  downloadFileUrl: (slug: string, path: string): string =>
    `${API_URL}/api/v1/service-approval/runs/${slug}/file?path=${encodeURIComponent(path)}&download=1`,
};
