import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { name, company, email, website, plan, use_case } = await req.json();
    
    if (!name || !email) {
      return Response.json({ error: 'name and email are required' }, { status: 400 });
    }

    // Set plan defaults
    const selectedPlan = plan || 'free';
    let dailyLimit = 100;
    if (selectedPlan === 'pro') dailyLimit = 5000;
    if (selectedPlan === 'enterprise') dailyLimit = 999999;

    // Generate unique API key
    const apiKey = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');

    // Create partner record
    const created = await base44.asServiceRole.entities.Partner.create({
      name,
      company: company || '',
      email,
      website: website || '',
      logo_url: '',
      primary_color: '#0047AB',
      api_key: apiKey,
      plan: selectedPlan,
      daily_limit: dailyLimit,
      calls_today: 0,
      use_case: use_case || 'other',
      status: 'active'
    });

    return Response.json({
      success: true,
      partner_id: created.id,
      api_key: apiKey,
      plan: selectedPlan,
      daily_limit: dailyLimit
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});