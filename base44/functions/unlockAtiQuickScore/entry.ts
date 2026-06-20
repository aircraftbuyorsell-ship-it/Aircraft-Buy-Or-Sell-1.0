import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

// ─── Constants ───────────────────────────────────────────────────────────────

const DIMS = [
  { key: "documentation",     label: "Documentation"     },
  { key: "technical",         label: "Technical"         },
  { key: "transparency",      label: "Transparency"      },
  { key: "transaction_ready", label: "Transaction Ready" },
  { key: "usage_mission",     label: "Usage & Mission"   },
  { key: "storage_exposure",  label: "Storage & Exposure"},
  { key: "config_clarity",    label: "Config Clarity"    },
  { key: "market_readiness",  label: "Market Readiness"  },
];

// v2 design tokens
const T = {
  ink:      "#04060a",
  ink1:     "#0d1117",
  ink2:     "#111620",
  amber:    "#f5c242",
  amberDim: "rgba(245,194,66,0.10)",
  amberBdr: "rgba(245,194,66,0.22)",
  teal:     "#5dcaa5",
  tealDim:  "rgba(93,202,165,0.10)",
  tealBdr:  "rgba(93,202,165,0.22)",
  red:      "#e24b4a",
  redDim:   "rgba(226,75,74,0.10)",
  redBdr:   "rgba(226,75,74,0.22)",
  w1:       "rgba(255,255,255,0.90)",
  w3:       "rgba(255,255,255,0.25)",
  w4:       "rgba(255,255,255,0.09)",
  border:   "rgba(255,255,255,0.08)",
};

// ─── ATI helpers ─────────────────────────────────────────────────────────────

/** v2 score bands: 96/80/60 thresholds */
function atiVerdict(total) {
  if (total >= 96) return { label: "Strong Buy",              color: T.teal,  bgColor: T.tealDim,  borderColor: T.tealBdr };
  if (total >= 80) return { label: "Buy",                     color: T.teal,  bgColor: T.tealDim,  borderColor: T.tealBdr };
  if (total >= 60) return { label: "Review — Due Diligence",  color: T.amber, bgColor: T.amberDim, borderColor: T.amberBdr };
  return            { label: "Caution — Investigate",         color: T.red,   bgColor: T.redDim,   borderColor: T.redBdr };
}

/** Dimension score → color */
function dimColor(score) {
  if (score >= 12) return T.teal;
  if (score >= 8)  return T.amber;
  return T.red;
}

/** Escape HTML entities to prevent injection */
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Validate that result contains the required numeric dimension keys */
function validateResult(r) {
  if (!r || typeof r !== "object") return false;
  return DIMS.every(({ key }) => typeof r[key] === "number" && r[key] >= 0 && r[key] <= 15);
}

// ─── Email builder ───────────────────────────────────────────────────────────

