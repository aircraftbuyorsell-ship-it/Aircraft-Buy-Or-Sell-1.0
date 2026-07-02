import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Only admins/super_admins can invite
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden — admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { email, role = 'admin', tier = 'enterprise', sub_tier = 'elite' } = body;

    if (!email) return Response.json({ error: 'Email is required' }, { status: 400 });

    // Invite the user (platform only allows 'admin' or 'user' roles for invites;
    // we set the custom 'super_admin' role on the User entity below)
    const inviteRole = role === 'admin' || role === 'user' ? role : 'admin';
    const inviteResult = await base44.users.inviteUser(email, inviteRole);

    // After invite, find the user and upgrade their tier to enterprise/elite (no limits)
    try {
      const users = await base44.asServiceRole.entities.User.filter({ email });
      if (users && users.length > 0) {
        const targetUser = users[0];
        await base44.asServiceRole.entities.User.update(targetUser.id, {
          role,
          tier,
          sub_tier,
          subscription_status: 'active',
        });
        return Response.json({
          success: true,
          message: `User ${email} invited as ${role} with ${tier}/${sub_tier} tier (no limits)`,
          invite: inviteResult,
          userUpdated: true,
        });
      }
    } catch (updateErr) {
      // User may not exist yet until they accept the invite
      return Response.json({
        success: true,
        message: `User ${email} invited as ${role}. Tier upgrade will apply after they accept the invite.`,
        invite: inviteResult,
        userUpdated: false,
        note: 'User must accept invite first, then re-run this function to upgrade tier.',
      });
    }

    return Response.json({
      success: true,
      message: `User ${email} invited as ${role}`,
      invite: inviteResult,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});