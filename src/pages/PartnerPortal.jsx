import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Building2, KeyRound, Download, ShieldCheck, AlertTriangle, Loader2,
  Copy, Check, RefreshCw, FileText, BookOpen, XCircle, Clock, CreditCard, Wand2,
} from "lucide-react";
import { unwrapPortalResponse } from "@/utils/portalEnvelope";

/**
 * ABOS Partner Portal.
 *
 * Where a White-Label customer sees their license, manages API credentials
 * and gets their installer package.
 *
 * Everything shown here is resolved server-side from the signed-in user's own
 * session (see functions/tenantPortal). This page never asks for or sends a
 * tenant id it wasn't given by the server.
 */

const STATUS_STYLES = {
  active: { label: "ACTIVE", color: "#059669", bg: "rgba(5,150,105,0.10)", border: "rgba(5,150,105,0.30)" },
  pending: { label: "PENDING", color: "#d97706", bg: "rgba(217,119,6,0.10)", border: "rgba(217,119,6,0.30)" },
  suspended: { label: "SUSPENDED", color: "#dc2626", bg: "rgba(220,38,38,0.10)", border: "rgba(220,38,38,0.30)" },
  expired: { label: "EXPIRED", color: "#dc2626", bg: "rgba(220,38,38,0.10)", border: "rgba(220,38,38,0.30)" },
  revoked: { label: "REVOKED", color: "#dc2626", bg: "rgba(220,38,38,0.10)", border: "rgba(220,38,38,0.30)" },
};

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span
      className="text-xs font-bold tracking-wider px-2.5 py-1 rounded-full"
      style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}
    >
      {style.label}
    </span>
  );
}

function Card({ children, className = "" }) {
  return (
    <section
      className={`rounded-xl p-6 ${className}`}
      style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
    >
      {children}
    </section>
  );
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

/**
 * Shows a freshly issued key exactly once. It cannot be retrieved again —
 * only its hash is stored — so this makes the one-time nature unmissable
 * rather than letting a partner close the dialog and lose access.
 */
function NewKeyPanel({ apiKey, onDismiss }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Card className="border-2" >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#d97706" }} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold mb-1">Copy your new key now</h3>
          <p className="text-sm opacity-70 mb-3">
            This is the only time it will be shown. ABOS stores only a hash and cannot recover it.
            Put it in your server environment as <code className="font-mono">ABOS_TENANT_API_KEY</code> —
            never in client-side code or a committed file.
          </p>

          <div className="flex items-center gap-2 mb-3">
            <code
              className="flex-1 font-mono text-xs px-3 py-2 rounded-lg overflow-x-auto whitespace-nowrap"
              style={{ background: "var(--glass-bg-heavy)", border: "1px solid var(--glass-border)" }}
            >
              {apiKey.key}
            </code>
            <button
              type="button"
              onClick={copy}
              className="shrink-0 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5"
              style={{ background: "var(--gold-bg)", color: "var(--gold-deep)", border: "1px solid var(--glass-border)" }}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <button type="button" onClick={onDismiss} className="text-sm underline opacity-70">
            I've stored it securely
          </button>
        </div>
      </div>
    </Card>
  );
}

