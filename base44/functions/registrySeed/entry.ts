import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

/**
 * registrySeed — maps ABOS production capability into the governance registry.
 *
 * This adds nothing new to the product. Every skill it registers points at a backend
 * function that already exists and already works; the registry entry only records who
 * owns it, what it needs, what it must produce, and which workflows may not finish
 * without it.
 *
 * Idempotent: existing records are updated in place, never duplicated.
 *
 * POST { dry_run?: boolean }   — dry_run defaults to true and reports the plan only.
 */

const ADMIN_ROLES = ['admin', 'super_admin'];

const AGENTS = [
  {
    agent_key: 'abos_director', name: 'ABOS Director', level: 'director', supervisor_key: '',
    domain: 'company', status: 'ACTIVE', risk_level: 'high',
    description: 'Coordinates the ABOS AI organization, routes work and approvals, reports to the human Owner. Delegates; does not perform worker tasks.',
  },
  {
    agent_key: 'product_strategy_lead', name: 'Product & Strategy Lead', level: 'group_lead',
    supervisor_key: 'abos_director', domain: 'product', status: 'ACTIVE', risk_level: 'medium',
    description: 'Owns product strategy, UX, roadmap, pricing direction, funnel and customer requirements.',
  },
  {
    agent_key: 'operations_lead', name: 'Operations Lead', level: 'group_lead',
    supervisor_key: 'abos_director', domain: 'operations', status: 'ACTIVE', risk_level: 'medium',
    description: 'Owns website operations, content, customer operations, incidents and release operations.',
  },
  {
    agent_key: 'technology_lead', name: 'Technology Lead', level: 'group_lead',
    supervisor_key: 'abos_director', domain: 'technology', status: 'ACTIVE', risk_level: 'high',
    description: 'Owns application engineering, infrastructure, CI/CD, Base44, Cloudflare, Supabase, security engineering and QA.',
  },
  {
    agent_key: 'data_intelligence_lead', name: 'Data & Intelligence Lead', level: 'group_lead',
    supervisor_key: 'abos_director', domain: 'data', status: 'ACTIVE', risk_level: 'medium',
    description: 'Owns aircraft intelligence, canonical identity, ingestion, provenance, conflicts, valuation, ATI and verification.',
  },
  {
    agent_key: 'revenue_partnerships_lead', name: 'Revenue & Partnerships Lead', level: 'group_lead',
    supervisor_key: 'abos_director', domain: 'revenue', status: 'ACTIVE', risk_level: 'high',
    description: 'Owns sales, brokers, dealers, marketplaces, enterprise, partnerships, API customers and billing coordination.',
  },
  {
    agent_key: 'trust_governance_lead', name: 'Trust, Risk & Governance Lead', level: 'group_lead',
    supervisor_key: 'abos_director', domain: 'trust', status: 'ACTIVE', risk_level: 'critical',
    description: 'Owns security, permissions, audit, data quality, provenance governance, GDPR, compliance and policy enforcement.',
  },
  {
    agent_key: 'aircraft_intelligence_orchestrator', name: 'Aircraft Intelligence Orchestrator',
    level: 'orchestrator', supervisor_key: 'data_intelligence_lead', domain: 'aircraft_intelligence',
    status: 'ACTIVE', risk_level: 'medium',
    description: 'Coordinates identity resolution, registry, market, valuation, provenance and conflict detection for a single aircraft.',
    allowed_entities: ['AircraftListing', 'ATIPassport', 'FAAAircraft', 'GlobalRegistry', 'MarketComparable', 'OmvmValuation', 'OwnershipTrace'],
  },
  {
    agent_key: 'aircraft_identity_worker', name: 'Aircraft Identity Worker', level: 'worker',
    supervisor_key: 'aircraft_intelligence_orchestrator', domain: 'aircraft_intelligence',
    status: 'ACTIVE', risk_level: 'low',
    description: 'Resolves a request to one canonical aircraft_id. Registration is an attribute, never the identity.',
    allowed_skills: ['abos.skill.aircraft_identity.v1', 'abos.skill.registry_lookup.v1', 'abos.skill.ownership_trace.v1'],
    allowed_entities: ['AircraftListing', 'FAAAircraft', 'GlobalRegistry', 'OwnershipTrace'],
  },
  {
    agent_key: 'market_data_worker', name: 'Market Data Worker', level: 'worker',
    supervisor_key: 'aircraft_intelligence_orchestrator', domain: 'market',
    status: 'ACTIVE', risk_level: 'low',
    description: 'Retrieves comparables and market analytics. Never treats a single listing as market value.',
    allowed_skills: ['abos.skill.market_comparables.v1', 'abos.skill.lease_rate.v1'],
    allowed_entities: ['MarketComparable', 'AircraftListing'],
  },
  {
    agent_key: 'valuation_worker', name: 'Valuation Worker', level: 'worker',
    supervisor_key: 'aircraft_intelligence_orchestrator', domain: 'valuation',
    status: 'ACTIVE', risk_level: 'low',
    description: 'Runs the deterministic OMVM valuation service. Does not calculate values independently.',
    allowed_skills: ['abos.skill.omvm_valuation.v1'],
    allowed_entities: ['OmvmValuation', 'AircraftListing', 'ATIPassport'],
    base44_agent_name: 'valuation_analyst',
  },
  {
    agent_key: 'ati_worker', name: 'ATI Worker', level: 'worker',
    supervisor_key: 'aircraft_intelligence_orchestrator', domain: 'verification',
    status: 'ACTIVE', risk_level: 'low',
    description: 'Produces ATI transparency scoring and safety evidence lookups. Missing evidence lowers confidence and never becomes an adverse claim.',
    allowed_skills: ['abos.skill.ati_score.v1', 'abos.skill.safety_evidence.v1'],
    allowed_entities: ['ATICard', 'ATIPassport'],
  },
  {
    agent_key: 'opex_worker', name: 'Operating Cost Worker', level: 'worker',
    supervisor_key: 'aircraft_intelligence_orchestrator', domain: 'aircraft_intelligence',
    status: 'ACTIVE', risk_level: 'low',
    description: 'Models annual operating cost and maintenance exposure from the deterministic ABOS skills.',
    allowed_skills: ['abos.skill.opex.v1', 'abos.skill.engine_overhaul.v1', 'abos.skill.prop_overhaul.v1', 'abos.skill.mro_schedule.v1', 'abos.skill.insurance_estimate.v1'],
  },
  {
    agent_key: 'investment_worker', name: 'Investment Worker', level: 'worker',
    supervisor_key: 'aircraft_intelligence_orchestrator', domain: 'aircraft_intelligence',
    status: 'ACTIVE', risk_level: 'medium',
    description: 'Models total exposure and KEEP / REFURBISH / RESELL / WALK AWAY scenarios. Never presents a model as a guarantee.',
    allowed_skills: ['abos.skill.investment_health.v1', 'abos.skill.rebuild_roi.v1', 'abos.skill.tax_benefit.v1'],
  },
];

