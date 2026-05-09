export interface ProjectCreate {
  project_name: string;
  framework: 'langraph' | 'strands';
  iac_type: 'terraform' | 'cdk' | 'cloudformation';
  langfuse_server_id?: string;
  aws_region: string;
  tags?: Record<string, string>;
}

export interface ProjectResponse {
  id: string;
  project_name: string;
  framework: string;
  template_name: string;
  iac_type: string;
  aws_region: string;
  tags?: Record<string, string>;
  langfuse_server_id?: string;
  s3_url: string;
  expires_at: string;
  created_by: string;
  created_at: string;
}

export interface LangfuseServer {
  id: string;
  name: string;
  endpoint: string;
  region: string;
  public_key: string;
  secret_name?: string;
  secret_key_field?: string;
  status: 'active' | 'inactive' | 'maintenance';
  created_at: string;
  updated_at: string;
}

export interface LangfuseServerCreate {
  name: string;
  endpoint: string;
  region: string;
  public_key: string;
  secret_name?: string;
  secret_key_field?: string;
  status?: 'active' | 'inactive' | 'maintenance';
}

export interface ApiError {
  detail: string;
  error?: string;
}

// Template Catalog Types
export interface Framework {
  id: string;
  name: string;
  description: string;
  path: string;
}

export interface DeploymentPattern {
  id: string;
  name: string;
  description: string;
  path: string;
  disabled?: boolean;
}

export interface Parameter {
  name: string;
  description: string;
  type: string;
  required: boolean;
  default?: any;
  minimum?: number;
  maximum?: number;
  input_type?: 'text' | 'email' | 'password';
}

export interface Template {
  id: string;
  name: string;
  description: string;
  version: string;
  pattern_type: string;
  frameworks?: Framework[];
  deployment_patterns?: DeploymentPattern[];
  parameters?: Parameter[];
  architecture_diagram?: string;
  example_use_cases?: string[];
  tags?: string[];
  type?: string;
  dependencies?: string[];
}

export interface TemplateStats {
  total_templates: number;
  pattern_types: string[];
  frameworks: string[];
  deployment_patterns: string[];
}

export interface BootstrapRequest {
  template_id: string;
  project_name: string;
  parameters: Record<string, any>;
  framework_id: string;
  deployment_pattern_id: string;
}

// Deployment Types
export type DeploymentStatus = 'pending' | 'validating' | 'packaging' | 'deploying' | 'verifying' | 'deployed' | 'destroying' | 'destroyed' | 'packaged' | 'delivered' | 'failed' | 'rolled_back';

export interface StatusHistoryEntry {
  status: string;
  timestamp: string;
  message?: string;
}

export interface DeploymentCreate {
  deployment_name: string;
  template_id: string;
  iac_type: string;
  framework_id?: string;
  aws_region: string;
  parameters: Record<string, any>;
  target_account_id?: string;
  target_role_arn?: string;
}

