# Stripe Payment Integration Guide

This guide covers the Stripe payment processing system for the ABOS platform, including checkout, webhooks, and testing.

## Architecture Overview

### Components

1. **Frontend Checkout** (`PlanCheckoutButton.jsx`)
   - Initiates checkout through `stripeCreateCheckout` function
   - Handles errors and provides user feedback
   - Implements checkout deduplication to prevent double-charges
   - Redirects to Stripe Checkout hosted page

2. **Checkout Creation** (`base44/functions/stripeCreateCheckout/entry.ts`)
   - Creates Stripe checkout sessions
   - Supports three checkout types:
     - Buyer plan subscriptions (PRO, BROKER)
     - White-label tenant subscriptions (with 14-day trial)
     - Legacy token purchases
   - Validates prices against server-side allowlist

3. **Webhook Handler** (`base44/functions/stripeWebhook/entry.ts`)
   - Processes Stripe webhook events
   - Verifies webhook signatures (prevents spoofed requests)
   - Implements idempotency checking (prevents duplicate processing)
   - Tracks webhook events for monitoring
   - Syncs tenant licenses and user entitlements based on payment status

4. **Checkout Status** (`base44/functions/stripeCheckoutStatus/entry.ts`)
   - Checks Stripe session status after redirect
   - Used by CheckoutSuccess page to verify payment completion
   - Retrieves session details and metadata

5. **Checkout Success Page** (`src/pages/CheckoutSuccess.jsx`)
   - Displays checkout result (success/pending/error)
   - Verifies session status via stripeCheckoutStatus
   - Provides user feedback and next steps

## Payment Flow

### Successful Checkout Flow

```
User clicks "Subscribe"
    ↓
PlanCheckoutButton validates and calls stripeCreateCheckout
    ↓
Backend creates Stripe session and returns URL
    ↓
User redirected to Stripe Checkout page (hosted by Stripe)
    ↓
User enters payment details and confirms
    ↓
Stripe processes payment and creates session/subscription
    ↓
Stripe redirects user to success_url with session_id param
    ↓
CheckoutSuccess page verifies session status via API
    ↓
Dashboard shows success message
    ↓
Stripe sends webhook events (checkout.session.completed, etc.)
    ↓
Webhook handler processes events and updates license/entitlements
    ↓
User gains access to purchased features
```

### Webhook Event Processing

```
Stripe sends webhook event
    ↓
Webhook handler verifies signature (prevents spoofing)
    ↓
Check idempotency (if duplicate, return success)
    ↓
Create WebhookEvent record for tracking
    ↓
Process based on event type:
  - checkout.session.completed: grant entitlements
  - customer.subscription.created/updated: sync subscription status
  - invoice.payment_succeeded: mark payment as complete
  - etc.
    ↓
Update WebhookEvent status (completed/failed)
    ↓
Return 200 OK to Stripe
```

## Error Handling

### Frontend Errors

1. **Network Error**: Show message "Network connection error. Please check your connection and try again."
2. **Invalid Return URL**: Validate URL is absolute (starts with http)
3. **Session Not Found**: User directed to retry checkout
4. **Authentication Error (401/403)**: Redirect to login
5. **Checkout Already in Progress**: Prevent double-click with deduplication

### Backend Errors

1. **Webhook Signature Invalid**: Return 400, don't process
2. **Idempotent Event**: Log and return 200 (prevent retry)
3. **Processing Error**: Track in WebhookEvent with error message, attempt again on retry
4. **Entitlement Grant Failed**: Mark event as failed, retry later

### User-Facing Messages

Error messages are normalized via `paymentErrors.js` utility:
- Card declined → "Your card was declined. Please try another payment method or contact your bank."
- Expired card → "Your card has expired. Please use a different payment method."
- Network error → "Network connection error. Please check your connection and try again."
- Generic → "Could not complete your payment. Please try again or contact support."

## Testing

### Prerequisites

1. Stripe test keys configured in environment:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_test_...
   ```

2. Test credit cards from Stripe:
   - **Success**: 4242 4242 4242 4242
   - **Decline**: 4000 0000 0000 0002
   - **Insufficient Funds**: 4000 0000 0000 9995

### Manual Testing Checklist

#### Checkout Flow
- [ ] Click "Subscribe" → redirected to Stripe Checkout
- [ ] Enter test card → payment succeeds
- [ ] Success page shows "Payment Successful!"
- [ ] Session status verified correctly
- [ ] User can navigate back to dashboard

#### Error Handling
- [ ] Use declined card → shows error, allows retry
- [ ] Close checkout before paying → shows expired session error
- [ ] Double-click subscribe button → shows "checkout in progress" error
- [ ] Invalid network → shows network error

#### Webhook Processing
- [ ] Payment successful → user gets entitlements
- [ ] Duplicate webhook → processed only once
- [ ] Failed webhook → event marked as failed
- [ ] Check WebhookEventMonitor → shows all events

#### Idempotency
- [ ] Same webhook fired twice → processed only once
- [ ] Manual webhook replay → no duplicate processing
- [ ] Check WebhookEvent records → both attempts tracked

#### Subscription Management
- [ ] Subscription created → License status = active
- [ ] Subscription updated → License updated
- [ ] Subscription cancelled → License status = expired
- [ ] Invoice paid → Entitlement synced
- [ ] Invoice failed → Entitlement status updated

### Automated Testing

```bash
# Run unit tests
npm test -- paymentErrors.test.js
npm test -- checkoutDedup.test.js