/** Skills already routed by the production invokeSkill gateway — reused as they are. */
const GATEWAY_SKILLS = [
  ['abos.skill.opex.v1', 'Operating Cost (OPEX)', 'aircraft_intelligence', 1],
  ['abos.skill.insurance_estimate.v1', 'Insurance Estimate', 'aircraft_intelligence', 1],
  ['abos.skill.leasing.v1', 'Leasing Analysis', 'aircraft_intelligence', 1],
  ['abos.skill.rebuild_roi.v1', 'Rebuild ROI', 'aircraft_intelligence', 3],
  ['abos.skill.tax_benefit.v1', 'Tax Benefit', 'aircraft_intelligence', 2],
  ['abos.skill.lease_rate.v1', 'Lease Rate', 'market', 2],
  ['abos.skill.investment_health.v1', 'Investment Health', 'aircraft_intelligence', 5],
  ['abos.skill.avionics_upgrade.v1', 'Avionics Upgrade', 'aircraft_intelligence', 1],
  ['abos.skill.exterior_refurb.v1', 'Exterior Refurbishment', 'aircraft_intelligence', 1],
  ['abos.skill.interior_refurb.v1', 'Interior Refurbishment', 'aircraft_intelligence', 1],
  ['abos.skill.detailing.v1', 'Detailing', 'aircraft_intelligence', 0],
  ['abos.skill.upgrade_compare.v1', 'Upgrade Comparison', 'aircraft_intelligence', 2],
  ['abos.skill.engine_overhaul.v1', 'Engine Overhaul', 'aircraft_intelligence', 2],
  ['abos.skill.prop_overhaul.v1', 'Propeller Overhaul', 'aircraft_intelligence', 2],
  ['abos.skill.mro_schedule.v1', 'MRO Schedule', 'aircraft_intelligence', 2],
  ['abos.skill.fractional_ownership.v1', 'Fractional Ownership', 'aircraft_intelligence', 2],
  ['abos.skill.timebuilding_buy.v1', 'Timebuilding Purchase', 'aircraft_intelligence', 2],
  ['abos.skill.fleet_change.v1', 'Fleet Change', 'aircraft_intelligence', 3],
];

