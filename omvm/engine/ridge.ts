/**
 * OMVM 2.0 Ridge Regression
 * Closed-form, small-n ridge regression for log aircraft asking prices.
 * Designed for the stateless runtime; no training state is persisted.
 */

export interface RidgeObservation {
  features: number[];
  log_price: number;
  weight?: number;
}

export interface RidgeFitResult {
  beta: number[];
  intercept: number;
  predicted_log_price: number;
  residual_sigma_log: number;
  effective_n: number;
  feature_count: number;
  degrees_of_freedom: number;
  condition_ok: boolean;
}

function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length;
  if (n === 0 || b.length !== n || A.some((r) => r.length !== n)) throw new Error('Invalid linear system dimensions');
  const a = A.map((r) => [...r]);
  const rhs = [...b];
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    if (Math.abs(a[pivot][col]) < 1e-12) throw new Error('Singular matrix');
    [a[col], a[pivot]] = [a[pivot], a[col]];
    [rhs[col], rhs[pivot]] = [rhs[pivot], rhs[col]];
    for (let row = col + 1; row < n; row++) {
      const factor = a[row][col] / a[col][col];
      for (let j = col; j < n; j++) a[row][j] -= factor * a[col][j];
      rhs[row] -= factor * rhs[col];
    }
  }
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let value = rhs[i];
    for (let j = i + 1; j < n; j++) value -= a[i][j] * x[j];
    x[i] = value / a[i][i];
  }
  return x;
}

/** Weighted ridge with an unpenalized intercept. Features should be standardized. */
export function fitRidge(observations: RidgeObservation[], lambda: number, targetFeatures?: number[]): RidgeFitResult {
  if (!observations.length) throw new Error('No observations');
  if (!(lambda > 0)) throw new Error('lambda must be > 0');
  const p = observations[0].features.length;
  if (!p || observations.some((o) => o.features.length !== p)) throw new Error('Feature dimension mismatch');

  const weights = observations.map((o) => Math.max(1e-6, o.weight ?? 1));
  const sumW = weights.reduce((a, b) => a + b, 0);
  const meanX = Array(p).fill(0);
  const meanY = observations.reduce((s, o, i) => s + weights[i] * o.log_price, 0) / sumW;
  for (let j = 0; j < p; j++) meanX[j] = observations.reduce((s, o, i) => s + weights[i] * o.features[j], 0) / sumW;

  const A = Array.from({ length: p }, () => Array(p).fill(0));
  const b = Array(p).fill(0);
  for (let i = 0; i < observations.length; i++) {
    const x = observations[i].features.map((v, j) => v - meanX[j]);
    const y = observations[i].log_price - meanY;
    for (let j = 0; j < p; j++) {
      b[j] += weights[i] * x[j] * y;
      for (let k = 0; k < p; k++) A[j][k] += weights[i] * x[j] * x[k];
    }
  }
  for (let j = 0; j < p; j++) A[j][j] += lambda;
  const beta = solveLinearSystem(A, b);
  const intercept = meanY - beta.reduce((s, v, j) => s + v * meanX[j], 0);
  const target = targetFeatures ?? meanX;
  if (target.length !== p) throw new Error('Target feature dimension mismatch');
  const predicted = intercept + beta.reduce((s, v, j) => s + v * target[j], 0);
  const residualSS = observations.reduce((s, o, i) => {
    const fitted = intercept + beta.reduce((a, v, j) => a + v * o.features[j], 0);
    return s + weights[i] * (o.log_price - fitted) ** 2;
  }, 0);
  const effectiveN = (sumW ** 2) / weights.reduce((s, w) => s + w ** 2, 0);
  const dof = Math.max(1, effectiveN - p - 1);
  return { beta, intercept, predicted_log_price: predicted, residual_sigma_log: Math.sqrt(Math.max(0, residualSS / dof)), effective_n: effectiveN, feature_count: p, degrees_of_freedom: dof, condition_ok: true };
}

export function predictRidgeLog(features: { name: string; value: number; coefficient?: number }[], intercept: number, _lambda: number, mode: 'full' | 'reduced' | 'fallback' = 'reduced') {
  const active = mode === 'fallback' ? features.slice(0, 3) : mode === 'reduced' ? features.slice(0, 5) : features;
  const coefficients: Record<string, number> = { intercept };
  const predicted = active.reduce((sum, f) => {
    const c = f.coefficient ?? 0;
    coefficients[f.name] = c;
    return sum + c * f.value;
  }, intercept);
  return { predicted_log_price: predicted, coefficients, intercept, mode };
}

export function featuresToAdjustment(features: { name: string; value: number }[], coefficients: Record<string, number>): number {
  return Math.exp(features.reduce((s, f) => s + (coefficients[f.name] ?? 0) * f.value, 0));
}

export { solveLinearSystem };
