import { useState } from "react";
import { X, Zap, Loader2, Coins, AlertTriangle } from "lucide-react";
import { useTheme } from "@/lib/useTheme";

export default function ToolInvokeModal({ tool, balance, isLoading, onConfirm, onClose }) {
  const isDark = useTheme();
  const [payloadText, setPayloadText] = useState("{}");
  const [parseError, setParseError] = useState(null);

  const modalBg = isDark ? "rgba(20,25,60,0.97)" : "#ffffff";
  const modalBorder = isDark ? "rgba(0,245,255,0.15)" : "rgba(0,0,0,0.08)";
  const textPrimary = isDark ? "#ffffff" : "#1A1814";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "#6B6560";
  const divider = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const panelBg = isDark ? "rgba(255,255,255,0.06)" : "#F7F4EF";
  const panelBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";

  const handleConfirm = () => {
    let parsed;
    try {
      parsed = JSON.parse(payloadText);
      setParseError(null);
    } catch {
      setParseError("Invalid JSON — please fix before invoking.");
      return;
    }
    onConfirm(parsed);
  };

  const newBalance = balance - tool.token_cost;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl shadow-2xl border" style={{ background: modalBg, borderColor: modalBorder }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: divider }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E8A83A]/15 border border-[#E8A83A]/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#A67C00]" />
            </div>
            <div>
              <h2 className="font-black text-sm" style={{ color: textPrimary }}>{tool.name}</h2>
              <p className="text-[11px] capitalize" style={{ color: textMuted }}>{tool.category}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: textMuted }}
            onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm leading-relaxed" style={{ color: textMuted }}>{tool.description}</p>

          {/* Token cost summary */}
          <div className="rounded-xl p-4 flex items-center justify-between border" style={{ background: panelBg, borderColor: panelBorder }}>
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#A67C00]" />
              <span className="text-sm font-bold" style={{ color: textPrimary }}>Cost: {tool.token_cost} tokens</span>
            </div>
            <span className="text-sm font-bold" style={{ color: newBalance < 0 ? "#ef4444" : textMuted }}>
              Balance after: {newBalance}
            </span>
          </div>

          {/* Payload editor */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wide mb-1.5" style={{ color: textMuted }}>
              Request Payload (JSON)
            </label>
            <textarea
              value={payloadText}
              onChange={(e) => { setPayloadText(e.target.value); setParseError(null); }}
              rows={5}
              className="w-full rounded-xl text-sm font-mono p-3 focus:outline-none focus:ring-2 focus:ring-[#E8A83A]/40 resize-none"
              style={{ background: panelBg, border: `1px solid ${panelBorder}`, color: textPrimary }}
              placeholder='{"key": "value"}'
            />
            {parseError && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {parseError}
              </p>
            )}
          </div>

          {tool.openapi_spec_url && (
            <a href={tool.openapi_spec_url} target="_blank" rel="noopener noreferrer"
              className="text-xs underline underline-offset-2 hover:opacity-80"
              style={{ color: isDark ? "#00f5ff" : "#0B2D5B" }}>
              View API Documentation →
            </a>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t" style={{ borderColor: divider }}>
          <button onClick={onClose} disabled={isLoading}
            className="flex-1 h-10 rounded-xl text-sm font-bold transition-colors"
            style={{ border: `1px solid ${panelBorder}`, color: textMuted }}
            onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={isLoading || newBalance < 0}
            className="flex-1 h-10 rounded-xl bg-[#0B2D5B] hover:bg-[#143C75] text-white text-sm font-black uppercase tracking-wide transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Invoking…</> : <><Zap className="w-4 h-4" /> Invoke</>}
          </button>
        </div>
      </div>
    </div>
  );
}