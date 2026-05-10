import { CheckCircle, AlertCircle, Clock } from "lucide-react";

export default function ComplianceTracker({
  adsb = true,
  altimeterCert = true,
  transponderCert = true,
  staticPortCert = true,
  annualInspection = false,
  registrationExpiry = null,
  airworthinessAlert = false,
}) {
  const items = [
    {
      name: "ADS-B OUT Installed",
      status: adsb ? "compliant" : "missing",
      importance: "critical",
      cost: adsb ? 0 : 3000,
      note: "Required Jan 2020+ (US), 2018 onwards (EASA)",
    },
    {
      name: "Altimeter Certificate",
      status: altimeterCert ? "compliant" : "expired",
      importance: "critical",
      cost: altimeterCert ? 0 : 500,
      note: "5-year recert cycle",
    },
    {
      name: "Transponder Cert",
      status: transponderCert ? "compliant" : "expired",
      importance: "critical",
      cost: transponderCert ? 0 : 400,
      note: "Biennial requirement",
    },
    {
      name: "Static Port Cert",
      status: staticPortCert ? "compliant" : "expired",
      importance: "critical",
      cost: staticPortCert ? 0 : 300,
      note: "Often bundled with altimeter",
    },
    {
      name: "Annual Inspection",
      status: annualInspection ? "compliant" : "overdue",
      importance: "critical",
      cost: annualInspection ? 0 : 1500,
      note: "12-month cycle from last inspection",
    },
  ];

  const compliance = items.filter(i => i.status === "compliant").length;
  const defects = items.filter(i => i.status !== "compliant");
  const totalDefectCost = defects.reduce((s, i) => s + i.cost, 0);

  const statusColor = {
    compliant: { bg: "bg-[rgba(15,122,86,0.08)]", border: "border-[rgba(15,122,86,0.2)]", text: "text-[#0F7A56]", icon: CheckCircle },
    expired: { bg: "bg-[rgba(192,57,43,0.08)]", border: "border-[rgba(192,57,43,0.2)]", text: "text-[#C0392B]", icon: AlertCircle },
    missing: { bg: "bg-[rgba(192,57,43,0.08)]", border: "border-[rgba(192,57,43,0.2)]", text: "text-[#C0392B]", icon: AlertCircle },
    overdue: { bg: "bg-[rgba(232,168,58,0.08)]", border: "border-[rgba(232,168,58,0.2)]", text: "text-[#A67C00]", icon: Clock },
  };

  return (
    <div className="bg-white border border-black/[0.07] rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-black/[0.06]">
        <div className="w-8 h-8 rounded-lg bg-[#0B2D5B] flex items-center justify-center shrink-0">
          <CheckCircle className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-[13px] font-black text-[#1A1814] uppercase tracking-tight">Compliance & Certificates</p>
          <p className="text-[10px] text-[#6B6560]">{compliance}/{items.length} compliant</p>
        </div>
      </div>

      {/* Compliance score bar */}
      <div className="h-2 bg-black/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#0F7A56] to-[#185FA5] transition-all"
          style={{ width: `${(compliance / items.length) * 100}%` }}
        />
      </div>

      {/* Items list */}
      <div className="space-y-2">
        {items.map(item => {
          const styles = statusColor[item.status];
          const Icon = styles.icon;
          return (
            <div key={item.name} className={`rounded-lg p-3 border flex items-start justify-between ${styles.bg} ${styles.border}`}>
              <div className="flex gap-2 flex-1 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${styles.text}`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-[12px] font-bold ${styles.text}`}>{item.name}</p>
                  <p className="text-[10px] text-[#6B6560] mt-0.5">{item.note}</p>
                </div>
              </div>
              {item.cost > 0 && <p className="text-[11px] font-black text-[#C0392B] shrink-0 ml-2">${item.cost}</p>}
            </div>
          );
        })}
      </div>

      {/* Defects summary */}
      {defects.length > 0 && (
        <div className="bg-[rgba(192,57,43,0.05)] border border-[rgba(192,57,43,0.15)] rounded-lg px-3 py-2.5">
          <p className="text-[11px] font-black text-[#C0392B] uppercase tracking-wide">
            {defects.length} issues to resolve — ${totalDefectCost.toLocaleString()} estimated cost
          </p>
        </div>
      )}

      {airworthinessAlert && (
        <div className="flex items-start gap-2 bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.2)] rounded-lg px-3 py-2.5 text-[#C0392B]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-[11px] font-semibold">Airworthiness certificate at risk — schedule compliance work immediately</p>
        </div>
      )}
    </div>
  );
}