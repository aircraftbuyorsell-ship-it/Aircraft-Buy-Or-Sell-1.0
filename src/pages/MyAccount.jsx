import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";
import {
  User, ShieldCheck, CreditCard, Plane, Handshake, ChevronRight, ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import DeleteAccountCard from "@/components/account/DeleteAccountCard";

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

function SectionHeader({ children }) {
  return <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#D4A017] mb-1">{children}</p>;
}

function HudPanel({ children, className = "" }) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{
        background: "rgba(17,24,39,0.70)",
        backdropFilter: "blur(32px) saturate(180%)",
        WebkitBackdropFilter: "blur(32px) saturate(180%)",
        border: "1px solid rgba(212,160,23,0.12)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,160,23,0.08)",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(212,160,23,0.35), transparent)", pointerEvents: "none" }} />
      {children}
    </div>
  );
}

function ATIBadge({ score }) {
  if (!score) return <span className="text-white/25 text-xs">—</span>;
  const color = score >= 90 ? "#D4A017" : score >= 72 ? "#7a00ff" : score >= 54 ? "#D4A017" : "#ff4d6d";
  const label = score >= 90 ? "EXCEPTIONAL" : score >= 75 ? "STRONG BUY" : score >= 60 ? "FAIR" : "CAUTION";
  return (
    <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}>
      {score} · {label}
    </span>
  );
}

function StatusBadge({ status }) {
  const cfg = {
    active: ["rgba(212,160,23,0.12)", "#D4A017"],
    sold: ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.45)"],
    draft: ["rgba(232,168,58,0.12)", "#D4A017"],
    closed: ["rgba(0,200,100,0.12)", "#00c864"],
    funds_secured: ["rgba(0,200,100,0.12)", "#00c864"],
    cancelled: ["rgba(255,77,109,0.12)", "#ff4d6d"],
    disputed: ["rgba(255,77,109,0.12)", "#ff4d6d"],
    contract_sent: ["rgba(122,0,255,0.12)", "#7a00ff"],
    contract_signed: ["rgba(122,0,255,0.12)", "#7a00ff"],
    inspection: ["rgba(232,168,58,0.12)", "#D4A017"],
    funds_pending: ["rgba(232,168,58,0.12)", "#D4A017"],
  };
  const [bg, color] = cfg[status] ?? ["rgba(255,255,255,0.06)", "rgba(255,255,255,0.35)"];
  return (
    <span className="text-[9px] font-black px-2 py-0.5 rounded-full capitalize"
      style={{ background: bg, border: `1px solid ${color}50`, color }}>
      {status?.replace(/_/g, " ") ?? "—"}
    </span>
  );
}

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "aircraft", label: "My Aircraft", icon: Plane },
  { id: "ati", label: "ATI History", icon: ShieldCheck },
  { id: "escrow", label: "Escrow Cases", icon: Handshake },
];

