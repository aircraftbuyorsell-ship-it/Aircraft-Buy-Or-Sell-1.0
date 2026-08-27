import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft, ArrowRight, Check, Copy, Download, FileCode2, Loader2,
  ShieldCheck, Terminal, AlertTriangle, PackageOpen,
} from "lucide-react";

import { PLATFORMS, PLATFORM_LABELS, BROWSER_ONLY_PLATFORMS } from "../../installer/lib/platform.mjs";
import { buildArtifacts } from "../../installer/lib/generate.mjs";
import { createZipBlob } from "@/utils/browserZip";
import { PLATFORM_ORDER } from "@/utils/installPlatforms";

/**
 * ABOS Install Wizard.
 *
 * The browser-side counterpart to `npx abos-install`. It reuses the installer's
 * own generate.mjs/platform.mjs — both are dependency-free pure modules — so the
 * files produced here are byte-identical to the CLI's. Fixing a bug in the
 * adapter template fixes it in both places; there is no second implementation
 * to keep in sync.
 *
 * No credential ever reaches these files. buildArtifacts() refuses to emit an
 * artifact containing a tenant key, and the key belongs in the environment
 * variable the generated .env template documents.
 */

const DEFAULT_BASE_URL = "https://aircraftbuyorsell.com";

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

function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="px-2.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 shrink-0"
      style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function FileBlock({ file }) {
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--glass-border)" }}>
      <div
        className="flex items-center justify-between gap-3 px-3 py-2"
        style={{ background: "var(--glass-bg)" }}
      >
        <code className="text-xs font-mono truncate">{file.path}</code>
        <CopyButton text={file.contents} />
      </div>
      <pre className="text-[11px] leading-relaxed p-3 overflow-x-auto max-h-64 m-0">
        <code>{file.contents}</code>
      </pre>
    </div>
  );
}

function StepDots({ step, total }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Step ${step} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="h-1.5 rounded-full transition-all"
          style={{
            width: i + 1 === step ? 20 : 8,
            background: i + 1 <= step ? "var(--gold-deep, #b8860b)" : "var(--glass-border)",
          }}
        />
      ))}
    </div>
  );
}

