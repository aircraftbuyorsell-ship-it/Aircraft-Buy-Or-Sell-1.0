import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Bell, Plus, Pencil, Trash2, BellOff, Mail, Zap, Plane } from "lucide-react";
import AlertFormModal from "@/components/alerts/AlertFormModal";

function GoldLabel({ children }) {
  return <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">{children}</p>;
}

function CriteriaChip({ label }) {
  return (
    <span className="inline-flex items-center bg-[#F7F4EF] border border-black/[0.08] text-[#4A4845] text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">
      {label}
    </span>
  );
}

function AlertCard({ alert, onEdit, onDelete, onToggle }) {
  const chips = [];
  if (alert.make) chips.push(`Make: ${alert.make}`);
  if (alert.model) chips.push(`Model: ${alert.model}`);
  if (alert.year_min || alert.year_max) chips.push(`Year ${alert.year_min || "—"}–${alert.year_max || "—"}`);
  if (alert.max_price) chips.push(`≤ $${Number(alert.max_price).toLocaleString()}`);
  if (alert.min_ati) chips.push(`ATI ≥ ${alert.min_ati}`);
  if (chips.length === 0) chips.push("Any aircraft");

  return (
    <div className={`bg-white border rounded-2xl p-5 transition-all ${alert.active ? "border-black/[0.08]" : "border-black/[0.06] opacity-70"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${alert.active ? "bg-[#E8A83A]/15" : "bg-black/5"}`}>
              {alert.active ? <Bell className="w-3.5 h-3.5 text-[#E8A83A]" /> : <BellOff className="w-3.5 h-3.5 text-[#AAA49C]" />}
            </div>
            <h3 className="text-base font-black text-[#1A1814] uppercase tracking-tight truncate">{alert.name}</h3>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {chips.map(c => <CriteriaChip key={c} label={c} />)}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-[#6B6560]">
            <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {alert.channel || "email"}</span>
            <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-[#E8A83A]" /> {alert.matches_count || 0} matches</span>
            {alert.last_matched_at && (
              <span className="text-[10px] text-[#AAA49C]">Last: {new Date(alert.last_matched_at).toLocaleDateString()}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onToggle(alert)} title={alert.active ? "Pause" : "Activate"}
            className="p-2 text-[#6B6560] hover:text-[#0B2D5B] touch-target-compact">
            {alert.active ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          </button>
          <button onClick={() => onEdit(alert)} title="Edit"
            className="p-2 text-[#6B6560] hover:text-[#0B2D5B] touch-target-compact">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(alert)} title="Delete"
            className="p-2 text-[#6B6560] hover:text-[#C0392B] touch-target-compact">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Alerts() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: user } = useQuery({ queryKey: ["auth-me"], queryFn: () => base44.auth.me() });
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["my-alerts", user?.email],
    enabled: !!user?.email,
    queryFn: () => base44.entities.AircraftAlert.filter({ user_email: user.email }, "-created_date", 100),
  });

  const toggleMut = useMutation({
    mutationFn: (a) => base44.entities.AircraftAlert.update(a.id, { active: !a.active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-alerts"] }),
  });
  const deleteMut = useMutation({
    mutationFn: (a) => base44.entities.AircraftAlert.delete(a.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-alerts"] }),
  });

  const onDelete = (a) => {
    if (confirm(`Delete alert "${a.name}"?`)) deleteMut.mutate(a);
  };
  const onEdit = (a) => { setEditing(a); setModalOpen(true); };
  const onNew = () => { setEditing(null); setModalOpen(true); };

  const active = alerts.filter(a => a.active);
  const totalMatches = alerts.reduce((s, a) => s + (a.matches_count || 0), 0);

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-5">
        <GoldLabel>Smart Alerts · Be First To Know</GoldLabel>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1A1814] tracking-tight uppercase">Aircraft Alerts</h1>
            <p className="text-[#6B6560] text-sm mt-0.5">
              {active.length} active · {alerts.length} total · {totalMatches} matches delivered
            </p>
          </div>
          <button onClick={onNew}
            className="flex items-center gap-2 bg-[#0B2D5B] hover:bg-[#143C75] text-white uppercase font-black text-xs tracking-wider px-4 py-2.5 rounded-md transition-colors shrink-0">
            <Plus className="w-4 h-4" /> New Alert
          </button>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-8 space-y-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white border border-black/[0.05] rounded-2xl animate-pulse" />)
        ) : alerts.length === 0 ? (
          <div className="bg-white border border-black/[0.08] rounded-2xl p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-[#E8A83A]/15 flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6 text-[#E8A83A]" />
            </div>
            <h3 className="text-lg font-black text-[#1A1814] uppercase tracking-tight mt-4">No alerts yet</h3>
            <p className="text-sm text-[#6B6560] mt-1 max-w-md mx-auto">
              Set up an alert — we'll email you the moment a listing matches your criteria. Never miss the right aircraft again.
            </p>
            <button onClick={onNew}
              className="mt-5 inline-flex items-center gap-2 bg-[#0B2D5B] hover:bg-[#143C75] text-white uppercase font-black text-xs tracking-wider px-5 py-2.5 rounded-md">
              <Plus className="w-4 h-4" /> Create your first alert
            </button>
          </div>
        ) : (
          alerts.map(a => (
            <AlertCard key={a.id} alert={a}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggle={(x) => toggleMut.mutate(x)} />
          ))
        )}

        {/* How it works */}
        <div className="bg-[#0B2D5B] text-white rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Plane className="w-4 h-4 text-[#E8A83A]" />
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#E8A83A]">How alerts work</p>
          </div>
          <p className="text-sm text-white/85 leading-relaxed">
            Each time a new listing is added to ABOS, we check every active alert. If the aircraft matches your criteria
            (make, model, year range, max price, minimum ATI score), we send you an instant email with a direct link to the ATI score card.
          </p>
        </div>
      </div>

      <AlertFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => qc.invalidateQueries({ queryKey: ["my-alerts"] })}
        userEmail={user?.email}
        initial={editing}
      />
    </div>
  );
}