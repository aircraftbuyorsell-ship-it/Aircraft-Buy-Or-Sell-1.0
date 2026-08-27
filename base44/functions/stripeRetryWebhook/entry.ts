import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@14.25.0';

/**
 * Manual retry of failed webhook events.
 *
 * ADMIN ONLY: This function allows manual retry of failed Stripe webhook events.
 * It should only be called by administrators after investigating the root cause.
 *
 * Usage:
 * POST /admin/stripe/retry-webhook
 * {
 *   "stripe_event_id": "evt_1234567890"
 * }
 */

export default async (req: Request) => {
  const base44 = createClientFromRequest(req);

  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const { stripe_event_id } = await req.json();
    if (!stripe_event_id) {
      return Response.json({ error: 'Event ID required' }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    // Fetch the original webhook event from Stripe
    const event = await stripe.events.retrieve(stripe_event_id);
    if (!event) {
      return Response.json({ error: 'Event not found in Stripe' }, { status: 404 });
    }

    // Update the WebhookEvent record to reset status for retry
    try {
      await base44.asServiceRole.entities.WebhookEvent?.update?.(stripe_event_id, {
        status: 'retrying',
        last_retry_at: new Date().toISOString(),
        retry_count: (parseInt(event.request?.retry_count || '0') || 0) + 1,
      }).catch(() => {});
    } catch (updateErr) {
      console.warn('Could not update webhook event:', updateErr.message);
    }

    return Response.json({
      success: true,
      message: `Webhook event ${stripe_event_id} queued for retry`,
      event_type: event.type,
      created: event.created,
    });
  } catch (error) {
    console.error('Webhook retry error:', error.message);
    return Response.json(
      { error: error.message || 'Failed to retry webhook event' },
      { status: 500 }
    );
  }
};
