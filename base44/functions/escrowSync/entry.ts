// Escrow.com integration — create & fetch transactions
// API docs: https://www.escrow.com/api
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ESCROW_API_BASE = "https://api.escrow.com/2017-09-01";

function basicAuthHeader() {
  const user = Deno.env.get("ESCROW_API_USER");
  const key = Deno.env.get("ESCROW_API_KEY");
  return "Basic " + btoa(`${user}:${key}`);
}

async function createEscrowTransaction(tx) {
  const body = {
    currency: (tx.currency || "USD").toLowerCase(),
    description: `Aircraft: ${tx.aircraft_label || "Aviation transaction"}`,
    items: [{
      title: tx.aircraft_label || "Aircraft",
      description: `Sale of ${tx.aircraft_label || "aircraft"}`,
      type: "general_merchandise",
      inspection_period: (tx.inspection_period_days || 3) * 86400,
      quantity: 1,
      schedule: [{
        amount: String(tx.sale_amount),
        payer_customer: tx.buyer_email,
        beneficiary_customer: tx.seller_email,
      }],
    }],
    parties: [
      { role: "buyer", customer: tx.buyer_email },
      { role: "seller", customer: tx.seller_email },
    ],
  };

  // Add broker as a third party if present (for fee routing)
  if (tx.broker_email && tx.finders_fee_pct > 0) {
    body.parties.push({ role: "broker", customer: tx.broker_email });
  }

  const res = await fetch(`${ESCROW_API_BASE}/transaction`, {
    method: "POST",
    headers: { "Authorization": basicAuthHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.errors?.[0]?.message || `Escrow.com error ${res.status}`);
  return data;
}

async function fetchEscrowTransaction(id) {
  const res = await fetch(`${ESCROW_API_BASE}/transaction/${id}`, {
    headers: { "Authorization": basicAuthHeader() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.errors?.[0]?.message || `Escrow.com error ${res.status}`);
  return data;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { action, transaction_id } = await req.json();

    const tx = await base44.entities.EscrowTransaction.get(transaction_id);
    if (!tx) return Response.json({ error: "Transaction not found" }, { status: 404 });

    if (action === "create") {
      const result = await createEscrowTransaction(tx);
      await base44.entities.EscrowTransaction.update(transaction_id, {
        escrow_provider: "escrow_com",
        escrow_external_id: String(result.id),
        escrow_landing_url: result.landing_page || null,
        status: "contract_sent",
      });
      return Response.json({ success: true, escrow_id: result.id, landing_url: result.landing_page });
    }

    if (action === "sync") {
      if (!tx.escrow_external_id) return Response.json({ error: "No external escrow ID" }, { status: 400 });
      const remote = await fetchEscrowTransaction(tx.escrow_external_id);
      const statusMap = {
        "created": "contract_sent",
        "agreed": "contract_signed",
        "funds_held": "funds_secured",
        "in_progress": "inspection",
        "closed": "closed",
        "cancelled": "cancelled",
      };
      const mapped = statusMap[remote.status?.in_progress ? "in_progress" : remote.status] || tx.status;
      let settlement = {};
      if (mapped === "closed" && tx.status !== "closed") {
        const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: tx.seller_email }, '-created_date', 1);
        const sellerProfile = profiles[0];
        const applyFee = sellerProfile?.total_listings_count > 1;
        const amount = Number(tx.sale_amount) || 0;
        const pct = amount < 100000 ? 2.5 : amount < 500000 ? 1.5 : amount < 1000000 ? 1 : 0.5;
        const cap = amount < 100000 ? 2475 : amount < 500000 ? 7485 : amount < 1000000 ? 9990 : Infinity;
        const fee = applyFee ? Math.min(amount * pct / 100, cap) : 0;
        settlement = { finders_fee_pct: applyFee ? pct : 0, finders_fee_amount: fee, seller_net: amount - fee };
      }
      await base44.entities.EscrowTransaction.update(transaction_id, { status: mapped, closed_at: mapped === "closed" ? new Date().toISOString() : tx.closed_at, ...settlement });
      return Response.json({ success: true, remote_status: remote.status, local_status: mapped, ...settlement });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});