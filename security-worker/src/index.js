// ABOS Security Worker - Scans and remediates Cloudflare infrastructure

addEventListener("scheduled", event => {
  event.waitUntil(runSecurityScan(SECURITY_KV));
});

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return new Uint8Array(digest);
}

// Hash both sides before comparing so neither the token contents nor its
// length leak through timing.
async function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !a || !b) return false;
  const [ha, hb] = await Promise.all([sha256(a), sha256(b)]);
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha[i] ^ hb[i];
  return diff === 0;
}

function bearerFrom(request) {
  const header = request.headers.get("Authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

const CF_API_BASE = "https://api.cloudflare.com/client/v4";

async function cfFetch(path, options = {}) {
  const res = await fetch(`${CF_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body || body.success === false) {
    const err = new Error(body?.errors?.[0]?.message || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return body.result;
}

// Pulls the live zone state each check evaluates against. Each piece is
// fetched independently so one missing entitlement (e.g. Bot Management on
// a plan that doesn't include it) doesn't take down the whole scan.
async function fetchZoneData() {
  const data = { settings: null, dnssec: null, botManagement: null, wafEntrypoint: null, errors: {} };

  try {
    const settings = await cfFetch(`/zones/${ZONE_ID}/settings`);
    data.settings = Object.fromEntries(settings.map(s => [s.id, s.value]));
  } catch (err) {
    data.errors.settings = err.message;
  }

  try {
    data.dnssec = await cfFetch(`/zones/${ZONE_ID}/dnssec`);
  } catch (err) {
    data.errors.dnssec = err.message;
  }

  try {
    data.botManagement = await cfFetch(`/zones/${ZONE_ID}/bot_management`);
  } catch (err) {
    data.errors.botManagement = err.message;
  }

  try {
    data.wafEntrypoint = await cfFetch(`/zones/${ZONE_ID}/rulesets/phases/http_request_firewall_managed/entrypoint`);
  } catch (err) {
    // A 404 here means no managed ruleset is deployed at all - that's a
    // real (non-compliant) finding, not a fetch failure.
    if (err.status === 404) {
      data.wafEntrypoint = { rules: [] };
    } else {
      data.errors.wafEntrypoint = err.message;
    }
  }

  return data;
}

const CHECKS = [
  {
    id: "ssl-mode",
    name: "SSL/TLS Mode Check",
    severity: "critical",
    description: "SSL/TLS mode should be full_strict to prevent downgrade attacks",
    autoFixable: true,
    evaluate: d => !d.settings
      ? { status: "error", detail: d.errors.settings }
      : { status: d.settings.ssl === "strict" ? "compliant" : "non_compliant", detail: `ssl=${d.settings.ssl}` },
    fix: () => cfFetch(`/zones/${ZONE_ID}/settings/ssl`, { method: "PATCH", body: JSON.stringify({ value: "strict" }) }),
  },
  {
    id: "dnssec",
    name: "DNSSEC Status",
    severity: "high",
    description: "DNSSEC should be enabled to prevent DNS spoofing",
    autoFixable: false,
    evaluate: d => !d.dnssec
      ? { status: "error", detail: d.errors.dnssec }
      : { status: d.dnssec.status === "active" ? "compliant" : "non_compliant", detail: `status=${d.dnssec.status}` },
  },
  {
    id: "bot-protection",
    name: "Bot Protection",
    severity: "medium",
    description: "Bot Management protects against automated threats",
    autoFixable: false,
    evaluate: d => {
      if (!d.botManagement) return { status: "error", detail: d.errors.botManagement };
      const bm = d.botManagement;
      // "managed_challenge" mitigates automated traffic just as much as
      // "block" does, and likely-automated deserves the same credit as
      // definitely-automated - only "allow" (or unset) means unprotected.
      const sbfmActive = ["sbfm_definitely_automated", "sbfm_likely_automated"].some(
        field => bm[field] && bm[field] !== "allow"
      );
      const compliant = Boolean(bm.fight_mode) || sbfmActive;
      return {
        status: compliant ? "compliant" : "non_compliant",
        detail: `fight_mode=${bm.fight_mode}, sbfm_definitely_automated=${bm.sbfm_definitely_automated}, sbfm_likely_automated=${bm.sbfm_likely_automated}`,
      };
    },
  },
  {
    id: "waf",
    name: "WAF Status",
    severity: "critical",
    description: "WAF should be enabled to block malicious requests",
    autoFixable: false,
    evaluate: d => {
      if (!d.wafEntrypoint) return { status: "error", detail: d.errors.wafEntrypoint };
      // "execute" rules actually run a managed ruleset; "skip"/other actions
      // are exemptions and don't block anything, so they don't count.
      const executingRules = (d.wafEntrypoint.rules || []).filter(r => r.enabled !== false && r.action === "execute");
      return { status: executingRules.length > 0 ? "compliant" : "non_compliant", detail: `executing_rules=${executingRules.length}` };
    },
  },
  {
    id: "always-use-https",
    name: "Always Use HTTPS",
    severity: "high",
    description: "Always Use HTTPS should be enabled to enforce encryption",
    autoFixable: true,
    evaluate: d => !d.settings
      ? { status: "error", detail: d.errors.settings }
      : { status: d.settings.always_use_https === "on" ? "compliant" : "non_compliant", detail: `always_use_https=${d.settings.always_use_https}` },
    fix: () => cfFetch(`/zones/${ZONE_ID}/settings/always_use_https`, { method: "PATCH", body: JSON.stringify({ value: "on" }) }),
  },
  {
    id: "auto-minify",
    name: "Auto Minify",
    severity: "low",
    description: "Auto Minify improves performance and reduces payload size",
    autoFixable: true,
    evaluate: d => {
      if (!d.settings) return { status: "error", detail: d.errors.settings };
      const m = d.settings.minify || {};
      const allOn = m.css === "on" && m.html === "on" && m.js === "on";
      return { status: allOn ? "compliant" : "non_compliant", detail: `minify=${JSON.stringify(m)}` };
    },
    fix: () => cfFetch(`/zones/${ZONE_ID}/settings/minify`, {
      method: "PATCH",
      body: JSON.stringify({ value: { css: "on", html: "on", js: "on" } }),
    }),
  },
  {
    id: "brotli",
    name: "Brotli Compression",
    severity: "low",
    description: "Brotli compression reduces bandwidth usage",
    autoFixable: true,
    evaluate: d => !d.settings
      ? { status: "error", detail: d.errors.settings }
      : { status: d.settings.brotli === "on" ? "compliant" : "non_compliant", detail: `brotli=${d.settings.brotli}` },
    fix: () => cfFetch(`/zones/${ZONE_ID}/settings/brotli`, { method: "PATCH", body: JSON.stringify({ value: "on" }) }),
  },
  {
    id: "security-level",
    name: "Security Level",
    severity: "medium",
    description: "Security level should be at least medium",
    autoFixable: true,
    evaluate: d => {
      if (!d.settings) return { status: "error", detail: d.errors.settings };
      const compliant = ["medium", "high", "under_attack"].includes(d.settings.security_level);
      return { status: compliant ? "compliant" : "non_compliant", detail: `security_level=${d.settings.security_level}` };
    },
    // Re-reads the live value first: the scan that flagged this could be
    // stale, and blindly reapplying "medium" would downgrade a zone an
    // admin has since raised to "high" or "under_attack" mid-incident.
    fix: async () => {
      const current = await cfFetch(`/zones/${ZONE_ID}/settings/security_level`);
      if (["medium", "high", "under_attack"].includes(current.value)) return current;
      return cfFetch(`/zones/${ZONE_ID}/settings/security_level`, { method: "PATCH", body: JSON.stringify({ value: "medium" }) });
    },
  },
  {
    id: "email-obfuscation",
    name: "Email Obfuscation",
    severity: "low",
    description: "Email obfuscation prevents email scraping",
    autoFixable: true,
    evaluate: d => !d.settings
      ? { status: "error", detail: d.errors.settings }
      : { status: d.settings.email_obfuscation === "on" ? "compliant" : "non_compliant", detail: `email_obfuscation=${d.settings.email_obfuscation}` },
    fix: () => cfFetch(`/zones/${ZONE_ID}/settings/email_obfuscation`, { method: "PATCH", body: JSON.stringify({ value: "on" }) }),
  },
  {
    id: "hotlink-protection",
    name: "Hotlink Protection",
    severity: "low",
    description: "Hotlink protection prevents bandwidth theft",
    autoFixable: true,
    evaluate: d => !d.settings
      ? { status: "error", detail: d.errors.settings }
      : { status: d.settings.hotlink_protection === "on" ? "compliant" : "non_compliant", detail: `hotlink_protection=${d.settings.hotlink_protection}` },
    fix: () => cfFetch(`/zones/${ZONE_ID}/settings/hotlink_protection`, { method: "PATCH", body: JSON.stringify({ value: "on" }) }),
  },
];

// Scans write one key per run instead of rewriting a shared "scan_history"
// list, so concurrent /scan calls can't clobber each other's entries.
async function recordScan(kv, scanId, timestamp, summary) {
  await kv.put(`scan_history:${scanId}`, JSON.stringify({ scanId, timestamp, summary }));
}

async function getScanHistory(kv, limit = 50) {
  const list = await kv.list({ prefix: "scan_history:" });
  const keys = list.keys.map(k => k.name).sort().reverse().slice(0, limit);
  const entries = await Promise.all(keys.map(k => kv.get(k, "json")));
  const recent = entries.filter(Boolean);

  // One-time bridge for zones that scanned before this per-key format
  // shipped: their history still lives under the old single "scan_history"
  // array key, which nothing writes to anymore. Merge it in rather than
  // let it silently disappear.
  if (recent.length < limit) {
    const legacy = (await kv.get("scan_history", "json")) || [];
    const seen = new Set(recent.map(e => e.scanId));
    for (const entry of legacy) {
      if (!seen.has(entry.scanId)) recent.push(entry);
    }
    recent.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  }

  return recent.slice(0, limit);
}

async function pruneScanHistory(kv, keep = 50) {
  const list = await kv.list({ prefix: "scan_history:" });
  const sorted = list.keys.map(k => k.name).sort();
  const excess = sorted.slice(0, Math.max(0, sorted.length - keep));
  await Promise.all(excess.map(name => kv.delete(name)));
}

async function runSecurityScan(kv) {
  // Timestamp keeps entries sortable; the random suffix stops two scans
  // started in the same millisecond from overwriting each other's history
  // key and silently losing one.
  const scanId = `scan_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  const timestamp = new Date().toISOString();
  const zoneData = await fetchZoneData();

  const findings = CHECKS.map(check => {
    const { status, detail } = check.evaluate(zoneData);
    return {
      id: check.id,
      name: check.name,
      severity: check.severity,
      description: check.description,
      status,
      detail,
      autoFixable: check.autoFixable,
    };
  });

  const bySeverity = severity => findings.filter(f => f.severity === severity && f.status === "non_compliant").length;

  const results = {
    scanId,
    timestamp,
    zoneId: ZONE_ID,
    summary: {
      totalChecks: findings.length,
      critical: bySeverity("critical"),
      high: bySeverity("high"),
      medium: bySeverity("medium"),
      low: bySeverity("low"),
      errors: findings.filter(f => f.status === "error").length,
      autoFixable: findings.filter(f => f.status === "non_compliant" && f.autoFixable).length,
    },
    findings,
  };

  await kv.put("latest_results", JSON.stringify(results));
  await kv.put("last_scan", JSON.stringify({ scanId, timestamp, summary: results.summary }));
  await recordScan(kv, scanId, timestamp, results.summary);
  await pruneScanHistory(kv);

  return results;
}

async function applyFixes(kv, fixIds) {
  const results = await kv.get("latest_results", "json");
  if (!results) return { error: "No scan results found. Run /scan first." };

  const targets = results.findings.filter(f => {
    if (!f.autoFixable || f.status !== "non_compliant") return false;
    return fixIds === "all" || (Array.isArray(fixIds) ? fixIds.includes(f.id) : fixIds === f.id);
  });

  const applied = [];
  for (const finding of targets) {
    const check = CHECKS.find(c => c.id === finding.id);
    try {
      await check.fix();
      applied.push({ id: finding.id, action: "fixed", description: finding.description });
    } catch (err) {
      applied.push({ id: finding.id, action: "failed", description: finding.description, error: err.message });
    }
  }

  const fixLog = {
    timestamp: new Date().toISOString(),
    fixesApplied: applied.filter(a => a.action === "fixed").length,
    fixesFailed: applied.filter(a => a.action === "failed").length,
    details: applied,
  };
  await kv.put("last_fix_log", JSON.stringify(fixLog));

  return fixLog;
}

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (typeof SECURITY_BEARER_TOKEN === "undefined" || !SECURITY_BEARER_TOKEN) {
    return new Response(JSON.stringify({ error: "security_worker_disabled" }), {
      status: 503,
      headers: corsHeaders,
    });
  }

  const presented = bearerFrom(request);
  if (!(await timingSafeEqual(presented, SECURITY_BEARER_TOKEN))) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "WWW-Authenticate": 'Bearer realm="abos-security"' },
    });
  }

  try {
    if (path === "/" || path === "/status") {
      const lastScan = await SECURITY_KV.get("last_scan", "json");
      return new Response(JSON.stringify({
        worker: "abos-security",
        status: "active",
        lastScan: lastScan || null,
        endpoints: [
          "GET  /status          - Worker status and last scan info",
          "GET  /scan            - Run a full security scan",
          "GET  /scan/results    - Get latest scan results",
          "GET  /scan/history    - Get scan history",
          "POST /fix             - Apply recommended fixes",
          "GET  /checks          - List all security checks",
        ]
      }, null, 2), { headers: corsHeaders });
    }

    if (path === "/scan") {
      const results = await runSecurityScan(SECURITY_KV);
      return new Response(JSON.stringify({ scanCompleted: true, results }, null, 2), { headers: corsHeaders });
    }

    if (path === "/scan/results") {
      const results = await SECURITY_KV.get("latest_results", "json");
      return new Response(JSON.stringify(results || { message: "No scan results yet. Run /scan first." }, null, 2), { headers: corsHeaders });
    }

    if (path === "/scan/history") {
      const history = await getScanHistory(SECURITY_KV);
      return new Response(JSON.stringify(history, null, 2), { headers: corsHeaders });
    }

    if (path === "/fix") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Use POST to apply fixes" }), { status: 405, headers: corsHeaders });
      }
      const body = await request.json().catch(() => ({}));
      const fixes = await applyFixes(SECURITY_KV, body.fixIds || "all");
      if (fixes.error) {
        return new Response(JSON.stringify({ fixesApplied: fixes }, null, 2), { status: 409, headers: corsHeaders });
      }
      return new Response(JSON.stringify({ fixesApplied: fixes }, null, 2), { headers: corsHeaders });
    }

    if (path === "/checks") {
      return new Response(JSON.stringify({
        securityChecks: CHECKS.map(c => ({ id: c.id, name: c.name, description: c.description })),
      }, null, 2), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}