export default function InstallWizard() {
  const [step, setStep] = useState(1);
  const [platform, setPlatform] = useState(PLATFORMS.NEXT_APP);
  const [adapterUrl, setAdapterUrl] = useState("/api/abos");
  const [zipError, setZipError] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["install-wizard-overview"],
    queryFn: async () => {
      const response = await base44.functions.invoke("tenantPortal", { action: "overview" });
      return response.data;
    },
    staleTime: 60000,
  });

  const tenant = data?.tenant || null;
  const license = data?.license || null;
  const features = license?.features || [];
  const isBrowserOnly = BROWSER_ONLY_PLATFORMS.includes(platform);

  // Regenerated whenever the tenant, plan or chosen platform changes. Failures
  // surface as a message rather than a blank screen: buildArtifacts throws by
  // design if anything credential-shaped reached a file.
  const { files, buildError } = useMemo(() => {
    if (!tenant) return { files: [], buildError: "" };
    try {
      return {
        files: buildArtifacts({
          tenant,
          license,
          features,
          branding: tenant.branding || {},
          platform,
          baseUrl: DEFAULT_BASE_URL,
          adapterUrl: adapterUrl || "/api/abos",
        }),
        buildError: "",
      };
    } catch (err) {
      return { files: [], buildError: err?.message || "Could not generate the integration files." };
    }
  }, [tenant, license, features, platform, adapterUrl]);

  const downloadZip = async () => {
    setZipError("");
    try {
      const blob = createZipBlob(files.map((f) => ({ path: f.path, contents: f.contents })));
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `abos-integration-${tenant?.tenant_id || "kit"}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Revoke on the next tick so the download has certainly started.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setZipError(err?.message || "Could not build the archive.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin opacity-50" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Card>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#d97706" }} />
            <div>
              <h1 className="font-semibold mb-1">No white-label organization on this account</h1>
              <p className="text-sm opacity-70 mb-4">
                The install wizard configures an existing ABOS white-label tenant. Once your
                licence is active it will appear here.
              </p>
              <Link to="/partner-portal" className="text-sm font-medium underline">
                Back to Partner Portal
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const licenceInactive = license?.status !== "active";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link
            to="/partner-portal"
            className="text-xs opacity-60 inline-flex items-center gap-1.5 mb-2 hover:opacity-100"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Partner Portal
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Install ABOS</h1>
          <p className="text-sm opacity-60 mt-1">
            {tenant.display_name || tenant.tenant_id} · {license?.plan || "no plan"}
          </p>
        </div>
        <StepDots step={step} total={3} />
      </div>

      {licenceInactive && (
        <Card>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#d97706" }} />
            <div>
              <p className="font-semibold text-sm mb-1">Licence is not active</p>
              <p className="text-xs opacity-70">
                You can preview the integration files, but the API will reject requests until the
                licence is active.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ── Step 1: platform ── */}
      {step === 1 && (
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <FileCode2 className="w-4 h-4 opacity-60" />
            <h2 className="font-semibold">Where does ABOS need to run?</h2>
          </div>
          <p className="text-sm opacity-60 mb-5">
            Pick the framework your application already uses. The adapter is generated for it.
          </p>

          <div className="grid sm:grid-cols-2 gap-2 mb-5">
            {PLATFORM_ORDER.map((id) => {
              const selected = platform === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPlatform(id)}
                  className="flex items-center justify-between gap-2 rounded-lg px-3.5 py-3 text-left text-sm transition-colors"
                  style={{
                    background: selected ? "var(--gold-bg, rgba(184,134,11,0.10))" : "var(--glass-bg)",
                    border: `1px solid ${selected ? "var(--gold-deep, #b8860b)" : "var(--glass-border)"}`,
                  }}
                >
                  <span className="font-medium">{PLATFORM_LABELS[id]}</span>
                  {selected && <Check className="w-4 h-4 shrink-0" />}
                </button>
              );
            })}
          </div>

          {isBrowserOnly && (
            <div
              className="rounded-lg p-3 mb-5 flex items-start gap-2.5"
              style={{ background: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.30)" }}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#d97706" }} />
              <p className="text-xs leading-relaxed">
                A pure single-page app has nowhere safe to keep your tenant key — anything shipped
                to the browser is readable by anyone. Host the generated adapter on a server or
                serverless function and have the SPA call that instead.
              </p>
            </div>
          )}

          <label className="block">
            <span className="text-xs font-semibold opacity-60">Adapter route</span>
            <input
              value={adapterUrl}
              onChange={(e) => setAdapterUrl(e.target.value)}
              placeholder="/api/abos"
              className="mt-1.5 w-full rounded-lg px-3 py-2 text-sm font-mono outline-none"
              style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
            />
            <span className="text-xs opacity-50 mt-1.5 block">
              The path your app will expose. Keep the default unless it collides with an existing route.
            </span>
          </label>

          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-1.5"
              style={{ background: "var(--gold-bg)", color: "var(--gold-deep)", border: "1px solid var(--glass-border)" }}
            >
              Generate files
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </Card>
      )}

      {/* ── Step 2: review ── */}
      {step === 2 && (
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <PackageOpen className="w-4 h-4 opacity-60" />
            <h2 className="font-semibold">Your integration files</h2>
          </div>
          <p className="text-sm opacity-60 mb-4">
            Generated for {PLATFORM_LABELS[platform]}. Add them to your project — copy each one, or
            download the archive.
          </p>

          <div
            className="rounded-lg p-3 mb-4 flex items-start gap-2.5"
            style={{ background: "rgba(5,150,105,0.07)", border: "1px solid rgba(5,150,105,0.25)" }}
          >
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#059669" }} />
            <p className="text-xs leading-relaxed">
              These files carry no secret and are safe to commit. Your tenant API key goes in the
              environment variable documented in <code>.env.abos.example</code>, read only by your
              server.
            </p>
          </div>

          {buildError ? (
            <div
              className="rounded-lg p-3 flex items-start gap-2.5"
              style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.30)" }}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#dc2626" }} />
              <p className="text-xs">{buildError}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <FileBlock key={file.path} file={file} />
              ))}
            </div>
          )}

          {zipError && <p className="text-xs mt-3" style={{ color: "#dc2626" }}>{zipError}</p>}

          <div className="flex justify-between gap-3 mt-6 flex-wrap">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-1.5"
              style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={downloadZip}
                disabled={!files.length}
                className="px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
              >
                <Download className="w-4 h-4" />
                Download .zip
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!files.length}
                className="px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
                style={{ background: "var(--gold-bg)", color: "var(--gold-deep)", border: "1px solid var(--glass-border)" }}
              >
                Finish setup
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>
      )}
