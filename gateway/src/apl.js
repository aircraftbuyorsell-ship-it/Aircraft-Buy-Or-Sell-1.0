// ABOS APL/ADL governance layer.
//
// Per apl_core_compact.min.json the layering is:
//
//   APL   identity, skill, permission, trust, audit, communication
//   MCP   tool/data access
//
// MCP sits UNDER APL. So the MCP tool surface is not hand-written here — it is
// derived from the ADL manifests below, which means a tool cannot be exposed
// without first declaring what it is, what it may do, and at what risk level.
//
// Governance flow (README.md):
//   APL Request -> ADL Validation -> Capability Check -> Permission Check
//   -> Risk Policy -> Execution -> Evidence -> Audit Log
//
// First implementation of RFC-001. The spec documents note nothing had been
// merged into running code yet; this is that merge for two skills only.

import { handleOmvm, handleAtiScore } from './ati.js';

export const APL_VERSION = '1.0';

// Deny-default from the spec. These are never reachable through this gateway
// regardless of manifest content — the safety_note requires explicit human
// approval and legal implementation for all of them.
const DENY_ALWAYS = [
  'payment.execute',
  'money.transfer',
  'ownership.change',
  'contract.sign',
  'registry.modify',
  'approval.bypass',
];

const ALLOW_DEFAULT = [
  'aircraft.read',
  'market.analyze',
  'models.compare',
  'report.create',
  'recommendation.generate',
  'documentation.verify',
  'audit.log',
];

// ── ADL manifests ──────────────────────────────────────────────────────
// Agent Definition Language: identity, capabilities, policy. Describes the
// executor, not the request.

export const ADL_MANIFESTS = [
  {
    adl_version: '1.0',
    id: 'abos.valuation.omvm',
    apl_id: 'apl://aviation.abos/valuation/omvm-agent/v1',
    type: 'tool',
    owner: { organization: 'ABOS' },
    skill: 'Open Market Value Model v5.1',
    description:
      'Deterministic aircraft market valuation. Returns a computed figure with source provenance and confidence, or declines when comparable data is insufficient. Never estimates.',
    capabilities: ['value_aircraft', 'compare_market'],
    permissions: ['aircraft.read', 'market.analyze'],
    autonomy: 'A1', // analytical — produces figures, decides nothing
    trust: 'APL-T2', // verified
    audit: 'APL-A2', // decision-level
    risk_level: 'low',
    requires_human_approval: false,
    supported_protocols: ['apl/1.0'],
    evidence: { provenance: 'required', confidence: 'required' },
    status: 'verified',
    mcp: {
      name: 'abos_omvm_value',
      inputSchema: {
        type: 'object',
        properties: {
          registration: { type: 'string', description: 'Tail number, e.g. N3006Q' },
          make: { type: 'string' },
          model: { type: 'string' },
          year: { type: 'number' },
          engine_hours: { type: 'number', description: 'Hours since major overhaul' },
          tbo: { type: 'number' },
          asking_price: { type: 'number' },
          listing_id: { type: 'string' },
        },
      },
    },
  },
  {
    adl_version: '1.0',
    id: 'abos.aircraft.ati',
    apl_id: 'apl://aviation.abos/aircraft/ati-agent/v1',
    type: 'tool',
    owner: { organization: 'ABOS' },
    skill: 'Aircraft Transparency Index v2.1',
    description:
      'Scores an aircraft across eight transparency dimensions (0-120) and returns the evidence behind each. Dimension notes are AI-generated; the total and any valuation are computed.',
    capabilities: ['score_aircraft', 'generate_report', 'documentation.verify'],
    permissions: ['aircraft.read', 'market.analyze', 'report.create', 'recommendation.generate'],
    autonomy: 'A2', // advisory — produces recommendations for a human
    trust: 'APL-T2',
    audit: 'APL-A2',
    risk_level: 'low',
    requires_human_approval: false,
    supported_protocols: ['apl/1.0'],
    evidence: { provenance: 'required', confidence: 'required' },
    status: 'verified',
    mcp: {
      name: 'abos_ati_score',
      inputSchema: {
        type: 'object',
        properties: {
          registration: { type: 'string', description: 'Tail number, e.g. N3006Q' },
          listing_text: { type: 'string', description: 'Raw listing or advert text' },
          make: { type: 'string' },
          model: { type: 'string' },
          year: { type: 'number' },
          ttaf: { type: 'number' },
          engine_hours: { type: 'number' },
          asking_price: { type: 'number' },
          listing_id: { type: 'string' },
        },
      },
    },
  },
];

const BY_MCP_NAME = new Map(ADL_MANIFESTS.map((m) => [m.mcp.name, m]));

// ── Governance checks ──────────────────────────────────────────────────

function aplError(code, detail, extra = {}) {
  return { apl_error: code, detail, ...extra };
}

// ADL Validation
function validateManifest(manifest) {
  if (!manifest) return aplError('APL_SKILL_NOT_FOUND', 'no ADL manifest for this tool');
  if (manifest.status !== 'verified') {
    return aplError('APL_POLICY_BLOCKED', `manifest status is ${manifest.status}`);
  }
  if (!manifest.supported_protocols?.includes(`apl/${APL_VERSION}`)) {
    return aplError('APL_VERSION_ERROR', `manifest does not support apl/${APL_VERSION}`);
  }
  return null;
}

// Capability Check — can it do this at all?
function checkCapability(manifest, action) {
  if (!action) return null; // tool-level call, capability is implied by the manifest
  if (!manifest.capabilities.includes(action)) {
    return aplError('APL_PERMISSION_DENIED', `capability ${action} not declared`, {
      declared: manifest.capabilities,
    });
  }
  return null;
}

