import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Entity automation: fires on SalesPipeline update
// Sends email notification to owner & buyer when status, step, or progress changes
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }
    const payload = await req.json();

    const { event, data, old_data } = payload;

    if (!data) {
      return Response.json({ skipped: true, reason: 'no data' });
    }

    // Detect relevant changes
    const changes = [];

    if (old_data?.status !== data.status) {
      changes.push(`Status: <strong>${old_data?.status || '—'}</strong> → <strong>${data.status}</strong>`);
    }

    if (old_data?.current_step_id !== data.current_step_id) {
      const steps = data.steps || [];
      const newStep = steps.find((s) => s.id === data.current_step_id);
      if (newStep) {
        changes.push(`Advanced to: <strong>${newStep.label}</strong>`);
      }
    }

    if (old_data?.progress_pct !== data.progress_pct) {
      changes.push(`Progress: <strong>${old_data?.progress_pct || 0}%</strong> → <strong>${data.progress_pct || 0}%</strong>`);
    }

    if (old_data?.buyer_name !== data.buyer_name && data.buyer_name) {
      changes.push(`New buyer assigned: <strong>${data.buyer_name}</strong>`);
    }

    // Check for newly completed steps
    if (old_data?.steps && data.steps) {
      const newlyCompleted = data.steps.filter((newStep, i) => {
        const oldStep = old_data.steps?.[i];
        return oldStep && oldStep.status !== 'completed' && newStep.status === 'completed';
      });
      newlyCompleted.forEach((s) => changes.push(`✅ Completed: <strong>${s.label}</strong>`));
    }

    if (changes.length === 0) {
      return Response.json({ sent: false, reason: 'no relevant changes' });
    }

    // Resolve owner email
    let ownerEmail = null;
    try {
      const owner = await base44.asServiceRole.entities.User.get(data.created_by_id);
      ownerEmail = owner?.email;
    } catch (_) {}

    const recipients = [ownerEmail, data.buyer_email].filter(Boolean);
    if (recipients.length === 0) {
      return Response.json({ sent: false, reason: 'no recipients with email' });
    }

    const subject = `🔔 Pipeline Update — ${data.aircraft_label || data.registration}`;

    const emailBody = `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #0B2D5B, #1A4A8A); border-radius: 16px; padding: 24px; margin-bottom: 20px;">
          <h1 style="color: #f5c242; font-size: 18px; margin: 0 0 8px 0;">Pipeline Status Update</h1>
          <p style="color: #ffffff; font-size: 15px; margin: 0;">${data.aircraft_label || data.registration}</p>
        </div>

        <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
          <ul style="font-size: 14px; color: #1a1a1a; margin: 0; padding-left: 20px; line-height: 1.8;">
            ${changes.map((c) => `<li>${c}</li>`).join('')}
          </ul>
        </div>

        <div style="background: rgba(212,160,23,0.08); border: 1px solid rgba(212,160,23,0.25); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
          <p style="font-size: 13px; color: #1a1a1a; margin: 0;">
            <strong>Overall Progress:</strong> ${data.progress_pct || 0}%
          </p>
        </div>

        <a href="https://app.base44.com/apps/69f665b6d05c695ac1e7b353/sales-pipeline/${data.registration}"
           style="display: inline-block; background: #D4A017; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 14px;">
          View Pipeline
        </a>

        <p style="font-size: 11px; color: #999; margin-top: 24px;">
          ABOS™ Marketspace — Automated Sales Pipeline Notification
        </p>
      </div>
    `;

    let sent = 0;
    for (const email of recipients) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject,
          body: emailBody,
          from_name: 'ABOS Marketspace',
        });
        sent++;
      } catch (_) {}
    }

    return Response.json({ sent: true, recipients: sent, changes: changes.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});