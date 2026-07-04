import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Scheduled weekly: sends email summary of active sales pipelines to owners & buyers
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Query all active pipelines (service role — scheduled task, no user context)
    const pipelines = await base44.asServiceRole.entities.SalesPipeline.filter(
      { status: 'active' },
      '-updated_date',
      200
    );

    if (pipelines.length === 0) {
      return Response.json({ sent: 0, message: 'No active pipelines' });
    }

    let sentCount = 0;
    const errors = [];

    for (const pipeline of pipelines) {
      try {
        // Resolve owner email from User entity
        let ownerEmail = null;
        try {
          const owner = await base44.asServiceRole.entities.User.get(pipeline.created_by_id);
          ownerEmail = owner?.email;
        } catch (_) {}

        const recipients = [ownerEmail, pipeline.buyer_email].filter(Boolean);
        if (recipients.length === 0) continue;

        const steps = pipeline.steps || [];
        const completed = steps.filter((s) => s.status === 'completed').length;
        const total = steps.length;
        const currentStep = steps.find((s) => s.id === pipeline.current_step_id);
        const pendingDocs = steps.filter((s) => s.category === 'document' && s.status !== 'completed');
        const blockedSteps = steps.filter((s) => s.status === 'blocked');

        const subject = `ABOS™ Pipeline Summary — ${pipeline.aircraft_label || pipeline.registration}`;

        const body = `
          <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <div style="background: linear-gradient(135deg, #0B2D5B, #1A4A8A); border-radius: 16px; padding: 24px; margin-bottom: 20px;">
              <h1 style="color: #f5c242; font-size: 20px; margin: 0 0 8px 0;">Sales Pipeline Summary</h1>
              <p style="color: #ffffff; font-size: 16px; margin: 0;">${pipeline.aircraft_label || pipeline.registration}</p>
            </div>

            <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
              <p style="font-size: 14px; color: #1a1a1a; margin: 0 0 12px 0;">
                <strong>Progress:</strong> ${pipeline.progress_pct || 0}% (${completed}/${total} steps completed)
              </p>
              ${currentStep ? `<p style="font-size: 14px; color: #1a1a1a; margin: 0 0 12px 0;"><strong>Current Step:</strong> ${currentStep.label}</p>` : ''}
              ${pendingDocs.length > 0 ? `<p style="font-size: 14px; color: #e67e22; margin: 0 0 12px 0;"><strong>Pending Documents:</strong> ${pendingDocs.map((s) => s.label).join(', ')}</p>` : ''}
              ${blockedSteps.length > 0 ? `<p style="font-size: 14px; color: #e74c3c; margin: 0;"><strong>Blocked:</strong> ${blockedSteps.map((s) => `${s.label} (${s.blocked_reason || 'reason unknown'})`).join(', ')}</p>` : ''}
            </div>

            <div style="background: rgba(212,160,23,0.08); border: 1px solid rgba(212,160,23,0.25); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
              <p style="font-size: 12px; color: #666; margin: 0;">
                You receive this summary because you are involved in this aircraft sales pipeline.
                Regular updates help ensure a smooth, transparent transaction.
              </p>
            </div>

            <a href="https://app.base44.com/apps/69f665b6d05c695ac1e7b353/sales-pipeline/${pipeline.registration}"
               style="display: inline-block; background: #D4A017; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 14px;">
              View Full Pipeline
            </a>

            <p style="font-size: 11px; color: #999; margin-top: 24px;">
              ABOS™ Marketspace — Aviation Intelligence & Trading OS
            </p>
          </div>
        `;

        for (const email of recipients) {
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: email,
              subject,
              body,
              from_name: 'ABOS Marketspace',
            });
            sentCount++;
          } catch (e) {
            errors.push(`${email}: ${e.message}`);
          }
        }
      } catch (e) {
        errors.push(`Pipeline ${pipeline.id}: ${e.message}`);
      }
    }

    return Response.json({
      sent: sentCount,
      total_pipelines: pipelines.length,
      errors: errors.slice(0, 5),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});