/** Core capabilities that already exist as backend functions and now become governed skills. */
const FUNCTION_SKILLS = [
  {
    skill_id: 'abos.skill.aircraft_identity.v1', name: 'Canonical Aircraft Identity',
    domain: 'aircraft_intelligence', implementation_ref: 'globalAircraftLookup',
    owner_orchestrator: 'aircraft_intelligence_orchestrator', required_inputs: ['registration'],
    outputs: ['aircraft_id', 'registration', 'serial_number', 'manufacturer', 'model', 'registry', 'country'],
    description: 'Resolves an input to one canonical ABOS aircraft identity. Registration is an attribute that can change; aircraft_id is stable.',
  },
  {
    skill_id: 'abos.skill.registry_lookup.v1', name: 'Registry Lookup',
    domain: 'aircraft_intelligence', implementation_ref: 'registryLookup',
    owner_orchestrator: 'aircraft_intelligence_orchestrator', required_inputs: ['registration'],
    outputs: ['registry_record', 'owner', 'registration_date', 'status'],
    description: 'Reads the authoritative civil registry record. Absence of a record is UNAVAILABLE, never a clean result.',
  },
  {
    skill_id: 'abos.skill.market_comparables.v1', name: 'Market Comparables',
    domain: 'market', implementation_ref: 'computeMarketAnalytics',
    owner_orchestrator: 'aircraft_intelligence_orchestrator', required_inputs: ['make', 'model'],
    outputs: ['comparables', 'sample_size', 'price_range', 'liquidity'],
    description: 'Builds the comparable set and market context. States sample size; one listing is never market value.',
  },
  {
    skill_id: 'abos.skill.omvm_valuation.v1', name: 'OMVM Deterministic Valuation',
    domain: 'valuation', implementation_ref: 'omvmV5Score',
    owner_orchestrator: 'aircraft_intelligence_orchestrator',
    required_skills: ['abos.skill.aircraft_identity.v1', 'abos.skill.market_comparables.v1'],
    required_inputs: ['aircraft_id'],
    outputs: ['estimated_value_usd', 'posterior_sigma_usd', 'confidence_mode', 'valuation_mode'],
    description: 'The sole authority for ABOS aircraft value. Distinguishes seller asking price from modeled value.',
  },
  {
    skill_id: 'abos.skill.ati_score.v1', name: 'ATI Transparency Score',
    domain: 'verification', implementation_ref: 'atiScoreNative',
    owner_orchestrator: 'aircraft_intelligence_orchestrator',
    required_skills: ['abos.skill.aircraft_identity.v1'],
    required_inputs: ['aircraft_id'],
    outputs: ['ati_total', 'score_label', 'data_confidence', 'strengths', 'risks', 'missing_data'],
    description: 'Scores documentary transparency. Missing data lowers confidence and is reported as missing, never as a defect.',
  },
  {
    skill_id: 'abos.skill.safety_evidence.v1', name: 'Safety & Damage Evidence',
    domain: 'verification', implementation_ref: 'safetyEvidenceLookup',
    owner_orchestrator: 'aircraft_intelligence_orchestrator', required_inputs: ['registration'],
    outputs: ['events', 'sources_checked', 'coverage'],
    description: 'Retrieves accident and damage evidence and names the sources checked. An empty result means not found in those sources, never "no accident".',
  },
  {
    skill_id: 'abos.skill.ownership_trace.v1', name: 'Ownership Trace',
    domain: 'aircraft_intelligence', implementation_ref: 'nregSearch',
    owner_orchestrator: 'aircraft_intelligence_orchestrator', required_inputs: ['registration'],
    outputs: ['owners', 'transfers', 'gaps'],
    description: 'Traces recorded ownership history and names the gaps rather than smoothing over them.',
  },
];

