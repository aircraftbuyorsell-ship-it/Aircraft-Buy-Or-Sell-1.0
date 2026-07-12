// invokeMarketplaceTool — ABOS Developer Marketplace API Gateway
// Flow: auth → validate tool → check balance → deduct tokens → sign & call webhook → log invocation

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function getTokenAccount(base44, email) {
  const behaviors = await base44.asServiceRole.entities.UserBehavior.filter(
    { user_email: email }, "-created_date", 1
  );
  return behaviors[0] || null;
}

async function debitTokens(base44, account, amount) {
  const result = await base44.asServiceRole.entities.UserBehavior.updateMany(
    { id: account.id, tokens_remaining: { $gte: amount } },
    { $inc: { tokens_remaining: -amount } }
  );
  if (!result?.updated) return null;
  return Math.max(0, (Number(account.tokens_remaining) || 0) - amount);
}

async function refundTokens(base44, account, amount, toolId, reason) {
  const result = await base44.asServiceRole.entities.UserBehavior.updateMany(
    { id: account.id },
    { $inc: { tokens_remaining: amount } }
  );
  if (!result?.updated) throw new Error("Unable to refund marketplace tokens");
  const refreshed = await base44.asServiceRole.entities.UserBehavior.get(account.id);
  const balance = Number(refreshed.tokens_remaining) || 0;
  await base44.asServiceRole.entities.TokenTransaction.create({
    user_email: account.user_email,
    type: "refund",
    amount,
    feature: `marketplace_tool_${toolId}`,
    balance_after: balance,
    description: reason,
  });
  return balance;
}

async function signPayload(secret, body) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(body);
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyData,
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { tool_integration_id, payload: toolPayload = {} } = await req.json();
    if (!tool_integration_id) {
      return Response.json({ error: "tool_integration_id is required" }, { status: 400 });
    }

    // 1. Fetch tool
    let tool = null;
    try {
      tool = await base44.asServiceRole.entities.ToolIntegration.get(tool_integration_id);
    } catch (_) { /* not found */ }
    if (!tool) return Response.json({ error: "Tool not found" }, { status: 404 });
    if (!tool.is_active || tool.status !== "active") {
      return Response.json({ error: "Tool is not available" }, { status: 403 });
    }

    // 2. Atomically debit the canonical balance. The record id prevents
    // duplicate UserBehavior rows from being charged together.
    const account = await getTokenAccount(base44, user.email);
    const currentBalance = Number(account?.tokens_remaining) || 0;
    const debitedBalance = account
      ? await debitTokens(base44, account, tool.token_cost)
      : null;
    if (debitedBalance === null) {
      return Response.json({
        error: "Insufficient tokens",
        required: tool.token_cost,
        balance: currentBalance
      }, { status: 402 });
    }

    // 3. Record the successful debit in the append-only ledger.
    await base44.asServiceRole.entities.TokenTransaction.create({
      user_email: user.email,
      type: "consumption",
      amount: -tool.token_cost,
      feature: `marketplace_tool_${tool.id}`,
      balance_after: debitedBalance
    });

    // 4. Calculate revenue split
    const revSharePct = tool.revenue_share_pct ?? 30;
    const developerRevenue = Math.round(tool.token_cost * (revSharePct / 100) * 100) / 100;
    const platformRevenue = tool.token_cost - developerRevenue;

    // 5. Build & sign outbound webhook payload
    const outboundBody = JSON.stringify({
      tool_id: tool.id,
      tool_name: tool.name,
      invoked_by: user.email,
      invoked_at: new Date().toISOString(),
      payload: toolPayload
    });

    const headers = {
      "Content-Type": "application/json",
      "X-ABOS-Tool-Id": tool.id,
      "X-ABOS-Timestamp": new Date().toISOString()
    };

    if (tool.webhook_secret) {
      headers["X-ABOS-Signature"] = await signPayload(tool.webhook_secret, outboundBody);
    }

    // 6. Call external webhook
    const startMs = Date.now();
    let externalStatus = 0;
    let responsePayload = null;
    let errorMessage = null;
    let invocationStatus = "success";

    try {
      const externalRes = await fetch(tool.webhook_url, {
        method: "POST",
        headers,
        body: outboundBody,
        signal: AbortSignal.timeout(15000)
      });
      externalStatus = externalRes.status;
      if (externalRes.ok) {
        const contentType = externalRes.headers.get("content-type") || "";
        responsePayload = contentType.includes("application/json")
          ? await externalRes.json()
          : { raw: await externalRes.text() };
      } else {
        invocationStatus = "failed";
        errorMessage = `External tool returned HTTP ${externalStatus}`;
        responsePayload = { raw: await externalRes.text() };
      }
    } catch (error) {
      invocationStatus = "failed";
      errorMessage = error.name === "TimeoutError"
        ? "External tool timed out"
        : `External tool request failed: ${error.message}`;
      responsePayload = { error: errorMessage };
    }
    const durationMs = Date.now() - startMs;

    let finalBalance = debitedBalance;
    if (invocationStatus === "failed") {
      finalBalance = await refundTokens(
        base44, account, tool.token_cost, tool.id, errorMessage
      );
      invocationStatus = "refunded";
    }

    // 7. Log ToolInvocation ledger entry
    await base44.asServiceRole.entities.ToolInvocation.create({
      tool_integration_id: tool.id,
      tool_name: tool.name,
      user_email: user.email,
      developer_id: tool.developer_id,
      tokens_charged: invocationStatus === "success" ? tool.token_cost : 0,
      platform_revenue: invocationStatus === "success" ? platformRevenue : 0,
      developer_revenue: invocationStatus === "success" ? developerRevenue : 0,
      status: invocationStatus,
      request_payload: toolPayload,
      response_payload: responsePayload,
      error_message: errorMessage,
      http_status_code: externalStatus,
      duration_ms: durationMs,
      invoked_at: new Date().toISOString()
    });

    // 8. Update tool invocation count
    await base44.asServiceRole.entities.ToolIntegration.update(tool.id, {
      invocation_count: (tool.invocation_count || 0) + 1,
      total_revenue_tokens: (tool.total_revenue_tokens || 0)
        + (invocationStatus === "success" ? tool.token_cost : 0)
    });

    if (invocationStatus === "refunded") {
      return Response.json({
        error: errorMessage,
        http_status_code: externalStatus,
        refunded: true,
        balance: finalBalance
      }, { status: 502 });
    }

    return Response.json({
      success: true,
      result: responsePayload,
      tokens_charged: tool.token_cost,
      balance: finalBalance,
      duration_ms: durationMs
    });

  } catch (error) {
    console.error("invokeMarketplaceTool error:", error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});