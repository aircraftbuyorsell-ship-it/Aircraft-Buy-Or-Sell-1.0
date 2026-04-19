import { X, Sparkles, Lock, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { toCredits, TOKEN_COSTS } from "@/lib/pricing";

// Contextual gate — shown only when user hits a real limit
// Props: open, onClose, feature, requiredTokens, userTokens, isVerified
export default function UpgradeGate({ open, onClose, feature, requiredTokens, userTokens = 0, isVerified = false }) {
  if (!open) return null;

  const gap = Math.max(0, (requiredTokens || 0) - userTokens);
  const creditsNeeded = toCredits(gap);

  const reasons = {
    ati_passport_full: "Full ATI Passport unlocks 8 scoring dimensions, OMVM valuation, AI risk analysis & PDF export.",
    bulk_import: "Bulk import lets you process ZIP / JSON / CSV files with dozens of listings in seconds.",
    deal_radar: "Deal Radar surfaces hot deals that are 8%+ below market — before anyone else sees them.",
    leads_crm: "Leads CRM tracks buyer interest and lets you export qualified leads.",
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#AAA49C] hover:text-[#1A1814] z-10">
          <X className="w-5 h-5" />
        </button>

        {/* Gold top ribbon */}
        <div className="h-1 bg-gradient-to-r from-[#D4A017] via-[#F5C842] to-[#D4A017]" />

        <div className="px-7 py-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-[rgba(212,160,23,0.12)] flex items-center justify-center">
              <Lock className="w-4 h-4 text-[#D4A017]" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#D4A017]">Premium feature</p>
          </div>

          <h2 className="text-xl font-black text-[#1A1814] leading-tight">
            {!isVerified ? "Verify your account to unlock this" : "You need more credits"}
          </h2>
          <p className="text-sm text-[#6B6560] mt-2 leading-relaxed">
            {reasons[feature] || "Unlock the full power of ABOS intelligence."}
          </p>

          {/* Token gap visualizer */}
          {isVerified && gap > 0 && (
            <div className="mt-4 p-3 bg-[#F7F4EF] border border-black/[0.07] rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold">Credits needed</p>
                <p className="text-xl font-black text-[#1A1814]">{creditsNeeded.toLocaleString()}</p>
              </div>
              <Zap className="w-6 h-6 text-[#D4A017]" />
            </div>
          )}

          {/* Social proof */}
          <div className="mt-4 flex items-center gap-2 text-[11px] text-[#6B6560]">
            <div className="flex -space-x-1.5">
              {["#D4A017", "#185FA5", "#0F7A56"].map((c, i) => (
                <div key={i} className="w-5 h-5 rounded-full border-2 border-white" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span><strong className="text-[#1A1814]">2,400+ dealers</strong> upgraded this month</span>
          </div>

          {/* CTA */}
          <div className="mt-5 flex gap-2">
            <Link
              to={!isVerified ? "/pricing?step=verify" : "/pricing"}
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 bg-[#D4A017] hover:bg-[#A67C00] text-white font-bold text-sm py-3 rounded-xl transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {!isVerified ? "Verify — $9" : "Get credits"}
            </Link>
            <button onClick={onClose} className="px-4 py-3 text-sm font-medium text-[#6B6560] hover:text-[#1A1814] transition-colors">
              Not now
            </button>
          </div>

          <p className="text-[10px] text-center text-[#AAA49C] mt-3">
            Cancel anytime · Unused credits never expire
          </p>
        </div>
      </div>
    </div>
  );
}