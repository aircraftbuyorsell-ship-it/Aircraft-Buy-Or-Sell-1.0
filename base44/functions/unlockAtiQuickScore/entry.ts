import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function buildEmailHtml(nReg, result) {
  const dims = [
    { key: "documentation", label: "Documentation" },
    { key: "technical", label: "Technical" },
    { key: "transparency", label: "Transparency" },
    { key: "transaction_ready", label: "Transaction Ready" },
    { key: "usage_mission", label: "Usage & Mission" },
    { key: "storage_exposure", label: "Storage & Exposure" },
    { key: "config_clarity", label: "Config Clarity" },
    { key: "market_readiness", label: "Market Readiness" },
  ];

  const total = dims.reduce((s, d) => s + (result[d.key] || 0), 0);
  const verdict = total >= 90 ? "Exceptional — Strong Buy" : total >= 72 ? "Strong — Buy" : total >= 54 ? "Fair — Due Diligence Advised" : "Caution — Investigate Further";

  const dimRows = dims.map(d => {
    const score = result[d.key] || 0;
    const pct = Math.round((score / 15) * 100);
    const reason = (result.reasons && result.reasons[d.key]) || "";
    return `
      <tr>
        <td style="padding:8px 0;font-weight:600;color:#e2e8f0;">${d.label}</td>
        <td style="padding:8px 0;text-align:right;font-weight:700;color:#00f5ff;">${score}/15</td>
        <td style="padding:8px 0;">
          <div style="background:rgba(255,255,255,0.08);border-radius:4px;height:6px;width:120px;">
            <div style="background:${score >= 12 ? '#22c55e' : score >= 8 ? '#E8A83A' : '#ef4444'};border-radius:4px;height:6px;width:${pct}%;"></div>
          </div>
        </td>
      </tr>
      ${reason ? `<tr><td colspan="3" style="padding:2px 0 12px;font-size:12px;color:rgba(255,255,255,0.45);">${reason}</td></tr>` : ""}
    `;
  }).join("");

  const omvmDisplay = result.omvm_low && result.omvm_high
    ? `$${result.omvm_low.toLocaleString()} – $${result.omvm_high.toLocaleString()}`
    : (result.omvm_low ? `$${result.omvm_low.toLocaleString()}` : "—");

  return `
    <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0A081E;color:#e2e8f0;padding:32px;border-radius:12px;">
      <h1 style="color:#D4A017;font-size:24px;margin:0 0 4px;">ATI Quick Score Report</h1>
      <p style="color:rgba(255,255,255,0.45);font-size:13px;margin:0 0 24px;">${nReg || "Aircraft Analysis"}</p>
      
      <div style="text-align:center;margin:24px 0;">
        <div style="font-size:48px;font-weight:900;color:#00f5ff;">${total}</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.45);">out of 120</div>
        <div style="margin-top:12px;padding:8px 16px;border-radius:20px;display:inline-block;font-weight:700;font-size:13px;background:${total >= 72 ? 'rgba(34,197,94,0.15)' : total >= 54 ? 'rgba(212,160,23,0.15)' : 'rgba(239,68,68,0.15)'};color:${total >= 72 ? '#22c55e' : total >= 54 ? '#D4A017' : '#ef4444'};">
          ${verdict}
        </div>
      </div>

      ${result.flash_line ? `<p style="padding:12px 16px;background:rgba(0,245,255,0.06);border-left:3px solid #00f5ff;border-radius:4px;font-size:13px;margin:16px 0;color:#e2e8f0;">${result.flash_line}</p>` : ""}

      <table style="width:100%;border-collapse:collapse;margin:24px 0;">
        ${dimRows}
      </table>

      <div style="display:flex;justify-content:space-between;padding:16px;background:rgba(255,255,255,0.04);border-radius:8px;margin:24px 0;">
        <div><span style="color:rgba(255,255,255,0.45);font-size:12px;">OMVM Estimate</span><br><strong style="color:#e2e8f0;font-size:16px;">${omvmDisplay}</strong></div>
        ${result.asking_price ? `<div><span style="color:rgba(255,255,255,0.45);font-size:12px;">Asking Price</span><br><strong style="color:#e2e8f0;font-size:16px;">$${result.asking_price.toLocaleString()}</strong></div>` : ""}
      </div>

      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0;">
      <p style="color:rgba(255,255,255,0.3);font-size:11px;text-align:center;">ATI Quick Score by ABOS MarketSpace • This is an automated AI estimate</p>
    </div>
  `;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { nReg, email, result } = await req.json();

    if (!email || !email.includes("@")) {
      return Response.json({ error: "Valid email is required" }, { status: 400 });
    }

    // Deduct 3 credits for score unlock
    await base44.asServiceRole.entities.TokenTransaction.create({
      user_email: user.email,
      type: "consumption",
      amount: -3,
      feature: "ati_quick_score_unlock",
      pack: "ATI Quick Score Unlock",
    });

    // Build and send email via Gmail
    if (result) {
      const htmlBody = buildEmailHtml(nReg || "Aircraft", result);

      // Build MIME message
      const subject = `ATI Quick Score: ${nReg || "Your Aircraft Analysis"}`;
      const from = "ati@aircraftbuyorsell.com";
      const to = email;

      const rawMime = [
        `From: ABOS ATI <${from}>`,
        `To: ${to}`,
        `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
        "MIME-Version: 1.0",
        'Content-Type: text/html; charset="UTF-8"',
        "Content-Transfer-Encoding: 7bit",
        "",
        htmlBody,
      ].join("\r\n");

      try {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection("gmail");
        await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            raw: btoa(unescape(encodeURIComponent(rawMime))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
          }),
        });
      } catch (_) {
        // Email sending failed but credits were already deducted — log and continue
        console.warn("Gmail send failed, credits already deducted");
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});