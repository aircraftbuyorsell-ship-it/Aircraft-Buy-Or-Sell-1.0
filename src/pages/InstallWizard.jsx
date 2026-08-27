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
