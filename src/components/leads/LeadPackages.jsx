import { Zap, Users, Crown, Mail, Check } from "lucide-react";

// Volume packs for bulk buying qualified leads. Credits cost scales with volume.
export const LEAD_UNLOCK_COST = 10; // credits (= 2 tokens) per single lead

export const LEAD_PACKAGES = [
  {
    id: "single",
    name: "Single Contact",
    leads: 1,
    credits: 10,
    badge: null,
    desc: "Unlock one qualified buyer on-demand",
    icon: Mail,
    accent: "#0B2D5B",
  },
  {
    id: "starter",
    name: "Starter Pack",
    leads: 10,
    credits: 80,
    saved_pct: 20,
    badge: "Save 20%",
    desc: "10 verified contacts · best for small brokers",
    icon: Users,
    accent: "#E8A83A",
  },
  {
    id: "pro",
    name: "Pro Volume",
    leads: 50,
    credits: 350,
    saved_pct: 30,
    badge: "Most popular",
    desc: "50 verified contacts · bulk download CSV",
    icon: Zap,
    accent: "#0B2D5B",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    leads: 200,
    credits: 1200,
    saved_pct: 40,
    badge: "Save 40%",
    desc: "200 verified contacts · dedicated support",
    icon: Crown,
    accent: "#1A1814",
  },
];

export default function LeadPackages({ onSelectPack, availableLeads }) {
  return (
    <div className="bg-white border border-black/[0.07] rounded-2xl p-5 md:p-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">Buy Contact Info</p>
          <h3 className="text-lg md:text-xl font-black text-[#0B2D5B] uppercase tracking-tight">Single or Bulk Packages</h3>
          <p className="text-[12px] text-[#6B6560] mt-0.5">
            Unlock one contact when needed — or buy in volume at a discount.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold">Available pool</p>
          <p className="text-xl font-black text-[#0B2D5B]">{availableLeads}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {LEAD_PACKAGES.map(pack => {
          const Icon = pack.icon;
          const perLead = Math.round(pack.credits / pack.leads);
          return (
            <button
              key={pack.id}
              onClick={() => onSelectPack?.(pack)}
              className={`relative text-left bg-[#F7F4EF] hover:bg-white border rounded-xl p-4 transition-all ${
                pack.popular
                  ? "border-[#E8A83A] ring-2 ring-[#E8A83A]/30"
                  : "border-black/[0.08] hover:border-[#0B2D5B]"
              }`}
            >
              {pack.badge && (
                <span
                  className="absolute -top-2 left-3 text-[9px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: pack.popular ? "#E8A83A" : pack.accent,
                    color: pack.popular ? "#0B2D5B" : "white",
                  }}
                >
                  {pack.badge}
                </span>
              )}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                style={{ backgroundColor: `${pack.accent}15` }}
              >
                <Icon className="w-4 h-4" style={{ color: pack.accent }} strokeWidth={2.5} />
              </div>
              <p className="text-sm font-black text-[#1A1814] uppercase tracking-tight">{pack.name}</p>
              <p className="text-[11px] text-[#6B6560] mt-1 leading-tight">{pack.desc}</p>

              <div className="mt-3 pt-3 border-t border-black/[0.06]">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-[#0B2D5B]">{pack.credits}</span>
                  <span className="text-[10px] text-[#AAA49C] uppercase font-semibold tracking-wider">credits</span>
                </div>
                <p className="text-[10px] text-[#6B6560] mt-0.5">
                  {pack.leads} {pack.leads === 1 ? "contact" : "contacts"} · {perLead} cr/ea
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}