export default function PartnerPortal() {
  const queryClient = useQueryClient();
  const [newKey, setNewKey] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["tenantPortal"],
    queryFn: async () => {
      const response = await base44.functions.invoke("tenantPortal", { action: "overview" });
      return unwrapPortalResponse(response);
    },
  });

  const rotateKey = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke("tenantPortal", {
        action: "rotate_key",
        tenant_id: data?.tenant?.tenant_id,
      });
      return unwrapPortalResponse(response);
    },
    onSuccess: (result) => {
      setNewKey(result.api_key);
      queryClient.invalidateQueries({ queryKey: ["tenantPortal"] });
    },
  });

  const revokeKey = useMutation({
    mutationFn: async (keyId) => {
      const response = await base44.functions.invoke("tenantPortal", {
        action: "revoke_key",
        tenant_id: data?.tenant?.tenant_id,
        key_id: keyId,
      });
      return unwrapPortalResponse(response);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenantPortal"] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin opacity-50" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#dc2626" }} />
            <div>
              <h2 className="font-semibold mb-1">Couldn't load your Partner Portal</h2>
              <p className="text-sm opacity-70">{error?.message}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // A signed-in user with no tenant is a normal state (most ABOS users aren't
  // white-label partners), so it gets an explanation rather than an error.
  if (!data?.tenant) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 shrink-0 mt-0.5 opacity-50" />
            <div>
              <h2 className="font-semibold mb-1">No white-label organization on this account</h2>
              <p className="text-sm opacity-70">
                The Partner Portal is for ABOS White-Label customers. If your company has a
                licence, make sure you're signed in with the email address ABOS has on file as
                the contact — or talk to your ABOS representative.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const { tenant, license, api_keys: apiKeys = [], downloads = [], contract } = data;
  const activeKeys = apiKeys.filter((k) => k.status === "active");

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-5">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest opacity-50 mb-1">ABOS Partner Portal</p>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {tenant.logo_url && (
              <img src={tenant.logo_url} alt="" className="w-7 h-7 rounded object-contain" />
            )}
            {tenant.display_name}
          </h1>
          <p className="text-sm opacity-60 font-mono mt-0.5">{tenant.tenant_id}</p>
        </div>
        <StatusBadge status={tenant.status} />
      </header>

      {newKey && <NewKeyPanel apiKey={newKey} onDismiss={() => setNewKey(null)} />}

      {/* ── Licence ── */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 opacity-60" />
          <h2 className="font-semibold">Licence</h2>
        </div>

        {!license ? (
          <p className="text-sm opacity-70">
            No licence is attached to this organization yet. Contact your ABOS representative.
          </p>
        ) : (
          <>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
              <div>
                <dt className="text-xs opacity-50 mb-0.5">Plan</dt>
                <dd className="font-semibold capitalize">{license.plan}</dd>
              </div>
              <div>
                <dt className="text-xs opacity-50 mb-0.5">Status</dt>
                <dd><StatusBadge status={license.status} /></dd>
              </div>
              <div>
                <dt className="text-xs opacity-50 mb-0.5">Activated</dt>
                <dd>{formatDate(license.activated_at)}</dd>
              </div>
              <div>
                <dt className="text-xs opacity-50 mb-0.5">Expires</dt>
                <dd>{license.expires_at ? formatDate(license.expires_at) : "No fixed term"}</dd>
              </div>
            </dl>

            <div>
              <p className="text-xs opacity-50 mb-2">Included capabilities</p>
              <div className="flex flex-wrap gap-1.5">
                {license.allowed_capabilities.length === 0 ? (
                  <span className="text-sm opacity-60">None</span>
                ) : (
                  license.allowed_capabilities.map((capability) => (
                    <span
                      key={capability}
                      className="text-xs px-2 py-1 rounded-md font-mono"
                      style={{ background: "var(--glass-bg-heavy)", border: "1px solid var(--glass-border)" }}
                    >
                      {capability}
                    </span>
                  ))
                )}
              </div>
              <p className="text-xs opacity-50 mt-2">
                Capabilities are enforced by the ABOS API on every request, not by your integration.
              </p>
            </div>
          </>
        )}
      </Card>

      {/* ── Subscription & Payment ── */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-4 h-4 opacity-60" />
          <h2 className="font-semibold">Subscription &amp; Payment</h2>
        </div>

        {!license ? (
          <p className="text-sm opacity-70">
            No subscription is active yet. Contact your ABOS representative to set up billing.
          </p>
        ) : (
          <>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-4">
              <div>
                <dt className="text-xs opacity-50 mb-0.5">Billing Cycle</dt>
                <dd className="font-semibold capitalize">{license.billing_cycle || "Annual"}</dd>
              </div>
              <div>
                <dt className="text-xs opacity-50 mb-0.5">Amount</dt>
                <dd className="font-semibold">
                  {license.amount ? `$${(license.amount / 100).toFixed(2)}` : "Custom pricing"}
                </dd>
              </div>
              <div>
                <dt className="text-xs opacity-50 mb-0.5">Next Billing</dt>
                <dd>{license.next_billing_date ? formatDate(license.next_billing_date) : "—"}</dd>
              </div>
            </dl>

            {license.trial_end && new Date(license.trial_end) > new Date() && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-900">
                  <strong>Trial period active</strong><br />
                  Trial ends on {formatDate(license.trial_end)}
                </p>
              </div>
            )}

            {license.status === "active" && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => window.open('https://billing.stripe.com/self', '_blank')}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium"
                  style={{ background: "var(--gold-bg)", color: "var(--gold-deep)", border: "1px solid var(--glass-border)" }}
                >
                  Manage Billing
                </button>
                <button
                  type="button"
                  onClick={() => window.location.href = '/plans'}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium"
                  style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
                >
                  Change Plan
                </button>
              </div>
            )}

            {license.status !== "active" && (
              <p className="text-xs opacity-60">
                Payment management is available once your subscription is active.
              </p>
            )}
          </>
        )}
      </Card>

      {/* ── API credentials ── */}
      <Card>
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 opacity-60" />
            <h2 className="font-semibold">API credentials</h2>
          </div>
          <button
            type="button"
            onClick={() => rotateKey.mutate()}
            disabled={rotateKey.isPending || license?.status !== "active"}
            className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 disabled:opacity-40"
            style={{ background: "var(--gold-bg)", color: "var(--gold-deep)", border: "1px solid var(--glass-border)" }}
          >
            {rotateKey.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Issue new key
          </button>
        </div>

        {rotateKey.isError && (
          <p className="text-sm mb-3" style={{ color: "#dc2626" }}>{rotateKey.error?.message}</p>
        )}

        {apiKeys.length === 0 ? (
          <p className="text-sm opacity-70">
            No API keys yet. Issue one to run the installer.
          </p>
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--glass-border)" }}>
            {apiKeys.map((key) => (
              <li key={key.id} className="py-3 flex items-center justify-between gap-3 flex-wrap first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{key.name}</p>
                  <p className="text-xs opacity-50 font-mono">{key.key_prefix}</p>
                  <p className="text-xs opacity-50 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {key.last_used_at ? `Last used ${formatDate(key.last_used_at)}` : "Never used"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={key.status === "active" ? "active" : "revoked"} />
                  {key.status === "active" && (
                    <button
                      type="button"
                      onClick={() => revokeKey.mutate(key.id)}
                      disabled={revokeKey.isPending}
                      className="text-xs underline opacity-60 hover:opacity-100 disabled:opacity-30"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {activeKeys.length > 1 && (
          <p className="text-xs opacity-60 mt-3">
            More than one key is active. That's expected mid-rotation — revoke the old one once
            your new key is deployed.
          </p>
        )}
      </Card>

      {/* ── Downloads ── */}
      <Card>
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 opacity-60" />
            <h2 className="font-semibold">Toolset &amp; installer</h2>
          </div>
          {license?.status === "active" && (
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to="/install"
                className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5"
                style={{ background: "var(--gold-bg)", color: "var(--gold-deep)", border: "1px solid var(--glass-border)" }}
              >
                <Wand2 className="w-4 h-4" />
                Set up integration
              </Link>
              <button
                type="button"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = `/api/tenantCoreApi/download-installer`;
                  link.click();
                }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
              >
                <Download className="w-4 h-4" />
                Download CLI
              </button>
            </div>
          )}
        </div>

        {!license || license.status !== "active" ? (
          <p className="text-sm opacity-70">
            Installer becomes available once your licence is active.
          </p>
        ) : (
          <>
            <div className="space-y-3 mb-3">
              <div>
                <p className="font-medium text-sm">ABOS White-Label Installer v1.0.0</p>
                <p className="text-xs opacity-50 mt-0.5">
                  Self-contained CLI tool with 6 platform adapters
                </p>
              </div>
              <p className="text-xs opacity-60">
                <strong>Set up integration</strong> walks you through it in the browser: pick your
                framework, review the generated files, download them as a .zip. The{" "}
                <strong>CLI</strong> produces the same files inside an existing project directory
                via <code className="font-mono">npx abos-install</code> — use whichever suits your
                workflow. All packages are deterministically built and checksummed.
              </p>
            </div>
            {downloads.length > 0 && (
              <div className="border-t pt-3" style={{ borderColor: "var(--glass-border)" }}>
                <p className="text-xs font-semibold opacity-60 mb-2">Previous builds</p>
                <ul className="space-y-2">
                  {downloads.map((download) => (
                    <li key={download.name} className="text-xs opacity-60">
                      {download.name} ({download.version}) — {download.channel}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </Card>

      {/* ── Agreement + docs ── */}
      <div className="grid sm:grid-cols-2 gap-5">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 opacity-60" />
            <h2 className="font-semibold text-sm">Agreement</h2>
          </div>
          {contract ? (
            <dl className="text-sm space-y-1.5">
              <div className="flex justify-between gap-2">
                <dt className="opacity-50">Version</dt>
                <dd className="font-mono text-xs">{contract.agreement_version}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="opacity-50">Accepted</dt>
                <dd>{formatDate(contract.accepted_at)}</dd>
              </div>
              <div className="flex justify-between gap-2 min-w-0">
                <dt className="opacity-50 shrink-0">By</dt>
                <dd className="truncate">{contract.accepted_by_email}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm opacity-70">No acceptance recorded.</p>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 opacity-60" />
            <h2 className="font-semibold text-sm">Documentation</h2>
          </div>
          <ul className="text-sm space-y-1.5">
            <li className="opacity-70">Installation guide</li>
            <li className="opacity-70">Partner integration guide</li>
            <li className="opacity-70">Security guide</li>
          </ul>
          <p className="text-xs opacity-50 mt-3">
            All three ship inside your package, under <code className="font-mono">docs/</code>.
          </p>
        </Card>
      </div>
    </div>
  );
}
