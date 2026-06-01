/**
 * useGovernanceAggregator — Centralizes governance data from across AVA platform
 *
 * "Centralize governance, federate innovation"
 * Teams deploy freely via Build/Operate; Govern has real-time visibility into everything.
 *
 * REAL DATA SOURCES (from AVA APIs):
 * - guardrailsApi: Guardrail templates created in Secure
 * - deploymentsApi: Deployments from Build (FSI Foundry, Frontier Agents)
 * - prioritizationApi: Use cases from Plan
 * - maturityApi: Maturity assessments from Plan
 * - businessCasesApi: Business cases from Plan
 * - frontierAgentsApi: AWS Frontier Agents catalog
 *
 * MOCK DATA (still needed for demo):
 * - Compliance frameworks (would come from custom DB)
 * - Cost data (would come from Cost Explorer API)
 * - Audit events (would come from CloudTrail)
 */

import { useState, useEffect, useMemo } from 'react';
import {
  guardrailsApi,
  deploymentsApi,
  prioritizationApi,
  maturityApi,
  frontierAgentsApi,
  businessCasesApi,
  operatingModelApi,
  serviceApprovalApi,
} from '../../api/client';
import type { UseCase, BusinessCase, OperatingModel, FrontierAgentCatalogEntry } from '../../api/client';
import type { GuardrailTemplate, Deployment, ServiceApprovalRun, GuardrailMetrics } from '../../types';
import {
  COMPLIANCE_FRAMEWORKS,
  AGENT_RISK,
  RISK_CATEGORIES,
  COST_BY_MODEL,
  BU_BUDGETS,
  ANOMALY_ALERTS,
  INCIDENT_SUMMARY,
} from './mockData';

// ─────────────────────────── Types ───────────────────────────

export interface GovernanceSummary {
  // Risk posture
  trustScore: number;
  trustTrend: 'improving' | 'declining' | 'stable';
  openIncidents: number;
  criticalIncidents: number;
  guardrailEvents24h: number;
  policyViolations: number;

  // Inventory (REAL DATA)
  totalUseCases: number;
  deployedUseCases: number;
  catalogUseCases: number;
  totalModels: number;
  modelsInProduction: number;
  modelsPendingReview: number;
  totalAgents: number;
  agentsWithPolicies: number;

  // Guardrails (REAL DATA)
  guardrailsActive: number;
  guardrailsDraft: number;
  guardrailsFailed: number;

  // Deployments (REAL DATA)
  deploymentsActive: number;
  deploymentsPending: number;
  deploymentsFailed: number;

  // Compliance (mock for now)
  frameworksCovered: number;
  frameworksTotal: number;
  controlsImplemented: number;
  controlsTotal: number;
  frameworksNeedingAttention: string[];

  // Cost (mock for now)
  monthlySpend: number;
  budgetUtilization: number;
  costAnomalies: number;
  savingsRealized: number;
  savingsTarget: number;

  // Activity (last 24h)
  recentDeployments: number;
  recentApprovals: number;
  recentGuardrailBlocks: number;
}

export interface PipelineHealth {
  stages: {
    name: string;
    count: number;
    color: string;
  }[];
  blockedItems: {
    id: string;
    name: string;
    stage: string;
    blockedReason: string;
    owner: string;
    daysBlocked: number;
  }[];
  avgTimeToProduction: number;
}

export interface ActivityFeedItem {
  id: string;
  ts: string;
  type: 'deployment' | 'guardrail' | 'incident' | 'approval' | 'cost' | 'config';
  severity: 'low' | 'medium' | 'high' | 'critical';
  module: 'plan' | 'build' | 'secure' | 'operate' | 'govern';
  title: string;
  description: string;
  actor?: string;
  link?: string;
}

export interface GuardrailSummary {
  template_id: string;
  name: string;
  status: string;
  features: string[];
  guardrail_id?: string;
  created_at: string;
  metrics?: GuardrailMetrics;
}

export interface FrontierAgentSummary {
  id: string;
  name: string;
  description: string;
  status: string;
}

export interface DeploymentSummary {
  deployment_id: string;
  deployment_name: string;
  status: string;
  template_name?: string;
  created_at: string;
  updated_at: string;
}

