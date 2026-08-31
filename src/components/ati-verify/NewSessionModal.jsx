import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { X, Video, CheckCircle2 } from "lucide-react";

function randomCode() {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `ATI-VFY-${n}`;
}

export default function NewSessionModal({ open, onClose }) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    seller_name: "",
    seller_email: "",
    aircraft_registration: "",
    aircraft_type: "",
    aircraft_serial: "",
    notes: "",
  });

  if (!open) return null;

  const handleCreate = async () => {
    if (!form.seller_name && !form.seller_email) {
      setError("Please enter at least seller name or email.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const me = await base44.auth.me();
      const code = randomCode();
      const inviteUrl = `${window.location.origin}/ati-verify/join/${code}`;
      const session = await base44.entities.ATIVerifySession.create({
        session_code: code,
        broker_email: me.email,
        broker_name: me.full_name || me.email,
        ...form,
        invite_link: inviteUrl,
        status: "invited",
      });
      setCreated(session);
      queryClient.invalidateQueries({ queryKey: ["ati-verify-sessions"] });
    } catch (e) {
      setError(e.message || "Failed to create session");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#11162b] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="text-sm font-black text-white uppercase tracking-wider">
            {created ? "Session Created" : "New Verification Session"}
          </h2>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {created ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-4 bg-[#1a2a1a] border border-[#22c55e]/20 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-[#4ade80]" />
              <div>
                <p className="text-sm font-bold text-[#4ade80]">Session Ready</p>
                <p className="text-[11px] text-white/50">{created.session_code}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Invite Link</p>
              <div className="bg-[#0c0f1a] border border-white/[0.06] rounded-lg px-3 py-2.5 text-[11px] font-mono text-[#60a5fa] break-all">
                {created.invite_link}
              </div>
            </div>
            <button onClick={onClose}
              className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-sm py-2.5 rounded-lg transition-colors">
              Done
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Seller Name</label>
                <input value={form.seller_name} onChange={e => setForm({ ...form, seller_name: e.target.value })}
                  className="w-full bg-[#0c0f1a] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white mt-1 outline-none focus:border-[#2563eb]/40" />
              </div>
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Seller Email</label>
                <input value={form.seller_email} onChange={e => setForm({ ...form, seller_email: e.target.value })}
                  className="w-full bg-[#0c0f1a] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white mt-1 outline-none focus:border-[#2563eb]/40" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Registration</label>
                <input value={form.aircraft_registration} onChange={e => setForm({ ...form, aircraft_registration: e.target.value })}
                  placeholder="N123AB, OK-ABC..."
                  className="w-full bg-[#0c0f1a] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white mt-1 outline-none focus:border-[#2563eb]/40 placeholder:text-white/15" />
              </div>
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Aircraft Type</label>
                <input value={form.aircraft_type} onChange={e => setForm({ ...form, aircraft_type: e.target.value })}
                  placeholder="Cessna 172S"
                  className="w-full bg-[#0c0f1a] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white mt-1 outline-none focus:border-[#2563eb]/40 placeholder:text-white/15" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Serial Number (MSN)</label>
              <input value={form.aircraft_serial} onChange={e => setForm({ ...form, aircraft_serial: e.target.value })}
                className="w-full bg-[#0c0f1a] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white mt-1 outline-none focus:border-[#2563eb]/40" />
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                className="w-full bg-[#0c0f1a] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white mt-1 outline-none focus:border-[#2563eb]/40 resize-none" />
            </div>
            {error && <p className="text-[12px] text-[#f87171]">{error}</p>}
            <div className="flex gap-2 pt-2">
              <button onClick={onClose} className="flex-1 bg-transparent border border-white/[0.08] hover:bg-white/[0.03] text-white/60 font-bold text-sm py-2.5 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={creating}
                className="flex-1 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-40 text-white font-bold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                <Video className="w-4 h-4" />
                {creating ? "Creating..." : "Create Session"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}