// Installer lifecycle state machine.
//
// Pure and I/O-free so the entire install flow — including its failure and
// recovery paths — is unit-testable without touching a filesystem, a network,
// or a TTY. The CLI is a thin driver over this.

export const STEPS = Object.freeze([
  'welcome',
  'license_activation',
  'tenant_identification',
  'platform_detection',
  'configuration',
  'branding',
  'feature_selection',
  'core_connection',
  'health_check',
  'install',
  'validation',
  'complete',
]);

export const STEP_LABELS = Object.freeze(Object.assign(Object.create(null), {
  welcome: 'Welcome',
  license_activation: 'License activation',
  tenant_identification: 'Tenant identification',
  platform_detection: 'Platform detection',
  configuration: 'Configuration',
  branding: 'Branding',
  feature_selection: 'Feature selection',
  core_connection: 'ABOS Core connection',
  health_check: 'Health check',
  install: 'Install',
  validation: 'Validation',
  complete: 'Complete',
}));

export const STATUS = Object.freeze({
  PENDING: 'pending',
  ACTIVE: 'active',
  DONE: 'done',
  FAILED: 'failed',
});

export function createInstallState() {
  return {
    currentStep: STEPS[0],
    steps: STEPS.map((id, index) => ({
      id,
      label: STEP_LABELS[id],
      status: index === 0 ? STATUS.ACTIVE : STATUS.PENDING,
      error: null,
    })),
    data: {},
    failed: false,
  };
}

function cloneState(state) {
  return {
    ...state,
    steps: state.steps.map((s) => ({ ...s })),
    data: { ...state.data },
  };
}

export function stepIndex(stepId) {
  return STEPS.indexOf(stepId);
}

/**
 * Marks the current step complete and advances. Merged `data` accumulates
 * across steps (license -> tenant -> platform -> config...), which is what the
 * final install step writes out.
 */
export function completeStep(state, stepId, data = {}) {
  const index = stepIndex(stepId);
  if (index === -1) throw new Error(`Unknown installer step: ${stepId}`);

  const next = cloneState(state);
  next.steps[index] = { ...next.steps[index], status: STATUS.DONE, error: null };
  next.data = { ...next.data, ...data };
  next.failed = false;

  const following = STEPS[index + 1];
  if (following) {
    next.currentStep = following;
    next.steps[index + 1] = { ...next.steps[index + 1], status: STATUS.ACTIVE };
  } else {
    next.currentStep = 'complete';
  }
  return next;
}

/**
 * Records a failure WITHOUT advancing. Every failure carries a recovery hint —
 * an installer that says only "failed" strands a customer mid-integration.
 */
export function failStep(state, stepId, error, recovery = null) {
  const index = stepIndex(stepId);
  if (index === -1) throw new Error(`Unknown installer step: ${stepId}`);

  const next = cloneState(state);
  next.steps[index] = {
    ...next.steps[index],
    status: STATUS.FAILED,
    error: { message: String(error?.message || error || 'Unknown error'), recovery: recovery || recoveryFor(stepId) },
  };
  next.currentStep = stepId;
  next.failed = true;
  return next;
}

/** Clears a failure so the same step can be retried after the user fixes the cause. */
export function retryStep(state, stepId) {
  const index = stepIndex(stepId);
  if (index === -1) throw new Error(`Unknown installer step: ${stepId}`);

  const next = cloneState(state);
  next.steps[index] = { ...next.steps[index], status: STATUS.ACTIVE, error: null };
  next.currentStep = stepId;
  next.failed = false;
  return next;
}

/** Actionable recovery guidance per step. */
export function recoveryFor(stepId) {
  switch (stepId) {
    case 'license_activation':
      return 'Check the activation key from your ABOS Partner Portal. Keys look like "abos_tenant_..." and are shown only once at issue — if you no longer have it, ask an ABOS administrator to issue a replacement key.';
    case 'tenant_identification':
      return 'Your key resolved but no active tenant was returned. This usually means the license is suspended or expired — check the license status in the Partner Portal or contact ABOS support.';
    case 'platform_detection':
      return 'Run the installer from the root of your project (the directory containing package.json), or pass --platform to choose an adapter explicitly.';
    case 'configuration':
      return 'Check that the target directory is writable and that no conflicting abos.config.json exists (pass --force to overwrite).';
    case 'branding':
      return 'Brand colors must be hex values such as "#0b5fff", and logo URLs must be http(s).';
    case 'feature_selection':
      return 'You can only enable features your license grants. Run with --features to inspect what your license includes, or ask ABOS about upgrading your plan.';
    case 'core_connection':
      return 'Could not reach ABOS Core. Check outbound network access and any proxy/firewall rules, then retry.';
    case 'health_check':
      return 'ABOS Core was reachable but reported the integration unhealthy. The message above says which check failed.';
    case 'install':
      return 'Writing files failed. Check directory permissions and available disk space, then retry.';
    case 'validation':
      return 'The generated integration did not validate. Re-run with --verbose for details; no partial config is left behind.';
    default:
      return 'Re-run the installer with --verbose for more detail.';
  }
}

export function progress(state) {
  const done = state.steps.filter((s) => s.status === STATUS.DONE).length;
  return { done, total: STEPS.length, percent: Math.round((done / STEPS.length) * 100) };
}

export function isComplete(state) {
  return state.steps.every((s) => s.status === STATUS.DONE);
}

/**
 * Renders the step checklist the way the brief specifies:
 *   ✓ License verified
 *   ○ Platform configuration
 */
export function renderChecklist(state) {
  return state.steps
    .map((step) => {
      const marker =
        step.status === STATUS.DONE ? '✓'
          : step.status === STATUS.FAILED ? '✗'
            : step.status === STATUS.ACTIVE ? '▸'
              : '○';
      return `${marker} ${step.label}`;
    })
    .join('\n');
}

/**
 * Validates a requested feature set against what the license actually grants.
 * The installer must never write a config enabling a capability the license
 * doesn't include — the API would reject it at runtime, so allowing it here
 * would only produce a broken integration that fails later, in production.
 */
export function reconcileFeatures(requested, licensed) {
  const licensedSet = new Set(Array.isArray(licensed) ? licensed : []);
  const requestedList = Array.isArray(requested) ? requested : [...licensedSet];
  const enabled = requestedList.filter((f) => licensedSet.has(f));
  const rejected = requestedList.filter((f) => !licensedSet.has(f));
  return { enabled, rejected, ok: rejected.length === 0 };
}