export interface Deployment {
  deployment_id: string;
  deployment_name: string;
  template_id: string;
  iac_type: string;
  framework_id?: string;
  aws_account: string;
  aws_region: string;
  s3_bucket: string;
  s3_key?: string;
  status: DeploymentStatus;
  status_history: StatusHistoryEntry[];
  error_message?: string;
  failed_stage?: string;
  execution_arn?: string;
  build_id?: string;
  outputs?: Record<string, string>;
  parameters?: Record<string, string>;
  target_account_id?: string;
  target_role_arn?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DeploymentStatusResponse {
  deployment_id: string;
  status: DeploymentStatus;
  status_history: StatusHistoryEntry[];
  outputs: Record<string, string>;
  failed_stage?: string;
  error_message?: string;
  build_id?: string;
}

// Application Types
export interface AppAgent {
  id: string;
  name: string;
}

export interface AppUseCase {
  id: string;
  category?: string;
  use_case_name: string;
  name: string;
  description: string;
  application_path: string;
  data_path: string;
  supported_frameworks: string[];
  supported_patterns: string[];
  agents: AppAgent[];
  id_field?: string;
  type_field?: string;
  type_values?: string[];
  test_entities?: string[];
  test_accounts?: string[];
}

export interface TestDeploymentRequest {
  payload: Record<string, any>;
}

export interface TestStartResponse {
  test_id: string;
  status: string;
}

export interface TestDeploymentResponse {
  test_id: string;
  status: string;
  success?: boolean;
  response?: any;
  error?: string;
  output?: string;
  exit_code?: number;
  duration_ms?: number;
}

export interface ScriptTestResponse {
  success: boolean;
  output: string;
  exit_code: number;
  duration_ms: number;
}

export type AppDeploymentStatus = 'pending' | 'building' | 'deploying' | 'active' | 'failed';

export interface AppDeployment {
  deployment_id: string;
  use_case_id: string;
  use_case_name: string;
  framework: string;
  aws_region: string;
  status: AppDeploymentStatus;
  runtime_arn?: string;
  endpoint?: string;
  created_at: string;
  updated_at: string;
}

// --- Guardrails ---

export type GuardrailFilterStrength = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
export type GuardrailFilterType = 'HATE' | 'INSULTS' | 'SEXUAL' | 'VIOLENCE' | 'MISCONDUCT' | 'PROMPT_ATTACK';
export type GuardrailPiiAction = 'BLOCK' | 'ANONYMIZE';
export type GuardrailStatus = 'draft' | 'creating' | 'active' | 'updating' | 'failed' | 'deleting' | 'deleted';

export interface ContentFilterConfig {
  type: GuardrailFilterType;
  input_strength: GuardrailFilterStrength;
  output_strength: GuardrailFilterStrength;
}

export interface DeniedTopic {
  name: string;
  definition: string;
  examples: string[];
}

export interface PiiEntityConfig {
  type: string;
  action: GuardrailPiiAction;
}

export interface SensitiveRegexConfig {
  name: string;
  pattern: string;
  description?: string;
  action: GuardrailPiiAction;
}

export interface WordFilterConfig {
  enable_profanity: boolean;
  blocked_words: string[];
}

export interface ContextualGroundingConfig {
  enabled: boolean;
  grounding_threshold: number;
  relevance_threshold: number;
}

export interface GuardrailTemplateCreate {
  name: string;
  description?: string;
  content_filters: ContentFilterConfig[];
  denied_topics: DeniedTopic[];
  pii_entities: PiiEntityConfig[];
  sensitive_regexes: SensitiveRegexConfig[];
  word_filter?: WordFilterConfig;
  contextual_grounding?: ContextualGroundingConfig;
}

export interface GuardrailTemplate {
  template_id: string;
  name: string;
  description?: string;
  status: GuardrailStatus;
  guardrail_id?: string;
  guardrail_arn?: string;
  guardrail_version?: string;
  content_filters: ContentFilterConfig[];
  denied_topics: DeniedTopic[];
  pii_entities: PiiEntityConfig[];
  sensitive_regexes: SensitiveRegexConfig[];
  word_filter?: WordFilterConfig;
  contextual_grounding?: ContextualGroundingConfig;
  status_history: { status: string; timestamp: string; message?: string }[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface GuardrailPreset {
  id: string;
  name: string;
  description: string;
  tags: string[];
  config: GuardrailTemplateCreate;
}

export interface GuardrailMetrics {
  guardrail_id: string;
  total_invocations: number;
  blocked_count: number;
  allowed_count: number;
  anonymized_count: number;
  block_rate: number;
  top_triggered_filter?: string;
  filter_breakdown: Record<string, number>;
  time_series: { timestamp: string; invocations: number }[];
  recent_events: GuardrailEvent[];
}

export interface GuardrailEvent {
  timestamp: string;
  guardrail_id: string;
  guardrail_name?: string;
  action: string;
  filter_type?: string;
  input_snippet?: string;
  details?: Record<string, any>;
}
