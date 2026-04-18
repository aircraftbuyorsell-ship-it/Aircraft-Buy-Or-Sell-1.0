import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useMemo, useState } from "react";
import { ShieldCheck, Search, UserCheck, UserX, Mail, Crown, Calendar } from "lucide-react";
import { format } from "date-fns";

function GoldLabel({ children }) {
  return <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#D4A017]">{children}</p>;
}

function StatCard({ label, value, icon: Icon, loading }) {
  return (
    <div className="bg-white border border-black/[0.07] rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#AAA49C]">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-[#F7F4EF] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#D4A017]" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-black/5 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-black text-[#1A1814]">{value}</p>
      )}
    </div>
  );
}

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);
}

function VerifiedBadge({ verified }) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border bg-[rgba(15,122,86,0.08)] text-[#0F7A56] border-[rgba(15,122,86,0.2)]">
        <ShieldCheck className="w-2.5 h-2.5" />
        Verified
      </span>
    );
  }
  return (
    <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border bg-black/5 text-[#AAA49C] border-black/10">
      Unverified
    </span>
  );
}

function PlanBadge({ plan }) {
  const styles = {
    pro: "bg-[rgba(212,160,23,0.12)] text-[#A67C00] border-[rgba(212,160,23,0.3)]",
    enterprise: "bg-[rgba(24,95,165,0.1)] text-[#185FA5] border-[rgba(24,95,165,0.2)]",
  };
  return (
    <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border capitalize ${styles[plan] || "bg-black/5 text-[#AAA49C] border-black/10"}`}>
      {plan || "free"}
    </span>
  );
}

export default function VerifiedUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | verified | unverified

  const { data: currentUser } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => base44.entities.User.list("-created_date", 200),
    enabled: currentUser?.role === "admin",
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, verified }) => base44.entities.User.update(id, {
      verified,
      verified_at: verified ? new Date().toISOString() : null,
      verification_method: verified ? "manual" : null,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["all-users"] }),
  });

  const filtered = useMemo(() => {
    return users.filter(u => {
      if (filter === "verified" && !u.verified) return false;
      if (filter === "unverified" && u.verified) return false;
      const q = search.toLowerCase();
      if (q && !`${u.full_name} ${u.email} ${u.company_name || ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [users, search, filter]);

  const verifiedCount = users.filter(u => u.verified).length;
  const proCount = users.filter(u => u.plan === "pro" || u.plan === "enterprise").length;

  // Non-admin gate
  if (currentUser && currentUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center p-6">
        <div className="bg-white border border-black/[0.07] rounded-2xl p-8 text-center max-w-md">
          <UserX className="w-10 h-10 text-[#AAA49C] mx-auto mb-3" />
          <p className="text-base font-bold text-[#1A1814]">Přístup odepřen</p>
          <p className="text-[12px] text-[#6B6560] mt-1">Tato stránka je dostupná pouze administrátorům.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-5">
        <GoldLabel>Admin · User Management</GoldLabel>
        <h1 className="text-2xl md:text-3xl font-black text-[#1A1814] tracking-tight mt-1">Verified Users</h1>
        <p className="text-[#6B6560] text-sm mt-0.5">Správa ověřených uživatelů a jejich přístupů</p>
      </div>

      <div className="px-4 md:px-8 pb-8 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <StatCard label="Celkem uživatelů" value={users.length} icon={UserCheck} loading={isLoading} />
          <StatCard label="Ověřeno" value={verifiedCount} icon={ShieldCheck} loading={isLoading} />
          <StatCard label="Premium" value={proCount} icon={Crown} loading={isLoading} />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAA49C]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hledat jméno, e‑mail, firmu…"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-black/10 rounded-xl text-sm text-[#1A1814] placeholder-[#AAA49C] focus:outline-none focus:border-[#D4A017] transition-colors"
            />
          </div>
          <div className="flex gap-1 bg-white border border-black/10 rounded-xl p-1">
            {[
              { id: "all", label: "Vše" },
              { id: "verified", label: "Ověřeni" },
              { id: "unverified", label: "Neověřeni" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === f.id ? "bg-[#D4A017] text-white" : "text-[#6B6560] hover:text-[#1A1814]"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Users table */}
        <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-black/5 rounded animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-14 text-[#AAA49C]">
              <UserCheck className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Žádní uživatelé nenalezeni</p>
            </div>
          ) : (
            <div className="divide-y divide-black/[0.05]">
              {filtered.map((u) => (
                <div key={u.id} className="flex flex-col md:flex-row md:items-center gap-3 px-5 py-4 hover:bg-[#F7F4EF] transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#D4A017]/10 border border-[#D4A017]/20 flex items-center justify-center shrink-0">
                      <span className="text-[#D4A017] font-black text-xs">{getInitials(u.full_name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-[#1A1814] truncate">{u.full_name || "—"}</p>
                        <VerifiedBadge verified={u.verified} />
                        <PlanBadge plan={u.plan} />
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <a href={`mailto:${u.email}`} className="text-[11px] text-[#6B6560] hover:text-[#D4A017] flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 shrink-0" /> {u.email}
                        </a>
                        {u.company_name && <span className="text-[11px] text-[#AAA49C] truncate">· {u.company_name}</span>}
                      </div>
                      {u.verified_at && (
                        <p className="text-[10px] text-[#AAA49C] mt-0.5 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          Ověřeno {format(new Date(u.verified_at), "d. M. yyyy")}
                          {u.verification_method && <span>· {u.verification_method}</span>}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {u.verified ? (
                      <button
                        onClick={() => verifyMutation.mutate({ id: u.id, verified: false })}
                        disabled={verifyMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[rgba(192,57,43,0.2)] text-[11px] font-bold text-[#C0392B] hover:bg-[rgba(192,57,43,0.06)] transition-colors"
                      >
                        <UserX className="w-3 h-3" />
                        Zrušit ověření
                      </button>
                    ) : (
                      <button
                        onClick={() => verifyMutation.mutate({ id: u.id, verified: true })}
                        disabled={verifyMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F7A56] hover:bg-[#0a5e42] text-white text-[11px] font-bold transition-colors"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        Ověřit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}