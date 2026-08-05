import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

function calculateFindersFee(askingPrice) {
  const price = Number(askingPrice);
  if (!Number.isFinite(price) || price < 0) throw new Error('asking_price must be a non-negative number');
  const bracket = price < 100000 ? { tier: '$0–$99k', pct: 2.5 }
    : price < 500000 ? { tier: '$100k–$499k', pct: 1.5 }
    : price < 1000000 ? { tier: '$500k–$999k', pct: 1.0 }
    : { tier: '$1M+', pct: 0.5 };
  return { ...bracket, fee_usd: Math.round(price * (bracket.pct / 100) * 100) / 100 };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { asking_price } = await req.json();
    return Response.json(calculateFindersFee(asking_price));
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
});