const WORKFLOWS = [
  {
    workflow_key: 'abos.workflow.aircraft_screen.v1',
    name: 'SCREEN — is this aircraft worth investigating',
    description: 'Answers GO / INVESTIGATE / STOP. Not a legal, technical or airworthiness determination.',
    domain: 'aircraft_intelligence',
    owner_agent_key: 'data_intelligence_lead',
    orchestrator_key: 'aircraft_intelligence_orchestrator',
    allowed_agents: ['aircraft_identity_worker', 'market_data_worker', 'ati_worker'],
    required_skills: ['abos.skill.aircraft_identity.v1', 'abos.skill.registry_lookup.v1', 'abos.skill.ati_score.v1', 'abos.skill.safety_evidence.v1'],
    optional_skills: ['abos.skill.market_comparables.v1', 'abos.skill.ownership_trace.v1'],
    min_confidence: 0.5,
    sla_minutes: 15,
  },
  {
    workflow_key: 'abos.workflow.aircraft_assess.v1',
    name: 'ASSESS — is the asking price defensible',
    description: 'Compares asking price against modeled value, comparables, configuration and condition, and states what is missing.',
    domain: 'valuation',
    owner_agent_key: 'data_intelligence_lead',
    orchestrator_key: 'aircraft_intelligence_orchestrator',
    allowed_agents: ['aircraft_identity_worker', 'market_data_worker', 'valuation_worker', 'ati_worker'],
    required_skills: ['abos.skill.aircraft_identity.v1', 'abos.skill.market_comparables.v1', 'abos.skill.omvm_valuation.v1', 'abos.skill.ati_score.v1', 'abos.skill.ownership_trace.v1'],
    optional_skills: ['abos.skill.safety_evidence.v1', 'abos.skill.registry_lookup.v1'],
    min_confidence: 0.6,
    sla_minutes: 30,
  },
  {
    workflow_key: 'abos.workflow.aircraft_commit.v1',
    name: 'COMMIT — what financial exposure am I accepting',
    description: 'Models purchase price, CAPEX, operating cost, reserves and 12/24/36-month exposure across KEEP, REFURBISH, RESELL and WALK AWAY. Modeled outcomes are never presented as guaranteed.',
    domain: 'aircraft_intelligence',
    owner_agent_key: 'data_intelligence_lead',
    orchestrator_key: 'aircraft_intelligence_orchestrator',
    allowed_agents: ['aircraft_identity_worker', 'valuation_worker', 'opex_worker', 'investment_worker'],
    required_skills: ['abos.skill.aircraft_identity.v1', 'abos.skill.omvm_valuation.v1', 'abos.skill.opex.v1', 'abos.skill.engine_overhaul.v1', 'abos.skill.mro_schedule.v1', 'abos.skill.investment_health.v1'],
    optional_skills: ['abos.skill.insurance_estimate.v1', 'abos.skill.prop_overhaul.v1', 'abos.skill.rebuild_roi.v1', 'abos.skill.tax_benefit.v1', 'abos.skill.market_comparables.v1'],
    min_confidence: 0.6,
    sla_minutes: 60,
  },
];

