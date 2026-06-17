import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { nReg } = await req.json();

    // Deduct 3 credits for score unlock
    await base44.asServiceRole.entities.TokenTransaction.create({
      user_email: user.email,
      type: "consumption",
      amount: -3,
      feature: "ati_quick_score_unlock",
      pack: "ATI Quick Score Unlock",
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});