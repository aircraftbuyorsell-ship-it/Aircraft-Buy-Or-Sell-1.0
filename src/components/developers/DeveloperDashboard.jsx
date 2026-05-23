import { Clock, CheckCircle2, XCircle, Coins, Zap, TrendingUp, Plus } from "lucide-react";

const STATUS_BADGE = {
  pending:   { icon: Clock,         color: "bg-amber-50 text-amber-700 border-amber-200",  label: "Pending Review" },
  active:    { icon: CheckCircle2,  color: "bg-green-50 text-green-700 border-green-200",  label: "Active" },
  suspended: { icon: XCircle,       color: "bg-red-50 text-red-700 border-red-200",        label: "Suspended" },
};

const TOOL_STATUS_BADGE = {
  pending:   "bg-amber-50 text-amber-700",
  active:    "bg-green-50 text-green-700",
  suspended: "bg-red-50 text-red-700",
  rejected:  "bg-gray-100 text-gray-500",
};

function StatPill({ icon: Icon, label, value, accent }) {
  return (
    <div className={`rounded-2xl border p-4 flex items-center gap-3 ${accent}`}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <div>
        <p className="text-[10px] uppercase tracking-wider font-bold opacity-70">{label}</p>
        <p className="text-xl font-black leading-tight">{value}</p>
      </div>
    </div>
  );
}

export default function DeveloperDashboard({ account, tools, onSubmitTool }) {
  const badge = STATUS_BADGE[account.status] || STATUS_BADGE.pending;
  const BadgeIcon = badge.icon;

  const totalCalls = tools.reduce((s, t) => s + (t.invocation_count || 0), 0);
  const totalEarned = account.total_earnings_tokens || 0;
  const unpaid = totalEarned - (account.total_paid_out_tokens || 0);

  return (
    <div className="space-y-6">
      {/* Account status card */}
      <div className="rounded-2xl border border-black/8 bg-white p-5 flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs text-[#6B6560] mb-0.5">Developer Account</p>
          <h2 className="font-black text-xl text-[#1A1814]">{account.company_name}</h2>
          {account.contact_email && <p className="text-sm text-[#6B6560] mt-0.5">{account.contact_email}</p>}
        </div>
        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border ${badge.color}`}>
          <BadgeIcon className="w-3.5 h-3.5" /> {badge.label}
        </span>
      </div>

      {account.status === "pending" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <strong>Application under review.</strong> You'll be able to submit tools once an admin approves your account. This usually takes 1–2 business days.
        </div>
      )}

      {/* Stats */}
      {account.status === "active" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatPill icon={Zap}       label="Tools"         value={tools.length}    accent="border-[#0B2D5B]/15 bg-[#0B2D5B]/5 text-[#0B2D5B]" />
          <StatPill icon={TrendingUp} label="Total Calls"  value={totalCalls.toLocaleString()} accent="border-green-200 bg-green-50 text-green-700" />
          <StatPill icon={Coins}     label="Tokens Earned" value={totalEarned}     accent="border-[#E8A83A]/30 bg-[#E8A83A]/10 text-[#A67C00]" />
          <StatPill icon={Coins}     label="Unpaid"        value={unpaid}          accent="border-purple-200 bg-purple-50 text-purple-700" />
        </div>
      )}

      {/* Tools list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-sm uppercase tracking-wide text-[#1A1814]">My Tools ({tools.length})</h3>
          {account.status === "active" && (
            <button
              onClick={onSubmitTool}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[#0B2D5B] hover:bg-[#143C75] text-white text-xs font-black"
            >
              <Plus className="w-3.5 h-3.5" /> Submit Tool
            </button>
          )}
        </div>

        {tools.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/15 bg-white p-8 text-center">
            <Zap className="w-8 h-8 text-[#AAA49C] mx-auto mb-2" />
            <p className="font-black text-[#1A1814] mb-1 text-sm">No tools yet</p>
            <p className="text-xs text-[#6B6560]">
              {account.status === "active" ? "Submit your first tool to start earning." : "Tools can be submitted once your account is approved."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tools.map((tool) => (
              <div key={tool.id} className="rounded-2xl border border-black/8 bg-white p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-black text-sm text-[#1A1814] truncate">{tool.name}</p>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${TOOL_STATUS_BADGE[tool.status] || "bg-gray-100 text-gray-500"}`}>
                      {tool.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B6560] line-clamp-1">{tool.description}</p>
                </div>
                <div className="flex items-center gap-4 text-right flex-shrink-0">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[#AAA49C]">Calls</p>
                    <p className="font-black text-sm text-[#1A1814]">{(tool.invocation_count || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[#AAA49C]">Cost</p>
                    <p className="font-black text-sm text-[#A67C00]">{tool.token_cost} tk</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[#AAA49C]">Rev share</p>
                    <p className="font-black text-sm text-[#1A1814]">{tool.revenue_share_pct ?? 30}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}