export default function MyAccount() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("profile");
  const [nameInput, setNameInput] = useState("");
  const [saved, setSaved] = useState(false);

  const { data: authUser } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
  });

  const { data: currentUser, isLoading: loadingUser } = useQuery({
    queryKey: ["account-user", authUser?.email],
    enabled: !!authUser?.email,
    queryFn: async () => {
      try {
        const users = await base44.entities.User.filter({ email: authUser.email }, "-created_date", 1);
        return users[0] || authUser;
      } catch (_) {
        return authUser;
      }
    },
  });

  useEffect(() => {
    if (authUser?.full_name) setNameInput(authUser.full_name);
  }, [authUser]);

  const { data: myListings = [], isLoading: loadingListings } = useQuery({
    queryKey: ["my-listings", currentUser?.id],
    enabled: !!currentUser?.id,
    queryFn: () => base44.entities.AircraftListing.filter({ owner: currentUser.id }, "-created_date", 100),
  });

  const { data: atiPassports = [], isLoading: loadingATI } = useQuery({
    queryKey: ["my-ati", currentUser?.id],
    enabled: !!currentUser?.id,
    queryFn: () => base44.entities.ATIPassport.filter({ triggered_by: currentUser.id }, "-created_date", 50),
  });

  const { data: escrows = [], isLoading: loadingEscrow } = useQuery({
    queryKey: ["my-escrow", authUser?.email],
    enabled: !!authUser?.email,
    staleTime: 60_000,
    queryFn: async () => {
      const [buyer, seller, broker] = await Promise.all([
        base44.entities.EscrowTransaction.filter({ buyer_email: authUser.email }, "-created_date", 50),
        base44.entities.EscrowTransaction.filter({ seller_email: authUser.email }, "-created_date", 50),
        base44.entities.EscrowTransaction.filter({ broker_email: authUser.email }, "-created_date", 50),
      ]);
      const seen = new Set();
      return [...buyer, ...seller, ...broker].filter(e => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => base44.auth.updateMe({ full_name: nameInput }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const isLoading = loadingUser || !authUser;

  // ── Listing data enriched with ATI passport if available ──────
  const listingsWithATI = myListings.map(l => ({
    ...l,
    passport: atiPassports.find(p => p.listing === l.id) || null,
  }));

  return (
    <div className="min-h-screen px-4 md:px-8 py-6">
      {/* Page header */}
      <div className="mb-6">
        <SectionHeader>My Account</SectionHeader>
        <h1 className="text-2xl font-black text-white tracking-tight">
          {authUser?.full_name || "Profile"}
        </h1>
        <p className="text-white/35 text-sm mt-0.5">{authUser?.email}</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 rounded-2xl p-1"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(212,160,23,0.08)" }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 flex-1 justify-center py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all"
            style={tab === t.id
              ? { background: "linear-gradient(135deg,rgba(212,160,23,0.18),rgba(212,160,23,0.06))", border: "1px solid rgba(212,160,23,0.35)", color: "#D4A017", boxShadow: "0 0 16px rgba(212,160,23,0.10)" }
              : { background: "transparent", border: "1px solid transparent", color: "rgba(255,255,255,0.35)" }
            }
          >
            <t.icon className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── PROFILE TAB ─────────────────────────────────────────── */}
      {tab === "profile" && (
        <div className="space-y-4 max-w-xl">
          <HudPanel>
            <div className="px-5 py-5">
              {isLoading ? (
                <div className="flex gap-4 items-center">
                  <div className="w-14 h-14 rounded-full bg-white/10 animate-pulse shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-white/10 rounded animate-pulse w-1/2" />
                    <div className="h-3 bg-white/10 rounded animate-pulse w-2/3" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg,rgba(212,160,23,0.20),rgba(122,0,255,0.15))", border: "2px solid rgba(212,160,23,0.35)" }}>
                    <span className="text-[#D4A017] font-black text-xl">{getInitials(authUser?.full_name)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-white">{authUser?.full_name || "—"}</p>
                    <p className="text-sm text-white/45">{authUser?.email}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full capitalize"
                        style={{ background: "rgba(232,168,58,0.15)", border: "1px solid rgba(232,168,58,0.35)", color: "#D4A017" }}>
                        {currentUser?.role || "user"}
                      </span>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full capitalize"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.45)" }}>
                        {authUser?.tier || "free"}
                      </span>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.20)", color: "#D4A017" }}>
                        {currentUser?.token_balance ?? 0} tokens
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </HudPanel>

          <HudPanel>
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <SectionHeader>Edit Profile</SectionHeader>
            </div>
            <div className="px-5 py-5">
              <div className="flex gap-3">
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Full name"
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(212,160,23,0.15)" }}
                />
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || !nameInput.trim()}
                  className="px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-colors shrink-0 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,rgba(212,160,23,0.22),rgba(212,160,23,0.08))", border: "1px solid rgba(212,160,23,0.35)", color: "#D4A017" }}
                >
                  {saved ? "Saved ✓" : saveMutation.isPending ? "…" : "Save"}
                </button>
              </div>
            </div>
          </HudPanel>

          <HudPanel>
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <SectionHeader>Subscription</SectionHeader>
            </div>
            <div className="px-5 py-5">
              {isLoading ? (
                <div className="h-10 bg-white/05 rounded animate-pulse" />
              ) : (authUser?.tier === "pro" || authUser?.tier === "enterprise") ? (
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#D4A017]" />
                  <div>
                    <p className="text-sm font-bold text-[#D4A017]">Pro Active</p>
                    <p className="text-[11px] text-white/40">Full access to all ABOS features</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Free Plan</p>
                    <p className="text-[12px] text-white/40 mt-0.5">Upgrade for unlimited ATI reports</p>
                  </div>
                  <Link to="/pricing"
                    className="flex items-center gap-2 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
                    style={{ background: "rgba(232,168,58,0.20)", border: "1px solid rgba(232,168,58,0.45)", color: "#D4A017" }}>
                    <CreditCard className="w-4 h-4" />
                    Upgrade
                  </Link>
                </div>
              )}
            </div>
          </HudPanel>

          {(authUser?.role !== "admin" && authUser?.role !== "super_admin") && (
            <DeleteAccountCard alreadyRequested={!!authUser?.deletion_requested_at} />
          )}
        </div>
      )}

      {/* ── MY AIRCRAFT TAB ─────────────────────────────────────── */}
      {tab === "aircraft" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/40 text-sm">{myListings.length} aircraft</p>
            <Link to="/listings"
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#D4A017] hover:opacity-70 transition-opacity">
              + Add Aircraft <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loadingListings ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
              ))}
            </div>
          ) : listingsWithATI.length === 0 ? (
            <HudPanel className="py-16 text-center">
              <Plane className="w-10 h-10 mx-auto mb-3 text-white/15" />
              <p className="text-white/30 text-sm">No aircraft listed yet.</p>
              <Link to="/listings" className="text-[#D4A017] text-[11px] font-bold mt-2 inline-block hover:opacity-70 transition-opacity">
                Go to Listings →
              </Link>
            </HudPanel>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {listingsWithATI.map(l => (
                <Link key={l.id} to={`/ati-passport/${l.id}`}>
                  <HudPanel className="p-4 h-full hover:scale-[1.01] transition-transform cursor-pointer">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <p className="text-[8px] uppercase tracking-[0.2em] text-[#D4A017] font-black">Aircraft</p>
                        <p className="text-sm font-black text-white truncate mt-0.5 leading-tight">
                          {l.year} {l.make} {l.model}
                        </p>
                        <p className="text-[10px] font-mono text-white/35 mt-0.5">{l.registration ?? "—"}</p>
                      </div>
                      <StatusBadge status={l.status} />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                      <p className="text-[11px] text-white/40">
                        {l.asking_price ? `$${l.asking_price.toLocaleString()}` : "On request"}
                      </p>
                      {l.passport ? (
                        <ATIBadge score={l.passport.ati_total} />
                      ) : (
                        <span className="text-[9px] text-white/20">No ATI</span>
                      )}
                    </div>
                  </HudPanel>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ATI HISTORY TAB ─────────────────────────────────────── */}
      {tab === "ati" && (
        <div>
          <p className="text-white/40 text-sm mb-4">{atiPassports.length} reports generated</p>

          {loadingATI ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
              ))}
            </div>
          ) : atiPassports.length === 0 ? (
            <HudPanel className="py-16 text-center">
              <ShieldCheck className="w-10 h-10 mx-auto mb-3 text-white/15" />
              <p className="text-white/30 text-sm">No ATI reports yet.</p>
              <Link to="/listings" className="text-[#D4A017] text-[11px] font-bold mt-2 inline-block hover:opacity-70">
                Generate Your First ATI →
              </Link>
            </HudPanel>
          ) : (
            <HudPanel>
              <div className="divide-y divide-white/[0.04]">
                {atiPassports.map(p => (
                  <Link key={p.id} to={`/ati-passport/${p.listing}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.03] transition-colors">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.18)" }}>
                      <ShieldCheck className="w-4 h-4 text-[#D4A017]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-white truncate">
                        {p.aircraft_label || `Listing ${p.listing?.slice(0, 8)}`}
                      </p>
                      <p className="text-[10px] text-white/35 mt-0.5">
                        {p.created_date ? format(new Date(p.created_date), "MMM d, yyyy") : "—"}
                        {p.ati_version ? ` · ${p.ati_version}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <ATIBadge score={p.ati_total} />
                      <p className="text-[9px] text-white/25">{p.score_label ?? ""}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
                  </Link>
                ))}
              </div>
            </HudPanel>
          )}
        </div>
      )}

      {/* ── ESCROW CASES TAB ────────────────────────────────────── */}
      {tab === "escrow" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/40 text-sm">{escrows.length} cases</p>
            <Link to="/escrow"
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#D4A017] hover:opacity-70 transition-opacity">
              Manage Escrow <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loadingEscrow ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
              ))}
            </div>
          ) : escrows.length === 0 ? (
            <HudPanel className="py-16 text-center">
              <Handshake className="w-10 h-10 mx-auto mb-3 text-white/15" />
              <p className="text-white/30 text-sm">No escrow cases yet.</p>
              <Link to="/escrow" className="text-[#D4A017] text-[11px] font-bold mt-2 inline-block hover:opacity-70">
                Create an Escrow Case →
              </Link>
            </HudPanel>
          ) : (
            <HudPanel>
              <div className="divide-y divide-white/[0.04]">
                {escrows.map(e => {
                  const myRole = e.buyer_email === authUser?.email ? "Buyer"
                    : e.seller_email === authUser?.email ? "Seller" : "Broker";
                  return (
                    <Link key={e.id} to="/escrow"
                      className="flex items-start gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: "rgba(232,168,58,0.10)", border: "1px solid rgba(232,168,58,0.25)" }}>
                        <Handshake className="w-4 h-4 text-[#D4A017]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[12px] font-bold text-white truncate">
                            {e.aircraft_label || `${e.buyer_name} ↔ ${e.seller_name}`}
                          </p>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background: "rgba(212,160,23,0.08)", color: "rgba(212,160,23,0.70)", border: "1px solid rgba(212,160,23,0.15)" }}>
                            {myRole}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <p className="text-[11px] font-bold text-[#D4A017]">
                            {e.sale_amount ? `$${e.sale_amount.toLocaleString()}` : "—"} {e.currency ?? "USD"}
                          </p>
                          <p className="text-[10px] text-white/30">
                            {e.created_date ? format(new Date(e.created_date), "MMM d, yyyy") : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1.5">
                        <StatusBadge status={e.status} />
                        {e.finders_fee_amount ? (
                          <p className="text-[9px] text-white/25">
                            Fee: ${e.finders_fee_amount.toLocaleString()}
                          </p>
                        ) : null}
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20 shrink-0 mt-1" />
                    </Link>
                  );
                })}
              </div>
            </HudPanel>
          )}
        </div>
      )}
    </div>
  );
}