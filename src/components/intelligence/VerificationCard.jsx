import { Link } from "react-router-dom";
import { Video, ChevronRight, CheckCircle2, AlertTriangle } from "lucide-react";
import StatusBadge from "./StatusBadge";

const STATUS_TONE = { draft: "neutral", invited: "info", in_progress: "warning", completed: "success", rejected: "danger", expired: "neutral" };
const STATUS_LABEL = { draft: "Draft", invited: "Invited", in_progress: "In Progress", completed: "Completed", rejected: "Rejected", expired: "Expired" };
const VFY = {
  verified: { tone: "success", label: "Verified", icon: CheckCircle2 },
  review_required: { tone: "warning", label: "Review Required", icon: AlertTriangle },
  rejected: { tone: "danger", label: "Rejected", icon: AlertTriangle },
};

/** ABOS Intelligence — verification session row card. */
export default function VerificationCard({ session }) {
  const vfy = VFY[session.verification_status];
  return (
    <Link to={`/ati-verify/${session.id}`} className="block">
      <div className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-muted/60 transition-colors cursor-pointer">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-gold-official/25 bg-gold-bg">
            <Video className="w-4 h-4 text-gold-official" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{session.session_code}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {session.seller_name || "—"} · {session.aircraft_registration || "—"} · {session.aircraft_type || "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <StatusBadge label={STATUS_LABEL[session.status] || "Draft"} tone={STATUS_TONE[session.status] || "neutral"} />
          {vfy && <span className="hidden sm:inline-flex"><StatusBadge label={vfy.label} tone={vfy.tone} icon={vfy.icon} /></span>}
          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
        </div>
      </div>
    </Link>
  );
}