function buildEmailHtml(nReg, result) {
  const total   = DIMS.reduce((s, d) => s + (result[d.key] ?? 0), 0);
  const verdict = atiVerdict(total);

  const dimRows = DIMS.map(({ key, label }) => {
    const score  = result[key] ?? 0;
    const pct    = Math.round((score / 15) * 100);
    const color  = dimColor(score);
    const reason = esc(result.reasons?.[key] ?? "");
    return `
      <tr>
        <td style="padding:7px 0;font-size:12px;color:${T.w1};font-weight:500;">${esc(label)}</td>
        <td style="padding:7px 0;text-align:right;font-size:12px;font-weight:600;color:${color};font-variant-numeric:tabular-nums;white-space:nowrap;">${score}/15</td>
        <td style="padding:7px 0 7px 12px;">
          <div style="background:${T.w4};border-radius:3px;height:4px;width:110px;">
            <div style="background:${color};border-radius:3px;height:4px;width:${pct}%;"></div>
          </div>
        </td>
      </tr>
      ${reason ? `<tr><td colspan="3" style="padding:0 0 10px;font-size:11px;color:${T.w3};line-height:1.5;">${reason}</td></tr>` : ""}
    `;
  }).join("");

  const omvmDisplay =
    result.omvm_low && result.omvm_high
      ? `$${result.omvm_low.toLocaleString("en-US")} – $${result.omvm_high.toLocaleString("en-US")}`
      : result.omvm_low
        ? `$${result.omvm_low.toLocaleString("en-US")}`
        : "—";

  const scoreColor = total >= 80 ? T.teal : total >= 60 ? T.amber : T.red;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ATI Quick Score — ${esc(nReg)}</title>
</head>
<body style="margin:0;padding:24px 16px;background:#04060a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

  <div style="max-width:560px;margin:0 auto;background:${T.ink1};border:0.5px solid ${T.border};border-radius:14px;overflow:hidden;">

    <div style="height:2px;background:${T.amber};"></div>

    <div style="padding:24px 28px 0;background:${T.ink};border-bottom:0.5px solid ${T.border};">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
        <div style="width:28px;height:28px;background:${T.amber};border-radius:6px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg width="20" height="14" viewBox="0 0 172 106" xmlns="http://www.w3.org/2000/svg">
            <polyline points="2,98 52,8 70,98" stroke="white" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <polyline points="70,98 86,48 102,70 122,14 140,80 156,57" stroke="#1a1a1a" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
        </div>
        <span style="font-size:11px;font-weight:600;letter-spacing:0.06em;color:${T.amber};text-transform:uppercase;">ABOS MARKETSPACE</span>
      </div>
      <p style="font-size:9px;letter-spacing:0.10em;text-transform:uppercase;color:${T.w3};margin:0 0 20px;padding-bottom:18px;border-bottom:0.5px solid ${T.border};">ATI Quick Score Report · Aircraft Transparency Index</p>
    </div>

    <div style="padding:20px 28px 0;">
      <p style="font-size:22px;font-weight:500;letter-spacing:-0.03em;color:${T.w1};margin:0 0 4px;">${esc(nReg || "Aircraft Analysis")}</p>
      <p style="font-size:11px;color:${T.w3};font-family:Courier New,monospace;margin:0 0 20px;letter-spacing:0.04em;">Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
    </div>

    <div style="text-align:center;padding:4px 28px 24px;">
      <div style="display:inline-block;border:2px solid ${scoreColor};border-radius:50%;width:96px;height:96px;line-height:96px;text-align:center;background:${T.ink2};">
        <span style="font-size:36px;font-weight:500;letter-spacing:-0.04em;color:${scoreColor};line-height:1;">${total}</span>
      </div>
      <div style="margin-top:6px;font-size:10px;color:${T.w3};letter-spacing:0.06em;text-transform:uppercase;">out of 120 · ATI™</div>
      <div style="margin-top:12px;display:inline-block;padding:5px 14px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;
        background:${verdict.bgColor};border:0.5px solid ${verdict.borderColor};color:${verdict.color};">
        ${esc(verdict.label)}
      </div>
    </div>

    ${result.flash_line ? `
    <div style="margin:0 28px 20px;padding:12px 14px;background:${T.amberDim};border-left:2.5px solid ${T.amber};border-radius:4px;font-size:12px;color:${T.w1};line-height:1.6;">
      ${esc(result.flash_line)}
    </div>` : ""}

    <div style="padding:0 28px 10px;">
      <p style="font-size:8.5px;letter-spacing:0.12em;text-transform:uppercase;color:${T.w3};margin:0;border-top:0.5px solid ${T.border};padding-top:18px;">8 DIMENSIONS · 15 pts each</p>
    </div>

    <div style="padding:0 28px 24px;">
      <table style="width:100%;border-collapse:collapse;">
        ${dimRows}
      </table>
    </div>

    <div style="margin:0 28px 28px;display:table;width:calc(100% - 56px);background:${T.ink2};border:0.5px solid ${T.border};border-radius:9px;padding:14px 16px;box-sizing:border-box;">
      <div style="display:table-cell;vertical-align:top;width:50%;">
        <p style="font-size:8.5px;letter-spacing:0.10em;text-transform:uppercase;color:${T.w3};margin:0 0 4px;">OMVM Estimate</p>
        <p style="font-size:17px;font-weight:500;letter-spacing:-0.02em;color:${T.w1};margin:0;">${esc(omvmDisplay)}</p>
      </div>
      ${result.asking_price ? `
      <div style="display:table-cell;vertical-align:top;width:50%;text-align:right;">
        <p style="font-size:8.5px;letter-spacing:0.10em;text-transform:uppercase;color:${T.w3};margin:0 0 4px;">Asking Price</p>
        <p style="font-size:17px;font-weight:500;letter-spacing:-0.02em;color:${T.w1};margin:0;">$${result.asking_price.toLocaleString("en-US")}</p>
      </div>` : ""}
    </div>

    <div style="padding:16px 28px;background:${T.ink};border-top:0.5px solid ${T.border};">
      <p style="font-size:10px;color:${T.w3};margin:0;text-align:center;line-height:1.6;">
        ATI Quick Score by <strong style="color:${T.amber};">ABOS Marketspace</strong> · Automated AI estimate<br>
        <span style="font-size:9px;">Not a substitute for professional pre-buy inspection · abos-marketspace.com</span>
      </p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

// ─── Base64url encode (RFC 4648 §5) ─────────────────────────────────────────

function toBase64Url(input) {
  const bytes  = new TextEncoder().encode(input);
  let   binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ─── Handler ─────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user   = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { nReg = "", email = "", result } = body;

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      return Response.json({ error: "Valid email address is required" }, { status: 400 });
    }

    const cleanReg = String(nReg).trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 10);

    if (!validateResult(result)) {
      return Response.json({ error: "Invalid ATI result payload" }, { status: 400 });
    }

    // ── Build & send email (BEFORE deducting credits) ─────────────────────
    const htmlBody = buildEmailHtml(cleanReg || "Aircraft", result);
    const subject  = `ATI Quick Score: ${cleanReg || "Your Aircraft Analysis"}`;

    const rawMime = [
      `From: ABOS ATI <ati@aircraftbuyorsell.com>`,
      `To: ${email}`,
      `Subject: =?UTF-8?B?${toBase64Url(subject).replace(/-/g, "+").replace(/_/g, "/")}?=`,
      "MIME-Version: 1.0",
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: 7bit",
      "",
      htmlBody,
    ].join("\r\n");

    let emailSent = false;
    try {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection("gmail");
      const gmailRes = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ raw: toBase64Url(rawMime) }),
        }
      );
      if (!gmailRes.ok) {
        const errText = await gmailRes.text();
        console.error("Gmail API error:", gmailRes.status, errText);
      } else {
        emailSent = true;
      }
    } catch (gmailErr) {
      console.error("Gmail connector error:", gmailErr);
      return Response.json(
        { error: "Email delivery failed. No credits were deducted." },
        { status: 502 }
      );
    }

    // ── Deduct credits only after confirmed send ───────────────────────────
    if (emailSent) {
      try {
        await base44.asServiceRole.entities.TokenTransaction.create({
          user_email: user.email,
          type:       "consumption",
          amount:     -3,
          feature:    "ati_quick_score_unlock",
          pack:       "ATI Quick Score Unlock",
        });
      } catch (txErr) {
        console.error("TokenTransaction failed after successful send:", txErr);
      }
    }

    return Response.json({ success: true, emailSent });

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal error";
    console.error("Handler error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
});