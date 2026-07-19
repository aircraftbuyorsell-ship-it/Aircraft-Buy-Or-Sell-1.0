import { Loader2, Megaphone, ChevronDown } from "lucide-react";

export default function AccountSelector({ accounts, selectedAccountId, onSelect, loading }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-white/40">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading ad accounts...
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] text-white/40"
        style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}
      >
        <Megaphone className="w-3.5 h-3.5" /> No ad accounts found.
      </div>
    );
  }

  return (
    <div className="relative">
      <select
        value={selectedAccountId}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full appearance-none pl-3 pr-9 py-2 rounded-lg text-xs outline-none cursor-pointer"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "0.5px solid rgba(255,255,255,0.10)",
          color: "white",
        }}
      >
        {accounts.map((acct) => (
          <option key={acct.account_id} value={acct.account_id} style={{ background: "#1a1a2e", color: "white" }}>
            {acct.name} ({acct.account_id})
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
    </div>
  );
}