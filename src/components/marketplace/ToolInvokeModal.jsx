import { useState } from "react";
import { X, Zap, Loader2, Coins, AlertTriangle } from "lucide-react";

export default function ToolInvokeModal({ tool, balance, isLoading, onConfirm, onClose }) {
  const [payloadText, setPayloadText] = useState("{}");
  const [parseError, setParseError] = useState(null);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-black/8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-black/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E8A83A]/15 border border-[#E8A83A]/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#A67C00]" />
            </div>
            <div>
              <h2 className="font-black text-[#1A1814] text-sm">{tool.name}</h2>
              <p className="text-[11px] text-[#6B6560] capitalize">{tool.category}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center">
            <X className="w-4 h-4 text-[#6B6560]" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-[#4A4845] leading-relaxed">{tool.description}</p>

          {/* Token cost summary */}
          <div className="rounded-xl bg-[#F7F4EF] border border-black/8 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#A67C00]" />
              <span className="text-sm font-bold text-[#1A1814]">Cost: {tool.token_cost} tokens</span>
            </div>
            <span className={`text-sm font-bold ${newBalance < 0 ? "text-red-600" : "text-[#6B6560]"}`}>
              Balance after: {newBalance}
            </span>
          </div>

          {/* Payload editor */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wide text-[#6B6560] mb-1.5">
              Request Payload (JSON)
            </label>
            <textarea
              value={payloadText}
              onChange={(e) => { setPayloadText(e.target.value); setParseError(null); }}
              rows={5}
              className="w-full rounded-xl border border-black/10 bg-[#F7F4EF] text-sm font-mono text-[#1A1814] p-3 focus:outline-none focus:ring-2 focus:ring-[#E8A83A]/40 resize-none"
              placeholder='{"key": "value"}'
            />
            {parseError && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {parseError}
              </p>
            )}
          </div>

          {tool.openapi_spec_url && (
            <a
              href={tool.openapi_spec_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#0B2D5B] underline underline-offset-2 hover:text-[#143C75]"
            >
              View API Documentation →
            </a>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-black/8">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 h-10 rounded-xl border border-black/10 text-sm font-bold text-[#6B6560] hover:bg-black/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || newBalance < 0}
            className="flex-1 h-10 rounded-xl bg-[#0B2D5B] hover:bg-[#143C75] text-white text-sm font-black uppercase tracking-wide transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Invoking…</>
            ) : (
              <><Zap className="w-4 h-4" /> Invoke</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}