export interface GovernanceAggregatorResult {
  loading: boolean;
  error: string | null;
  summary: GovernanceSummary;
  pipeline: PipelineHealth;
  activityFeed: ActivityFeedItem[];

  // Real data from APIs
  guardrails: GuardrailSummary[];
  deployments: DeploymentSummary[];
  useCases: UseCase[];
  businessCases: BusinessCase[];
  operatingModels: OperatingModel[];
  serviceApprovalRuns: ServiceApprovalRun[];
  frontierAgents: FrontierAgentSummary[];
  guardrailMetricsTotal: {
    totalInvocations: number;
    blockedCount: number;
    allowedCount: number;
    anonymizedCount: number;
    blockRate: number;
  };

  // Mock data (still needed)
  riskHeatmap: { agent: string; scores: number[] }[];
  riskCategories: readonly string[];
  complianceFrameworks: typeof COMPLIANCE_FRAMEWORKS;
  costByModel: typeof COST_BY_MODEL;
  buBudgets: typeof BU_BUDGETS;

  refresh: () => void;
}

// ─────────────────────────── Helper ───────────────────────────

function featureSummary(t: GuardrailTemplate): string[] {
  const features: string[] = [];
  if (t.content_filters?.length > 0) features.push('Content');
  if (t.pii_entities?.length > 0) features.push('PII');
  if (t.denied_topics?.length > 0) features.push('Topics');
  if (t.word_filter?.enable_profanity || (t.word_filter?.blocked_words?.length ?? 0) > 0) features.push('Words');
  if (t.contextual_grounding?.enabled) features.push('Grounding');
  return features;
}

// ─────────────────────────── Hook ───────────────────────────

