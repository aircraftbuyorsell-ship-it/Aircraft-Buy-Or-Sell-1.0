/**
 * Payment error handling utilities for consistent error feedback across the app.
 */

const PAYMENT_ERROR_MESSAGES = {
  // Stripe-specific errors
  card_declined: "Your card was declined. Please try another payment method or contact your bank.",
  expired_card: "Your card has expired. Please use a different payment method.",
  incorrect_cvc: "The CVC code you entered is incorrect.",
  processing_error: "An error occurred while processing your payment. Please try again.",
  rate_limit: "Too many requests. Please wait a moment and try again.",

  // Authentication errors
  401: "You need to sign in to make a payment.",
  403: "You don't have permission to complete this purchase.",

  // Generic errors
  network_error: "Network connection error. Please check your connection and try again.",
  invalid_url: "Invalid checkout return URL.",
  no_session: "Checkout session not found or has expired.",
  timeout: "The request took too long. Please try again.",

  // Default
  default: "Could not complete your payment. Please try again or contact support.",
};

/**
 * Normalize and categorize payment errors
 */
export function normalizePaymentError(error) {
  if (!error) return PAYMENT_ERROR_MESSAGES.default;

  // Check for Stripe error code
  if (error.error_code) {
    return PAYMENT_ERROR_MESSAGES[error.error_code] || PAYMENT_ERROR_MESSAGES.default;
  }

  // Check for HTTP status code
  if (error.status) {
    return PAYMENT_ERROR_MESSAGES[error.status] || PAYMENT_ERROR_MESSAGES.default;
  }

  // Check error message
  const message = error.message || '';
  if (message.toLowerCase().includes('card')) {
    return PAYMENT_ERROR_MESSAGES.card_declined;
  }
  if (message.toLowerCase().includes('network')) {
    return PAYMENT_ERROR_MESSAGES.network_error;
  }
  if (message.toLowerCase().includes('timeout')) {
    return PAYMENT_ERROR_MESSAGES.timeout;
  }

  // Return custom message or default
  return message || PAYMENT_ERROR_MESSAGES.default;
}

/**
 * Determine if an error is recoverable (user can retry)
 */
export function isRecoverableError(error) {
  if (!error) return false;

  const status = error.status || error.response?.status;
  const nonRecoverable = [401, 403, 404];

  return !nonRecoverable.includes(status);
}

/**
 * Log payment error for monitoring
 */
export function logPaymentError(errorContext, error) {
  const errorData = {
    timestamp: new Date().toISOString(),
    context: errorContext,
    message: error?.message,
    status: error?.status,
    errorCode: error?.error_code,
    stack: error?.stack,
  };

  console.error('Payment error:', errorData);

  // Send to monitoring service if available
  if (window.__errorReporter) {
    window.__errorReporter('payment_error', errorData);
  }
}

/**
 * Handle Stripe-specific errors
 */
export function handleStripeError(stripeError) {
  const error = {
    message: normalizePaymentError(stripeError),
    recoverable: isRecoverableError(stripeError),
    type: stripeError.type,
    code: stripeError.code,
  };

  logPaymentError('stripe_payment', stripeError);

  return error;
}
