import { Clock, CheckCircle2, XCircle, Coins, Zap, TrendingUp, Plus } from "lucide-react";

const W1 = "rgba(255,255,255,0.90)";
const W2 = "rgba(255,255,255,0.60)";
const W3 = "rgba(255,255,255,0.35)";
const BORDER = "rgba(255,255,255,0.08)";
const AMBER = "#f5c242";
const TEAL = "#5dcaa5";
const RED = "#e24b4a";
const BLUE = "#4e8ef7";
const CARD = "rgba(255,255,255,0.04)";

const STATUS_BADGE = {
  pending:   { icon: Clock,        color: { bg: "rgba(245,194,66,0.09)", border: "rgba(245,194,66,0.22)", text: AMBER }, label: "Pending Review" },
  active:    { icon: CheckCircle2, color: { bg: "rgba(93,202,165,0.09)", border: "rgba(93,202,165,0.22)", text: TEAL }, label: "Active" },
  suspended: { icon: XCircle,      color: { bg: "rgba(226,75,74,0.09)", border: "rgba(226,75,74,0.22)", text: RED }, label: "Suspended" },
};

const TOOL_STATUS = {
  pending:   { bg: "rgba(245,194,66,0.09)", text: AMBER },
  active:    { bg: "rgba(93,202,165,0.09)", text: TEAL },
  suspended: { bg: "rgba(226,75,74,0.09)", text: RED },
  rejected:  { bg: "rgba(255,255,255,0.06)", text: W3 },
};

function StatPill({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: accent.bg, border: `0.5px solid ${accent.border}`, color: accent.text }}>
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
      <div className="rounded-2xl p-5 flex items-start justify-between flex-wrap gap-4" style={{ background: CARD, border: `0.5px solid ${BORDER}` }}>
        <div>
          <p className="text-xs mb-0.5" style={{ color: W2 }}>Developer Account</p>
          <h2 className="font-black text-xl" style={{ color: W1 }}>{account.company_name}</h2>
          {account.contact_email && <p className="text-sm mt-0.5" style={{ color: W2 }}>{account.contact_email}</p>}
        </div>
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black" style={{ background: badge.color.bg, border: `0.5px solid ${badge.color.border}`, color: badge.color.text }}>
          <BadgeIcon className="w-3.5 h-3.5" /> {badge.label}
        </span>
      </div>

      {account.status === "pending" && (
        <div className="rounded-2xl px-5 py-4 text-sm" style={{ background: "rgba(245,194,66,0.06)", border: "0.5px solid rgba(245,194,66,0.22)", color: AMBER }}>
          <strong>Application under review.</strong> You'll be able to submit tools once an admin approves your account. This usually takes 1–2 business days.
        </div>
      )}

      {account.status === "active" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatPill icon={Zap}        label="Tools"         value={tools.length}                 accent={{ bg: "rgba(78,142,247,0.06)", border: "rgba(78,142,247,0.20)", text: BLUE }} />
          <StatPill icon={TrendingUp} label="Total Calls"   value={totalCalls.toLocaleString()}  accent={{ bg: "rgba(93,202,165,0.06)", border: "rgba(93,202,165,0.20)", text: TEAL }} />
          <StatPill icon={Coins}     label="Tokens Earned"  value={totalEarned}                  accent={{ bg: "rgba(245,194,66,0.06)", border: "rgba(245,194,66,0.22)", text: AMBER }} />
          <StatPill icon={Coins}     label="Unpaid"         value={unpaid}                       accent={{ bg: "rgba(168,85,247,0.06)", border: "rgba(168,85,247,0.20)", text: "#a855f7" }} />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-sm uppercase tracking-wide" style={{ color: W1 }}>My Tools ({tools.length})</h3>
          {account.status === "active" && (
            <button onClick={onSubmitTool} className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-black transition-opacity hover:opacity-90" style={{ background: AMBER, color: "#04060a" }}>
              <Plus className="w-3.5 h-3.5" /> Submit Tool
            </button>
          )}
        </div>

        {tools.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: CARD, border: `0.5px dashed ${BORDER}` }}>
            <Zap className="w-8 h-8 mx-auto mb-2" style={{ color: W3 }} />
            <p className="font-black mb-1 text-sm" style={{ color: W1 }}>No tools yet</p>
            <p className="text-xs" style={{ color: W2 }}>
              {account.status === "active" ? "Submit your first tool to start earning." : "Tools can be submitted once your account is approved."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tools.map((tool) => {
              const ts = TOOL_STATUS[tool.status] || TOOL_STATUS.rejected;
              return (
                <div key={tool.id} className="rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3" style={{ background: CARD, border: `0.5px solid ${BORDER}` }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-black text-sm truncate" style={{ color: W1 }}>{tool.name}</p>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full" style={{ background: ts.bg, color: ts.text }}>
                        {tool.status}
                      </span>
                    </div>
                    <p className="text-xs line-clamp-1" style={{ color: W2 }}>{tool.description}</p>
                  </div>
                  <div className="flex items-center gap-4 text-right flex-shrink-0">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide" style={{ color: W3 }}>Calls</p>
                      <p className="font-black text-sm" style={{ color: W1 }}>{(tool.invocation_count || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide" style={{ color: W3 }}>Cost</p>
                      <p className="font-black text-sm" style={{ color: AMBER }}>{tool.token_cost} tk</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide" style={{ color: W3 }}>Rev share</p>
                      <p className="font-black text-sm" style={{ color: W1 }}>{tool.revenue_share_pct ?? 30}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}