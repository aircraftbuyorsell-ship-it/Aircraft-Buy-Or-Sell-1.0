// Handles a user-initiated account deletion REQUEST.
// Platform-managed auth prevents direct deletion, so we:
//   1) mark the user with deletion_requested_at
//   2) email admin + user confirming the request
// An admin can then process it manually.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { reason } = await req.json().catch(() => ({}));

    // Mark on the user record
    await base44.auth.updateMe({
      deletion_requested_at: new Date().toISOString(),
      deletion_reason: reason || "",
    });

    const subject = `[ABOS] Account deletion request — ${user.email}`;
    const body = `
User ${user.full_name || user.email} (${user.email}) has requested account deletion.

Reason: ${reason || "(not provided)"}

Requested at: ${new Date().toISOString()}

Please review and process in the admin dashboard.
    `.trim();

    // Notify admin — best-effort
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "admin@abos.app";
    try {
      await base44.integrations.Core.SendEmail({
        to: adminEmail,
        subject,
        body,
      });
    } catch (_) { /* non-fatal */ }

    // Confirm to user
    try {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: "Your ABOS account deletion request",
        body: `Hi ${user.full_name || ""},\n\nWe've received your request to delete your ABOS account.\nOur team will process it within 7 business days and notify you once complete.\n\nIf this was a mistake, reply to this email and we'll cancel the request.\n\n— The ABOS Team`,
      });
    } catch (_) { /* non-fatal */ }

    return Response.json({ success: true });
  } catch (error) {
    console.error("requestAccountDeletion error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});