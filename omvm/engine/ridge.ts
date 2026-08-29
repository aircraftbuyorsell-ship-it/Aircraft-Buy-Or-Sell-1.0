/**
 * OMVM 2.0 Ridge Regression
 * Regularized linear regression for hedonic pricing adjustments
 */

export interface HedoniFeature {
  name: string;
  value: number;
  coefficient?: number;
  sigma?: number;
}

export interface RidgeRegressionResult {
  predicted_log_price: number;
  coefficients: Record<string, number>;
  intercept: number;
  r_squared?: number;
  residual_sigma?: number;
  mode: 'full' | 'reduced' | 'fallback';
}

/**
 * Simplified ridge regression predictor
 * For n_features >= 8 and n_observations >= 10
 *
 * min ||Xβ - y||² + λ||β||²
 *
 * Solution: β = (X'X + λI)⁻¹X'y
 */
export function predictRidgeLog(
  features: HedoniFeature[],
  intercept: number,
  lambda: number,
  mode: 'full' | 'reduced' | 'fallback' = 'reduced'
): RidgeRegressionResult {
  // Build feature vector
  const n_features = features.length;

  // For fallback or reduced mode, use only a subset of important features
  let active_features = features;
  if (mode === 'fallback') {
    active_features = features.slice(0, Math.min(3, features.length));
  } else if (mode === 'reduced') {
    active_features = features.slice(0, Math.min(5, features.length));
  }

  // Simple weighted combination (would be full ridge in production)
  let predicted_log = intercept;
  const coefficients: Record<string, number> = { intercept };

  active_features.forEach((feature) => {
    if (feature.coefficient !== undefined) {
      const contrib = feature.coefficient * feature.value;
      predicted_log += contrib;
      coefficients[feature.name] = feature.coefficient;
    }
  });

  return {
    predicted_log_price: predicted_log,
    coefficients,
    intercept,
    mode,
  };
}

/**
 * Convert features to hedonic adjustments
 * E.g., engine hours → impact on ln(price)
 */
export function featuresToAdjustment(
  features: HedoniFeature[],
  coefficients: Record<string, number>
): number {
  let total_ln_adjustment = 0;

  features.forEach((feature) => {
    const coeff = coefficients[feature.name];
    if (coeff !== undefined) {
      total_ln_adjustment += coeff * feature.value;
    }
  });

  // Convert log adjustment back to multiplicative
  return Math.exp(total_ln_adjustment);
}

/**
 * Simple matrix solver for small problems (n ≤ 10)
 * Using Gauss-Jordan elimination with partial pivoting
 */
export function solveLinearSystem(
  A: number[][],
  b: number[]
): number[] {
  const n = A.length;
  if (b.length !== n) {
    throw new Error('Dimension mismatch');
  }

  // Copy for in-place elimination
  const a = A.map((row) => [...row]);
  const rhs = [...b];

  // Forward elimination with partial pivoting
  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(a[row][col]) > Math.abs(a[maxRow][col])) {
        maxRow = row;
      }
    }

    if (Math.abs(a[maxRow][col]) < 1e-10) {
      throw new Error('Singular or near-singular matrix');
    }

    // Swap rows
    [a[col], a[maxRow]] = [a[maxRow], a[col]];
    [rhs[col], rhs[maxRow]] = [rhs[maxRow], rhs[col]];

    // Eliminate below
    for (let row = col + 1; row < n; row++) {
      const factor = a[row][col] / a[col][col];
      for (let j = col; j < n; j++) {
        a[row][j] -= factor * a[col][j];
      }
      rhs[row] -= factor * rhs[col];
    }
  }

  // Back substitution
  const x = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = rhs[i];
    for (let j = i + 1; j < n; j++) {
      x[i] -= a[i][j] * x[j];
    }
    x[i] /= a[i][i];
  }

  return x;
}

/**
 * Fit ridge regression (simplified version for small n)
 */
export function fitRidge(
  X: number[][],
  y: number[],
  lambda: number
): { beta: number[]; intercept: number } {
  const n = X.length;
  const p = X[0]?.length || 1;

  if (n < p) {
    throw new Error('Not enough observations for regression');
  }

  // Normal equations: (X'X + λI)β = X'y
  // Compute X'X
  const XtX = Array(p)
    .fill(0)
    .map(() => Array(p).fill(0));
  for (let i = 0; i < p; i++) {
    for (let j = 0; j < p; j++) {
      for (let k = 0; k < n; k++) {
        XtX[i][j] += X[k][i] * X[k][j];
      }
    }
  }

  // Add ridge penalty
  for (let i = 0; i < p; i++) {
    XtX[i][i] += lambda;
  }

  // Compute X'y
  const Xty = Array(p).fill(0);
  for (let i = 0; i < p; i++) {
    for (let k = 0; k < n; k++) {
      Xty[i] += X[k][i] * y[k];
    }
  }

  // Solve
  const beta = solveLinearSystem(XtX, Xty);

  // Intercept is typically handled separately in practice
  const intercept = y.reduce((a, b) => a + b, 0) / n;

  return { beta, intercept };
}