# Test webhook signature verification
curl -X POST http://localhost:8000/api/stripeWebhook \
  -H "stripe-signature: t=,v1=invalid" \
  -d '{}'
# Should return 400 Invalid signature

# Test webhook idempotency
curl -X POST http://localhost:8000/api/stripeWebhook \
  -H "stripe-signature: valid" \
  -d '...' 
# First call: processes event
# Second call with same event ID: returns idempotent response
```

### Webhook Testing with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhook events to local server
stripe listen --forward-to http://localhost:8000/api/stripeWebhook

# In another terminal, trigger test events
stripe trigger checkout.session.completed
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
```

## Security Considerations

1. **Webhook Signature Verification**
   - All incoming webhooks are verified against STRIPE_WEBHOOK_SECRET
   - Invalid signatures are rejected with 400 status
   - Prevents spoofed payment events

2. **Price Validation**
   - stripeCreateCheckout uses server-side allowlist of valid prices
   - Prevents clients from modifying prices
   - Always validate on backend before creating session

3. **Idempotency**
   - Each webhook event ID tracked in database
   - Duplicate events rejected before processing
   - Prevents unintentional duplicate charges

4. **Authentication**
   - Checkout requires signed-in user
   - 401/403 errors redirect to login
   - Prevents unauthorized purchase attempts

5. **User Data Protection**
   - API keys stored securely
   - Webhook events sanitized before logging
   - Payment details never stored locally
   - PCI compliance handled by Stripe

## Monitoring

### WebhookEventMonitor Component

Admin dashboard shows:
- Event type and status
- Event timestamp
- Event ID for debugging
- Auto-refresh every 10 seconds

### Metrics to Track

1. **Payment Success Rate**
   - Total checkouts initiated
   - Successful payments
   - Failed/cancelled checkouts

2. **Webhook Processing**
   - Events received
   - Events processed successfully
   - Events failed
   - Average processing time

3. **User Experience**
   - Error rates by type
   - Retry attempts
   - Average checkout completion time

## Troubleshooting

### User Reports: "Charged but didn't get access"

1. Check WebhookEventMonitor for webhook events
2. Query WebhookEvent table for failed events
3. Check PaymentEvent table for payment records
4. If webhook failed:
   - Manually re-trigger webhook from Stripe dashboard
   - Or grant entitlement manually via admin panel

### User Reports: "Checkout failed silently"

1. Check browser console for errors
2. Check stripeCheckoutStatus response
3. Verify STRIPE_SECRET_KEY is correct
4. Check if session expired (15 min window)

### Payment Not Appearing in Stripe Dashboard

1. Verify STRIPE_SECRET_KEY is from correct Stripe account
2. Check webhook logs in Stripe dashboard
3. Verify webhook secret is correctly configured
4. Test with Stripe CLI to verify connectivity

### Double Charges Detected

1. Check WebhookEvent table for duplicate event IDs
2. Verify idempotency check is working
3. Check Stripe webhook retry settings
4. Review recent checkout attempts in checkoutDedup

## Configuration

### Environment Variables

```bash
# Required
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# Optional
STRIPE_WEBHOOK_TIMEOUT=30000
STRIPE_WEBHOOK_RETRY_MAX_ATTEMPTS=3

# Optional — comma-separated allowlist of origins checkout may return the buyer
# to. When set it is authoritative and replaces the built-in defaults entirely,
# so it must list EVERY origin the app is served from (custom domain, www, and
# any Base44 or Cloudflare preview host). Leave it unset to use the built-in
# defaults: aircraftbuyorsell.com and abos-marketspace.com (both with and
# without www), plus *.base44.app and *.aircraftbuyorsell.workers.dev.
ABOS_CHECKOUT_RETURN_ORIGINS=https://aircraftbuyorsell.com,https://www.aircraftbuyorsell.com
```

> **Checkout returns HTTP 400 `Invalid checkout return origin`?**
> The origin the buyer is browsing is not in the effective allowlist. Either add
> it to `ABOS_CHECKOUT_RETURN_ORIGINS` or unset that variable to fall back to the
> defaults. The rejected origin is written to the `stripeCreateCheckout` function
> logs. Note that setting the variable to a partial list silently disables the
> defaults — that is the most common cause of this error.

### Stripe Dashboard Configuration

1. **Webhook Endpoints**
   - Add endpoint for: `<your-domain>/api/stripeWebhook`
   - Select events: `checkout.session.completed`, `charge.succeeded`, `customer.subscription.*`, `invoice.payment_*`

2. **Checkout Settings**
   - Auto email receipts: enabled
   - Allow promotion codes: enabled
   - Automatic tax: enabled (if applicable)

3. **Subscription Settings**
   - Automatic tax: enabled
   - Invoice settings: email on renewal

## Related Documentation

- [BRANCH_PROTECTION_SETUP.md](./BRANCH_PROTECTION_SETUP.md) - GitHub protection rules
- [GOVERNANCE.md](./GOVERNANCE.md) - Project governance
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)

## Version History

- **v1.0** (2026-08-27): Initial implementation with SDK v0.8.40
  - Checkout session creation
  - Webhook processing with idempotency
  - Payment status tracking
  - Deduplication of checkout attempts