Deno.serve(async (req) => {
  let base44;
  let user;
  try {
    base44 = createClientFromRequest(req);
    user = await base44.auth.me();
  } catch (_) {
    user = null;
  }
  if (!user?.email) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  if (!ADMIN_ROLES.includes(user.role)) {
    return Response.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const dryRun = body.dry_run !== false;
  const db = base44.asServiceRole.entities;
  const plan = { agents: [], skills: [], workflows: [] };

  try {
    for (const agent of AGENTS) {
      plan.agents.push(await upsert(db.AgentDefinition, { agent_key: agent.agent_key }, {
        allowed_tools: [], allowed_entities: [], allowed_workflows: [], allowed_skills: [],
        risk_level: 'low', approval_required: false, max_delegation_depth: 4, max_retries: 2,
        escalates_to: agent.supervisor_key || 'abos_director',
        ...agent,
      }, dryRun));
    }

    for (const [skillId, name, domain, creditCost] of GATEWAY_SKILLS) {
      plan.skills.push(await upsert(db.AgentSkill, { skill_id: skillId }, {
        skill_id: skillId,
        name,
        slug: skillId.split('.').slice(2, -1).join('-'),
        domain,
        description: `${name} — reuses the existing ABOS production skill through the invokeSkill gateway.`,
        owner_group: 'data_intelligence_lead',
        owner_orchestrator: 'aircraft_intelligence_orchestrator',
        status: 'ACTIVE',
        implementation_kind: 'skill_gateway',
        implementation_ref: skillId,
        legacy_skill_id: skillId,
        credit_cost: creditCost,
        evidence_required: true,
        audit_required: true,
        retry_policy: { max_attempts: 2, backoff_ms: 2000 },
        enabled: true,
      }, dryRun));
    }

    for (const skill of FUNCTION_SKILLS) {
      plan.skills.push(await upsert(db.AgentSkill, { skill_id: skill.skill_id }, {
        owner_group: 'data_intelligence_lead',
        status: 'ACTIVE',
        implementation_kind: 'base44_function',
        evidence_required: true,
        audit_required: true,
        credit_cost: 0,
        retry_policy: { max_attempts: 2, backoff_ms: 2000 },
        enabled: true,
        ...skill,
      }, dryRun));
    }

    for (const workflow of WORKFLOWS) {
      plan.workflows.push(await upsert(db.AgentWorkflow, { workflow_key: workflow.workflow_key }, {
        version: 'v1',
        status: 'ACTIVE',
        trigger: 'manual',
        evidence_required: true,
        audit_required: true,
        max_retries: 2,
        max_delegation_depth: 4,
        enabled: true,
        ...workflow,
      }, dryRun));
    }

    if (!dryRun) {
      await db.AgentAuditLog.create({
        actor: String(user.email).toLowerCase(),
        action: 'Seeded the ABOS agent, skill and workflow registry',
        action_category: 'registry_change',
        after: { agents: plan.agents.length, skills: plan.skills.length, workflows: plan.workflows.length },
        result: 'success',
        timestamp: new Date().toISOString(),
      }).catch(() => {});
    }

    return Response.json({ ok: true, dry_run: dryRun, summary: summarize(plan), plan });
  } catch (error) {
    return Response.json({ ok: false, error: error?.message || String(error), plan }, { status: 500 });
  }
});

async function upsert(entity, key, record, dryRun) {
  const keyField = Object.keys(key)[0];
  const existing = (await entity.filter(key, '-created_date', 1).catch(() => []))[0];
  const verdict = existing ? 'update' : 'create';
  if (!dryRun) {
    if (existing) await entity.update(existing.id, record);
    else await entity.create(record);
  }
  return { key: key[keyField], action: verdict };
}

function summarize(plan) {
  const count = (rows, action) => rows.filter((row) => row.action === action).length;
  return {
    agents: { create: count(plan.agents, 'create'), update: count(plan.agents, 'update') },
    skills: { create: count(plan.skills, 'create'), update: count(plan.skills, 'update') },
    workflows: { create: count(plan.workflows, 'create'), update: count(plan.workflows, 'update') },
  };
}
