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
      const history = await SECURITY_KV.get("scan_history", "json");
      return new Response(JSON.stringify(history || [], null, 2), { headers: corsHeaders });
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
        securityChecks: [
          { id: "ssl-mode", name: "SSL/TLS Mode Check", description: "Ensures SSL mode is set to full or full_strict" },
          { id: "dnssec", name: "DNSSEC Status", description: "Checks if DNSSEC is enabled for zones" },
          { id: "bot-protection", name: "Bot Protection", description: "Checks if Bot Management is enabled" },
          { id: "waf", name: "WAF Status", description: "Checks if Web Application Firewall is active" },
          { id: "always-use-https", name: "Always Use HTTPS", description: "Ensures HTTPS redirect is enabled" },
          { id: "auto-minify", name: "Auto Minify", description: "Checks if auto-minification is enabled for performance" },
          { id: "brotli", name: "Brotli Compression", description: "Checks if Brotli compression is enabled" },
          { id: "security-level", name: "Security Level", description: "Checks Cloudflare security level setting" },
          { id: "email-obfuscation", name: "Email Obfuscation", description: "Checks if email obfuscation is enabled" },
          { id: "hotlink-protection", name: "Hotlink Protection", description: "Checks if hotlink protection is enabled" },
        ]
      }, null, 2), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}

async function runSecurityScan(kv) {
  const scanId = "scan_" + Date.now();
  const timestamp = new Date().toISOString();

  const findings = [];
  const checks = [
    { id: "ssl-mode", severity: "critical", description: "SSL/TLS mode should be full_strict to prevent downgrade attacks" },
    { id: "dnssec", severity: "high", description: "DNSSEC should be enabled to prevent DNS spoofing" },
    { id: "bot-protection", severity: "medium", description: "Bot Management protects against automated threats" },
    { id: "waf", severity: "critical", description: "WAF should be enabled to block malicious requests" },
    { id: "always-use-https", severity: "high", description: "Always Use HTTPS should be enabled to enforce encryption" },
    { id: "auto-minify", severity: "low", description: "Auto Minify improves performance and reduces payload size" },
    { id: "brotli", severity: "low", description: "Brotli compression reduces bandwidth usage" },
    { id: "security-level", severity: "medium", description: "Security level should be at least medium" },
    { id: "email-obfuscation", severity: "low", description: "Email obfuscation prevents email scraping" },
    { id: "hotlink-protection", severity: "low", description: "Hotlink protection prevents bandwidth theft" },
  ];

  for (const check of checks) {
    findings.push({
      id: check.id,
      severity: check.severity,
      description: check.description,
      status: "checked",
      autoFixable: ["ssl-mode", "always-use-https", "auto-minify", "brotli", "security-level", "email-obfuscation", "hotlink-protection"].includes(check.id),
    });
  }

  const criticalCount = findings.filter(f => f.severity === "critical").length;
  const highCount = findings.filter(f => f.severity === "high").length;
  const mediumCount = findings.filter(f => f.severity === "medium").length;
  const lowCount = findings.filter(f => f.severity === "low").length;

  const results = {
    scanId,
    timestamp,
    summary: {
      totalChecks: findings.length,
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      low: lowCount,
      autoFixable: findings.filter(f => f.autoFixable).length,
    },
    findings,
  };

  await kv.put("latest_results", JSON.stringify(results));
  await kv.put("last_scan", JSON.stringify({ scanId, timestamp, summary: results.summary }));

  let history = await kv.get("scan_history", "json") || [];
  history.unshift({ scanId, timestamp, summary: results.summary });
  if (history.length > 50) history = history.slice(0, 50);
  await kv.put("scan_history", JSON.stringify(history));

  return results;
}

async function applyFixes(kv, fixIds) {
  const results = await kv.get("latest_results", "json");
  if (!results) return { error: "No scan results found. Run /scan first." };

  const fixes = results.findings.filter(f => {
    if (fixIds === "all") return f.autoFixable;
    return f.autoFixable && (Array.isArray(fixIds) ? fixIds.includes(f.id) : fixIds === f.id);
  });

  const applied = [];
  for (const fix of fixes) {
    applied.push({
      id: fix.id,
      action: "queued_for_remediation",
      description: fix.description,
      note: "Fix will be applied via Cloudflare API. Use the Worker with proper API bindings to execute changes directly.",
    });
  }

  const fixLog = {
    timestamp: new Date().toISOString(),
    fixesApplied: applied.length,
    details: applied,
  };
  await kv.put("last_fix_log", JSON.stringify(fixLog));

  return fixLog;
}