// Permission Check — may it do this here?
function checkPermissions(manifest) {
  const denied = manifest.permissions.filter((p) => DENY_ALWAYS.includes(p));
  if (denied.length) {
    return aplError('APL_POLICY_BLOCKED', 'manifest requests deny-default permissions', { denied });
  }
  const undeclared = manifest.permissions.filter((p) => !ALLOW_DEFAULT.includes(p));
  if (undeclared.length) {
    return aplError('APL_PERMISSION_DENIED', 'permissions outside allow-default set', {
      undeclared,
    });
  }
  return null;
}

// Risk Policy
function checkRisk(manifest, context = {}) {
  if (manifest.requires_human_approval && !context.human_approved) {
    return aplError('APL_POLICY_BLOCKED', 'skill requires explicit human approval');
  }
  if (manifest.risk_level === 'high' && manifest.autonomy === 'A4') {
    return aplError('APL_POLICY_BLOCKED', 'autonomous execution of a high-risk skill is refused');
  }
  return null;
}

// ── Audit log ──────────────────────────────────────────────────────────
// Hash-chained per the spec's event_fields. The chain only means anything if
// previous_hash survives between requests, and a Worker is stateless — so this
// needs the ABOS_AUDIT KV binding. Without it the chain still emits, but every
// event links to genesis and the tamper-evidence is gone. That degradation is
// reported in the response rather than hidden.

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function writeAudit(env, manifest, action, input, output) {
  const kv = env.ABOS_AUDIT || null;
  const previousHash = kv ? (await kv.get('audit:head')) || 'genesis' : 'genesis';

  const event = {
    event_id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    agent_id: manifest.apl_id,
    action,
    model: output?.disclosure?.model || null,
    input_sources: (output?.omvm?.provenance?.sources || output?.provenance?.sources || []).map(
      (s) => s.source
    ),
    output: {
      status: output?.status ?? null,
      ati_score: output?.ati_score ?? null,
      omvm_value: output?.omvm_value ?? output?.omvm?.value ?? null,
    },
    previous_hash: previousHash,
    audit_level: manifest.audit,
  };

  event.current_hash = await sha256Hex(
    [event.event_id, event.timestamp, event.agent_id, event.action, JSON.stringify(event.output), event.previous_hash].join('|')
  );

  if (kv) {
    await kv.put(`audit:${event.event_id}`, JSON.stringify(event));
    await kv.put('audit:head', event.current_hash);
  }

  return { event, chained: !!kv };
}

// ── Execution ──────────────────────────────────────────────────────────
// The ADL manifest maps a tool onto an executor. Arguments arrive flat from
// MCP clients and are reshaped into what the REST handlers already expect.

function toRestBody(manifest, args = {}) {
  const aircraft = {
    registration: args.registration,
    make: args.make,
    model: args.model,
    year: args.year,
    ttaf: args.ttaf,
    engine_hours: args.engine_hours,
    tbo: args.tbo,
    asking_price: args.asking_price,
  };
  for (const k of Object.keys(aircraft)) {
    if (aircraft[k] === undefined) delete aircraft[k];
  }

  return manifest.id === 'abos.valuation.omvm'
    ? { aircraft, listing_id: args.listing_id }
    : { aircraft_data: aircraft, listing_text: args.listing_text || '', listing_id: args.listing_id };
}

async function execute(manifest, args, env, baseUrl) {
  const body = toRestBody(manifest, args);
  const req = new Request('https://internal/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const res =
    manifest.id === 'abos.valuation.omvm'
      ? await handleOmvm(req, env, baseUrl)
      : await handleAtiScore(req, env, baseUrl);
  return res.json();
}

// ── MCP surface ────────────────────────────────────────────────────────

export function aplToolList() {
  return ADL_MANIFESTS.map((m) => ({
    name: m.mcp.name,
    description: `${m.description}\n\nADL: ${m.id} · autonomy ${m.autonomy} · trust ${m.trust} · risk ${m.risk_level}`,
    inputSchema: m.mcp.inputSchema,
  }));
}

export function isAplTool(name) {
  return BY_MCP_NAME.has(name);
}

export async function callAplTool(name, args, env, baseUrl) {
  const manifest = BY_MCP_NAME.get(name);

  for (const check of [
    validateManifest(manifest),
    manifest && checkCapability(manifest, args?.action),
    manifest && checkPermissions(manifest),
    manifest && checkRisk(manifest, args?.context),
  ]) {
    if (check) return { error: check };
  }

  let output;
  try {
    output = await execute(manifest, args, env, baseUrl);
  } catch (err) {
    return { error: aplError('APL_POLICY_BLOCKED', `execution failed: ${err.message}`) };
  }

  const { event, chained } = await writeAudit(env, manifest, manifest.capabilities[0], args, output);

  // Evidence is mandatory for both manifests, so the envelope always carries
  // where the answer came from and how confident it is.
  return {
    result: {
      apl_version: APL_VERSION,
      agent: manifest.apl_id,
      skill: manifest.skill,
      payload: output,
      evidence: {
        provenance: output?.provenance || output?.omvm?.provenance || null,
        confidence: output?.confidence || output?.omvm?.confidence || null,
      },
      audit: {
        event_id: event.event_id,
        current_hash: event.current_hash,
        level: manifest.audit,
        chained,
        ...(chained ? {} : { warning: 'ABOS_AUDIT KV binding absent — hash chain not persisted' }),
      },
    },
  };
}
