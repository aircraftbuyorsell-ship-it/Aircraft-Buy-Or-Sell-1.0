import { X, Sparkles, Lock, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { toCredits } from "@/lib/pricing";

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
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md relative overflow-hidden animate-in zoom-in-95 duration-200 border-2 border-[#0B2D5B]">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#AAA49C] hover:text-[#0B2D5B] z-10">
          <X className="w-5 h-5" />
        </button>

        {/* Navy + Amber top ribbon */}
        <div className="h-1.5 bg-gradient-to-r from-[#0B2D5B] via-[#E8A83A] to-[#0B2D5B]" />

        <div className="px-7 py-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-md bg-[#0B2D5B] flex items-center justify-center">
              <Lock className="w-4 h-4 text-[#E8A83A]" strokeWidth={2.5} />
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#E8A83A]">Premium feature</p>
          </div>

          <h2 className="text-xl font-black text-[#1A1814] leading-tight uppercase tracking-tight">
            {!isVerified ? "Verify your account to unlock this" : "You need more credits"}
          </h2>
          <p className="text-sm text-[#4A4845] mt-2 leading-relaxed">
            {reasons[feature] || "Unlock the full power of ABOS intelligence."}
          </p>

          {/* Token gap visualizer */}
          {isVerified && gap > 0 && (
            <div className="mt-4 p-3 bg-[#0B2D5B] rounded-md flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-[#E8A83A] font-bold">Credits needed</p>
                <p className="text-xl font-black text-white">{creditsNeeded.toLocaleString()}</p>
              </div>
              <Zap className="w-6 h-6 text-[#E8A83A]" />
            </div>
          )}

          {/* Social proof */}
          <div className="mt-4 flex items-center gap-2 text-[11px] text-[#6B6560]">
            <div className="flex -space-x-1.5">
              {["#0B2D5B", "#E8A83A", "#0F7A56"].map((c, i) => (
                <div key={i} className="w-5 h-5 rounded-full border-2 border-white" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span><strong className="text-[#0B2D5B]">2,400+ dealers</strong> upgraded this month</span>
          </div>

          {/* CTA */}
          <div className="mt-5 flex gap-2">
            <Link
              to={!isVerified ? "/pricing?step=verify" : "/pricing"}
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 bg-[#0B2D5B] hover:bg-[#143C75] text-white font-black uppercase tracking-wider text-sm py-3 rounded-md transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {!isVerified ? "Verify — $9" : "Get credits"}
            </Link>
            <button onClick={onClose} className="px-4 py-3 text-sm font-bold text-[#6B6560] hover:text-[#0B2D5B] uppercase tracking-wider transition-colors">
              Not now
            </button>
          </div>

          <p className="text-[10px] text-center text-[#AAA49C] mt-3 uppercase tracking-wider">
            Cancel anytime · Unused credits never expire
          </p>
        </div>
      </div>
    </div>
  );
}