export function useGovernanceAggregator(): GovernanceAggregatorResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Real data from APIs
  const [guardrailTemplates, setGuardrailTemplates] = useState<GuardrailTemplate[]>([]);
  const [guardrailMetrics, setGuardrailMetrics] = useState<Map<string, GuardrailMetrics>>(new Map());
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [frontierAgentsList, setFrontierAgentsList] = useState<FrontierAgentCatalogEntry[]>([]);
  const [businessCases, setBusinessCases] = useState<BusinessCase[]>([]);
  const [operatingModels, setOperatingModels] = useState<OperatingModel[]>([]);
  const [serviceApprovalRuns, setServiceApprovalRuns] = useState<ServiceApprovalRun[]>([]);
  
  // Load all data from AVA APIs
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch all data in parallel
        const [
          guardrailsRes,
          deploymentsRes,
          useCasesRes,
          , // maturityRes - available for future use
          frontierRes,
          businessCasesRes,
          operatingModelsRes,
          serviceApprovalRes,
        ] = await Promise.allSettled([
          guardrailsApi.list(),
          deploymentsApi.list(),
          prioritizationApi.list(),
          maturityApi.list(),
          frontierAgentsApi.listCatalog(),
          businessCasesApi.list(),
          operatingModelApi.list(),
          serviceApprovalApi.list(),
        ]);

        // Process results (handle failures gracefully)
        let activeGuardrails: GuardrailTemplate[] = [];
        if (guardrailsRes.status === 'fulfilled') {
          activeGuardrails = guardrailsRes.value.filter(t => t.status !== 'deleted');
          setGuardrailTemplates(activeGuardrails);
        }
        if (deploymentsRes.status === 'fulfilled') {
          setDeployments(deploymentsRes.value);
        }
        if (useCasesRes.status === 'fulfilled') {
          setUseCases(useCasesRes.value);
        }
        if (frontierRes.status === 'fulfilled') {
          setFrontierAgentsList(frontierRes.value);
        }
        if (businessCasesRes.status === 'fulfilled') {
          setBusinessCases(businessCasesRes.value);
        }
        if (operatingModelsRes.status === 'fulfilled') {
          setOperatingModels(operatingModelsRes.value);
        }
        if (serviceApprovalRes.status === 'fulfilled') {
          setServiceApprovalRuns(serviceApprovalRes.value);
        }
        
        // Fetch metrics for active guardrails (in parallel, non-blocking)
        const guardrailsWithIds = activeGuardrails.filter(g => g.guardrail_id && g.status === 'active');
        if (guardrailsWithIds.length > 0) {
          const metricsPromises = guardrailsWithIds.map(g =>
            guardrailsApi.getMetrics(g.template_id, 24).catch(() => null)
          );
          const metricsResults = await Promise.all(metricsPromises);
          const metricsMap = new Map<string, GuardrailMetrics>();
          metricsResults.forEach((m, i) => {
            if (m) metricsMap.set(guardrailsWithIds[i].template_id, m);
          });
          setGuardrailMetrics(metricsMap);
        }

      } catch (err) {
        console.error('Failed to load governance data:', err);
        setError('Some data sources unavailable — showing partial data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [refreshKey]);

  // Transform guardrails for display (with metrics)
  const guardrails = useMemo<GuardrailSummary[]>(() => {
    return guardrailTemplates.map(t => ({
      template_id: t.template_id,
      name: t.name,
      status: t.status,
      features: featureSummary(t),
      guardrail_id: t.guardrail_id,
      created_at: t.created_at,
      metrics: guardrailMetrics.get(t.template_id),
    }));
  }, [guardrailTemplates, guardrailMetrics]);

  // Aggregate guardrail metrics
  const guardrailMetricsTotal = useMemo(() => {
    let totalInvocations = 0;
    let blockedCount = 0;
    let allowedCount = 0;
    let anonymizedCount = 0;
    guardrailMetrics.forEach(m => {
      totalInvocations += m.total_invocations;
      blockedCount += m.blocked_count;
      allowedCount += m.allowed_count;
      anonymizedCount += m.anonymized_count;
    });
    return {
      totalInvocations,
      blockedCount,
      allowedCount,
      anonymizedCount,
      blockRate: totalInvocations > 0 ? (blockedCount / totalInvocations) * 100 : 0,
    };
  }, [guardrailMetrics]);

  // Transform frontier agents for display
  const frontierAgents = useMemo<FrontierAgentSummary[]>(() => {
    return frontierAgentsList.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      status: a.status,
    }));
  }, [frontierAgentsList]);

  // Transform deployments for display
  const deploymentSummaries = useMemo<DeploymentSummary[]>(() => {
    return deployments.map(d => ({
      deployment_id: d.deployment_id,
      deployment_name: d.deployment_name,
      status: d.status,
      template_name: d.template_id,
      created_at: d.created_at,
      updated_at: d.updated_at,
    }));
  }, [deployments]);

  // Compute governance summary from real + mock data
  const summary = useMemo<GovernanceSummary>(() => {
    // Guardrail stats (REAL)
    const guardrailsActive = guardrailTemplates.filter(g => g.status === 'active').length;
    const guardrailsDraft = guardrailTemplates.filter(g => g.status === 'draft').length;
    const guardrailsFailed = guardrailTemplates.filter(g => g.status === 'failed').length;

    // Deployment stats (REAL)
    const deploymentsActive = deployments.filter(d => d.status === 'deployed' || d.status === 'delivered').length;
    const deploymentsPending = deployments.filter(d => d.status === 'pending' || d.status === 'deploying' || d.status === 'validating' || d.status === 'packaging').length;
    const deploymentsFailed = deployments.filter(d => d.status === 'failed' || d.status === 'rolled_back').length;

    // Use case stats (REAL)
    const productionUseCases = useCases.filter(uc => uc.status === 'Production').length;

    // Compliance aggregation (MOCK)
    const totalControls = COMPLIANCE_FRAMEWORKS.reduce((sum, f) => sum + f.total, 0);
    const coveredControls = COMPLIANCE_FRAMEWORKS.reduce((sum, f) => sum + f.covered, 0);
    const needsAttention = COMPLIANCE_FRAMEWORKS
      .filter(f => f.status === 'attention')
      .map(f => f.name);

    // Cost aggregation (MOCK)
    const totalBudget = BU_BUDGETS.reduce((sum, b) => sum + b.monthlyBudget, 0);
    const totalSpend = BU_BUDGETS.reduce((sum, b) => sum + b.currentSpend, 0);

    // Compute trust score based on real data
    const guardrailScore = guardrailTemplates.length > 0
      ? Math.round((guardrailsActive / guardrailTemplates.length) * 100)
      : 50;
    const deploymentScore = deployments.length > 0
      ? Math.round((deploymentsActive / deployments.length) * 100)
      : 50;
    const trustScore = Math.round((guardrailScore + deploymentScore + 78) / 3); // 78 is baseline compliance

    return {
      // Risk posture
      trustScore,
      trustTrend: 'improving',
      openIncidents: INCIDENT_SUMMARY.open,
      criticalIncidents: INCIDENT_SUMMARY.critical,
      guardrailEvents24h: guardrailMetricsTotal.totalInvocations || 0, // REAL from guardrail metrics
      policyViolations: guardrailMetricsTotal.blockedCount || 0, // REAL - blocked = policy violations

      // Inventory (MIX of real and mock)
      totalUseCases: useCases.length,
      deployedUseCases: productionUseCases,
      catalogUseCases: useCases.filter(uc => uc.status === 'Concept').length,
      totalModels: 5, // Mock - would come from Bedrock ListFoundationModels
      modelsInProduction: 4,
      modelsPendingReview: 1,
      totalAgents: frontierAgentsList.length + deployments.filter(d => d.template_id?.toLowerCase().includes('agent')).length,
      agentsWithPolicies: guardrailsActive,

      // Guardrails (REAL)
      guardrailsActive,
      guardrailsDraft,
      guardrailsFailed,

      // Deployments (REAL)
      deploymentsActive,
      deploymentsPending,
      deploymentsFailed,

      // Compliance (MOCK)
      frameworksCovered: COMPLIANCE_FRAMEWORKS.filter(f => f.status === 'on-track').length,
      frameworksTotal: COMPLIANCE_FRAMEWORKS.length,
      controlsImplemented: coveredControls,
      controlsTotal: totalControls,
      frameworksNeedingAttention: needsAttention,

      // Cost (MOCK)
      monthlySpend: totalSpend,
      budgetUtilization: Math.round((totalSpend / totalBudget) * 100),
      costAnomalies: ANOMALY_ALERTS.length,
      savingsRealized: 4810,
      savingsTarget: 7500,

      // Activity
      recentDeployments: deployments.filter(d => {
        const created = new Date(d.created_at);
        const now = new Date();
        return (now.getTime() - created.getTime()) < 24 * 60 * 60 * 1000;
      }).length,
      recentApprovals: businessCases.filter(bc => bc.status === 'Approved').length + serviceApprovalRuns.filter(sa => sa.status === 'completed').length,
      recentGuardrailBlocks: guardrailMetricsTotal.blockedCount || 0, // REAL from metrics
    };
  }, [guardrailTemplates, deployments, useCases, frontierAgentsList, businessCases, serviceApprovalRuns, guardrailMetricsTotal]);

  // Pipeline health from real use case data
  const pipeline = useMemo<PipelineHealth>(() => {
    const stages = [
      { name: 'Concept', count: useCases.filter(uc => uc.status === 'Concept').length, color: '#6366f1' },
      { name: 'Active', count: useCases.filter(uc => uc.status === 'Active').length, color: '#f59e0b' },
      { name: 'Pilot', count: useCases.filter(uc => uc.status === 'Pilot').length, color: '#3b82f6' },
      { name: 'Production', count: useCases.filter(uc => uc.status === 'Production').length, color: '#10b981' },
    ];

    // Find blocked items (use cases stuck in non-production status)
    const blockedItems = useCases
      .filter(uc => uc.status === 'Paused')
      .map(uc => ({
        id: uc.use_case_id,
        name: uc.name,
        stage: uc.status,
        blockedReason: 'Paused - awaiting review',
        owner: uc.business_owner || 'Unassigned',
        daysBlocked: Math.floor((Date.now() - new Date(uc.updated_at).getTime()) / (1000 * 60 * 60 * 24)),
      }));

    return {
      stages,
      blockedItems,
      avgTimeToProduction: 18,
    };
  }, [useCases]);

  // Activity feed from real deployments + guardrails
  const activityFeed = useMemo<ActivityFeedItem[]>(() => {
    const items: ActivityFeedItem[] = [];

    // Add recent deployments
    deployments.slice(0, 5).forEach(d => {
      items.push({
        id: `deploy-${d.deployment_id}`,
        ts: d.updated_at || d.created_at,
        type: 'deployment',
        severity: d.status === 'failed' ? 'high' : 'low',
        module: 'build',
        title: `${d.deployment_name} ${d.status}`,
        description: d.template_id || 'Deployment',
        actor: d.created_by,
      });
    });

    // Add guardrail changes
    guardrailTemplates.slice(0, 5).forEach(g => {
      items.push({
        id: `guardrail-${g.template_id}`,
        ts: g.created_at,
        type: 'guardrail',
        severity: g.status === 'active' ? 'low' : g.status === 'failed' ? 'high' : 'medium',
        module: 'secure',
        title: `Guardrail "${g.name}" ${g.status}`,
        description: `Features: ${featureSummary(g).join(', ') || 'None configured'}`,
        actor: g.created_by,
      });
    });

    // Add business case approvals
    businessCases.slice(0, 5).forEach(bc => {
      const roi = bc.computed?.financials?.roi || 0;
      const npv = bc.computed?.financials?.npv || 0;
      items.push({
        id: `bc-${bc.business_case_id}`,
        ts: bc.updated_at || bc.created_at,
        type: 'approval',
        severity: bc.status === 'Approved' ? 'low' : bc.status === 'Rejected' ? 'high' : 'medium',
        module: 'plan',
        title: `Business Case "${bc.name}" ${bc.status}`,
        description: `ROI: ${(roi * 100).toFixed(0)}% | NPV: $${(npv / 1000).toFixed(0)}k`,
        actor: bc.created_by || undefined,
      });
    });

    // Add operating model changes
    operatingModels.slice(0, 3).forEach(om => {
      const maturityLevel = om.computed?.maturity_level || 0;
      items.push({
        id: `om-${om.operating_model_id}`,
        ts: om.updated_at || om.created_at,
        type: 'config',
        severity: 'low',
        module: 'plan',
        title: `Operating Model "${om.name}" updated`,
        description: `Pattern: ${om.pattern || 'Hub-and-Spoke'} | Maturity: L${maturityLevel}`,
        actor: om.created_by || undefined,
      });
    });

    // Add service approval runs
    serviceApprovalRuns.slice(0, 5).forEach(sa => {
      const completedPhases = sa.phases?.filter(p => p.status === 'complete').length || 0;
      const totalPhases = sa.phases?.length || 8;
      items.push({
        id: `sa-${sa.slug}`,
        ts: sa.updated_at || sa.created_at,
        type: 'approval',
        severity: sa.status === 'failed' ? 'high' : sa.status === 'completed' ? 'low' : 'medium',
        module: 'secure',
        title: `Service Approval: ${sa.service} ${sa.status}`,
        description: `Framework: ${sa.framework?.toUpperCase() || 'CCMv4'} | Progress: ${completedPhases}/${totalPhases} phases`,
        actor: sa.created_by || undefined,
      });
    });

    // Add cost anomalies (mock)
    ANOMALY_ALERTS.forEach((a, i) => {
      items.push({
        id: `cost-${i}`,
        ts: a.time,
        type: 'cost',
        severity: a.severity === 'warning' ? 'medium' : 'low',
        module: 'operate',
        title: a.desc,
        description: `${a.type} alert in ${a.bu}`,
      });
    });

    // Sort by timestamp (most recent first)
    return items.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
  }, [deployments, guardrailTemplates, businessCases, operatingModels, serviceApprovalRuns]);

  const refresh = () => setRefreshKey(k => k + 1);

  return {
    loading,
    error,
    summary,
    pipeline,
    activityFeed,

    // Real data
    guardrails,
    deployments: deploymentSummaries,
    useCases,
    businessCases,
    operatingModels,
    serviceApprovalRuns,
    frontierAgents,
    guardrailMetricsTotal,

    // Mock data
    riskHeatmap: AGENT_RISK,
    riskCategories: RISK_CATEGORIES,
    complianceFrameworks: COMPLIANCE_FRAMEWORKS,
    costByModel: COST_BY_MODEL,
    buBudgets: BU_BUDGETS,

    refresh,
  };
}

export default useGovernanceAggregator;
