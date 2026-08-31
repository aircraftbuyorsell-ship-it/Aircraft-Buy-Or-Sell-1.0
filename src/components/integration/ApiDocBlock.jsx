import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function ApiDocBlock({ title, description, code }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
        <div>
          <p className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.90)" }}>{title}</p>
          {description && <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>{description}</p>}
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold touch-target-compact"
          style={{ background: "rgba(245,194,66,0.09)", border: "0.5px solid rgba(245,194,66,0.22)", color: "#f5c242" }}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 text-xs overflow-x-auto" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "'Courier Prime', monospace", margin: 0 }}>
        {code}
      </pre>
    </div>
  );
}